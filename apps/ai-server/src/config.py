"""Configuration management for Fictures AI Server."""

import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Server Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # ComfyUI Configuration (External Image Generation Server)
    # ComfyUI runs as separate process and manages its own models
    comfyui_url: str = "http://127.0.0.1:8188"

    # CORS Configuration
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Logging
    log_level: str = "INFO"

    # Database Configuration (for API key authentication)
    database_url: str = ""  # PostgreSQL connection string from web app

    # Authentication
    require_api_key: bool = True  # Set to False to disable authentication

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


# Global settings instance
settings = Settings()
