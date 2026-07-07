import os
import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from structured_logger import get_logger
from memory_watchdog import get_rss_mb, get_cpu_percent, DEGRADED_MB, CRITICAL_MB

logger = get_logger("health_monitor")

_start_time = time.monotonic()
_start_datetime = datetime.now(timezone.utc)

APP_VERSION = os.environ.get("APP_VERSION", "1.0.0")
BUILD_DATE = os.environ.get("BUILD_DATE", datetime.now(timezone.utc).strftime("%Y%m%d"))
_FEEDBACK_ENABLED = os.environ.get("ENABLE_FEEDBACK", "false").lower() in ("true", "1", "yes")


class HealthMonitor:

    def __init__(
        self,
        mongo_manager=None,
        session_store=None,
        model_manager=None,
        request_tracker=None,
    ) -> None:
        self._mongo = mongo_manager
        self._session_store = session_store
        self._model = model_manager
        self._request_tracker = request_tracker

    def set_mongo(self, mongo_manager) -> None:
        self._mongo = mongo_manager

    def set_session_store(self, session_store) -> None:
        self._session_store = session_store

    def set_model(self, model_manager) -> None:
        self._model = model_manager

    def set_request_tracker(self, request_tracker) -> None:
        self._request_tracker = request_tracker

    def liveness(self) -> Dict[str, Any]:
        return {"status": "alive"}

    def readiness(self) -> Dict[str, Any]:
        checks: Dict[str, Any] = {}
        ready = True
        
        mongo_ok = False
        if self._mongo:
            mongo_ok = self._mongo.ping()
        checks["mongodb"] = mongo_ok
        if not mongo_ok and _FEEDBACK_ENABLED:
            ready = False

        session_ok = True
        if self._session_store and hasattr(self._session_store, "ping"):
            session_ok = self._session_store.ping()
        checks["redis"] = session_ok
        model_ok = True
        if self._model:
            health = self._model.health()
            model_ok = health.get("connected", True)
        checks["model_loaded"] = model_ok

        rss = get_rss_mb()
        memory_ok = rss < DEGRADED_MB
        checks["memory_ok"] = memory_ok
        checks["memory_rss_mb"] = round(rss, 1)

        if not memory_ok:
            ready = False

        status = "ready" if ready else "degraded"
        if rss >= CRITICAL_MB:
            status = "not_ready"
        if not mongo_ok and _FEEDBACK_ENABLED:
            status = "not_ready"

        return {"status": status, **checks}

    def full_snapshot(self) -> Dict[str, Any]:
        rss = get_rss_mb()
        cpu = get_cpu_percent()
        uptime = time.monotonic() - _start_time
        mongo_ok = self._mongo.ping() if self._mongo else False
        status = "healthy"

        if not mongo_ok or rss >= CRITICAL_MB:
            status = "unhealthy"
        elif rss >= DEGRADED_MB:
            status = "degraded"

        circuits = {}
        if self._mongo:
            cb = self._mongo.circuit
            if cb.state != "CLOSED":
                status = "degraded" if status == "healthy" else status
            circuits["mongodb"] = cb.stats
        if self._model:
            cb = self._model.circuit
            if cb.state != "CLOSED":
                status = "degraded" if status == "healthy" else status
            circuits["model"] = cb.stats

        active_requests = 0
        oldest_request_seconds = 0
        if self._request_tracker:
            req_info = self._request_tracker.snapshot()
            active_requests = req_info.get("active", 0)
            oldest_request_seconds = req_info.get("oldest_seconds", 0)
            if oldest_request_seconds > 60:
                status = "degraded" if status == "healthy" else status

        session_count = 0
        if self._session_store:
            session_count = self._session_store.active_count()
        ai_health = {}
        if self._model:
            ai_health = self._model.health()

        snapshot = {
            "status": status,
            "version": APP_VERSION,
            "build": BUILD_DATE,
            "uptime_seconds": round(uptime),
            "memory_rss_mb": round(rss, 1),
            "memory_threshold_mb": DEGRADED_MB,
            "cpu_percent": round(cpu, 1),
            "mongodb": mongo_ok,
            "redis": self._session_store.ping() if self._session_store and hasattr(self._session_store, "ping") else True,
            "ai_provider": ai_health,
            "active_requests": active_requests,
            "oldest_request_seconds": oldest_request_seconds,
            "active_sessions": session_count,
            "circuit_breakers": circuits,
        }

        return snapshot

    def http_status_code(self, snapshot: Dict) -> int:
        if snapshot["status"] == "unhealthy":
            return 503
        return 200
