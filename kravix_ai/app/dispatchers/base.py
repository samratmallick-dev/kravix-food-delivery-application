from typing import Dict, Any, Optional
from app.models.schemas import Intent, ChatResponse
from app.knowledge.templates import template_engine

class BaseDispatcher:
    def __init__(self, context: Dict[str, Any]):
        self.context = context
        
    def handle(self, intent: Intent, message: str, entities: Dict[str, Any]) -> Optional[ChatResponse]:
        raise NotImplementedError
        
    def fallback(self, intent: Intent) -> ChatResponse:
        reply = template_engine.get("fallback", "fallback")
        return ChatResponse(reply=reply, intent=intent.value, action="NONE")
