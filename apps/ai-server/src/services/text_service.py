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
            # Create sampling parameters with min_tokens for long-form generation
            # Ensure min_tokens doesn't exceed max_tokens (use 80% of max_tokens or 512, whichever is smaller)
            calculated_min_tokens = min(512, int(max_tokens * 0.8))
            sampling_params = SamplingParams(
                temperature=temperature,
                top_p=top_p,
                max_tokens=max_tokens,
                min_tokens=calculated_min_tokens if calculated_min_tokens > 0 else None,
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
            # Create sampling parameters with min_tokens for long-form generation
            # Ensure min_tokens doesn't exceed max_tokens (use 80% of max_tokens or 512, whichever is smaller)
            calculated_min_tokens = min(512, int(max_tokens * 0.8))
            sampling_params = SamplingParams(
                temperature=temperature,
                top_p=top_p,
                max_tokens=max_tokens,
                min_tokens=calculated_min_tokens if calculated_min_tokens > 0 else None,
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

    def _analyze_json_schema(self, json_schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze JSON schema to extract complexity metrics for buffer calculation.

        Args:
            json_schema: The JSON schema dict

        Returns:
            Dictionary with schema analysis metrics
        """
        analysis = {
            "max_depth": 0,
            "total_properties": 0,
            "array_fields": 0,
            "nested_objects": 0,
            "field_list": []
        }

        def analyze_recursive(schema: Any, current_depth: int = 0, path: str = "root") -> int:
            """Recursively analyze schema structure."""
            if not isinstance(schema, dict):
                return current_depth

            max_depth = current_depth

            # Count properties (object fields)
            if "properties" in schema:
                props = schema["properties"]
                analysis["total_properties"] += len(props)

                for prop_name, prop_schema in props.items():
                    field_path = f"{path}.{prop_name}"
                    analysis["field_list"].append(field_path)

                    # Check if it's an array
                    if isinstance(prop_schema, dict):
                        if prop_schema.get("type") == "array":
                            analysis["array_fields"] += 1
                        elif "properties" in prop_schema:
                            analysis["nested_objects"] += 1

                    depth = analyze_recursive(prop_schema, current_depth + 1, field_path)
                    max_depth = max(max_depth, depth)

            # Check items (array nesting)
            if "items" in schema:
                analysis["array_fields"] += 1
                depth = analyze_recursive(schema["items"], current_depth + 1, f"{path}[]")
                max_depth = max(max_depth, depth)

            # Check oneOf, anyOf, allOf
            for key in ["oneOf", "anyOf", "allOf"]:
                if key in schema:
                    for idx, sub_schema in enumerate(schema[key]):
                        depth = analyze_recursive(sub_schema, current_depth + 1, f"{path}.{key}[{idx}]")
                        max_depth = max(max_depth, depth)

            return max_depth

        # Perform analysis
        analysis["max_depth"] = analyze_recursive(json_schema)

        return analysis

    def _estimate_json_closing_tokens(self, json_schema: Dict[str, Any]) -> int:
        """
        Estimate how many tokens are needed to properly close a JSON structure.

        Args:
            json_schema: The JSON schema dict

        Returns:
            Estimated number of tokens needed for closing brackets/braces
        """
        # Analyze schema structure
        analysis = self._analyze_json_schema(json_schema)

        # Log detailed analysis
        logger.info("=" * 80)
        logger.info("JSON SCHEMA ANALYSIS:")
        logger.info(f"  Max nesting depth: {analysis['max_depth']}")
        logger.info(f"  Total properties: {analysis['total_properties']}")
        logger.info(f"  Array fields: {analysis['array_fields']}")
        logger.info(f"  Nested objects: {analysis['nested_objects']}")
        logger.info(f"  Field structure: {', '.join(analysis['field_list'][:10])}{'...' if len(analysis['field_list']) > 10 else ''}")

        # Calculate buffer with enhanced formula
        # Base formula: depth * 10 + base_buffer
        # Enhanced: Consider arrays and nested objects as they need more closing tokens
        depth_tokens = analysis["max_depth"] * 10
        array_tokens = analysis["array_fields"] * 5  # Arrays need closing brackets
        nested_tokens = analysis["nested_objects"] * 3  # Nested objects need closing braces
        base_buffer = 50  # Base safety buffer

        estimated_tokens = depth_tokens + array_tokens + nested_tokens + base_buffer

        # Cap at reasonable maximum
        final_buffer = min(estimated_tokens, 300)

        logger.info(f"  Buffer calculation breakdown:")
        logger.info(f"    - Depth tokens ({analysis['max_depth']} * 10): {depth_tokens}")
        logger.info(f"    - Array tokens ({analysis['array_fields']} * 5): {array_tokens}")
        logger.info(f"    - Nested tokens ({analysis['nested_objects']} * 3): {nested_tokens}")
        logger.info(f"    - Base buffer: {base_buffer}")
        logger.info(f"    - Total calculated: {estimated_tokens}")
        logger.info(f"    - Final buffer (capped at 300): {final_buffer}")
        logger.info("=" * 80)

        return final_buffer

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
        max_retries: int = 2,
    ) -> dict:
        """
        Generate structured output using vLLM guided decoding with retry logic.

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
            max_retries: Maximum number of retries for incomplete JSON (default: 2)

        Returns:
            Dictionary containing structured output and metadata
        """
        if not self._initialized or self.engine is None:
            await self.initialize()

        # Add buffer for JSON closing (approximately 200 tokens for safety)
        # This ensures there's enough space to properly close nested structures
        effective_max_tokens = max_tokens
        if guided_type == "json" and json_schema:
            # Estimate closing tokens needed based on schema depth
            closing_buffer = self._estimate_json_closing_tokens(json_schema)
            effective_max_tokens = max_tokens + closing_buffer
            logger.info(
                f"Added {closing_buffer} token buffer for JSON closing. "
                f"Effective max_tokens: {effective_max_tokens}"
            )

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

            # Retry loop for JSON generation
            retry_count = 0
            last_error = None

            while retry_count <= max_retries:
                # Create sampling parameters with guided decoding
                # Use effective_max_tokens which includes buffer for closing
                current_max_tokens = (
                    effective_max_tokens if retry_count == 0 else effective_max_tokens * 1.2
                )

                sampling_params = SamplingParams(
                    temperature=temperature,
                    top_p=top_p,
                    max_tokens=int(current_max_tokens),
                    guided_decoding=guided_params,
                )

                # Generate text with guided decoding
                attempt_msg = f" (attempt {retry_count + 1}/{max_retries + 1})" if retry_count > 0 else ""
                logger.info(
                    f"Generating structured output (type: {guided_type}) with prompt length: {len(prompt)}"
                    f"{attempt_msg}"
                )
                request_id = f"structured-{asyncio.current_task().get_name()}-{retry_count}"

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

                # Calculate token usage metrics
                token_allocation = int(current_max_tokens)
                token_utilization = (tokens_used / token_allocation) * 100 if token_allocation > 0 else 0
                tokens_unused = token_allocation - tokens_used
                output_size = len(generated_text)

                logger.info("=" * 80)
                logger.info("GENERATION METRICS:")
                logger.info(f"  Tokens allocated: {token_allocation}")
                logger.info(f"  Tokens used: {tokens_used}")
                logger.info(f"  Tokens unused: {tokens_unused}")
                logger.info(f"  Token utilization: {token_utilization:.1f}%")
                logger.info(f"  Finish reason: {finish_reason}")
                logger.info(f"  Output size: {output_size} characters")
                logger.info(f"  Retry attempt: {retry_count + 1}/{max_retries + 1}")
                logger.info("=" * 80)

                # Parse JSON if type is "json"
                parsed_output = None
                is_valid = True
                if guided_type == "json":
                    try:
                        parsed_output = json.loads(generated_text)

                        # Calculate buffer efficiency
                        if retry_count == 0:  # Only for first attempt
                            allocated_buffer = token_allocation - max_tokens
                            # How many tokens beyond max_tokens did we actually use?
                            tokens_beyond_max = max(0, tokens_used - max_tokens)
                            # Buffer efficiency = (tokens used beyond max) / (buffer allocated) * 100
                            buffer_efficiency = (tokens_beyond_max / allocated_buffer * 100) if allocated_buffer > 0 else 0

                            # Calculate buffer utilization percentage
                            buffer_utilization = (tokens_beyond_max / allocated_buffer * 100) if allocated_buffer > 0 else 0
                            tokens_unused_in_buffer = allocated_buffer - tokens_beyond_max

                            logger.info("=" * 80)
                            logger.info("✅ JSON PARSING SUCCESSFUL!")
                            logger.info(f"  Base max_tokens: {max_tokens}")
                            logger.info(f"  Buffer allocated: {allocated_buffer} tokens")
                            logger.info(f"  Total allocated: {token_allocation} tokens")
                            logger.info(f"  Tokens used: {tokens_used} tokens")
                            logger.info(f"  Tokens beyond max_tokens: {tokens_beyond_max} tokens")
                            logger.info(f"  Buffer utilization: {buffer_utilization:.1f}%")
                            logger.info(f"  Buffer unused: {tokens_unused_in_buffer} tokens")
                            if tokens_beyond_max == 0:
                                logger.info(f"  ℹ️  Model finished within max_tokens - No buffer needed")
                            elif buffer_utilization < 50:
                                logger.info(f"  ✅ Buffer is over-allocated (used {buffer_utilization:.1f}%)")
                            elif 50 <= buffer_utilization <= 100:
                                logger.info(f"  ✅ Buffer is well-sized (used {buffer_utilization:.1f}%)")
                            else:
                                logger.info(f"  ⚠️  Buffer was insufficient (needed {buffer_utilization:.1f}%)")
                            logger.info("=" * 80)

                        # Success! Return immediately
                        return {
                            "output": generated_text,
                            "parsed_output": parsed_output,
                            "model": self.model_name,
                            "tokens_used": tokens_used,
                            "finish_reason": finish_reason if finish_reason else "unknown",
                            "is_valid": True,
                            "retry_count": retry_count,
                        }
                    except json.JSONDecodeError as e:
                        last_error = e

                        logger.error("=" * 80)
                        logger.error(f"❌ JSON PARSING FAILED (attempt {retry_count + 1}/{max_retries + 1})")
                        logger.error(f"  Error: {e}")
                        logger.error(f"  Error position: char {e.pos} (line {e.lineno}, col {e.colno})")
                        logger.error(f"  Token allocation: {token_allocation}")
                        logger.error(f"  Tokens used: {tokens_used} ({token_utilization:.1f}%)")

                        # Show context around error
                        if e.pos and e.pos > 0:
                            context_start = max(0, e.pos - 100)
                            context_end = min(len(generated_text), e.pos + 100)
                            context = generated_text[context_start:context_end]
                            logger.error(f"  Context: ...{context}...")

                        # Analyze why parsing failed
                        if token_utilization > 95:
                            logger.error(f"  ⚠️  LIKELY CAUSE: Hit token limit (>{token_utilization:.0f}% used)")
                            logger.error(f"  ⚠️  RECOMMENDATION: Increase buffer or max_tokens")
                        elif finish_reason == "length":
                            logger.error(f"  ⚠️  CONFIRMED CAUSE: Generation stopped due to length limit")
                        else:
                            logger.error(f"  ⚠️  POSSIBLE CAUSE: Model output formatting issue")

                        logger.error("=" * 80)

                        is_valid = False

                        # If we've exhausted retries, return the last attempt
                        if retry_count >= max_retries:
                            logger.error("=" * 80)
                            logger.error(f"🚫 RETRY LIMIT REACHED - Returning invalid output")
                            logger.error(f"  Total attempts: {retry_count + 1}")
                            logger.error(f"  Final error: {str(last_error)}")
                            logger.error("=" * 80)

                            return {
                                "output": generated_text,
                                "parsed_output": None,
                                "model": self.model_name,
                                "tokens_used": tokens_used,
                                "finish_reason": finish_reason if finish_reason else "unknown",
                                "is_valid": False,
                                "retry_count": retry_count,
                                "error": str(last_error),
                            }

                        # Retry with increased tokens
                        retry_count += 1
                        new_max_tokens = int(effective_max_tokens * 1.2)

                        logger.info("=" * 80)
                        logger.info(f"🔄 INITIATING RETRY #{retry_count}")
                        logger.info(f"  Previous max_tokens: {token_allocation}")
                        logger.info(f"  New max_tokens: {new_max_tokens} (+20%)")
                        logger.info(f"  Reason: JSON truncation detected")
                        logger.info("=" * 80)
                else:
                    # Not JSON type, return immediately
                    return {
                        "output": generated_text,
                        "parsed_output": parsed_output,
                        "model": self.model_name,
                        "tokens_used": tokens_used,
                        "finish_reason": finish_reason if finish_reason else "unknown",
                        "is_valid": is_valid,
                        "retry_count": 0,
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
