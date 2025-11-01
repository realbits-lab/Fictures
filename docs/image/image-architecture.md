---
title: "Image Architecture"
---

# Image Architecture

**Status:** ✅ PRODUCTION - Fully implemented

Fictures uses **Google Gemini 2.5 Flash Image** for AI-generated story illustrations with automatic 4-variant optimization.

---

## System Overview

### Generation Pipeline

```
AI Prompt Creation
  ↓
Gemini 2.5 Flash Image (1344×768, 7:4, PNG)
  ↓
Upload to Vercel Blob
  ↓
Automatic Optimization (4 variants)
  ├─ AVIF: 2 sizes (672×384, 1344×768)
  └─ JPEG: 2 sizes (672×384, 1344×768)
  ↓
Database Storage (imageUrl + imageVariants)
```

### Image Types

| Type | Dimensions | Purpose |
|------|-----------|---------|
| **Story Cover** | 1344×768 (7:4) | Story thumbnails |
| **Scene Image** | 1344×768 (7:4) | Scene visuals |
| **Character Portrait** | 1344×768 (7:4) | Character profiles |
| **Setting Visual** | 1344×768 (7:4) | Environment images |
| **Comic Panel** | 1344×768 (7:4) | Panel illustrations |

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
  imageUrl: string;  // Original 1344×768 PNG
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
