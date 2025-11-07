# AI Server Architecture

Technical architecture and design decisions for the Fictures AI Server.

## System Overview

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Web Frontend (Next.js)                         │
│                      Port 3000                                   │
│  - Story writing interface                                       │
│  - Image generation UI                                           │
│  - User experience layer                                         │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP REST API
                     │ POST /api/v1/images/generate
                     │ GET /api/v1/models
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              FastAPI Middleware Layer (Python)                   │
│                      Port 8000                                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Layer                              │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │   Routes   │  │  Schemas   │  │Middleware  │         │  │
│  │  │  (FastAPI) │  │ (Pydantic) │  │   (CORS)   │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Image Service Layer                          │  │
│  │  ┌────────────────────────────────────────────┐          │  │
│  │  │  QwenImageComfyUIAPIService                │          │  │
│  │  │                                             │          │  │
│  │  │  - Abstracts ComfyUI workflow complexity   │          │  │
│  │  │  - Validates requests (prompt, dimensions) │          │  │
│  │  │  - Manages workflow template               │          │  │
│  │  │  - Polls for completion                    │          │  │
│  │  │  - Retrieves and encodes images            │          │  │
│  │  └────────────────────────────────────────────┘          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP API
                     │ POST /prompt (workflow JSON)
                     │ GET /history/{prompt_id}
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  ComfyUI Server (Python)                        │
│                  Port 8188 (localhost only)                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Workflow Processing Engine                  │  │
│  │                                                            │  │
│  │  UNETLoader → LoraLoader → ModelSampling                  │  │
│  │       ↓            ↓              ↓                        │  │
│  │  CLIPLoader → CLIPTextEncode → KSampler → VAEDecode      │  │
│  │                                                 ↓          │  │
│  │                                           SaveImage        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Model Layer                            │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  Qwen-Image-Lightning v2.0 FP8 (4-step)             │ │  │
│  │  │                                                       │ │  │
│  │  │  • UNET:  qwen_image_fp8_e4m3fn_scaled.safetensors  │ │  │
│  │  │           (20GB, Scaled FP8)                         │ │  │
│  │  │  • LoRA:  Qwen-Image-Lightning-4steps-V2.0          │ │  │
│  │  │           (1.6GB, BF16-trained)                      │ │  │
│  │  │  • CLIP:  qwen_2.5_vl_7b_fp8_scaled.safetensors     │ │  │
│  │  │           (8.8GB, FP8)                               │ │  │
│  │  │  • VAE:   qwen_image_vae.safetensors                │ │  │
│  │  │           (243MB)                                    │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Infrastructure Layer                         │  │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │  │
│  │  │PyTorch │  │  CUDA  │  │ cuDNN  │  │  GPU   │         │  │
│  │  │ 2.8.0  │  │ 12.1+  │  │        │  │ 24GB   │         │  │
│  │  └────────┘  └────────┘  └────────┘  └────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Architectural Decision: Why Keep FastAPI Middleware?

### The Question
Could the web frontend connect directly to ComfyUI, eliminating the FastAPI layer?

```
❌ Considered: Frontend → ComfyUI (Direct)
✅ Chosen:     Frontend → FastAPI → ComfyUI (Middleware)
```

### Rationale for FastAPI Middleware Layer

#### 1. **API Abstraction & Simplification**

**Without FastAPI:**
Frontend must manage complex ComfyUI workflow JSON:
```json
{
  "37": { "class_type": "UNETLoader", "inputs": {...} },
  "38": { "class_type": "CLIPLoader", "inputs": {...} },
  "75": { "class_type": "LoraLoaderModelOnly", "inputs": {...} },
  "66": { "class_type": "ModelSamplingAuraFlow", "inputs": {...} },
  "67": { "class_type": "CLIPTextEncode", "inputs": {"text": "...", "clip": ["38", 0]} },
  "73": { "class_type": "EmptyLatentImage", "inputs": {...} },
  "74": { "class_type": "KSampler", "inputs": {...} },
  "76": { "class_type": "VAEDecode", "inputs": {...} },
  "77": { "class_type": "SaveImage", "inputs": {...} }
}
```

