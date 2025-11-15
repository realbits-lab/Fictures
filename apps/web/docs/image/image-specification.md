# Image System Specification

## Executive Summary

This document specifies the image generation and optimization system for Fictures, covering dual-provider support (Gemini + AI Server), automatic aspect ratio selection, and 4-variant mobile-first optimization.

**Core Principle**: Generate high-quality story illustrations with automatic optimization for mobile-first web delivery, supporting multiple AI providers with provider-specific configurations.

**Related Documents:**
- 📋 **Development Guide** (`image-development.md`): API specifications, provider integration, optimization pipeline
- 🧪 **Evaluation Guide** (`image-evaluation.md`): Quality metrics, performance benchmarks, testing strategies

---

## Part I: System Overview

### 1.1 Image Generation Architecture

```
┌────────────────────────────────────────────────────────────┐
│                 IMAGE GENERATION PIPELINE                   │
└────────────────────────────────────────────────────────────┘

User Request (prompt + image type)
         ↓
Determine Aspect Ratio (automatic by type)
         ↓
Select AI Provider (Gemini or AI Server)
         ↓
Generate Image (provider-specific dimensions)
   ├─ Gemini 2.5 Flash: ~1024px on longer side
   └─ AI Server (Qwen-Image): Up to 1664px
         ↓
Upload Original to Vercel Blob (PNG format)
         ↓
Automatic 4-Variant Optimization
   ├─ AVIF mobile 1x (50% of original)
   ├─ AVIF mobile 2x (original size, format conversion only)
   ├─ JPEG mobile 1x (50% of original)
   └─ JPEG mobile 2x (original size, format conversion only)
         ↓
Upload All Variants to Vercel Blob
         ↓
Return URLs + Metadata (database storage)
```

### 1.2 Dual Provider Support

**Primary Provider: Google Gemini 2.5 Flash Image**
- **Status**: Default (cloud API)
- **Aspect Ratios**: 1:1, 16:9, 9:16, 2:3
- **Max Dimension**: ~1024px (longer side)
- **Speed**: 5-15 seconds per image
- **Cost**: Free during preview period
- **Quality**: Standard to high

**Secondary Provider: AI Server (Qwen-Image-Lightning)**
- **Status**: Optional (self-hosted)
- **Aspect Ratios**: 1:1, 16:9, 9:16, 2:3, 4:3, 3:4
- **Max Dimension**: Up to 1664px
- **Speed**: 2-5 seconds (4-step inference)
- **Cost**: Self-hosted (GPU required)
- **Quality**: High (FP8 + Lightning v2.0)

**Provider Selection**: Automatic based on environment configuration (`TEXT_GENERATION_PROVIDER` setting)

---

## Part II: Image Types & Dimensions

### 2.1 Image Type System

| Image Type | Purpose | Aspect Ratio | Gemini Dimensions | Qwen Dimensions |
|------------|---------|--------------|-------------------|-----------------|
| **Story Cover** | Story thumbnails | 16:9 | 1024×576 | 1664×928 |
| **Character Portrait** | Character images | 1:1 | 1024×1024 | 1328×1328 |
| **Setting Visual** | Environment images | 1:1 | 1024×1024 | 1328×1328 |
| **Scene Image** | Scene illustrations | 16:9 | 1024×576 | 1664×928 |
| **Comic Panel** | Webtoon panels | 9:16 | 576×1024 | 928×1664 |

**Design Principle**: Aspect ratio automatically determined by image type. Original dimensions vary by provider, but variants are generated relative to original size (50% for 1x, 100% for 2x).

### 2.2 Aspect Ratio Mapping

**Auto-Selection Logic**:

```typescript
const IMAGE_TYPE_ASPECT_RATIOS: Record<StoryImageType, AspectRatio> = {
  'story': '16:9',        // Widescreen thumbnails
  'character': '1:1',     // Square portraits
  'setting': '1:1',       // Square environments
  'scene': '16:9',        // Widescreen illustrations
  'comic-panel': '9:16',  // Vertical panels (mobile-optimized)
};
```

**Supported Aspect Ratios**:

1. **16:9 (Widescreen)** - Story covers, scene images
   - Cinematic composition
   - Desktop-friendly while scaling well to mobile
   - Standard web content aspect ratio

2. **1:1 (Square)** - Characters, settings
   - Flexible crop for any viewport
   - Social media friendly
   - Consistent framing across devices

