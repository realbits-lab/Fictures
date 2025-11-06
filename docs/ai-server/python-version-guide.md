# Python Version & Environment Setup Guide

Complete guide for Python version management and virtual environment setup for the Fictures AI Server.

## Current Project Configuration

- **Python Version**: 3.12.7 (via pyenv)
- **Virtual Environment**: `venv/` (activated with `source venv/bin/activate`)
- **Package Manager**: pip (within venv)
- **Location**: `apps/ai-server/`

## Dependencies Installed

### Core Frameworks
- torch==2.8.0 (vllm 0.11.0 requirement)
- vllm==0.11.0 (LLM serving)
- transformers==4.57.1
- diffusers==0.35.2
- accelerate==1.11.0

### API Server
- fastapi==0.121.0
- uvicorn==0.38.0
- pydantic==2.12.4

### Data Processing
- numpy==2.2.6 (numba 0.61.2 requires <2.3)
- pillow==12.0.0

### Development Tools
- black==25.9.0
- ruff==0.14.3
- mypy==1.18.2
- pytest==8.4.2
- pytest-asyncio==1.2.0
- pytest-cov==7.0.0

## Version Constraints

**CRITICAL Compatibility Notes:**
1. **torch**: Must be 2.8.0 (exact version required by vllm 0.11.0)
2. **numpy**: Must be <2.3 (numba 0.61.2 constraint) but >=2.0 (vllm 0.8.3+ supports numpy 2.x)
3. **vllm**: 0.11.0 supports numpy 2.x but requires torch==2.8.0

## Recommended: Python 3.12

Python 3.12 is **recommended** for the AI Server due to:
- ✅ Latest performance improvements (up to 20% faster async/await)
- ✅ Better async/await performance
- ✅ Improved error messages for debugging
- ✅ Full compatibility with all dependencies
- ✅ Long-term support (until 2028)
- ✅ Faster startup (10-20% faster module loading)
- ✅ Memory optimizations (lower memory usage)

## Supported Python Versions

- **Python 3.12** ✅ Recommended (current project version: 3.12.7)
- **Python 3.11** ✅ Fully supported
- **Python 3.10** ✅ Fully supported
- **Python 3.9** ⚠️ Works but not recommended
- **Python 3.8** ❌ Not supported (EOL)

## Installing Python 3.12

### Ubuntu/Debian

```bash
# Add deadsnakes PPA
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update

# Install Python 3.12
sudo apt install python3.12 python3.12-venv python3.12-dev

# Verify installation
python3.12 --version
```

### macOS (Homebrew)

```bash
# Install Python 3.12
brew install python@3.12

# Verify installation
python3.12 --version

# Optional: Set as default
brew link python@3.12
```

### macOS (pyenv - Recommended)

```bash
# Install pyenv if not already installed
brew install pyenv

# Install Python 3.12.7 (current project version)
pyenv install 3.12.7

# Set as global default
pyenv global 3.12.7

# Or set for specific directory
cd apps/ai-server
pyenv local 3.12.7

# Verify
python --version
```

### Windows

1. Download Python 3.12 from https://www.python.org/downloads/
2. Run installer
3. Check "Add Python to PATH"
4. Verify: `python --version`

### Using pyenv (Cross-platform - Recommended)

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

# Install Python 3.12.7 (current project version)
pyenv install 3.12.7

# Set global default
pyenv global 3.12.7

# Or set for AI server directory only
cd apps/ai-server
pyenv local 3.12.7

# Verify
python --version  # Should show Python 3.12.7
```

## Creating Virtual Environment with Python 3.12

### Method 1: Direct Python 3.12

```bash
cd apps/ai-server

# Create virtual environment with Python 3.12
python3.12 -m venv venv

# Activate
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Verify Python version inside venv
python --version
# Output: Python 3.12.x
```

### Method 2: Using pyenv-virtualenv (Recommended)

```bash
cd apps/ai-server

# Set Python 3.12.7 for this directory
pyenv local 3.12.7

# Create virtual environment with pyenv
pyenv virtualenv 3.12.7 fictures-ai-server

# Activate
pyenv activate fictures-ai-server

# Or set local to auto-activate
pyenv local fictures-ai-server

