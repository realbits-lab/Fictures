# API Reference

Complete API reference for the Fictures AI Server.

## Base URL

```
http://localhost:8000
```

## Authentication

Currently, the API does not require authentication. This will be added in future versions.

---

## System Endpoints

### GET /

Root endpoint with API information.

**Response:**
```json
{
  "message": "Fictures AI Server",
  "version": "1.0.0",
  "description": "Local AI model serving for text and image generation",
  "endpoints": {
    "docs": "/docs",
    "redoc": "/redoc",
    "health": "/health",
    "models": "/api/v1/models"
  }
}
```

### GET /health

Health check endpoint with model status.

**Response:**
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
      "initialized": true
    },
    "image": {
      "name": "stabilityai/stable-diffusion-xl-base-1.0",
      "type": "image-generation",
      "framework": "diffusers",
      "device": "cuda",
      "initialized": true
    }
  }
}
```

### GET /api/v1/models

List all available models.

**Response:**
```json
{
  "text_generation": [
    {
      "name": "google/gemma-2b-it",
      "type": "text-generation",
      "framework": "vLLM",
      "max_tokens": 4096,
      "initialized": true
    }
  ],
  "image_generation": [
    {
      "name": "stabilityai/stable-diffusion-xl-base-1.0",
      "type": "image-generation",
      "framework": "diffusers",
      "device": "cuda",
      "initialized": true
    }
  ]
}
```

---

## Text Generation Endpoints

### POST /api/v1/text/generate

Generate text using vLLM with Gemma model.

**Request Body:**
```json
{
  "prompt": "Write a short story about a magical forest",
  "max_tokens": 1024,
  "temperature": 0.8,
  "top_p": 0.9,
  "stop_sequences": ["\n\n", "THE END"]
}
```

**Parameters:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | Text prompt for generation |
| `max_tokens` | integer | No | 2048 | Maximum tokens to generate (1-8192) |
| `temperature` | float | No | 0.7 | Sampling temperature (0.0-2.0) |
| `top_p` | float | No | 0.9 | Nucleus sampling parameter (0.0-1.0) |
| `stop_sequences` | array | No | null | List of stop sequences |

**Response:**
```json
{
  "text": "Once upon a time, in a magical forest...",
  "model": "google/gemma-2b-it",
  "tokens_used": 512,
  "finish_reason": "stop"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `text` | string | Generated text |
| `model` | string | Model used for generation |
| `tokens_used` | integer | Number of tokens generated |
| `finish_reason` | string | Reason for completion: `stop`, `length`, `error` |

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/text/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a haiku about programming",
    "max_tokens": 50,
    "temperature": 0.7
  }'
```

**Python Example:**
```python
import httpx
import asyncio

async def generate_text():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/v1/text/generate",
            json={
                "prompt": "Write a haiku about programming",
                "max_tokens": 50,
                "temperature": 0.7,
            },
            timeout=300.0,
        )
        result = response.json()
        print(result["text"])

asyncio.run(generate_text())
```

### POST /api/v1/text/stream

Generate text with streaming response (Server-Sent Events).

**Request Body:** Same as `/api/v1/text/generate`

**Response:** Server-Sent Events stream

**Event Format:**
```
data: {"text": "Once upon", "model": "google/gemma-2b-it", "tokens_used": 3, "finish_reason": null, "done": false}

data: {"text": "Once upon a time", "model": "google/gemma-2b-it", "tokens_used": 5, "finish_reason": null, "done": false}

data: {"text": "Once upon a time, in a magical forest...", "model": "google/gemma-2b-it", "tokens_used": 512, "finish_reason": "stop", "done": true}
```

**Python Streaming Example:**
```python
import httpx
import asyncio
import json

async def stream_text():
    async with httpx.AsyncClient() as client:
        async with client.stream(
            "POST",
            "http://localhost:8000/api/v1/text/stream",
            json={
                "prompt": "Write a story about a robot",
                "max_tokens": 200,
                "temperature": 0.8,
            },
            timeout=300.0,
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = json.loads(line[6:])
                    print(data["text"], end="", flush=True)
                    if data["done"]:
                        break

asyncio.run(stream_text())
```

**JavaScript Fetch API Example:**
```javascript
async function streamText() {
  const response = await fetch('http://localhost:8000/api/v1/text/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Write a story about a robot',
      max_tokens: 200,
      temperature: 0.8,
    }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        console.log(data.text);
        if (data.done) return;
      }
    }
  }
}

