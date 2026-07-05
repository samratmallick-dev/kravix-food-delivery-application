# Kravix AI — Feedback & Retraining Pipeline

## What "automatically learns" would actually require

Online learning (updating model weights on every new message) on an 8B parameter model like Llama 3 requires:

- **~40 GB+ VRAM** for a single gradient update pass
- A **CUDA GPU** and full ML stack (PyTorch, bitsandbytes, PEFT)
- **Minutes of compute per batch** — not milliseconds per message

Render free tier (and most CPU-only environments) have none of these. The AI service runs in **MOCK mode** on such environments.

---

## What the system actually does

```
User chats → thumbs up/down feedback stored in MongoDB (ai_feedback collection)
                    ↓  (manual offline step — needs a GPU machine)
bash retrain.sh
  → python dataset_generator.py --export-feedback   # pulls positive feedback into kravix_training.jsonl
  → python train_lora.py                            # fine-tunes LoRA on GPU
                    ↓
New LoRA checkpoint saved to ./kravix_model_lora → redeploy api_server.py
```

The model does **not** update itself at runtime. Feedback is collected passively and incorporated only when you manually run the retraining pipeline on a GPU machine.

---

## Running the retraining pipeline

### Prerequisites
- Machine with CUDA GPU (≥ 24 GB VRAM recommended for 4-bit quantized Llama 3 8B)
- Python venv activated with `requirements.txt` (full ML stack, not `requirements.prod.txt`)
- `MONGODB_URI` environment variable pointing to your `kravix_db` instance

### Steps

```bash
cd kravix_ai
source venv/bin/activate          # Windows: .\venv\Scripts\activate

export MONGODB_URI="mongodb+srv://..."

bash retrain.sh
```

This will:
1. Pull all feedback records with `feedback >= 1` from `kravix_db.ai_feedback`
2. Append them to `kravix_training.jsonl`
3. Run `train_lora.py` to fine-tune and save a new LoRA checkpoint to `./kravix_model_lora`

After training, redeploy `api_server.py` with `MOCK_MODE=false` on a GPU-enabled host to serve the updated weights.

---

## Feedback collection (runtime, CPU-safe)

The `/feedback` endpoint in `api_server.py` is the only runtime component. It requires:

```env
ENABLE_FEEDBACK=true
MONGODB_URI=mongodb+srv://...
```

It stores `{ message, reply, role, feedback: 1 | -1 }` documents — no model weights are touched.
