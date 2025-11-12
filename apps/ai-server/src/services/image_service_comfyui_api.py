"""Image generation service using ComfyUI HTTP API with scaled FP8 + v2.0 LoRA.

This service communicates with a running ComfyUI server via HTTP API,
avoiding the SDK gradient tracking issues with FP8 models.

Workflow: Scaled FP8 base + Lightning 4-step v2.0 LoRA
- No grid artifacts (properly calibrated FP8)
- 4-step fast inference
- Optimized for RTX 4090 24GB
"""

import asyncio
import logging
import base64
import io
import json
import time
from typing import Optional
from PIL import Image
import httpx

logger = logging.getLogger(__name__)


class QwenImageComfyUIAPIService:
    """Service for image generation using ComfyUI HTTP API with Qwen-Image FP8."""

    def __init__(self, comfyui_url: str = None):
        """Initialize the ComfyUI API service.

        Args:
            comfyui_url: URL of the running ComfyUI server (defaults to config.settings.ai_server_comfyui_url)
        """
        from src.config import settings
        self.comfyui_url = comfyui_url or settings.ai_server_comfyui_url
        self._initialized = False
        self.device = "cuda"

        # Workflow template (from user-provided JSON)
        self.workflow_template = {
            "6": {  # Positive prompt
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": "PLACEHOLDER_PROMPT",
                    "clip": ["38", 0]
                }
            },
            "7": {  # Negative prompt
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": "",
                    "clip": ["38", 0]
                }
            },
            "3": {  # KSampler
                "class_type": "KSampler",
                "inputs": {
                    "seed": 42,
                    "steps": 4,
                    "cfg": 1.0,
                    "sampler_name": "euler",
                    "scheduler": "simple",
                    "denoise": 1.0,
                    "model": ["66", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["58", 0]
                }
            },
            "8": {  # VAEDecode
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["3", 0],
                    "vae": ["39", 0]
                }
            },
            "37": {  # UNETLoader
                "class_type": "UNETLoader",
                "inputs": {
                    "unet_name": "qwen_image_fp8_e4m3fn_scaled.safetensors",
                    "weight_dtype": "fp8_e4m3fn"
                }
            },
            "38": {  # CLIPLoader
                "class_type": "CLIPLoader",
                "inputs": {
                    "clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors",
                    "type": "qwen_image"
                }
            },
            "39": {  # VAELoader
                "class_type": "VAELoader",
                "inputs": {
                    "vae_name": "qwen_image_vae.safetensors"
                }
            },
            "58": {  # EmptyLatentImage
                "class_type": "EmptyLatentImage",
                "inputs": {
                    "width": 1024,
                    "height": 1024,
                    "batch_size": 1
                }
            },
            "60": {  # SaveImage
                "class_type": "SaveImage",
                "inputs": {
                    "filename_prefix": "ComfyUI",
                    "images": ["8", 0]
                }
            },
            "66": {  # ModelSamplingAuraFlow
                "class_type": "ModelSamplingAuraFlow",
                "inputs": {
                    "shift": 3.0,
                    "model": ["75", 0]
                }
            },
            "75": {  # LoraLoaderModelOnly
                "class_type": "LoraLoaderModelOnly",
                "inputs": {
                    "lora_name": "Qwen-Image-Lightning-4steps-V2.0.safetensors",
                    "strength_model": 1.0,
                    "model": ["37", 0]
                }
            }
        }

    async def initialize(self):
        """Initialize the service by checking ComfyUI server availability."""
        if self._initialized:
            logger.info("ComfyUI API service already initialized")
            return

        try:
            logger.info(f"Initializing ComfyUI API service at {self.comfyui_url}...")

            # Check server availability
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.comfyui_url}/system_stats", timeout=10.0)
                response.raise_for_status()
                stats = response.json()

                logger.info(f"ComfyUI server version: {stats['system']['comfyui_version']}")
                logger.info(f"PyTorch version: {stats['system']['pytorch_version']}")

                if stats['devices']:
                    device = stats['devices'][0]
                    vram_gb = device['vram_total'] / (1024**3)
                    logger.info(f"GPU: {device['name']} ({vram_gb:.1f}GB)")

            self._initialized = True
            logger.info("ComfyUI API service initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize ComfyUI API service: {e}")
            raise

    async def generate(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        width: int = 1024,
        height: int = 1024,
        num_inference_steps: int = 4,  # 4-step Lightning v2.0 LoRA
        guidance_scale: float = 1.0,
        seed: Optional[int] = None,
    ) -> dict:
        """
        Generate image using ComfyUI API with scaled FP8 + 4-step v2.0 LoRA.

        Args:
            prompt: Text prompt for image generation
            negative_prompt: Negative prompt (typically empty for Lightning)
            width: Image width in pixels (default 1024)
            height: Image height in pixels (default 1024)
            num_inference_steps: Number of steps (default 4 for 4-step Lightning v2.0)
            guidance_scale: Guidance scale (default 1.0 for Lightning)
            seed: Random seed for reproducibility

        Returns:
            Dictionary containing base64 encoded image and metadata
        """
        if not self._initialized:
            await self.initialize()

        try:
            logger.info(f"Generating image via ComfyUI API")
            logger.info(f"Prompt: {prompt[:100]}...")

            # Set random seed
            if seed is None:
                import random
                seed = random.randint(0, 2**32 - 1)

            # Prepare workflow with custom parameters
            workflow = self._prepare_workflow(
                prompt=prompt,
                negative_prompt=negative_prompt or "",
                width=width,
                height=height,
                num_steps=num_inference_steps,
                cfg=guidance_scale,
                seed=seed
            )

            # Submit workflow to ComfyUI
            prompt_id = await self._queue_prompt(workflow)
            logger.info(f"Workflow queued with ID: {prompt_id}")

            # Wait for completion and get result
            image = await self._wait_for_completion(prompt_id)

            # Convert image to base64
            image_base64 = self._image_to_base64(image)

            # Get actual image dimensions
            actual_width, actual_height = image.size

            logger.info(f"Image generated successfully")
            logger.info(f"Size: {actual_width}x{actual_height}, Steps: {num_inference_steps}, Seed: {seed}")

            return {
                "image_url": f"data:image/png;base64,{image_base64}",
                "model": "Qwen-Image FP8 + Lightning v2.0 4-step (ComfyUI API)",
                "width": actual_width,
                "height": actual_height,
                "seed": seed,
                "num_inference_steps": num_inference_steps,
            }

        except Exception as e:
            logger.error(f"ComfyUI API generation failed: {e}")
            raise

    def _prepare_workflow(self, prompt: str, negative_prompt: str, width: int, height: int, num_steps: int, cfg: float, seed: int) -> dict:
        """Prepare workflow JSON with custom parameters."""
        workflow = json.loads(json.dumps(self.workflow_template))  # Deep copy

        # Update prompt
        workflow["6"]["inputs"]["text"] = prompt
        workflow["7"]["inputs"]["text"] = negative_prompt

        # Update sampling parameters
        workflow["3"]["inputs"]["seed"] = seed
        workflow["3"]["inputs"]["steps"] = num_steps
        workflow["3"]["inputs"]["cfg"] = cfg

        # Update image size
        workflow["58"]["inputs"]["width"] = width
        workflow["58"]["inputs"]["height"] = height

        return workflow

    async def _queue_prompt(self, workflow: dict) -> str:
        """Queue a prompt workflow and return the prompt ID."""
        async with httpx.AsyncClient() as client:
            payload = {
                "prompt": workflow,
                "client_id": "fictures-ai-server"
            }

            response = await client.post(
                f"{self.comfyui_url}/prompt",
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()

            result = response.json()
            return result["prompt_id"]

    async def _wait_for_completion(self, prompt_id: str, timeout: int = 600) -> Image.Image:
        """Wait for workflow completion and retrieve the generated image."""
        start_time = time.time()

        async with httpx.AsyncClient() as client:
            while True:
                if time.time() - start_time > timeout:
                    raise TimeoutError(f"Workflow {prompt_id} did not complete within {timeout}s")

                # Check history for completion
                response = await client.get(f"{self.comfyui_url}/history/{prompt_id}", timeout=10.0)
                response.raise_for_status()
                history = response.json()

                if prompt_id in history:
                    # Workflow completed
                    outputs = history[prompt_id]["outputs"]

                    # Find the SaveImage node output
                    for node_id, output in outputs.items():
                        if "images" in output:
                            image_info = output["images"][0]
                            filename = image_info["filename"]
                            subfolder = image_info.get("subfolder", "")
                            folder_type = image_info.get("type", "output")

                            # Download the image
                            params = {
                                "filename": filename,
                                "subfolder": subfolder,
                                "type": folder_type
                            }

                            img_response = await client.get(
                                f"{self.comfyui_url}/view",
                                params=params,
                                timeout=30.0
                            )
                            img_response.raise_for_status()

                            # Convert to PIL Image
                            image = Image.open(io.BytesIO(img_response.content))
                            return image

                    raise RuntimeError("No images found in workflow output")

                # Still processing
                await asyncio.sleep(1.0)

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
            "name": "Qwen-Image FP8 + Lightning v2.0 4-step (ComfyUI API)",
            "type": "image-generation",
            "framework": "ComfyUI",
            "backend": "Qwen-Image-Lightning",
            "device": self.device,
            "optimization": "Scaled FP8 + 4-step v2.0 LoRA (no artifacts, via HTTP API)",
            "initialized": self._initialized,
        }

    async def shutdown(self):
        """Shutdown the service (ComfyUI server remains running)."""
        logger.info("Shutting down ComfyUI API service (server keeps running)")
        self._initialized = False


# Global service instance
qwen_comfyui_api_service = QwenImageComfyUIAPIService()
