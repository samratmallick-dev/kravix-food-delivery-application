import re
from typing import Dict, Any

class EntityExtractor:
    
    @staticmethod
    def extract(text: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        text_lower = text.lower()
        entities = {}
        
        order_match = re.search(r"ord-?\d{5,8}", text_lower)
        if order_match:
            entities["order_id"] = order_match.group(0).upper()
            
        coupon_match = re.search(r"\b[a-z0-9]{5,10}50|[a-z0-9]{5,10}100\b", text_lower)
        if coupon_match:
            entities["coupon_code"] = coupon_match.group(0).upper()
            
        amount_match = re.search(r"(?:₹|rs\.?|inr)\s*(\d+)|(\d+)\s*(?:rs|inr)", text_lower)
        if amount_match:
            val = amount_match.group(1) or amount_match.group(2)
            entities["amount"] = int(val)
            
        if context:
            if "orders" in context:
                for order in context["orders"]:
                    oid = order.get("id", "").lower()
                    if oid and oid in text_lower:
                        entities["order_id"] = oid.upper()
                        break
                        
            if "menu_items" in context:
                for item in context["menu_items"]:
                    food = item.get("name", "").lower()
                    if food and food in text_lower:
                        entities["food_item"] = item["name"]
                        break
                        
        return entities

extractor = EntityExtractor()
