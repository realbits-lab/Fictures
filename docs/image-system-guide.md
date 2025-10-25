# Image System Guide - Overview

**Purpose:** Complete guide to AI-generated story illustrations with automatic optimization
**Status:** ✅ PRODUCTION - Fully implemented

---

## Quick Reference

Fictures uses **OpenAI DALL-E 3** for AI-generated story illustrations with automatic 18-variant optimization for optimal performance across all devices.

### Key Documents

1. **[image-generation-guide.md](image-generation-guide.md)** - Quick start and API usage
2. **[story-image-generation.md](story-image-generation.md)** - Complete implementation reference
3. **[image-optimization.md](image-optimization.md)** - Optimization system architecture
4. **[story-download-api.md](story-download-api.md)** - Export stories with images

---

## System Overview

### Generation Pipeline

```
User Request
  ↓
AI Prompt Creation (scene description + style)
  ↓
DALL-E 3 Generation (1792×1024, 16:9, PNG)
  ↓
Upload to Vercel Blob (original)
  ↓
Automatic Optimization (18 variants)
  ├─ AVIF: 640×360, 1280×720, 1024×576, 2048×1152, 1440×810, 2880×1620
  ├─ WebP: 640×360, 1280×720, 1024×576, 2048×1152, 1440×810, 2880×1620
  └─ JPEG: 640×360, 1280×720, 1024×576, 2048×1152, 1440×810, 2880×1620
  ↓
Database Storage (imageUrl + imageVariants)
```

### Image Types

| Type | Dimensions | Purpose |
|------|-----------|---------|
| **Story Cover** | 1792×1024 (16:9) | Story card thumbnails |
| **Scene Image** | 1792×1024 (16:9) | Scene visual narrative |
| **Character Portrait** | 1024×1024 (1:1) | Character profile images |
| **Setting Visual** | 1792×1024 (16:9) | Location/environment images |

---

## Implementation Guides

### For Image Generation

**→ See:** [image-generation-guide.md](image-generation-guide.md)

Quick start guide covering:
- API endpoint usage
- Prompt best practices
- Style options (vivid vs natural)
- Error handling
- Testing examples

**→ See:** [story-image-generation.md](story-image-generation.md)

Complete reference covering:
- Service architecture (`src/lib/services/image-generation.ts`)
- Database schema integration
- Quality settings (standard vs HD)
- Batch generation strategies
- Cost optimization

### For Image Optimization

**→ See:** [image-optimization.md](image-optimization.md)

Optimization system covering:
- 18-variant generation strategy
- Format selection (AVIF → WebP → JPEG fallback)
- Responsive sizing (mobile/tablet/desktop)
- Performance metrics (87% faster loading, 50% smaller files)
- Service implementation (`src/lib/services/image-optimization.ts`)

### For Story Export

**→ See:** [story-download-api.md](story-download-api.md)

Export functionality covering:
- Download complete stories with images
- Format options (JSON, Markdown, PDF)
- Image inclusion in exports
- API endpoint: `GET /api/stories/{id}/download`

---

## Quick Start Examples

### Generate a Scene Image

```typescript
import { generateStoryImage } from '@/lib/services/image-generation';

const result = await generateStoryImage({
  prompt: 'A mysterious forest at twilight, cinematic widescreen',
  storyId: 'story_123',
  imageType: 'scene',
  style: 'vivid',
  quality: 'standard',
});

// result.url: Original 1792×1024 URL
// result.optimizedSet: 18 variants for responsive display
```

### Use Optimized Images in Components

```typescript
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';

<ImageWithFallback
  imageVariants={scene.imageVariants}
  alt={scene.title}
  priority={false}
/>
```

### Test Image Generation

```bash
# Test DALL-E 3 generation
dotenv --file .env.local run node scripts/test-imagen-generation.mjs

# Test optimization pipeline
dotenv --file .env.local run pnpm test -- __tests__/image-optimization.test.ts
```

---

## Database Schema

### Image Storage Fields

Every entity with images includes:

```typescript
{
  imageUrl: string;  // Original 1792×1024 PNG from DALL-E 3
  imageVariants: {
    imageId: string;
    originalUrl: string;
    variants: ImageVariant[];  // 18 optimized variants
    generatedAt: string;
  } | null;
}
```

### ImageVariant Structure

