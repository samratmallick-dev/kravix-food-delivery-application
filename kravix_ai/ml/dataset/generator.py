import json
import random
import os

class DatasetGenerator:
    
    def __init__(self, output_path: str = "ml/dataset/kravix_training.jsonl"):
        self.output_path = output_path
        self.dataset = []
        
    def add_example(self, role: str, context: dict, user: str, assistant: str):
        prompt = f"### System:\nYou are Kravix Assistant. User Role: {role}\nContext: {json.dumps(context)}\n\n### Instruction:\n{user}\n\n### Response:\n{assistant}"
        self.dataset.append({"text": prompt})
        
    def generate_customer_set(self, count: int = 5000):
        intents = [
            ("where is my order", "Your order is on the way!"),
            ("kothay amar khabar", "Your order is arriving soon."),
            ("cancel my food", "You can cancel it from the My Orders page.")
        ]
        for _ in range(count):
            q, a = random.choice(intents)
            self.add_example("customer", {"orders": [{"id": "ORD123"}]}, q, a)
            
    def generate_negative_set(self, count: int = 1000):
        intents = [
            ("who is the president", "I am Kravix AI, designed specifically to help with the Kravix food delivery platform. For general knowledge questions, please consult another service."),
            ("tell me a joke", "I'm here to help you order delicious food, not tell jokes!")
        ]
        for _ in range(count):
            q, a = random.choice(intents)
            self.add_example("customer", {}, q, a)

    def generate(self):
        print(f"Generating dataset at {self.output_path}...")
        self.generate_customer_set(10000)
        self.generate_negative_set(2000)
        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)
        with open(self.output_path, "w", encoding="utf-8") as f:
            for item in self.dataset:
                f.write(json.dumps(item) + "\n")
        print(f"Generated {len(self.dataset)} examples.")

if __name__ == "__main__":
    generator = DatasetGenerator()
    generator.generate()
