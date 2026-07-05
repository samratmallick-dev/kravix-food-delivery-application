import json
import os
import random

random.seed(42)

ROLES = ["customer", "seller", "rider", "admin"]
ORDER_IDS = ["[ORDER_ID]"]
RESTAURANT_NAMES = ["[RESTAURANT_NAME]"]

BENGALI_FOOD_MAPPING = {
    "bhat": "rice",
    "dal": "lentils",
    "mach": "fish",
    "roti": "bread",
    "tarkari": "vegetables",
    "mishti": "sweets",
    "biryani": "biryani"
}

CUISINES = ["Bengali", "Chinese", "North Indian", "South Indian", "Italian", "Mughlai"]
PAYMENT_STATUSES = ["pending", "paid", "failed"]
ORDER_STATUSES = ["placed", "accepted", "preparing", "ready_for_rider", "picked_up", "out_for_delivery", "delivered"]

templates = {
    "Order Management": [
        {
            "intent": "track_order",
            "role": "customer",
            "qs": [
                "Where is my order?",
                "Can you track my food?",
                "What's the status of order [ORDER_ID]?",
                "Is my order on the way?"
            ],
            "ans": [
                "Your order [ORDER_ID] is currently out_for_delivery. The status pipeline is: placed → accepted → preparing → ready_for_rider → picked_up → **out_for_delivery** → delivered.",
                "Let me check order [ORDER_ID]. It's currently preparing. Status: placed → accepted → **preparing** → ready_for_rider → picked_up → out_for_delivery → delivered."
            ]
        },
        {
            "intent": "cancel_order",
            "role": "customer",
            "qs": [
                "I want to cancel my order.",
                "Cancel order [ORDER_ID].",
                "How do I cancel this?"
            ],
            "ans": [
                "I can help with that. Since your order [ORDER_ID] is still 'placed' and hasn't been accepted yet, I have cancelled it. Any paid amount will be refunded according to our policy.",
                "Order [ORDER_ID] is already 'preparing', so it cannot be cancelled directly. Please contact support if you need further assistance."
            ]
        }
    ],
    "Food & Menu Intelligence": [
        {
            "intent": "food_recommendation",
            "role": "customer",
            "qs": [
                "Recommend some good {cuisine} food.",
                "What's the best {bengali_term} available?",
                "I want some {bengali_term}."
            ],
            "ans": [
                "I recommend the Special {cuisine} Thali from [RESTAURANT_NAME]. It's priced at ₹250 and is currently available.",
                "For {mapped_term}, you should try the Premium {mapped_term} Curry at [RESTAURANT_NAME] for ₹180. It's available right now."
            ]
        }
    ],
    "Restaurant Discovery": [
        {
            "intent": "find_restaurant",
            "role": "customer",
            "qs": [
                "Find nearest open restaurants.",
                "Show me open places near me.",
                "Are there any restaurants open right now?"
            ],
            "ans": [
                "Here are some popular open restaurants near you: [RESTAURANT_NAME] (Bengali) and [RESTAURANT_NAME] (Chinese). All are within a 5km radius.",
                "[RESTAURANT_NAME] is currently open and serving your area."
            ]
        }
    ],
    "Payments & Checkout": [
        {
            "intent": "payment_failure",
            "role": "customer",
            "qs": [
                "My payment failed but money was deducted.",
                "Payment failed on Razorpay.",
                "Stripe says payment failed."
            ],
            "ans": [
                "I'm sorry to hear that. If your payment failed but the amount was deducted, it will be automatically refunded within 5-7 business days. If you've already tried resolving this twice, please email support at admin@kravix.com."
            ]
        },
        {
            "intent": "coupon_usage",
            "role": "customer",
            "qs": [
                "How do I use a flat discount coupon?",
                "Coupon isn't working."
            ],
            "ans": [
                "You can apply a flat discount or percentage discount coupon at checkout. Make sure your cart meets the minimum order value and the coupon hasn't expired."
            ]
        }
    ],
    "Account & Authentication": [
        {
            "intent": "blocked_account",
            "role": "customer",
            "qs": [
                "My account is blocked.",
                "Why can't I log in? It says blocked.",
                "Unblock my account."
            ],
            "ans": [
                "I see your account has been blocked. Please email admin@kravix.com directly for assistance with account reinstatement."
            ]
        }
    ],
    "Rider & Delivery": [
        {
            "intent": "rider_availability",
            "role": "rider",
            "qs": [
                "How do I toggle my availability?",
                "I want to go offline."
            ],
            "ans": [
                "You can toggle your availability status directly from the Rider Dashboard home screen. When you're ready to take orders, just switch it to 'Online'."
            ]
        },
        {
            "intent": "otp_handoff",
            "role": "rider",
            "qs": [
                "How do I verify delivery?",
                "Customer OTP verification."
            ],
            "ans": [
                "When you reach the delivery location, ask the customer for their Delivery OTP. Enter it in your Rider app to complete the handoff and mark the order as delivered."
            ]
        }
    ],
    "Seller / Restaurant Owner": [
        {
            "intent": "manage_menu",
            "role": "seller",
            "qs": [
                "How do I add a new menu item?",
                "Change price of my dish."
            ],
            "ans": [
                "You can add, edit, or delete menu items from your Seller Dashboard under 'Menu Management'. Changes to prices and availability update instantly for customers."
            ]
        }
    ],
    "Admin Operations": [
        {
            "intent": "block_user",
            "role": "admin",
            "qs": [
                "How do I block a fraudulent merchant?",
                "Block user."
            ],
            "ans": [
                "As an admin, you can block users, merchants, or riders from the 'User Management' section in the Admin Panel. Their active sessions will be terminated immediately."
            ]
        }
    ],
    "Error & Edge Cases": [
        {
            "intent": "out_of_stock",
            "role": "customer",
            "qs": [
                "The item in my cart is out of stock.",
                "Cart says out of stock."
            ],
            "ans": [
                "It looks like an item in your cart went out of stock while you were ordering. Please remove it to proceed, or choose a different item from [RESTAURANT_NAME]."
            ]
        }
    ],
    "Platform Policies": [
        {
            "intent": "data_privacy",
            "role": "customer",
            "qs": [
                "How is my data handled?",
                "What is your privacy policy?"
            ],
            "ans": [
                "We take your privacy seriously. You can read our detailed data privacy FAQs and compliance information at https://aws.amazon.com/compliance/data-privacy-faq/."
            ]
        }
    ]
}

