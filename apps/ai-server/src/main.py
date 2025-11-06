"""FastAPI main application for Fictures AI Server."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config import settings
from src.routes import image_generation
# Text generation disabled - using full GPU for image generation only
# from src.routes import text_generation
# from src.services.text_service import text_service
from src.services.image_service_qwen import qwen_image_service as image_service

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    # Startup
    logger.info("Starting Fictures AI Server (Image Generation Only)...")
    logger.info(f"Image model: {settings.image_model_name}")
    logger.info(f"Text generation: DISABLED (full GPU for images)")

    # Initialize services (lazy loading - only when first request comes)
    # Services will initialize themselves on first use
    logger.info("Image service configured for lazy initialization")

    yield

    # Shutdown
    logger.info("Shutting down Fictures AI Server...")
    # await text_service.shutdown()  # Text service disabled
    await image_service.shutdown()
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
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
# app.include_router(text_generation.router, prefix="/api/v1/text", tags=["text-generation"])  # Disabled
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
    # text_info = await text_service.get_model_info()  # Disabled
    image_info = await image_service.get_model_info()

    return JSONResponse(
        content={
            "status": "healthy",
            "version": "1.0.0",
            "note": "Text generation disabled - image generation only",
            "models": {
                # "text": text_info,  # Disabled
                "image": image_info,
            },
        }
    )


@app.get("/api/v1/models")
async def list_models():
    """List all available models."""
    # text_info = await text_service.get_model_info()  # Disabled
    image_info = await image_service.get_model_info()

    return {
        # "text_generation": [text_info],  # Disabled
        "image_generation": [image_info],
        "note": "Text generation disabled - using full GPU for image generation",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=settings.api_host,
        port=settings.api_port,
        workers=settings.workers,
    )
