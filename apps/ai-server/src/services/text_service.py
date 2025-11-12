"""Text generation service using vLLM with Qwen models (AWQ quantization)."""

import asyncio
import json
import logging
import os
from typing import Optional, AsyncGenerator, Dict, Any

# Set CUDA environment variables before vLLM initialization
os.environ.setdefault("CUDA_HOME", "/usr/local/cuda-12.6")
os.environ["PATH"] = f"/usr/local/cuda-12.6/bin:{os.environ.get('PATH', '')}"
# Include user lib directory with libcuda.so symlink for triton compilation in V1 subprocess
user_lib = os.path.expanduser("~/lib")
os.environ["LD_LIBRARY_PATH"] = f"{user_lib}:/usr/local/cuda-12.6/lib64:/lib/x86_64-linux-gnu:{os.environ.get('LD_LIBRARY_PATH', '')}"
os.environ.setdefault("VLLM_TORCH_COMPILE_LEVEL", "0")  # Disable torch compilation

# Disable V1 multiprocessing to avoid spawn ctypes errors in FastAPI context
# FastAPI doesn't use if __name__ == "__main__" guard, causing re-execution issues
os.environ["VLLM_ENABLE_V1_MULTIPROCESSING"] = "0"

# vLLM 0.11.0 uses V1 engine (V0 has been removed)

from vllm import AsyncLLMEngine, AsyncEngineArgs, SamplingParams
from vllm.sampling_params import GuidedDecodingParams
from src.config import settings

logger = logging.getLogger(__name__)


