"""Image generation API routes."""

from fastapi import APIRouter, HTTPException
from src.schemas.image import ImageGenerationRequest, ImageGenerationResponse

router = APIRouter()


@router.post("/generate", response_model=ImageGenerationResponse)
async def generate_image(request: ImageGenerationRequest):
    """
    Generate image using local diffusion model.

    This is a placeholder implementation. Replace with actual model loading and inference.
    """
    try:
        # TODO: Load and use actual local model (e.g., Stable Diffusion XL, FLUX)
        # Example:
        # from src.services.image_service import generate_image_with_model
        # result = await generate_image_with_model(request)

        # Placeholder response
        seed = request.seed if request.seed is not None else 42
        return ImageGenerationResponse(
            image_url="data:image/png;base64,placeholder",  # Replace with actual image
            model="stable-diffusion-xl",  # Replace with actual model name
            width=request.width or 1344,
            height=request.height or 768,
            seed=seed,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


@router.get("/models")
async def list_image_models():
    """List available image generation models."""
    return {
        "models": [
            {
                "id": "stable-diffusion-xl",
                "name": "Stable Diffusion XL",
                "description": "High-quality image generation with SDXL",
                "status": "available",
            },
            {
                "id": "flux-schnell",
                "name": "FLUX.1 Schnell",
                "description": "Fast image generation with FLUX",
                "status": "available",
            },
            # Add more models as needed
        ]
    }
