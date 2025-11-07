"""Image generation service using Qwen-Image-Lightning with Scaled FP8 base.

Qwen-Image-Lightning is a distilled version that's 12-25× faster than base Qwen-Image.
Uses SCALED FP8 base model + v2.0 LoRA adapter to avoid grid artifacts.
V2.0 improvements: reduced over-saturation, improved skin texture, natural visuals.
Optimized for RTX 4090 24GB with sequential CPU offloading.

Compatibility: Scaled FP8 base (from LoRA repo) + BF16-trained v2.0 LoRA = no artifacts.
The scaled FP8 variant has proper scaling to work with BF16 LoRAs without grid patterns.
"""

import asyncio
import logging
import base64
import io
import math
from typing import Optional
import torch
from diffusers import DiffusionPipeline, FlowMatchEulerDiscreteScheduler
from diffusers.models import QwenImageTransformer2DModel
from PIL import Image
from src.config import settings
from src.utils.gpu_utils import cleanup_gpu_memory, get_gpu_memory_info

logger = logging.getLogger(__name__)


class QwenImageLightningFP8Service:
    """Service for image generation using Qwen-Image-Lightning with BF16 base."""

    def __init__(self):
        """Initialize the Qwen-Image-Lightning BF16 generation service."""
        self.pipeline: Optional[DiffusionPipeline] = None
        self.base_model = "Qwen/Qwen-Image"
        self.lora_repo = "lightx2v/Qwen-Image-Lightning"
        self.lora_weight_name = "Qwen-Image-Lightning-8steps-V2.0.safetensors"
        self._initialized = False
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

    async def initialize(self):
        """Initialize the Qwen-Image-Lightning pipeline with Scaled FP8 base."""
        if self._initialized:
            logger.info("Qwen-Image-Lightning Scaled FP8 service already initialized")
            return

        try:
            # Clean GPU memory before loading model
            logger.info("Preparing GPU for Qwen-Image-Lightning Scaled FP8 loading...")
            cleanup_gpu_memory(force=True)

            mem_info = get_gpu_memory_info()
            if mem_info["available"]:
                logger.info(f"GPU Memory available: {mem_info['free']:.2f}GB free")

            logger.info(f"Initializing Qwen-Image-Lightning with Scaled FP8 base")
            logger.info(f"Base model components: {self.base_model}")
            logger.info(f"Scaled FP8 transformer: {self.lora_repo}/Qwen-Image")
            logger.info(f"LoRA: {self.lora_weight_name}")
            logger.info(f"Using device: {self.device}")
            logger.info(f"CPU offloading: ENABLED (sequential, required for 24GB)")

            # Run pipeline loading in executor to avoid blocking
            loop = asyncio.get_event_loop()
            self.pipeline = await loop.run_in_executor(
                None, self._load_pipeline
            )

            self._initialized = True

            logger.info("Qwen-Image-Lightning Scaled FP8 pipeline initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize Qwen-Image-Lightning Scaled FP8 pipeline: {e}")
            raise

    def _load_pipeline(self) -> DiffusionPipeline:
        """Load the Qwen-Image-Lightning pipeline with scaled FP8 base (blocking operation)."""
        logger.info("Loading scaled FP8 transformer from LoRA repository...")

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

        # Load scaled FP8 transformer directly with proper dtype
        logger.info("Loading scaled FP8 transformer from LoRA repository...")
        from huggingface_hub import hf_hub_download
        from safetensors.torch import load_file

        # Download the scaled FP8 transformer file
        fp8_transformer_path = hf_hub_download(
            repo_id=self.lora_repo,
            filename="Qwen-Image/qwen_image_fp8_e4m3fn_scaled.safetensors",
            repo_type="model"
        )

        logger.info(f"Downloaded scaled FP8 transformer to: {fp8_transformer_path}")

        # Load FP8 state dict
        logger.info("Loading FP8 weights with layerwise casting...")
        fp8_state_dict = load_file(fp8_transformer_path)

        # Convert FP8 weights to BF16 for computation (layerwise casting)
        logger.info("Converting FP8 storage to BF16 compute dtype...")
        bf16_state_dict = {}
        for key, tensor in fp8_state_dict.items():
            if tensor.dtype == torch.float8_e4m3fn:
                # Upcast FP8 to BF16 for computation
                bf16_state_dict[key] = tensor.to(torch.bfloat16)
            else:
                bf16_state_dict[key] = tensor

        # Load the rest of the pipeline components (VAE, text encoder, etc.)
        logger.info("Loading base Qwen-Image pipeline components (VAE, CLIP, etc.)...")
        pipeline = DiffusionPipeline.from_pretrained(
            self.base_model,
            scheduler=scheduler,
            torch_dtype=torch.bfloat16,
        )

        # Replace transformer weights with upcast FP8 weights
        logger.info("Replacing transformer with scaled FP8 weights (upcast to BF16)...")
        pipeline.transformer.load_state_dict(bf16_state_dict, strict=False)

        # Enable sequential CPU offload for 24GB GPU
        # The scaled FP8 transformer is now loaded, but we still need offloading
        logger.info("Enabling sequential CPU offload (required for 24GB GPU)...")
        pipeline.enable_sequential_cpu_offload()

        # Load Lightning LoRA adapter with specific weight file
        logger.info(f"Loading Lightning LoRA adapter: {self.lora_weight_name}...")
        pipeline.load_lora_weights(
            self.lora_repo,
            weight_name=self.lora_weight_name
        )

        logger.info("Qwen-Image-Lightning Scaled FP8 pipeline loaded successfully")
        logger.info("Mode: Scaled FP8 base + v2.0 LoRA (8-step, with CPU offload)")

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
        Generate image using Qwen-Image-Lightning with scaled FP8 base.

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
            logger.info(f"Generating image with Qwen-Image-Lightning FP8")
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
                "model": f"Scaled FP8 Base + {self.lora_weight_name}",
                "width": actual_width,
                "height": actual_height,
                "seed": seed,
                "num_inference_steps": num_inference_steps,
            }

        except Exception as e:
            logger.error(f"Qwen-Image-Lightning FP8 generation failed: {e}")
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
        """Generate image using Qwen-Image-Lightning Scaled FP8 (blocking operation)."""
        logger.info(f"Running Lightning Scaled FP8 inference (steps={num_inference_steps}, seed={seed})...")

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
            "name": f"Scaled FP8 Base + Lightning v2.0 LoRA",
            "type": "image-generation",
            "framework": "Diffusers",
            "backend": "Qwen-Image-Lightning",
            "device": self.device,
            "optimization": "Scaled FP8 + 8-step fast inference (CPU offload)",
            "initialized": self._initialized,
        }

    async def shutdown(self):
        """Shutdown the pipeline and free resources."""
        if self.pipeline:
            logger.info("Shutting down Qwen-Image-Lightning Scaled FP8 pipeline")
            self.pipeline = None
            self._initialized = False

            # Clean up GPU memory after shutdown
            if self.device == "cuda":
                logger.info("Cleaning up GPU memory after Lightning Scaled FP8 shutdown")
                cleanup_gpu_memory(force=True)


# Global service instance
qwen_lightning_fp8_service = QwenImageLightningFP8Service()
