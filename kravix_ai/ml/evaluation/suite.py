import json
from app.nlp.classifier import classifier
from app.nlp.extractor import extractor

class EvaluationSuite:
    def __init__(self, test_cases_path: str = "kravix_ai/evaluation_test_cases.json"):
        self.test_cases = [
            {"input": "track my order", "expected_intent": "ORDER_TRACKING"},
            {"input": "where is the biryani", "expected_intent": "ORDER_TRACKING"},
            {"input": "i want to cancel", "expected_intent": "ORDER_CANCELLATION"}
        ]
        
    def evaluate_intents(self):
        print("Running Intent Evaluation...")
        correct = 0
        total = len(self.test_cases)
        
        for case in self.test_cases:
            intent, conf = classifier.classify(case["input"])
            if intent.value == case["expected_intent"]:
                correct += 1
                
        accuracy = (correct / total) * 100 if total > 0 else 0
        print(f"Intent Accuracy: {accuracy:.2f}% ({correct}/{total})")

if __name__ == "__main__":
    suite = EvaluationSuite()
    suite.evaluate_intents()
