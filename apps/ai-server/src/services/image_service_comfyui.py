"""Image generation service using ComfyUI for Qwen-Image with scaled FP8 + v2.0 LoRA.

This service uses ComfyUI programmatically (as SDK) to properly handle FP8 models
that are not supported well by diffusers library.

Workflow: Scaled FP8 base + Lightning v2.0 LoRA
- No grid artifacts (properly calibrated FP8)
- 8-step fast inference
- Optimized for RTX 4090 24GB
"""

import asyncio
import logging
import base64
import io
import sys
import os
from typing import Optional
from pathlib import Path
from PIL import Image

# Add ComfyUI to Python path
COMFYUI_PATH = Path(__file__).parent.parent.parent / "comfyui"
sys.path.insert(0, str(COMFYUI_PATH))

# Configure ComfyUI paths
import folder_paths
comfyui_models = COMFYUI_PATH / "models"
folder_paths.folder_names_and_paths["checkpoints"] = ([str(comfyui_models / "checkpoints")], {".safetensors", ".ckpt", ".pth"})
folder_paths.folder_names_and_paths["vae"] = ([str(comfyui_models / "vae")], {".safetensors", ".ckpt", ".pth"})
folder_paths.folder_names_and_paths["clip"] = ([str(comfyui_models / "clip")], {".safetensors"})
folder_paths.folder_names_and_paths["loras"] = ([str(comfyui_models / "loras")], {".safetensors"})
folder_paths.folder_names_and_paths["diffusion_models"] = ([str(comfyui_models / "diffusion_models")], {".safetensors", ".pth"})
folder_paths.folder_names_and_paths["text_encoders"] = ([str(comfyui_models / "text_encoders")], {".safetensors"})

# Import ComfyUI nodes
from nodes import (
    UNETLoader,
    CLIPLoader,
    VAELoader,
    CLIPTextEncode,
    EmptySD3LatentImage,
    VAEDecode,
    KSampler,
    LoraLoaderModelOnly,
    ModelSamplingAuraFlow,
)

logger = logging.getLogger(__name__)


