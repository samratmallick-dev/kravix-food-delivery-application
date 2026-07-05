import asyncio
import os
import time
from threading import Lock
from typing import Dict, Any, Optional

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from structured_logger import get_logger, correlation_id_var
from error_handling import ConcurrencyLimitError

logger = get_logger("request_guard")

MAX_CONCURRENT = int(os.environ.get("MAX_CONCURRENT_REQUESTS", "20"))
DEAD_REQUEST_THRESHOLD = 60

class RequestTracker:

    def __init__(self) -> None:
        self._lock = Lock()
        self._active: Dict[str, float] = {}
        self._total: int = 0

    def start(self, request_id: str) -> None:
        with self._lock:
            self._active[request_id] = time.monotonic()
            self._total += 1

    def finish(self, request_id: str) -> None:
        with self._lock:
            self._active.pop(request_id, None)

    def snapshot(self) -> Dict[str, Any]:
        now = time.monotonic()
        with self._lock:
            active_count = len(self._active)
            oldest = 0.0
            if self._active:
                oldest_start = min(self._active.values())
                oldest = now - oldest_start
            return {
                "active": active_count,
                "oldest_seconds": round(oldest, 1),
                "total_served": self._total,
            }

    @property
    def active_count(self) -> int:
        with self._lock:
            return len(self._active)


request_tracker = RequestTracker()

class ConcurrencyGuardMiddleware(BaseHTTPMiddleware):

    _EXEMPT_PATHS = {"/live", "/ready", "/health", "/metrics"}

    def __init__(self, app, max_concurrent: int = MAX_CONCURRENT) -> None:
        super().__init__(app)
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._max = max_concurrent

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self._EXEMPT_PATHS:
            return await call_next(request)

        if self._semaphore.locked():
            cid = correlation_id_var.get()
            logger.warning(
                "Concurrency limit (%d) reached — rejecting request cid=%s",
                self._max, cid,
            )
            return JSONResponse(
                status_code=429,
                content={
                    "error": "concurrency_limit",
                    "message": "Server is at capacity. Please retry shortly.",
                    "correlation_id": cid,
                },
            )

        cid = correlation_id_var.get() or "unknown"
        request_tracker.start(cid)
        try:
            async with self._semaphore:
                response = await call_next(request)
            return response
        finally:
            request_tracker.finish(cid)


def setup_rate_limiter(app):
    try:
        from slowapi import Limiter, _rate_limit_exceeded_handler
        from slowapi.util import get_remote_address
        from slowapi.errors import RateLimitExceeded

        redis_url = os.environ.get("REDIS_URL", "")
        storage_uri = redis_url if redis_url else "memory://"

        limiter = Limiter(
            key_func=get_remote_address,
            storage_uri=storage_uri,
            default_limits=[],
        )
        app.state.limiter = limiter
        app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
        logger.info("Rate limiter configured (storage: %s)",
                     "redis" if redis_url else "memory")
        return limiter

    except ImportError:
        logger.warning("slowapi not installed — rate limiting disabled")
        return None
