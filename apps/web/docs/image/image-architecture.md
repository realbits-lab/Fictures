# Image Architecture

**Status:** ✅ PRODUCTION - Fully implemented

Fictures supports **two image generation providers** with automatic 4-variant optimization:
- **Google Gemini 2.5 Flash Image** (default) - Cloud API
- **Qwen-Image-Lightning** (optional) - Self-hosted AI Server

---

## System Overview

### Generation Pipeline

```
AI Prompt Creation
  ↓
Provider Selection (Gemini or AI Server)
  ├─ Gemini 2.5 Flash: Cloud API (~1024px max)
  └─ Qwen-Image-Lightning: AI Server (up to 1664px)
  ↓
Upload to Vercel Blob (PNG format)
  ↓
Automatic Optimization (4 variants)
  ├─ AVIF: 2 sizes (mobile 1x, mobile 2x)
  └─ JPEG: 2 sizes (mobile 1x, mobile 2x)
  ↓
Database Storage (imageUrl + imageVariants)
```

### Image Types & Aspect Ratios

**Dimensions vary by provider.** See configuration: `src/lib/ai/image-config.ts`

#### Gemini 2.5 Flash (Default Provider)

| Type | Aspect Ratio | Dimensions | Purpose |
|------|--------------|-----------|---------|
| **Story Cover** | 16:9 | 1024×576 | Widescreen story thumbnails |
| **Character Portrait** | 1:1 | 1024×1024 | Square character portraits |
| **Setting Visual** | 1:1 | 1024×1024 | Square environment images |
| **Scene Image** | 16:9 | 1024×576 | Widescreen scene visuals |
| **Comic Panel** | 9:16 or 2:3 | 576×1024 / 683×1024 | Vertical panel illustrations |

**Note:** Gemini dimensions are approximate (~1024px on longer side). Actual may vary slightly.

#### Qwen-Image-Lightning (AI Server - Optional)

| Type | Aspect Ratio | Dimensions | Purpose |
|------|--------------|-----------|---------|
| **Story Cover** | 16:9 | 1664×928 | High-res widescreen thumbnails |
| **Character Portrait** | 1:1 | 1328×1328 | High-res square portraits |
| **Setting Visual** | 1:1 | 1328×1328 | High-res environment images |
| **Scene Image** | 16:9 | 1664×928 | High-res widescreen scenes |
| **Comic Panel** | 9:16 or 2:3 | 928×1664 / 1024×1536 | High-res vertical panels |

**Note:** Qwen-Image uses official supported resolutions from model specifications.

## Core Implementation

### Configuration & Services

- **Configuration:** `src/lib/ai/image-config.ts` - Provider-specific dimensions
- **Providers:**
  - `src/lib/ai/providers/gemini-image.ts` - Gemini integration
  - `src/lib/ai/providers/ai-server-image.ts` - AI Server integration
- **Generation:** `src/lib/services/image-generation.ts` - Unified generation API
- **Optimization:** `src/lib/services/image-optimization.ts` - 4-variant optimization

### Usage Example

```typescript
import { generateStoryImage } from '@/lib/services/image-generation';

// Provider is selected automatically based on configuration
const result = await generateStoryImage({
  prompt: 'A mysterious forest at twilight, cinematic widescreen composition',
  storyId: 'story_123',
  imageType: 'scene',  // Auto-selects 16:9 aspect ratio
});

// result.width and result.height depend on active provider:
// - Gemini: 1024×576 (16:9)
// - AI Server: 1664×928 (16:9)
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

#### Gemini 2.5 Flash (Default)
- **Single image:** 5-15 seconds
- **Optimization:** 2-3 seconds (4 variants)
- **Total:** 7-18 seconds per image

#### Qwen-Image-Lightning (AI Server)
- **Single image:** 2-5 seconds (4-step inference)
- **Optimization:** 2-3 seconds (4 variants)
- **Total:** 4-8 seconds per image

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

### Provider Costs

#### Google Gemini 2.5 Flash Image (Default)
- **Current:** Free during preview period
- **Future:** Check [Google AI pricing](https://ai.google.dev/pricing)
- **Fallback:** Uses placeholders if API unavailable

#### Qwen-Image-Lightning (AI Server)
- **API Cost:** $0 (self-hosted)
- **Infrastructure:** GPU server required (RTX 4090 or similar, 8GB+ VRAM)
- **Electricity:** ~$0.50/day for 24/7 operation (varies by region)

### Vercel Blob Storage (Both Providers)
- **Storage:** $0.15 per GB/month
- **Bandwidth:** $0.40 per GB transferred
- **Per image impact:**
  - Gemini: ~1.5MB (1024×576 + 4 variants)
  - AI Server: ~3MB (1664×928 + 4 variants)

### Example Story Storage (16 images)

**Using Gemini:**
```
16 images × 1.5MB = 24MB = $0.004/month
```

**Using AI Server:**
```
16 images × 3MB = 48MB = $0.007/month
```

## Related Documentation

- **[image-generation.md](image-generation.md)** - API usage and quick start
- **[image-optimization.md](image-optimization.md)** - Optimization system details
- **[../../ai-server/CLAUDE.md](../../ai-server/CLAUDE.md)** - AI Server setup (Qwen-Image-Lightning)
- **[Configuration](../../web/src/lib/ai/image-config.ts)** - Provider dimension mappings
