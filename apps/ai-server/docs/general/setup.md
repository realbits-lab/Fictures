# AI Server Setup Guide

Complete guide for setting up the Fictures AI Server on your local machine.

## Prerequisites

### System Requirements

**Minimum:**
- Python 3.10 or higher
- 16 GB RAM
- 20 GB free disk space
- NVIDIA GPU with 8 GB VRAM (for GPU acceleration)
- CUDA 11.8 or higher (for GPU support)

**Recommended:**
- Python 3.11
- 32 GB RAM
- 50 GB free disk space
- NVIDIA GPU with 16 GB+ VRAM (RTX 3090, 4090, or A100)
- CUDA 12.1 or higher

### Software Requirements

- Python 3.10+ with pip
- Git
- CUDA Toolkit (for GPU acceleration)
- cuDNN (for GPU acceleration)

## Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/realbits-lab/Fictures.git
cd Fictures/apps/ai-server
```

### 2. Install Python with pyenv (Recommended)

**Install pyenv:**
```bash
# Install pyenv
curl https://pyenv.run | bash

# Add to ~/.bashrc or ~/.zshrc
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"

# Restart shell
source ~/.bashrc  # or source ~/.zshrc

# Install Python 3.12
pyenv install 3.12.9
pyenv global 3.12.9

# Verify
python --version  # Should show Python 3.12.9
```

### 3. Create Virtual Environment

**Using pyenv-virtualenv (Recommended):**
```bash
cd apps/ai-server

# Create virtual environment with pyenv
pyenv virtualenv 3.12.9 fictures-ai-server

# Activate virtual environment
pyenv activate fictures-ai-server

# Or set local Python version for this directory
pyenv local fictures-ai-server  # Auto-activates when you cd into this directory
```

**Alternative: Using venv:**
```bash
cd apps/ai-server

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Verify Python version
python --version
# Expected: Python 3.12.x
```

### 4. Install Dependencies

```bash
# Install PyTorch with CUDA support first
# For CUDA 11.8:
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# For CUDA 12.1:
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# For CPU only (not recommended):
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies
pip install -r requirements.txt

# For development (optional)
pip install -r requirements-dev.txt
```

### 5. Verify Installation

```bash
# Check PyTorch CUDA availability
python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}'); print(f'CUDA version: {torch.version.cuda}')"

# Check vLLM installation
python -c "import vllm; print(f'vLLM version: {vllm.__version__}')"

# Check diffusers installation
python -c "import diffusers; print(f'Diffusers version: {diffusers.__version__}')"
```

Expected output:
```
CUDA available: True
CUDA version: 11.8
vLLM version: 0.6.6
Diffusers version: 0.32.1
```

## Configuration

### 6. Environment Variables

Create `.env` file from example:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Server Configuration
API_HOST=0.0.0.0
API_PORT=8000
WORKERS=1

# Text Generation Model
TEXT_MODEL_NAME=google/gemma-2b-it
TEXT_MODEL_PATH=./models/text/gemma-2b-it
TEXT_MAX_MODEL_LEN=4096
TEXT_GPU_MEMORY_UTILIZATION=0.5

# Image Generation Model
IMAGE_MODEL_NAME=stabilityai/stable-diffusion-xl-base-1.0
IMAGE_MODEL_PATH=./models/images/stable-diffusion-xl-base-1.0
IMAGE_GPU_MEMORY_UTILIZATION=0.9

# GPU Configuration
CUDA_VISIBLE_DEVICES=0
MODEL_CACHE_DIR=~/.cache/huggingface

# Performance Settings
VLLM_TENSOR_PARALLEL_SIZE=1
VLLM_MAX_NUM_SEQS=256
DIFFUSERS_ENABLE_CPU_OFFLOAD=false

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
```

### 7. Download Models

Models will be automatically downloaded on first use from Hugging Face.

**Text Model (Gemma 2B - Recommended for testing):**
```bash
# Model will auto-download from: google/gemma-2b-it
# Size: ~5 GB
# Location: ~/.cache/huggingface/hub/
```

**Image Model (Stable Diffusion XL):**
```bash
# Model will auto-download from: stabilityai/stable-diffusion-xl-base-1.0
# Size: ~7 GB
# Location: ~/.cache/huggingface/hub/
```

**Alternative: Pre-download Models**

