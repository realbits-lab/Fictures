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
    workers: int = 1

    # Text Generation Model Configuration
    text_model_name: str = "google/gemma-2b-it"
    text_model_path: str = "./models/text/gemma-2b-it"
    text_max_model_len: int = 4096
    text_gpu_memory_utilization: float = 0.5

    # Image Generation Model Configuration
    image_model_name: str = "stabilityai/stable-diffusion-xl-base-1.0"
    image_model_path: str = "./models/images/stable-diffusion-xl-base-1.0"
    image_gpu_memory_utilization: float = 0.9

    # GPU Configuration
    cuda_visible_devices: str = "0"
    model_cache_dir: str = "~/.cache/huggingface"

    # vLLM Configuration
    vllm_tensor_parallel_size: int = 1
    vllm_max_num_seqs: int = 256

    # Diffusers Configuration
    diffusers_enable_cpu_offload: bool = False

    # CORS Configuration
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Request Limits
    max_prompt_length: int = 2048
    max_image_size: int = 2048
    default_timeout: int = 300

    # Logging
    log_level: str = "INFO"
    log_format: str = "json"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


# Global settings instance
settings = Settings()
