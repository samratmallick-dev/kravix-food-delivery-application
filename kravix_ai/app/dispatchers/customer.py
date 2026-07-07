from typing import Dict, Any, Optional
from app.models.schemas import Intent, ChatResponse
from app.dispatchers.base import BaseDispatcher
from app.knowledge.templates import template_engine

class CustomerDispatcher(BaseDispatcher):
    def handle(self, intent: Intent, message: str, entities: Dict[str, Any]) -> Optional[ChatResponse]:
        if intent == Intent.GREETING:
            reply = template_engine.get("customer", "GREETING")
            return ChatResponse(reply=reply, intent=intent.value, action="NONE")
            
        if intent == Intent.ORDER_TRACKING:
            orders = self.context.get("orders", [])
            target_order = None
            if "order_id" in entities:
                target_order = next((o for o in orders if o.get("id") == entities["order_id"]), None)
            elif orders:
                target_order = orders[0]
                
            if target_order:
                reply = template_engine.get("customer", "ORDER_TRACKING_ACTIVE", 
                                            order_id=target_order.get("id"), 
                                            status=target_order.get("status", "unknown"))
                return ChatResponse(
                    reply=reply, 
                    intent=intent.value, 
                    action="OPEN_ORDER_TRACKING", 
                    entities={"order_id": target_order.get("id")}
                )
            else:
                reply = template_engine.get("customer", "ORDER_TRACKING_NONE")
                return ChatResponse(reply=reply, intent=intent.value, action="NAVIGATE_HOME")
                
        return None
