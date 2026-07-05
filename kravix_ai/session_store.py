import json
import time
from abc import ABC, abstractmethod
from collections import OrderedDict
from threading import Lock
from typing import List, Dict, Optional

from structured_logger import get_logger

logger = get_logger("session_store")


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

    def __init__(self, redis_url: str, ttl: int = 1800, max_sessions: int = 1000) -> None:
        import redis as redis_lib
        self._client = redis_lib.Redis.from_url(
            redis_url,
            decode_responses=True,
            socket_timeout=3,
            socket_connect_timeout=3,
            retry_on_timeout=True,
        )
        self._ttl = ttl
        self._max_sessions = max_sessions
        self._client.ping()
        logger.info("Redis session store connected (TTL=%ds, max=%d)", ttl, max_sessions)

    def _key(self, user_id: str) -> str:
        return f"{self._KEY_PREFIX}{user_id}"

    def get_history(self, user_id: str) -> List[Dict]:
        raw = self._client.get(self._key(user_id))
        if raw is None:
            return []
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            return []

    def save_history(self, user_id: str, history: List[Dict]) -> None:
        if self.active_count() >= self._max_sessions:
            cursor, keys = self._client.scan(
                cursor=0, match=f"{self._KEY_PREFIX}*", count=50
            )
            if keys:
                self._client.delete(keys[0])
                logger.warning("Evicted session to stay under %d limit", self._max_sessions)

        self._client.setex(self._key(user_id), self._ttl, json.dumps(history))

    def cleanup(self) -> int:
        return 0

    def active_count(self) -> int:
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

    def clear_all(self) -> None:
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

    def ping(self) -> bool:
        try:
            return self._client.ping()
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


def create_session_store(
    redis_url: Optional[str] = None,
    ttl: int = 1800,
    max_sessions: int = 500,
) -> SessionStore:
    if redis_url:
        try:
            return RedisSessionStore(redis_url, ttl=ttl, max_sessions=max_sessions)
        except Exception as exc:
            logger.warning(
                "Redis unavailable (%s: %s) — falling back to LRU session store",
                type(exc).__name__, exc,
            )

    return LRUSessionStore(max_size=max_sessions, ttl=ttl)
