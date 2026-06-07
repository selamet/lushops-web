from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Sentinel API"
    environment: str = "development"
    debug: bool = True

    database_url: str = "sqlite+aiosqlite:///./sentinel.db"

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    cors_origins: list[str] = ["http://localhost:5173"]

    rate_limit: str = "120/minute"
    auth_rate_limit: str = "10/minute"

    engine_enabled: bool = True
    engine_interval: int = 30

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
