"""Text generation service using vLLM and Gemma models."""

import asyncio
import logging
from typing import Optional, AsyncGenerator
from vllm import AsyncLLMEngine, AsyncEngineArgs, SamplingParams
from src.config import settings

logger = logging.getLogger(__name__)


class TextGenerationService:
    """Service for text generation using vLLM with Gemma models."""

    def __init__(self):
        """Initialize the text generation service."""
        self.engine: Optional[AsyncLLMEngine] = None
        self.model_name = settings.text_model_name
        self._initialized = False

    async def initialize(self):
        """Initialize the vLLM engine with Gemma model."""
        if self._initialized:
            logger.info("Text generation service already initialized")
            return

        try:
            logger.info(f"Initializing vLLM engine with model: {self.model_name}")

            # Configure vLLM engine arguments
            engine_args = AsyncEngineArgs(
                model=self.model_name,
                tensor_parallel_size=settings.vllm_tensor_parallel_size,
                max_model_len=settings.text_max_model_len,
                gpu_memory_utilization=settings.text_gpu_memory_utilization,
                max_num_seqs=settings.vllm_max_num_seqs,
                trust_remote_code=True,
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
        """Shutdown the vLLM engine."""
        if self.engine:
            logger.info("Shutting down vLLM engine")
            # vLLM doesn't have explicit shutdown, engine will be cleaned up
            self.engine = None
            self._initialized = False


# Global service instance
text_service = TextGenerationService()
