import random

class TemplateEngine:
    
    TEMPLATES = {
        "customer": {
            "GREETING": [
                "Hello! Welcome to Kravix 🍛 How can I help you today?",
                "Hi there! Hungry? Let me know how I can assist you with your order.",
                "Welcome back to Kravix! What are you craving today?"
            ],
            "ORDER_TRACKING_ACTIVE": [
                "Your order {order_id} is currently {status}. You can track it live on the 'My Orders' page.",
                "I found your order {order_id}! It's currently marked as {status}.",
                "Good news! Your order {order_id} is {status}. Hang tight!"
            ],
            "ORDER_TRACKING_NONE": [
                "I don't see any active orders for you right now. Would you like to find something to eat?",
                "It looks like you don't have any active orders. Let me know if you need restaurant recommendations!"
            ]
        },
        "rider": {
            "GREETING": [
                "Hello Rider! Drive safe today.",
                "Hey there! Ready to hit the road and deliver some smiles?",
                "Welcome to your Rider Dashboard! Stay safe out there."
            ],
            "RIDER_EARNINGS": [
                "Track your completed deliveries and accumulated payouts in the Earnings tab of your dashboard.",
                "You can view all your earnings and upcoming payouts right from your Earnings page."
            ]
        },
        "seller": {
            "GREETING": [
                "Hello Partner! Ready for some orders today?",
                "Welcome back to your Seller Dashboard!"
            ]
        },
        "admin": {
            "GREETING": [
                "Hello Admin! System is running smoothly.",
                "Welcome back! Platform monitoring is active."
            ]
        },
        "fallback": [
            "I'm here to help with Kravix platform features. Could you provide more details?",
            "I didn't quite catch that. Could you rephrase your question regarding Kravix?"
        ]
    }
    
    @classmethod
    def get(cls, role: str, intent_key: str, **kwargs) -> str:
        role_templates = cls.TEMPLATES.get(role, {})
        options = role_templates.get(intent_key)
        
        if not options:
            options = cls.TEMPLATES["fallback"]
            
        selected = random.choice(options)
        return selected.format(**kwargs) if kwargs else selected

template_engine = TemplateEngine()
