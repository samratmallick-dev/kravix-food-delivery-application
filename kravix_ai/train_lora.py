import torch
from datasets import load_dataset
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments
)
from trl import SFTTrainer

MODEL_ID = "unsloth/llama-3-8b-bnb-4bit" 
DATASET_PATH = "kravix_training.jsonl"
OUTPUT_DIR = "./kravix_model_lora"
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=False
)

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
tokenizer.pad_token = tokenizer.eos_token

model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    quantization_config=bnb_config,
    device_map="auto"
)

model = prepare_model_for_kbit_training(model)

peft_config = LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"]
)
model = get_peft_model(model, peft_config)
model.print_trainable_parameters()

dataset = load_dataset("json", data_files=DATASET_PATH, split="train")

def format_instruction(sample):
    return f"""### System:
You are the Kravix Assistant, a friendly, concise, food-delivery domain expert for Kravix.
Role interacting with: {sample['userRole']}

### Instruction:
{sample['instruction']}

### Response:
{sample['output']}"""

training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    logging_steps=10,
    max_steps=200, 
    fp16=True,
    optim="paged_adamw_8bit",
    save_strategy="steps",
    save_steps=50,
)

trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    peft_config=peft_config,
    max_seq_length=512,
    tokenizer=tokenizer,
    formatting_func=lambda x: [format_instruction(item) for item in zip(x["instruction"], x["output"], x["userRole"])],
    args=training_args,
)

def formatting_prompts_func(example):
    output_texts = []
    for i in range(len(example['instruction'])):
        text = f"### System:\nYou are the Kravix Assistant, a friendly, concise, food-delivery domain expert for Kravix.\nRole interacting with: {example['userRole'][i]}\n\n### Instruction:\n{example['instruction'][i]}\n\n### Response:\n{example['output'][i]}"
        output_texts.append(text)
    return output_texts

trainer.formatting_func = formatting_prompts_func

print("Starting LoRA training...")
trainer.train()

print("Saving final model...")
trainer.model.save_pretrained(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)
print("Training complete! Model saved to", OUTPUT_DIR)
