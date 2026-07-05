import os
import sys
from typing import List, Tuple

from structured_logger import get_logger

logger = get_logger("startup")


def validate_environment() -> dict:
    results: dict = {"valid": True, "errors": [], "warnings": []}

    required: List[Tuple[str, str]] = []
    
    enable_feedback = os.environ.get("ENABLE_FEEDBACK", "false").lower() in ("true", "1", "yes")
    if enable_feedback:
        for var in ("MONGODB_URI", "DB_NAME"):
            if not os.environ.get(var):
                msg = f"ENABLE_FEEDBACK=true but {var} is not set"
                results["errors"].append(msg)
                results["valid"] = False

    recommended = [
        ("REDIS_URL", "Session store will use in-memory LRU fallback"),
        ("SESSION_TTL_SECONDS", "Defaulting to 1800s (30 min)"),
        ("REQUEST_TIMEOUT_SECONDS", "Defaulting to 15s"),
        ("MAX_CONCURRENT_REQUESTS", "Defaulting to 20"),
        ("MEMORY_WARN_MB", "Defaulting to 350 MB"),
        ("MEMORY_DEGRADED_MB", "Defaulting to 420 MB"),
        ("MEMORY_CRITICAL_MB", "Defaulting to 470 MB"),
        ("APP_VERSION", "Defaulting to 1.0.0"),
    ]
    for var, fallback_msg in recommended:
        if not os.environ.get(var):
            results["warnings"].append(f"{var} not set — {fallback_msg}")

    redis_url = os.environ.get("REDIS_URL", "")
    if redis_url and not (redis_url.startswith("redis://") or redis_url.startswith("rediss://")):
        results["errors"].append(
            f"REDIS_URL must start with redis:// or rediss:// (got: {redis_url[:30]}...)"
        )
        results["valid"] = False

    for err in results["errors"]:
        logger.error("STARTUP ERROR: %s", err)
    for warn in results["warnings"]:
        logger.warning("STARTUP WARNING: %s", warn)

    if results["valid"]:
        logger.info("Environment validation passed")
    else:
        logger.critical("Environment validation FAILED — exiting")
        sys.exit(1)

    config_summary = {
        "MOCK_MODE": os.environ.get("MOCK_MODE", "false"),
        "ENABLE_FEEDBACK": os.environ.get("ENABLE_FEEDBACK", "false"),
        "MONGODB_URI": "****" if os.environ.get("MONGODB_URI") else "(not set)",
        "REDIS_URL": "****" if os.environ.get("REDIS_URL") else "(not set)",
        "SESSION_TTL": os.environ.get("SESSION_TTL_SECONDS", "1800"),
        "REQUEST_TIMEOUT": os.environ.get("REQUEST_TIMEOUT_SECONDS", "15"),
        "MAX_CONCURRENT": os.environ.get("MAX_CONCURRENT_REQUESTS", "20"),
        "MEMORY_THRESHOLDS": f"{os.environ.get('MEMORY_WARN_MB', '350')}/"
                             f"{os.environ.get('MEMORY_DEGRADED_MB', '420')}/"
                             f"{os.environ.get('MEMORY_CRITICAL_MB', '470')} MB",
        "VERSION": os.environ.get("APP_VERSION", "1.0.0"),
    }
    logger.info("Configuration summary: %s", config_summary)
    return results
