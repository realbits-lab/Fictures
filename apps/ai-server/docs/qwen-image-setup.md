# Qwen-Image Setup & Configuration

## Overview

The AI server has been upgraded from Stable Diffusion XL to **Qwen-Image**, a 20B parameter image generation model with superior text rendering capabilities and FP8 quantization optimization for RTX 4090.

## Model Specifications

### Qwen-Image
- **Parameters**: 20 billion (20B)
- **Model Size**: ~20GB download
- **VRAM Usage**: ~12-14GB (with FP8 optimization)
- **Framework**: DiffSynth-Studio
- **Optimization**: FP8 quantization + CPU offloading
- **Strengths**:
  - Exceptional text rendering (English & Chinese)
  - Complex scene generation
  - Precise image editing capabilities
  - State-of-the-art benchmarks

## RTX 4090 Optimization

### FP8 Quantization
- Uses `torch.float8_e4m3fn` format
- **Memory Reduction**: ~50% VRAM savings
- **Performance**: Minimal quality loss
- **Storage**: 1 byte per parameter

### CPU Offloading
- Models offloaded to CPU when not in use
- Stored in FP8 format during offloading
- Automatic memory management
- Optimal for RTX 4090 24GB VRAM

## Installation

### Requirements
```bash
# Already installed in requirements.txt
diffsynth  # DiffSynth-Studio framework
torch>=2.8.0
transformers>=4.51.3
```

### Model Download
The model will be downloaded automatically on first use:
- **Location**: `~/.cache/huggingface/hub/models--Qwen--Qwen-Image/`
- **Size**: ~20GB
- **Download Time**: 15-30 minutes (depending on network speed)
- **Components**: 9 safetensors files (~4.6GB each)

## Configuration

### Environment Variables (.env)
```bash
# Image Generation Model
IMAGE_MODEL_NAME=Qwen/Qwen-Image
IMAGE_MODEL_PATH=./models/images/qwen-image
IMAGE_GPU_MEMORY_UTILIZATION=0.7  # Lower due to FP8 quantization
```

## Usage

### API Endpoint
```bash
POST /api/v1/images/generate
```

### Request Example
```json
{
  "prompt": "A beautiful sunset over mountains",
  "num_inference_steps": 40,
  "width": 1344,
  "height": 768,
  "seed": 12345
}
```

### Response Example
```json
{
  "image_url": "data:image/png;base64,iVBORw0KG...",
  "model": "Qwen/Qwen-Image",
  "width": 1344,
  "height": 768,
  "seed": 12345,
  "num_inference_steps": 40
}
```

## Testing

### Quick Test
```bash
cd apps/ai-server
source venv/bin/activate
python test-scripts/test_quick_image.py
```

### Comprehensive Tests
```bash
python test-scripts/test_qwen_image.py
```

This will generate 3 test images:
1. Simple portrait
2. Chinese text rendering
3. Complex scene with English text

Output images saved to: `test-output/`

## Performance Metrics

### RTX 4090 Expected Performance
- **VRAM Usage**: 12-14GB (FP8 optimized)
- **Generation Time**: 30-60 seconds (40 steps)
- **Max Resolution**: 2048x2048 pixels
- **Concurrent Requests**: Supported with memory management

### Optimization Features
- ✅ FP8 quantization (50% memory reduction)
- ✅ CPU offloading (automatic)
- ✅ Lazy initialization (loaded on first request)
- ✅ Memory pooling and caching

## Text Rendering Capabilities

### Strengths
- **English Text**: Excellent rendering quality
- **Chinese Text**: State-of-the-art (best in class)
- **Multi-line Layouts**: Supported
- **Complex Typography**: High fidelity
- **Paragraph Semantics**: Preserves meaning

### Example Prompts
```
# English text in image
"A modern poster with the text 'WELCOME' in bold letters"

# Chinese text in image
"A traditional scroll with '人工智能' (Artificial Intelligence) in calligraphy"

# Mixed text
"A bilingual sign showing 'Hello 你好' in neon lights"
```

## Architecture

### Service Layer
```
src/services/image_service_qwen.py
```

Key components:
- `QwenImageService`: Main service class
- FP8 quantization configuration
- CPU offloading management
- Async pipeline initialization

### Pipeline Configuration
```python
ModelConfig(
    model_id="Qwen/Qwen-Image",
    origin_file_pattern="transformer/diffusion_pytorch_model*.safetensors",
    offload_device="cpu",           # Offload to CPU
    offload_dtype=torch.float8_e4m3fn,  # FP8 format
)
```

## Migration from SDXL

### Changes Made
1. **Dependency**: Added `diffsynth` to requirements.txt
2. **Service**: Created `image_service_qwen.py`
3. **Routes**: Updated to use Qwen-Image service
4. **Config**: Changed IMAGE_MODEL_NAME to `Qwen/Qwen-Image`

### Backwards Compatibility
The old SDXL service is preserved at:
- `src/services/image_service.py` (not used)

To revert to SDXL:
1. Update routes to import `image_service`
2. Update .env: `IMAGE_MODEL_NAME=stabilityai/stable-diffusion-xl-base-1.0`
3. Restart server

## Troubleshooting

### Model Download Issues
**Problem**: Download fails or times out

**Solutions**:
1. Check Hugging Face authentication: `huggingface-cli whoami`
2. Verify disk space: Need 20GB+ free
3. Check network connection
4. Manually download: Visit https://huggingface.co/Qwen/Qwen-Image

### VRAM Issues
**Problem**: CUDA out of memory

**Solutions**:
1. Reduce `IMAGE_GPU_MEMORY_UTILIZATION` in .env
2. Ensure FP8 quantization is enabled (should be default)
3. Close other GPU applications
4. Monitor: `nvidia-smi -l 1`

### Generation Errors
**Problem**: Image generation fails

**Solutions**:
1. Check server logs: `tail -f logs/ai-server.log`
2. Verify model downloaded completely
3. Test with simpler prompts
4. Reduce num_inference_steps (try 20-30)

## Resources

### Documentation
- **Qwen-Image GitHub**: https://github.com/QwenLM/Qwen-Image
- **DiffSynth-Studio**: https://github.com/modelscope/DiffSynth-Studio
- **Technical Report**: https://qianwen-res.oss-cn-beijing.aliyuncs.com/Qwen-Image/Qwen_Image.pdf

### Model Info
- **Hugging Face**: https://huggingface.co/Qwen/Qwen-Image
- **Model Card**: See HF page for capabilities, limitations, and benchmarks
- **License**: Apache 2.0

### Support
- **Issues**: GitHub Issues for DiffSynth-Studio
- **Community**: Qwen Discord/Forum
- **Benchmarks**: LongText-Bench, ChineseWord, TextCraft

## Next Steps

1. **Wait for model download** (~20GB, 15-30 minutes)
2. **Run test scripts** to validate installation
3. **Integrate with app** via API endpoints
4. **Optimize prompts** for best quality

The model is currently downloading. Check progress:
```bash
du -sh ~/.cache/huggingface/hub/models--Qwen--Qwen-Image
```

When download completes, test with:
```bash
python test-scripts/test_quick_image.py
```
