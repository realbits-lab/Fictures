"""Image generation request/response schemas."""

from typing import Optional, Literal
from pydantic import BaseModel, Field


class ImageGenerationRequest(BaseModel):
    """Request schema for image generation."""

    prompt: str = Field(..., description="The text prompt for image generation", min_length=1)
    negative_prompt: Optional[str] = Field(
        default=None, description="Negative prompt to avoid certain features"
    )
    width: Optional[int] = Field(default=1344, description="Image width in pixels", ge=256, le=2048)
    height: Optional[int] = Field(default=768, description="Image height in pixels", ge=256, le=2048)
    num_inference_steps: Optional[int] = Field(
        default=30, description="Number of denoising steps", ge=1, le=100
    )
    guidance_scale: Optional[float] = Field(
        default=7.5, description="Guidance scale for prompt adherence", ge=1.0, le=20.0
    )
    seed: Optional[int] = Field(default=None, description="Random seed for reproducibility")

    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "A serene forest at twilight, cinematic widescreen, highly detailed",
                "negative_prompt": "blurry, low quality, distorted",
                "width": 1344,
                "height": 768,
                "num_inference_steps": 30,
                "guidance_scale": 7.5,
            }
        }


class ImageGenerationResponse(BaseModel):
    """Response schema for image generation."""

    image_url: str = Field(..., description="URL or base64 encoded image data")
    model: str = Field(..., description="Model used for generation")
    width: int = Field(..., description="Generated image width")
    height: int = Field(..., description="Generated image height")
    seed: int = Field(..., description="Seed used for generation")

    class Config:
        json_schema_extra = {
            "example": {
                "image_url": "data:image/png;base64,iVBORw0KGgoAAAANS...",
                "model": "stable-diffusion-xl",
                "width": 1344,
                "height": 768,
                "seed": 42,
            }
        }