streamText();
```

### GET /api/v1/text/models

List available text generation models.

**Response:**
```json
{
  "models": [
    {
      "id": "google/gemma-2b-it",
      "name": "google/gemma-2b-it",
      "type": "text-generation",
      "framework": "vLLM",
      "max_tokens": 4096,
      "status": "initialized"
    }
  ]
}
```

---

## Image Generation Endpoints

### POST /api/v1/images/generate

Generate image using Stable Diffusion XL.

**Request Body:**
```json
{
  "prompt": "A serene mountain landscape at sunset, digital art",
  "negative_prompt": "blurry, low quality, distorted",
  "width": 1344,
  "height": 768,
  "num_inference_steps": 30,
  "guidance_scale": 7.5,
  "seed": 42
}
```

**Parameters:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | Text prompt for image generation |
| `negative_prompt` | string | No | null | Features to avoid in the image |
| `width` | integer | No | 1344 | Image width in pixels (256-2048) |
| `height` | integer | No | 768 | Image height in pixels (256-2048) |
| `num_inference_steps` | integer | No | 30 | Denoising steps (1-100) |
| `guidance_scale` | float | No | 7.5 | Prompt adherence (1.0-20.0) |
| `seed` | integer | No | random | Random seed for reproducibility |

**Response:**
```json
{
  "image_url": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "model": "stabilityai/stable-diffusion-xl-base-1.0",
  "width": 1344,
  "height": 768,
  "seed": 42
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `image_url` | string | Base64 encoded PNG image with data URL prefix |
| `model` | string | Model used for generation |
| `width` | integer | Generated image width |
| `height` | integer | Generated image height |
| `seed` | integer | Seed used for generation |

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/images/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "width": 1024,
    "height": 1024,
    "num_inference_steps": 25,
    "seed": 42
  }' > response.json

# Extract and save image
python -c "import json, base64; data = json.load(open('response.json')); img = data['image_url'].split(',')[1]; open('output.png', 'wb').write(base64.b64decode(img))"
```

**Python Example:**
```python
import httpx
import asyncio
import base64
from pathlib import Path

async def generate_image():
    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            "http://localhost:8000/api/v1/images/generate",
            json={
                "prompt": "A beautiful sunset over mountains, digital art",
                "negative_prompt": "blurry, low quality",
                "width": 1024,
                "height": 1024,
                "num_inference_steps": 25,
                "guidance_scale": 7.5,
                "seed": 42,
            },
        )

        result = response.json()

        # Save image
        image_data = result["image_url"].split(",")[1]
        image_bytes = base64.b64decode(image_data)
        Path("output.png").write_bytes(image_bytes)

        print(f"Image saved! Seed: {result['seed']}")

asyncio.run(generate_image())
```

**JavaScript Example:**
```javascript
async function generateImage() {
  const response = await fetch('http://localhost:8000/api/v1/images/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'A beautiful sunset over mountains, digital art',
      negative_prompt: 'blurry, low quality',
      width: 1024,
      height: 1024,
      num_inference_steps: 25,
      guidance_scale: 7.5,
      seed: 42,
    }),
  });

  const result = await response.json();

  // Display image in browser
  const img = document.createElement('img');
  img.src = result.image_url;
  document.body.appendChild(img);

  console.log(`Seed: ${result.seed}`);
}

generateImage();
```

### GET /api/v1/images/models

List available image generation models.

**Response:**
```json
{
  "models": [
    {
      "id": "stabilityai/stable-diffusion-xl-base-1.0",
      "name": "stabilityai/stable-diffusion-xl-base-1.0",
      "type": "image-generation",
      "framework": "diffusers",
      "device": "cuda",
      "status": "initialized"
    }
  ]
}
```

---

## Error Responses

All endpoints return standard HTTP error codes with JSON error messages.

**Error Format:**
```json
{
  "detail": "Error message description"
}
```

**Common Error Codes:**

| Code | Meaning | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid parameters (e.g., prompt too long) |
| 422 | Unprocessable Entity | Validation error (e.g., wrong type) |
| 500 | Internal Server Error | Server error during generation |
| 503 | Service Unavailable | Model not loaded or GPU error |

**Example Error Response:**
```json
{
  "detail": "Prompt too long (max 8000 characters)"
}
```

---

## Rate Limiting

Currently, there is no rate limiting. This will be added in future versions.

---

## Interactive Documentation

For interactive API testing, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## TypeScript Client Generation

Generate TypeScript client from OpenAPI schema:

```bash
# Install openapi-typescript
npm install -D openapi-typescript

# Generate types
npx openapi-typescript http://localhost:8000/openapi.json -o src/types/ai-server.ts
```

---

## Next Steps

- See [Testing Guide](./testing.md) for API testing examples
- See [Performance Optimization](./performance.md) for tuning tips
- See [Troubleshooting](./troubleshooting.md) for common issues
