"""Text generation API routes."""

import logging
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from src.schemas.text import TextGenerationRequest, TextGenerationResponse, TextStreamResponse
from src.services.text_service import text_service
from src.auth import require_api_key, AuthResult

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/generate", response_model=TextGenerationResponse)
async def generate_text(
    request: TextGenerationRequest,
    auth: AuthResult = Depends(require_api_key)
):
    """
    Generate text using vLLM with Gemma model.

    This endpoint generates text synchronously and returns the complete result.
    For streaming responses, use the /stream endpoint.

    **Authentication**: Requires valid API key with `stories:write` scope.
    """
    try:
        # Check if user has required scope
        if not auth.has_scope("stories:write"):
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions. Required scope: stories:write"
            )

        logger.info(f"Received text generation request from user {auth.email}. Prompt length: {len(request.prompt)}")

        # Validate prompt length
        if len(request.prompt) > 8000:
            raise HTTPException(status_code=400, detail="Prompt too long (max 8000 characters)")

        # Generate text using service
        result = await text_service.generate(
            prompt=request.prompt,
            max_tokens=request.max_tokens or 2048,
            temperature=request.temperature or 0.7,
            top_p=request.top_p or 0.9,
            stop_sequences=request.stop_sequences,
        )

        return TextGenerationResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Text generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Text generation failed: {str(e)}")


@router.post("/stream")
async def stream_text(
    request: TextGenerationRequest,
    auth: AuthResult = Depends(require_api_key)
):
    """
    Generate text using vLLM with streaming response.

    This endpoint generates text progressively and streams the results as they are generated.
    Use this for real-time text generation in the UI.

    **Authentication**: Requires valid API key with `stories:write` scope.
    """
    try:
        # Check if user has required scope
        if not auth.has_scope("stories:write"):
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions. Required scope: stories:write"
            )

        logger.info(f"Received streaming text generation request from user {auth.email}. Prompt length: {len(request.prompt)}")

        # Validate prompt length
        if len(request.prompt) > 8000:
            raise HTTPException(status_code=400, detail="Prompt too long (max 8000 characters)")

        async def generate():
            """Generate streaming response."""
            try:
                async for chunk in text_service.generate_stream(
                    prompt=request.prompt,
                    max_tokens=request.max_tokens or 2048,
                    temperature=request.temperature or 0.7,
                    top_p=request.top_p or 0.9,
                    stop_sequences=request.stop_sequences,
                ):
                    # Send as Server-Sent Events format
                    yield f"data: {TextStreamResponse(**chunk).model_dump_json()}\n\n"
            except Exception as e:
                logger.error(f"Streaming generation failed: {e}")
                yield f"data: {{'error': '{str(e)}'}}\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Streaming setup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Streaming setup failed: {str(e)}")


@router.get("/models")
async def list_text_models(auth: AuthResult = Depends(require_api_key)):
    """
    List available text generation models.

    **Authentication**: Requires valid API key.
    """
    logger.info(f"Listing text models for user {auth.email}")
    model_info = await text_service.get_model_info()

    return {
        "models": [
            {
                "id": model_info["name"],
                "name": model_info["name"],
                "type": model_info["type"],
                "framework": model_info["framework"],
                "max_tokens": model_info["max_tokens"],
                "status": "initialized" if model_info["initialized"] else "not_loaded",
            }
        ]
    }
