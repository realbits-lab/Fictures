# AI Server Test Suite

Comprehensive test suite for the Fictures AI Server API endpoints.

## Overview

This directory contains integration tests for:
- **Text Generation API** - vLLM with Gemma models
- **Image Generation API** - Stable Diffusion XL

## Prerequisites

1. **AI Server Running**
   ```bash
   cd apps/ai-server
   python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Models Downloaded**
   - Gemma 2B model (auto-downloads on first use)
   - SDXL model (auto-downloads on first use)
   - Requires Hugging Face authentication for Gemma

3. **GPU Available**
   - NVIDIA GPU with CUDA support recommended
   - Tests will be slow on CPU

## Running Tests

### Text Generation Tests

```bash
# Run all text generation tests
python tests/test_text_generation.py
```

**Tests included:**
- Health check endpoint
- List available models
- Basic text generation
- Text generation with stop sequences
- Streaming text generation
- Error handling and validation

**Expected duration:** 2-5 minutes (depending on GPU)

### Image Generation Tests

```bash
# Run all image generation tests
python tests/test_image_generation.py
```

**Tests included:**
- Health check endpoint
- List available models
- Basic image generation
- Image generation with random seed
- Various image sizes (512×512, 1024×1024, 1344×768, 768×1344)
- Error handling and validation
- Reproducibility test (same seed)

**Expected duration:** 5-15 minutes (depending on GPU)

**Output:** Generated images are saved to `tests/test_output/`

## Test Output

### Text Generation Output

```
================================================================================
FICTURES AI SERVER - TEXT GENERATION API TESTS
================================================================================

Testing server at: http://localhost:8000

=== Testing Health Check Endpoint ===
Status Code: 200
Response: {
  "status": "healthy",
  "version": "1.0.0",
  ...
}
✓ Health check passed

=== Testing Basic Text Generation ===
Request: {
  "prompt": "Write a short paragraph about artificial intelligence:",
  "max_tokens": 100,
  "temperature": 0.7
}

Generated Text:
Artificial intelligence (AI) is rapidly transforming...

Model: google/gemma-2b-it
Tokens Used: 95
Finish Reason: stop

✓ Text generation passed

...

================================================================================
ALL TEXT GENERATION TESTS PASSED! ✓
================================================================================
```

### Image Generation Output

```
================================================================================
FICTURES AI SERVER - IMAGE GENERATION API TESTS
================================================================================

Testing server at: http://localhost:8000
Output directory: /path/to/tests/test_output

=== Testing Basic Image Generation ===
Request: {
  "prompt": "A serene mountain landscape at sunset, digital art",
  "width": 1024,
  "height": 1024,
  ...
}

Generating image (this may take 30-60 seconds)...

Model: stabilityai/stable-diffusion-xl-base-1.0
Size: 1024x1024
Seed: 42
Image saved to: test_output/test_basic_20250126_143022_seed42.png

✓ Basic image generation passed

...

================================================================================
ALL IMAGE GENERATION TESTS PASSED! ✓
================================================================================

Generated images saved to: /path/to/tests/test_output
```

## Test Configuration

### Server URL

Default: `http://localhost:8000`

To test against different server:
```python
# Edit test file
BASE_URL = "http://your-server:8000"
```

### Timeout

Default: 300 seconds (5 minutes)

Increase for slower hardware:
```python
async with httpx.AsyncClient(timeout=600.0) as client:
    # ...
```

## Troubleshooting

### Server Not Running

```
Error: Connection refused
```

**Solution:** Start the AI server first
```bash
cd apps/ai-server
python -m uvicorn src.main:app --reload
```

### Model Not Loaded

```
Error: 500 Internal Server Error - Model not initialized
```

**Solution:** Wait for model to download and load on first request (10-30 seconds)

### GPU Out of Memory

```
Error: CUDA out of memory
```

**Solutions:**
1. Use smaller model (Gemma 2B instead of 7B)
2. Reduce batch size in config
3. Enable CPU offload in `.env`:
   ```bash
   DIFFUSERS_ENABLE_CPU_OFFLOAD=true
   TEXT_GPU_MEMORY_UTILIZATION=0.4
   ```

### Hugging Face Authentication

```
Error: 401 Unauthorized - Gemma model requires authentication
```

**Solution:** Login to Hugging Face
```bash
pip install huggingface_hub
huggingface-cli login
# Accept Gemma license at https://huggingface.co/google/gemma-2b-it
```

### Tests Timing Out

```
Error: Timeout after 300 seconds
```

**Solutions:**
1. Increase timeout in test code
2. Use GPU instead of CPU
3. Reduce `num_inference_steps` for images

## Writing Custom Tests

### Example: Custom Text Generation Test

```python
import httpx
import asyncio

async def test_custom():
    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            "http://localhost:8000/api/v1/text/generate",
            json={
                "prompt": "Your custom prompt here",
                "max_tokens": 200,
                "temperature": 0.8,
            },
        )
        result = response.json()
        print(result["text"])

asyncio.run(test_custom())
```

### Example: Custom Image Generation Test

```python
import httpx
import asyncio
import base64
from pathlib import Path

async def test_custom_image():
    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            "http://localhost:8000/api/v1/images/generate",
            json={
                "prompt": "Your image prompt here",
                "width": 1024,
                "height": 1024,
                "num_inference_steps": 25,
            },
        )
        result = response.json()

        # Save image
        image_data = result["image_url"].split(",")[1]
        Path("my_image.png").write_bytes(base64.b64decode(image_data))

asyncio.run(test_custom_image())
```

## Performance Benchmarks

Run benchmarks to measure inference speed:

```python
import time
import httpx
import asyncio

async def benchmark_text_generation(num_requests=10):
    times = []
    async with httpx.AsyncClient(timeout=300.0) as client:
        for i in range(num_requests):
            start = time.time()
            await client.post(
                "http://localhost:8000/api/v1/text/generate",
                json={
                    "prompt": "Write a short sentence",
                    "max_tokens": 50,
                },
            )
            elapsed = time.time() - start
            times.append(elapsed)
            print(f"Request {i+1}: {elapsed:.2f}s")

    avg_time = sum(times) / len(times)
    print(f"\nAverage time: {avg_time:.2f}s")

asyncio.run(benchmark_text_generation())
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: AI Server Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd apps/ai-server
          pip install -r requirements.txt
      - name: Start server
        run: |
          cd apps/ai-server
          python -m uvicorn src.main:app &
          sleep 30
      - name: Run tests
        run: |
          cd apps/ai-server
          python tests/test_text_generation.py
          python tests/test_image_generation.py
```

## Next Steps

- Read [API Reference](../../docs/ai-server/api-reference.md) for detailed endpoint docs
- Read [Performance Optimization](../../docs/ai-server/performance.md) for tuning tips
- Read [Troubleshooting](../../docs/ai-server/troubleshooting.md) for common issues

---

**Ready to test?** Make sure the server is running and execute the test files!
