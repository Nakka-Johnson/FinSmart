"""Application configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8001

    # Logging
    LOG_LEVEL: str = "INFO"

    # CORS configuration
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # API metadata
    API_TITLE: str = "FinSmart AI"
    API_VERSION: str = "1.0.0"

    # Monitoring configuration
    ENABLE_METRICS: bool = True
    ENABLE_SENTRY: bool = False
    SENTRY_DSN: str = ""
    SENTRY_ENVIRONMENT: str = "development"
    SENTRY_TRACES_SAMPLE_RATE: float = 1.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


# Global settings instance
settings = Settings()
