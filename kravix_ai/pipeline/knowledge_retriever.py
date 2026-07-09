import re
from typing import List, Dict, Any, Optional
from functools import lru_cache
from difflib import SequenceMatcher

from .knowledge_indexer import KnowledgeIndexer, tokenize
from .permission_filter import PermissionFilter

class RetrievalResult:
    def __init__(self, doc_id: str, content: str, score: float, 
                 matched_aliases: List[str], matched_language: str, source_dataset: str):
        self.doc_id = doc_id
        self.content = content
        self.score = score
        self.matched_aliases = matched_aliases
        self.matched_language = matched_language
        self.source_dataset = source_dataset

    def to_dict(self):
        return {
            "doc_id": self.doc_id,
            "content": self.content[:200] + "..." if len(self.content) > 200 else self.content,
            "score": round(self.score, 4),
            "matched_aliases": self.matched_aliases,
            "matched_language": self.matched_language,
            "source_dataset": self.source_dataset
        }

class KnowledgeRetriever:
    def __init__(self, indexer: KnowledgeIndexer):
        self.indexer = indexer

    def _fuzzy_score(self, query: str, alias: str) -> float:
        return SequenceMatcher(None, query, alias).ratio()

    
    def __init__(self, indexer: KnowledgeIndexer):
        self.indexer = indexer
        self._cache = {}

    def clear_cache(self):
        self._cache.clear()

    def retrieve(self, query: str, role: str, language: str, top_k: int = 3, min_confidence: float = 0.2) -> List[RetrievalResult]:
        cache_key = f"{query}::{role}::{language}"
        if cache_key in self._cache:
            return self._cache[cache_key]
            
        query_lower = query.lower().strip()
        query_tokens = tokenize(query_lower)
        
        doc_scores: Dict[str, float] = {}
        alias_matches: Dict[str, List[str]] = {}
        
        for doc_id, doc in self.indexer.documents.items():
            if not PermissionFilter.is_allowed(role, doc.roles):
                continue
                
            bm25_score = self.indexer.score_bm25(query_tokens, doc_id)
            norm_bm25 = min(bm25_score / 5.0, 1.0)
            
            best_alias_score = 0.0
            best_fuzzy_score = 0.0
            matched_al = []
            
            for alias in doc.aliases:
                if alias == query_lower or alias in query_tokens:
                    best_alias_score = 1.0
                    matched_al.append(alias)
                else:
                    f_score = self._fuzzy_score(query_lower, alias)
                    if f_score > best_fuzzy_score:
                        best_fuzzy_score = f_score
                        if f_score > 0.8:
                            matched_al.append(alias)
                            
            role_relevance = 1.0 if role.lower() in [r.lower() for r in doc.roles] else 0.5
            context_relevance = 1.0 if bm25_score > 0 or best_alias_score > 0 else 0.0
            
            final_score = (0.35 * norm_bm25) + (0.25 * best_alias_score) + (0.15 * best_fuzzy_score) + (0.15 * role_relevance) + (0.10 * context_relevance)
            
            if final_score >= min_confidence:
                doc_scores[doc_id] = final_score
                alias_matches[doc_id] = matched_al
                
        sorted_docs = sorted(doc_scores.items(), key=lambda x: x[1], reverse=True)
        
        results = []
        for doc_id, score in sorted_docs[:top_k]:
            doc = self.indexer.documents[doc_id]
            res = RetrievalResult(
                doc_id=doc_id,
                content=doc.content,
                score=score,
                matched_aliases=alias_matches.get(doc_id, []),
                matched_language=language,
                source_dataset=doc.dataset
            )
            results.append(res)
            
        self._cache[cache_key] = results
        return results
