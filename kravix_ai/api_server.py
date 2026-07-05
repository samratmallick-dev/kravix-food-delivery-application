from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import time
import logging
import re
from pymongo import MongoClient
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("uvicorn.error")

MOCK_MODE = os.environ.get("MOCK_MODE", "false").lower() in ("true", "1", "yes")

if MOCK_MODE:
    ML_AVAILABLE = False
    logger.info("MOCK_MODE environment variable is set. Running in MOCK mode.")
else:
    try:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from peft import PeftModel
        if torch.cuda.is_available():
            ML_AVAILABLE = True
        else:
            ML_AVAILABLE = False
            logger.info("CUDA is not available. 4-bit quantized models require a GPU. Running in MOCK mode.")
    except ImportError:
        ML_AVAILABLE = False
        logger.debug("ML libraries (torch, transformers) not found. Running in MOCK mode.")

app = FastAPI(title="Kravix Local AI Microservice")

BASE_MODEL_ID = "unsloth/llama-3-8b-bnb-4bit"
LORA_MODEL_PATH = "./kravix_model_lora"

if ML_AVAILABLE:
    logger.info("Loading Tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_ID)

    logger.info("Loading Base Model...")
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL_ID,
        device_map="cpu",
        torch_dtype=torch.float32
    )

    logger.info("Applying LoRA Weights...")
    try:
        model = PeftModel.from_pretrained(base_model, LORA_MODEL_PATH)
        logger.info("LoRA weights loaded successfully.")
    except Exception as e:
        logger.warning(f"Could not load LoRA weights ({e}). Running base model only.")
        model = base_model

class ChatRequest(BaseModel):
    message: str
    userId: str
    role: str
    contextData: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    reply: str
    intent_confidence: Optional[float] = 1.0

SESSION_TTL = int(os.environ.get("SESSION_TTL_SECONDS", "1800"))
_session_store: Dict[str, Dict] = {}

def _evict_expired():
    now = time.time()
    expired = [k for k, v in _session_store.items() if now - v["ts"] > SESSION_TTL]
    for k in expired:
        del _session_store[k]

def get_history(user_id: str) -> List[Dict]:
    _evict_expired()
    if user_id not in _session_store:
        _session_store[user_id] = {"history": [], "ts": time.time()}
    return _session_store[user_id]["history"]

def save_history(user_id: str, history: List[Dict]):
    _session_store[user_id] = {"history": history, "ts": time.time()}

_INJECTION_PATTERN = re.compile(
    r"(###\s*(system|instruction|response)|ignore (previous|above|all)|forget (previous|instructions)|you are now|act as|jailbreak)",
    re.IGNORECASE,
)

def sanitize_input(text: str) -> str:
    """Strip prompt-injection attempts from user input."""
    sanitized = _INJECTION_PATTERN.sub("[removed]", text)
    return sanitized[:1000]

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


ENABLE_FEEDBACK = os.environ.get("ENABLE_FEEDBACK", "false").lower() in ("true", "1", "yes")
_feedback_col = None

if ENABLE_FEEDBACK:
    _mongo_url = os.environ.get("MONGODB_URI", "")
    if _mongo_url:
        try:
            _mongo_client = MongoClient(_mongo_url, serverSelectionTimeoutMS=3000)
            _feedback_col = _mongo_client[os.environ.get("DB_NAME", "kravix_db")]["ai_feedback"]
            logger.info("Feedback collection connected.")
        except Exception as _e:
            logger.warning("Could not connect to MongoDB for feedback: %s", _e)
    else:
        logger.warning("ENABLE_FEEDBACK=true but MONGODB_URI is not set — feedback disabled.")


class FeedbackRequest(BaseModel):
    messageId: str
    message: str
    reply: str
    role: str
    feedback: int 


