"""Configuration management for Fictures AI Server."""

import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

# Constants
API_HOST = "0.0.0.0"
API_PORT = 8000
CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
LOG_LEVEL = "INFO"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ComfyUI Configuration (External Image Generation Server)
    # ComfyUI runs as separate process and manages its own models
    comfyui_url: str = "http://127.0.0.1:8188"

    # Database Configuration (for API key authentication)
    database_url: str = ""  # PostgreSQL connection string from web app


# Global settings instance
settings = Settings()
