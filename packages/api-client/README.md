# @fictures/api-client

Type-safe TypeScript client for the Fictures AI Server API.

## Installation

This package is part of the Fictures monorepo and is automatically available to other workspace packages.

In your Next.js app (`apps/web`), you can import it directly:

```typescript
import { aiClient } from '@fictures/api-client';
```

## Usage

### Text Generation

```typescript
import { aiClient } from '@fictures/api-client';

// Generate text
const result = await aiClient.generateText({
  prompt: 'Write a story about a magical forest',
  max_tokens: 1024,
  temperature: 0.8,
});

console.log(result.text);
```

### Image Generation

```typescript
import { aiClient } from '@fictures/api-client';

// Generate image
const result = await aiClient.generateImage({
  prompt: 'A serene forest at twilight, cinematic widescreen',
  width: 1344,
  height: 768,
  num_inference_steps: 30,
});

console.log(result.image_url);
```

### Custom Configuration

```typescript
import FicturesAIClient from '@fictures/api-client';

const client = new FicturesAIClient({
  baseURL: 'http://localhost:8000',
  timeout: 60000, // 60 seconds for image generation
  headers: {
    'X-API-Key': 'your-api-key',
  },
});

const result = await client.generateText({ prompt: 'Hello' });
```

### Health Check

```typescript
import { aiClient } from '@fictures/api-client';

const health = await aiClient.healthCheck();
console.log(health.status); // "healthy"
```

## Automatic Type Generation

Types are automatically generated from the FastAPI OpenAPI schema.

### Generate Types

1. Ensure AI server is running: `pnpm dev:ai`
2. Generate TypeScript types: `pnpm generate`

```bash
cd packages/api-client
pnpm generate
```

This creates `src/generated/schema.ts` with all API types from the FastAPI server.

## API Methods

### Text Generation

- `generateText(params)` - Generate text using local language model
- `listTextModels()` - List available text generation models

### Image Generation

- `generateImage(params)` - Generate image using local diffusion model
- `listImageModels()` - List available image generation models

### Utilities

- `healthCheck()` - Check AI server health status

## Using in Next.js API Routes

```typescript
// app/api/ai/generate-text/route.ts
import { aiClient } from '@fictures/api-client';

export async function POST(request: Request) {
  const { prompt } = await request.json();

  try {
    const result = await aiClient.generateText({
      prompt,
      max_tokens: 1024,
      temperature: 0.8,
    });

    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: 'Text generation failed' },
      { status: 500 }
    );
  }
}
```

## Using in React Components

```typescript
// app/components/AITextGenerator.tsx
'use client';

import { useState } from 'react';
import { aiClient } from '@fictures/api-client';

export function AITextGenerator() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const response = await aiClient.generateText({
        prompt,
        max_tokens: 512,
      });
      setResult(response.text);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt..."
      />
      <button onClick={generate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate'}
      </button>
      {result && <pre>{result}</pre>}
    </div>
  );
}
```

## Error Handling

```typescript
import { aiClient } from '@fictures/api-client';

try {
  const result = await aiClient.generateText({ prompt: 'Hello' });
  console.log(result);
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error('API Error:', error.response?.data);
  } else {
    console.error('Unexpected error:', error);
  }
}
```
