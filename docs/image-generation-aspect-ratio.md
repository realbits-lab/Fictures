# Image Generation Aspect Ratio Documentation

## Overview

This document explains how aspect ratio and image sizing work with the current Gemini 2.5 Flash Image Preview implementation, and provides guidance for achieving 16:9 ratio images.

## Current Implementation

### Model: Gemini 2.5 Flash Image Preview

**Key Limitation**: Gemini does NOT support explicit size or aspect ratio parameters through the API.

### How Aspect Ratio Works

The `aspectRatio` option in `ImageGenerationOptions` affects:

1. **Prompt Enhancement**: Adds composition guidance to the prompt
   - `'landscape'`: Adds "wide landscape orientation, horizontal composition, 16:9 cinematic aspect ratio"
   - `'portrait'`: Adds "vertical portrait orientation, tall composition"
   - `'square'`: Adds "square composition, balanced framing"

2. **Placeholder Images**: If generation fails, placeholders use appropriate dimensions
   - `'landscape'`: 1024x768 (~1.33:1 ratio, closest available to 16:9)
   - `'portrait'`: 768x1024
   - `'square'`: 768x768

### Example Usage for 16:9 Images

```typescript
import { generateImage } from '@/lib/ai/image-generator';

// Generate a landscape scene with 16:9 composition guidance
const result = await generateImage(
  'A vast alien landscape with twin suns setting over crystalline mountains',
  'scene',
  storyId,
  {
    aspectRatio: 'landscape',  // Guides composition toward 16:9
    style: 'fantasy-art',
    mood: 'epic',
    lighting: 'golden hour'
  }
);
```

## Achieving True 16:9 Ratio

Since Gemini doesn't guarantee exact aspect ratios, here are your options:

### Option 1: Use Prompt Guidance (Current Implementation)

**Pros**:
- No additional processing needed
- Works with current Gemini setup
- Free/included in Gemini API

**Cons**:
- Not guaranteed to be exactly 16:9
- Actual ratio depends on model's interpretation
- May vary between generations

**Best For**: When approximate 16:9 composition is acceptable

### Option 2: Switch to DALL-E 3

```typescript
import { generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';

const { image } = await generateImage({
  model: openai.image('dall-e-3'),
  prompt: 'Your image prompt here',
  size: '1792x1024',  // Closest to 16:9 (~1.75:1)
});
```

**Available DALL-E 3 Sizes**:
- `1024x1024` (square, 1:1)
- `1792x1024` (landscape, ~1.75:1) ← **Closest to 16:9 (1.78:1)**
- `1024x1792` (portrait, ~0.57:1)

**Pros**:
- Precise size control
- Consistent dimensions across generations
- 1792x1024 is very close to 16:9

**Cons**:
- Requires switching model
- May have different API costs
- Different style/quality characteristics

**Best For**: When exact dimensions are critical

### Option 3: Post-Processing Gemini Output

```typescript
import sharp from 'sharp';

async function cropTo16x9(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image dimensions');
  }

  // Calculate 16:9 crop dimensions
  const targetRatio = 16 / 9;
  const currentRatio = metadata.width / metadata.height;

  let cropWidth = metadata.width;
  let cropHeight = metadata.height;

  if (currentRatio > targetRatio) {
    // Image is wider than 16:9, crop width
    cropWidth = Math.floor(metadata.height * targetRatio);
  } else {
    // Image is taller than 16:9, crop height
    cropHeight = Math.floor(metadata.width / targetRatio);
  }

  // Center crop
  const left = Math.floor((metadata.width - cropWidth) / 2);
  const top = Math.floor((metadata.height - cropHeight) / 2);

  return await image
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .toBuffer();
}

// Usage in generateImage function
const croppedImageBuffer = await cropTo16x9(imageBuffer);
const imageUrl = await uploadToBlob(croppedImageBuffer, storyId, type);
```

**Pros**:
- Exact 16:9 ratio guaranteed
- Works with any image generation model
- Maintains image quality

**Cons**:
- Requires additional processing
- May crop important parts of the image
- Adds complexity and latency
- Requires sharp dependency

**Best For**: When you need exact 16:9 but want to keep Gemini

## Recommended Approach

For the Fictures project, we recommend:

1. **For Scene Images**: Use `aspectRatio: 'landscape'` with prompt guidance
   - Scenes benefit from wide composition
   - Approximate 16:9 is usually sufficient
   - No additional processing needed

2. **For Character Images**: Use `aspectRatio: 'portrait'`
   - Characters look better in portrait orientation
   - Exact ratio less critical for character portraits

3. **For Story Cover**: Use `aspectRatio: 'portrait'`
   - Book covers are traditionally portrait
   - Current 768x1152 is good book cover ratio

## Code Changes Made

### 1. Updated `ImageGenerationOptions` Interface

Added comprehensive documentation explaining:
- How aspectRatio works with Gemini
- Limitations of the current implementation
- Alternative approaches for exact 16:9

### 2. Enhanced `buildEnhancedPrompt` Function

Now adds aspect ratio guidance to prompts:
- Landscape: "wide landscape orientation, horizontal composition, 16:9 cinematic aspect ratio"
- Portrait: "vertical portrait orientation, tall composition"
- Square: "square composition, balanced framing"

### 3. Updated `getImageDimensions` Function

Added documentation explaining:
- Function is used for placeholders only
- Not used for actual Gemini generation
- Includes 16:9 ratio calculations and alternatives

### 4. Updated `generatePlaceholder` Function

Now respects aspectRatio parameter:
- Uses `getImageDimensions` to calculate proper placeholder sizes
- Ensures placeholders match intended aspect ratio

### 5. Updated `generateImage` Function

Added comprehensive documentation:
- Explains Gemini limitations
- Shows how aspectRatio is used
- Provides alternatives for exact 16:9

## Testing

To test aspect ratio changes:

```typescript
// Test landscape (closest to 16:9)
const landscapeResult = await generateImage(
  'Wide cinematic landscape',
  'scene',
  'test-story-id',
  { aspectRatio: 'landscape' }
);

// Test portrait
const portraitResult = await generateImage(
  'Character portrait',
  'character',
  'test-story-id',
  { aspectRatio: 'portrait' }
);

// Test square
const squareResult = await generateImage(
  'Balanced composition',
  'setting',
  'test-story-id',
  { aspectRatio: 'square' }
);
```

## Future Considerations

If exact 16:9 becomes a requirement:

1. **Implement DALL-E 3 Integration**
   - Add conditional logic to use DALL-E 3 for scenes
   - Keep Gemini for characters/settings
   - Manage API costs appropriately

2. **Add Post-Processing Pipeline**
   - Integrate sharp for image manipulation
   - Implement smart cropping to preserve composition
   - Add configuration for crop preferences

3. **Hybrid Approach**
   - Use Gemini for generation
   - Apply post-processing only when exact ratio needed
   - Add option to skip post-processing for faster generation

## References

- [Vercel AI SDK Image Generation](https://ai-sdk.dev/docs/ai-sdk-core/image-generation)
- [DALL-E 3 Documentation](https://platform.openai.com/docs/guides/images)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
