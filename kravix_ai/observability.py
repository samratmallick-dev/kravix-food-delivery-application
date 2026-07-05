import time
from collections import deque
from threading import Lock
from typing import Dict, Any, Optional

from structured_logger import get_logger

logger = get_logger("observability")


class RequestMetrics:


    def __init__(self, window_size: int = 200) -> None:
        self._lock = Lock()
        self._latencies: deque = deque(maxlen=window_size)
        self._total_requests: int = 0
        self._status_counts: Dict[int, int] = {}

    def record(self, duration_ms: float, status_code: int, path: str) -> None:
        with self._lock:
            self._latencies.append(duration_ms)
            self._total_requests += 1
            self._status_counts[status_code] = self._status_counts.get(status_code, 0) + 1

        if duration_ms > 5000:
            logger.warning(
                "Slow request: %s took %.0fms (status %d)",
                path, duration_ms, status_code,
            )

    def snapshot(self) -> Dict[str, Any]:
        with self._lock:
            if not self._latencies:
                return {
                    "total": self._total_requests,
                    "latency": {"p50_ms": 0, "p95_ms": 0, "p99_ms": 0},
                    "status_codes": dict(self._status_counts),
                }
            sorted_lat = sorted(self._latencies)
            n = len(sorted_lat)
            return {
                "total": self._total_requests,
                "latency": {
                    "p50_ms": round(sorted_lat[n // 2], 1),
                    "p95_ms": round(sorted_lat[int(n * 0.95)], 1) if n >= 20 else round(sorted_lat[-1], 1),
                    "p99_ms": round(sorted_lat[int(n * 0.99)], 1) if n >= 100 else round(sorted_lat[-1], 1),
                },
                "status_codes": dict(self._status_counts),
            }


request_metrics = RequestMetrics()


def build_metrics_payload(
    session_store=None,
    mongo_manager=None,
    model_manager=None,
    request_tracker=None,
    retry_budget=None,
) -> Dict[str, Any]:
    from memory_watchdog import get_rss_mb, is_degraded
    import gc

    payload: Dict[str, Any] = {}

    req_snapshot = request_metrics.snapshot()
    active_info = {"active": 0, "oldest_seconds": 0, "total_served": 0}
    if request_tracker:
        active_info = request_tracker.snapshot()
    payload["requests"] = {
        **req_snapshot,
        "active": active_info["active"],
        "oldest_active_seconds": active_info["oldest_seconds"],
    }

    payload["sessions"] = {
        "active": session_store.active_count() if session_store else 0,
        "store_type": type(session_store).__name__ if session_store else "none",
    }

    rss = get_rss_mb()
    payload["memory"] = {
        "rss_mb": round(rss, 1),
        "gc_counts": list(gc.get_count()),
        "degraded": is_degraded(),
    }

    if mongo_manager:
        payload["mongodb"] = {
            "connected": mongo_manager.ping(),
            **mongo_manager.get_pool_stats(),
        }
    else:
        payload["mongodb"] = {"connected": False}

    if model_manager:
        payload["ai_provider"] = model_manager.health()
    else:
        payload["ai_provider"] = {"provider": "none", "connected": False}

    circuits = {}
    if mongo_manager:
        circuits["mongodb"] = mongo_manager.circuit.stats
    if model_manager:
        circuits["model"] = model_manager.circuit.stats
    payload["circuit_breakers"] = circuits

    if retry_budget:
        payload["retry_budget"] = retry_budget.snapshot()

    from error_handling import error_aggregator
    payload["errors"] = error_aggregator.snapshot()

    return payload