**With FastAPI:**
Frontend makes simple REST call:
```json
POST /api/v1/images/generate
{
  "prompt": "A beautiful sunset over mountains",
  "width": 1328,
  "height": 1328,
  "num_inference_steps": 4,
  "seed": 42
}
```

**Benefit:** Frontend focuses on UX, not ComfyUI implementation details.

#### 2. **Security & Network Isolation**

**ComfyUI Security Concerns:**
- Runs on `127.0.0.1:8188` (localhost only)
- No built-in authentication
- No rate limiting
- Full access to model files and system

**Options for Direct Access:**

**Option A: Expose ComfyUI to Internet**
- ❌ Security risk: No auth, no input validation
- ❌ Expose model files and internal paths
- ❌ No rate limiting → DoS vulnerability
- ❌ CORS issues for web frontend

**Option B: Frontend on Same Machine**
- ❌ Deployment constraint: Can't separate frontend/backend
- ❌ Can't scale frontend independently
- ❌ Local-only development

**With FastAPI Middleware:**
- ✅ FastAPI exposed to internet with CORS, auth, rate limiting
- ✅ ComfyUI isolated on localhost
- ✅ FastAPI validates/sanitizes inputs before passing to ComfyUI
- ✅ FastAPI provides request logging and monitoring
- ✅ Flexible deployment: Frontend can be on CDN, FastAPI on GPU server

#### 3. **Business Logic Layer**

FastAPI provides critical business logic:

**Request Processing:**
- Prompt validation (length, content safety)
- Dimension validation (max 2048x2048)
- Parameter normalization (default values)
- Seed generation/management

**Response Processing:**
- Image encoding (base64)
- Error handling with user-friendly messages
- Consistent response format
- Usage metrics collection

**Future Capabilities:**
- Prompt enhancement (auto-improve prompts)
- Content safety filtering
- Watermarking
- Multiple image sizes/formats
- Caching for repeated prompts
- Queue management for high load

**Question:** Where does this logic go without FastAPI?
- In frontend? → Backend logic in frontend code
- In ComfyUI? → Can't modify ComfyUI code easily

#### 4. **Multiple Client Support**

With FastAPI, the same API serves:
- Web frontend (Next.js)
- Mobile app (future)
- CLI tools
- Other internal services
- Third-party integrations

**Single source of truth** for image generation logic.

#### 5. **Monitoring & Observability**

FastAPI provides:
- Request/response logging
- Performance metrics
- Error tracking
- Health checks (`/health`, `/api/v1/models`)
- Debug information

ComfyUI lacks built-in monitoring and structured logging.

#### 6. **Future Flexibility**

**Text Generation:**
- Currently disabled (using full GPU for images)
- FastAPI already handles text generation endpoints
- When re-enabled, unified API for text + images

**Multi-Model Support:**
- Could add Stable Diffusion XL alongside Qwen-Image
- Could add different LoRAs (v1.0 8-step, v2.0 4-step)
- Frontend doesn't change, just calls same API

**Backend Swapping:**
- Could replace ComfyUI with Diffusers
- Could add model versioning
- Frontend code unaffected by backend changes

### Trade-offs

**Cost of FastAPI Layer:**
- ➕ One more service to deploy and monitor
- ➕ Additional network hop (minimal latency: ~10-20ms)
- ➕ More code to maintain

**Benefits:**
- ✅ Clean separation of concerns
- ✅ Security and access control
- ✅ API abstraction (simple frontend, complex backend)
- ✅ Business logic centralization
- ✅ Monitoring and observability
- ✅ Future flexibility
- ✅ Multi-client support

**Verdict:** The architectural benefits far outweigh the operational overhead.

## Technology Stack

### FastAPI Middleware Layer

**Core Framework:**
- **FastAPI 0.121.0** - Modern, high-performance web framework
- **Uvicorn 0.38.0** - ASGI server with asyncio support
- **Pydantic 2.12.4** - Data validation and settings management