class TextGenerationService:
    """Service for text generation using vLLM with Qwen models (AWQ quantization)."""

    def __init__(self):
        """Initialize the text generation service."""
        self.engine: Optional[AsyncLLMEngine] = None
        self.model_name = settings.text_model_name
        self._initialized = False

    async def initialize(self):
        """Initialize the vLLM engine with Qwen AWQ model."""
        if self._initialized:
            logger.info("Text generation service already initialized")
            return

        try:
            # Don't clean GPU memory before vLLM initialization
            # cleanup_gpu_memory() calls torch.cuda.is_available() which initializes CUDA
            # This forces vLLM to use spawn multiprocessing method, causing ctypes errors
            # Let vLLM handle GPU initialization itself
            logger.info("Preparing GPU for text model loading...")

            logger.info(f"Initializing vLLM engine with model: {self.model_name}")
            logger.info(f"Quantization: {settings.vllm_quantization}")

            # Configure vLLM engine arguments for AWQ quantized model
            engine_args = AsyncEngineArgs(
                model=self.model_name,
                quantization=settings.vllm_quantization,  # Enable AWQ quantization
                tensor_parallel_size=settings.vllm_tensor_parallel_size,
                max_model_len=settings.text_max_model_len,
                gpu_memory_utilization=settings.text_gpu_memory_utilization,
                max_num_seqs=settings.vllm_max_num_seqs,
                trust_remote_code=True,
                enforce_eager=True,  # Disable CUDA graphs and torch compilation to avoid triton issues
                # Use outlines backend for guided decoding (works with legacy engine)
                guided_decoding_backend="outlines",
            )

            # Create async engine
            self.engine = AsyncLLMEngine.from_engine_args(engine_args)
            self._initialized = True

            logger.info("vLLM engine initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize vLLM engine: {e}")
            raise

    async def generate(
        self,
        prompt: str,
        max_tokens: int = 2048,
        temperature: float = 0.7,
        top_p: float = 0.9,
        stop_sequences: Optional[list[str]] = None,
    ) -> dict:
        """
        Generate text using vLLM.

        Args:
            prompt: Input text prompt
            max_tokens: Maximum number of tokens to generate
            temperature: Sampling temperature (0.0 to 2.0)
            top_p: Nucleus sampling parameter (0.0 to 1.0)
            stop_sequences: Optional list of stop sequences

        Returns:
            Dictionary containing generated text and metadata
        """
        if not self._initialized or self.engine is None:
            await self.initialize()

        try:
            # Create sampling parameters
            sampling_params = SamplingParams(
                temperature=temperature,
                top_p=top_p,
                max_tokens=max_tokens,
                stop=stop_sequences,
            )

            # Generate text
            logger.info(f"Generating text with prompt length: {len(prompt)}")
            request_id = f"text-{asyncio.current_task().get_name()}"

            results = []
            async for request_output in self.engine.generate(
                prompt, sampling_params, request_id=request_id
            ):
                results.append(request_output)

            # Get final output
            final_output = results[-1]
            generated_text = final_output.outputs[0].text
            tokens_used = len(final_output.outputs[0].token_ids)
            finish_reason = final_output.outputs[0].finish_reason

            logger.info(f"Text generation completed. Tokens used: {tokens_used}")

            return {
                "text": generated_text,
                "model": self.model_name,
                "tokens_used": tokens_used,
                "finish_reason": finish_reason if finish_reason else "unknown",
            }

        except Exception as e:
            logger.error(f"Text generation failed: {e}")
            raise

    async def generate_stream(
        self,
        prompt: str,
        max_tokens: int = 2048,
        temperature: float = 0.7,
        top_p: float = 0.9,
        stop_sequences: Optional[list[str]] = None,
    ) -> AsyncGenerator[dict, None]:
        """
        Generate text using vLLM with streaming.

        Args:
            prompt: Input text prompt
            max_tokens: Maximum number of tokens to generate
            temperature: Sampling temperature (0.0 to 2.0)
            top_p: Nucleus sampling parameter (0.0 to 1.0)
            stop_sequences: Optional list of stop sequences

        Yields:
            Dictionaries containing generated text chunks and metadata
        """
        if not self._initialized or self.engine is None:
            await self.initialize()

        try:
            # Create sampling parameters
            sampling_params = SamplingParams(
                temperature=temperature,
                top_p=top_p,
                max_tokens=max_tokens,
                stop=stop_sequences,
            )

            # Generate text with streaming
            logger.info(f"Starting streaming text generation with prompt length: {len(prompt)}")
            request_id = f"text-stream-{asyncio.current_task().get_name()}"

            async for request_output in self.engine.generate(
                prompt, sampling_params, request_id=request_id
            ):
                text = request_output.outputs[0].text
                tokens_used = len(request_output.outputs[0].token_ids)
                finish_reason = request_output.outputs[0].finish_reason

                yield {
                    "text": text,
                    "model": self.model_name,
                    "tokens_used": tokens_used,
                    "finish_reason": finish_reason if finish_reason else None,
                    "done": finish_reason is not None,
                }

        except Exception as e:
            logger.error(f"Streaming text generation failed: {e}")
            raise

    async def generate_structured(
        self,
        prompt: str,
        guided_type: str,
        json_schema: Optional[Dict[str, Any]] = None,
        regex_pattern: Optional[str] = None,
        choices: Optional[list[str]] = None,
        grammar: Optional[str] = None,
        max_tokens: int = 2048,
        temperature: float = 0.7,
        top_p: float = 0.9,
    ) -> dict:
        """
        Generate structured output using vLLM guided decoding.

        Args:
            prompt: Input text prompt
            guided_type: Type of guided decoding ("json", "regex", "choice", "grammar")
            json_schema: JSON schema for type "json"
            regex_pattern: Regex pattern for type "regex"
            choices: List of valid choices for type "choice"
            grammar: Context-free grammar for type "grammar"
            max_tokens: Maximum number of tokens to generate
            temperature: Sampling temperature (0.0 to 2.0)
            top_p: Nucleus sampling parameter (0.0 to 1.0)

        Returns:
            Dictionary containing structured output and metadata
        """
        if not self._initialized or self.engine is None:
            await self.initialize()

        try:
            # Create guided decoding params based on type
            guided_params = None
            if guided_type == "json" and json_schema:
                guided_params = GuidedDecodingParams(json=json_schema)
            elif guided_type == "regex" and regex_pattern:
                guided_params = GuidedDecodingParams(regex=regex_pattern)
            elif guided_type == "choice" and choices:
                guided_params = GuidedDecodingParams(choice=choices)
            elif guided_type == "grammar" and grammar:
                guided_params = GuidedDecodingParams(grammar=grammar)
            else:
                raise ValueError(
                    f"Invalid guided decoding configuration: type={guided_type}, "
                    f"json_schema={json_schema is not None}, regex={regex_pattern is not None}, "
                    f"choices={choices is not None}, grammar={grammar is not None}"
                )

            # Create sampling parameters with guided decoding
            sampling_params = SamplingParams(
                temperature=temperature,
                top_p=top_p,
                max_tokens=max_tokens,
                guided_decoding=guided_params,
            )

            # Generate text with guided decoding
            logger.info(
                f"Generating structured output (type: {guided_type}) with prompt length: {len(prompt)}"
            )
            request_id = f"structured-{asyncio.current_task().get_name()}"

            results = []
            async for request_output in self.engine.generate(
                prompt, sampling_params, request_id=request_id
            ):
                results.append(request_output)

            # Get final output
            final_output = results[-1]
            generated_text = final_output.outputs[0].text
            tokens_used = len(final_output.outputs[0].token_ids)
            finish_reason = final_output.outputs[0].finish_reason

            logger.info(
                f"Structured output generation completed. Tokens used: {tokens_used}"
            )

            # Parse JSON if type is "json"
            parsed_output = None
            is_valid = True
            if guided_type == "json":
                try:
                    parsed_output = json.loads(generated_text)
                    logger.info("JSON output parsed successfully")
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse JSON output: {e}")
                    is_valid = False

            return {
                "output": generated_text,
                "parsed_output": parsed_output,
                "model": self.model_name,
                "tokens_used": tokens_used,
                "finish_reason": finish_reason if finish_reason else "unknown",
                "is_valid": is_valid,
            }

        except Exception as e:
            logger.error(f"Structured output generation failed: {e}")
            raise

    async def get_model_info(self) -> dict:
        """Get information about the loaded model."""
        return {
            "name": self.model_name,
            "type": "text-generation",
            "framework": "vLLM",
            "max_tokens": settings.text_max_model_len,
            "initialized": self._initialized,
        }

    async def shutdown(self):
        """Shutdown the vLLM engine and clean up GPU memory."""
        if self.engine:
            logger.info("Shutting down vLLM engine")
            # vLLM doesn't have explicit shutdown, engine will be cleaned up
            self.engine = None
            self._initialized = False
            # GPU memory will be automatically cleaned up when engine is destroyed
            logger.info("vLLM engine shut down")


# Global service instance
text_service = TextGenerationService()
