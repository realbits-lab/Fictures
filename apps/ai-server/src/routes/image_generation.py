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
    
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    logger.info("[AI-SERVER] 🎨 Image generation request received")
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    logger.info(f"[AI-SERVER] Request ID: {request_id}")
    logger.info(f"[AI-SERVER] User: {auth.email}")
    logger.info(f"[AI-SERVER] User ID: {auth.user_id}")
    logger.info(f"[AI-SERVER] Has stories:write scope: {auth.has_scope('stories:write')}")
    
    try:
        # Check if user has required scope
        if not auth.has_scope("stories:write"):
            logger.error(f"[AI-SERVER] ❌ Insufficient permissions for user {auth.email}")
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions. Required scope: stories:write"
            )

        logger.info(
            "[AI-SERVER] Request details: promptPreview=%s negativePreview=%s width=%s height=%s steps=%s guidance=%s seed=%s",
            request.prompt[:120],
            (request.negative_prompt or "")[:120],
            request.width,
            request.height,
            request.num_inference_steps,
            request.guidance_scale,
            request.seed,
        )

        # Validate dimensions
        logger.info(f"[AI-SERVER] Validating dimensions: width={request.width}, height={request.height}")
        if request.width and request.width > 2048:
            logger.error(f"[AI-SERVER] ❌ Width too large: {request.width}")
            raise HTTPException(status_code=400, detail="Width too large (max 2048 pixels)")
        if request.height and request.height > 2048:
            logger.error(f"[AI-SERVER] ❌ Height too large: {request.height}")
            raise HTTPException(status_code=400, detail="Height too large (max 2048 pixels)")

        logger.info(f"[AI-SERVER] ✅ Validation passed")
        logger.info(f"[AI-SERVER] Dispatching to image service...")
        logger.info(f"[AI-SERVER] Parameters: width={request.width} height={request.height} steps={request.num_inference_steps} guidance={request.guidance_scale} seed={request.seed}")

        # Generate image using Lightning service
        # Note: Pydantic defaults are width=1664, height=928 (16:9), steps=4, cfg=1.0
        logger.info(f"[AI-SERVER] Calling image_service.generate()...")
        try:
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
            logger.info(f"[AI-SERVER] ✅ image_service.generate() completed")
        except Exception as service_error:
            logger.error(f"[AI-SERVER] ❌ image_service.generate() failed: {service_error}")
            logger.error(f"[AI-SERVER] Error type: {type(service_error).__name__}")
            logger.error(f"[AI-SERVER] Error message: {str(service_error)}")
            import traceback
            logger.error(f"[AI-SERVER] Error traceback:\n{traceback.format_exc()}")
            raise

        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        logger.info(f"[AI-SERVER] ✅ Image generation complete")
        logger.info(f"[AI-SERVER] Result: width={result.get('width')} height={result.get('height')} seed={result.get('seed')} steps={result.get('num_inference_steps')} elapsedMs={elapsed_ms}")
        logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

        return ImageGenerationResponse(**result)

    except HTTPException:
        logger.error(f"[AI-SERVER] ❌ HTTPException raised")
        raise
    except Exception as e:
        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        logger.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        logger.error(f"[AI-SERVER] ❌ Image generation failed after {elapsed_ms}ms")
        logger.error(f"[AI-SERVER] Error type: {type(e).__name__}")
        logger.error(f"[AI-SERVER] Error message: {str(e)}")
        import traceback
        logger.error(f"[AI-SERVER] Error traceback:\n{traceback.format_exc()}")
        logger.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
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
