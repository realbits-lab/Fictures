# Fictures AI Server

Local AI model serving for text and image generation using FastAPI.

## Setup

### 1. Create Python Virtual Environment

```bash
cd apps/ai-server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
# Install production dependencies
pnpm install  # This runs: pip install -r requirements.txt

# Or install directly with pip
pip install -r requirements.txt

# For development with linting/testing tools
pip install -r requirements-dev.txt
```

## Development

### Run Development Server

From the monorepo root:
```bash
# Run AI server only
pnpm dev:ai

# Run both web and AI server
pnpm dev
```

Or directly:
```bash
cd apps/ai-server
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Text Generation

**POST** `/api/v1/text/generate`

```json
{
  "prompt": "Write a story about a magical forest",
  "max_tokens": 1024,
  "temperature": 0.8,
  "top_p": 0.9
}
```

**GET** `/api/v1/text/models` - List available text models

### Image Generation

**POST** `/api/v1/images/generate`

```json
{
  "prompt": "A serene forest at twilight, cinematic",
  "negative_prompt": "blurry, low quality",
  "width": 1344,
  "height": 768,
  "num_inference_steps": 30,
  "guidance_scale": 7.5
}
```

**GET** `/api/v1/images/models` - List available image models

## Adding Local Models

### Text Generation Models

1. Download model weights (e.g., from Hugging Face)
2. Place in `apps/ai-server/models/text/`
3. Implement model loading in `src/services/text_service.py`
4. Update model list in `src/routes/text_generation.py`

### Image Generation Models

1. Download model weights (e.g., Stable Diffusion XL, FLUX)
2. Place in `apps/ai-server/models/images/`
3. Implement model loading in `src/services/image_service.py`
4. Update model list in `src/routes/image_generation.py`

## Type Safety with Next.js

After starting the AI server, generate TypeScript client:

```bash
# From monorepo root
cd packages/api-client
pnpm generate
```

This creates type-safe TypeScript client from the FastAPI OpenAPI schema.

## Project Structure

```
apps/ai-server/
├── src/
│   ├── main.py              # FastAPI application
│   ├── routes/              # API route handlers
│   │   ├── text_generation.py
│   │   └── image_generation.py
│   ├── schemas/             # Pydantic models
│   │   ├── text.py
│   │   └── image.py
│   ├── services/            # Business logic
│   └── models/              # Model loading utilities
├── requirements.txt         # Production dependencies
├── requirements-dev.txt     # Development dependencies
└── README.md
```

## Environment Variables

Create `.env` file in `apps/ai-server/`:

```bash
# Model paths
TEXT_MODEL_PATH=models/text/llama-3.2-3b
IMAGE_MODEL_PATH=models/images/stable-diffusion-xl

# Performance settings
CUDA_VISIBLE_DEVICES=0  # GPU device ID
MODEL_CACHE_DIR=~/.cache/huggingface

# API settings
API_PORT=8000
API_HOST=0.0.0.0
```

## Development Tools

```bash
# Format code
pnpm format

# Lint code
pnpm lint

# Type checking
pnpm type-check

# Generate TypeScript client
pnpm generate:client
```

## Performance Tips

1. **GPU Acceleration**: Ensure PyTorch is installed with CUDA support
2. **Model Caching**: Keep frequently used models in memory
3. **Batch Processing**: Process multiple requests together when possible
4. **Quantization**: Use quantized models (4-bit, 8-bit) for faster inference
