from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Global Media Downloader"
    VERSION: str = "1.0.0"
    PORT: int = 8000
    DOWNLOAD_DIR: Path = Path(__file__).resolve().parent.parent.parent / "downloads"
    FILE_TTL_MINUTES: int = 30
    MAX_CONCURRENT_DOWNLOADS: int = 5
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "*",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
# Ensure download directory exists
settings.DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
