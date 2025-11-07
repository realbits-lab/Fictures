# Story Image Generation

Generate story illustrations using **Google Gemini 2.5 Flash** or **Qwen-Image-Lightning** (via AI Server).

## Model Specifications

| Feature | Gemini 2.5 Flash | Qwen-Image-Lightning (AI Server) |
|---------|------------------|----------------------------------|
| **Aspect Ratios** | 1:1, 16:9, 9:16, 2:3 | 1:1, 16:9, 9:16, 2:3, 4:3, 3:4 |
| **Max Dimension** | ~1024px (longer side) | Up to 1664px |
| **Quality** | Standard | High (FP8 + Lightning v2.0) |
| **Speed** | 5-15 seconds | 2-5 seconds (4-step inference) |
| **Cost** | Free (preview) | Self-hosted (GPU required) |
| **Status** | ✅ Primary (default) | ✅ Optional (AI Server) |

### Aspect Ratio Configuration

Different image types automatically use appropriate aspect ratios. **Actual dimensions vary by provider:**

#### Gemini 2.5 Flash (Default Provider)

| Image Type | Aspect Ratio | Dimensions | Use Case |
|------------|--------------|-----------|----------|
| **Story Cover** | 16:9 | 1024×576 | Widescreen thumbnails |
| **Character Portrait** | 1:1 | 1024×1024 | Square portraits |
| **Setting Visual** | 1:1 | 1024×1024 | Square environments |
| **Scene Image** | 16:9 | 1024×576 | Widescreen scenes |
| **Comic Panel** | 9:16 or 2:3 | 576×1024 / 683×1024 | Vertical panels |

**Note:** Gemini dimensions are approximate (~1024px on longer side). Actual dimensions may vary slightly.

#### Qwen-Image-Lightning (AI Server)

| Image Type | Aspect Ratio | Dimensions | Use Case |
|------------|--------------|-----------|----------|
| **Story Cover** | 16:9 | 1664×928 | High-res widescreen |
| **Character Portrait** | 1:1 | 1328×1328 | High-res square |
| **Setting Visual** | 1:1 | 1328×1328 | High-res environments |
| **Scene Image** | 16:9 | 1664×928 | High-res widescreen |
| **Comic Panel** | 9:16 or 2:3 | 928×1664 / 1024×1536 | High-res vertical |

**Note:** Qwen-Image uses official supported resolutions from the model specifications for optimal quality.

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
| `imageType` | string | No | `story` | `story` \| `scene` \| `character` \| `setting` \| `comic-panel` |
| `chapterId` | string | No | - | Chapter context |
| `sceneId` | string | No | - | Scene context |
| `style` | string | No | `vivid` | `vivid` \| `natural` - Generation style |
| `quality` | string | No | `standard` | `standard` \| `hd` - Image quality |
| `seed` | number | No | - | Seed for reproducible results |
| `aspectRatio` | string | No | auto | Override automatic aspect ratio (1:1, 16:9, 9:16, 2:3) |

*Required unless `autoPrompt: true`

## Response Format

```typescript
{
  success: true,
  imageType: "scene",
  imageId: "img_1234567890_abc123",
  originalUrl: "https://blob.vercel-storage.com/stories/123/...",
  blobUrl: "https://blob.vercel-storage.com/stories/123/...",
  dimensions: {
    width: 1024,  // Gemini: varies by aspect ratio
    height: 576   // Gemini 16:9: 1024×576
  },
  size: 1500000,
  optimizedSet: {
    imageId: "opt_1234567890_abc123",
    originalUrl: "https://blob.vercel-storage.com/stories/123/...",
    variants: [
      {
        url: "...",
        format: "avif",
        width: 896,
        height: 512,
        type: "mobile-1x"
      },
      // ... 3 more variants
    ],
    generatedAt: "2025-01-07T12:00:00.000Z"
  },
  isPlaceholder: false
}
```

## Automatic Image Optimization

Every generated image automatically creates **4 optimized variants**:
- **Formats:** AVIF (modern), JPEG (fallback)
- **Sizes:** Mobile 1x (50% of original), Mobile 2x (original size)
- **Performance:** 87% faster mobile loading, 50% smaller files via AVIF

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
dramatic lighting, cinematic widescreen composition"

"Ancient library with towering bookshelves reaching into darkness,
magical glowing books, mysterious atmosphere, cinematic widescreen composition"
```

### Poor Prompts ❌

```
"A city"  (too vague)
"Cool scene"  (not descriptive)
```

### Guidelines

1. **Be specific:** Include setting, mood, lighting, composition details
2. **Add composition hints:** "cinematic widescreen" for 16:9, "square composition" for 1:1, "vertical portrait" for 9:16
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

Placeholder images (environment-aware):
- Character: `{environment}/system/placeholders/character-default.png`
- Setting: `{environment}/system/placeholders/setting-visual.png`
- Scene: `{environment}/system/placeholders/scene-illustration.png`
- Story: `{environment}/system/placeholders/story-cover.png`

Where `{environment}` is either `main` (production) or `develop` (development) based on `NODE_ENV`.

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
- Add composition hints ("cinematic widescreen", "square composition", "vertical portrait")
- Include specific style references
- Try different providers (Gemini vs AI Server) for varying quality/resolution

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

### Gemini 2.5 Flash
1. **Content Policy:** Follows Google AI content policy
2. **Rate Limits:** Check your Google AI API rate limits
3. **Generation Time:** 5-15 seconds per image
4. **Dimensions:** ~1024px on longer side (varies by aspect ratio)
5. **Preview Period:** May have usage limits during preview

### Qwen-Image-Lightning (AI Server)
1. **GPU Required:** Requires CUDA-compatible GPU (8GB+ VRAM)
2. **Fixed Resolutions:** Must use official supported dimensions
3. **Generation Time:** 2-5 seconds per image (4-step Lightning)
4. **Self-Hosted:** Runs on your own infrastructure

## Related Documentation

- [Image Optimization](./image-optimization.md) - 4-variant optimization system (AVIF + JPEG)
- [Image System Guide](./image-system-guide.md) - Complete overview
- [Story Download API](../story-download-api.md) - Export stories with images
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob) - Storage docs
- [AI Server Image API](../../ai-server/docs/api/) - Qwen-Image-Lightning setup
