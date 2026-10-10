from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "FYP AI Psychology Backend"
    CORS_ORIGINS: List[str] = ["*"]

    FRONTEND_URL: str = "http://localhost:5173"

    # Core Database Config
    DATABASE_URL: str = "sqlite:///./sql_app.db"

    # Auth & Security
    SECRET_KEY: str = "your-default-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # LLM Integrations
    MISTRAL_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None

    # Email / SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    EMAIL_FROM_NAME: str = "AI Psychology Companion"

    # Pydantic Settings Config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


settings = Settings()