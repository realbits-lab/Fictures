# AI Server Architecture

Technical architecture and design decisions for the Fictures AI Server.

## System Overview

```
┌────────────────────────────────────────────────────────────────┐
│                     Fictures AI Server                          │
│                         (FastAPI)                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    API Layer                              │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │ │
│  │  │   Routes   │  │  Schemas   │  │Middleware  │         │ │
│  │  │  (FastAPI) │  │ (Pydantic) │  │   (CORS)   │         │ │
│  │  └────────────┘  └────────────┘  └────────────┘         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                  Service Layer                            │ │
│  │  ┌────────────────────┐    ┌────────────────────┐        │ │
│  │  │ TextGeneration     │    │ ImageGeneration    │        │ │
│  │  │    Service         │    │     Service        │        │ │
│  │  │                    │    │                    │        │ │
│  │  │ - Initialize       │    │ - Initialize       │        │ │
│  │  │ - Generate         │    │ - Generate         │        │ │
│  │  │ - Stream           │    │ - Optimization     │        │ │
│  │  │ - Model info       │    │ - Model info       │        │ │
│  │  └────────────────────┘    └────────────────────┘        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                  Model Layer                              │ │
│  │  ┌────────────────────┐    ┌────────────────────┐        │ │
│  │  │  vLLM Engine       │    │ Diffusers Pipeline │        │ │
│  │  │                    │    │                    │        │ │
│  │  │ - Async engine     │    │ - SDXL model       │        │ │
│  │  │ - Gemma models     │    │ - Schedulers       │        │ │
│  │  │ - Tensor parallel  │    │ - VAE encoding     │        │ │
│  │  │ - PagedAttention   │    │ - Attention slicing│        │ │
│  │  └────────────────────┘    └────────────────────┘        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                  Infrastructure Layer                     │ │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │ │
│  │  │ PyTorch│  │  CUDA  │  │ cuDNN  │  │ Config │         │ │
│  │  └────────┘  └────────┘  └────────┘  └────────┘         │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Core Framework
- **FastAPI 0.115+** - Modern, high-performance web framework
- **Uvicorn** - ASGI server with asyncio support
- **Pydantic 2.10+** - Data validation and settings management

### AI/ML Libraries

**Text Generation:**
- **vLLM 0.6.6** - High-throughput LLM inference engine
  - PagedAttention for efficient memory management
  - Continuous batching for multiple requests
  - Tensor parallelism for multi-GPU setups
- **Transformers 4.46+** - Hugging Face model loading
- **Gemma Models** - Google's open-weight LLMs

**Image Generation:**
- **Diffusers 0.32+** - Hugging Face diffusion models library
- **Stable Diffusion XL** - State-of-the-art image generation
- **PyTorch 2.5+** - Deep learning framework
- **Pillow** - Image processing

### Infrastructure
- **CUDA 11.8+** - GPU acceleration
- **cuDNN** - Deep learning primitives

## Design Principles

### 1. Lazy Loading

Models are loaded on first request, not at startup:

**Benefits:**
- Faster server startup
- Lower memory usage when idle
- Graceful degradation if models fail to load

**Implementation:**
```python
async def initialize(self):
    if self._initialized:
        return
    # Load model only once
    self.engine = await self._load_model()
    self._initialized = True
```

### 2. Async-First Architecture

All I/O operations are asynchronous:

**Benefits:**
- Handle multiple concurrent requests
- Non-blocking model inference
- Efficient resource utilization

**Implementation:**
```python
async def generate(self, prompt: str):
    # Run in executor to avoid blocking
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, self._generate, prompt)
    return result
```

### 3. Streaming Support

Real-time text generation with Server-Sent Events:

**Benefits:**
- Lower perceived latency
- Progressive rendering in UI
- Better user experience

**Implementation:**
```python
async def generate_stream(self, prompt: str):
    async for chunk in self.engine.generate(prompt):
        yield {"text": chunk.text, "done": False}
```

### 4. Memory Optimization

Multiple strategies for GPU memory management:

**Techniques:**
- Attention slicing (Diffusers)
- VAE slicing for large images
- CPU offloading when needed
- Configurable memory utilization limits

### 5. Error Handling

Comprehensive error handling at all layers:

**Levels:**
- Input validation (Pydantic)
- Request validation (FastAPI)
- Service-level errors (try/except)
- Model-level errors (graceful fallback)

## Component Details

### FastAPI Application

**Lifespan Management:**
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize resources
    logger.info("Starting server...")
    yield
    # Shutdown: Clean up resources
    await text_service.shutdown()
    await image_service.shutdown()
```

**CORS Middleware:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Text Generation Service

**vLLM Engine Configuration:**
```python
engine_args = AsyncEngineArgs(
    model=model_name,
    tensor_parallel_size=1,           # Multi-GPU support
    max_model_len=4096,               # Context window
    gpu_memory_utilization=0.5,       # Memory limit
    max_num_seqs=256,                 # Batch size
    trust_remote_code=True,           # For custom models
)
```

