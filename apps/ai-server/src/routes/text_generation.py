"""Text generation API routes."""

from fastapi import APIRouter, HTTPException
from src.schemas.text import TextGenerationRequest, TextGenerationResponse

router = APIRouter()


@router.post("/generate", response_model=TextGenerationResponse)
async def generate_text(request: TextGenerationRequest):
    """
    Generate text using local language model.

    This is a placeholder implementation. Replace with actual model loading and inference.
    """
    try:
        # TODO: Load and use actual local model (e.g., Llama, Mistral)
        # Example:
        # from src.services.text_service import generate_text_with_model
        # result = await generate_text_with_model(request)

        # Placeholder response
        return TextGenerationResponse(
            text=f"[Generated text based on: {request.prompt[:50]}...]",
            model="llama-3.2-3b",  # Replace with actual model name
            tokens_used=len(request.prompt.split()),
            finish_reason="stop",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text generation failed: {str(e)}")


@router.get("/models")
async def list_text_models():
    """List available text generation models."""
    return {
        "models": [
            {
                "id": "llama-3.2-3b",
                "name": "Llama 3.2 3B",
                "description": "Fast, efficient text generation",
                "status": "available",
            },
            # Add more models as needed
        ]
    }