**HTTP Client:**
- **httpx** - Async HTTP client for ComfyUI communication

**Image Processing:**
- **Pillow 12.0.0** - Image encoding/decoding

### ComfyUI Backend

**ComfyUI Server:**
- Git submodule: `comfyui/` directory
- Repository: https://github.com/comfyanonymous/ComfyUI.git
- Workflow-based node processing system

**AI/ML Libraries:**
- **PyTorch 2.8.0** - Deep learning framework (exact version required)
- **Transformers 4.57.1** - Hugging Face transformers
- **Diffusers 0.35.2** - Diffusion model pipelines
- **Accelerate 1.11.0** - PyTorch acceleration

**Infrastructure:**
- **CUDA 12.1+** - GPU acceleration
- **cuDNN** - Deep learning primitives
- **24GB GPU RAM** - RTX 4090 or equivalent

### Current Model Configuration

**Image Generation Model:**
- **Base**: Qwen-Image (FP8 quantized, scaled)
- **LoRA**: Qwen-Image-Lightning v2.0 (4-step)
- **Source**: https://huggingface.co/lightx2v/Qwen-Image-Lightning

**Model Files:**
```
comfyui/models/
├── diffusion_models/
│   └── qwen_image_fp8_e4m3fn_scaled.safetensors    (20GB)
├── text_encoders/
│   └── qwen_2.5_vl_7b_fp8_scaled.safetensors       (8.8GB)
├── vae/
│   └── qwen_image_vae.safetensors                  (243MB)
└── loras/
    └── Qwen-Image-Lightning-4steps-V2.0.safetensors (1.6GB)
```

**Total Storage:** ~30GB

**Text Generation:**
- **Status**: Temporarily disabled
- **Reason**: Using full GPU (24GB) for image generation only
- **Model**: Qwen/Qwen3-14B-AWQ (14B params, 4-bit AWQ quantization)
- **Future**: Will re-enable when GPU resources allow

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
    # Model loading handled by ComfyUI on first request
    self._initialized = True
```

### 2. Async-First Architecture

All I/O operations are asynchronous:

**Benefits:**
- Handle multiple concurrent requests
- Non-blocking ComfyUI communication
- Efficient resource utilization

**Implementation:**
```python
async def generate(self, prompt: str, width: int, height: int):
    # Submit workflow to ComfyUI
    response = await self.client.post(
        f"{self.comfyui_url}/prompt",
        json={"prompt": workflow}
    )
    # Poll for completion
    while not complete:
        result = await self.client.get(
            f"{self.comfyui_url}/history/{prompt_id}"
        )
        await asyncio.sleep(1)
