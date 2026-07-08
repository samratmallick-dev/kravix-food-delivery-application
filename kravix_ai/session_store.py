import json
import time
from abc import ABC, abstractmethod
from collections import OrderedDict
from threading import Lock
from typing import List, Dict, Optional

from structured_logger import get_logger

logger = get_logger("session_store")

_redis_pool = None
_redis_pool_lock = Lock()


def get_or_create_redis_pool(redis_url: str, max_connections: int = 20):
    global _redis_pool
    with _redis_pool_lock:
        if _redis_pool is None:
            import redis as redis_lib
            from redis.retry import Retry
            from redis.backoff import ExponentialBackoff
            _retry = Retry(ExponentialBackoff(cap=8, base=0.5), retries=3)
            _redis_pool = redis_lib.ConnectionPool.from_url(
                redis_url,
                decode_responses=True,
                max_connections=max_connections,
                socket_timeout=3,
                socket_connect_timeout=3,
                socket_keepalive=True,
                socket_keepalive_options={},
                health_check_interval=30,
                retry=_retry,
                retry_on_timeout=True,
                retry_on_error=[
                    redis_lib.exceptions.ConnectionError,
                    redis_lib.exceptions.TimeoutError,
                ],
            )
            logger.info("Redis ConnectionPool created (max_connections=%d)", max_connections)
        return _redis_pool


class SessionStore(ABC):

    @abstractmethod
    def get_history(self, user_id: str) -> List[Dict]:
        ...

    @abstractmethod
    def save_history(self, user_id: str, history: List[Dict]) -> None:
        ...

    @abstractmethod
    def cleanup(self) -> int:
        ...

    @abstractmethod
    def active_count(self) -> int:
        ...

    @abstractmethod
    def clear_all(self) -> None:
        ...

class RedisSessionStore(SessionStore):

    _KEY_PREFIX = "kravix:session:"

    def __init__(self, redis_url: str, ttl: int = 1800, max_sessions: int = 1000,
                 max_connections: int = 20) -> None:
        import redis as redis_lib

        pool = get_or_create_redis_pool(redis_url, max_connections=max_connections)
        self._client = redis_lib.Redis(connection_pool=pool)
        self._ttl = ttl
        self._max_sessions = max_sessions
        try:
            self._client.ping()
            logger.info("Redis session store connected (TTL=%ds, max=%d, pool_max=%d)",
                        ttl, max_sessions, max_connections)
        except Exception as exc:
            logger.warning("Redis session store ping failed during init: %s", exc)

    def _key(self, user_id: str) -> str:
        return f"{self._KEY_PREFIX}{user_id}"

    def get_history(self, user_id: str) -> List[Dict]:
        try:
            raw = self._client.get(self._key(user_id))
            if raw is None:
                return []
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            return []
        except Exception as exc:
            logger.warning("Redis get_history failed for %s: %s — returning empty", user_id, exc)
            return []

    def save_history(self, user_id: str, history: List[Dict]) -> None:
        try:
            if self.active_count() >= self._max_sessions:
                cursor, keys = self._client.scan(
                    cursor=0, match=f"{self._KEY_PREFIX}*", count=50
                )
                if keys:
                    self._client.delete(keys[0])
                    logger.warning("Evicted session to stay under %d limit", self._max_sessions)
            self._client.setex(self._key(user_id), self._ttl, json.dumps(history))
        except Exception as exc:
            logger.warning("Redis save_history failed for %s: %s — history not persisted", user_id, exc)

    def cleanup(self) -> int:
        return 0

    def active_count(self) -> int:
        try:
            count = 0
            cursor = "0"
            while True:
                cursor, keys = self._client.scan(
                    cursor=cursor, match=f"{self._KEY_PREFIX}*", count=200
                )
                count += len(keys)
                if cursor == 0 or cursor == "0":
                    break
            return count
        except Exception:
            return 0

    def clear_all(self) -> None:
        try:
            cursor = "0"
            while True:
                cursor, keys = self._client.scan(
                    cursor=cursor, match=f"{self._KEY_PREFIX}*", count=200
                )
                if keys:
                    self._client.delete(*keys)
                if cursor == 0 or cursor == "0":
                    break
            logger.info("All Redis sessions cleared")
        except Exception as exc:
            logger.warning("Redis clear_all failed: %s", exc)

    def ping(self) -> bool:
        try:
            return bool(self._client.ping())
        except Exception:
            return False