3. **9:16 (Portrait)** - Comic panels
   - Mobile-first vertical scroll
   - 82% screen coverage on iPhone (9:16 panel scaled to 390px width)
   - Native smartphone aspect ratio

### 2.3 Provider-Specific Dimensions

#### Gemini 2.5 Flash (Default)

**Configuration**: `src/lib/ai/image-config.ts`

```typescript
gemini: {
  '1:1': { width: 1024, height: 1024 },    // Square
  '16:9': { width: 1024, height: 576 },    // Widescreen
  '9:16': { width: 576, height: 1024 },    // Vertical
}
```

**Notes**:
- Dimensions are approximate (~1024px on longer side)
- Gemini API accepts aspect ratio strings, actual output may vary slightly
- Sufficient quality for web delivery after optimization

#### Qwen-Image-Lightning (AI Server)

**Configuration**: `src/lib/ai/image-config.ts`

```typescript
'ai-server': {
  '1:1': { width: 1328, height: 1328 },    // Square
  '16:9': { width: 1664, height: 928 },    // Widescreen
  '9:16': { width: 928, height: 1664 },    // Vertical (optimal for mobile)
}
```

**Notes**:
- Official supported resolutions from Qwen-Image model specifications
- Higher resolution than Gemini for premium quality
- Primary provider for production use
- Optimized during model training for best results

---

## Part III: Optimization System

### 3.1 4-Variant Mobile-First Strategy

**Philosophy**: Comics have many panels per scene. Generate fewer, higher-quality variants focused on mobile devices.

**Unified Variant Sizing Strategy**:
- **All providers use the same variant dimensions** (based on Qwen sizes)
- **Mobile 1x**: 50% of Qwen dimensions (resize + format conversion)
- **Mobile 2x**: 100% of Qwen dimensions (resize + format conversion)
- **Desktop**: Uses Mobile 2x variant (no separate desktop variants)
- **Backend processing**: Gemini images resized to match Qwen variant dimensions

**Why Unified Sizing?**
- ✅ **Client simplicity**: Browser handles consistent dimensions across all images
- ✅ **Layout consistency**: Same sizes = predictable CSS/layout calculations
- ✅ **Component simplicity**: No provider-specific size handling needed
- ✅ **Future-proof**: Migration to Qwen requires no client code changes
- ✅ **Backend flexibility**: Variant generation controlled server-side

**Unified Variant Dimensions by Aspect Ratio**:

| Aspect Ratio | Mobile 1x | Mobile 2x / Desktop |
|--------------|-----------|---------------------|
| **16:9** (Widescreen) | 832×464 | 1664×928 |
| **1:1** (Square) | 664×664 | 1328×1328 |
| **9:16** (Vertical) | 464×832 | 928×1664 |

**Example (16:9 Widescreen)**:

```
Qwen Original (1664×928 PNG):
     ├─ AVIF Mobile 1x: 832×464 (50% downscale + convert)
     ├─ AVIF Mobile 2x: 1664×928 (format convert only)
     ├─ JPEG Mobile 1x: 832×464 (50% downscale + convert)
     └─ JPEG Mobile 2x: 1664×928 (format convert only)

Gemini Original (1024×576 PNG):
     ├─ AVIF Mobile 1x: 832×464 (0.81x downscale + convert)
     ├─ AVIF Mobile 2x: 1664×928 (1.625x upscale + convert)
     ├─ JPEG Mobile 1x: 832×464 (0.81x downscale + convert)
     └─ JPEG Mobile 2x: 1664×928 (1.625x upscale + convert)

Desktop Strategy: Always uses Mobile 2x (1664×928)
```

**Why Only 4 Variants?**
- Comics have 8-12 panels per scene (40-48 variants per scene)
- Mobile-first: 95%+ of webtoon readers use mobile
- Desktop uses mobile 2x variant (original Gemini size)
- Reduces storage costs while maintaining quality

### 3.2 Format Selection

**Format Priority**:

1. **AVIF** (Primary)
   - 50% smaller than JPEG
   - 93.8% browser support (2025)
   - Best compression for photographic images

2. **JPEG** (Fallback)
   - 100% browser support
   - Universal compatibility
   - Baseline for older browsers

**Combined Coverage**: 100% (AVIF primary + JPEG fallback)

### 3.3 Responsive Loading

