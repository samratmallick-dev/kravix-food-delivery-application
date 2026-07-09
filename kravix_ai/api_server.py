from contextlib import asynccontextmanager
import asyncio
import json
import gc
import os
import sys
import signal
import time
import re
import uuid
import logging

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

from structured_logger import (
    setup_structured_logging,
    get_logger,
    correlation_id_var,
    request_id_var,
)

setup_structured_logging(level=logging.INFO)
logger = get_logger("api_server")

from startup_validator import validate_environment

validate_environment()

from error_handling import (
    register_exception_handlers,
    KravixBaseError,
    ModelInferenceError,
    DatabaseError,
    error_aggregator,
)
from circuit_breaker import CircuitBreaker
from retry_manager import with_retry, get_default_budget
from session_store import create_session_store
from mongo_manager import MongoManager
from model_manager import ModelManager
from memory_watchdog import check_memory, memory_diagnostics, is_degraded, get_rss_mb
from health_monitor import HealthMonitor
from request_guard import (
    ConcurrencyGuardMiddleware,
    request_tracker,
    setup_rate_limiter,
)
from timeout_middleware import TimeoutMiddleware
from observability import request_metrics, build_metrics_payload

from pipeline import (
    DatasetLoader,
    KnowledgeIndexer,
    KnowledgeRetriever,
    ContextInjector,
    PromptBuilder,
    LanguageResolver
)

_dataset_loader = None
_knowledge_indexer = None
_knowledge_retriever = None


SESSION_TTL = int(os.environ.get("SESSION_TTL_SECONDS", "1800"))
MAX_SESSIONS = int(os.environ.get("MAX_SESSIONS", "500"))
REDIS_URL = os.environ.get("REDIS_URL", "")
ENABLE_FEEDBACK = os.environ.get("ENABLE_FEEDBACK", "false").lower() in ("true", "1", "yes")
MONGO_URI = os.environ.get("MONGODB_URI", "")
DB_NAME = os.environ.get("DB_NAME", "kravix_db")
PROMPT_TOKEN_LIMIT = int(os.environ.get("PROMPT_TOKEN_LIMIT", "6000"))
MAX_HISTORY_TURNS = int(os.environ.get("MAX_HISTORY_TURNS", "10"))


_session_store = None
_mongo_manager: Optional[MongoManager] = None
_model_manager: Optional[ModelManager] = None
_health_monitor: Optional[HealthMonitor] = None
_background_tasks: List[asyncio.Task] = []
_shutdown_event = asyncio.Event()


class ChatRequest(BaseModel):
    message: str
    userId: str
    role: str
    contextData: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    reply: str
    intent: Optional[str] = "UNKNOWN"
    action: Optional[str] = "NONE"
    intent_confidence: Optional[float] = 1.0
    entities: Optional[Dict[str, Any]] = {}
    followUp: Optional[List[str]] = []
    
    redis_latency_ms: Optional[float] = 0.0
    inference_latency_ms: Optional[float] = 0.0


class FeedbackRequest(BaseModel):
    messageId: str
    message: str
    reply: str
    role: str
    feedback: int


async def _dataset_watchdog_loop():
    while not _shutdown_event.is_set():
        try:
            await asyncio.sleep(10)
            if _dataset_loader and _knowledge_indexer and _knowledge_retriever:
                modified = _dataset_loader.get_modified_datasets()
                if modified:
                    for name, data in modified.items():
                        _knowledge_indexer.update_dataset(name, data)
                    _knowledge_retriever.clear_cache()
                    logger.info("Knowledge index updated incrementally.")
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.error("Dataset watchdog error: %s", exc, exc_info=True)

async def _session_cleanup_loop():
    while not _shutdown_event.is_set():
        try:
            await asyncio.sleep(300)
            if _session_store:
                evicted = _session_store.cleanup()
                if evicted:
                    logger.info("Background cleanup: evicted %d sessions", evicted)
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.error("Session cleanup error: %s", exc, exc_info=True)


async def _memory_watchdog_loop():
    while not _shutdown_event.is_set():
        try:
            await asyncio.sleep(60)
            check_memory(
                session_cleanup_fn=_session_store.cleanup if _session_store else None,
                session_clear_fn=_session_store.clear_all if _session_store else None,
            )
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.error("Memory watchdog error: %s", exc, exc_info=True)


async def _redis_keepalive_loop():
    """Ping Redis every 60s to prevent EC2 idle socket closure."""
    while not _shutdown_event.is_set():
        try:
            await asyncio.sleep(60)
            if _session_store and hasattr(_session_store, "ping"):
                alive = _session_store.ping()
                if not alive:
                    logger.warning("Redis keepalive ping failed — connection may be stale")
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.error("Redis keepalive error: %s", exc)


