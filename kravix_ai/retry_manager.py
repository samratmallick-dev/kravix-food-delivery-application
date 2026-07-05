import asyncio
import functools
import random
import time
from collections import deque
from threading import Lock
from typing import Tuple, Type, Optional, Callable, Any

from structured_logger import get_logger

logger = get_logger("retry_manager")


class RetryBudget:

    def __init__(self, max_per_minute: int = 50) -> None:
        self.max_per_minute = max_per_minute
        self._lock = Lock()
        self._timestamps: deque = deque()

    def acquire(self) -> bool:
        now = time.monotonic()
        with self._lock:

            while self._timestamps and now - self._timestamps[0] > 60.0:
                self._timestamps.popleft()
            if len(self._timestamps) >= self.max_per_minute:
                return False
            self._timestamps.append(now)
            return True

    def snapshot(self) -> dict:
        now = time.monotonic()
        with self._lock:
            while self._timestamps and now - self._timestamps[0] > 60.0:
                self._timestamps.popleft()
            return {
                "used": len(self._timestamps),
                "limit": self.max_per_minute,
                "window": "1m",
            }


_default_budget = RetryBudget(max_per_minute=50)


def get_default_budget() -> RetryBudget:
    return _default_budget


def set_default_budget(budget: RetryBudget) -> None:
    global _default_budget
    _default_budget = budget


def with_retry(
    max_retries: int = 3,
    backoff_base: float = 1.0,
    max_backoff: float = 30.0,
    exceptions: Tuple[Type[BaseException], ...] = (Exception,),
    circuit_breaker=None,
    budget: Optional[RetryBudget] = None,
):
    def decorator(fn: Callable) -> Callable:
        @functools.wraps(fn)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            _budget = budget or _default_budget
            last_exc: Optional[BaseException] = None

            for attempt in range(1 + max_retries):
                try:
                    return await fn(*args, **kwargs)
                except exceptions as exc:
                    last_exc = exc

                    if attempt == 0:
                        logger.warning(
                            "Call to %s failed (attempt %d/%d): %s",
                            fn.__name__, attempt + 1, 1 + max_retries,
                            type(exc).__name__,
                        )
                    else:
                        logger.warning(
                            "Retry %d/%d for %s failed: %s",
                            attempt, max_retries, fn.__name__,
                            type(exc).__name__,
                        )

                    remaining = max_retries - attempt
                    if remaining <= 0:
                        break


                    if not _budget.acquire():
                        logger.error(
                            "Retry budget exhausted for %s — stopping retries",
                            fn.__name__,
                        )
                        break

                    if circuit_breaker is not None:
                        from error_handling import CircuitOpenError
                        if circuit_breaker.state == "OPEN":
                            logger.warning(
                                "Circuit '%s' is OPEN — stopping retries for %s",
                                circuit_breaker.name, fn.__name__,
                            )
                            break

                    delay = min(
                        backoff_base * (2 ** attempt) + random.uniform(0, 1),
                        max_backoff,
                    )
                    logger.info(
                        "Backing off %.2fs before retry %d/%d for %s",
                        delay, attempt + 1, max_retries, fn.__name__,
                    )
                    await asyncio.sleep(delay)

            raise last_exc  

        return wrapper
    return decorator
