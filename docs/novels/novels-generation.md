# Story Image Generation

AI-powered story illustration generation using OpenAI DALL-E 3 with 16:9 widescreen format (1792x1024 pixels).

## Overview

The image generation system creates cinematic, high-quality illustrations for your stories using DALL-E 3. All images are generated in 16:9 aspect ratio (1792x1024 pixels) for consistent widescreen presentation.

## Features

- **16:9 Widescreen Format**: All images generated at 1792x1024 pixels
- **HD Quality**: High-definition image generation
- **Style Control**: Choose between vivid (hyper-real) or natural (realistic) styles
- **Auto Prompt Generation**: Automatically create prompts from story context
- **Vercel Blob Storage**: Automatic upload and public hosting
- **Authentication**: Secure, user-owned image generation

## API Endpoint

### POST `/api/images/generate`

Generate a story illustration using DALL-E 3.

#### Request Body

```typescript
{
  prompt?: string;              // Image description (required if autoPrompt is false)
  storyId?: string;             // Story ID for context
  chapterId?: string;           // Chapter ID for organization
  sceneId?: string;             // Scene ID for organization
  style?: 'vivid' | 'natural';  // Image style (default: 'vivid')
  quality?: 'standard' | 'hd';  // Image quality (default: 'standard')
  autoPrompt?: boolean;         // Auto-generate from story (default: false)
}
```

#### Response

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

## Usage Examples

### 1. Generate with Custom Prompt

```typescript
const response = await fetch('/api/images/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'A mysterious forest at twilight with ancient trees and glowing mushrooms, cinematic widescreen composition',
    storyId: 'story_abc123',
    style: 'vivid',
    quality: 'standard',
  }),
});

const data = await response.json();
console.log('Generated image URL:', data.image.url);
```

### 2. Auto-Generate from Story Context

```typescript
const response = await fetch('/api/images/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
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

### 3. Generate for Specific Scene

```typescript
const response = await fetch('/api/images/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'A tense confrontation in a dimly lit warehouse, dramatic lighting, cinematic composition',
    storyId: 'story_abc123',
    chapterId: 'chapter_def456',
    sceneId: 'scene_ghi789',
    style: 'vivid',
    quality: 'standard',
  }),
});

const data = await response.json();
```

## Service Functions

### `generateStoryImage(params)`

Generate an image and upload to Vercel Blob storage.

```typescript
import { generateStoryImage } from '@/lib/services/image-generation';

const result = await generateStoryImage({
  prompt: 'A beautiful sunset over a calm ocean with sailboats',
  storyId: 'story_123',
  style: 'vivid',
  quality: 'hd',
});

console.log('Image URL:', result.url);
console.log('Dimensions:', result.width, 'x', result.height);
```

### `buildStoryImagePrompt(context)`

Build an optimized prompt from story context.

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

console.log('Generated prompt:', prompt);
// Output: "A young warrior must protect an ancient artifact.
//          Setting: Ancient temple ruins. Characters: Aria the warrior, Elder Mage.
//          Mood: Epic. Genre: Fantasy. Cinematic widescreen composition,
//          16:9 aspect ratio, high quality digital art"
```

## Image Specifications

| Property | Value |
|----------|-------|
| Width | 1792 pixels |
| Height | 1024 pixels |
| Aspect Ratio | 16:9 (widescreen) |
| Format | PNG |
| Quality | HD or Standard |
| Style | Vivid or Natural |
| Storage | Vercel Blob (public access) |

## Style Options

### Vivid Style (Default)
- Hyper-real and cinematic
- Enhanced colors and dramatic lighting
- Ideal for fantasy, sci-fi, and dramatic scenes

### Natural Style
- More realistic and subdued
- Natural colors and lighting
- Ideal for contemporary, historical, or realistic fiction

## Quality Options

### Standard Quality (Default)
- Good quality, faster generation
- Suitable for most illustrations
- ~1-2 MB file size
- Cost-effective at ~$0.04 per image

### HD Quality
- Higher resolution and detail
- Better for hero images and key cover art
- ~2-3 MB file size
- Premium quality at ~$0.08 per image

## Best Practices

### Writing Effective Prompts

1. **Be Specific**: Include details about setting, mood, lighting, and composition
   ```
   Good: "A cyberpunk city street at night with neon signs, rain-soaked pavement, dramatic lighting, cinematic widescreen"
   Bad: "A city street"
   ```

2. **Include Composition Hints**: Add "cinematic widescreen composition" or "16:9 aspect ratio"

3. **Specify Mood**: Use descriptive adjectives (mysterious, dramatic, serene, intense)

4. **Describe Visual Style**: Mention art style (photorealistic, digital art, oil painting)

### Organization

- Use `storyId` to group all images for a story
- Use `chapterId` for chapter-specific illustrations
- Use `sceneId` for scene-specific images
- Files are organized as: `story-images/{storyId}-{chapterId}-{sceneId}-{timestamp}.png`

### Performance

- Image generation takes 10-30 seconds
- Consider implementing a queue for batch generation
- Cache generated images by prompt hash to avoid duplicates

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
    return;
  }

  const data = await response.json();
  // Use data.image.url
} catch (error) {
  console.error('Network error:', error);
}
```

## Environment Variables

Required environment variables in `.env.local`:

```bash
# OpenAI API Key for DALL-E 3
OPENAI_API_KEY=sk-...

# Vercel Blob Storage Token
BLOB_READ_WRITE_TOKEN=...
```

## Testing

Run the test script to verify setup:

```bash
dotenv --file .env.local run node scripts/test-imagen-generation.mjs
```

This will:
1. Generate a test image using DALL-E 3
2. Save it to `logs/generated-images/`
3. Display image metadata and file size

## Cost Considerations

DALL-E 3 pricing (as of 2025):
- **HD Quality (1792x1024)**: ~$0.080 per image
- **Standard Quality (1792x1024)**: ~$0.040 per image

Vercel Blob storage:
- First 100 GB/month: Free
- Additional storage: Check Vercel pricing

## Limitations

1. **Content Policy**: DALL-E 3 follows OpenAI's content policy
2. **Rate Limits**: Check your OpenAI API rate limits
3. **Generation Time**: 10-30 seconds per image
4. **Fixed Size**: Always generates 1792x1024 (no custom sizes)

## Future Enhancements

- [ ] Batch image generation
- [ ] Image style presets for common genres
- [ ] Character consistency across images
- [ ] Image variations from existing images
- [ ] Integration with story editor
- [ ] Image library/gallery per story

## Related Documentation

- [Image Generation Guide](./image-generation-guide.md) - Setup and testing
- [Story Download API](./story-download-api.md) - Export stories with images
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob) - Storage documentation
