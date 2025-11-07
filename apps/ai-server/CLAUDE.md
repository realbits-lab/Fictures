# CLAUDE.md - AI Server

This file provides guidance to Claude Code when working with the Python AI server.

## Application Information

- **Workspace**: apps/ai-server/
- **Framework**: FastAPI with Python 3.12.7
- **Purpose**: AI text and image generation services
- **Port**: 8000

## Python Environment Setup

### Version & Package Manager
- **Python Version**: 3.12.7 (via pyenv)
- **Virtual Environment**: `venv/` directory
- **Package Manager**: pip (within venv)
- **Dependencies**: See `requirements.txt` and `requirements-dev.txt`

### Environment Activation
```bash
# Always activate venv before any Python operations
source venv/bin/activate

# Verify Python version
python --version  # Should show 3.12.7
```

## Core Dependencies

### AI/ML Frameworks
- **torch**: 2.8.0 (exact version required by vLLM)
- **vllm**: 0.11.0 (LLM serving framework)
- **transformers**: 4.57.1 (Hugging Face transformers)
- **diffusers**: 0.35.2 (Image generation models)
- **accelerate**: 1.11.0 (PyTorch acceleration library)

### API Server
- **fastapi**: 0.121.0 (Web framework)
- **uvicorn**: 0.38.0 (ASGI server)
- **pydantic**: 2.12.4 (Data validation)

### Data Processing
- **numpy**: 2.2.6 (latest 2.2.x, required by numba <2.3 constraint)
- **pillow**: 12.0.0 (Image processing)

### Development Tools
- **black**: 25.9.0 (Code formatting)
- **ruff**: 0.14.3 (Linting)
- **mypy**: 1.18.2 (Type checking)
- **pytest**: 8.4.2 (Testing framework)
- **pytest-asyncio**: 1.2.0 (Async testing)
- **pytest-cov**: 7.0.0 (Coverage reporting)

## Version Constraints

**IMPORTANT Compatibility Notes:**
1. **torch**: Must be 2.8.0 (exact version required by vllm 0.11.0)
2. **numpy**: Must be <2.3 (numba 0.61.2 constraint) but >=2.0 (vllm supports numpy 2.x)
3. **vllm**: 0.11.0 supports numpy 2.x but requires torch==2.8.0

## Hugging Face Authentication

**Required for model downloads:**

1. **Create Account**: https://huggingface.co/join
2. **Get Token**: https://huggingface.co/settings/tokens
3. **Login**:
   ```bash
   source venv/bin/activate
   huggingface-cli login
   # Paste your token when prompted
   ```

**Current Models (require HF auth):**
- **Text Generation**: `Qwen/Qwen3-14B-AWQ` (14B params, 4-bit AWQ quantization, ~7-10GB VRAM, optimized for RTX 4090)
  - 32K native context length (extendable to 131K with YaRN)
  - Advanced reasoning with thinking mode
  - Excellent for story writing and creative tasks
- **Image Generation**: `stabilityai/stable-diffusion-xl-base-1.0`

## API Authentication

**IMPORTANT**: All API endpoints require authentication via API key. Authentication is always enabled and cannot be disabled.

### Authentication Method

The AI server validates API keys against the web application's PostgreSQL database. API keys are stored securely using bcrypt hashing.

**Required Header Formats:**
```bash
# Option 1: Authorization header (recommended)
Authorization: Bearer YOUR_API_KEY

# Option 2: x-api-key header
x-api-key: YOUR_API_KEY
```

### Getting API Keys for Testing

**For development and testing**, API keys are stored in `.auth/user.json`:

```bash
# View your API key from user.json
cat .auth/user.json | jq -r '.apiKey'
```

**Example API Request:**
```bash
# Using Authorization header
curl -X POST "http://localhost:8000/api/v1/images/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(cat .auth/user.json | jq -r '.apiKey')" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "width": 1024,
    "height": 1024,
    "num_inference_steps": 4,
    "guidance_scale": 1.0
  }'

# Using x-api-key header
curl -X POST "http://localhost:8000/api/v1/images/generate" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $(cat .auth/user.json | jq -r '.apiKey')" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "width": 1024,
    "height": 1024,
    "num_inference_steps": 4,
    "guidance_scale": 1.0
  }'
```

### Database Configuration

The AI server requires a PostgreSQL database connection for API key validation:

