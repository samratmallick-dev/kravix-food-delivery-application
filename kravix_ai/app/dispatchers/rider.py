from typing import Dict, Any, Optional
from app.models.schemas import Intent, ChatResponse
from app.dispatchers.base import BaseDispatcher
from app.knowledge.templates import template_engine

class RiderDispatcher(BaseDispatcher):
    def handle(self, intent: Intent, message: str, entities: Dict[str, Any]) -> Optional[ChatResponse]:
        if intent == Intent.GREETING:
            reply = template_engine.get("rider", "GREETING")
            return ChatResponse(reply=reply, intent=intent.value, action="NONE")
            
        if intent == Intent.RIDER_DASHBOARD:
            return ChatResponse(
                reply="Toggle your online availability from the Rider Dashboard to start receiving delivery jobs.", 
                intent=intent.value, 
                action="NAVIGATE_RIDER_DASHBOARD"
            )
            
        if intent == Intent.RIDER_EARNINGS:
            reply = template_engine.get("rider", "RIDER_EARNINGS")
            return ChatResponse(
                reply=reply, 
                intent=intent.value, 
                action="NAVIGATE_RIDER_EARNINGS"
            )
            
        return None