# Verify
python --version  # Should show Python 3.12.7
```

### Method 3: Specify Full Path

```bash
# Find Python 3.12 path
which python3.12
# Output: /usr/bin/python3.12 (or similar)

# Create venv with specific Python
/usr/bin/python3.12 -m venv venv

# Activate
source venv/bin/activate
```

## Verifying Installation

After creating and activating the virtual environment:

```bash
# Check Python version
python --version
# Expected: Python 3.12.7

# Check pip version
pip --version
# Expected: pip 24.x (python 3.12)

# Check installed location
which python
# Expected: /path/to/apps/ai-server/venv/bin/python
```

## Installing Dependencies with Python 3.12

```bash
# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Verify installations
python -c "import torch; print(f'PyTorch: {torch.__version__}')"
python -c "import vllm; print(f'vLLM: {vllm.__version__}')"
python -c "import diffusers; print(f'Diffusers: {diffusers.__version__}')"
```

## Hugging Face Authentication

To use models from Hugging Face (required for text and image generation):

1. **Create account**: https://huggingface.co/join
2. **Get token**: https://huggingface.co/settings/tokens
3. **Login**:
   ```bash
   source venv/bin/activate
   huggingface-cli login
   ```
   Paste your token when prompted.

## Model Configuration

Current models in `.env`:
- **Text Generation**: `Qwen/Qwen2.5-0.5B-Instruct` (requires HF auth)
- **Image Generation**: `stabilityai/stable-diffusion-xl-base-1.0` (requires HF auth)

Both require Hugging Face authentication to download.

## Running the AI Server

```bash
# Activate virtual environment
source venv/bin/activate

# Start server
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000

# Or with auto-reload for development
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

## Testing

```bash
# Run text generation tests (requires server running)
source venv/bin/activate
python tests/test_text_generation.py

# Run image generation tests
python tests/test_image_generation.py

# Run with pytest
pytest tests/
```

## Compatibility Check

All major dependencies support Python 3.12:

| Package | Python 3.12 Support | Current Version |
|---------|---------------------|-----------------|
| FastAPI | ✅ Yes | 0.121.0 |
| Uvicorn | ✅ Yes | 0.38.0 |
| Pydantic | ✅ Yes (2.0+) | 2.12.4 |
| PyTorch | ✅ Yes (2.1+) | 2.8.0 |
| vLLM | ✅ Yes (0.6.0+) | 0.11.0 |
| Diffusers | ✅ Yes | 0.35.2 |
| Transformers | ✅ Yes | 4.57.1 |
| NumPy | ✅ Yes (2.0+) | 2.2.6 |
| Pillow | ✅ Yes | 12.0.0 |
| CUDA | ✅ Yes (via PyTorch) | - |

## Performance Benefits of Python 3.12

Python 3.12 offers several performance improvements:

1. **Faster asyncio** - Up to 20% faster async/await (critical for FastAPI)
2. **Better error messages** - Improved debugging with clearer stack traces
3. **Faster startup** - 10-20% faster module loading
4. **Memory optimizations** - Lower memory usage for long-running processes
5. **Better type hints** - Enhanced type checking with mypy
6. **Improved f-strings** - Faster string formatting

## Troubleshooting

### Issue: `python3.12: command not found`

**Solution:** Python 3.12 not installed. Install using methods above.

### Issue: `venv module not found`

```bash
# Ubuntu/Debian
sudo apt install python3.12-venv

# Or use system package
python3.12 -m ensurepip
```

### Issue: Wrong Python version in venv

```bash
# Deactivate current venv
deactivate

# Remove old venv
rm -rf venv

# Create new venv with specific Python
python3.12 -m venv venv

# Activate and verify
source venv/bin/activate
python --version
```

### Issue: Multiple Python versions conflicting

**Solution:** Use pyenv to manage versions:

```bash
# Install pyenv
curl https://pyenv.run | bash

# Add to shell config (~/.bashrc or ~/.zshrc)
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

# Restart shell
exec "$SHELL"

# Install and use Python 3.12.7
pyenv install 3.12.7
pyenv local 3.12.7
```

### Issue: vLLM AsyncEngineArgs error

