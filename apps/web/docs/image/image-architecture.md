# Image Architecture

**Status:** ✅ PRODUCTION - Fully implemented

Fictures uses **Google Gemini 2.5 Flash Image** for AI-generated story illustrations with automatic 4-variant optimization.

---

## System Overview

### Generation Pipeline

```
AI Prompt Creation
  ↓
Gemini 2.5 Flash Image (PNG, aspect ratio varies by type)
  ↓
Upload to Vercel Blob
  ↓
Automatic Optimization (4 variants)
  ├─ AVIF: 2 sizes (mobile 1x, mobile 2x)
  └─ JPEG: 2 sizes (mobile 1x, mobile 2x)
  ↓
Database Storage (imageUrl + imageVariants)
```

### Image Types & Aspect Ratios

| Type | Aspect Ratio | Dimensions | Purpose |
|------|--------------|-----------|---------|
| **Story Cover** | 16:9 | 1792×1024 | Widescreen story thumbnails |
| **Character Portrait** | 1:1 | 1024×1024 | Square character portraits |
| **Setting Visual** | 1:1 | 1024×1024 | Square environment images |
| **Scene Image** | 16:9 | 1792×1024 | Widescreen scene visuals |
| **Comic Panel** | 9:16 or 2:3 | 1024×1792 / 1024×1536 | Vertical panel illustrations |

## Core Implementation

### Services

- **Generation:** `src/lib/services/image-generation.ts`
- **Optimization:** `src/lib/services/image-optimization.ts`

### Usage Example

```typescript
import { generateStoryImage } from '@/lib/services/image-generation';

const result = await generateStoryImage({
  prompt: 'A mysterious forest at twilight, cinematic composition',
  storyId: 'story_123',
  imageType: 'scene',
});
```

## Database Schema

```typescript
{
  imageUrl: string;  // Original PNG (dimensions vary by type)
  imageVariants: {
    imageId: string;
    originalUrl: string;
    variants: ImageVariant[];  // 4 optimized variants
    generatedAt: string;
  } | null;
}
```

## API Endpoint

**POST** `/api/images/generate`

## Performance Metrics

### Generation Time
- **Single image:** 2-4 seconds (Gemini 2.5 Flash)
- **Optimization:** 2-3 seconds (4 variants)
- **Total:** 4-7 seconds per image

### Loading Performance
- **Mobile 1x AVIF:** 87% faster (original → 150KB)
- **Mobile 2x AVIF:** No resize, format conversion only
- **JPEG fallback:** Universal browser support

### Optimization Strategy
- **4 variants total:** 2 formats × 2 sizes
- **AVIF primary:** 93.8% browser support, best compression
- **JPEG fallback:** 100% universal support
- **No WebP:** AVIF + JPEG covers all users efficiently

## Cost Structure

### Google Gemini 2.5 Flash Image
- **Free tier available** - Check Google AI pricing
- **Fallback system:** Uses placeholders if API unavailable

### Vercel Blob Storage
- **Storage:** $0.15 per GB/month
- **Bandwidth:** $0.40 per GB transferred
- **Optimization impact:** 4 variants = ~2MB total per image

### Example Story Storage (16 images)
```
16 images × 2MB = 32MB = $0.005/month
```

## Related Documentation

- **[image-generation.md](image-generation.md)** - API usage and quick start
- **[image-optimization.md](image-optimization.md)** - Optimization system details
