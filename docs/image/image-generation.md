# Image Generation

Generate 16:9 widescreen story illustrations using **Google Gemini 2.5 Flash Image**.

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
    style: 'vivid',
    quality: 'standard',
  }),
});

const { image } = await response.json();
console.log('Image URL:', image.url);
```

### Using the Service

```typescript
import { generateStoryImage } from '@/lib/services/image-generation';

const result = await generateStoryImage({
  prompt: 'A mysterious forest at twilight, cinematic widescreen',
  storyId: 'story_123',
  imageType: 'scene',
  style: 'vivid',
  quality: 'standard',
});
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Yes* | - | Image description |
| `storyId` | string | Yes | - | Story context |
| `imageType` | string | No | `story` | `story` \| `scene` \| `character` \| `setting` \| `panel` |
| `chapterId` | string | No | - | Chapter context |
| `sceneId` | string | No | - | Scene context |
| `panelNumber` | number | No | - | Panel number for comics |
| `style` | string | No | `vivid` | Style preference (not used by Gemini) |
| `quality` | string | No | `standard` | Quality preference (not used by Gemini) |
| `skipOptimization` | boolean | No | `false` | Skip variant generation |
| `autoPrompt` | boolean | No | `false` | Auto-generate from context |

*Required unless `autoPrompt: true`

## Image Specifications

- **Model:** Google Gemini 2.5 Flash Image
- **Size:** 1344×768 pixels (7:4 ratio, ~16:9)
- **Aspect Ratio:** 16:9 widescreen
- **Format:** PNG
- **Storage:** Vercel Blob (public access)
- **Fallback:** Placeholder images if generation fails

## Environment Setup

Required in `.env.local`:
```bash
GOOGLE_GENERATIVE_AI_API_KEY=...  # Google AI API key
BLOB_READ_WRITE_TOKEN=...          # Vercel Blob storage token
```

## Testing

```bash
# Test image generation
dotenv --file .env.local run node scripts/test-imagen-generation.mjs
```

Expected output: Generates 1344×768 test image in `logs/generated-images/`

## Prompt Best Practices

### Good Prompts ✅
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

**Guidelines:**
1. **Be specific:** Include lighting, mood, composition details
2. **Use descriptive language:** Narrative paragraphs > keyword lists
3. **Specify aspect ratio:** Add "cinematic widescreen" or "16:9" to prompts
4. **Add technical terms:** Camera angles, lighting types, art styles

## Fallback System

If image generation fails (API errors, rate limits, network issues):
- **Automatic placeholder:** Returns pre-defined placeholder images
- **No database corruption:** System gracefully handles failures
- **Placeholder URLs:** Available for each image type

Placeholder images:
- Character: `system/placeholders/character-default.png`
- Setting: `system/placeholders/setting-visual.png`
- Scene: `system/placeholders/scene-illustration.png`
- Story: `system/placeholders/story-cover.png`

## Integration Examples

### Story Editor
```typescript
// Generate cover image
<button onClick={async () => {
  const response = await fetch('/api/images/generate', {
    method: 'POST',
    body: JSON.stringify({ storyId, autoPrompt: true }),
  });
  const { image } = await response.json();
  updateStoryCover(image.url);
}}>
  Generate Cover
</button>
```

### Scene Editor
```typescript
const generateSceneImage = async (description: string) => {
  const response = await fetch('/api/images/generate', {
    method: 'POST',
    body: JSON.stringify({
      prompt: description,
      sceneId,
      storyId,
    }),
  });
  return await response.json();
};
```

## Troubleshooting

**Missing API key:** Add `GOOGLE_GENERATIVE_AI_API_KEY` to `.env.local`. System will use placeholders if missing.

**Failed to upload:** Verify `BLOB_READ_WRITE_TOKEN` is set

**Using placeholders:** Check console logs for generation errors

**Rate limit:** Check Google AI quota and billing
