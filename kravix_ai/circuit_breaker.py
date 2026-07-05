import time
import threading
from typing import Callable, TypeVar, Dict, Any

from structured_logger import get_logger
from error_handling import CircuitOpenError

logger = get_logger("circuit_breaker")

T = TypeVar("T")


CLOSED = "CLOSED"
OPEN = "OPEN"
HALF_OPEN = "HALF_OPEN"


class CircuitBreaker:

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
    ) -> None:
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout

        self._lock = threading.Lock()
        self._state: str = CLOSED
        self._consecutive_failures: int = 0
        self._last_failure_time: float = 0.0
        self._total_trips: int = 0



    @property
    def state(self) -> str:
        with self._lock:
            self._maybe_transition_to_half_open()
            return self._state

    @property
    def stats(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "name": self.name,
                "state": self._state,
                "consecutive_failures": self._consecutive_failures,
                "total_trips": self._total_trips,
            }

    def call(self, fn: Callable[..., T], *args, **kwargs) -> T:
        with self._lock:
            self._maybe_transition_to_half_open()

            if self._state == OPEN:
                raise CircuitOpenError(
                    f"Circuit breaker '{self.name}' is OPEN — "
                    f"dependency unavailable (tripped {self._total_trips} times)"
                )

        try:
            result = fn(*args, **kwargs)
        except Exception as exc:
            self._record_failure()
            raise
        else:
            self._record_success()
            return result

    async def async_call(self, fn: Callable[..., T], *args, **kwargs) -> T:
        with self._lock:
            self._maybe_transition_to_half_open()

            if self._state == OPEN:
                raise CircuitOpenError(
                    f"Circuit breaker '{self.name}' is OPEN — "
                    f"dependency unavailable (tripped {self._total_trips} times)"
                )

        try:
            result = await fn(*args, **kwargs)
        except Exception:
            self._record_failure()
            raise
        else:
            self._record_success()
            return result

    def reset(self) -> None:
        with self._lock:
            self._state = CLOSED
            self._consecutive_failures = 0
            logger.info("Circuit '%s' manually reset to CLOSED", self.name)


    def _maybe_transition_to_half_open(self) -> None:
        if self._state == OPEN:
            elapsed = time.monotonic() - self._last_failure_time
            if elapsed >= self.recovery_timeout:
                self._state = HALF_OPEN
                logger.info(
                    "Circuit '%s' → HALF_OPEN after %.1fs cooldown",
                    self.name, elapsed,
                )

    def _record_failure(self) -> None:
        with self._lock:
            self._consecutive_failures += 1
            self._last_failure_time = time.monotonic()

            if self._consecutive_failures >= self.failure_threshold:
                if self._state != OPEN:
                    self._state = OPEN
                    self._total_trips += 1
                    logger.warning(
                        "Circuit '%s' → OPEN after %d consecutive failures (trip #%d)",
                        self.name, self._consecutive_failures, self._total_trips,
                    )

    def _record_success(self) -> None:
        with self._lock:
            if self._state == HALF_OPEN:
                logger.info("Circuit '%s' → CLOSED (half-open probe succeeded)", self.name)
            self._state = CLOSED
            self._consecutive_failures = 0
