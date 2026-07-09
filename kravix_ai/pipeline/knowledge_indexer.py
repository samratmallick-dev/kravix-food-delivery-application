import math
import re
from collections import defaultdict, Counter
from typing import List, Dict, Any, Set, Tuple

from .alias_resolver import AliasResolver

def tokenize(text: str) -> List[str]:
    if not text:
        return []
    text = text.lower()
    return [w for w in re.split(r'\W+', text) if w]

class Document:
    def __init__(self, doc_id: str, dataset: str, content: str, roles: List[str], aliases: List[str]):
        self.doc_id = doc_id
        self.dataset = dataset
        self.content = content
        self.roles = roles
        self.aliases = aliases
        
        self.tokens = tokenize(content)
        self.token_freqs = Counter(self.tokens)
        self.doc_len = len(self.tokens)

class KnowledgeIndexer:
    def __init__(self):
        self.documents: Dict[str, Document] = {}
        self.inverted_index: Dict[str, Dict[str, int]] = defaultdict(dict)
        self.doc_freq: Dict[str, int] = defaultdict(int)
        
        self.alias_map: Dict[str, Set[str]] = defaultdict(set)
        
        self.k1 = 1.5
        self.b = 0.75
        self.avgdl = 0.0
        self.N = 0

    def build_index(self, datasets: Dict[str, Dict[str, Any]]):
        """Builds a full index from provided datasets."""
        self.documents.clear()
        self.inverted_index.clear()
        self.doc_freq.clear()
        self.alias_map.clear()
        
        total_len = 0
        
        for dataset_name, dataset in datasets.items():
            for entry in dataset.get("data", []):
                doc_id = f"{dataset_name}::{entry['id']}"
                content = entry.get("content", "")
                roles = entry.get("roles_allowed", [])
                
                raw_aliases = entry.get("aliases", [])
                expanded_aliases = AliasResolver.generate_aliases(raw_aliases)
                
                doc = Document(doc_id, dataset_name, content, roles, expanded_aliases)
                self.documents[doc_id] = doc
                total_len += doc.doc_len
                
                for token, freq in doc.token_freqs.items():
                    self.inverted_index[token][doc_id] = freq
                    self.doc_freq[token] += 1
                    
                for alias in expanded_aliases:
                    self.alias_map[alias].add(doc_id)
                    
        self.N = len(self.documents)
        self.avgdl = total_len / self.N if self.N > 0 else 0

    def update_dataset(self, dataset_name: str, dataset: Dict[str, Any]):
        """Incrementally update index for a single dataset."""
        docs_to_remove = [doc_id for doc_id, doc in self.documents.items() if doc.dataset == dataset_name]
        
        for doc_id in docs_to_remove:
            doc = self.documents[doc_id]
            for token, freq in doc.token_freqs.items():
                del self.inverted_index[token][doc_id]
                self.doc_freq[token] -= 1
                if self.doc_freq[token] <= 0:
                    del self.doc_freq[token]
            
            for alias in doc.aliases:
                if doc_id in self.alias_map[alias]:
                    self.alias_map[alias].remove(doc_id)
                    if not self.alias_map[alias]:
                        del self.alias_map[alias]
                        
            del self.documents[doc_id]
            
        for entry in dataset.get("data", []):
            doc_id = f"{dataset_name}::{entry['id']}"
            content = entry.get("content", "")
            roles = entry.get("roles_allowed", [])
            raw_aliases = entry.get("aliases", [])
            expanded_aliases = AliasResolver.generate_aliases(raw_aliases)
            
            doc = Document(doc_id, dataset_name, content, roles, expanded_aliases)
            self.documents[doc_id] = doc
            
            for token, freq in doc.token_freqs.items():
                self.inverted_index[token][doc_id] = freq
                self.doc_freq[token] += 1
                
            for alias in expanded_aliases:
                self.alias_map[alias].add(doc_id)
                
        self.N = len(self.documents)
        self.avgdl = sum(d.doc_len for d in self.documents.values()) / self.N if self.N > 0 else 0

    def score_bm25(self, query_tokens: List[str], doc_id: str) -> float:
        """Calculate BM25 score for a document given query tokens."""
        if doc_id not in self.documents:
            return 0.0
            
        doc = self.documents[doc_id]
        score = 0.0
        
        for token in query_tokens:
            if token not in self.inverted_index or doc_id not in self.inverted_index[token]:
                continue
                
            df = self.doc_freq[token]
            idf = math.log(1 + (self.N - df + 0.5) / (df + 0.5))
            
            tf = self.inverted_index[token][doc_id]
            numerator = tf * (self.k1 + 1)
            denominator = tf + self.k1 * (1 - self.b + self.b * (doc.doc_len / self.avgdl))
            
            score += idf * (numerator / denominator)
            
        return score
