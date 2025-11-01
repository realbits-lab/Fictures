---
title: "Story Image Generation"
---

# Story Image Generation

Generate story illustrations using **Google Gemini 2.5 Flash**.

## Model Specifications

| Feature | Gemini 2.5 Flash |
|---------|------------------|
| **Size** | 1344×768 (7:4) |
| **Quality** | Standard |
| **Cost** | Free (during preview) |
| **Speed** | 5-15 seconds |
| **Status** | ✅ Primary |

**Note:** Gemini 2.5 Flash provides fast, cost-effective image generation suitable for novel illustrations.

## Quick Start

### API Endpoint

**POST** `/api/images/generate`

```typescript
const response = await fetch('/api/images/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'A mysterious forest at twilight, cinematic composition',
    storyId: 'story_123',
    imageType: 'scene',
  }),
});

const { image } = await response.json();
console.log('Image URL:', image.url);
console.log('Dimensions:', image.width, 'x', image.height);
```

### Using the Service

```typescript
import { generateStoryImage } from '@/lib/services/image-generation';

const result = await generateStoryImage({
  prompt: 'A beautiful sunset over calm ocean with sailboats',
  storyId: 'story_123',
  imageType: 'scene',
});

console.log('Image URL:', result.url);
console.log('Optimized variants:', result.optimizedSet.variants.length);
```

## Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Yes* | - | Image description |
| `storyId` | string | Yes | - | Story context for organization |
| `imageType` | string | No | `story` | `story` \| `scene` \| `character` \| `setting` \| `panel` |
| `chapterId` | string | No | - | Chapter context |
| `sceneId` | string | No | - | Scene context |
| `panelNumber` | number | No | - | Panel number (for comics) |
| `skipOptimization` | boolean | No | `false` | Skip variant generation |
| `autoPrompt` | boolean | No | `false` | Auto-generate from context |

*Required unless `autoPrompt: true`

## Response Format

```typescript
{
  success: true,
  message: "Image generated successfully",
  image: {
    url: "https://blob.vercel-storage.com/story-images/...",
    blobUrl: "https://blob.vercel-storage.com/story-images/...",
    width: 1344,
    height: 768,
    size: 1500000,
    aspectRatio: "7:4"
  },
  prompt: "The final prompt used for generation"
}
```

## Automatic Image Optimization

Every generated image automatically creates **18 optimized variants**:
- **Formats:** AVIF, WebP, JPEG
- **Sizes:** Mobile (640×360, 1280×720), Tablet (1024×576, 2048×1152), Desktop (1440×810, 2880×1620)
- **Performance:** 87% faster mobile loading, 50% smaller files

See [Image Optimization Guide](./image-optimization.md) for details.

## Environment Setup

Required in `.env.local`:

```bash
# Google AI API Key for Gemini 2.5 Flash
GOOGLE_GENERATIVE_AI_API_KEY=...

# Vercel Blob Storage Token
BLOB_READ_WRITE_TOKEN=...
```

## Testing

```bash
# Test image generation
dotenv --file .env.local run node scripts/test-imagen-generation.mjs
```

Expected output: Generates test image in `logs/generated-images/`

## Prompt Best Practices

### Effective Prompts ✅

```
"A cyberpunk city street at night with neon signs, rain-soaked pavement,
dramatic lighting, cinematic composition"

"Ancient library with towering bookshelves reaching into darkness,
magical glowing books, mysterious atmosphere, 7:4 cinematic composition"
```

### Poor Prompts ❌

```
"A city"  (too vague)
"Cool scene"  (not descriptive)
```

### Guidelines

1. **Be specific:** Include setting, mood, lighting, composition details
2. **Add composition hints:** "cinematic composition" or "7:4 aspect ratio"
3. **Specify mood:** Use descriptive adjectives (mysterious, dramatic, serene)
4. **Describe visual style:** Mention art style (photorealistic, digital art)
5. **Use narrative paragraphs:** Better than keyword lists

## Auto-Generate from Context

```typescript
const response = await fetch('/api/images/generate', {
  method: 'POST',
  body: JSON.stringify({
    storyId: 'story_abc123',
    autoPrompt: true,
  }),
});

const data = await response.json();
console.log('Auto-generated prompt:', data.prompt);
console.log('Image URL:', data.image.url);
```

