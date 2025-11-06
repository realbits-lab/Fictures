# Python Version Guide for AI Server

Guide for using specific Python versions with the Fictures AI Server.

## Recommended: Python 3.12

Python 3.12 is **recommended** for the AI Server due to:
- ✅ Latest performance improvements
- ✅ Better async/await performance
- ✅ Improved error messages
- ✅ Full compatibility with all dependencies
- ✅ Long-term support

## Supported Python Versions

- **Python 3.12** ✅ Recommended
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

# Install Python 3.12
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

# Install Python 3.12
pyenv install 3.12.9

# Set global default
pyenv global 3.12.9

# Or set for AI server directory only
cd apps/ai-server
pyenv local 3.12.9

# Verify
python --version  # Should show Python 3.12.9
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

# Set Python 3.12 for this directory
pyenv local 3.12.9

# Create virtual environment with pyenv
pyenv virtualenv 3.12.9 fictures-ai-server

# Activate
pyenv activate fictures-ai-server

# Or set local to auto-activate
pyenv local fictures-ai-server

# Verify
python --version  # Should show Python 3.12.9
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
# Expected: Python 3.12.x

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

# Install PyTorch with CUDA 11.8
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Install remaining dependencies
pip install -r requirements.txt

# Verify installations
python -c "import torch; print(f'PyTorch: {torch.__version__}')"
python -c "import vllm; print(f'vLLM: {vllm.__version__}')"
python -c "import diffusers; print(f'Diffusers: {diffusers.__version__}')"
```

## Compatibility Check

All major dependencies support Python 3.12:

| Package | Python 3.12 Support |
|---------|---------------------|
| FastAPI | ✅ Yes |
| Uvicorn | ✅ Yes |
| Pydantic | ✅ Yes (2.0+) |
| PyTorch | ✅ Yes (2.1+) |
| vLLM | ✅ Yes (0.6.0+) |
| Diffusers | ✅ Yes |
| Transformers | ✅ Yes |
| CUDA | ✅ Yes (via PyTorch) |

## Performance Benefits of Python 3.12

Python 3.12 offers several performance improvements:

1. **Faster asyncio** - Up to 20% faster async/await
2. **Better error messages** - Improved debugging
3. **Faster startup** - 10-20% faster module loading
4. **Memory optimizations** - Lower memory usage
5. **Better type hints** - Enhanced type checking

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

# Install and use Python 3.12
pyenv install 3.12.7
pyenv local 3.12.7
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

# 7. Install PyTorch
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# 8. Install dependencies
pip install -r requirements.txt

# 9. Verify CUDA
python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"

# 10. Configure environment
cp .env.example .env

# 11. Authenticate Hugging Face
pip install huggingface_hub
hf auth login

# 12. Start server
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# 13. Test (in another terminal)
cd apps/ai-server
source venv/bin/activate
python tests/test_text_generation.py
```

## Best Practices

1. **Use Python 3.12** for new installations
2. **Use pyenv** for managing multiple Python versions
3. **Always use virtual environments** - Never install packages globally
4. **Verify Python version** after activating venv
5. **Keep pip updated** - `pip install --upgrade pip`
6. **Document Python version** in your project

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
```

## Next Steps

After setting up Python 3.12:
1. Follow the [Quick Start Guide](../../docs/ai-server/quick-start.md)
2. Read the [Setup Guide](../../docs/ai-server/setup.md)
3. Check the [API Reference](../../docs/ai-server/api-reference.md)

---

**Recommended:** Use Python 3.12 with pyenv for the best development experience!
