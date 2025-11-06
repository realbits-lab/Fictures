"""Image generation service using Stable Diffusion XL."""

import asyncio
import logging
import base64
import io
from typing import Optional
import torch
from diffusers import StableDiffusionXLPipeline, DPMSolverMultistepScheduler
from PIL import Image
from src.config import settings

logger = logging.getLogger(__name__)


class ImageGenerationService:
    """Service for image generation using Stable Diffusion XL."""

    def __init__(self):
        """Initialize the image generation service."""
        self.pipeline: Optional[StableDiffusionXLPipeline] = None
        self.model_name = settings.image_model_name
        self._initialized = False
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

    async def initialize(self):
        """Initialize the Stable Diffusion XL pipeline."""
        if self._initialized:
            logger.info("Image generation service already initialized")
            return

        try:
            logger.info(f"Initializing SDXL pipeline with model: {self.model_name}")
            logger.info(f"Using device: {self.device}")

            # Run pipeline loading in executor to avoid blocking
            loop = asyncio.get_event_loop()
            self.pipeline = await loop.run_in_executor(
                None, self._load_pipeline
            )

            self._initialized = True
            logger.info("SDXL pipeline initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize SDXL pipeline: {e}")
            raise

    def _load_pipeline(self) -> StableDiffusionXLPipeline:
        """Load the SDXL pipeline (blocking operation)."""
        # Load pipeline
        pipeline = StableDiffusionXLPipeline.from_pretrained(
            self.model_name,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            use_safetensors=True,
            variant="fp16" if self.device == "cuda" else None,
        )

        # Use DPM-Solver++ scheduler for faster inference
        pipeline.scheduler = DPMSolverMultistepScheduler.from_config(
            pipeline.scheduler.config
        )

        # Move to GPU if available
        pipeline = pipeline.to(self.device)

        # Enable memory optimizations
        if self.device == "cuda":
            # Enable attention slicing for memory efficiency
            pipeline.enable_attention_slicing()

            # Enable VAE slicing for large images
            pipeline.enable_vae_slicing()

            # Enable CPU offload if configured
            if settings.diffusers_enable_cpu_offload:
                pipeline.enable_model_cpu_offload()

        return pipeline

    async def generate(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        width: int = 1344,
        height: int = 768,
        num_inference_steps: int = 30,
        guidance_scale: float = 7.5,
        seed: Optional[int] = None,
    ) -> dict:
        """
        Generate image using Stable Diffusion XL.

        Args:
            prompt: Text prompt for image generation
            negative_prompt: Negative prompt to avoid certain features
            width: Image width in pixels
            height: Image height in pixels
            num_inference_steps: Number of denoising steps
            guidance_scale: Guidance scale for prompt adherence
            seed: Random seed for reproducibility

        Returns:
            Dictionary containing base64 encoded image and metadata
        """
        if not self._initialized or self.pipeline is None:
            await self.initialize()

        try:
            logger.info(f"Generating image with prompt: {prompt[:100]}...")

            # Set random seed if provided
            generator = None
            if seed is not None:
                generator = torch.Generator(device=self.device).manual_seed(seed)
            else:
                seed = torch.randint(0, 2**32 - 1, (1,)).item()
                generator = torch.Generator(device=self.device).manual_seed(seed)

            # Run generation in executor to avoid blocking
            loop = asyncio.get_event_loop()
            image = await loop.run_in_executor(
                None,
                self._generate_image,
                prompt,
                negative_prompt,
                width,
                height,
                num_inference_steps,
                guidance_scale,
                generator,
            )

            # Convert image to base64
            image_base64 = self._image_to_base64(image)

            logger.info(f"Image generation completed. Size: {width}x{height}, Seed: {seed}")

            return {
                "image_url": f"data:image/png;base64,{image_base64}",
                "model": self.model_name,
                "width": width,
                "height": height,
                "seed": seed,
            }

        except Exception as e:
            logger.error(f"Image generation failed: {e}")
            raise

    def _generate_image(
        self,
        prompt: str,
        negative_prompt: Optional[str],
        width: int,
        height: int,
        num_inference_steps: int,
        guidance_scale: float,
        generator: torch.Generator,
    ) -> Image.Image:
        """Generate image (blocking operation)."""
        result = self.pipeline(
            prompt=prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            generator=generator,
        )
        return result.images[0]

    def _image_to_base64(self, image: Image.Image) -> str:
        """Convert PIL Image to base64 string."""
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        img_bytes = buffered.getvalue()
        img_base64 = base64.b64encode(img_bytes).decode("utf-8")
        return img_base64

    async def get_model_info(self) -> dict:
        """Get information about the loaded model."""
        return {
            "name": self.model_name,
            "type": "image-generation",
            "framework": "diffusers",
            "device": self.device,
            "initialized": self._initialized,
        }

    async def shutdown(self):
        """Shutdown the pipeline and free resources."""
        if self.pipeline:
            logger.info("Shutting down SDXL pipeline")
            # Clear CUDA cache if using GPU
            if self.device == "cuda":
                torch.cuda.empty_cache()
            self.pipeline = None
            self._initialized = False


# Global service instance
image_service = ImageGenerationService()
