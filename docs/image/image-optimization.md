# Image Optimization System

**Last Updated:** 2025-10-29

## Overview

Fictures uses an optimized 4-variant image system designed for comics with many panels per scene. Mobile-first approach with desktop fallback ensures fast loading while minimizing storage costs.

## How It Works

### 1. Image Generation Flow

```
Gemini 2.5 Flash Image (1344×768)
       ↓
Original Upload to Vercel Blob
       ↓
Image Optimization Service
       ↓
Create 4 Variants:
  - 2 formats (AVIF, JPEG)
  - 2 sizes (mobile 1x, mobile 2x)
  - Desktop uses mobile 2x (1344×768)
       ↓
Store all variants in Vercel Blob
       ↓
Save metadata to database
```

### 2. Image Formats (Priority Order)

| Format | Compression | Browser Support | Use Case |
|--------|-------------|-----------------|----------|
| **AVIF** | 50% smaller than JPEG | 93.8% (2025) | Primary - Best compression |
| **JPEG** | Baseline | 100% | Universal fallback |

**Why no WebP?** WebP provides minimal benefit (1.5% coverage gap) while adding 50% more variants. AVIF + JPEG covers 100% of users efficiently.

### 3. Responsive Sizes (~16:9 Aspect Ratio)

| Device | Viewport | Size Used | Quality |
|--------|----------|-----------|---------|
| Mobile Standard | 320-640px | 672×384 (1x) | Perfect fit |
| Mobile Retina | 320-640px | 1344×768 (2x) | No resize, format conversion only |
| Desktop | 1440-1920px | 1344×768 (2x) | Original Gemini size |

**Desktop strategy:** Using mobile 2x (1344×768 - original Gemini output) for desktop provides perfect quality with no upscaling. Comics are mobile-first content - desktop uses original size.

**Total variants per image:** 4 (2 formats × 2 sizes)

## Database Schema

All tables with images have been updated with two fields:

```typescript
{
  imageUrl: string | null;          // Original image URL (1344×768 PNG)
  imageVariants: {                  // Optimized variants metadata
    imageId: string;
    originalUrl: string;
    variants: Array<{
      format: 'avif' | 'jpeg';      // 2 formats only
      device: 'mobile';              // Mobile only (desktop uses mobile 2x)
      resolution: '1x' | '2x';
      width: number;
      height: number;
      url: string;
      size: number;                 // File size in bytes
    }>;
    generatedAt: string;
  } | null;
}
```

**Updated tables:**
- `stories` - Story cover images
- `scenes` - Scene illustrations
- `characters` - Character portraits
- `places` - Location images
- `settings` - Environment images

## Storage Structure (Vercel Blob)

```
stories/{storyId}/{imageType}/
  ├── original/
  │   └── {imageId}.png              (1344×768 original)
  ├── avif/
  │   ├── 672x384/{imageId}.avif     (Mobile 1x)
  │   └── 1344x768/{imageId}.avif    (Mobile 2x / Desktop)
  └── jpeg/
      ├── 672x384/{imageId}.jpeg     (Mobile 1x)
      └── 1344x768/{imageId}.jpeg    (Mobile 2x / Desktop)
```

**Example path:**
```
stories/abc123/character/avif/672x384/img_xyz789.avif
```

## Usage Guide

### Backend: Generating Images

```typescript
import { generateStoryImage } from '@/lib/services/image-generation';

// Generate image with automatic optimization
const result = await generateStoryImage({
  prompt: 'A mysterious forest at twilight, cinematic 16:9',
  storyId: 'story_123',
  imageType: 'scene',  // 'story' | 'scene' | 'character' | 'setting' | 'panel'
  style: 'vivid',
  quality: 'standard',
});

// Save to database
await db.update(scenes)
  .set({
    imageUrl: result.url,
    imageVariants: result.optimizedSet,  // Includes all 4 variants
  })
  .where(eq(scenes.id, sceneId));
```

### Frontend: Displaying Images

#### Using OptimizedImage Component

```tsx
import { OptimizedImage } from '@/components/optimized-image';

// Basic usage
<OptimizedImage
  imageUrl={story.imageUrl}
  imageVariants={story.imageVariants}
  alt="Story cover"
  priority={true}  // For above-fold images
/>

// With custom sizes
<OptimizedImage
  imageUrl={scene.imageUrl}
  imageVariants={scene.imageVariants}
  alt={scene.title}
  sizes="(max-width: 768px) 100vw, 100vw"
  fill
  objectFit="cover"
/>
```

#### Helper Components

```tsx
import { StoryCoverImage, SceneImage, CharacterImage } from '@/components/optimized-image';

// Story cover
<StoryCoverImage story={story} priority={true} />

// Scene image
<SceneImage scene={scene} className="rounded-lg" />

// Character portrait
<CharacterImage character={character} />
```

### Component Features

The `OptimizedImage` component automatically:
- ✓ Detects browser format support (AVIF → JPEG fallback)
- ✓ Selects optimal size based on viewport
- ✓ Generates proper `srcset` for all formats
- ✓ Uses `<picture>` element for format fallbacks
- ✓ Integrates with Next.js Image for lazy loading
- ✓ Supports priority loading for above-fold images
- ✓ Handles missing variants gracefully
- ✓ Desktop uses mobile 2x (1344×768 - original Gemini size)

## Performance Benefits

### Compression Comparison

Original Gemini image: **~300KB** (1344×768 PNG)

