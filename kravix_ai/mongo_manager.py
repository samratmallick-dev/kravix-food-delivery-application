import os
from typing import Optional, Dict, Any

from pymongo import MongoClient
from pymongo.errors import (
    ConnectionFailure,
    ServerSelectionTimeoutError,
    OperationFailure,
)

from structured_logger import get_logger
from circuit_breaker import CircuitBreaker

logger = get_logger("mongodb")

_DEFAULT_TIMEOUT_MS = int(os.environ.get("MONGO_TIMEOUT_MS", "5000"))


class MongoManager:

    def __init__(
        self,
        uri: str,
        db_name: str,
        circuit_breaker: Optional[CircuitBreaker] = None,
        max_pool_size: int = 10,
        min_pool_size: int = 1,
        max_idle_time_ms: int = 45_000,
        timeout_ms: int = _DEFAULT_TIMEOUT_MS,
    ) -> None:
        self._uri = uri
        self._db_name = db_name
        self._circuit_breaker = circuit_breaker or CircuitBreaker("mongodb")
        self._pool_kwargs = {
            "maxPoolSize": max_pool_size,
            "minPoolSize": min_pool_size,
            "maxIdleTimeMS": max_idle_time_ms,
            "serverSelectionTimeoutMS": timeout_ms,
            "socketTimeoutMS": timeout_ms,
            "connectTimeoutMS": timeout_ms,
            "retryWrites": True,
            "retryReads": True,
        }
        self._client: Optional[MongoClient] = None
        self._connect()


    def _connect(self) -> None:
        try:
            self._client = MongoClient(self._uri, **self._pool_kwargs)

            self._client.admin.command("ping")
            logger.info(
                "MongoDB connected (pool: %d–%d, idle: %dms, timeout: %dms)",
                self._pool_kwargs["minPoolSize"],
                self._pool_kwargs["maxPoolSize"],
                self._pool_kwargs["maxIdleTimeMS"],
                self._pool_kwargs["serverSelectionTimeoutMS"],
            )
        except Exception as exc:
            logger.error("MongoDB initial connection failed: %s", exc, exc_info=True)

    def reconnect(self) -> bool:
        logger.warning("Reconnecting to MongoDB...")
        self.close()
        try:
            self._connect()
            healthy = self.ping()
            if healthy:
                self._circuit_breaker.reset()
                logger.info("MongoDB reconnection successful")
            return healthy
        except Exception as exc:
            logger.error("MongoDB reconnection failed: %s", exc, exc_info=True)
            return False

    def close(self) -> None:
        if self._client:
            try:
                self._client.close()
                logger.info("MongoDB connection closed")
            except Exception as exc:
                logger.warning("Error closing MongoDB: %s", exc)
            finally:
                self._client = None


    def ping(self) -> bool:
        if not self._client:
            return False
        try:
            self._client.admin.command("ping")
            return True
        except (ConnectionFailure, ServerSelectionTimeoutError, OperationFailure):
            return False
        except Exception:
            return False

    def get_pool_stats(self) -> Dict[str, Any]:
        if not self._client:
            return {"connected": False}

        try:
            server_info = self._client.server_info()
            return {
                "connected": True,
                "server_version": server_info.get("version", "unknown"),
            }
        except Exception:
            return {"connected": False}


    def get_collection(self, collection_name: str):

        def _get():
            if not self._client:
                raise ConnectionFailure("MongoClient not initialised")
            return self._client[self._db_name][collection_name]

        return self._circuit_breaker.call(_get)

    def insert_one(self, collection_name: str, document: dict) -> Any:
        def _insert():
            col = self._client[self._db_name][collection_name]
            return col.insert_one(document)

        return self._circuit_breaker.call(_insert)

    @property
    def circuit(self) -> CircuitBreaker:
        return self._circuit_breaker
