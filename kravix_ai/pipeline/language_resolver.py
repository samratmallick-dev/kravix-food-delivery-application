import re
from typing import Optional

class LanguageResolver:
    @staticmethod
    def detect_language(message: str, preferred_lang: Optional[str] = "en") -> str:
        """Detects the language of the query based on character sets and keywords."""
        msg_lower = message.lower()
        
        if re.search(r"[\u0980-\u09ff]", message):
            return "bn"
            
        banglish_keywords = [
            "ami", "tumi", "kobe", "kabe", "kore", "hobe", "khabar", "khabo", 
            "order", "kothay", "kothai", "koto", "ashbe", "baje", "dokan", 
            "resturante", "chi", "na", "ha", "dao", "daao", "ranna", "kichu"
        ]
        
        for word in banglish_keywords:
            if re.search(rf"\b{word}\b", msg_lower):
                return "bn_latin"
                
        if preferred_lang:
            p_lang = preferred_lang.lower()
            if "bn" in p_lang or "bengali" in p_lang:
                return "bn_latin"
                
        return "en"