async def _mongo_health_loop():
    while not _shutdown_event.is_set():
        try:
            await asyncio.sleep(120)
            if _mongo_manager and not _mongo_manager.ping():
                logger.warning("MongoDB ping failed — attempting reconnection")
                _mongo_manager.reconnect()
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.error("Mongo health check error: %s", exc, exc_info=True)


async def _diagnostics_loop():
    while not _shutdown_event.is_set():
        try:
            await asyncio.sleep(1800)
            session_count = _session_store.active_count() if _session_store else 0
            active_reqs = request_tracker.active_count
            memory_diagnostics(session_count=session_count, active_requests=active_reqs)
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.error("Diagnostics loop error: %s", exc, exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _session_store, _mongo_manager, _model_manager, _health_monitor, _dataset_loader, _knowledge_indexer, _knowledge_retriever

    logger.info("=== Kravix AI starting ===")

    _session_store = create_session_store(
        redis_url=REDIS_URL or None,
        ttl=SESSION_TTL,
        max_sessions=MAX_SESSIONS,
    )
    logger.info("Session store: %s", type(_session_store).__name__)

    if ENABLE_FEEDBACK and MONGO_URI:
        try:
            _mongo_manager = MongoManager(
                uri=MONGO_URI,
                db_name=DB_NAME,
                circuit_breaker=CircuitBreaker("mongodb", failure_threshold=5, recovery_timeout=60),
            )
        except Exception as exc:
            logger.error("MongoDB init failed: %s", exc, exc_info=True)

    _model_manager = ModelManager(
        circuit_breaker=CircuitBreaker("model", failure_threshold=3, recovery_timeout=60),
    )
    _health_monitor = HealthMonitor(
        mongo_manager=_mongo_manager,
        session_store=_session_store,
        model_manager=_model_manager,
        request_tracker=request_tracker,
    )


    _dataset_loader = DatasetLoader("datasets")
    datasets = _dataset_loader.load_all(fail_on_error=True)
    _knowledge_indexer = KnowledgeIndexer()
    _knowledge_indexer.build_index(datasets)
    _knowledge_retriever = KnowledgeRetriever(_knowledge_indexer)
    
    _background_tasks.extend([
        asyncio.create_task(_dataset_watchdog_loop(), name="dataset_watchdog"),
        asyncio.create_task(_session_cleanup_loop(), name="session_cleanup"),
        asyncio.create_task(_memory_watchdog_loop(), name="memory_watchdog"),
        asyncio.create_task(_diagnostics_loop(), name="diagnostics"),
        asyncio.create_task(_redis_keepalive_loop(), name="redis_keepalive"),
    ])
    if _mongo_manager:
        _background_tasks.append(
            asyncio.create_task(_mongo_health_loop(), name="mongo_health")
        )

    logger.info(
        "Startup complete: %d background tasks, feedback=%s, model=%s, sessions=%s",
        len(_background_tasks),
        ENABLE_FEEDBACK,
        "ML" if _model_manager.ml_available else "MOCK",
        type(_session_store).__name__,
    )

    yield

    logger.info("=== Kravix AI Microservice shutting down ===")
    _shutdown_event.set()
    for task in _background_tasks:
        task.cancel()
    if _background_tasks:
        await asyncio.gather(*_background_tasks, return_exceptions=True)
    logger.info("Background tasks cancelled")

    if _mongo_manager:
        _mongo_manager.close()
    session_count = _session_store.active_count() if _session_store else 0
    logger.info("Shutdown complete. Final sessions: %d, RSS: %.1f MB", session_count, get_rss_mb())



app = FastAPI(title="Kravix Local AI Microservice", lifespan=lifespan)

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

    if request.url.path not in {"/live", "/ready", "/health", "/metrics"}:
        request_metrics.record(elapsed_ms, response.status_code, request.url.path)

    return response


_limiter = setup_rate_limiter(app)


from enum import Enum, auto

_INJECTION_PATTERN = re.compile(
    r"(###\s*(system|instruction|response)|ignore (previous|above|all)|forget (previous|instructions)|you are now|act as|jailbreak)",
    re.IGNORECASE,
)

def sanitize_input(text: str) -> str:
    sanitized = _INJECTION_PATTERN.sub("[removed]", text)
    return sanitized[:1000]

def normalize_price(price) -> int:
    try:
        p = int(float(price))
    except (TypeError, ValueError):
        return 1
    return max(1, min(p, 10000))

def _normalize_role(role: str) -> str:
    if not role:
        return "customer"
    r = role.lower().strip()
    if "seller" in r or "restaurant owner" in r:
        return "seller"
    elif "rider" in r or "delivery rider" in r:
        return "rider"
    elif "admin" in r or "administrator" in r:
        return "admin"
    return "customer"

def _count_tokens(text: str) -> int:
    if not text:
        return 0
    return int(len(text.split()) * 1.3)

def _trim_prompt(system_prompt: str, history: List[Dict[str, str]], max_tokens: int) -> tuple[str, List[Dict[str, str]]]:
    sys_tokens = _count_tokens(system_prompt)
    overhead = 10
    available = max_tokens - sys_tokens - overhead
    
    while history and available < 0:
        if len(history) > 1:
            msg1 = history.pop(0)
            msg2 = history.pop(0) if history else None
            sys_tokens = _count_tokens(system_prompt)
            current_hist_tokens = sum(_count_tokens(m['content']) + 10 for m in history)
            available = max_tokens - sys_tokens - overhead - current_hist_tokens
        else:
            history.pop(0)
            break

    current_hist_tokens = sum(_count_tokens(m['content']) + 10 for m in history)
    while history and (sys_tokens + current_hist_tokens + overhead > max_tokens):
        if len(history) > 1:
             history.pop(0)
             history.pop(0)
        else:
             history.pop(0)
        current_hist_tokens = sum(_count_tokens(m['content']) + 10 for m in history)
        
    full_prompt = f"### System:\n{system_prompt}\n\n"
    for msg in history:
        prefix = "### Instruction:\n" if msg["role"] == "user" else "### Response:\n"
        full_prompt += f"{prefix}{sanitize_input(msg['content'])}\n\n"
    
    full_prompt += "### Response:\n"
    return full_prompt, history

SYSTEM_PROMPT_TEMPLATE = """You are Kravix Assistant — a friendly, professional, concise food-delivery domain expert for the Kravix platform.

Identity:
- Name: Kravix Assistant
- Currency: Indian Rupee (₹)
- Platform: Multi-vendor food ordering and delivery marketplace
- Personality: Friendly, professional, helpful, concise

User Role: {role}
Always tailor your response to the user's role (customer / seller / rider / admin).

Language Instructions:
- Reply in {preferred_language}.

Format Instructions:
- You must respond ONLY with a JSON object matching this schema:
{{
  "reply": "your text response",
  "intent": "INTENT_NAME",
  "action": "ACTION_NAME",
  "intent_confidence": 0.95,
  "entities": {{}},
  "followUp": ["option 1", "option 2"]
}}
- Return raw JSON only.
"""

def parse_json_response(reply_text: str) -> Dict[str, Any]:
    if not reply_text:
        return {}
    clean_text = reply_text.strip()
    if clean_text.startswith("```"):
        first_nl = clean_text.find("\n")
        if first_nl != -1:
            clean_text = clean_text[first_nl:].strip()
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3].strip()
            
    try:
        data = json.loads(clean_text)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
        
    match = re.search(r"\{.*\}", clean_text, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(0))
            if isinstance(data, dict):
                return data
        except Exception:
            pass
            
    return {}

