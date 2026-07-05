import logging
import json
import traceback
import sys
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Optional

correlation_id_var: ContextVar[Optional[str]] = ContextVar("correlation_id", default=None)
request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)

SERVICE_NAME = "kravix-ai"


class StructuredJsonFormatter(logging.Formatter):

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "service": SERVICE_NAME,
            "level": record.levelname,
            "component": getattr(record, "component", record.name),
            "message": record.getMessage(),
        }

        cid = correlation_id_var.get()
        if cid:
            log_entry["correlation_id"] = cid

        rid = request_id_var.get()
        if rid:
            log_entry["request_id"] = rid

        if record.exc_info and record.exc_info[0] is not None:
            log_entry["error"] = record.exc_info[0].__name__
            log_entry["traceback"] = traceback.format_exception(*record.exc_info)
        for key in ("extra_data", "duration_ms", "endpoint", "status_code",
                     "memory_rss_mb", "session_count", "pool_stats"):
            val = getattr(record, key, None)
            if val is not None:
                log_entry[key] = val

        return json.dumps(log_entry, default=str)


def setup_structured_logging(level: int = logging.INFO) -> None:
    formatter = StructuredJsonFormatter()
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)

    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        uv_logger = logging.getLogger(logger_name)
        uv_logger.handlers.clear()
        uv_logger.addHandler(handler)
        uv_logger.setLevel(level)
        uv_logger.propagate = False


def get_logger(component: str) -> logging.Logger:
    logger = logging.getLogger(f"{SERVICE_NAME}.{component}")
    old_factory = logger.makeRecord

    def _make_record(*args, **kwargs):
        record = old_factory(*args, **kwargs)
        record.component = component  
        return record

    logger.makeRecord = _make_record 
    return logger