**Optimized variants (4-variant system):**
- Mobile AVIF 1x (672×384): **~10KB** (97% smaller)
- Mobile AVIF 2x (1344×768): **~20KB** (93% smaller)
- Mobile JPEG 1x (672×384): **~30KB** (90% smaller)
- Mobile JPEG 2x (1344×768): **~55KB** (82% smaller)

**Total storage per image:** ~115KB for all 4 variants

### Loading Speed

| Device | Original | Optimized | Improvement |
|--------|----------|-----------|-------------|
| Mobile 3G | 5.0s | **0.5s** | **90% faster** |
| Mobile 4G | 2.5s | **0.3s** | **88% faster** |
| Desktop Wi-Fi | 0.8s | **0.12s** | **85% faster** |

## API Reference

### `optimizeImage()`

Generate all optimized variants from an image URL.

```typescript
import { optimizeImage } from '@/lib/services/image-optimization';

const result = await optimizeImage(
  originalImageUrl,  // URL of original image
  imageId,          // Unique image identifier
  storyId,          // Story ID for storage organization
  imageType,        // 'story' | 'scene' | 'character' | 'setting' | 'panel'
  sceneId           // Optional: Scene ID for comics path hierarchy
);

// Returns OptimizedImageSet with all 4 variants
```

### `generateStoryImage()`

Generate image with Gemini 2.5 Flash Image and create optimized variants.

```typescript
import { generateStoryImage } from '@/lib/services/image-generation';

const result = await generateStoryImage({
  prompt: string;
  storyId: string;
  imageType?: 'story' | 'scene' | 'character' | 'setting' | 'panel';
  chapterId?: string;
  sceneId?: string;
  panelNumber?: number;
  style?: 'vivid' | 'natural';
  quality?: 'standard' | 'hd';
  skipOptimization?: boolean;  // Skip variant creation (testing only)
});

// Returns { url, imageId, optimizedSet, isPlaceholder }
```

### `getBestVariant()`

Programmatically select the best variant for a viewport.

```typescript
import { getBestVariant } from '@/lib/services/image-optimization';

const url = getBestVariant(
  variants,      // Array of ImageVariant
  viewportWidth, // Current viewport width in pixels
  format         // Preferred format: 'avif' | 'jpeg'
);
```

## Testing

### Test Image Generation with Optimization

```bash
dotenv --file .env.local run node scripts/test-imagen-generation.mjs
```

The test script will:
1. Generate a test image with Gemini 2.5 Flash Image
2. Create all 4 optimized variants
3. Display URLs and file sizes
4. Show total optimization time

**Expected output:**
```
[Image Generation] Starting story image generation...
[Image Generation] ✓ Original uploaded
[Image Optimization] Processing variant 1/4: mobile 1x avif (672x384) [resize + convert]
[Image Optimization] ✓ Generated avif 672x384 (10KB)
[Image Optimization] Processing variant 2/4: mobile 2x avif (1344x768) [convert only]
[Image Optimization] ✓ Generated avif 1344x768 (20KB)
[Image Optimization] Processing variant 3/4: mobile 1x jpeg (672x384) [resize + convert]
[Image Optimization] ✓ Generated jpeg 672x384 (30KB)
[Image Optimization] Processing variant 4/4: mobile 2x jpeg (1344x768) [convert only]
[Image Optimization] ✓ Generated jpeg 1344x768 (55KB)
[Image Optimization] Complete! Generated 4/4 variants
[Image Optimization] Total size: 115KB across all variants
```

## Troubleshooting

### Issue: "Failed to create optimized variants"

**Cause:** Sharp library error or Vercel Blob upload failure

**Solution:**
1. Check Sharp is installed: `pnpm list sharp`
2. Verify `BLOB_READ_WRITE_TOKEN` in `.env.local`
3. Check Vercel Blob storage limits
4. Original image still uploaded - optimization is non-blocking

### Issue: Images not showing optimized variants

**Cause:** Database field not populated

**Solution:**
1. Check `imageVariants` field is populated
2. Regenerate image if field is null
3. Ensure database migration was applied

### Issue: AVIF images not loading

**Cause:** Browser doesn't support AVIF (6.2% of users on iOS 15 or Android 11 and below)

**Solution:** Component automatically falls back to JPEG. Check browser console for format being used.

### Issue: Using placeholder images

**Cause:** Missing `GOOGLE_GENERATIVE_AI_API_KEY` or API error

**Solution:**
1. Add API key to `.env.local`
2. Check console logs for specific error
3. Verify Google AI API quota and billing

## Best Practices

### 1. Always Use Priority for Above-Fold Images

```tsx
// Hero image - loads first
<StoryCoverImage story={story} priority={true} />

// Below-fold images - lazy loaded
<SceneImage scene={scene} priority={false} />
```

### 2. Provide Appropriate `sizes` Attribute

```tsx
// Full-width image (default for 4-variant system)
<OptimizedImage ... sizes="100vw" />

// Desktop uses mobile 2x (1344×768) automatically
```

### 3. Skip Optimization for Testing

```typescript
// Skip optimization during development/testing
const result = await generateStoryImage({
  prompt: 'test image',
  storyId: 'test',
  skipOptimization: true,  // Faster for testing
});
```

### 4. Monitor Storage Usage

Check Vercel Blob usage regularly:
```bash
# 4-variant system: Each image generates ~115KB of variants
# 100 images = ~12MB
# 1000 images = ~120MB
# 10,000 images = ~1.2GB
```

## Related Documentation

- [image-generation.md](./image-generation.md) - API usage guide
- [image-architecture.md](./image-architecture.md) - System overview
- [Next.js Image Optimization](https://nextjs.org/docs/app/api-reference/components/image)
- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
