# Image Architecture

**Status:** ✅ PRODUCTION - Fully implemented

Fictures uses **OpenAI DALL-E 3** for AI-generated story illustrations with automatic 18-variant optimization.

---

## System Overview

### Generation Pipeline

```
AI Prompt Creation
  ↓
DALL-E 3 Generation (1792×1024, 16:9, PNG)
  ↓
Upload to Vercel Blob
  ↓
Automatic Optimization (18 variants)
  ├─ AVIF: 6 sizes (640×360 → 2880×1620)
  ├─ WebP: 6 sizes (640×360 → 2880×1620)
  └─ JPEG: 6 sizes (640×360 → 2880×1620)
  ↓
Database Storage (imageUrl + imageVariants)
```

### Image Types

| Type | Dimensions | Purpose |
|------|-----------|---------|
| **Story Cover** | 1792×1024 (16:9) | Story thumbnails |
| **Scene Image** | 1792×1024 (16:9) | Scene visuals |
| **Character Portrait** | 1024×1024 (1:1) | Character profiles |
| **Setting Visual** | 1792×1024 (16:9) | Environment images |

## Core Implementation

### Services

- **Generation:** `src/lib/services/image-generation.ts`
- **Optimization:** `src/lib/services/image-optimization.ts`

### Usage Example

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

## Database Schema

```typescript
{
  imageUrl: string;  // Original 1792×1024 PNG
  imageVariants: {
    imageId: string;
    originalUrl: string;
    variants: ImageVariant[];  // 18 optimized variants
    generatedAt: string;
  } | null;
}
```

## API Endpoint

**POST** `/api/images/generate`

## Performance Metrics

### Generation Time
- **Single image:** 2-4 seconds (DALL-E 3)
- **Optimization:** 3-5 seconds (18 variants)
- **Total:** 5-9 seconds per image

### Loading Performance
- **Mobile AVIF:** 87% faster (1.2MB → 150KB)
- **Tablet WebP:** 84% faster (1.8MB → 280KB)
- **Desktop JPEG:** 80% faster (2.1MB → 420KB)

## Cost Structure

### DALL-E 3 Pricing
- **Standard:** $0.040 per image (1792×1024)
- **HD:** $0.080 per image (1792×1024)

### Example Story Cost (16 images)
```
1 Cover (HD):        $0.080
10 Scenes:           $0.400
3 Characters:        $0.120
2 Settings:          $0.080
─────────────────────────
Total:               $0.680
```

## Related Documentation

- **[image-generation-guide.md](image-generation-guide.md)** - API usage and quick start
- **[image-optimization.md](image-optimization.md)** - Optimization system details
- **[story-image-generation.md](story-image-generation.md)** - Complete implementation reference