@app.get("/live")
async def liveness():
    return _health_monitor.liveness() if _health_monitor else {"status": "alive"}

@app.get("/ready")
async def readiness():
    if not _health_monitor:
        return JSONResponse(status_code=503, content={"status": "not_ready"})
    result = _health_monitor.readiness()
    if _model_manager and _model_manager.ml_available:
        try:
            probe = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(None, _model_manager.infer, "ping"),
                timeout=5.0,
            )
            result["inference_probe"] = "ok" if probe else "empty_output"
        except Exception as exc:
            result["inference_probe"] = f"failed: {type(exc).__name__}"
            result["status"] = "degraded"
    else:
        result["inference_probe"] = "mock_mode"
    status_code = 200 if result["status"] == "ready" else 503
    return JSONResponse(status_code=status_code, content=result)

@app.get("/health")
async def health():
    if not _health_monitor:
        return {"status": "ok"}
    snapshot = _health_monitor.full_snapshot()
    status_code = _health_monitor.http_status_code(snapshot)
    return JSONResponse(status_code=status_code, content=snapshot)

@app.get("/metrics")
async def metrics():
    return build_metrics_payload(
        session_store=_session_store,
        mongo_manager=_mongo_manager,
        model_manager=_model_manager,
        request_tracker=request_tracker,
        retry_budget=get_default_budget(),
    )