def generate_dataset(output_file="kravix_training.jsonl", num_per_category=50):
    dataset = []
    
    for category, intents in templates.items():
        count = 0
        while count < num_per_category:
            for template in intents:
                if count >= num_per_category:
                    break
                
                q = random.choice(template["qs"])
                a = random.choice(template["ans"])
                
                if "{cuisine}" in q or "{cuisine}" in a:
                    cuisine = random.choice(CUISINES)
                    q = q.replace("{cuisine}", cuisine)
                    a = a.replace("{cuisine}", cuisine)
                
                if "{bengali_term}" in q:
                    b_term = random.choice(list(BENGALI_FOOD_MAPPING.keys()))
                    mapped = BENGALI_FOOD_MAPPING[b_term]
                    q = q.replace("{bengali_term}", b_term)
                    a = a.replace("{mapped_term}", mapped)
                
                record = {
                    "instruction": q,
                    "output": a,
                    "category": category,
                    "userRole": template["role"],
                    "intent": template["intent"]
                }
                
                dataset.append(record)
                count += 1

    with open(output_file, 'w', encoding='utf-8') as f:
        for item in dataset:
            f.write(json.dumps(item) + "\n")
            
    print(f"Generated {len(dataset)} records in {output_file}")

def export_feedback_to_jsonl(
    mongo_uri: str,
    output_file: str = "kravix_training.jsonl",
    db_name: str = "kravix_db",
    min_feedback: int = 1,
):
    """
    Pull positively-rated feedback from MongoDB and append to the training JSONL.
    Only runs when ENABLE_FEEDBACK=true and MONGODB_URI are set in the environment.
    Does NOT retrain the model — run train_lora.py separately after this.
    """
    try:
        from pymongo import MongoClient
    except ImportError:
        print("pymongo not installed. Run: pip install pymongo")
        return

    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    col = client[db_name]["ai_feedback"]
    docs = list(col.find({"feedback": {"$gte": min_feedback}}))
    if not docs:
        print("No positive feedback records found.")
        return

    appended = 0
    with open(output_file, "a", encoding="utf-8") as f:
        for doc in docs:
            record = {
                "instruction": doc.get("message", "")[:500],
                "output": doc.get("reply", "")[:500],
                "category": "FeedbackLoop",
                "userRole": doc.get("role", "customer"),
                "intent": "feedback_derived",
            }
            if record["instruction"] and record["output"]:
                f.write(json.dumps(record) + "\n")
                appended += 1

    print(f"Appended {appended} feedback records to {output_file}")
    print("NOTE: Run train_lora.py manually (with GPU) to incorporate these into the model.")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--export-feedback":
        mongo_uri = os.environ.get("MONGODB_URI", "")
        if not mongo_uri:
            print("MONGODB_URI environment variable is not set.")
            sys.exit(1)
        export_feedback_to_jsonl(mongo_uri)
    else:
        generate_dataset()