**Sampling Parameters:**
```python
sampling_params = SamplingParams(
    temperature=0.7,       # Randomness (0.0 = deterministic)
    top_p=0.9,            # Nucleus sampling
    max_tokens=2048,      # Max generation length
    stop=["</s>"],        # Stop sequences
)
```

### Image Generation Service

**SDXL Pipeline Configuration:**
```python
pipeline = StableDiffusionXLPipeline.from_pretrained(
    model_name,
    torch_dtype=torch.float16,     # Half precision for speed
    use_safetensors=True,          # Fast model loading
    variant="fp16",                # FP16 weights
)

# Optimizations
pipeline.enable_attention_slicing()    # Memory efficient
pipeline.enable_vae_slicing()          # For large images
pipeline.scheduler = DPMSolverMultistepScheduler(...)  # Fast sampler
```

**Generation Parameters:**
```python
image = pipeline(
    prompt=prompt,
    negative_prompt=negative_prompt,
    width=1344,                    # Output size
    height=768,
    num_inference_steps=30,        # Quality vs speed
    guidance_scale=7.5,            # Prompt adherence
    generator=generator,           # Seed control
)
```

## Performance Characteristics

### Text Generation (Gemma 2B)

**Cold Start:**
- Model loading: 10-15 seconds
- First inference: +2-3 seconds

**Warm Inference:**
- Throughput: 20-50 tokens/sec (RTX 3090)
- Latency: 50-100ms per token
- Memory: 4-6 GB GPU RAM

**Batch Processing:**
- Continuous batching via vLLM
- Up to 256 concurrent sequences
- Shared KV cache across requests

### Image Generation (SDXL)

**Cold Start:**
- Model loading: 15-20 seconds
- First inference: +3-5 seconds

**Warm Inference:**
- 1024×1024 @ 20 steps: 2-4 seconds (RTX 3090)
- 1024×1024 @ 30 steps: 3-6 seconds
- Memory: 8-10 GB GPU RAM

**Quality vs Speed:**
| Steps | Quality | Speed |
|-------|---------|-------|
| 10 | Low | 1-2s |
| 20 | Good | 2-4s |
| 30 | High | 3-6s |
| 50 | Very High | 5-10s |

## Scalability Considerations

### Horizontal Scaling

**Load Balancer:**
```
         ┌──────────────┐
         │ Load Balancer│
         └──────┬───────┘
                │
        ┌───────┼───────┐
        │       │       │
     ┌──▼──┐ ┌──▼──┐ ┌──▼──┐
     │ GPU1│ │ GPU2│ │ GPU3│
     │ AI  │ │ AI  │ │ AI  │
     │Server│ │Server│ │Server│
     └─────┘ └─────┘ └─────┘
```

**Benefits:**
- Independent model loading
- No shared state
- Easy scaling

### Vertical Scaling

**Multi-GPU Setup:**
```python
# .env configuration
CUDA_VISIBLE_DEVICES=0,1,2,3
VLLM_TENSOR_PARALLEL_SIZE=4
```

**Benefits:**
- Larger models (Gemma 27B)
- Higher throughput
- Shared memory pool

## Security Considerations

**Current State:**
- No authentication (local use only)
- No rate limiting
- CORS enabled for localhost

**Future Enhancements:**
- API key authentication
- Rate limiting per client
- Request size limits
- Input sanitization
- Model access control

## Monitoring and Observability

**Logging:**
- Structured JSON logs
- Request/response logging
- Error tracking
- Performance metrics

**Health Checks:**
- Model initialization status
- GPU memory usage
- Request latency
- Error rates

**Future Additions:**
- Prometheus metrics
- OpenTelemetry tracing
- Grafana dashboards
- Alert management

## Configuration Management

**Environment Variables:**
- `.env` file for local config
- Pydantic Settings for validation
- Type-safe configuration access
- Environment-specific overrides

**Example:**
```python
from src.config import settings

# Type-safe access
model_name = settings.text_model_name
gpu_memory = settings.text_gpu_memory_utilization
```

## Future Enhancements

### Planned Features
1. **Authentication** - API key-based auth
2. **Rate Limiting** - Per-client request limits
3. **Caching** - Response caching for common requests
4. **Model Registry** - Dynamic model loading
5. **Quantization** - 4-bit/8-bit model support
6. **Multi-Model** - Support multiple models concurrently
7. **Batch API** - Batch processing endpoint
8. **Webhooks** - Async generation with callbacks

### Performance Optimizations
1. **Flash Attention** - Faster attention computation
2. **TensorRT** - Model optimization for inference
3. **Model Caching** - Keep multiple models in memory
4. **Request Batching** - Automatic request batching
5. **Speculative Decoding** - Faster text generation

---

**Next:** See [Performance Optimization](./performance.md) for tuning tips
