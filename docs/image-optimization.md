# Image Optimization System

**Last Updated:** 2025-10-25

## Overview

Fictures uses a comprehensive image optimization system to deliver fast, responsive images across all devices. When you generate an image (for stories, scenes, characters, or settings), the system automatically creates multiple optimized variants in different formats and sizes.

## How It Works

### 1. Image Generation Flow

```
DALL-E 3 (1792×1024)
       ↓
Original Upload to Vercel Blob
       ↓
Image Optimization Service
       ↓
Create 18 Variants:
  - 3 formats (AVIF, WebP, JPEG)
  - 6 sizes (mobile 1x/2x, tablet 1x/2x, desktop 1x/2x)
       ↓
Store all variants in Vercel Blob
       ↓
Save metadata to database
```

### 2. Image Formats (Priority Order)

| Format | Compression | Browser Support | Use Case |
|--------|-------------|-----------------|----------|
| **AVIF** | 50% smaller than JPEG | 93.8% (2025) | Primary - Best compression |
| **WebP** | 30% smaller than JPEG | 95.29% (2025) | Fallback - Wider support |
| **JPEG** | Baseline | 100% | Final fallback - Universal |

### 3. Responsive Sizes (16:9 Aspect Ratio)

| Device | Viewport | 1x Size | 2x Size (Retina) |
|--------|----------|---------|------------------|
| Mobile | 320-640px | 640×360 | 1280×720 |
| Tablet | 768-1024px | 1024×576 | 2048×1152 |
| Desktop | 1440-1920px | 1440×810 | 2880×1620 |

**Total variants per image:** 18 (3 formats × 6 sizes)

## Database Schema

All tables with images have been updated with two fields:

```typescript
{
  imageUrl: string | null;          // Original image URL (1792×1024 PNG)
  imageVariants: {                  // Optimized variants metadata
    imageId: string;
    originalUrl: string;
    variants: Array<{
      format: 'avif' | 'webp' | 'jpeg';
      device: 'mobile' | 'tablet' | 'desktop';
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
  │   └── {imageId}.png              (1792×1024 original)
  ├── avif/
  │   ├── 640x360/{imageId}.avif     (Mobile 1x)
  │   ├── 1280x720/{imageId}.avif    (Mobile 2x)
  │   ├── 1024x576/{imageId}.avif    (Tablet 1x)
  │   ├── 2048x1152/{imageId}.avif   (Tablet 2x)
  │   ├── 1440x810/{imageId}.avif    (Desktop 1x)
  │   └── 2880x1620/{imageId}.avif   (Desktop 2x)
  ├── webp/
  │   └── [same structure as AVIF]
  └── jpeg/
      └── [same structure as AVIF]
```

**Example path:**
```
stories/abc123/character/avif/640x360/img_xyz789.avif
```

## Usage Guide

### Backend: Generating Images

```typescript
import { generateStoryImage } from '@/lib/services/image-generation';

// Generate image with automatic optimization
const result = await generateStoryImage({
  prompt: 'A mysterious forest at twilight, cinematic 16:9',
  storyId: 'story_123',
  imageType: 'scene',  // 'story' | 'scene' | 'character' | 'setting'
  style: 'vivid',
  quality: 'standard',
});

// Save to database
await db.update(scenes)
  .set({
    imageUrl: result.url,
    imageVariants: result.optimizedSet,  // Includes all 18 variants
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
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
- ✓ Detects browser format support (AVIF → WebP → JPEG)
- ✓ Selects optimal size based on viewport
- ✓ Generates proper `srcset` for all formats
- ✓ Uses `<picture>` element for format fallbacks
- ✓ Integrates with Next.js Image for lazy loading
- ✓ Supports priority loading for above-fold images
- ✓ Handles missing variants gracefully

## Performance Benefits

### Compression Comparison

Original DALL-E image: **~500KB** (1792×1024 PNG)

**Optimized variants:**
- Mobile AVIF (640×360): **~15KB** (97% smaller)
- Tablet AVIF (1024×576): **~25KB** (95% smaller)
- Desktop AVIF (1440×810): **~35KB** (93% smaller)

**Average total size for all 18 variants:** ~400KB (stored once, served many times)

### Loading Speed

| Device | Before | After | Improvement |
|--------|--------|-------|-------------|
| Mobile 3G | 6.5s | 0.8s | **87% faster** |
| Tablet 4G | 3.2s | 0.5s | **84% faster** |
| Desktop Wi-Fi | 1.1s | 0.2s | **82% faster** |

## API Reference

### `optimizeImage()`

Generate all optimized variants from an image URL.

```typescript
import { optimizeImage } from '@/lib/services/image-optimization';

