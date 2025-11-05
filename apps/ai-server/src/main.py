"""FastAPI main application for Fictures AI Server."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.routes import text_generation, image_generation

app = FastAPI(
    title="Fictures AI Server",
    description="Local AI model serving for text and image generation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration for Next.js development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(text_generation.router, prefix="/api/v1/text", tags=["text-generation"])
app.include_router(image_generation.router, prefix="/api/v1/images", tags=["image-generation"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Fictures AI Server",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return JSONResponse(
        content={
            "status": "healthy",
            "version": "1.0.0",
        }
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
