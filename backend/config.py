from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    APP_NAME: str = "NoSo Company API"
    ENV: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    MONGO_URI: str = "mongodb://localhost:27017/"
    DB_NAME: str = "noso_company"

    # Stripe
    STRIPE_SECRET_KEY: str
    STRIPE_PUBLISHABLE_KEY: str
    CURRENCY: str = "usd"

    # File Upload
    UPLOAD_FOLDER: str = "uploads/images/bookings"
    MAX_FILE_SIZE: int = 16 * 1024 * 1024  # 16MB

    # Frontend URL (for Stripe redirects)
    FRONTEND_URL: str = "http://localhost:5173"
    APP_BASE_URL: Optional[str] = None
    PRODUCTION_DOMAIN: Optional[str] = None

    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175"]

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