**Unified Sizing Across All Providers**:
- **Mobile 1x**: 832×464 (16:9), 664×664 (1:1), 464×832 (9:16)
- **Mobile 2x / Desktop**: 1664×928 (16:9), 1328×1328 (1:1), 928×1664 (9:16)

**Viewport Strategy**:
- **Mobile (320-640px)**: Load 1x variant on standard displays, 2x on retina
- **Desktop (1440-1920px)**: Load 2x variant on all displays
- **No provider-specific logic**: Client uses same sizes regardless of generation source

**Implementation Example (16:9 Widescreen)**:
```html
<picture>
  <source
    type="image/avif"
    srcset="
      /path/832x464.avif 832w,
      /path/1664x928.avif 1664w
    "
    sizes="100vw"
  />
  <source
    type="image/jpeg"
    srcset="
      /path/832x464.jpeg 832w,
      /path/1664x928.jpeg 1664w
    "
    sizes="100vw"
  />
  <img src="/path/1664x928.jpeg" alt="..." />
</picture>
```

**Note**: These dimensions are consistent whether the original was generated by Qwen or Gemini.

---

## Part IV: Database Schema

### 4.1 Image Fields (All Tables)

**Standard Schema**:

```typescript
{
  imageUrl: string | null;          // Original PNG URL
  imageVariants: {                  // Optimized variants metadata
    imageId: string;
    originalUrl: string;
    variants: ImageVariant[];       // 4 variants (AVIF + JPEG × 2 sizes)
    generatedAt: string;
  } | null;
}
```

**ImageVariant Structure**:

```typescript
interface ImageVariant {
  format: 'avif' | 'jpeg';
  device: 'mobile';                 // Mobile only (desktop uses mobile 2x)
  resolution: '1x' | '2x';
  width: number;
  height: number;
  url: string;
  size: number;                     // File size in bytes
}
```

### 4.2 Tables with Image Support

**Story Structure**:
- `stories` - Story cover images (16:9)
- `characters` - Character portraits (1:1)
- `settings` - Environment images (1:1)
- `scenes` - Scene illustrations (16:9)
- `comic_panels` - Comic panel images (9:16)

**All tables follow same schema pattern**:
```typescript
{
  id: text().primaryKey(),
  // ... entity-specific fields ...
  imageUrl: text(),
  imageVariants: json(),
  // ... timestamps ...
}
```

---

## Part V: Storage Architecture

### 5.1 Vercel Blob Structure

```
Environment Prefix: {environment}/
  ├─ main/           (production: NODE_ENV=production)
  └─ develop/        (development: NODE_ENV=development)

stories/{storyId}/{imageType}/
  ├── original/
  │   └── {imageId}.png                  (Original: Qwen or Gemini size)
  ├── avif/
  │   ├── {width}x{height}/{imageId}.avif        (Mobile 1x - unified size)
  │   └── {width}x{height}/{imageId}.avif       (Mobile 2x / Desktop - unified size)
  └── jpeg/
      ├── {width}x{height}/{imageId}.jpeg        (Mobile 1x - unified size)
      └── {width}x{height}/{imageId}.jpeg       (Mobile 2x / Desktop - unified size)

Unified Variant Dimensions:
  - 16:9: 832×464 (1x), 1664×928 (2x)
  - 1:1: 664×664 (1x), 1328×1328 (2x)
  - 9:16: 464×832 (1x), 928×1664 (2x)
```

**Path Examples (Unified Sizing)**:

