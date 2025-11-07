# Fictures AI Server Documentation

Complete guide for the Fictures AI Server - a local AI model serving system for text and image generation.

## 📚 Documentation Index

- **[Setup Guide](./setup.md)** - Installation, configuration, and getting started
- **[API Reference](./api-reference.md)** - Complete API documentation with examples
- **[Architecture](./architecture.md)** - System architecture and design decisions
- **[Model Guide](./models.md)** - Model selection, download, and configuration
- **[Performance Optimization](./performance.md)** - Tips for optimizing inference speed
- **[Testing Guide](./testing.md)** - Running tests and validation
- **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd apps/ai-server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Server

```bash
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Test API

Visit http://localhost:8000/docs for interactive API documentation.

## 🎯 Key Features

- **Text Generation** - vLLM with Gemma models for efficient LLM serving
- **Image Generation** - Stable Diffusion XL for high-quality image synthesis
- **Streaming Support** - Real-time text generation with SSE
- **GPU Acceleration** - Optimized for NVIDIA GPUs with CUDA
- **FastAPI** - Modern, fast web framework with automatic OpenAPI docs
- **Type Safety** - Full Pydantic validation and type hints

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Fictures AI Server                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐              ┌──────────────┐        │
│  │   FastAPI    │              │   FastAPI    │        │
│  │   Routes     │              │   Routes     │        │
│  │   (Text)     │              │   (Image)    │        │
│  └──────┬───────┘              └──────┬───────┘        │
│         │                              │                │
│  ┌──────▼───────┐              ┌──────▼───────┐        │
│  │   vLLM       │              │  Diffusers   │        │
│  │   Engine     │              │  Pipeline    │        │
│  │              │              │              │        │
│  │  Gemma 2B/4B │              │   SDXL 1.0   │        │
│  └──────────────┘              └──────────────┘        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 📊 Performance Metrics

### Text Generation (Gemma 2B)
- **Cold Start**: 10-15 seconds (model loading)
- **Inference**: 20-50 tokens/sec (on RTX 3090)
- **Memory**: 4-6 GB GPU RAM

### Image Generation (SDXL)
- **Cold Start**: 15-20 seconds (model loading)
- **Inference**: 2-4 seconds per image (20 steps, 1024×1024)
- **Memory**: 8-10 GB GPU RAM

## 🔗 Useful Links

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health
- **Model Info**: http://localhost:8000/api/v1/models

## 📝 API Endpoints

### Text Generation
- `POST /api/v1/text/generate` - Generate text
- `POST /api/v1/text/stream` - Stream text generation
- `GET /api/v1/text/models` - List text models

### Image Generation
- `POST /api/v1/images/generate` - Generate image
- `GET /api/v1/images/models` - List image models

### System
- `GET /health` - Health check
- `GET /api/v1/models` - List all models

## 🛠️ Development

```bash
# Run server with hot reload
python -m uvicorn src.main:app --reload

# Run text generation tests
python tests/test_text_generation.py

# Run image generation tests
python tests/test_image_generation.py

# Format code
black src tests

# Type checking
mypy src
```

## 🐳 Docker Support (Coming Soon)

```bash
docker build -t fictures-ai-server .
docker run -p 8000:8000 --gpus all fictures-ai-server
```

## 📄 License

This project is part of the Fictures platform. See the main repository for license information.

## 🤝 Contributing

See the main repository CONTRIBUTING.md for guidelines.

## 📧 Support

For issues and questions:
- GitHub Issues: https://github.com/realbits-lab/Fictures/issues
- Documentation: This folder

---

**Next Steps**: Read the [Setup Guide](./setup.md) to get started!