```

### 3. Workflow Abstraction

ComfyUI uses complex node-based workflows. FastAPI abstracts this:

**Internal Workflow Template:**
```python
workflow_template = {
    "37": {  # UNETLoader
        "class_type": "UNETLoader",
        "inputs": {
            "unet_name": "qwen_image_fp8_e4m3fn_scaled.safetensors",
            "weight_dtype": "fp8_e4m3fn"
        }
    },
    "75": {  # LoraLoaderModelOnly
        "class_type": "LoraLoaderModelOnly",
        "inputs": {
            "lora_name": "Qwen-Image-Lightning-4steps-V2.0.safetensors",
            "strength_model": 1.0,
            "model": ["37", 0]
        }
    },
    # ... 8 more nodes ...
}
```

**External API:**
```python
POST /api/v1/images/generate
{
    "prompt": "user prompt here",
    "width": 1328,
    "height": 1328
}
```

FastAPI fills in the workflow template with user parameters.

### 4. Memory Optimization

**FP8 Quantization Benefits:**
- **Storage:** 20GB (FP8) vs 40GB (BF16) - 50% reduction
- **VRAM:** Fits in 24GB with other models
- **Quality:** Minimal quality loss with scaled FP8

**v2.0 4-step LoRA Benefits:**
- **Speed:** 4 steps vs 8 steps (v1.0) - 2× faster
- **Quality:** Better skin texture, reduced over-saturation
- **No Artifacts:** Scaled FP8 base eliminates grid patterns

**CPU Offloading:**
- Currently not needed (fits in 24GB)
- Available if adding text generation back

### 5. Error Handling

Comprehensive error handling at all layers:

**Levels:**
1. **Input validation** (Pydantic schemas)
   ```python
   if request.width > 2048:
       raise HTTPException(status_code=400, detail="Width too large")
   ```

2. **ComfyUI communication** (try/except)
   ```python
   try:
       response = await client.post(url, json=workflow)
   except Exception as e:
       logger.error(f"ComfyUI request failed: {e}")
       raise HTTPException(status_code=500, detail="Image generation failed")
   ```

3. **Result validation** (check for image data)
   ```python
   if "images" not in result:
       raise HTTPException(status_code=500, detail="No image generated")
   ```

## Component Details

### FastAPI Application

**Lifespan Management:**
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Fictures AI Server (Image Generation Only)...")
    logger.info("Image model: Qwen-Image-Lightning v2.0 FP8 (4-step, via ComfyUI)")
    logger.info("ComfyUI server: http://127.0.0.1:8188")
    yield
    # Shutdown
    await image_service.shutdown()
    logger.info("Shutdown complete")
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

**API Endpoints:**
- `GET /health` - Health check with model status
- `GET /api/v1/models` - List all available models
- `GET /api/v1/images/models` - List image generation models
- `POST /api/v1/images/generate` - Generate image
- `GET /docs` - Interactive API documentation
- `GET /redoc` - Alternative API documentation

### Image Generation Service (ComfyUI API)

**Service Class:**
```python
class QwenImageComfyUIAPIService:
    def __init__(self, comfyui_url: str = "http://127.0.0.1:8188"):
        self.comfyui_url = comfyui_url
        self.client = httpx.AsyncClient(timeout=300.0)
        self.workflow_template = { ... }  # Node graph
```

**Generation Flow:**

1. **Receive Request**
   ```python
   async def generate(
       self,
       prompt: str,
       negative_prompt: str = "",
       width: int = 1328,
       height: int = 1328,
       num_inference_steps: int = 4,
       guidance_scale: float = 1.0,
       seed: int = None
   )
   ```

2. **Prepare Workflow**
   ```python
   workflow = copy.deepcopy(self.workflow_template)
   workflow["67"]["inputs"]["text"] = prompt
   workflow["73"]["inputs"]["width"] = width
   workflow["73"]["inputs"]["height"] = height
   workflow["74"]["inputs"]["seed"] = seed or random.randint(0, 2**32)
   ```

3. **Submit to ComfyUI**
   ```python
   response = await self.client.post(
       f"{self.comfyui_url}/prompt",
       json={"prompt": workflow}
   )
   prompt_id = response.json()["prompt_id"]
   ```

4. **Poll for Completion**
   ```python
   while True:
       history = await self.client.get(
           f"{self.comfyui_url}/history/{prompt_id}"
       )
       if prompt_id in history.json():
           break
       await asyncio.sleep(1)
   ```

5. **Retrieve Image**
   ```python
   image_data = await self.client.get(
       f"{self.comfyui_url}/view",
       params={"filename": filename, "type": "output"}
   )
   ```

6. **Encode & Return**
   ```python
   base64_image = base64.b64encode(image_data.content).decode()
   return {
       "image_url": f"data:image/png;base64,{base64_image}",
       "model": "Qwen-Image FP8 + Lightning v2.0 4-step (ComfyUI API)",
       "width": width,
       "height": height,
       "seed": seed
   }
   ```

### ComfyUI Workflow

**Node Graph (10 nodes):**

```
UNETLoader (FP8) ──┐
                   ├─→ LoraLoader (v2.0 4-step) ─→ ModelSampling ──┐
                   │                                                 │
CLIPLoader (FP8) ──┴─→ CLIPTextEncode (prompt) ────────────────────┤
                       CLIPTextEncode (negative) ──────────────────┤
                                                                    │