The system builds optimized prompts from story context:

```typescript
import { buildStoryImagePrompt } from '@/lib/services/image-generation';

const prompt = buildStoryImagePrompt({
  title: 'The Last Guardian',
  description: 'A young warrior must protect an ancient artifact',
  genre: 'Fantasy',
  mood: 'Epic',
  characters: ['Aria the warrior', 'Elder Mage'],
  setting: 'Ancient temple ruins',
});

// Output: "A young warrior must protect an ancient artifact.
//          Setting: Ancient temple ruins. Characters: Aria the warrior, Elder Mage.
//          Mood: Epic. Genre: Fantasy. Cinematic composition..."
```

## Organization

Images are organized by story structure:

```
story-images/
  {storyId}/              # Story-level images
  {storyId}-{chapterId}/  # Chapter-level images
  {storyId}-{chapterId}-{sceneId}/  # Scene-level images
```

## Integration Examples

### Story Cover Generation

```typescript
<button onClick={async () => {
  const response = await fetch('/api/images/generate', {
    method: 'POST',
    body: JSON.stringify({
      storyId,
      imageType: 'story',
      autoPrompt: true,
    }),
  });
  const { image } = await response.json();
  updateStoryCover(image.url);
}}>
  Generate Cover
</button>
```

### Scene Illustration

```typescript
const generateSceneImage = async (description: string) => {
  const response = await fetch('/api/images/generate', {
    method: 'POST',
    body: JSON.stringify({
      prompt: `${description}, cinematic composition`,
      sceneId,
      storyId,
      chapterId,
      imageType: 'scene',
    }),
  });
  return await response.json();
};
```

### Character Portrait

```typescript
const result = await generateStoryImage({
  prompt: 'Aria the warrior, determined expression, ancient armor',
  storyId: 'story_123',
  imageType: 'character',
});
```

## Fallback System

If generation fails (API errors, rate limits, network issues):

1. **Automatic placeholders:** Pre-defined images by type
2. **Graceful degradation:** No database corruption
3. **Retry logic:** Automatic retry with exponential backoff

Placeholder images:
- Character: `system/placeholders/character-default.png`
- Setting: `system/placeholders/setting-visual.png`
- Scene: `system/placeholders/scene-illustration.png`
- Story: `system/placeholders/story-cover.png`

## Performance

- **Generation time:** 5-15 seconds (Gemini 2.5 Flash)
- **Optimization time:** +2-4 seconds for 18 variants
- **Consider:** Queue system for batch generation
- **Caching:** Hash prompts to avoid duplicate generation

## Error Handling

```typescript
try {
  const response = await fetch('/api/images/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, storyId }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Generation failed:', error.details);
    // Fallback to placeholder
    return;
  }

  const data = await response.json();
  // Use data.image.url
} catch (error) {
  console.error('Network error:', error);
  // Handle gracefully
}
```

## Troubleshooting

**Missing images:**
- Add `GOOGLE_GENERATIVE_AI_API_KEY` to `.env.local`
- System uses placeholders if generation fails

**Upload failures:**
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check Vercel Blob quota

**Using placeholders:**
- Check console logs for generation errors
- Verify API key is valid
- Check rate limits and billing

**Quality issues:**
- Use more descriptive prompts
- Add composition hints ("cinematic", "7:4 aspect ratio")
- Include specific style references

## Cost Considerations

### Gemini 2.5 Flash Pricing
- **Current:** Free during preview period
- **Future:** Check Google AI pricing when GA

### Vercel Blob Storage
- First 100 GB/month: Free
- Additional storage: Check Vercel pricing

### Recommendations
- Implement caching to avoid duplicate generation
- Consider batch generation with queue system
- Monitor API usage during preview period

## API Limitations

1. **Content Policy:** Gemini follows Google AI content policy
2. **Rate Limits:** Check your Google AI API rate limits
3. **Generation Time:** 5-15 seconds per image
4. **Fixed Size:** Gemini generates 1344×768 (7:4 ratio)
5. **Preview Period:** May have usage limits during preview

## Related Documentation

- [Image Optimization](./image-optimization.md) - 18-variant optimization system
- [Image System Guide](./image-system-guide.md) - Complete overview
- [Story Download API](../story-download-api.md) - Export stories with images
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob) - Storage docs
