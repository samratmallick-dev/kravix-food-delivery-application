from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import random

try:
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel
    if torch.cuda.is_available():
        ML_AVAILABLE = True
    else:
        ML_AVAILABLE = False
        print("WARNING: CUDA is not available. 4-bit quantized models require a GPU. Running in MOCK mode.")
except ImportError:
    ML_AVAILABLE = False
    print("WARNING: ML libraries (torch, transformers) not found. Running in MOCK mode.")

app = FastAPI(title="Kravix Local AI Microservice")

BASE_MODEL_ID = "unsloth/llama-3-8b-bnb-4bit"
LORA_MODEL_PATH = "./kravix_model_lora"

if ML_AVAILABLE:
    print("Loading Tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_ID)

    print("Loading Base Model...")
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL_ID,
        device_map="cpu",
        torch_dtype=torch.float32
    )

    print("Applying LoRA Weights...")
    try:
        model = PeftModel.from_pretrained(base_model, LORA_MODEL_PATH)
        print("LoRA weights loaded successfully.")
    except Exception as e:
        print(f"Warning: Could not load LoRA weights ({e}). Running base model only.")
        model = base_model

class ChatRequest(BaseModel):
    message: str
    userId: str
    role: str
    contextData: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    reply: str
    intent_confidence: Optional[float] = 1.0

session_memory = {}

def build_system_prompt(role: str, contextData: Dict[str, Any]) -> str:
    prompt = f"You are the Kravix Assistant, a friendly, concise, food-delivery domain expert. You are talking to a {role}.\n"
    
    if contextData:
        if "orders" in contextData:
            prompt += "Recent Orders Context:\n"
            for order in contextData["orders"]:
                prompt += f"- ID: {order['id']}, Status: {order['status']}\n"
                
        if "menu_items" in contextData:
            prompt += "Relevant Menu Items Context:\n"
            for item in contextData["menu_items"]:
                prompt += f"- {item['name']}: ₹{item['price']} ({'Available' if item['available'] else 'Out of Stock'})\n"
                
    prompt += "\nRules:\n- Never fabricate order IDs or names; use placeholders like [ORDER_ID] if not in context.\n- Keep responses under 150 words.\n"
    return prompt

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    try:
        if req.userId not in session_memory:
            session_memory[req.userId] = []
            
        history = session_memory[req.userId]
        history.append({"role": "user", "content": req.message})
        
        if len(history) > 5:
            history = history[-5:]

        system_prompt = build_system_prompt(req.role, req.contextData or {})
        
        full_prompt = f"### System:\n{system_prompt}\n\n"
        for msg in history:
            prefix = "### Instruction:\n" if msg["role"] == "user" else "### Response:\n"
            full_prompt += f"{prefix}{msg['content']}\n\n"
            
        full_prompt += "### Response:\n"

        if ML_AVAILABLE:
            inputs = tokenizer(full_prompt, return_tensors="pt").to(model.device)
            
            outputs = model.generate(
                **inputs,
                max_new_tokens=300,
                temperature=0.4,
                top_p=0.9,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )

            # 4. Decode
            input_length = inputs.input_ids.shape[1]
            generated_tokens = outputs[0][input_length:]
            reply = tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()

            fallback_keywords = ["I don't know", "I am an AI"]
            if any(keyword in reply for keyword in fallback_keywords) or len(reply) < 5:
                reply = "Let me connect you with our support team."
        else:
            msg_lower = req.message.lower()
            menu_items = req.contextData.get('menu_items', []) if req.contextData else []
            
            if "hi" in msg_lower or "hello" in msg_lower:
                reply = "Hello! Welcome to Kravix. How can I help you with your food order today?"
            elif "suggest" in msg_lower or "food" in msg_lower or "menu" in msg_lower:
                if menu_items:
                    item_names = [f"{item['name']} (₹{item['price']})" for item in menu_items[:3]]
                    reply = f"Here are some great options: {', '.join(item_names)}."
                else:
                    reply = "I'd love to suggest some food, but it looks like there are no restaurants or menu items available right now!"
            elif "biriyani" in msg_lower or "biryani" in msg_lower:
                reply = "Our Biryani is a customer favorite! It comes with raita and salad. Would you like to add it to your cart?"
            elif "price" in msg_lower or "500" in msg_lower:
                if menu_items:
                    affordable = [item['name'] for item in menu_items if item.get('price', 1000) <= 500]
                    if affordable:
                        reply = f"Here are some items under ₹500: {', '.join(affordable)}."
                    else:
                        reply = "We don't have items under ₹500 right now, sorry!"
                else:
                    reply = "We have many delicious options under ₹500, but I need a restaurant menu selected first."
            else:
                reply = f"Got it! You said: '{req.message}'. (This is a mock response since the AI model is disabled)"


        history.append({"role": "assistant", "content": reply})
        session_memory[req.userId] = history

        return ChatResponse(reply=reply)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_server:app", host="0.0.0.0", port=5500, reload=True)