**Error**: `AsyncEngineArgs.__init__() got an unexpected keyword argument 'disable_log_requests'`

**Solution**: The `disable_log_requests` parameter was removed in vllm 0.11.0. Do not use this parameter in your code.

### Issue: NumPy version conflict

**Error**: `numba 0.61.2 depends on numpy<2.3`

**Solution**: Use numpy==2.2.6 (latest 2.2.x series that satisfies both vllm and numba constraints)

```bash
pip install numpy==2.2.6
```

### Issue: Torch version conflict

**Error**: `vllm 0.11.0 depends on torch==2.8.0`

**Solution**: Use torch==2.8.0 (exact version required)

```bash
pip install torch==2.8.0
```

### Issue: Model authentication required

**Error**: `401 Client Error: Unauthorized`

**Solution**: Login with `huggingface-cli login` and provide your Hugging Face token

```bash
source venv/bin/activate
huggingface-cli login
# Paste your token when prompted
```

### Issue: CUDA out of memory

**Error**: `RuntimeError: CUDA out of memory`

**Solution**:
- Use smaller models
- Reduce batch size in your code
- Adjust `gpu_memory_utilization` parameter in vLLM config (default 0.9)
- Monitor GPU usage with `nvidia-smi`

```bash
# Monitor GPU memory
nvidia-smi -l 1  # Update every 1 second
```

## Complete Setup Example (Python 3.12)

```bash
# 1. Install Python 3.12 (Ubuntu example)
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update
sudo apt install python3.12 python3.12-venv python3.12-dev

# 2. Navigate to project
cd apps/ai-server

# 3. Create virtual environment
python3.12 -m venv venv

# 4. Activate
source venv/bin/activate

# 5. Verify
python --version  # Should show Python 3.12.x

# 6. Upgrade pip
pip install --upgrade pip

# 7. Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# 8. Verify installations
python -c "import torch; print(f'PyTorch: {torch.__version__}')"
python -c "import vllm; print(f'vLLM: {vllm.__version__}')"

# 9. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 10. Authenticate Hugging Face
huggingface-cli login
# Paste your token

# 11. Start server
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# 12. Test (in another terminal)
cd apps/ai-server
source venv/bin/activate
python tests/test_text_generation.py
```

## Best Practices

1. **Use Python 3.12.7** - Current project version for consistency
2. **Use pyenv** for managing multiple Python versions
3. **Always use virtual environments** - Never install packages globally
4. **Verify Python version** after activating venv
5. **Keep pip updated** - `pip install --upgrade pip`
6. **Document Python version** in your project (this file!)
7. **Pin dependency versions** in requirements.txt
8. **Test after environment changes** - Run tests to verify compatibility

## Checking Current Python Version

```bash
# System Python
python3 --version
python3.12 --version

# Virtual environment Python (after activation)
python --version
which python

# All available Python versions
ls /usr/bin/python*  # Linux
ls /usr/local/bin/python*  # macOS

# Check Python in current environment
python -c "import sys; print(sys.version)"
python -c "import sys; print(sys.executable)"
```

## Environment Variables

Create a `.env` file in `apps/ai-server/`:

```bash
# Model Configuration
TEXT_MODEL_NAME=Qwen/Qwen2.5-0.5B-Instruct
IMAGE_MODEL_NAME=stabilityai/stable-diffusion-xl-base-1.0

# Server Configuration
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=info

# Hugging Face
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# GPU Configuration
CUDA_VISIBLE_DEVICES=0
GPU_MEMORY_UTILIZATION=0.9
```

## Next Steps

After setting up Python 3.12:
1. Follow the [Quick Start Guide](quick-start.md)
2. Read the [Setup Guide](setup.md)
3. Check the [API Reference](api-reference.md)
4. Review the [Architecture](architecture.md)

## Related Documentation

- **AI Server CLAUDE.md**: `apps/ai-server/CLAUDE.md` - Complete AI server development guide
- **Quick Start**: `docs/ai-server/quick-start.md` - Quick start guide
- **Setup Guide**: `docs/ai-server/setup.md` - Detailed setup instructions
- **API Reference**: `docs/ai-server/api-reference.md` - API documentation

---

**Recommended:** Use Python 3.12.7 with pyenv for the best development experience!