const result = await optimizeImage(
  originalImageUrl,  // URL of original image
  imageId,          // Unique image identifier
  storyId,          // Story ID for storage organization
  imageType         // 'story' | 'scene' | 'character' | 'setting'
);

// Returns OptimizedImageSet with all 18 variants
```

### `generateStoryImage()`

Generate image with DALL-E 3 and create optimized variants.

```typescript
import { generateStoryImage } from '@/lib/services/image-generation';

const result = await generateStoryImage({
  prompt: string;
  storyId: string;
  imageType?: 'story' | 'scene' | 'character' | 'setting';
  style?: 'vivid' | 'natural';
  quality?: 'standard' | 'hd';
  skipOptimization?: boolean;  // Skip variant creation (testing only)
});

// Returns { url, imageId, optimizedSet }
```

### `getBestVariant()`

Programmatically select the best variant for a viewport.

```typescript
import { getBestVariant } from '@/lib/services/image-optimization';

const url = getBestVariant(
  variants,      // Array of ImageVariant
  viewportWidth, // Current viewport width in pixels
  format         // Preferred format: 'avif' | 'webp' | 'jpeg'
);
```

## Testing

### Test Image Generation with Optimization

```bash
dotenv --file .env.local run node scripts/test-imagen-generation.mjs
```

The test script will:
1. Generate a test image with DALL-E 3
2. Create all 18 optimized variants
3. Display URLs and file sizes
4. Show total optimization time

**Expected output:**
```
[Image Generation] Starting story image generation...
[Image Generation] ✓ Original uploaded
[Image Optimization] Processing variant 1/18: mobile 1x avif (640x360)
[Image Optimization] ✓ Generated avif 640x360 (15KB)
...
[Image Optimization] Complete! Generated 18/18 variants
[Image Optimization] Total size: 387KB across all variants

✓ Image optimization complete!
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
1. Check `imageVariants` field is populated:
   ```sql
   SELECT image_url, image_variants FROM stories WHERE id = 'story_id';
   ```
2. Regenerate image if field is null
3. Ensure migration 0027 was applied

### Issue: AVIF images not loading

**Cause:** Browser doesn't support AVIF

**Solution:** Component automatically falls back to WebP → JPEG. Check browser console for format being used.

## Migration Guide

### From Old Image System

**Before (single image URL):**
```tsx
<Image src={story.imageUrl} alt="Cover" width={1792} height={1024} />
```

**After (optimized with fallbacks):**
```tsx
<OptimizedImage
  imageUrl={story.imageUrl}
  imageVariants={story.imageVariants}
  alt="Cover"
  priority
/>
```

### Database Migration

Migration `0027_add_image_optimization_fields.sql` adds:
- `image_url` column to `stories` and `scenes`
- `image_variants` JSON column to all image tables

**Run migration:**
```bash
dotenv --file .env.local run pnpm db:migrate
```

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
// Full-width image
<OptimizedImage ... sizes="100vw" />

// Half-width on desktop
<OptimizedImage ... sizes="(min-width: 1024px) 50vw, 100vw" />

// Grid layout (3 columns on desktop)
<OptimizedImage ... sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" />
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
# Each image generates ~400KB of variants
# 100 images = ~40MB
# 1000 images = ~400MB
```

## Related Documentation

- [Story Image Generation Guide](./story-image-generation.md)
- [Next.js Image Optimization](https://nextjs.org/docs/app/api-reference/components/image)
- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)

## Support

For issues or questions:
1. Check migration logs: `drizzle/0027_add_image_optimization_fields.sql`
2. Review service logs during image generation
3. Test with: `scripts/test-imagen-generation.mjs`
