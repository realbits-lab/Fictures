"""Configuration management for Fictures AI Server."""

import os
from typing import List, Literal
from pydantic_settings import BaseSettings, SettingsConfigDict

# Constants
API_HOST = "0.0.0.0"
API_PORT = 8000
CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
LOG_LEVEL = "INFO"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env.local", env_file_encoding="utf-8", extra="ignore")

    # Generation Mode Configuration
    # Options:
    # - "text": Only text generation (vLLM, uses ~10GB VRAM)
    # - "image": Only image generation (ComfyUI, uses ~8GB VRAM)
    ai_server_generation_mode: Literal["text", "image"] = "image"

    # ComfyUI Configuration (External Image Generation Server)
    # ComfyUI runs as separate process and manages its own models
    ai_server_comfyui_url: str = "http://127.0.0.1:8188"

    # Database Configuration (for API key authentication)
    database_url: str = ""  # PostgreSQL connection string from web app

    # Text Generation Configuration (vLLM with Qwen AWQ models)
    text_model_name: str = "Qwen/Qwen3-14B-AWQ"  # 14B params, 4-bit AWQ quantization
    vllm_quantization: str = "awq"  # AWQ quantization method
    vllm_tensor_parallel_size: int = 1  # Number of GPUs for tensor parallelism
    text_max_model_len: int = 16384  # Maximum sequence length (16K - optimized for scene generation)
    text_gpu_memory_utilization: float = 0.75  # GPU memory utilization (0.0-1.0) - reduced to 0.75 to accommodate other processes and warmup
    vllm_max_num_seqs: int = 64  # Maximum number of sequences in a batch - reduced to 64 to lower memory usage during warmup


# Global settings instance
settings = Settings()