@app.post("/feedback", status_code=204)
async def feedback_endpoint(req: FeedbackRequest):
    if not ENABLE_FEEDBACK or _feedback_col is None:
        return
    if req.feedback not in (1, -1):
        raise HTTPException(status_code=400, detail="feedback must be 1 or -1")
    try:
        _feedback_col.insert_one({
            "messageId": req.messageId,
            "message": req.message[:500],
            "reply": req.reply[:500],
            "role": req.role,
            "feedback": req.feedback,
            "timestamp": datetime.now(timezone.utc),
        })
    except Exception as e:
        logger.error("feedback_endpoint DB error: %s", type(e).__name__)


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    try:
        safe_message = sanitize_input(req.message)

        history = get_history(req.userId)
        history.append({"role": "user", "content": safe_message})

        if len(history) > 5:
            history = history[-5:]

        system_prompt = build_system_prompt(req.role, req.contextData or {})
        
        full_prompt = f"### System:\n{system_prompt}\n\n"
        for msg in history:
            prefix = "### Instruction:\n" if msg["role"] == "user" else "### Response:\n"
            full_prompt += f"{prefix}{sanitize_input(msg['content'])}\n\n"
            
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

            input_length = inputs.input_ids.shape[1]
            generated_tokens = outputs[0][input_length:]
            reply = tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()

            fallback_keywords = [
                "I don't know", "I am an AI", "As an AI", "I cannot",
                "I'm not able", "I do not have", "I apologize",
            ]
            if any(kw.lower() in reply.lower() for kw in fallback_keywords) or len(reply) < 5:
                reply = "Let me connect you with our support team."
        else:
            msg_lower = safe_message.lower()
            role = req.role
            menu_items = req.contextData.get('menu_items', []) if req.contextData else []
            orders = req.contextData.get('orders', []) if req.contextData else []

            BENGALI_MAP = {
                "bhat": "rice", "dal": "lentils", "mach": "fish", "maach": "fish",
                "roti": "bread", "tarkari": "vegetables", "mishti": "sweets",
                "doi": "yogurt", "chingri": "prawns", "kosha": "dry curry",
                "mangsho": "mutton", "murgi": "chicken", "aloo": "potato",
                "begun": "eggplant", "shorshe": "mustard",
            }
            normalized = msg_lower
            detected_bengali = []
            for bn, en in BENGALI_MAP.items():
                if bn in normalized:
                    normalized = normalized.replace(bn, en)
                    detected_bengali.append(f"{bn} -> {en}")

            STATUS_MESSAGES = {
                "placed": "Your order has been placed and is waiting for the restaurant to accept it. ⏳",
                "accepted": "Great news! The restaurant has accepted your order. 👍",
                "preparing": "Your food is being prepared right now! 🍳",
                "ready_for_rider": "Your order is ready and waiting for a rider to pick it up. 🛵",
                "picked_up": "A rider has picked up your order and is on the way! 🏍️",
                "out_for_delivery": "Your order is out for delivery and almost there! 📍",
                "delivered": "Your order has been delivered. Enjoy your meal! 🎉",
                "cancelled": "This order was cancelled. You can reorder from 'My Orders'.",
            }

            if any(w in msg_lower for w in ["hi", "hello", "hey", "hola", "howdy"]):
                reply = "Hello! Welcome to Kravix 🍛 How can I help you today?"
            elif any(p in msg_lower for p in ["how are you", "how r you", "how are u", "how r u", "wassup", "what's up", "whats up"]):
                reply = "I'm doing great, thanks for asking! Ready to help you find something delicious. What are you craving?"
            elif any(w in msg_lower for w in ["thank", "thanks", "thx", "ty", "appreciate"]):
                reply = "You're welcome! Let me know if there's anything else I can help you with. 😊"
            elif any(w in msg_lower for w in ["bye", "goodbye", "see you", "later", "cya"]):
                reply = "Goodbye! Enjoy your meal and come back soon! 🍛"
            elif any(w in msg_lower for w in ["who are you", "what are you", "your name", "introduce"]):
                reply = "I'm the Kravix AI Assistant! I can help you with orders, food recommendations, payments, delivery tracking, and more."
            elif any(w in msg_lower for w in ["help", "what can you do", "capabilities"]):
                reply = "I can help you with: 🔍 finding restaurants, 🍽️ menu suggestions, 📦 order tracking, ❌ cancellations, 💳 payment issues, 🏷️ coupons, and 🛵 delivery updates."

            elif detected_bengali:
                mapped = ", ".join(detected_bengali)
                if menu_items:
                    matches = [i for i in menu_items if any(en in i['name'].lower() for bn, en in BENGALI_MAP.items() if bn in msg_lower)]
                    if matches:
                        names = ", ".join(f"{i['name']} (₹{i['price']})" for i in matches[:3])
                        reply = f"I recognized: {mapped}. Here are matching items: {names}."
                    else:
                        reply = f"I recognized: {mapped}. No exact matches on the current menu, but try searching for it!"
                else:
                    reply = f"I recognized: {mapped}. Search for a restaurant to see if these are available near you!"

            elif any(w in normalized for w in ["suggest", "recommend", "what should i eat", "what to eat", "what to order", "craving"]):
                if menu_items:
                    available = [i for i in menu_items if i.get('available', True)]
                    names = ", ".join(f"{i['name']} (₹{i['price']})" for i in available[:4])
                    reply = f"Here are some great options: {names}. Enjoy! 😋"
                else:
                    reply = "I'd love to suggest something! Search for a restaurant near you first and I'll show you what's available."
            elif any(w in normalized for w in ["biryani", "biriyani"]):
                reply = "Biryani is a crowd favorite! 🍚 It usually comes with raita and salad. Search 'biryani' on the home page to find the best options near you."
            elif "pizza" in normalized:
                reply = "Craving pizza? 🍕 Search 'pizza' on the home page to find nearby restaurants serving it."
            elif "burger" in normalized:
                reply = "Burgers are always a great choice! 🍔 Search 'burger' to find options near you."
            elif any(w in normalized for w in ["dessert", "sweet", "ice cream", "cake", "sweets"]):
                reply = "Got a sweet tooth? 🍰 Search for desserts or sweets on the home page to find nearby options."
            elif any(w in normalized for w in ["veg", "vegetarian", "vegan"]):
                if menu_items:
                    veg = [i for i in menu_items if "veg" in i['name'].lower() and i.get('available', True)]
                    reply = f"Vegetarian options: {', '.join(i['name'] for i in veg[:4])}." if veg else "I don't see specific veg tags on the current menu. Check the restaurant's menu page for details."
                else:
                    reply = "Search for a restaurant and I can help you find vegetarian options from their menu!"
            elif any(w in normalized for w in ["available", "in stock", "out of stock"]):
                if menu_items:
                    avail = [i['name'] for i in menu_items if i.get('available', True)]
                    unavail = [i['name'] for i in menu_items if not i.get('available', True)]
                    parts = []
                    if avail: parts.append(f"Available: {', '.join(avail[:4])}.")
                    if unavail: parts.append(f"Out of stock: {', '.join(unavail[:4])}.")
                    reply = " ".join(parts) if parts else "All items appear to be available right now!"
                else:
                    reply = "Open a restaurant's menu page and I can check item availability for you."
            elif any(w in normalized for w in ["price", "cheap", "affordable", "budget", "under", "cost", "how much"]):
                if menu_items:
                    affordable = [i for i in menu_items if i.get('price', 9999) <= 500 and i.get('available', True)]
                    reply = f"Items under ₹500: {', '.join(i['name'] for i in affordable)}." if affordable else "No items under ₹500 on the current menu right now."
                else:
                    reply = "Open a restaurant's menu and I can filter items by price for you!"

            elif any(w in normalized for w in ["find restaurant", "nearby", "near me", "restaurants"]):
                reply = "To find nearby restaurants, make sure your location is set on the home page. Kravix shows you the nearest open and verified restaurants automatically!"
            elif any(w in normalized for w in ["verified", "trusted", "authentic"]):
                reply = "All restaurants on Kravix go through an admin verification process before appearing on the map. Look for the verified badge on restaurant profiles!"
            elif any(w in normalized for w in ["restaurant closed", "is it open", "opening time"]):
                reply = "Restaurant availability is shown in real-time on the home page. If a restaurant is closed, you'll see it marked as 'Closed' and won't be able to order from it."

            elif any(w in normalized for w in ["track", "where is my order", "order status", "my order"]):
                if orders:
                    latest = orders[0]
                    status = latest.get('status', 'unknown')
                    reply = STATUS_MESSAGES.get(status, f"Your latest order status is: {status}.")
                else:
                    reply = "I don't see any active orders right now. Place an order and I'll help you track it!"
            elif any(w in normalized for w in ["cancel", "cancel order", "stop order"]):
                if orders:
                    status = orders[0].get('status', '')
                    if status == "placed":
                        reply = "Your order can still be cancelled! Go to 'My Orders', open the order, and tap the Cancel button."
                    elif status in ["preparing", "accepted", "ready_for_rider", "picked_up", "out_for_delivery"]:
                        reply = f"Sorry, your order is currently '{status}' and can no longer be cancelled. Contact support if there's an urgent issue."
                    else:
                        reply = "Orders can only be cancelled before the restaurant starts preparing them. Check 'My Orders' for the cancel option."
                else:
                    reply = "Orders can be cancelled before the restaurant starts preparing them. Go to 'My Orders' and tap Cancel if the option is available."
            elif any(w in normalized for w in ["reorder", "order again", "same order", "repeat order"]):
                reply = "You can reorder any past order! Go to 'My Orders', find the order you want to repeat, and tap 'Reorder'. It'll refill your cart instantly."

            elif any(w in normalized for w in ["payment failed", "money deducted", "charged but", "debited", "deducted"]):
                reply = "If money was deducted but your order wasn't placed, don't worry — refunds for failed transactions are processed automatically within 5–7 business days. Contact your bank if it takes longer."
            elif any(w in normalized for w in ["refund", "money back", "return money"]):
                reply = "Refunds are issued for cancelled orders where payment was already made. They typically reflect within 5–7 business days depending on your bank or payment provider."
            elif any(w in normalized for w in ["payment", "pay", "stripe", "razorpay", "checkout"]):
                reply = "Kravix supports Stripe and Razorpay for secure payments. 💳 If you faced an issue during checkout, please retry or contact our support team."
            elif any(w in normalized for w in ["coupon", "discount", "promo", "offer", "voucher"]):
                reply = "You can apply a coupon at checkout! 🏷️ Enter your code in the 'Apply Coupon' field. Coupons can be flat discounts, percentage-based, or free delivery."

            elif any(w in normalized for w in ["otp", "one time password", "handoff", "verify delivery"]):
                reply = "When your rider arrives, they'll ask for a delivery OTP. You can find your OTP in the active order details page. Share it only with your rider to confirm delivery."
            elif any(w in normalized for w in ["delivery time", "how long", "eta", "when will", "arrive"]):
                reply = "Delivery time depends on the restaurant's preparation time and your distance from it. You can track your rider's live location on the order tracking page!"
            elif any(w in normalized for w in ["delivery fee", "delivery charge"]):
                reply = "Delivery fees are calculated based on the distance between the restaurant and your delivery address. Apply a free-delivery coupon at checkout to waive it!"

            elif any(w in normalized for w in ["blocked", "account blocked", "can't login", "cannot login", "banned"]):
                reply = "If your account has been blocked, it may be due to a policy violation. Please contact Kravix support with your registered email for assistance."
            elif any(w in normalized for w in ["switch role", "change role", "become seller", "become rider", "switch to"]):
                reply = "You can switch your role from your profile settings. Go to your profile, tap 'Switch Role', and choose Customer, Seller, or Rider."
            elif any(w in normalized for w in ["login", "sign in", "sign up", "register", "account"]):
                reply = "You can sign in with Google One-Tap or with your email and password. New users can register directly from the login page!"
            elif any(w in normalized for w in ["forgot password", "reset password", "password"]):
                reply = "Click 'Forgot Password' on the login page and we'll send a reset link to your registered email address."
            elif any(w in normalized for w in ["verify email", "email verification", "resend verification"]):
                reply = "Check your inbox for a verification email from Kravix. If you didn't receive it, use the 'Resend Verification' option on the login page."
            elif any(w in normalized for w in ["privacy", "data", "personal info"]):
                reply = "Kravix takes your privacy seriously. Your data is used only to provide the service. Refer to our Privacy Policy on the website for full details."

            elif role == "seller" and any(w in normalized for w in ["add item", "add menu", "new dish", "add food"]):
                reply = "To add a menu item, go to your Seller Dashboard → Menu Management → click 'Add Item'. Fill in the name, price, description, and upload an image."
            elif role == "seller" and any(w in normalized for w in ["revenue", "earnings", "sales", "analytics", "chart"]):
                reply = "Your sales analytics are in the Seller Dashboard under 'Analytics'. View daily, weekly, and monthly revenue trends with interactive charts."
            elif role == "seller" and any(w in normalized for w in ["toggle", "open restaurant", "close restaurant", "availability"]):
                reply = "Toggle your restaurant's open/closed status from the Seller Dashboard. Customers won't be able to order when your restaurant is marked as closed."
            elif role == "seller" and any(w in normalized for w in ["incoming order", "new order", "accept order"]):
                reply = "New orders appear in your Seller Dashboard in real-time. Accept them and move through the pipeline: Accepted → Preparing → Ready for Rider."
            elif role == "seller" and any(w in normalized for w in ["create coupon", "add coupon", "coupon"]):
                reply = "Create restaurant-specific coupons from Seller Dashboard → Coupons. Set the discount type, value, minimum order amount, usage limit, and expiry date."

            elif role == "rider" and any(w in normalized for w in ["online", "offline", "go online", "availability", "toggle"]):
                reply = "Toggle your availability from your Rider Dashboard. When you're online, you'll receive delivery job offers for orders near your location."
            elif role == "rider" and any(w in normalized for w in ["earning", "payout", "income", "money"]):
                reply = "Your earnings are tracked in the Rider Dashboard under 'Earnings'. It shows your completed deliveries and total payout accumulated."
            elif role == "rider" and any(w in normalized for w in ["otp", "deliver", "handoff", "complete delivery"]):
                reply = "Ask the customer for their delivery OTP when you arrive. Enter it in the app to mark the order as delivered and complete the handoff."
            elif role == "rider" and any(w in normalized for w in ["accept", "job", "delivery request"]):
                reply = "When a new delivery job is available near you, you'll get a real-time notification. Open the Rider Dashboard to accept or view the delivery details."

            elif role == "admin" and any(w in normalized for w in ["verify", "approve", "restaurant", "rider"]):
                reply = "Go to Admin Dashboard → Verification Requests to review and approve or reject pending restaurant and rider registrations."
            elif role == "admin" and any(w in normalized for w in ["block", "unblock", "user"]):
                reply = "You can block or unblock any user, seller, or rider from Admin Dashboard → User Management."
            elif role == "admin" and any(w in normalized for w in ["cancel order", "stuck order", "force cancel"]):
                reply = "Admins can force-cancel stuck orders from Admin Dashboard → Orders. Use this for orders stuck in an unresolvable state."
            elif role == "admin" and any(w in normalized for w in ["analytics", "export", "csv", "report"]):
                reply = "Platform-wide analytics are in the Admin Dashboard. You can also export revenue trends and system logs as CSV files."

            else:
                reply = "I'm here to help with orders, food recommendations, payments, delivery, and account questions. What would you like to know? 😊"


        history.append({"role": "assistant", "content": reply})
        save_history(req.userId, history)

        return ChatResponse(reply=reply)

    except Exception as e:
        logger.error("chat_endpoint error: %s", type(e).__name__)
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_server:app", host="0.0.0.0", port=5500, reload=True)
