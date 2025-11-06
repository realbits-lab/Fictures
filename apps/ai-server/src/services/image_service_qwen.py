"""Image generation service using Qwen-Image with DiffSynth-Studio.

Optimized for RTX 4090 24GB with full GPU memory (no CPU offloading).
Text model is disabled to dedicate full GPU to image generation.
"""

import asyncio
import logging
import base64
import io
from typing import Optional
import torch
from diffsynth.pipelines.qwen_image import QwenImagePipeline, ModelConfig
from PIL import Image
from src.config import settings
from src.utils.gpu_utils import cleanup_gpu_memory, get_gpu_memory_info

logger = logging.getLogger(__name__)


class QwenImageService:
    """Service for image generation using Qwen-Image with DiffSynth-Studio."""

    def __init__(self):
        """Initialize the Qwen-Image generation service."""
        self.pipeline: Optional[QwenImagePipeline] = None
        self.model_name = settings.image_model_name
        self._initialized = False
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        # No FP8 quantization - using full GPU memory without offloading
        self.use_fp8 = False
        self.offload_dtype = torch.bfloat16

    async def initialize(self):
        """Initialize the Qwen-Image pipeline with FP8 optimization."""
        if self._initialized:
            logger.info("Qwen-Image service already initialized")
            return

        try:
            # Clean GPU memory before loading model
            logger.info("Preparing GPU for image model loading...")
            cleanup_gpu_memory(force=True)

            mem_info = get_gpu_memory_info()
            if mem_info["available"]:
                logger.info(f"GPU Memory available: {mem_info['free']:.2f}GB free")

            logger.info(f"Initializing Qwen-Image pipeline: {self.model_name}")
            logger.info(f"Using device: {self.device}")
            logger.info(f"Mode: Full GPU (no CPU offloading)")

            # Run pipeline loading in executor to avoid blocking
            loop = asyncio.get_event_loop()
            self.pipeline = await loop.run_in_executor(
                None, self._load_pipeline
            )

            self._initialized = True
            logger.info("Qwen-Image pipeline initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize Qwen-Image pipeline: {e}")
            raise

    def _load_pipeline(self) -> QwenImagePipeline:
        """Load the Qwen-Image pipeline with full GPU memory (blocking operation)."""
        logger.info("Loading Qwen-Image model components to GPU...")

        # Configure model loading (all on GPU, no CPU offloading)
        model_configs = [
            # Transformer - full GPU
            ModelConfig(
                model_id=self.model_name,
                origin_file_pattern="transformer/diffusion_pytorch_model*.safetensors",
            ),
            # Text encoder - full GPU
            ModelConfig(
                model_id=self.model_name,
                origin_file_pattern="text_encoder/model*.safetensors",
            ),
            # VAE - full GPU
            ModelConfig(
                model_id=self.model_name,
                origin_file_pattern="vae/diffusion_pytorch_model.safetensors",
            ),
        ]

        # Tokenizer configuration
        tokenizer_config = ModelConfig(
            model_id=self.model_name,
            origin_file_pattern="tokenizer/",
        )

        logger.info("Creating DiffSynth-Studio pipeline with full GPU memory...")

        # Create pipeline with bfloat16, all components on GPU
        pipeline = QwenImagePipeline.from_pretrained(
            torch_dtype=torch.bfloat16,
            device=self.device,
            model_configs=model_configs,
            tokenizer_config=tokenizer_config,
        )

        logger.info(f"Qwen-Image pipeline loaded successfully")
        logger.info(f"All model components loaded to GPU (no CPU offloading)")

        return pipeline

    async def generate(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        width: int = 1344,
        height: int = 768,
        num_inference_steps: int = 40,
        guidance_scale: float = 7.5,
        seed: Optional[int] = None,
    ) -> dict:
        """
        Generate image using Qwen-Image.

        Args:
            prompt: Text prompt for image generation
            negative_prompt: Negative prompt (not used in Qwen-Image)
            width: Image width in pixels (will be adjusted to supported sizes)
            height: Image height in pixels (will be adjusted to supported sizes)
            num_inference_steps: Number of denoising steps (default 40 for Qwen-Image)
            guidance_scale: Guidance scale for prompt adherence
            seed: Random seed for reproducibility

        Returns:
            Dictionary containing base64 encoded image and metadata
        """
        if not self._initialized or self.pipeline is None:
            await self.initialize()

        try:
            logger.info(f"Generating image with Qwen-Image")
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
                num_inference_steps,
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
                "model": self.model_name,
                "width": actual_width,
                "height": actual_height,
                "seed": seed,
                "num_inference_steps": num_inference_steps,
            }

        except Exception as e:
            logger.error(f"Qwen-Image generation failed: {e}")
            raise

    def _generate_image(
        self,
        prompt: str,
        num_inference_steps: int,
        seed: int,
    ) -> Image.Image:
        """Generate image using Qwen-Image (blocking operation)."""
        logger.info(f"Running Qwen-Image inference (steps={num_inference_steps}, seed={seed})...")

        # Generate image (all on GPU, no device placement issues)
        image = self.pipeline(
            prompt=prompt,
            seed=seed,
            num_inference_steps=num_inference_steps,
        )

        return image

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
            "framework": "DiffSynth-Studio",
            "backend": "Qwen-Image",
            "device": self.device,
            "optimization": "Full GPU (no CPU offloading)",
            "initialized": self._initialized,
        }

    async def shutdown(self):
        """Shutdown the pipeline and free resources."""
        if self.pipeline:
            logger.info("Shutting down Qwen-Image pipeline")
            self.pipeline = None
            self._initialized = False

            # Clean up GPU memory after shutdown
            if self.device == "cuda":
                logger.info("Cleaning up GPU memory after image model shutdown")
                cleanup_gpu_memory(force=True)


# Global service instance
qwen_image_service = QwenImageService()
