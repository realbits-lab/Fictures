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

**Variant Generation Strategy**:
- **Mobile 1x**: 50% of original dimensions (resize + format conversion)
- **Mobile 2x**: 100% of original dimensions (format conversion only)
- **Desktop**: Uses Mobile 2x variant (no separate desktop variants)

**Example (Qwen 16:9 - Primary Provider)**:

```
Original Image (1664×928 PNG)
     ├─ AVIF Mobile 1x: 832×464 (50% resize + convert)
     ├─ AVIF Mobile 2x: 1664×928 (convert only)
     ├─ JPEG Mobile 1x: 832×464 (50% resize + convert)
     └─ JPEG Mobile 2x: 1664×928 (convert only)

Desktop Strategy: Uses Mobile 2x (original size, no upscaling)
```

**Example (Gemini 16:9 - Fallback Provider)**:

```
Original Image (1024×576 PNG)
     ├─ AVIF Mobile 1x: 512×288 (50% resize + convert)
     ├─ AVIF Mobile 2x: 1024×576 (convert only)
     ├─ JPEG Mobile 1x: 512×288 (50% resize + convert)
     └─ JPEG Mobile 2x: 1024×576 (convert only)

Desktop Strategy: Uses Mobile 2x (original size, no upscaling)
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

**Mobile Viewport (320-640px)**:
- **Standard displays (1x)**: Load 1x variant (50% of original)
- **Retina displays (2x)**: Load 2x variant (original size, no resize)

**Desktop Viewport (1440-1920px)**:
- **All displays**: Load 2x variant (original size)
- **Why**: Original size provides optimal quality for both providers
- **Strategy**: No separate desktop variants needed

**Implementation Example (Qwen 16:9)**:
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
  │   └── {imageId}.png                  (Original generated image)
  ├── avif/
  │   ├── {width}x{height}/{imageId}.avif        (Mobile 1x - 50% of original)
  │   └── {width}x{height}/{imageId}.avif       (Mobile 2x / Desktop - original size)
  └── jpeg/
      ├── {width}x{height}/{imageId}.jpeg        (Mobile 1x - 50% of original)
      └── {width}x{height}/{imageId}.jpeg       (Mobile 2x / Desktop - original size)
```

**Path Examples**:

```
Story Cover (Qwen 16:9 - Primary):
develop/stories/abc123/story/original/img_xyz789.png
develop/stories/abc123/story/avif/832x464/img_xyz789.avif    (Mobile 1x)
develop/stories/abc123/story/avif/1664x928/img_xyz789.avif   (Mobile 2x/Desktop)
develop/stories/abc123/story/jpeg/832x464/img_xyz789.jpeg    (Mobile 1x)
develop/stories/abc123/story/jpeg/1664x928/img_xyz789.jpeg   (Mobile 2x/Desktop)

Story Cover (Gemini 16:9 - Fallback):
develop/stories/abc123/story/original/img_xyz789.png
develop/stories/abc123/story/avif/512x288/img_xyz789.avif    (Mobile 1x)
develop/stories/abc123/story/avif/1024x576/img_xyz789.avif   (Mobile 2x/Desktop)
develop/stories/abc123/story/jpeg/512x288/img_xyz789.jpeg    (Mobile 1x)
develop/stories/abc123/story/jpeg/1024x576/img_xyz789.jpeg   (Mobile 2x/Desktop)

Comic Panel (Qwen 9:16):
develop/stories/abc123/comics/scene_def456/panel/original/panel-1.png
develop/stories/abc123/comics/scene_def456/panel/avif/464x832/panel-1.avif     (Mobile 1x)
develop/stories/abc123/comics/scene_def456/panel/avif/928x1664/panel-1.avif    (Mobile 2x/Desktop)
develop/stories/abc123/comics/scene_def456/panel/jpeg/464x832/panel-1.jpeg     (Mobile 1x)
develop/stories/abc123/comics/scene_def456/panel/jpeg/928x1664/panel-1.jpeg    (Mobile 2x/Desktop)
```

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

**Original Image Size Examples**:
- **Qwen 16:9** (1664×928 PNG): ~450KB
- **Gemini 16:9** (1024×576 PNG): ~300KB

**Optimized Variants (Qwen 16:9 Primary)**:
- AVIF mobile 1x (832×464): **~15KB** (97% smaller)
- AVIF mobile 2x (1664×928): **~30KB** (93% smaller)
- JPEG mobile 1x (832×464): **~45KB** (90% smaller)
- JPEG mobile 2x (1664×928): **~80KB** (82% smaller)

**Total Storage Per Image**: ~170KB for all 4 variants (Qwen), ~115KB (Gemini)

**Loading Speed by Network (Qwen 16:9)**:

| Device | Original (450KB) | Optimized AVIF (15-30KB) | Improvement |
|--------|------------------|--------------------------|-------------|
| Mobile 3G | 7.5s | **0.5s** | **93% faster** |
| Mobile 4G | 3.8s | **0.3s** | **92% faster** |
| Desktop Wi-Fi | 1.2s | **0.1s** | **92% faster** |

### 6.3 Storage Impact

**Per Scene (10 comic panels) - Qwen Primary**:
- Original only: 10 × 450KB = 4.5MB
- With 4 variants: 10 × 170KB = 1.7MB (4 variants each)
- **Total per scene**: ~6.2MB (original + all variants)

**Per Story (50 scenes with comics) - Qwen**:
- Original only: 225MB
- With optimization: ~310MB
- **Incremental cost**: +85MB for optimization variants

**Per Story (50 scenes with comics) - Gemini**:
- Original only: 150MB
- With optimization: ~210MB
- **Incremental cost**: +60MB for optimization variants

**Vercel Blob Pricing** ($0.15/GB/month):
- 100 images (Qwen): ~18MB = **$0.003/month**
- 1,000 images (Qwen): ~180MB = **$0.027/month**
- 10,000 images (Qwen): ~1.8GB = **$0.27/month**

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

**Example Story (50 scenes with comics)**:
- Storage: ~210MB = **$0.032/month**
- Bandwidth (1,000 views): ~210GB = **$84/month**

**Optimization Benefits**:
- Without optimization: 500 panel images × 300KB = 150MB per view
- With optimization: 500 panels × 10-20KB AVIF = 5-10MB per view
- **Bandwidth savings**: 93-95% reduction