```typescript
interface ImageVariant {
  url: string;        // Optimized image URL
  format: 'avif' | 'webp' | 'jpeg';
  width: number;      // 640, 1280, 1024, 2048, 1440, 2880
  height: number;     // Calculated from 16:9 aspect ratio
  size: number;       // File size in bytes
}
```

---

## API Endpoints

### Image Generation

**POST** `/api/images/generate`

Generate a new AI image with automatic optimization.

**Body:**
```json
{
  "prompt": "A mysterious forest at twilight",
  "storyId": "story_123",
  "imageType": "scene",
  "style": "vivid",
  "quality": "standard"
}
```

**Response:**
```json
{
  "url": "https://blob.vercel-storage.com/stories/story_123/scene_456.png",
  "optimizedSet": {
    "imageId": "img_789",
    "originalUrl": "https://...",
    "variants": [...],
    "generatedAt": "2025-10-25T12:00:00Z"
  }
}
```

### Story Download

**GET** `/api/stories/{storyId}/download?format=json`

Download complete story including all generated images.

---

## Performance Metrics

### Generation Time

- **Single image:** 2-4 seconds (DALL-E 3)
- **Optimization:** 3-5 seconds (18 variants)
- **Total:** 5-9 seconds per image

### Loading Performance

| Device | Format | Before | After | Improvement |
|--------|--------|--------|-------|-------------|
| Mobile | AVIF | 1.2MB | 150KB | **87% faster** |
| Tablet | WebP | 1.8MB | 280KB | **84% faster** |
| Desktop | JPEG | 2.1MB | 420KB | **80% faster** |

### Storage Efficiency

- **Original PNG:** 1-2MB
- **AVIF (best):** 100-200KB (90% smaller)
- **WebP (fallback):** 200-400KB (80% smaller)
- **JPEG (universal):** 300-600KB (70% smaller)

---

## Cost Optimization

### DALL-E 3 Pricing

- **Standard quality:** $0.040 per image (1792×1024)
- **HD quality:** $0.080 per image (1792×1024)
- **Recommendation:** Use standard for most images, HD for story covers

### Vercel Blob Storage

- **Storage:** $0.15 per GB/month
- **Bandwidth:** $0.40 per GB transferred
- **Optimization impact:** 18 variants = ~5MB total per image

### Cost per Story (Example)

Assuming 1 cover + 10 scenes + 3 characters + 2 settings:

```
Cover (HD):         1 × $0.080 = $0.080
Scenes (Standard): 10 × $0.040 = $0.400
Characters (Standard): 3 × $0.040 = $0.120
Settings (Standard): 2 × $0.040 = $0.080
─────────────────────────────────────
Total Generation: $0.680 per story

Storage (16 images × 5MB): 80MB = $0.012/month
```

---

## Troubleshooting

### Common Issues

**Issue:** Image generation fails with rate limit error
- **Solution:** Implement retry logic with exponential backoff
- **See:** [story-image-generation.md#error-handling](story-image-generation.md)

**Issue:** Optimized variants missing
- **Solution:** Check Vercel Blob upload permissions
- **See:** [image-optimization.md#debugging](image-optimization.md)

**Issue:** Images not loading on mobile
- **Solution:** Verify AVIF/WebP browser support fallback
- **See:** [image-optimization.md#browser-compatibility](image-optimization.md)

---

## Next Steps

### For New Developers

1. Read [image-generation-guide.md](image-generation-guide.md) for quick start
2. Review [image-optimization.md](image-optimization.md) for system understanding
3. Run test scripts to verify local setup

### For Advanced Usage

1. Study [story-image-generation.md](story-image-generation.md) for implementation details
2. Customize optimization pipeline in `src/lib/services/image-optimization.ts`
3. Implement batch generation for bulk story creation

### For Troubleshooting

1. Check logs: `logs/image-generation.log`
2. Review test results: `dotenv --file .env.local run pnpm test`
3. Verify Vercel Blob access: `scripts/test-blob-upload.mjs`

---

## Summary

Fictures' image system provides:
- ✅ AI-generated story illustrations (DALL-E 3)
- ✅ Automatic 18-variant optimization (AVIF/WebP/JPEG)
- ✅ Responsive image delivery (mobile/tablet/desktop)
- ✅ 87% faster loading, 50% smaller files
- ✅ Production-ready with comprehensive testing

For detailed information on specific aspects, refer to the linked documentation above.
