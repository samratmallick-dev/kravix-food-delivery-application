import gc
import os
import threading
from typing import Optional, Callable

import psutil

from structured_logger import get_logger

logger = get_logger("memory_watchdog")

WARN_MB = int(os.environ.get("MEMORY_WARN_MB", "350"))
DEGRADED_MB = int(os.environ.get("MEMORY_DEGRADED_MB", "420"))
CRITICAL_MB = int(os.environ.get("MEMORY_CRITICAL_MB", "470"))

_degraded = threading.Event()
_process = psutil.Process()


def is_degraded() -> bool:
    return _degraded.is_set()


def get_rss_mb() -> float:
    return _process.memory_info().rss / (1024 * 1024)


def get_cpu_percent() -> float:
    try:
        return _process.cpu_percent(interval=None)
    except Exception:
        return 0.0


def check_memory(
    session_cleanup_fn: Optional[Callable[[], int]] = None,
    session_clear_fn: Optional[Callable[[], None]] = None,
) -> dict:
    
    rss = get_rss_mb()
    result = {"rss_mb": round(rss, 1), "level": "ok", "action_taken": None}

    if rss >= CRITICAL_MB:
        result["level"] = "critical"
        _degraded.set()
        logger.critical(
            "MEMORY CRITICAL: %.1f MB ≥ %d MB — emergency purge triggered",
            rss, CRITICAL_MB,
            extra={"memory_rss_mb": round(rss, 1)},
        )
        if session_clear_fn:
            session_clear_fn()
            result["action_taken"] = "emergency_session_purge"
        gc.collect()

    elif rss >= DEGRADED_MB:
        result["level"] = "degraded"
        _degraded.set()
        logger.critical(
            "MEMORY DEGRADED: %.1f MB ≥ %d MB — degraded mode active",
            rss, DEGRADED_MB,
            extra={"memory_rss_mb": round(rss, 1)},
        )
        if session_cleanup_fn:
            evicted = session_cleanup_fn()
            result["action_taken"] = f"evicted_{evicted}_sessions"
        gc.collect()

    elif rss >= WARN_MB:
        result["level"] = "warning"
        logger.warning(
            "MEMORY WARNING: %.1f MB ≥ %d MB — running cleanup",
            rss, WARN_MB,
            extra={"memory_rss_mb": round(rss, 1)},
        )
        if session_cleanup_fn:
            evicted = session_cleanup_fn()
            result["action_taken"] = f"evicted_{evicted}_sessions"
        collected = gc.collect()
        logger.info("GC collected %d objects", collected)

    else:
        if _degraded.is_set():
            _degraded.clear()
            logger.info("Memory recovered to %.1f MB — exiting degraded mode", rss)

    return result


def memory_diagnostics(session_count: int = 0, active_requests: int = 0) -> dict:
    rss = get_rss_mb()
    gc_counts = gc.get_count()
    diag = {
        "rss_mb": round(rss, 1),
        "gc_counts": list(gc_counts),
        "session_count": session_count,
        "active_requests": active_requests,
    }
    logger.info("Memory diagnostics: %s", diag, extra={"memory_rss_mb": round(rss, 1)})
    return diag
