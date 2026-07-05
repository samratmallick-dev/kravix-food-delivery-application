import asyncio
import os
import time

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from structured_logger import get_logger, correlation_id_var

logger = get_logger("timeout")

REQUEST_TIMEOUT = float(os.environ.get("REQUEST_TIMEOUT_SECONDS", "15"))

_EXEMPT_PATHS = {"/live", "/ready", "/health", "/metrics"}


class TimeoutMiddleware(BaseHTTPMiddleware):

    def __init__(self, app, timeout: float = REQUEST_TIMEOUT) -> None:
        super().__init__(app)
        self._timeout = timeout

    async def dispatch(self, request: Request, call_next):
        if request.url.path in _EXEMPT_PATHS:
            return await call_next(request)

        start = time.monotonic()
        try:
            response = await asyncio.wait_for(
                call_next(request),
                timeout=self._timeout,
            )
            return response
        except asyncio.TimeoutError:
            elapsed = time.monotonic() - start
            cid = correlation_id_var.get()
            logger.warning(
                "Request timed out after %.1fs: %s %s (cid=%s)",
                elapsed, request.method, request.url.path, cid,
            )
            return JSONResponse(
                status_code=504,
                content={
                    "error": "timeout",
                    "message": f"Request timed out after {self._timeout:.0f}s. Please retry.",
                    "correlation_id": cid,
                },
            )
