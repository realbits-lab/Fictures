# Story Image Generation

Generate 16:9 widescreen story illustrations using **OpenAI DALL-E 3** or **Google Gemini 2.5 Flash**.

## Model Comparison

| Feature | DALL-E 3 | Gemini 2.5 Flash |
|---------|----------|------------------|
| **Size** | 1792×1024 (true 16:9) | 1344×768 (7:4, ~16:9) |
| **Quality** | Standard / HD | Standard only |
| **Style** | Vivid / Natural | Not supported |
| **Cost** | $0.04 (std) / $0.08 (HD) | Free (during preview) |
| **Speed** | 10-30 seconds | 5-15 seconds |
| **Current** | ✅ Primary | Fallback/testing |

**Recommendation:** Use DALL-E 3 for production (true 16:9, better quality control).

## Quick Start

### API Endpoint

**POST** `/api/images/generate`

```typescript
const response = await fetch('/api/images/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'A mysterious forest at twilight, cinematic widescreen',
    storyId: 'story_123',
    imageType: 'scene',
    style: 'vivid',      // DALL-E only
    quality: 'standard', // DALL-E: 'standard' | 'hd'
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
  style: 'vivid',
  quality: 'standard',
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
| `style` | string | No | `vivid` | `vivid` \| `natural` (DALL-E only) |
| `quality` | string | No | `standard` | `standard` \| `hd` (DALL-E only) |
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
    width: 1792,
    height: 1024,
    size: 2846330,
    aspectRatio: "16:9"
  },
  prompt: "The final prompt used for generation"
}
```

## Style Options (DALL-E 3 Only)

### Vivid Style (Default)
- Hyper-real and cinematic
- Enhanced colors and dramatic lighting
- Ideal for: fantasy, sci-fi, dramatic scenes

### Natural Style
- More realistic and subdued
- Natural colors and lighting
- Ideal for: contemporary, historical, realistic fiction

## Quality Options (DALL-E 3 Only)

### Standard Quality (Default)
- Good quality, faster generation
- ~1-2 MB file size
- $0.04 per image

### HD Quality
- Higher resolution and detail
- ~2-3 MB file size
- $0.08 per image
- Best for: hero images, cover art

## Automatic Image Optimization

Every generated image automatically creates **18 optimized variants**:
- **Formats:** AVIF, WebP, JPEG
- **Sizes:** Mobile (640×360, 1280×720), Tablet (1024×576, 2048×1152), Desktop (1440×810, 2880×1620)
- **Performance:** 87% faster mobile loading, 50% smaller files

See [Image Optimization Guide](./image-optimization.md) for details.

## Environment Setup

Required in `.env.local`:

```bash
# OpenAI API Key for DALL-E 3 (primary)
OPENAI_API_KEY=sk-...

# Google AI API Key (fallback/testing)
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
magical glowing books, mysterious atmosphere, 16:9 aspect ratio"
```

### Poor Prompts ❌

```
"A city"  (too vague)
"Cool scene"  (not descriptive)
```

### Guidelines

1. **Be specific:** Include setting, mood, lighting, composition details
2. **Add composition hints:** "cinematic widescreen" or "16:9 aspect ratio"
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
    style: 'natural',
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
//          Mood: Epic. Genre: Fantasy. Cinematic widescreen composition..."
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
      quality: 'hd' // Use HD for cover art
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
      prompt: `${description}, cinematic widescreen composition`,
      sceneId,
      storyId,
      chapterId,
      imageType: 'scene',
      style: 'vivid',
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
  style: 'fantasy-art',
  quality: 'standard',
});
```

## Fallback System

If generation fails (API errors, rate limits, network issues):

1. **Automatic placeholders:** Pre-defined images by type
2. **Graceful degradation:** No database corruption
3. **Retry logic:** Automatic fallback to Gemini if DALL-E fails

Placeholder images:
- Character: `system/placeholders/character-default.png`
- Setting: `system/placeholders/setting-visual.png`
- Scene: `system/placeholders/scene-illustration.png`
- Story: `system/placeholders/story-cover.png`

## Performance

- **Generation time:** 10-30 seconds (DALL-E), 5-15 seconds (Gemini)
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

**Missing DALL-E images:**
- Add `OPENAI_API_KEY` to `.env.local`
- System falls back to Gemini or placeholders

**Missing Gemini images:**
- Add `GOOGLE_GENERATIVE_AI_API_KEY` to `.env.local`
- System uses placeholders if both fail

**Upload failures:**
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check Vercel Blob quota

**Using placeholders:**
- Check console logs for generation errors
- Verify API keys are valid
- Check rate limits and billing

**Quality issues:**
- Use more descriptive prompts
- Try HD quality for important images
- Switch between vivid/natural styles
- Add composition hints ("16:9", "widescreen")

## Cost Considerations

### DALL-E 3 Pricing
- **Standard (1792x1024):** $0.040 per image
- **HD (1792x1024):** $0.080 per image

### Vercel Blob Storage
- First 100 GB/month: Free
- Additional storage: Check Vercel pricing

### Recommendations
- Use standard quality for most images
- Reserve HD for cover art and key illustrations
- Implement caching to avoid duplicate generation
- Consider batch generation with queue system

## API Limitations

1. **Content Policy:** DALL-E 3 follows OpenAI's content policy
2. **Rate Limits:** Check your OpenAI API rate limits
3. **Generation Time:** 10-30 seconds per image
4. **Fixed Size:** DALL-E always generates 1792x1024
5. **Gemini Preview:** May have usage limits during preview period

## Related Documentation

- [Image Optimization](./image-optimization.md) - 18-variant optimization system
- [Image System Guide](./image-system-guide.md) - Complete overview
- [Story Download API](../story-download-api.md) - Export stories with images
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob) - Storage docs
