"""Image generation service using Qwen-Image-Lightning with Diffusers.

Qwen-Image-Lightning is a distilled version that's 12-25× faster than base Qwen-Image.
Uses LoRA adapter on top of base Qwen-Image model.
Optimized for RTX 4090 24GB with full GPU memory (no text model).
"""

import asyncio
import logging
import base64
import io
import math
from typing import Optional
import torch
from diffusers import DiffusionPipeline, FlowMatchEulerDiscreteScheduler
from PIL import Image
from src.config import settings
from src.utils.gpu_utils import cleanup_gpu_memory, get_gpu_memory_info

logger = logging.getLogger(__name__)


class QwenImageLightningService:
    """Service for image generation using Qwen-Image-Lightning with Diffusers."""

    def __init__(self):
        """Initialize the Qwen-Image-Lightning generation service."""
        self.pipeline: Optional[DiffusionPipeline] = None
        self.base_model = "Qwen/Qwen-Image"
        self.lightning_lora = "lightx2v/Qwen-Image-Lightning"
        self.lora_weight_name = "Qwen-Image-Lightning-8steps-V1.0.safetensors"
        self._initialized = False
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

    async def initialize(self):
        """Initialize the Qwen-Image-Lightning pipeline."""
        if self._initialized:
            logger.info("Qwen-Image-Lightning service already initialized")
            return

        try:
            # Clean GPU memory before loading model
            logger.info("Preparing GPU for Qwen-Image-Lightning loading...")
            cleanup_gpu_memory(force=True)

            mem_info = get_gpu_memory_info()
            if mem_info["available"]:
                logger.info(f"GPU Memory available: {mem_info['free']:.2f}GB free")

            logger.info(f"Initializing Qwen-Image-Lightning pipeline")
            logger.info(f"Base model: {self.base_model}")
            logger.info(f"Lightning LoRA: {self.lightning_lora}")
            logger.info(f"Using device: {self.device}")

            # Run pipeline loading in executor to avoid blocking
            loop = asyncio.get_event_loop()
            self.pipeline = await loop.run_in_executor(
                None, self._load_pipeline
            )

            self._initialized = True

            logger.info("Qwen-Image-Lightning pipeline initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize Qwen-Image-Lightning pipeline: {e}")
            raise

    def _load_pipeline(self) -> DiffusionPipeline:
        """Load the Qwen-Image-Lightning pipeline (blocking operation)."""
        logger.info("Loading Qwen-Image base model with Lightning LoRA...")

        # Configure scheduler for Lightning (from official example)
        scheduler_config = {
            "base_image_seq_len": 256,
            "base_shift": math.log(3),
            "max_image_seq_len": 8192,
            "num_train_timesteps": 1000,
            "shift": 1.0,
            "use_dynamic_shifting": True,
        }
        scheduler = FlowMatchEulerDiscreteScheduler.from_config(scheduler_config)

        # Load base Qwen-Image pipeline with CPU offloading for 24GB GPU
        logger.info("Loading base Qwen-Image pipeline with CPU offloading...")
        pipeline = DiffusionPipeline.from_pretrained(
            self.base_model,
            scheduler=scheduler,
            torch_dtype=torch.bfloat16,
        )

        # Enable sequential CPU offload for 24GB GPU (more aggressive, slower but fits)
        logger.info("Enabling sequential CPU offload (moves each component to GPU only when needed)...")
        pipeline.enable_sequential_cpu_offload()

        # Load Lightning LoRA adapter with specific weight file
        logger.info(f"Loading Lightning LoRA adapter: {self.lora_weight_name}...")
        pipeline.load_lora_weights(
            self.lightning_lora,
            weight_name=self.lora_weight_name
        )

        logger.info("Qwen-Image-Lightning pipeline loaded successfully")
        logger.info("Mode: 8-step fast inference with LoRA")

        return pipeline

    async def generate(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        width: int = 1024,
        height: int = 1024,
        num_inference_steps: int = 8,  # Lightning optimized for 8 steps
        guidance_scale: float = 1.0,   # Lightning uses true_cfg_scale=1.0
        seed: Optional[int] = None,
    ) -> dict:
        """
        Generate image using Qwen-Image-Lightning.

        Args:
            prompt: Text prompt for image generation
            negative_prompt: Negative prompt (typically empty for Lightning)
            width: Image width in pixels (default 1024)
            height: Image height in pixels (default 1024)
            num_inference_steps: Number of steps (default 8 for Lightning)
            guidance_scale: Guidance scale (default 1.0 for Lightning)
            seed: Random seed for reproducibility

        Returns:
            Dictionary containing base64 encoded image and metadata
        """
        if not self._initialized or self.pipeline is None:
            await self.initialize()

        try:
            logger.info(f"Generating image with Qwen-Image-Lightning")
            logger.info(f"Prompt: {prompt[:100]}...")

            # Set random seed
            if seed is None:
                seed = torch.randint(0, 2**32 - 1, (1,)).item()

            # Run generation in executor to avoid blocking
            loop = asyncio.get_event_loop()
            image = await loop.run_in_executor(
                None,
                self._generate_image,
                prompt,
                negative_prompt or "",  # Empty string for Lightning
                width,
                height,
                num_inference_steps,
                guidance_scale,
                seed,
            )

            # Convert image to base64
            image_base64 = self._image_to_base64(image)

            # Get actual image dimensions
            actual_width, actual_height = image.size

            logger.info(f"Image generated successfully")
            logger.info(f"Size: {actual_width}x{actual_height}, Steps: {num_inference_steps}, Seed: {seed}")

            return {
                "image_url": f"data:image/png;base64,{image_base64}",
                "model": f"{self.base_model} + {self.lightning_lora}",
                "width": actual_width,
                "height": actual_height,
                "seed": seed,
                "num_inference_steps": num_inference_steps,
            }

        except Exception as e:
            logger.error(f"Qwen-Image-Lightning generation failed: {e}")
            raise

    def _generate_image(
        self,
        prompt: str,
        negative_prompt: str,
        width: int,
        height: int,
        num_inference_steps: int,
        guidance_scale: float,
        seed: int,
    ) -> Image.Image:
        """Generate image using Qwen-Image-Lightning (blocking operation)."""
        logger.info(f"Running Lightning inference (steps={num_inference_steps}, seed={seed})...")

        # Set seed for reproducibility
        generator = torch.Generator(device=self.device).manual_seed(seed)

        # Generate image
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
            "name": f"{self.base_model} + Lightning LoRA",
            "type": "image-generation",
            "framework": "Diffusers",
            "backend": "Qwen-Image-Lightning",
            "device": self.device,
            "optimization": "8-step fast inference (12-25× faster)",
            "initialized": self._initialized,
        }

    async def shutdown(self):
        """Shutdown the pipeline and free resources."""
        if self.pipeline:
            logger.info("Shutting down Qwen-Image-Lightning pipeline")
            self.pipeline = None
            self._initialized = False

            # Clean up GPU memory after shutdown
            if self.device == "cuda":
                logger.info("Cleaning up GPU memory after Lightning shutdown")
                cleanup_gpu_memory(force=True)


# Global service instance
qwen_lightning_service = QwenImageLightningService()
