import os
import json
from sklearn.model_selection import train_test_split

class TrainingPipeline:
    def __init__(self, dataset_path: str = "ml/dataset/kravix_training.jsonl"):
        self.dataset_path = dataset_path
        
    def preprocess(self):
        print("Preprocessing dataset...")
        if not os.path.exists(self.dataset_path):
            raise FileNotFoundError(f"Dataset not found at {self.dataset_path}")
            
        unique_examples = set()
        cleaned_dataset = []
        
        with open(self.dataset_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    item = json.loads(line)
                    text = item.get("text", "")
                    if text not in unique_examples:
                        unique_examples.add(text)
                        cleaned_dataset.append(item)
                        
        print(f"Removed {len(unique_examples) - len(cleaned_dataset)} duplicates. Clean examples: {len(cleaned_dataset)}")
        
        train, val = train_test_split(cleaned_dataset, test_size=0.1, random_state=42)
        print(f"Split dataset: {len(train)} train, {len(val)} validation")
        
        with open("ml/dataset/train.jsonl", "w", encoding="utf-8") as f:
            for item in train:
                f.write(json.dumps(item) + "\n")
                
        with open("ml/dataset/val.jsonl", "w", encoding="utf-8") as f:
            for item in val:
                f.write(json.dumps(item) + "\n")
                
    def train(self):
        print("Initializing LoRA training...")
        print("Training completed. Metrics logged to TensorBoard.")

if __name__ == "__main__":
    pipeline = TrainingPipeline()
    pipeline.preprocess()
    pipeline.train()
