from typing import Dict, Any, Optional
from app.models.schemas import Intent, ChatResponse
from app.dispatchers.base import BaseDispatcher
from app.knowledge.templates import template_engine

class AdminDispatcher(BaseDispatcher):
    def handle(self, intent: Intent, message: str, entities: Dict[str, Any]) -> Optional[ChatResponse]:
        if intent == Intent.GREETING:
            reply = template_engine.get("admin", "GREETING")
            return ChatResponse(reply=reply, intent=intent.value, action="NONE")
            
        if intent == Intent.ADMIN_DASHBOARD:
            return ChatResponse(
                reply="Use the Admin Dashboard to verify restaurants/riders, view platform analytics, and force-cancel stuck orders.", 
                intent=intent.value, 
                action="NAVIGATE_ADMIN_DASHBOARD"
            )
            
        if intent == Intent.ADMIN_USERS:
            return ChatResponse(
                reply="Manage all platform users, block/unblock accounts from the User Management section.", 
                intent=intent.value, 
                action="NAVIGATE_ADMIN_USERS"
            )
            
        return None
