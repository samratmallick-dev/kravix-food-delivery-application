import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Kravix AI Platform"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    
    PROMPT_TOKEN_LIMIT: int = 6000
    MAX_HISTORY_TURNS: int = 10
    MOCK_MODE: bool = False
    REDIS_URL: str = ""
    SESSION_TTL_SECONDS: int = 1800
    MAX_SESSIONS: int = 500
    MAX_CONCURRENT_REQUESTS: int = 20
    REQUEST_TIMEOUT_SECONDS: int = 15
    
    MONGODB_URI: str = ""
    DB_NAME: str = "kravix_db"
    MONGO_TIMEOUT_MS: int = 5000
    ENABLE_FEEDBACK: bool = True
    MEMORY_WARN_MB: int = 350
    MEMORY_DEGRADED_MB: int = 420
    MEMORY_CRITICAL_MB: int = 470
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
