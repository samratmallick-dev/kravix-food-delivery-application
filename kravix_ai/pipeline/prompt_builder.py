from typing import List, Dict, Any
from .knowledge_retriever import RetrievalResult

class PromptBuilder:
    @staticmethod
    def build_system_prompt(base_template: str, role: str, lang: str, 
                            retrieved_chunks: List[RetrievalResult], 
                            dynamic_context_str: str) -> str:
        """
        Constructs the final system prompt by injecting the top retrieved 
        knowledge passages and dynamic context.
        """
        
        knowledge_str = ""
        if retrieved_chunks:
            knowledge_str = "\n[Retrieved Knowledge Base]\n"
            for i, chunk in enumerate(retrieved_chunks):
                knowledge_str += f"--- Source: {chunk.source_dataset} (Confidence: {chunk.score:.2f}) ---\n"
                knowledge_str += f"{chunk.content.strip()}\n"
        else:
            knowledge_str = "\n[Retrieved Knowledge Base]\nNo directly relevant static knowledge found.\n"
            
        final_prompt = base_template.format(role=role, preferred_language=lang)
        final_prompt += knowledge_str
        final_prompt += dynamic_context_str
        
        final_prompt += "\n\nCRITICAL INSTRUCTION: Your response MUST be fully grounded in the [Retrieved Knowledge Base] and [Dynamic Context]. Do NOT invent, hallucinate, or assume any information that is not explicitly provided above. If the required information is missing, state clearly that it is unavailable.\n"
        
        return final_prompt
