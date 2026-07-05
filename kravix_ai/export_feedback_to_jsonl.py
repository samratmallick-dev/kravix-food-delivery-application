"""
export_feedback_to_jsonl.py

Pulls positively-rated (thumbs-up) conversations from MongoDB and merges
them into kravix_training.jsonl alongside the synthetic templates.

Run manually or via CI before re-running train_lora.py:
    python export_feedback_to_jsonl.py

Requires:
    MONGODB_URI env var pointing to the same DB used by api_server.py
    pymongo>=4.6.1

IMPORTANT: This does NOT retrain the model automatically. After running
this script you must re-run train_lora.py to produce a new LoRA checkpoint.
The new checkpoint only improves production responses once:
  1. ML dependencies (torch, transformers, peft) are added back, AND
  2. The service is deployed on a machine with GPU access.
Until then, the rule-based fallback is all users will see.
"""

import json
import os
import sys
from pymongo import MongoClient

MONGODB_URI = os.environ.get("MONGODB_URI", "")
OUTPUT_FILE = os.environ.get("TRAINING_FILE", "kravix_training.jsonl")
MIN_FEEDBACK = 1  # only thumbs-up records


def fetch_positive_feedback(col) -> list[dict]:
    cursor = col.find(
        {"feedback": MIN_FEEDBACK},
        {"_id": 0, "message": 1, "reply": 1, "role": 1},
    )
    records = []
    for doc in cursor:
        if doc.get("message") and doc.get("reply"):
            records.append({
                "instruction": doc["message"],
                "output": doc["reply"],
                "category": "UserFeedback",
                "userRole": doc.get("role", "customer"),
                "intent": "feedback_approved",
            })
    return records


def load_existing(path: str) -> list[dict]:
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def main():
    if not MONGODB_URI:
        print("ERROR: MONGODB_URI is not set.", file=sys.stderr)
        sys.exit(1)

    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    col = client["kravix"]["ai_feedback"]

    new_records = fetch_positive_feedback(col)
    print(f"Fetched {len(new_records)} positively-rated records from MongoDB.")

    existing = load_existing(OUTPUT_FILE)
    existing_keys = {(r["instruction"], r["output"]) for r in existing}

    merged = list(existing)
    added = 0
    for rec in new_records:
        key = (rec["instruction"], rec["output"])
        if key not in existing_keys:
            merged.append(rec)
            existing_keys.add(key)
            added += 1

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for item in merged:
            f.write(json.dumps(item) + "\n")

    print(f"Added {added} new records. Total: {len(merged)} in {OUTPUT_FILE}.")
    print("Next step: run train_lora.py to produce a new LoRA checkpoint.")


if __name__ == "__main__":
    main()
