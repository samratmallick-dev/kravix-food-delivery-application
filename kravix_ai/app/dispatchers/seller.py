from typing import Dict, Any, Optional
from app.models.schemas import Intent, ChatResponse
from app.dispatchers.base import BaseDispatcher
from app.knowledge.templates import template_engine

class SellerDispatcher(BaseDispatcher):
    def handle(self, intent: Intent, message: str, entities: Dict[str, Any]) -> Optional[ChatResponse]:
        if intent == Intent.GREETING:
            reply = template_engine.get("seller", "GREETING")
            return ChatResponse(reply=reply, intent=intent.value, action="NONE")
            
        if intent == Intent.SELLER_DASHBOARD:
            return ChatResponse(
                reply="Use your Seller Dashboard to view analytics, toggle restaurant availability, and manage incoming orders.", 
                intent=intent.value, 
                action="NAVIGATE_SELLER_DASHBOARD"
            )
            
        if intent == Intent.SELLER_MENU:
            return ChatResponse(
                reply="To add or edit items, go to Seller Dashboard -> Menu Management.", 
                intent=intent.value, 
                action="NAVIGATE_SELLER_MENU"
            )
            
        return None
