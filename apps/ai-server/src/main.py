"""FastAPI main application for Fictures AI Server."""

# IMPORTANT: Set CUDA environment variables BEFORE any other imports
# This ensures vLLM and triton can find CUDA libraries during initialization
import os
os.environ.setdefault("CUDA_HOME", "/usr/local/cuda-12.6")
os.environ["PATH"] = f"/usr/local/cuda-12.6/bin:{os.environ.get('PATH', '')}"
os.environ["LD_LIBRARY_PATH"] = f"/usr/local/cuda-12.6/lib64:{os.environ.get('LD_LIBRARY_PATH', '')}"
os.environ.setdefault("VLLM_TORCH_COMPILE_LEVEL", "0")  # Disable torch compilation

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config import settings, API_HOST, API_PORT, CORS_ORIGINS, LOG_LEVEL

# Conditional imports based on GENERATION_MODE
if settings.generation_mode in ["text", "both"]:
    from src.routes import text_generation
    from src.services.text_service import text_service

if settings.generation_mode in ["image", "both"]:
    from src.routes import image_generation
    from src.services.image_service_comfyui_api import qwen_comfyui_api_service as image_service

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    # Startup
    logger.info(f"Starting Fictures AI Server (mode: {settings.generation_mode})...")

    if settings.generation_mode in ["text", "both"]:
        logger.info("Text generation: ENABLED (vLLM with Qwen3-14B-AWQ)")
        logger.info("Text service configured for lazy initialization")

    if settings.generation_mode in ["image", "both"]:
        logger.info("Image generation: ENABLED (Qwen-Image-Lightning v2.0 FP8 via ComfyUI)")
        logger.info(f"ComfyUI server: {settings.comfyui_url}")
        logger.info("Image service configured for lazy initialization")

    yield

    # Shutdown
    logger.info("Shutting down Fictures AI Server...")

    if settings.generation_mode in ["text", "both"]:
        await text_service.shutdown()
        logger.info("Text service shut down")

    if settings.generation_mode in ["image", "both"]:
        await image_service.shutdown()
        logger.info("Image service shut down")

    logger.info("Shutdown complete")


app = FastAPI(
    title="Fictures AI Server",
    description="Local AI model serving for text and image generation using vLLM and Stable Diffusion XL",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers based on GENERATION_MODE
if settings.generation_mode in ["text", "both"]:
    app.include_router(text_generation.router, prefix="/api/v1/text", tags=["text-generation"])

if settings.generation_mode in ["image", "both"]:
    app.include_router(image_generation.router, prefix="/api/v1/images", tags=["image-generation"])


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Fictures AI Server",
        "version": "1.0.0",
        "description": "Local AI model serving for text and image generation",
        "endpoints": {
            "docs": "/docs",
            "redoc": "/redoc",
            "health": "/health",
            "models": "/api/v1/models",
        },
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    models = {}

    if settings.generation_mode in ["text", "both"]:
        text_info = await text_service.get_model_info()
        models["text"] = text_info

    if settings.generation_mode in ["image", "both"]:
        image_info = await image_service.get_model_info()
        models["image"] = image_info

    return JSONResponse(
        content={
            "status": "healthy",
            "version": "1.0.0",
            "generation_mode": settings.generation_mode,
            "models": models,
        }
    )


@app.get("/api/v1/models")
async def list_models():
    """List all available models."""
    models = {"generation_mode": settings.generation_mode}

    if settings.generation_mode in ["text", "both"]:
        text_info = await text_service.get_model_info()
        models["text_generation"] = [text_info]

    if settings.generation_mode in ["image", "both"]:
        image_info = await image_service.get_model_info()
        models["image_generation"] = [image_info]

    return models


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=API_HOST,
        port=API_PORT,
    )