EmptyLatentImage ──────────────────────────────────────────────────┤
                                                                    │
                   ┌────────────────────────────────────────────────┘
                   ▼
                KSampler (4 steps) ─→ VAEDecode ─→ SaveImage
```

**Key Nodes:**
- **UNETLoader**: Loads FP8-quantized UNET model
- **LoraLoaderModelOnly**: Applies 4-step v2.0 LoRA
- **ModelSamplingAuraFlow**: Configures flow sampling (shift=3.0)
- **CLIPLoader**: Loads FP8-quantized CLIP text encoder
- **CLIPTextEncode**: Encodes prompt and negative prompt
- **EmptyLatentImage**: Creates latent tensor (1328x1328)
- **KSampler**: Runs 4-step diffusion sampling
- **VAEDecode**: Decodes latent to RGB image
- **SaveImage**: Saves output PNG

## Performance Characteristics

### Image Generation (Qwen-Image-Lightning v2.0 FP8)

**Cold Start:**
- ComfyUI server startup: 10-15 seconds
- Model loading (first request): 15-20 seconds
- Total cold start: 25-35 seconds

**Warm Inference:**
- 1328×1328 @ 4 steps: ~15-20 seconds (RTX 4090)
- 1024×1024 @ 4 steps: ~12-15 seconds
- Memory: 18-22 GB GPU RAM (includes ComfyUI overhead)

**v1.0 vs v2.0 Comparison:**

| Version | Steps | Speed | Quality | Artifacts |
|---------|-------|-------|---------|-----------|
| v1.0    | 8     | 30s   | Good    | None      |
| v2.0 (BF16 base) | 8 | 30s | Better | Grid patterns |
| v2.0 (FP8 base)  | 4 | 15s | Best | None      |

**v2.0 Improvements:**
- Reduced over-saturation
- Improved skin texture and natural lighting
- More realistic visuals
- 2× faster (4 steps vs 8 steps)

### Request Flow Latency

**Total Generation Time Breakdown:**

```
User Request
    ↓
FastAPI Validation      (~5-10ms)
    ↓
Workflow Preparation    (~5-10ms)
    ↓
ComfyUI Submission     (~10-20ms)
    ↓
ComfyUI Processing     (15-20 seconds)
    ├─ Model inference  (14-19s)
    └─ Image saving     (500-1000ms)
    ↓
Image Retrieval        (~100-200ms)
    ↓
Base64 Encoding        (~50-100ms)
    ↓
FastAPI Response       (~10-20ms)
    ↓
Total: ~15-20 seconds
```

**FastAPI Overhead:** ~180-360ms (1-2% of total time)

## Scalability Considerations

### Current Setup (Single GPU)

```
┌──────────────┐
│ Web Frontend │
│  Port 3000   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   FastAPI    │
│  Port 8000   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   ComfyUI    │  ──►  GPU (24GB)
│  Port 8188   │       RTX 4090
└──────────────┘
```

**Concurrent Requests:**
- ComfyUI processes one image at a time
- FastAPI queues additional requests
- Typical load: 1-5 requests/minute

### Horizontal Scaling (Multiple GPUs)

```
         ┌──────────────┐
         │ Load Balancer│
         │  (nginx)     │
         └──────┬───────┘
                │
        ┌───────┼───────┬───────┐
        │       │       │       │
     ┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐
     │FastAPI│FastAPI│FastAPI│FastAPI│
     │:8000 │ :8001│ :8002│ :8003│
     └──┬───┘ └──┬──┘ └──┬──┘ └──┬──┘
        │       │       │       │
     ┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐
     │ComfyUI│ComfyUI│ComfyUI│ComfyUI│
     │:8188│ :8189│ :8190│ :8191│
     └──┬───┘ └──┬──┘ └──┬──┘ └──┬──┘
        │       │       │       │
      GPU 0   GPU 1   GPU 2   GPU 3
```

**Benefits:**
- 4× throughput
- Independent model loading
- No shared state
- Simple scaling

**Configuration:**
```bash
# Machine 1
CUDA_VISIBLE_DEVICES=0 python -m uvicorn src.main:app --port 8000
cd comfyui && CUDA_VISIBLE_DEVICES=0 python main.py --port 8188

