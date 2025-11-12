"""Text generation API routes."""

import logging
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from src.schemas.text import (
    TextGenerationRequest,
    TextGenerationResponse,
    TextStreamResponse,
    StructuredOutputRequest,
    StructuredOutputResponse,
)
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

        # Validate prompt length (Qwen3-14B-AWQ supports 131K tokens with YaRN ≈ 160K chars)
        if len(request.prompt) > 160000:
            raise HTTPException(status_code=400, detail="Prompt too long (max 160000 characters)")

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

        # Validate prompt length (Qwen3-14B-AWQ supports 131K tokens with YaRN ≈ 160K chars)
        if len(request.prompt) > 160000:
            raise HTTPException(status_code=400, detail="Prompt too long (max 160000 characters)")

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


@router.post("/structured", response_model=StructuredOutputResponse)
async def generate_structured_output(
    request: StructuredOutputRequest,
    auth: AuthResult = Depends(require_api_key)
):
    """
    Generate structured output using vLLM guided decoding.

    This endpoint generates text that conforms to a specific structure (JSON schema, regex, etc.)
    using vLLM's guided decoding feature with xgrammar/outlines backends.

    Supported guided decoding types:
    - **json**: Generate output conforming to a JSON schema
    - **regex**: Generate output matching a regular expression
    - **choice**: Generate output that is one of the specified choices
    - **grammar**: Generate output conforming to a context-free grammar

    **Authentication**: Requires valid API key with `stories:write` scope.
    """
    try:
        # Check if user has required scope
        if not auth.has_scope("stories:write"):
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions. Required scope: stories:write"
            )

        logger.info(
            f"Received structured output request from user {auth.email}. "
            f"Type: {request.guided_decoding.type}, Prompt length: {len(request.prompt)}"
        )

        # Validate prompt length (Qwen3-14B-AWQ supports 131K tokens with YaRN ≈ 160K chars)
        if len(request.prompt) > 160000:
            raise HTTPException(status_code=400, detail="Prompt too long (max 160000 characters)")

        # Extract guided decoding config
        guided_config = request.guided_decoding

        # Validate guided decoding configuration
        if guided_config.type == "json" and not guided_config.schema:
            raise HTTPException(status_code=400, detail="JSON schema required for type 'json'")
        elif guided_config.type == "regex" and not guided_config.pattern:
            raise HTTPException(status_code=400, detail="Regex pattern required for type 'regex'")
        elif guided_config.type == "choice" and not guided_config.choices:
            raise HTTPException(status_code=400, detail="Choices required for type 'choice'")
        elif guided_config.type == "grammar" and not guided_config.grammar:
            raise HTTPException(status_code=400, detail="Grammar required for type 'grammar'")

        # Generate structured output using service
        result = await text_service.generate_structured(
            prompt=request.prompt,
            guided_type=guided_config.type,
            json_schema=guided_config.schema,
            regex_pattern=guided_config.pattern,
            choices=guided_config.choices,
            grammar=guided_config.grammar,
            max_tokens=request.max_tokens or 2048,
            temperature=request.temperature or 0.7,
            top_p=request.top_p or 0.9,
        )

        return StructuredOutputResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Structured output generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Structured output generation failed: {str(e)}")


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
