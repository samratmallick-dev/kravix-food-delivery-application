import traceback
import time
from collections import defaultdict
from threading import Lock
from typing import Dict

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from structured_logger import get_logger, correlation_id_var

logger = get_logger("error_handling")



class KravixBaseError(Exception):
    status_code: int = 500
    error_type: str = "internal_error"


class ModelInferenceError(KravixBaseError):
    status_code = 503
    error_type = "model_error"


class DatabaseError(KravixBaseError):
    status_code = 503
    error_type = "database_error"


class SessionStoreError(KravixBaseError):
    status_code = 503
    error_type = "session_store_error"


class RequestTimeoutError(KravixBaseError):
    status_code = 504
    error_type = "timeout_error"


class InputValidationError(KravixBaseError):
    status_code = 422
    error_type = "validation_error"


class ProviderError(KravixBaseError):
    status_code = 502
    error_type = "provider_error"


class CircuitOpenError(KravixBaseError):
    status_code = 503
    error_type = "circuit_open"


class RateLimitError(KravixBaseError):
    status_code = 429
    error_type = "rate_limit"


class ConcurrencyLimitError(KravixBaseError):
    status_code = 429
    error_type = "concurrency_limit"



class _ErrorAggregator:

    def __init__(self) -> None:
        self._lock = Lock()
        self._counts: Dict[str, int] = defaultdict(int)
        self._total: int = 0

    def record(self, error_type: str) -> None:
        with self._lock:
            self._counts[error_type] += 1
            self._total += 1

    def snapshot(self) -> Dict:
        with self._lock:
            return {"total": self._total, "by_type": dict(self._counts)}

    def reset(self) -> None:
        with self._lock:
            self._counts.clear()
            self._total = 0


error_aggregator = _ErrorAggregator()



def register_exception_handlers(app: FastAPI) -> None:

    @app.exception_handler(KravixBaseError)
    async def _kravix_error_handler(request: Request, exc: KravixBaseError):
        cid = correlation_id_var.get()
        logger.error(
            "Kravix error [%s] cid=%s: %s",
            exc.error_type, cid, str(exc),
            exc_info=(type(exc), exc, exc.__traceback__),
        )
        error_aggregator.record(exc.error_type)
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.error_type,
                "message": "An error occurred. Please try again.",
                "correlation_id": cid,
            },
        )

    @app.exception_handler(Exception)
    async def _generic_error_handler(request: Request, exc: Exception):
        cid = correlation_id_var.get()
        logger.error(
            "Unhandled exception cid=%s: %s",
            cid, str(exc),
            exc_info=(type(exc), exc, exc.__traceback__),
        )
        error_aggregator.record("unhandled")
        return JSONResponse(
            status_code=500,
            content={
                "error": "internal_error",
                "message": "An unexpected error occurred. Please try again.",
                "correlation_id": cid,
            },
        )
