# Image Generation Quick Start

Generate 16:9 widescreen story illustrations using DALL-E 3.

## ✅ Setup Complete

The following has been implemented for your story platform:

1. ✅ Image generation service using DALL-E 3
2. ✅ API endpoint at `/api/images/generate`
3. ✅ 16:9 aspect ratio (1792x1024 pixels)
4. ✅ Automatic upload to Vercel Blob storage
5. ✅ User authentication and ownership verification

## Quick Test

Test the image generation API:

```bash
curl -X POST http://localhost:3000/api/images/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A mysterious forest at twilight with ancient trees, cinematic widescreen composition",
    "style": "vivid",
    "quality": "hd"
  }'
```

## Basic Usage

### Generate Image from Prompt

```typescript
const response = await fetch('/api/images/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Your image description here',
    storyId: 'story_123',
    style: 'vivid',
    quality: 'hd',
  }),
});

const data = await response.json();
console.log('Image URL:', data.image.url);
```

### Auto-Generate from Story

```typescript
const response = await fetch('/api/images/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    storyId: 'story_123',
    autoPrompt: true,  // Auto-generates prompt from story context
  }),
});
```

## Files Created

### Service Layer
- **`src/lib/services/image-generation.ts`** - Core image generation logic
  - `generateStoryImage()` - Generate and upload images
  - `buildStoryImagePrompt()` - Auto-generate prompts from story context

### API Layer
- **`src/app/api/images/generate/route.ts`** - API endpoint
  - POST `/api/images/generate` - Generate images
  - GET `/api/images/generate` - API documentation

### Documentation
- **`docs/story-image-generation.md`** - Full API documentation
- **`docs/image-generation-examples.tsx`** - React component examples
- **`docs/image-generation-guide.md`** - Setup and testing guide
- **`scripts/test-imagen-generation.mjs`** - Test script

## API Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Conditional* | - | Image description |
| `storyId` | string | No | - | Story ID for context |
| `chapterId` | string | No | - | Chapter ID |
| `sceneId` | string | No | - | Scene ID |
| `style` | string | No | `vivid` | `vivid` or `natural` |
| `quality` | string | No | `hd` | `hd` or `standard` |
| `autoPrompt` | boolean | No | `false` | Auto-generate prompt |

*Required if `autoPrompt` is false

## Image Specifications

- **Size**: 1792x1024 pixels (fixed)
- **Aspect Ratio**: 16:9 (widescreen)
- **Format**: PNG
- **Quality**: HD (default) or Standard
- **Storage**: Vercel Blob (public access)
- **Generation Time**: 10-30 seconds

## Style Options

### Vivid (Default)
- Hyper-real, cinematic
- Enhanced colors and dramatic lighting
- Best for: Fantasy, Sci-Fi, Epic scenes

### Natural
- Realistic, subdued
- Natural colors and lighting
- Best for: Contemporary, Historical, Realistic fiction

## Environment Variables

Required in `.env.local`:

```bash
OPENAI_API_KEY=sk-...           # Your OpenAI API key
BLOB_READ_WRITE_TOKEN=...       # Vercel Blob storage token
```

## Testing

Run the test script:

```bash
dotenv --file .env.local run node scripts/test-imagen-generation.mjs
```

Expected output:
- ✅ Generates 1792x1024 test image
- ✅ Saves to `logs/generated-images/`
- ✅ Shows metadata and file size

## Example Prompts

### Good Prompts ✅

```
"A cyberpunk city street at night with neon signs, rain-soaked pavement,
dramatic lighting, cinematic widescreen composition"

"Ancient library with towering bookshelves reaching into darkness,
magical glowing books, mysterious atmosphere, 16:9 aspect ratio"

"Medieval castle on a cliff at sunset, dramatic sky with clouds,
epic fantasy landscape, cinematic composition"
```

### Poor Prompts ❌

```
"A city"  (too vague)
"Cool scene"  (not descriptive)
"Chapter 1"  (no visual description)
```

## Integration Examples

### In Story Editor

```typescript
// Add a "Generate Cover" button
<button onClick={async () => {
  const response = await fetch('/api/images/generate', {
    method: 'POST',
    body: JSON.stringify({ storyId, autoPrompt: true }),
  });
  const { image } = await response.json();
  // Update story cover image
  updateStoryCover(image.url);
}}>
  Generate Cover
</button>
```

### In Scene Editor

```typescript
// Generate scene-specific illustration
const generateSceneImage = async (sceneDescription: string) => {
  const response = await fetch('/api/images/generate', {
    method: 'POST',
    body: JSON.stringify({
      prompt: sceneDescription,
      sceneId,
      chapterId,
      storyId,
    }),
  });
  return await response.json();
};
```

## Cost Estimates

DALL-E 3 pricing (2025):
- **HD (1792x1024)**: ~$0.080 per image
- **Standard (1792x1024)**: ~$0.040 per image

Vercel Blob:
- Free: First 100 GB/month
- Reasonable for typical story platforms

## Next Steps

1. **Test the API**: Use the test script or curl command
2. **Add UI Components**: Use examples from `docs/image-generation-examples.tsx`
3. **Integrate with Story Editor**: Add image generation buttons
4. **Set Up Image Gallery**: Display generated images per story
5. **Add to Story Export**: Include images in story downloads

## Support & Documentation

- **Full Documentation**: See `docs/story-image-generation.md`
- **React Examples**: See `docs/image-generation-examples.tsx`
- **Test Script**: Run `scripts/test-imagen-generation.mjs`
- **API Docs**: GET `/api/images/generate` for interactive docs

## Troubleshooting

### "Missing OPENAI_API_KEY"
Add your OpenAI API key to `.env.local`

### "Failed to upload to blob"
Verify `BLOB_READ_WRITE_TOKEN` is set correctly

### "Image generation failed"
- Check OpenAI API rate limits
- Verify prompt doesn't violate content policy
- Ensure account has sufficient credits

### Slow generation
- Normal: 10-30 seconds per image
- Consider implementing a queue for batch generation