class QwenImageComfyUIService:
    """Service for image generation using ComfyUI with Qwen-Image FP8."""

    def __init__(self):
        """Initialize the ComfyUI-based generation service."""
        self._initialized = False
        self.device = "cuda"

        # Model files (will be downloaded if not present)
        self.unet_model = "qwen_image_fp8_e4m3fn_scaled.safetensors"
        self.clip_model = "qwen_2.5_vl_7b_fp8_scaled.safetensors"
        self.vae_model = "qwen_image_vae.safetensors"
        self.lora_model = "Qwen-Image-Lightning-8steps-V2.0.safetensors"

        # ComfyUI nodes
        self.unet_loader = UNETLoader()
        self.clip_loader = CLIPLoader()
        self.vae_loader = VAELoader()
        self.lora_loader = LoraLoaderModelOnly()
        self.model_sampling = ModelSamplingAuraFlow()
        self.clip_encode = CLIPTextEncode()
        self.empty_latent = EmptySD3LatentImage()
        self.ksampler = KSampler()
        self.vae_decode = VAEDecode()

    async def initialize(self):
        """Initialize the ComfyUI nodes and download models if needed."""
        if self._initialized:
            logger.info("ComfyUI service already initialized")
            return

        try:
            logger.info("Initializing ComfyUI service with scaled FP8 + Lightning v2.0...")
            logger.info(f"UNET: {self.unet_model}")
            logger.info(f"CLIP: {self.clip_model}")
            logger.info(f"VAE: {self.vae_model}")
            logger.info(f"LoRA: {self.lora_model}")

            # Download models if needed
            await self._ensure_models()

            self._initialized = True
            logger.info("ComfyUI service initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize ComfyUI service: {e}")
            raise

    async def _ensure_models(self):
        """Ensure all required models are downloaded."""
        # This would trigger downloads via folder_paths if models don't exist
        # For now, we'll just check if they exist
        models_dir = COMFYUI_PATH / "models"

        required_files = {
            "diffusion_models": self.unet_model,
            "text_encoders": self.clip_model,
            "vae": self.vae_model,
            "loras": self.lora_model,
        }

        for subdir, filename in required_files.items():
            file_path = models_dir / subdir / filename
            if not file_path.exists():
                logger.warning(f"Model file not found: {file_path}")
                logger.info(f"Please download {filename} to {file_path}")

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
        Generate image using ComfyUI with scaled FP8 + v2.0 LoRA.

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
        if not self._initialized:
            await self.initialize()

        try:
            logger.info(f"Generating image with ComfyUI FP8 workflow")
            logger.info(f"Prompt: {prompt[:100]}...")

            # Set random seed
            if seed is None:
                import random
                seed = random.randint(0, 2**32 - 1)

            # Run generation in executor to avoid blocking
            loop = asyncio.get_event_loop()
            image = await loop.run_in_executor(
                None,
                self._generate_image,
                prompt,
                negative_prompt or "",
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
                "model": f"Qwen-Image FP8 + Lightning v2.0 (ComfyUI)",
                "width": actual_width,
                "height": actual_height,
                "seed": seed,
                "num_inference_steps": num_inference_steps,
            }

        except Exception as e:
            logger.error(f"ComfyUI generation failed: {e}")
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
        """Generate image using ComfyUI nodes (blocking operation)."""
        logger.info(f"Running ComfyUI FP8 workflow (steps={num_inference_steps}, seed={seed})...")

        # Step 1: Load models
        logger.info("Loading FP8 UNET...")
        unet_result = self.unet_loader.load_unet(
            unet_name=self.unet_model,
            weight_dtype="fp8_e4m3fn"
        )
        model = unet_result[0]

        logger.info("Loading CLIP...")
        clip_result = self.clip_loader.load_clip(
            clip_name=self.clip_model,
            type="qwen_image",
            clip_type="default"
        )
        clip = clip_result[0]

        logger.info("Loading VAE...")
        vae_result = self.vae_loader.load_vae(
            vae_name=self.vae_model
        )
        vae = vae_result[0]

        # Step 2: Load LoRA
        logger.info("Loading Lightning v2.0 LoRA...")
        lora_result = self.lora_loader.load_lora_model_only(
            model=model,
            lora_name=self.lora_model,
            strength_model=1.0
        )
        model = lora_result[0]

        # Step 3: Apply model sampling
        logger.info("Configuring model sampling...")
        sampling_result = self.model_sampling.patch(
            model=model,
            shift=3.0
        )
        model = sampling_result[0]

        # Step 4: Encode prompts
        logger.info("Encoding prompts...")
        positive_result = self.clip_encode.encode(
            clip=clip,
            text=prompt
        )
        positive_cond = positive_result[0]

        negative_result = self.clip_encode.encode(
            clip=clip,
            text=negative_prompt
        )
        negative_cond = negative_result[0]

        # Step 5: Create latent
        logger.info(f"Creating latent image ({width}x{height})...")
        latent_result = self.empty_latent.generate(
            width=width,
            height=height,
            batch_size=1
        )
        latent = latent_result[0]

        # Step 6: Run sampling
        logger.info("Running sampler...")
        sampled_result = self.ksampler.sample(
            model=model,
            seed=seed,
            steps=num_inference_steps,
            cfg=guidance_scale,
            sampler_name="euler",
            scheduler="simple",
            positive=positive_cond,
            negative=negative_cond,
            latent_image=latent,
            denoise=1.0
        )
        latent_samples = sampled_result[0]

        # Step 7: Decode latent to image
        logger.info("Decoding latent to image...")
        decoded_result = self.vae_decode.decode(
            samples=latent_samples,
            vae=vae
        )
        image_tensor = decoded_result[0]

        # Convert tensor to PIL Image
        # image_tensor shape: [1, H, W, 3] in range [0, 1]
        import torch
        import numpy as np

        img_np = image_tensor.squeeze(0).cpu().numpy()
        img_np = (img_np * 255).clip(0, 255).astype(np.uint8)
        image = Image.fromarray(img_np)

        logger.info("Image generation complete")
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
            "name": "Qwen-Image FP8 + Lightning v2.0 (ComfyUI)",
            "type": "image-generation",
            "framework": "ComfyUI",
            "backend": "Qwen-Image-Lightning",
            "device": self.device,
            "optimization": "Scaled FP8 + 8-step v2.0 LoRA (no artifacts)",
            "initialized": self._initialized,
        }

    async def shutdown(self):
        """Shutdown the service and free resources."""
        logger.info("Shutting down ComfyUI service")
        self._initialized = False

        # ComfyUI nodes don't need explicit cleanup
        # Models are managed by ComfyUI's model management


# Global service instance
qwen_comfyui_service = QwenImageComfyUIService()