```
Story Cover (16:9 - Any Provider):
develop/stories/abc123/story/original/img_xyz789.png          (Qwen: 1664×928 OR Gemini: 1024×576)
develop/stories/abc123/story/avif/832x464/img_xyz789.avif     (Mobile 1x - unified)
develop/stories/abc123/story/avif/1664x928/img_xyz789.avif    (Mobile 2x/Desktop - unified)
develop/stories/abc123/story/jpeg/832x464/img_xyz789.jpeg     (Mobile 1x - unified)
develop/stories/abc123/story/jpeg/1664x928/img_xyz789.jpeg    (Mobile 2x/Desktop - unified)

Character Portrait (1:1 - Any Provider):
develop/stories/abc123/character/original/char_abc456.png     (Qwen: 1328×1328 OR Gemini: 1024×1024)
develop/stories/abc123/character/avif/664x664/char_abc456.avif     (Mobile 1x - unified)
develop/stories/abc123/character/avif/1328x1328/char_abc456.avif   (Mobile 2x/Desktop - unified)
develop/stories/abc123/character/jpeg/664x664/char_abc456.jpeg     (Mobile 1x - unified)
develop/stories/abc123/character/jpeg/1328x1328/char_abc456.jpeg   (Mobile 2x/Desktop - unified)

Comic Panel (9:16 - Any Provider):
develop/stories/abc123/comics/scene_def456/panel/original/panel-1.png      (Qwen: 928×1664 OR Gemini: 576×1024)
develop/stories/abc123/comics/scene_def456/panel/avif/464x832/panel-1.avif     (Mobile 1x - unified)
develop/stories/abc123/comics/scene_def456/panel/avif/928x1664/panel-1.avif    (Mobile 2x/Desktop - unified)
develop/stories/abc123/comics/scene_def456/panel/jpeg/464x832/panel-1.jpeg     (Mobile 1x - unified)
develop/stories/abc123/comics/scene_def456/panel/jpeg/928x1664/panel-1.jpeg    (Mobile 2x/Desktop - unified)
```

**Key Point**: Variant paths are identical regardless of which provider generated the original image.

### 5.2 Environment-Aware Paths

**Utility**: `getBlobPath()`

**Behavior**:
- `NODE_ENV=production` → Prefix: `main/`
- `NODE_ENV=development` → Prefix: `develop/`

**Purpose**: Isolate development and production blob storage

---

## Part VI: Performance Specifications

### 6.1 Generation Performance

#### Gemini 2.5 Flash
- **Single image**: 5-15 seconds
- **Optimization**: +2-3 seconds (4 variants)
- **Total**: 7-18 seconds per image

#### AI Server (Qwen-Image-Lightning)
- **Single image**: 2-5 seconds (4-step inference)
- **Optimization**: +2-3 seconds (4 variants)
- **Total**: 4-8 seconds per image

**Comparison**:
- AI Server: **2-3× faster** than Gemini
- Trade-off: Requires GPU infrastructure vs cloud API

### 6.2 Loading Performance

**Unified Variant Sizes** (same for all providers):
- **16:9**: Mobile 1x (832×464), Mobile 2x (1664×928)
- **1:1**: Mobile 1x (664×664), Mobile 2x (1328×1328)
- **9:16**: Mobile 1x (464×832), Mobile 2x (928×1664)

**Optimized File Sizes (16:9 Example)**:
- AVIF mobile 1x (832×464): **~15KB**
- AVIF mobile 2x (1664×928): **~30KB**
- JPEG mobile 1x (832×464): **~45KB**
- JPEG mobile 2x (1664×928): **~80KB**

**Total Storage Per Image**: ~170KB for all 4 variants

**Loading Speed Comparison (16:9)**:

| Network Type | Original PNG | AVIF 1x (Mobile) | AVIF 2x (Desktop) | Improvement |
|--------------|--------------|------------------|-------------------|-------------|
| Mobile 3G (400 Kbps) | 7.5s | **0.3s** | **0.6s** | **92-95% faster** |
| Mobile 4G (2 Mbps) | 1.8s | **0.06s** | **0.12s** | **93-96% faster** |
| Desktop Wi-Fi (10 Mbps) | 0.4s | **0.01s** | **0.02s** | **95-97% faster** |

**Note**: Performance is consistent regardless of which provider (Qwen or Gemini) generated the original image.

### 6.3 Storage Impact

**Unified Variant Storage** (~170KB per image, regardless of provider):
- AVIF mobile 1x: ~15KB
- AVIF mobile 2x: ~30KB
- JPEG mobile 1x: ~45KB
- JPEG mobile 2x: ~80KB
- **Total per image**: ~170KB variants + original PNG

**Per Scene (10 comic panels)**:
- Variants only: 10 × 170KB = **1.7MB**
- Originals (Qwen): 10 × 450KB = 4.5MB
- Originals (Gemini): 10 × 300KB = 3MB
- **Total with Qwen**: ~6.2MB
- **Total with Gemini**: ~4.7MB

**Per Story (50 scenes, 500 panel images)**:
- Variants (unified): 500 × 170KB = **85MB**
- Originals (Qwen): 500 × 450KB = 225MB
- Originals (Gemini): 500 × 300KB = 150MB
- **Total with Qwen**: ~310MB
- **Total with Gemini**: ~235MB