```bash
# Set in .env file
DATABASE_URL=postgresql://user:password@host-pooler.region.aws.neon.tech:5432/database
```

**Note**: Use the same DATABASE_URL from the web application (pooled connection URL).

### Authentication Scopes

API keys can have different scopes for fine-grained access control:
- `images:read` - View image generation information
- `images:write` - Generate images
- `stories:read` - Read story data
- `stories:write` - Create/update stories
- `admin:all` - Full administrative access

## Development Commands

```bash
# Install dependencies
pnpm install          # Install dev dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Start development server (with auto-reload)
pnpm dev
# Or directly:
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Start production server
pnpm start
# Or directly:
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000

# Code quality
pnpm format           # Format with black
pnpm lint             # Lint with ruff
pnpm type-check       # Type check with mypy

# Generate API client
pnpm generate:client  # Generates TypeScript client from OpenAPI spec
```

## Running the Server

### Development Mode (with auto-reload)
```bash
source venv/bin/activate
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

### Production Mode
```bash
source venv/bin/activate
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
```

### Background Process (Development)
```bash
source venv/bin/activate
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload > logs/ai-server.log 2>&1 &
```

## Project Structure

```
apps/ai-server/
├── src/
│   ├── main.py                  # FastAPI application entry point
│   ├── config.py                # Configuration management
│   ├── routes/                  # API route handlers
│   │   ├── text_generation.py  # Text generation endpoints
│   │   └── image_generation.py # Image generation endpoints
│   ├── services/                # Business logic
│   │   ├── text_service.py     # Text generation service (vLLM)
│   │   └── image_service.py    # Image generation service (Diffusers)
│   └── schemas/                 # Pydantic models
│       ├── text.py              # Text generation request/response models
│       └── image.py             # Image generation request/response models
├── tests/                       # Permanent test files (pytest)
│   ├── test_text_generation.py
│   └── test_image_generation.py
├── test-scripts/                # Temporary test scripts (ad-hoc testing)
│   └── test_qwen3.py            # Example: Quick model test
├── test-output/                 # Generated image files (gitignored)
│   └── *.png                    # Test-generated images
├── venv/                        # Python virtual environment
├── requirements.txt             # Production dependencies
├── requirements-dev.txt         # Development dependencies
└── PYTHON-VERSION-GUIDE.md     # Detailed Python setup guide
```

## File Organization Guidelines

### Test Files and Scripts

**IMPORTANT**: Distinguish between permanent tests and temporary test scripts:

**Permanent Tests (`tests/` directory):**
- Unit tests with pytest
- Integration tests
- Part of CI/CD pipeline
- Well-documented and maintained
- Example: `tests/test_text_generation.py`

**Temporary Test Scripts (`test-scripts/` directory):**
- **Always write temporary test scripts to `test-scripts/` directory**
- Ad-hoc testing and debugging
- Quick model validation
- Exploratory testing
- One-time experiments
- NOT part of automated testing
- Can be deleted after use
- Example: `test-scripts/test_qwen3.py`

**Rule**: If you're writing a temporary Python script for testing, debugging, or exploration, place it in `test-scripts/`. This keeps the project organized and makes it clear which tests are permanent vs temporary.

### Generated Image Files

**IMPORTANT**: All generated image files must be stored in the `test-output/` directory:

**Image Output (`test-output/` directory):**
- **Always save generated images to `test-output/` directory**
- All test-generated images, including API test outputs
- Image generation validation outputs
- Development and debugging image outputs
- Keeps generated files organized and separate from source code
- Already included in `.gitignore` to avoid committing large binary files
- Example: `test-output/webtoon_fight.png`, `test-output/comfyui_api_fp8_v2_test.png`

**Rule**: Whenever you generate any image files during testing, development, or API validation, always save them to `test-output/`. This ensures consistency, keeps the project organized, and prevents generated files from cluttering other directories.

## API Endpoints

### Text Generation
- **POST** `/api/text/generate` - Generate text using vLLM
- **GET** `/api/text/models` - List available text models

### Image Generation
- **POST** `/api/image/generate` - Generate images using Stable Diffusion
- **GET** `/api/image/models` - List available image models

### Documentation
- **GET** `/docs` - Interactive API documentation (Swagger UI)
- **GET** `/redoc` - Alternative API documentation (ReDoc)
- **GET** `/openapi.json` - OpenAPI schema

## Testing

### Unit Tests
```bash
source venv/bin/activate
pytest tests/
```

### Test with Coverage
```bash
source venv/bin/activate
pytest --cov=src tests/
```

### Integration Tests (requires server running)
```bash
# Terminal 1: Start server
source venv/bin/activate
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000

