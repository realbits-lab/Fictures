"""Text generation request/response schemas."""

from typing import Optional, List, Dict, Any, Literal
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
                "model": "google/gemma-2b-it",
                "tokens_used": 512,
                "finish_reason": "stop",
            }
        }


class TextStreamResponse(BaseModel):
    """Response schema for streaming text generation."""

    text: str = Field(..., description="The generated text (cumulative)")
    model: str = Field(..., description="Model used for generation")
    tokens_used: int = Field(..., description="Number of tokens generated so far")
    finish_reason: Optional[str] = Field(
        default=None, description="Reason for completion (only in final chunk)"
    )
    done: bool = Field(..., description="Whether generation is complete")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "Once upon a time...",
                "model": "google/gemma-2b-it",
                "tokens_used": 10,
                "finish_reason": None,
                "done": False,
            }
        }


class GuidedDecodingConfig(BaseModel):
    """Configuration for guided decoding (structured output)."""

    type: Literal["json", "regex", "choice", "grammar"] = Field(
        ..., description="Type of guided decoding constraint"
    )
    schema: Optional[Dict[str, Any]] = Field(
        default=None, description="JSON schema for 'json' type"
    )
    pattern: Optional[str] = Field(
        default=None, description="Regex pattern for 'regex' type"
    )
    choices: Optional[List[str]] = Field(
        default=None, description="Valid choices for 'choice' type"
    )
    grammar: Optional[str] = Field(
        default=None, description="Context-free grammar for 'grammar' type"
    )

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "type": "json",
                    "schema": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "age": {"type": "integer"}
                        },
                        "required": ["name", "age"]
                    }
                },
                {
                    "type": "choice",
                    "choices": ["positive", "negative", "neutral"]
                },
                {
                    "type": "regex",
                    "pattern": r"\d{3}-\d{3}-\d{4}"
                }
            ]
        }


class StructuredOutputRequest(BaseModel):
    """Request schema for structured output generation."""

    prompt: str = Field(..., description="The text prompt for generation", min_length=1)
    guided_decoding: GuidedDecodingConfig = Field(
        ..., description="Guided decoding configuration for structured output"
    )
    max_tokens: Optional[int] = Field(
        default=2048, description="Maximum number of tokens to generate", ge=1, le=8192
    )
    temperature: Optional[float] = Field(
        default=0.7, description="Sampling temperature", ge=0.0, le=2.0
    )
    top_p: Optional[float] = Field(
        default=0.9, description="Nucleus sampling parameter", ge=0.0, le=1.0
    )

    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "Generate a character profile for a fantasy wizard",
                "guided_decoding": {
                    "type": "json",
                    "schema": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "age": {"type": "integer"},
                            "specialty": {"type": "string"}
                        },
                        "required": ["name", "age", "specialty"]
                    }
                },
                "max_tokens": 500,
                "temperature": 0.7
            }
        }


class StructuredOutputResponse(BaseModel):
    """Response schema for structured output generation."""

    output: str = Field(..., description="The generated structured output (JSON string, regex match, or choice)")
    parsed_output: Optional[Dict[str, Any]] = Field(
        default=None, description="Parsed JSON output (only for JSON type)"
    )
    model: str = Field(..., description="Model used for generation")
    tokens_used: int = Field(..., description="Number of tokens used")
    finish_reason: str = Field(
        ..., description="Reason for generation completion"
    )
    is_valid: bool = Field(
        ..., description="Whether the output conforms to the specified schema/pattern"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "output": '{"name": "Gandalf", "age": 2019, "specialty": "Fire magic"}',
                "parsed_output": {
                    "name": "Gandalf",
                    "age": 2019,
                    "specialty": "Fire magic"
                },
                "model": "Qwen/Qwen3-14B-AWQ",
                "tokens_used": 45,
                "finish_reason": "stop",
                "is_valid": True
            }
        }
