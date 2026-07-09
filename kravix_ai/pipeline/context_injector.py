from typing import Dict, Any

class ContextInjector:
    @staticmethod
    def inject_dynamic_context(context_data: Dict[str, Any], lang: str = "en") -> str:
        """
        Parses dynamic request context (orders, coupons, menu_items)
        and formats it as a contextual string.
        """
        if not context_data:
            return ""
            
        context_str = "\n[Dynamic Context]\n"
        
        orders = context_data.get("orders", [])
        if orders:
            context_str += "Recent Orders:\n"
            for order in orders:
                status = order.get("status", "unknown")
                oid = order.get("id", "N/A")
                context_str += f"- Order #{oid}: {status}\n"
                
        coupons = context_data.get("coupons", [])
        if coupons:
            context_str += "Active Coupons:\n"
            for coupon in coupons:
                code = coupon.get("code")
                disc = coupon.get("discountValue")
                context_str += f"- Code: {code}, Discount: {disc}\n"
                
        menu_items = context_data.get("menu_items", [])
        if menu_items:
            context_str += "Relevant Menu Items:\n"
            for item in menu_items[:5]:
                name = item.get("name")
                price = item.get("price")
                avail = "Available" if item.get("available", True) else "Out of Stock"
                context_str += f"- {name}: ₹{price} ({avail})\n"
                
        return context_str
