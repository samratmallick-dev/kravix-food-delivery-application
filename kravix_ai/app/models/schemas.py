from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from enum import Enum

class Intent(str, Enum):
    GREETING = "GREETING"
    FOOD_SEARCH = "FOOD_SEARCH"
    RESTAURANT_SEARCH = "RESTAURANT_SEARCH"
    ORDER_TRACKING = "ORDER_TRACKING"
    ORDER_CANCELLATION = "ORDER_CANCELLATION"
    REORDER = "REORDER"
    PAYMENT = "PAYMENT"
    REFUND = "REFUND"
    COUPON = "COUPON"
    DELIVERY = "DELIVERY"
    PROFILE = "PROFILE"
    SELLER_DASHBOARD = "SELLER_DASHBOARD"
    SELLER_MENU = "SELLER_MENU"
    RIDER_DASHBOARD = "RIDER_DASHBOARD"
    RIDER_EARNINGS = "RIDER_EARNINGS"
    ADMIN_DASHBOARD = "ADMIN_DASHBOARD"
    ADMIN_USERS = "ADMIN_USERS"
    HELP = "HELP"
    UNKNOWN = "UNKNOWN"
    OFF_TOPIC = "OFF_TOPIC"

class ChatRequest(BaseModel):
    message: str
    userId: str
    role: str
    contextData: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    reply: str
    intent: Optional[str] = None
    action: Optional[str] = None
    confidence: Optional[float] = 1.0
    entities: Optional[Dict[str, Any]] = None
    followUp: Optional[List[str]] = None

class FeedbackRequest(BaseModel):
    messageId: str
    message: str
    reply: str
    role: str
    feedback: int