```bash
# Install huggingface_hub
pip install huggingface_hub

# Login to Hugging Face (opens browser for authentication)
hf auth login

# Download Gemma 2B
huggingface-cli download google/gemma-2b-it

# Download SDXL
huggingface-cli download stabilityai/stable-diffusion-xl-base-1.0
```

### 8. Hugging Face Authentication

Some models (like Gemma) require Hugging Face authentication:

1. Create account at https://huggingface.co/
2. Get access token from https://huggingface.co/settings/tokens
3. Login via CLI:
   ```bash
   # Install huggingface_hub if not already installed
   pip install huggingface_hub

   # Login (opens browser for authentication)
   hf auth login
   ```
4. Accept model license agreements:
   - Gemma: https://huggingface.co/google/gemma-2b-it
   - SDXL: https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0

## Starting the Server

### Development Mode

```bash
# Start with auto-reload
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
# Start with multiple workers
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Using Environment Variables

```bash
# Override settings via environment variables
export API_PORT=9000
export LOG_LEVEL=DEBUG
python -m uvicorn src.main:app --host 0.0.0.0 --port 9000
```

## Verification

### 1. Check Health Endpoint

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "models": {
    "text": {
      "name": "google/gemma-2b-it",
      "type": "text-generation",
      "framework": "vLLM",
      "max_tokens": 4096,
      "initialized": false
    },
    "image": {
      "name": "stabilityai/stable-diffusion-xl-base-1.0",
      "type": "image-generation",
      "framework": "diffusers",
      "device": "cuda",
      "initialized": false
    }
  }
}
```

### 2. Access API Documentation

Open in browser:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 3. Run Test Suite

```bash
# Test text generation
python tests/test_text_generation.py

# Test image generation
python tests/test_image_generation.py
```

## Model Selection

### Text Generation Models

**Gemma 2B (Recommended for development):**
- Model: `google/gemma-2b-it`
- Size: ~5 GB
- VRAM: 4-6 GB
- Speed: 30-50 tokens/sec

**Gemma 4B (Better quality):**
- Model: `google/gemma-4b-it`
- Size: ~9 GB
- VRAM: 8-10 GB
- Speed: 20-35 tokens/sec

**Gemma 7B (Production quality):**
- Model: `google/gemma-7b-it`
- Size: ~14 GB
- VRAM: 14-16 GB
- Speed: 15-25 tokens/sec

### Image Generation Models

**SDXL Base (Recommended):**
- Model: `stabilityai/stable-diffusion-xl-base-1.0`
- Size: ~7 GB
- VRAM: 8-10 GB
- Speed: 2-4 sec/image (20 steps)

**SDXL Turbo (Faster):**
- Model: `stabilityai/sdxl-turbo`
- Size: ~7 GB
- VRAM: 8-10 GB
- Speed: 1-2 sec/image (1-4 steps)

## GPU Memory Management

### Multiple GPU Setup

```bash
# Use specific GPU
export CUDA_VISIBLE_DEVICES=0

# Use multiple GPUs
export CUDA_VISIBLE_DEVICES=0,1

# Adjust tensor parallelism in .env
VLLM_TENSOR_PARALLEL_SIZE=2
```

### Memory Optimization

**For Low VRAM (8 GB):**
```bash
# In .env:
TEXT_MODEL_NAME=google/gemma-2b-it
TEXT_GPU_MEMORY_UTILIZATION=0.4
IMAGE_GPU_MEMORY_UTILIZATION=0.7
DIFFUSERS_ENABLE_CPU_OFFLOAD=true
```

**For High VRAM (16+ GB):**
```bash
# In .env:
TEXT_MODEL_NAME=google/gemma-7b-it
TEXT_GPU_MEMORY_UTILIZATION=0.6
IMAGE_GPU_MEMORY_UTILIZATION=0.9
DIFFUSERS_ENABLE_CPU_OFFLOAD=false
```

## Troubleshooting

See [Troubleshooting Guide](./troubleshooting.md) for common issues and solutions.

## Next Steps

- Read [API Reference](./api-reference.md) for endpoint documentation
- Read [Model Guide](./models.md) for model selection
- Read [Performance Optimization](./performance.md) for tuning tips
- Run [Testing Guide](./testing.md) for validation

---

**Ready to go?** Start the server and visit http://localhost:8000/docs!