# Terminal 2: Run tests
source venv/bin/activate
python tests/test_text_generation.py
python tests/test_image_generation.py
```

## Code Style & Quality

### Formatting with Black
```bash
source venv/bin/activate
black src/
```

### Linting with Ruff
```bash
source venv/bin/activate
ruff check src/
```

### Type Checking with MyPy
```bash
source venv/bin/activate
mypy src/
```

## Common Issues & Solutions

### Issue: vLLM AsyncEngineArgs error
**Error**: `AsyncEngineArgs.__init__() got an unexpected keyword argument 'disable_log_requests'`
**Solution**: The `disable_log_requests` parameter was removed in vllm 0.11.0. Do not use this parameter.

### Issue: NumPy version conflict
**Error**: `numba 0.61.2 depends on numpy<2.3`
**Solution**: Use `numpy==2.2.6` (latest 2.2.x series that satisfies both vllm and numba constraints)

### Issue: Torch version conflict
**Error**: `vllm 0.11.0 depends on torch==2.8.0`
**Solution**: Use `torch==2.8.0` (exact version required)

### Issue: Model authentication required
**Error**: `401 Client Error: Unauthorized`
**Solution**: Run `huggingface-cli login` and provide your Hugging Face token

### Issue: CUDA out of memory
**Error**: `RuntimeError: CUDA out of memory`
**Solution**:
- Use smaller models
- Reduce batch size
- Adjust `gpu_memory_utilization` parameter in vLLM config
- Monitor GPU usage with `nvidia-smi`

## ComfyUI Setup (for Advanced Image Generation)

**ComfyUI** is used for advanced image generation workflows with Qwen-Image models.
It runs as a **standalone HTTP server** (not a submodule).

### Installation

Install ComfyUI in your user home directory:

```bash
# Create installation directory
mkdir -p ~/.local/comfyui

# Clone ComfyUI
cd ~/.local/comfyui
git clone https://github.com/comfyanonymous/ComfyUI.git .

# Install dependencies (requires Python 3.12.7)
pip install -r requirements.txt
```

### Running ComfyUI Server

**Start ComfyUI server** before using image generation:

```bash
# Development mode (manual start)
cd ~/.local/comfyui
python main.py --listen 127.0.0.1 --port 8188

# Production mode (background process)
cd ~/.local/comfyui
nohup python main.py --listen 127.0.0.1 --port 8188 > comfyui.log 2>&1 &
```

**Default URL**: http://127.0.0.1:8188

### Configuration

The AI server connects to ComfyUI via HTTP API. Configure the URL in your `.env` file:

```bash
COMFYUI_URL=http://127.0.0.1:8188
```

### Model Files

Place Qwen-Image model files in ComfyUI directories:
- **UNET models**: `~/.local/comfyui/models/unet/`
- **CLIP models**: `~/.local/comfyui/models/clip/`
- **VAE models**: `~/.local/comfyui/models/vae/`
- **LoRA models**: `~/.local/comfyui/models/loras/`

Required files for Qwen-Image-Lightning:
- `qwen_image_fp8_e4m3fn_scaled.safetensors` (UNET)
- `qwen_2.5_vl_7b_fp8_scaled.safetensors` (CLIP)
- `qwen_image_vae.safetensors` (VAE)
- `qwen-image-lightning-v2.0-4step-fp8.safetensors` (LoRA)

## Environment Variables

**Minimal Configuration**: The AI server has been streamlined to require only 2 environment variables.

Create a `.env` file in `apps/ai-server/`:

```bash
# =============================================================================
# ComfyUI Configuration (External Image Generation Server)
# =============================================================================
# ComfyUI runs as a separate HTTP server and manages its own models
# Install ComfyUI at: ~/.local/comfyui (see above for installation instructions)
COMFYUI_URL=http://127.0.0.1:8188

