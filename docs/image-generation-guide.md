# Image Generation Guide

## Google Imagen 3 Test Script

### Overview
The `scripts/test-imagen-generation.mjs` script demonstrates how to generate images using Google Imagen 3 via the Vercel AI SDK with custom aspect ratios.

### Prerequisites

1. **Environment Variables**: Ensure `.env.local` contains:

   **For Google Imagen 3 (Vertex AI):**
   - `GOOGLE_VERTEX_API_KEY` - Your Google Cloud API key
   - `GOOGLE_VERTEX_PROJECT_ID` - Your Google Cloud project ID
   - `GOOGLE_VERTEX_LOCATION` (optional, default: `us-central1`)

   **For OpenAI DALL-E 3:**
   - `OPENAI_API_KEY` - Your OpenAI API key

2. **Dependencies**: Required packages:
   - `ai` (Vercel AI SDK)
   - `@ai-sdk/google-vertex` (Google Vertex AI provider)
   - `@ai-sdk/openai` (OpenAI provider)

### Usage

**Google Imagen 3 (Recommended - True 16:9 support):**
```bash
# Run the Imagen 3 Vertex AI test script
dotenv --file .env.local run node scripts/test-imagen3-vertex.mjs
```

**OpenAI DALL-E 3 (Alternative):**
```bash
# Run the DALL-E 3 test script
dotenv --file .env.local run node scripts/test-imagen-generation.mjs
```

### What It Does

1. Generates a test image using Google Imagen 3
2. Uses 16:9 (widescreen) aspect ratio
3. Saves the generated image to `logs/generated-images/`
4. Displays generation metadata (size, dimensions, format)

### Output

Generated images are saved with timestamp filenames:
```
logs/generated-images/imagen-16-9-2025-10-25T12-30-45-123Z.png
```

### Supported Aspect Ratios

Google Imagen 3 supports the following aspect ratios:
- `1:1` - Square (default, social media)
- `4:3` - Fullscreen (media/film)
- `3:4` - Portrait fullscreen
- `16:9` - Widescreen (modern displays) ✅ Used in test script
- `9:16` - Vertical portrait (short-form video)

### Customization

Edit `scripts/test-imagen-generation.mjs` to customize:

```javascript
// Change the prompt
const prompt = 'Your custom image description here';

// Change aspect ratio
aspectRatio: '1:1', // or '4:3', '3:4', '9:16'

// Add provider-specific options
providerOptions: {
  google: {
    numberOfImages: 4, // Generate multiple variations
    // Add other Imagen-specific options
  },
}
```

### Troubleshooting

**Error: Missing API key**
- Verify `.env.local` contains `AI_GATEWAY_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY`

**Error: Model not found**
- Ensure you're using the correct model ID: `imagen-3.0-generate-001`

**Error: Rate limit exceeded**
- Wait a moment and try again
- Check your Google AI quota/billing

### Integration Example

To integrate image generation into your app:

```typescript
import { experimental_generateImage as generateImage } from 'ai';
import { google } from '@ai-sdk/google';

export async function generateStoryIllustration(prompt: string) {
  const { image } = await generateImage({
    model: google.image('imagen-3.0-generate-001'),
    prompt,
    aspectRatio: '16:9',
  });

  return image; // Contains base64, width, height
}
```

### References

- [Vercel AI SDK - Image Generation](https://ai-sdk.dev/docs/ai-sdk-core/image-generation)
- [Google Imagen 3 Documentation](https://ai.google.dev/gemini-api/docs/imagen)
- [AI Gateway Documentation](https://vercel.com/docs/ai-gateway/image-generation)
