"""Image generation request/response schemas."""

from typing import Optional, Literal
from pydantic import BaseModel, Field


class ImageGenerationRequest(BaseModel):
    """Request schema for image generation.

    Qwen-Image-Lightning official supported resolutions:
    - 1:1 (square): 1328×1328
    - 16:9 (widescreen): 1664×928
    - 9:16 (portrait): 928×1664
    - 4:3 (classic): 1472×1140
    - 3:4 (portrait): 1140×1472
    """

    prompt: str = Field(..., description="The text prompt for image generation", min_length=1)
    negative_prompt: Optional[str] = Field(
        default=None, description="Negative prompt to avoid certain features"
    )
    width: Optional[int] = Field(default=1664, description="Image width in pixels (default 1664 for 16:9)", ge=256, le=2048)
    height: Optional[int] = Field(default=928, description="Image height in pixels (default 928 for 16:9)", ge=256, le=2048)
    num_inference_steps: Optional[int] = Field(
        default=4, description="Number of denoising steps (Lightning v2.0: 4 steps optimal)", ge=1, le=100
    )
    guidance_scale: Optional[float] = Field(
        default=1.0, description="Guidance scale for prompt adherence (Lightning: 1.0)", ge=1.0, le=20.0
    )
    seed: Optional[int] = Field(default=None, description="Random seed for reproducibility")

    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "A serene forest at twilight, cinematic widescreen, highly detailed",
                "negative_prompt": "blurry, low quality, distorted",
                "width": 1664,
                "height": 928,
                "num_inference_steps": 4,
                "guidance_scale": 1.0,
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
                "model": "Qwen-Image FP8 + Lightning v2.0 4-step",
                "width": 1664,
                "height": 928,
                "seed": 42,
            }
        }
