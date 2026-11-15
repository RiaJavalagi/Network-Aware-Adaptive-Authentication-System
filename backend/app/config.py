from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Security
    SECRET_KEY: str = "insecure_dev_secret_key_needs_replacement_in_production_32bytes"
    TOTP_ENCRYPTION_KEY: str = "dGhpc19pc19hbl9leGFtcGxlXzMyX2J5dGVfa2V5PT0="
    SESSION_COOKIE_NAME: str = "auth_session"
    SESSION_COOKIE_SECURE: bool = False
    SESSION_MAX_AGE_SECONDS: int = 86400

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    # Database & Cache
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/adaptive_auth_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    # Network Intelligence & Trusted Proxies
    TRUSTED_PROXIES: str = "127.0.0.1,::1"
    ENABLE_SIMULATION_MODE: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def allowed_origins_list(self) -> List[str]:
        """Return allowed CORS origins as a trimmed list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def trusted_proxies_list(self) -> List[str]:
        """Return trusted reverse proxy IP addresses as a trimmed list."""
        return [ip.strip() for ip in self.TRUSTED_PROXIES.split(",") if ip.strip()]


@lru_cache()
def get_settings() -> Settings:
    """Return a cached instance of application settings."""
    return Settings()