**Vercel Blob Pricing** ($0.15/GB/month):
- 100 images: 17MB = **$0.003/month**
- 1,000 images: 170MB = **$0.026/month**
- 10,000 images: 1.7GB = **$0.26/month**

**Note**: Variant storage cost is identical regardless of provider, only original PNG storage differs.

---

## Part VII: Quality & Standards

### 7.1 Image Quality Settings

**AVIF Quality**: 75
- Maintains photographic quality
- Best compression-to-quality ratio
- Suitable for story illustrations

**JPEG Quality**: 85
- Baseline fallback quality
- Universal browser compatibility
- Acceptable file size

### 7.2 Aspect Ratio Precision

**Supported Ratios**: 1:1, 16:9, 9:16

**Gemini 2.5 Flash**:
- 1:1 → 1024×1024 = 1.000 (✓ exact)
- 16:9 → 1024×576 = 1.778 (✓ accurate, requested 1.777...)
- 9:16 → 576×1024 = 0.563 (✓ accurate, requested 0.5625)

**Qwen-Image-Lightning**:
- 1:1 → 1328×1328 = 1.000 (✓ exact)
- 16:9 → 1664×928 = 1.793 (✓ accurate, requested 1.777...)
- 9:16 → 928×1664 = 0.558 (✓ accurate, requested 0.5625)
- Uses official supported resolutions from model training
- Higher precision than Gemini

### 7.3 Supported Browsers

**AVIF Support** (93.8%):
- ✅ Chrome 85+
- ✅ Edge 85+
- ✅ Firefox 93+
- ✅ Safari 16+ (macOS 13+, iOS 16+)
- ❌ Safari 15 and below (falls back to JPEG)

**JPEG Support** (100%):
- ✅ All browsers

**Combined Coverage**: 100% (AVIF primary, JPEG fallback)

---

## Part VIII: Fallback & Error Handling

### 8.1 Placeholder System

**When Generation Fails**:
- API errors
- Rate limits
- Network issues
- Missing API keys

**Automatic Fallback**: Pre-defined environment-aware placeholders

**Placeholder Locations**:
```
{environment}/system/placeholders/
  ├── character-default.png
  ├── setting-visual.png
  ├── scene-illustration.png
  └── story-cover.png
```

**Example**:
- Development: `develop/system/placeholders/character-default.png`
- Production: `main/system/placeholders/character-default.png`

### 8.2 Graceful Degradation

**Optimization Failures**:
- Original image still uploaded and usable
- Missing variants handled gracefully
- `OptimizedImage` component falls back to `imageUrl`

**Provider Failures**:
- Gemini unavailable → Use placeholders
- AI Server unavailable → Fallback to Gemini (if configured)

---

## Part IX: Cost Analysis

### 9.1 Gemini 2.5 Flash Pricing

**Current**: Free during preview period
**Future**: Check [Google AI Pricing](https://ai.google.dev/pricing) when GA

**Estimated** (based on similar APIs):
- $0.002-$0.01 per image (typical range)
- 1,000 images ≈ $2-$10/month

### 9.2 AI Server (Qwen-Image) Costs

**Infrastructure**:
- GPU Server: RTX 4090 or similar (8GB+ VRAM)
- Electricity: ~$0.50/day for 24/7 operation
- Monthly: ~$15/month infrastructure

**API Cost**: $0 (self-hosted)

**Break-even Analysis**:
- If generating > 1,500 images/month → AI Server cheaper
- If generating < 1,500 images/month → Gemini cheaper

### 9.3 Vercel Blob Storage

**Pricing**:
- **Storage**: $0.15 per GB/month
- **Bandwidth**: $0.40 per GB transferred

**Storage Cost (Unified Variants)**:
- Per image: ~170KB (4 variants) + original PNG
- 100 images: 17MB = **$0.003/month**
- 1,000 images: 170MB = **$0.026/month**
- 10,000 images: 1.7GB = **$0.26/month**

**Bandwidth Cost Example (Story with 500 panels)**:
- **Without optimization**: 500 × 450KB (Qwen PNG) = 225MB per view
- **With unified AVIF variants**: 500 × 15-30KB = 7.5-15MB per view
- **Bandwidth savings**: 93-96% reduction

**1,000 Views Cost Comparison**:
- Without optimization: 225GB × $0.40 = **$90/month**
- With optimization: 15GB × $0.40 = **$6/month**
- **Savings**: $84/month (93% reduction)