# Machine 2
CUDA_VISIBLE_DEVICES=1 python -m uvicorn src.main:app --port 8001
cd comfyui && CUDA_VISIBLE_DEVICES=1 python main.py --port 8189
```

## Security Considerations

### Current Implementation

**FastAPI Layer:**
- ✅ CORS enabled for specified origins
- ✅ Request validation (Pydantic)
- ✅ Input sanitization (prompt length, dimensions)
- ✅ Error messages don't expose internals
- ❌ No authentication (local use only)
- ❌ No rate limiting
- ❌ No API keys

**ComfyUI Layer:**
- ✅ Localhost only (127.0.0.1:8188)
- ✅ Not exposed to internet
- ✅ Accessed only by FastAPI
- ❌ No authentication (not needed - local only)

### Production Security Enhancements

**When Deploying to Production:**

1. **Authentication & Authorization**
   ```python
   from fastapi.security import HTTPBearer

   security = HTTPBearer()

   @router.post("/generate")
   async def generate(
       request: ImageRequest,
       credentials: HTTPAuthorizationCredentials = Depends(security)
   ):
       verify_api_key(credentials.credentials)
       ...
   ```

2. **Rate Limiting**
   ```python
   from slowapi import Limiter

   limiter = Limiter(key_func=get_remote_address)

   @limiter.limit("10/minute")
   @router.post("/generate")
   async def generate(...):
       ...
   ```

3. **Content Safety**
   - Prompt filtering (profanity, NSFW)
   - Image content analysis
   - User reporting

4. **Request Limits**
   - Max prompt length: 1000 characters
   - Max dimensions: 2048×2048
   - Max concurrent requests per user: 3

5. **Network Isolation**
   ```
   Internet ─→ [Firewall] ─→ FastAPI :8000 (public)
                                │
                                ↓
                          ComfyUI :8188 (localhost only)
   ```

## Monitoring and Observability

### Health Checks

**Endpoint: `GET /health`**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "models": {
    "image": {
      "name": "Qwen-Image FP8 + Lightning v2.0 4-step (ComfyUI API)",
      "type": "image-generation",
      "framework": "ComfyUI",
      "device": "cuda",
      "initialized": true
    }
  }
}
```

**Checks:**
- FastAPI server responsive
- ComfyUI server reachable
- GPU available
- Models loaded

### Logging

**Structured Logging:**
```python
logger.info(
    "Image generation request received",
    extra={
        "prompt_length": len(prompt),
        "dimensions": f"{width}x{height}",
        "steps": num_inference_steps,
        "seed": seed
    }
)
```

**Log Levels:**
- `INFO`: Request/response, generation success
- `WARNING`: Validation failures, retries
- `ERROR`: ComfyUI errors, generation failures
- `DEBUG`: Workflow details, polling status

**Log Files:**
- `logs/ai-server.log` - FastAPI application logs
- `comfyui/comfyui.log` - ComfyUI server logs (if configured)

### Metrics (Future)

**Prometheus Metrics:**
- Request count by endpoint
- Generation latency (p50, p95, p99)
- Error rate
- GPU memory usage
- Queue depth

**Grafana Dashboards:**
- Request throughput
- Average generation time
- Error trends
- Resource utilization

## Configuration Management

### Environment Variables

**`.env` file:**
```bash
# Server
API_HOST=0.0.0.0
API_PORT=8000
LOG_LEVEL=info

# CORS
CORS_ORIGINS=http://localhost:3000,https://fictures.app

# ComfyUI
COMFYUI_URL=http://127.0.0.1:8188

# Models (future use)
TEXT_MODEL_NAME=Qwen/Qwen3-14B-AWQ
IMAGE_MODEL_NAME=Qwen-Image-Lightning

# GPU
CUDA_VISIBLE_DEVICES=0
```

