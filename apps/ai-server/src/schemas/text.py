"""Text generation request/response schemas."""

from typing import Optional, List
from pydantic import BaseModel, Field


class TextGenerationRequest(BaseModel):
    """Request schema for text generation."""

    prompt: str = Field(..., description="The text prompt for generation", min_length=1)
    max_tokens: Optional[int] = Field(
        default=2048, description="Maximum number of tokens to generate", ge=1, le=8192
    )
    temperature: Optional[float] = Field(
        default=0.7, description="Sampling temperature", ge=0.0, le=2.0
    )
    top_p: Optional[float] = Field(
        default=0.9, description="Nucleus sampling parameter", ge=0.0, le=1.0
    )
    stop_sequences: Optional[List[str]] = Field(
        default=None, description="Stop sequences to end generation"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "Write a short story about a magical forest",
                "max_tokens": 1024,
                "temperature": 0.8,
                "top_p": 0.9,
            }
        }


class TextGenerationResponse(BaseModel):
    """Response schema for text generation."""

    text: str = Field(..., description="The generated text")
    model: str = Field(..., description="Model used for generation")
    tokens_used: int = Field(..., description="Number of tokens used")
    finish_reason: str = Field(
        ..., description="Reason for generation completion (length, stop, etc.)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "text": "Once upon a time, in a magical forest...",
                "model": "llama-3.2-3b",
                "tokens_used": 512,
                "finish_reason": "stop",
            }
        }
