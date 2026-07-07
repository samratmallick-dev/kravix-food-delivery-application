import re
from typing import List, Dict, Any

class ConversationResolver:
    
    @staticmethod
    def resolve(history: List[Dict[str, str]], current_message: str, context: Dict[str, Any] = None) -> str:
        msg_lower = current_message.lower()
        
        ordinal_map = {
            "first one": 0, "1st one": 0,
            "second one": 1, "2nd one": 1,
            "last one": -1
        }
        
        for ordinal, index in ordinal_map.items():
            if ordinal in msg_lower and context and "orders" in context:
                orders = context["orders"]
                if len(orders) > abs(index) or index == -1:
                    target_order = orders[index]
                    oid = target_order.get("id")
                    if oid:
                        current_message = re.sub(rf"\b{ordinal}\b", f"order {oid}", current_message, flags=re.IGNORECASE)
                        return current_message
                        
        if re.search(r"\b(it|that|track it|cancel it)\b", msg_lower):
            if history and len(history) > 1:
                if context and "orders" in context and context["orders"]:
                    oid = context["orders"][0].get("id")
                    if oid:
                        current_message = re.sub(r"\b(it|that)\b", f"order {oid}", current_message, flags=re.IGNORECASE)
                        
        return current_message

resolver = ConversationResolver()
