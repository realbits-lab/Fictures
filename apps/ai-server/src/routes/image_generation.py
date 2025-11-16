"""Image generation API routes."""

import logging
import time
import uuid
from fastapi import APIRouter, HTTPException, Depends
from src.schemas.image import ImageGenerationRequest, ImageGenerationResponse
from src.services.image_service_comfyui_api import qwen_comfyui_api_service as image_service
from src.auth import require_api_key, AuthResult

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/generate", response_model=ImageGenerationResponse)
async def generate_image(
    request: ImageGenerationRequest,
    auth: AuthResult = Depends(require_api_key)
):
    """
    Generate image using Qwen-Image-Lightning.

    This endpoint generates images based on text prompts using the Lightning model.
    Returns a base64-encoded PNG image.

    **Authentication**: Requires valid API key with `stories:write` scope.
    """
    request_id = f"img-{uuid.uuid4()}"
    start_time = time.perf_counter()
    try:
        # Check if user has required scope
        if not auth.has_scope("stories:write"):
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions. Required scope: stories:write"
            )

        logger.info(
            "[%s] Image generation request from user=%s promptPreview=%s negativePreview=%s",
            request_id,
            auth.email,
            request.prompt[:120],
            (request.negative_prompt or "")[:120],
        )

        # Validate dimensions
        if request.width and request.width > 2048:
            raise HTTPException(status_code=400, detail="Width too large (max 2048 pixels)")
        if request.height and request.height > 2048:
            raise HTTPException(status_code=400, detail="Height too large (max 2048 pixels)")

        logger.info(
            "[%s] Dispatching to image service width=%s height=%s steps=%s guidance=%s seed=%s",
            request_id,
            request.width,
            request.height,
            request.num_inference_steps,
            request.guidance_scale,
            request.seed,
        )

        # Generate image using Lightning service
        # Note: Pydantic defaults are width=1664, height=928 (16:9), steps=4, cfg=1.0
        result = await image_service.generate(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            width=request.width,  # Uses Pydantic default: 1664
            height=request.height,  # Uses Pydantic default: 928
            num_inference_steps=request.num_inference_steps,  # Uses Pydantic default: 4
            guidance_scale=request.guidance_scale,  # Uses Pydantic default: 1.0
            seed=request.seed,
            trace_id=request_id,
        )

        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        logger.info(
            "[%s] Image generation complete width=%s height=%s seed=%s steps=%s guidance=%s elapsedMs=%s",
            request_id,
            result.get("width"),
            result.get("height"),
            result.get("seed"),
            result.get("num_inference_steps"),
            request.guidance_scale,
            elapsed_ms,
        )

        return ImageGenerationResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("[%s] Image generation failed: %s", request_id, e)
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


@router.get("/models")
async def list_image_models(auth: AuthResult = Depends(require_api_key)):
    """
    List available image generation models.

    **Authentication**: Requires valid API key.
    """
    logger.info(f"Listing image models for user {auth.email}")
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
