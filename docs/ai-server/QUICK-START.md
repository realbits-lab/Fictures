# AI Server Quick Start Guide

Get the Fictures AI Server running in 10 minutes!

## Prerequisites

- Python 3.10+ installed
- NVIDIA GPU with 8+ GB VRAM (recommended)
- 20 GB free disk space
- CUDA 11.8+ installed

## Step 1: Install Dependencies (3 minutes)

```bash
# Navigate to AI server directory
cd apps/ai-server

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/macOS
# OR
venv\Scripts\activate  # Windows

# Install PyTorch with CUDA support
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Install remaining dependencies
pip install -r requirements.txt
```

## Step 2: Configure Environment (1 minute)

```bash
# Copy example environment file
cp .env.example .env

# Edit .env (optional - defaults work fine)
# Use your favorite editor: nano, vim, code, etc.
nano .env
```

**Minimal .env configuration:**
```bash
API_HOST=0.0.0.0
API_PORT=8000
TEXT_MODEL_NAME=google/gemma-2b-it
IMAGE_MODEL_NAME=stabilityai/stable-diffusion-xl-base-1.0
CUDA_VISIBLE_DEVICES=0
LOG_LEVEL=INFO
```

## Step 3: Authenticate Hugging Face (2 minutes)

```bash
# Install Hugging Face CLI
pip install huggingface_hub

# Login (you'll need an account at huggingface.co)
huggingface-cli login

# Accept model licenses:
# 1. Visit: https://huggingface.co/google/gemma-2b-it
# 2. Click "Agree and access repository"
# 3. Visit: https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0
# 4. Click "Agree and access repository"
```

## Step 4: Start Server (30 seconds)

```bash
# Start the server
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# You should see:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Started server process
# INFO:     Waiting for application startup.
# INFO:     Application startup complete.
```

## Step 5: Test API (2 minutes)

### Open API Documentation

Visit http://localhost:8000/docs in your browser

### Test Text Generation

**Using cURL:**
```bash
curl -X POST "http://localhost:8000/api/v1/text/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a haiku about coding",
    "max_tokens": 50,
    "temperature": 0.7
  }'
```

**Using Python:**
```python
import httpx
import asyncio

async def test():
    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            "http://localhost:8000/api/v1/text/generate",
            json={
                "prompt": "Write a haiku about coding",
                "max_tokens": 50,
                "temperature": 0.7,
            },
        )
        print(response.json()["text"])

asyncio.run(test())
```

### Test Image Generation

**Using cURL:**
```bash
curl -X POST "http://localhost:8000/api/v1/images/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "width": 512,
    "height": 512,
    "num_inference_steps": 20
  }' > response.json

# Extract and save image
python -c "import json, base64; data = json.load(open('response.json')); img = data['image_url'].split(',')[1]; open('output.png', 'wb').write(base64.b64decode(img))"
```

## Step 6: Run Tests (5 minutes)

```bash
# Test text generation API
python tests/test_text_generation.py

# Test image generation API
python tests/test_image_generation.py

# Generated images will be saved to tests/test_output/
```

## What Happens on First Request?

**Text Generation (first time):**
1. Model downloads from Hugging Face (~5 GB)
2. Model loads into GPU memory (~10-15 seconds)
3. First inference runs (~2-3 seconds)
4. Subsequent requests are fast (20-50 tokens/sec)

**Image Generation (first time):**
1. Model downloads from Hugging Face (~7 GB)
2. Model loads into GPU memory (~15-20 seconds)
3. First inference runs (~3-5 seconds)
4. Subsequent requests are fast (2-4 seconds per image)

## Common Issues & Solutions

### Issue: CUDA not available

```
CUDA available: False
```

**Solution:**
```bash
# Install PyTorch with CUDA support
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Verify CUDA
python -c "import torch; print(torch.cuda.is_available())"
```

### Issue: Out of memory

```
CUDA out of memory
```

**Solution:** Edit `.env`
```bash
TEXT_GPU_MEMORY_UTILIZATION=0.4
IMAGE_GPU_MEMORY_UTILIZATION=0.7
DIFFUSERS_ENABLE_CPU_OFFLOAD=true
```

### Issue: Model access denied

```
401 Unauthorized
```

**Solution:**
1. Login: `huggingface-cli login`
2. Accept licenses on Hugging Face website
3. Restart server

### Issue: Port already in use

```
ERROR: Address already in use
```

**Solution:**
```bash
# Use different port
export API_PORT=8001
python -m uvicorn src.main:app --reload --port 8001
```

## Next Steps

### 📚 Read Documentation
- [Setup Guide](./setup.md) - Detailed installation guide
- [API Reference](./api-reference.md) - Complete API documentation
- [Architecture](./architecture.md) - System architecture
- [Performance](./performance.md) - Optimization tips

### 🧪 Explore Examples
- Text streaming with SSE
- Different image sizes and styles
- Advanced generation parameters
- Reproducible results with seeds

### 🚀 Integrate with Next.js
```typescript
// Example: Call AI server from Next.js API route
export async function POST(req: Request) {
  const { prompt } = await req.json();

  const response = await fetch('http://localhost:8000/api/v1/text/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  const result = await response.json();
  return Response.json(result);
}
```

## System Status Checklist

✅ Python 3.10+ installed
✅ CUDA available
✅ Virtual environment activated
✅ Dependencies installed
✅ Hugging Face authenticated
✅ .env configured
✅ Server running
✅ API responding
✅ Models loaded
✅ Tests passing

## Performance Expectations

### Text Generation (Gemma 2B on RTX 3090)
- Cold start: 10-15 seconds
- Inference: 20-50 tokens/sec
- Memory: 4-6 GB GPU RAM

### Image Generation (SDXL on RTX 3090)
- Cold start: 15-20 seconds
- 512×512 @ 20 steps: 1-2 seconds
- 1024×1024 @ 30 steps: 3-6 seconds
- Memory: 8-10 GB GPU RAM

## Getting Help

- **Documentation**: `docs/ai-server/`
- **Tests**: `apps/ai-server/tests/`
- **Issues**: https://github.com/realbits-lab/Fictures/issues
- **API Docs**: http://localhost:8000/docs

---

**🎉 You're all set!** Start building with the AI Server API.
