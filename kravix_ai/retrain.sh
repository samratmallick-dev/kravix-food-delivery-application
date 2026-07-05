set -e

if [ -z "$MONGODB_URI" ]; then
  echo "ERROR: MONGODB_URI is not set."
  exit 1
fi

echo "Step 1: Exporting positive feedback from MongoDB into kravix_training.jsonl..."
python dataset_generator.py --export-feedback

echo "Step 2: Running LoRA fine-tuning (requires CUDA GPU, ~40GB VRAM)..."
python train_lora.py

echo "Done. New LoRA checkpoint saved to ./kravix_model_lora"
echo "Redeploy api_server.py to serve the updated weights."