class LRUSessionStore(SessionStore):

    def __init__(self, max_size: int = 500, ttl: int = 1800) -> None:
        self._max_size = max_size
        self._ttl = ttl
        self._lock = Lock()
        self._store: OrderedDict[str, Dict] = OrderedDict()
        logger.info("LRU session store initialised (max=%d, TTL=%ds)", max_size, ttl)

    def get_history(self, user_id: str) -> List[Dict]:
        with self._lock:
            entry = self._store.get(user_id)
            if entry is None:
                return []
            if time.time() - entry["ts"] > self._ttl:
                del self._store[user_id]
                return []
            self._store.move_to_end(user_id)
            return entry["history"]

    def save_history(self, user_id: str, history: List[Dict]) -> None:
        with self._lock:
            if user_id in self._store:
                self._store.move_to_end(user_id)
            self._store[user_id] = {"history": history, "ts": time.time()}
            while len(self._store) > self._max_size:
                evicted_key, _ = self._store.popitem(last=False)
                logger.debug("LRU evicted session: %s", evicted_key)

    def cleanup(self) -> int:
        now = time.time()
        evicted = 0
        with self._lock:
            expired_keys = [
                k for k, v in self._store.items()
                if now - v["ts"] > self._ttl
            ]
            for k in expired_keys:
                del self._store[k]
                evicted += 1
        if evicted:
            logger.info("Cleaned up %d expired LRU sessions", evicted)
        return evicted

    def active_count(self) -> int:
        with self._lock:
            return len(self._store)

    def clear_all(self) -> None:
        with self._lock:
            self._store.clear()
        logger.info("All LRU sessions cleared")

    def ping(self) -> bool:
        return True


class FallbackSessionStore(SessionStore):

    _HEALTH_TTL = 5.0 

    def __init__(self, redis_url: str, lru_store: LRUSessionStore, ttl: int = 1800, max_sessions: int = 500) -> None:
        self._redis_url = redis_url
        self._lru = lru_store
        self._ttl = ttl
        self._max_sessions = max_sessions
        self._redis = None
        self._lock = Lock()
        self._redis_healthy: bool = False
        self._last_health_check: float = 0.0

        # Try initial connection attempt
        self._try_init_redis()

    def _try_init_redis(self) -> bool:
        if self._redis is not None:
            return True
        try:
            self._redis = RedisSessionStore(self._redis_url, ttl=self._ttl, max_sessions=self._max_sessions)
            self._redis_healthy = self._redis.ping()
            return self._redis_healthy
        except Exception as exc:
            logger.warning("Lazy Redis initialization failed: %s. Will retry dynamically.", exc)
            self._redis = None
            self._redis_healthy = False
            return False

    def _is_redis_healthy(self) -> bool:
        now = time.monotonic()
        with self._lock:
            if now - self._last_health_check < self._HEALTH_TTL:
                return self._redis_healthy
            
            self._last_health_check = now

            if self._redis is None:
                self._try_init_redis()
                return self._redis_healthy

            healthy = self._redis.ping()
            if healthy != self._redis_healthy:
                if healthy:
                    logger.info("Redis recovered — switching back from LRU fallback")
                else:
                    logger.warning("Redis unhealthy — switching to LRU fallback")
            self._redis_healthy = healthy
            return healthy

    def get_history(self, user_id: str) -> List[Dict]:
        if self._is_redis_healthy() and self._redis:
            result = self._redis.get_history(user_id)
            if result:
                self._lru.save_history(user_id, result)
            return result
        return self._lru.get_history(user_id)

    def save_history(self, user_id: str, history: List[Dict]) -> None:
        self._lru.save_history(user_id, history)  
        if self._is_redis_healthy() and self._redis:
            self._redis.save_history(user_id, history)

    def cleanup(self) -> int:
        return self._lru.cleanup()

    def active_count(self) -> int:
        if self._is_redis_healthy() and self._redis:
            return self._redis.active_count()
        return self._lru.active_count()

    def clear_all(self) -> None:
        self._lru.clear_all()
        if self._is_redis_healthy() and self._redis:
            self._redis.clear_all()

    def ping(self) -> bool:
        return self._is_redis_healthy()


def create_session_store(
    redis_url: Optional[str] = None,
    ttl: int = 1800,
    max_sessions: int = 500,
) -> SessionStore:
    lru = LRUSessionStore(max_size=max_sessions, ttl=ttl)
    if redis_url:
        return FallbackSessionStore(redis_url, lru, ttl=ttl, max_sessions=max_sessions)
    return lru