**Type-Safe Access:**
```python
from src.config import settings

comfyui_url = settings.comfyui_url  # Type-checked
log_level = settings.log_level
```

### ComfyUI Configuration

**Startup Options:**
```bash
python main.py \
  --listen 127.0.0.1 \
  --port 8188 \
  --cuda-device 0 \
  --highvram  # Use more VRAM for better performance
```

**Model Paths:**
ComfyUI automatically finds models in:
- `comfyui/models/diffusion_models/`
- `comfyui/models/text_encoders/`
- `comfyui/models/vae/`
- `comfyui/models/loras/`

## Deployment

### Development Setup

**1. Start ComfyUI Server:**
```bash
cd comfyui
python main.py --listen 127.0.0.1 --port 8188
```

**2. Start FastAPI Server:**
```bash
source venv/bin/activate
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

**3. Start Web Frontend:**
```bash
cd ../web
pnpm dev  # Port 3000
```

### Production Deployment

**Process Manager (systemd):**

`/etc/systemd/system/comfyui.service`:
```ini
[Unit]
Description=ComfyUI Server
After=network.target

[Service]
Type=simple
User=fictures
WorkingDirectory=/app/ai-server/comfyui
Environment=CUDA_VISIBLE_DEVICES=0
ExecStart=/usr/bin/python3 main.py --listen 127.0.0.1 --port 8188
Restart=always

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/fictures-ai.service`:
```ini
[Unit]
Description=Fictures AI Server
After=network.target comfyui.service
Requires=comfyui.service

[Service]
Type=simple
User=fictures
WorkingDirectory=/app/ai-server
Environment=CUDA_VISIBLE_DEVICES=0
ExecStart=/app/ai-server/venv/bin/python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

**Start Services:**
```bash
sudo systemctl enable comfyui fictures-ai
sudo systemctl start comfyui fictures-ai
sudo systemctl status comfyui fictures-ai
```

### Docker Deployment (Future)

**Multi-Container Setup:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  comfyui:
    image: comfyui:latest
    runtime: nvidia
    environment:
      - CUDA_VISIBLE_DEVICES=0
    ports:
      - "127.0.0.1:8188:8188"
    volumes:
      - ./models:/app/models

  fastapi:
    image: fictures-ai:latest
    runtime: nvidia
    environment:
      - COMFYUI_URL=http://comfyui:8188
    ports:
      - "8000:8000"
    depends_on:
      - comfyui
```

## Future Enhancements

### Planned Features

1. **Text Generation Re-enablement**
   - Re-enable Qwen3-14B-AWQ when GPU resources allow
   - Unified API for text + image generation
   - Story writing assistance

2. **Authentication & Authorization**
   - API key-based authentication
   - User quotas and rate limiting
   - Usage tracking per user

3. **Advanced Image Features**
   - Multiple aspect ratios (16:9, 4:3, 1:1)
   - Batch generation (multiple images per request)
   - Img2img (image variation from reference)
   - Inpainting (edit parts of an image)

4. **Model Management**
   - Dynamic LoRA loading (v1.0 8-step, v2.0 4-step)
   - Model version selection via API
   - A/B testing different models

5. **Caching & Optimization**
   - Cache common prompts
   - Pre-warm models at startup
   - Request batching for efficiency

6. **Queue Management**
   - Job queue for high-load scenarios
   - Priority queuing (premium users)
   - Webhook callbacks for async generation

7. **Content Safety**
   - NSFW detection
   - Prompt filtering
   - Watermarking

### Performance Optimizations

1. **Model Optimizations**
   - Explore INT8 quantization (vs FP8)
   - Test 2-step LoRA (when available)
   - TensorRT optimization

2. **Infrastructure**
   - Multi-GPU support (horizontal scaling)
   - Load balancing across GPUs
   - Auto-scaling based on load

3. **Caching**
   - Redis for response caching
   - CDN for generated images
   - Prompt embedding cache

---

**Last Updated:** 2025-11-07
**Version:** 2.0 (Qwen-Image-Lightning v2.0 FP8 + ComfyUI)
**Author:** Fictures AI Team
