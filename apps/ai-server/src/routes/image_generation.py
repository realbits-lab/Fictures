"""Image generation API routes."""

import logging
from fastapi import APIRouter, HTTPException
from src.schemas.image import ImageGenerationRequest, ImageGenerationResponse
from src.services.image_service import image_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/generate", response_model=ImageGenerationResponse)
async def generate_image(request: ImageGenerationRequest):
    """
    Generate image using Stable Diffusion XL.

    This endpoint generates images based on text prompts using the SDXL model.
    Returns a base64-encoded PNG image.
    """
    try:
        logger.info(f"Received image generation request. Prompt: {request.prompt[:100]}...")

        # Validate dimensions
        if request.width and request.width > 2048:
            raise HTTPException(status_code=400, detail="Width too large (max 2048 pixels)")
        if request.height and request.height > 2048:
            raise HTTPException(status_code=400, detail="Height too large (max 2048 pixels)")

        # Generate image using service
        result = await image_service.generate(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            width=request.width or 1344,
            height=request.height or 768,
            num_inference_steps=request.num_inference_steps or 30,
            guidance_scale=request.guidance_scale or 7.5,
            seed=request.seed,
        )

        return ImageGenerationResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


@router.get("/models")
async def list_image_models():
    """List available image generation models."""
    model_info = await image_service.get_model_info()

    return {
        "models": [
            {
                "id": model_info["name"],
                "name": model_info["name"],
                "type": model_info["type"],
                "framework": model_info["framework"],
                "device": model_info["device"],
                "status": "initialized" if model_info["initialized"] else "not_loaded",
            }
        ]
    }