@app.post("/feedback", status_code=204)
async def feedback_endpoint(req: FeedbackRequest):
    if not ENABLE_FEEDBACK or _mongo_manager is None:
        return
    if req.feedback not in (1, -1):
        raise HTTPException(status_code=400, detail="feedback must be 1 or -1")
    try:
        _mongo_manager.insert_one("ai_feedback", {
            "messageId": req.messageId,
            "message": req.message[:500],
            "reply": req.reply[:500],
            "role": req.role,
            "feedback": req.feedback,
            "timestamp": datetime.now(timezone.utc),
        })
    except Exception as e:
        logger.error("feedback_endpoint DB error: %s", e, exc_info=True)

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    cid = correlation_id_var.get()

    if is_degraded():
        logger.warning("Serving degraded response (memory pressure) cid=%s", cid)
        return ChatResponse(
            reply="We're experiencing high load right now. Please try again in a moment. 🙏",
            intent_confidence=0.5,
        )

    start_time = time.monotonic()
    redis_start = time.monotonic()
    try:
        history = _session_store.get_history(req.userId) if _session_store else []
    except Exception as exc:
        logger.warning("Session read failed for %s: %s — starting fresh", req.userId, exc)
        history = []
    redis_latency = (time.monotonic() - redis_start) * 1000

    try:
        safe_message = sanitize_input(req.message)
        role = _normalize_role(req.role)
        ctx = req.contextData or {}
        
        

        history.append({"role": "user", "content": safe_message})
        if len(history) > MAX_HISTORY_TURNS:
            history = history[-MAX_HISTORY_TURNS:]

        lang = LanguageResolver.detect_language(safe_message, ctx.get("preferredLanguage", "en"))
        retrieved_chunks = _knowledge_retriever.retrieve(safe_message, role, lang, top_k=3, min_confidence=0.2)
        dynamic_context_str = ContextInjector.inject_dynamic_context(ctx, lang)
        
        system_prompt = PromptBuilder.build_system_prompt(
            SYSTEM_PROMPT_TEMPLATE, role, lang, retrieved_chunks, dynamic_context_str
        )

        reply = None
        intent = "UNKNOWN"
        action = "NONE"
        intent_confidence = 0.5
        entities = {}
        follow_up = []
        
        inference_start = time.monotonic()
        if _model_manager and _model_manager.ml_available:
            full_prompt, history = _trim_prompt(system_prompt, history.copy(), PROMPT_TOKEN_LIMIT)
            
            logger.info("ML inference requested, tokens ~%d", _count_tokens(full_prompt))
            model_reply = _model_manager.infer(full_prompt)

            if model_reply:
                parsed = parse_json_response(model_reply)
                if parsed:
                    reply = parsed.get("reply")
                    intent = parsed.get("intent", "UNKNOWN")
                    action = parsed.get("action", "NONE")
                    intent_confidence = parsed.get("intent_confidence", 1.0)
                    entities = parsed.get("entities", {})
                    follow_up = parsed.get("followUp", [])
                else:
                    reply = model_reply
                    
                fallback_keywords = [
                    "I don't know", "I am an AI", "As an AI", "I cannot",
                    "I'm not able", "I do not have", "I apologize",
                ]
                if reply and (any(kw.lower() in reply.lower() for kw in fallback_keywords) or len(reply) < 5):
                    reply = None
        
        inference_latency = (time.monotonic() - inference_start) * 1000
        
        if not reply:
            if not retrieved_chunks:
                reply = "I'm sorry, but I don't have that information."
            else:
                reply = "I'm sorry, I cannot process your request at the moment due to high load."
            intent_confidence = 0.1

        history.append({"role": "assistant", "content": reply})
        
        redis_save_start = time.monotonic()
        if _session_store:
            try:
                _session_store.save_history(req.userId, history)
            except Exception as exc:
                logger.warning("Session save failed for %s: %s", req.userId, exc)
        redis_latency += (time.monotonic() - redis_save_start) * 1000

        total_latency = (time.monotonic() - start_time) * 1000


        logger.info(
            "chat_request_metrics",
            extra={
                "extra_data": {
                    "userId": req.userId,
                    "userRole": role,
                    "redis_latency_ms": round(redis_latency, 2),
                    "inference_latency_ms": round(inference_latency, 2),
                    "total_latency_ms": round(total_latency, 2),
                }
            }
        )

        return ChatResponse(
            reply=reply,
            intent=intent,
            action=action,
            intent_confidence=intent_confidence,
            entities=entities,
            followUp=follow_up,
            redis_latency_ms=round(redis_latency, 2),
            inference_latency_ms=round(inference_latency, 2)
        )

    except KravixBaseError:
        raise
    except Exception as e:
        logger.error("chat_endpoint unhandled error cid=%s: %s", cid, e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

def _handle_sigterm(*args):
    logger.info("SIGTERM received — initiating graceful shutdown")
    _shutdown_event.set()

signal.signal(signal.SIGTERM, _handle_sigterm)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=5500,
        reload=True,
        timeout_keep_alive=65,
    )
