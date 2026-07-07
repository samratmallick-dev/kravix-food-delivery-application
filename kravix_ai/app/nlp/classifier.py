import re
from typing import Tuple
from rapidfuzz import process, fuzz
from app.models.schemas import Intent

class HybridIntentClassifier:
    
    PHRASES = {
        Intent.ORDER_TRACKING: [
            "where is my order", "track my food", "order status", 
            "has the rider left", "why is my food late", "eta", 
            "is my order preparing", "when will it arrive", 
            "delivery update", "order tracking", "rider location",
            "kothay amar khabar", "khabar asche na keno", "track"
        ],
        Intent.ORDER_CANCELLATION: [
            "cancel my order", "stop order", "i want to cancel", 
            "cancel kore dao", "order batil korbo", "mistake order"
        ],
        Intent.RIDER_EARNINGS: [
            "my earnings", "how much did i make", "payout status",
            "earning", "taka", "income", "track my earning", "money"
        ],
        Intent.FOOD_SEARCH: [
            "find biryani", "suggest food", "im hungry", "craving pizza",
            "bhalo khabar", "khide peyeche", "healthy diet"
        ],
        Intent.HELP: [
            "help me", "how to use", "customer support", "tips",
            "sahajjo korun"
        ]
    }
    
    def __init__(self):
        self._corpus = {}
        for intent, phrases in self.PHRASES.items():
            for phrase in phrases:
                self._corpus[phrase] = intent
                
    def classify(self, text: str) -> Tuple[Intent, float]:
        text_lower = text.lower().strip()
        
        if re.search(r"\btrack(?!.*\bearning\b)(?!.*\bpayout\b)\b", text_lower):
            return Intent.ORDER_TRACKING, 1.0
            
        match = process.extractOne(
            text_lower, 
            self._corpus.keys(), 
            scorer=fuzz.partial_ratio
        )
        
        if match:
            best_phrase, score, _ = match
            if score >= 75:
                matched_intent = self._corpus[best_phrase]
                return matched_intent, score / 100.0
                
        return Intent.UNKNOWN, 0.0

classifier = HybridIntentClassifier()
