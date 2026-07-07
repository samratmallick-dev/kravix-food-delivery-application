from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
import uuid
from app.models.schemas import ChatRequest, ChatResponse, FeedbackRequest
from app.core.config import settings

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from structured_logger import setup_structured_logging, get_logger, correlation_id_var, request_id_var
from error_handling import register_exception_handlers, KravixBaseError
from timeout_middleware import TimeoutMiddleware
from request_guard import ConcurrencyGuardMiddleware

setup_structured_logging(level="INFO")
logger = get_logger("kravix_ai.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"=== {settings.APP_NAME} v{settings.APP_VERSION} starting ===")
    yield
    logger.info("=== Kravix AI shutting down ===")

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION, lifespan=lifespan)

register_exception_handlers(app)
app.add_middleware(TimeoutMiddleware)
app.add_middleware(ConcurrencyGuardMiddleware)

@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    cid = request.headers.get("X-Correlation-ID", str(uuid.uuid4())[:8])
    rid = str(uuid.uuid4())[:8]
    correlation_id_var.set(cid)
    request_id_var.set(rid)

    start = time.monotonic()
    response = await call_next(request)
    elapsed_ms = (time.monotonic() - start) * 1000

    response.headers["X-Correlation-ID"] = cid
    response.headers["X-Request-ID"] = rid
    return response

@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}

from app.nlp.classifier import classifier
from app.nlp.extractor import extractor
from app.nlp.resolver import resolver
from app.dispatchers.customer import CustomerDispatcher
from app.dispatchers.seller import SellerDispatcher
from app.dispatchers.rider import RiderDispatcher
from app.dispatchers.admin import AdminDispatcher

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    cid = correlation_id_var.get()
    ctx = req.contextData or {}
    
    history = ctx.get("history", [])
    resolved_message = resolver.resolve(history, req.message, ctx)
    
    intent, confidence = classifier.classify(resolved_message)
    
    entities = extractor.extract(resolved_message, ctx)
    
    role = req.role.lower()
    dispatcher = None
    
    if "seller" in role:
        dispatcher = SellerDispatcher(ctx)
    elif "rider" in role:
        dispatcher = RiderDispatcher(ctx)
    elif "admin" in role:
        dispatcher = AdminDispatcher(ctx)
    else:
        dispatcher = CustomerDispatcher(ctx)
        
    response = dispatcher.handle(intent, resolved_message, entities)
    
    if response:
        response.confidence = confidence
        response.entities = entities
        return response
        
    fallback_response = dispatcher.fallback(intent)
    fallback_response.confidence = confidence
    fallback_response.entities = entities
    return fallback_response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=5500, reload=True)