# =============================================================================
# Authentication & Database
# =============================================================================
# Database Configuration (for API key authentication)
# Use the same DATABASE_URL from the web application (pooled connection)
# Example: postgresql://user:password@host-pooler.region.aws.neon.tech:5432/database
DATABASE_URL=postgresql://user:password@host:5432/database
```

**Constants (hardcoded in `config.py`):**
- `API_HOST` - Server host (0.0.0.0)
- `API_PORT` - Server port (8000)
- `CORS_ORIGINS` - Allowed CORS origins (localhost:3000, 127.0.0.1:3000)
- `LOG_LEVEL` - Logging level (INFO)

**Notes:**
- Text generation is **disabled** (full GPU allocated to image generation via ComfyUI)
- ComfyUI manages its own models and runs externally
- API key authentication is **always enabled** (cannot be disabled)
- No model configuration needed - ComfyUI handles all image generation

## Code Guidelines

**Python-Specific Best Practices:**
- **Type Hints**: Always use type hints for function parameters and return types
- **Async/Await**: Use async endpoints for I/O-bound operations
- **Pydantic Models**: Define request/response schemas using Pydantic
- **Error Handling**: Use FastAPI HTTPException for API errors
- **Logging**: Use Python's logging module, configured in `config.py`
- **Documentation**: Add docstrings to all functions and classes

**Code Quality Standards:**
- Format code with `black` before committing
- Run `ruff check` to ensure no linting errors
- Run `mypy` to verify type hints
- Write tests for all new endpoints
- NEVER use ellipsis ("...") as placeholders in production code
- Every function should have complete implementation

**File Naming Conventions:**
- **Documentation files in `docs/`**: Use lowercase file names with hyphens (kebab-case)
  - ✅ Good: `api-reference.md`, `quick-start.md`, `python-version-guide.md`
  - ❌ Bad: `API-Reference.md`, `QuickStart.md`, `PYTHON-VERSION-GUIDE.md`
- This ensures consistency and avoids issues with case-sensitive file systems

**Example FastAPI Endpoint:**
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class TextRequest(BaseModel):
    prompt: str
    max_tokens: int = 100
    temperature: float = 0.7

class TextResponse(BaseModel):
    generated_text: str
    model: str

@router.post("/generate", response_model=TextResponse)
async def generate_text(request: TextRequest) -> TextResponse:
    """
    Generate text using the configured LLM model.

    Args:
        request: Text generation request parameters

    Returns:
        Generated text response

    Raises:
        HTTPException: If generation fails
    """
    try:
        # Implementation here
        result = await text_service.generate(
            prompt=request.prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        return TextResponse(
            generated_text=result.text,
            model=result.model_name
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Integration with Web Application

The AI server provides services to the Next.js web application:
- **Text Generation**: Used for story content, character dialogues, scene descriptions
- **Image Generation**: Used for story covers, character portraits, scene illustrations

**API Client Generation:**
```bash
# Generate TypeScript client from OpenAPI schema
pnpm generate:client
# Output: ../api-client/src/
```

## Performance Optimization

### vLLM Optimization
- Adjust `gpu_memory_utilization` (default 0.9)
- Use quantization for smaller memory footprint
- Enable tensor parallelism for multi-GPU setups

### Image Generation Optimization
- Use `torch.compile()` for faster inference
- Adjust inference steps (lower = faster, lower quality)
- Cache models in memory for repeated generations

### API Performance
- Use async endpoints for concurrent requests
- Implement request batching for high throughput
- Add caching for repeated prompts
- Monitor with FastAPI middleware

## Monitoring & Debugging

### Check Server Health
```bash
curl http://localhost:8000/health
```

### Monitor GPU Usage
```bash
nvidia-smi -l 1  # Update every 1 second
```

### View Logs
```bash
tail -f logs/ai-server.log
```

### Interactive API Testing
Open browser to: http://localhost:8000/docs

## Git and Repository Management

- **Working Directory**: Always work from `apps/ai-server/`
- **Commit Messages**: Follow conventional commits format
- **Branch Strategy**: Use feature branches for new features
- **Code Review**: Ensure all tests pass before PR

## Additional Resources

- **Python Setup Guide**: See `docs/python-version-guide.md`
- **Quick Start Guide**: See `docs/quick-start.md`
- **Setup Guide**: See `docs/setup.md`
- **API Reference**: See `docs/api-reference.md`
- **Architecture**: See `docs/architecture.md`
- **Main Repository Guide**: See `../../CLAUDE.md`
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **vLLM Docs**: https://docs.vllm.ai/
- **Diffusers Docs**: https://huggingface.co/docs/diffusers/
