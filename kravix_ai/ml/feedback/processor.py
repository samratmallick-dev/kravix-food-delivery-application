import json

class FeedbackProcessor:
    
    @staticmethod
    def process(feedback_entry: dict, dataset_path: str = "ml/dataset/kravix_training.jsonl"):
        if feedback_entry.get("feedback") != 1:
            print("Negative feedback logged for manual review.")
            return
            
        prompt = f"### System:\nYou are Kravix Assistant. User Role: {feedback_entry.get('role', 'customer')}\nContext: {{}}\n\n### Instruction:\n{feedback_entry.get('message')}\n\n### Response:\n{feedback_entry.get('reply')}"
        
        with open(dataset_path, "a", encoding="utf-8") as f:
            f.write(json.dumps({"text": prompt}) + "\n")
            
        print("Positive feedback successfully merged into training dataset.")
