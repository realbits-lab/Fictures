# API Reference

Complete API reference for the Fictures AI Server.

## Base URL

```
http://localhost:8000
```

## Authentication

**All API endpoints require authentication using API keys.**

The AI server validates API keys against the web application's PostgreSQL database, ensuring consistent authentication across all services. This simple database-only approach uses just **2 database queries per request** for efficient authentication (~15-30ms overhead).

For complete authentication documentation, see [Authentication Guide](../general/authentication.md).

### Authentication Methods

API keys can be provided in two ways:

1. **Authorization Header (Recommended)**:
   ```
   Authorization: Bearer YOUR_API_KEY
   ```

2. **x-api-key Header (Alternative)**:
   ```
   x-api-key: YOUR_API_KEY
   ```

### Required Scopes

Different endpoints require different permission scopes:

| Endpoint | Required Scope | Description |
|----------|----------------|-------------|
| `POST /api/v1/text/generate` | `stories:write` | Generate text |
| `POST /api/v1/text/stream` | `stories:write` | Stream text generation |
| `GET /api/v1/text/models` | Any valid API key | List text models |
| `POST /api/v1/images/generate` | `stories:write` | Generate images |
| `GET /api/v1/images/models` | Any valid API key | List image models |

### Scope Hierarchy

- `admin:all` - Full access to all endpoints
- `stories:write` - Create and modify stories (implies `stories:read`)
- `stories:read` - Read story data only

### Error Responses

**401 Unauthorized** - Missing or invalid API key:
```json
{
  "detail": "API key required. Provide via 'Authorization: Bearer YOUR_API_KEY' or 'x-api-key: YOUR_API_KEY' header"
}
```

**403 Forbidden** - Insufficient permissions:
```json
{
  "detail": "Insufficient permissions. Required scope: stories:write"
}
```

### Getting API Keys

API keys are managed through the web application at `/settings/api-keys`:

1. Navigate to `/settings/api-keys` in the web app
2. Create a new API key with required scopes (`stories:write` recommended)
3. Copy the generated key (shown only once)
4. Store securely (keys are hashed with bcrypt in the database)
5. Use the key in your requests to the AI server

The AI server queries the same `api_keys` table, validating keys by prefix matching and bcrypt hash verification.

### Example Request

```bash
curl -X POST "http://localhost:8000/api/v1/images/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "width": 1024,
    "height": 1024
  }'
```

### Disabling Authentication (Development Only)

For development purposes, authentication can be disabled by setting:

```bash
REQUIRE_API_KEY=false
```

When disabled, all requests are authorized as a mock user with `admin:all` scope. No database connection is required in this mode.

**⚠️ WARNING**:
- Never use in production
- Bypasses all security checks
- Only for local debugging

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
  -H "Authorization: Bearer YOUR_API_KEY" \
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
import os

async def generate_text():
    api_key = os.getenv("AI_SERVER_API_KEY")  # Store API key in environment

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/v1/text/generate",
            json={
                "prompt": "Write a haiku about programming",
                "max_tokens": 50,
                "temperature": 0.7,
            },
            headers={"Authorization": f"Bearer {api_key}"},
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
import os

async def stream_text():
    api_key = os.getenv("AI_SERVER_API_KEY")

    async with httpx.AsyncClient() as client:
        async with client.stream(
            "POST",
            "http://localhost:8000/api/v1/text/stream",
            json={
                "prompt": "Write a story about a robot",
                "max_tokens": 200,
                "temperature": 0.8,
            },
            headers={"Authorization": f"Bearer {api_key}"},
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
  const apiKey = process.env.AI_SERVER_API_KEY;  // Store API key securely

  const response = await fetch('http://localhost:8000/api/v1/text/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
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
  -H "Authorization: Bearer YOUR_API_KEY" \
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
import os
from pathlib import Path

async def generate_image():
    api_key = os.getenv("AI_SERVER_API_KEY")

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
            headers={"Authorization": f"Bearer {api_key}"},
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
  const apiKey = process.env.AI_SERVER_API_KEY;

  const response = await fetch('http://localhost:8000/api/v1/images/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
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
| 401 | Unauthorized | Missing or invalid API key |
| 403 | Forbidden | Valid API key but insufficient permissions |
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
