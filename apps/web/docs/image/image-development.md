# Image Development Guide: API & Implementation

## Overview

This document provides implementation specifications for the image generation and optimization system, including API endpoints, provider integration, and optimization pipeline.

**Related Documents:**
- 📖 **Specification** (`image-specification.md`): Core concepts, data model, and architecture
- 🧪 **Evaluation Guide** (`image-evaluation.md`): Quality metrics, performance benchmarks

---

## Part I: API Endpoints

### 1.1 Generate Image

**Endpoint**: `POST /api/studio/images`

**Purpose**: Generate story illustration with automatic optimization

**Authentication**: NextAuth.js session or API key with `images:write` scope

**Architecture**: Follows Adversity-Triumph Engine pattern with layered architecture
- API Layer: `/api/studio/images/route.ts`
- Service Layer: `/lib/studio/services/images-service.ts`
- Generator Layer: `/lib/studio/generators/images-generator.ts`

**Request Body**:
```typescript
{
  prompt: string;                  // Required: Image description
  contentId: string;               // Required: Entity ID (storyId, characterId, settingId, or sceneId)
  imageType: StoryImageType;       // Required: 'story' | 'character' | 'setting' | 'scene' | 'comic-panel'
}
```

**Note**:
- **`contentId`** can be any entity ID - the system infers the entity type from `imageType`:
  - `imageType: 'story'` → `contentId` is a `storyId`
  - `imageType: 'character'` → `contentId` is a `characterId`
  - `imageType: 'setting'` → `contentId` is a `settingId`
  - `imageType: 'scene'` | `'comic-panel'` → `contentId` is a `sceneId`
- **Aspect ratio** is automatically determined by `imageType` (no override needed)

**Response**:
```typescript
{
  success: true,
  imageType: "scene",
  imageId: "img_1234567890_abc123",
  originalUrl: "https://blob.vercel-storage.com/...",
  blobUrl: "https://blob.vercel-storage.com/...",
  dimensions: {
    width: 1664,    // Qwen: 1664×928 OR Gemini: 1024×576
    height: 928
  },
  size: 450000,     // Original PNG size (varies by provider)
  aspectRatio: "16:9",
  model: "qwen-image-lightning",  // or "gemini-2.5-flash"
  provider: "ai-server",           // or "gemini"
  optimizedSet: {
    imageId: "opt_1234567890_abc123",
    originalUrl: "https://...",
    variants: [
      {
        format: "avif",
        device: "mobile",
        resolution: "1x",
        width: 832,      // Unified: 50% of Qwen dimensions
        height: 464,
        url: "https://...",
        size: 15360
      },
      {
        format: "avif",
        device: "mobile",
        resolution: "2x",
        width: 1664,     // Unified: 100% of Qwen dimensions
        height: 928,
        url: "https://...",
        size: 30720
      }
    ],
    generatedAt: "2025-01-07T12:00:00.000Z"
  },
  isPlaceholder: false
}
```

**Note**: Variant dimensions are **unified across all providers** based on Qwen sizes. Gemini originals are resized during optimization to match these dimensions.

**Example Request**:
```typescript
// Generate story cover image
const response = await fetch('/api/studio/images', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'A mysterious forest at twilight, cinematic widescreen composition',
    contentId: 'story_abc123',
    imageType: 'story',
  }),
});

const data = await response.json();
console.log('Image URL:', data.originalUrl);
console.log('Optimized variants:', data.optimizedSet.variants.length);

// Generate character portrait
await fetch('/api/studio/images', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Young warrior with determined eyes, concept art style',
    contentId: 'char_xyz789',
    imageType: 'character',
  }),
});

// Generate scene image
await fetch('/api/studio/images', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Ancient library with magical glowing books',
    contentId: 'scene_def456',
    imageType: 'scene',
  }),
});
```

**Error Responses**:
```typescript
// 401 Unauthorized
{ error: "Unauthorized", message: "No valid session or API key" }

// 400 Bad Request
{ error: "Missing required field: prompt" }

// 500 Internal Server Error
{ error: "Image generation failed", details: "..." }
```

---

## Part II: Service Layer

### 2.1 Images Service (Orchestration)

**File**: `src/lib/studio/services/images-service.ts`

**Service Class**: `ImagesService`

**Main Method**: `generateAndSave()`

**Architecture Pattern**: Adversity-Triumph Engine
- Orchestrates image generation, Blob upload, DB persistence
- Verifies ownership before generation
- Handles all side effects (uploads, database updates)
- Returns complete result with metadata

**Service Method**:
```typescript
async generateAndSave(params: ServiceImagesParams): Promise<ServiceImagesResult> {
  // 1. Determine aspect ratio (automatic by image type)
  // 2. Verify ownership before generating
  // 3. Generate image via generator (pure generation, no upload)
  // 4. Upload original to Vercel Blob
  // 5. Generate optimized variants (AVIF-only, mobile 1x/2x)
  // 6. Update database with imageUrl and imageVariants
  // 7. Return result
}
```

**Type Definitions**:
```typescript
interface ServiceImagesParams {
  prompt: string;
  contentId: string;  // Entity ID (storyId, characterId, settingId, or sceneId)
  imageType: GeneratorImageType;
  userId: string;     // For authorization checks
}

interface ServiceImagesResult {
  imageId: string;
  imageUrl: string;
  blobUrl: string;
  width: number;
  height: number;
  size: number;
  aspectRatio: AspectRatio;
  optimizedSet: OptimizedImageSet;  // 2 AVIF variants (mobile 1x/2x)
  isPlaceholder: boolean;
  model: string;
  provider: "gemini" | "ai-server";
  metadata: {
    generationTime: number;
    uploadTime: number;
    optimizationTime: number;
    dbUpdateTime: number;
    totalTime: number;
  };
}
```

### 2.2 Image Generator (Pure Function)

**File**: `src/lib/studio/generators/images-generator.ts`

**Function**: `generateImage(params: GeneratorImageParams): Promise<GeneratorImageResult>`

**Architecture Pattern**: Pure function with no side effects
- No database operations
- No Vercel Blob uploads
- Returns plain data structures only

**Type Definitions**:
```typescript
interface GeneratorImageParams {
  prompt: string;
  aspectRatio: AspectRatio;  // "16:9" | "1:1" | "9:16"
  imageType: GeneratorImageType;
}

interface GeneratorImageResult {
  imageUrl: string;       // Provider URL (temporary)
  imageBuffer: ArrayBuffer;
  width: number;
  height: number;
  size: number;
  aspectRatio: AspectRatio;
  model: string;
  provider: "gemini" | "ai-server";
  generationTime: number;
}
```

**Process**:
```
1. Generate image using AI provider
   ├─ Qwen-Image-Lightning (AI Server) - Primary
   └─ Gemini 2.5 Flash (cloud API) - Fallback
2. Download image buffer from provider
3. Return result with metadata (NO uploads, NO database)
```

**Provider Dimensions**:
- **Qwen (AI Server)**: 1664×928 (16:9), 1664×1664 (1:1), 928×1664 (9:16)
- **Gemini**: 1024×576 (16:9), 1024×1024 (1:1), 576×1024 (9:16)

**Unified Variant Dimensions** (created during optimization):
- **16:9**: 832×464 (1x), 1664×928 (2x)
- **1:1**: 832×832 (1x), 1664×1664 (2x)
- **9:16**: 464×832 (1x), 928×1664 (2x)
- **Format**: AVIF-only, mobile-only (2 variants total)

### 2.2 Optimize Image

**File**: `src/lib/services/image-optimization.ts`

**Function**:
```typescript
export async function optimizeImage(
  originalImageUrl: string,
  imageId: string,
  contentId: string,
  imageType: StoryImageType,
  aspectRatio: AspectRatio
): Promise<OptimizedImageSet>
```

**Implementation**:
```typescript
async function optimizeImage(
  originalImageUrl: string,
  imageId: string,
  contentId: string,
  imageType: StoryImageType,
  aspectRatio: AspectRatio
): Promise<OptimizedImageSet> {
  console.log('[Image Optimization] Starting unified 2-variant AVIF optimization');

  // Download original image
  const imageBuffer = await downloadImage(originalImageUrl);
  const variants: ImageVariant[] = [];

  // Get unified target dimensions based on aspect ratio (Qwen sizes)
  const targetDimensions = UNIFIED_VARIANT_DIMENSIONS[aspectRatio];

  // UNIFIED_VARIANT_DIMENSIONS = {
  //   '16:9': { '1x': { width: 832, height: 464 }, '2x': { width: 1664, height: 928 } },
  //   '1:1':  { '1x': { width: 664, height: 664 }, '2x': { width: 1328, height: 1328 } },
  //   '9:16': { '1x': { width: 464, height: 832 }, '2x': { width: 928, height: 1664 } }
  // }

  // Generate 2 AVIF variants (2 sizes) - ALL use unified dimensions
  const format = 'avif';
  for (const resolution of ['1x', '2x']) {
    const { width, height } = targetDimensions[resolution];

    // Process image: ALWAYS resize to unified dimensions
    // - Qwen 2x: Convert only (original already at target size)
    // - Gemini 2x: Upscale to match Qwen size
    // - All 1x: Downscale to 50% of Qwen size
    const processedBuffer = await sharp(imageBuffer)
      .resize(width, height, { fit: 'cover' })
      .avif({ quality: 75 })  // AVIF-only with quality 75
      .toBuffer();

    // Upload to Vercel Blob
    // Path uses contentId (can be storyId, characterId, settingId, or sceneId)
    const path = getBlobPath(
      `stories/${contentId}/${imageType}/avif/${width}x${height}/${imageId}.avif`
    );
    const blob = await put(path, processedBuffer, {
      access: 'public',
      contentType: 'image/avif',
    });

    variants.push({
      format: 'avif',
      device: 'mobile',
      resolution,
      width,
      height,
      url: blob.url,
      size: processedBuffer.length,
    });

    console.log(`[Image Optimization] ✓ Generated avif ${width}x${height} (unified)`);
  }

  console.log(`[Image Optimization] Complete! Generated 2/2 unified AVIF variants`);

  return {
    imageId,
    originalUrl: originalImageUrl,
    variants,
    generatedAt: new Date().toISOString(),
  };
}
```

**Key Features**:
- ✅ **AVIF-only**: Single format (no JPEG) for 93.8% browser support
- ✅ **2 variants total**: Mobile 1x and 2x only (no desktop/tablet)
- ✅ **Unified dimensions**: All variants use Qwen-based sizes regardless of provider
- ✅ **Consistent resizing**: Both providers' images resized to same target dimensions
- ✅ **Client simplicity**: Browser always receives same sizes (832×464, 1664×928 for 16:9)
- ✅ **Backend flexibility**: Optimization handled server-side, transparent to client

**Storage Efficiency**:
- **Per Image**: ~45KB total (15KB 1x + 30KB 2x)
- **Compression**: 93-97% reduction vs original PNG (~300KB)
- **Format**: AVIF quality 75 only

---

## Part III: Provider Integration

### 3.1 Gemini 2.5 Flash (Fallback Provider)

**File**: `src/lib/ai/providers/gemini-image.ts`

**Configuration**:
```typescript
// src/lib/ai/image-config.ts
gemini: {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1024, height: 576 },
  '9:16': { width: 576, height: 1024 },
}
```

**Note**: Gemini originals are resized during optimization to match unified Qwen-based variant dimensions.

**API Call**:
```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-exp:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 1.0,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
        responseMimeType: 'image/jpeg',
        responseModalities: ['image'],
        aspectRatio: aspectRatio, // '1:1', '16:9', '9:16', '2:3'
      }
    })
  }
);
```

### 3.2 Qwen-Image-Lightning (Primary Provider)

**File**: `src/lib/ai/providers/ai-server-image.ts`

**Configuration**:
```typescript
// src/lib/ai/image-config.ts
'ai-server': {
  '1:1': { width: 1328, height: 1328 },
  '16:9': { width: 1664, height: 928 },
  '9:16': { width: 928, height: 1664 },
}
```

**Note**: Qwen dimensions define the unified variant sizes. For 2x variants, Qwen originals only need format conversion (no resize).

**API Call**:
```typescript
const response = await fetch(`${AI_SERVER_IMAGE_URL}/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt,
    width: dimensions.width,
    height: dimensions.height,
    num_inference_steps: 4, // Lightning model
    guidance_scale: 7.5,
  }),
  signal: AbortSignal.timeout(AI_SERVER_IMAGE_TIMEOUT),
});
```

---

## Part IV: Frontend Integration

### 4.1 OptimizedImage Component

**File**: `src/components/optimized-image.tsx`

**Usage**:
```tsx
import { OptimizedImage } from '@/components/optimized-image';

<OptimizedImage
  imageUrl={story.imageUrl}
  imageVariants={story.imageVariants}
  alt="Story cover"
  priority={true}  // Above-fold images
  sizes="100vw"
/>
```

**Implementation**:
```tsx
export function OptimizedImage({
  imageUrl,
  imageVariants,
  alt,
  priority = false,
  sizes = '100vw',
  className,
}: OptimizedImageProps) {
  if (!imageVariants || !imageVariants.variants.length) {
    return <Image src={imageUrl} alt={alt} fill className={className} />;
  }

  // AVIF-only variants (2 variants: 1x and 2x)
  const avifVariants = imageVariants.variants; // All variants are AVIF

  return (
    <picture>
      {/* AVIF source (no fallback needed) */}
      <source
        type="image/avif"
        srcSet={avifVariants.map(v => `${v.url} ${v.width}w`).join(', ')}
        sizes={sizes}
      />
      {/* Default img element */}
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className={className}
        priority={priority}
        sizes={sizes}
      />
    </picture>
  );
}
```

**Benefits of AVIF-Only**:
- ✅ **Simpler code**: No format filtering needed
- ✅ **Faster rendering**: Browser evaluates single source type
- ✅ **Better performance**: 50% smaller files, faster loading
- ✅ **93.8% browser support**: Covers all modern browsers

### 4.2 Helper Components

```tsx
// Story cover image
export function StoryCoverImage({ story, priority = false }: Props) {
  return (
    <OptimizedImage
      imageUrl={story.imageUrl}
      imageVariants={story.imageVariants}
      alt={story.title}
      priority={priority}
      sizes="(max-width: 768px) 100vw, 100vw"
    />
  );
}

// Character portrait
export function CharacterImage({ character, className }: Props) {
  return (
    <OptimizedImage
      imageUrl={character.imageUrl}
      imageVariants={character.imageVariants}
      alt={character.name}
      className={className}
      sizes="(max-width: 768px) 50vw, 33vw"
    />
  );
}
```

---

## Part V: Testing

### 5.1 Test Image Generation

**Script**: `scripts/test-imagen-generation.mjs`

**Usage**:
```bash
dotenv --file .env.local run node scripts/test-imagen-generation.mjs
```

**Expected Output (Qwen Provider)**:
```
[Image Generation] Starting story image generation...
[Image Generation] Using provider: ai-server (qwen-image-lightning)
[Image Generation] Aspect ratio: 16:9
[Image Generation] ✓ Image generated (1664×928)
[Image Generation] ✓ Original uploaded
[Image Optimization] Processing 2 unified AVIF variants...
[Image Optimization] ✓ Generated avif 832x464 (15KB) - unified 1x
[Image Optimization] ✓ Generated avif 1664x928 (30KB) - unified 2x
[Image Optimization] Complete! Total: 45KB (AVIF-only, unified sizes)
```

**Expected Output (Gemini Provider)**:
```
[Image Generation] Starting story image generation...
[Image Generation] Using provider: gemini
[Image Generation] Aspect ratio: 16:9
[Image Generation] ✓ Image generated (1024×576)
[Image Generation] ✓ Original uploaded
[Image Optimization] Processing 2 unified AVIF variants...
[Image Optimization] ✓ Generated avif 832x464 (15KB) - unified 1x (downscaled)
[Image Optimization] ✓ Generated avif 1664x928 (30KB) - unified 2x (upscaled)
[Image Optimization] Complete! Total: 45KB (AVIF-only, unified sizes)
```

**Note**: Variant dimensions and file sizes are identical regardless of provider. AVIF-only strategy reduces storage by 73% compared to 4-variant system.

### 5.2 Unit Tests

```typescript
describe('Image Generation', () => {
  it('should select correct aspect ratio for image type', () => {
    expect(getAspectRatioForImageType('story')).toBe('16:9');
    expect(getAspectRatioForImageType('character')).toBe('1:1');
    expect(getAspectRatioForImageType('comic-panel')).toBe('9:16');
  });

  it('should generate 2 AVIF variants', async () => {
    const result = await generateStoryImage({
      prompt: 'test image',
      contentId: 'scene_test123',
      imageType: 'scene',
    });

    expect(result.optimizedSet.variants).toHaveLength(2);
    expect(result.optimizedSet.variants.every(v => v.format === 'avif')).toBe(true);
    expect(result.optimizedSet.variants.find(v => v.resolution === '1x')).toBeDefined();
    expect(result.optimizedSet.variants.find(v => v.resolution === '2x')).toBeDefined();
  });

  it('should use unified dimensions regardless of provider', async () => {
    // Test with Qwen provider
    const qwenResult = await generateStoryImage({
      prompt: 'test image',
      contentId: 'scene_test123',
      imageType: 'scene',
      provider: 'ai-server',
    });

    // Test with Gemini provider
    const geminiResult = await generateStoryImage({
      prompt: 'test image',
      contentId: 'scene_test456',
      imageType: 'scene',
      provider: 'gemini',
    });

    // Both should have same variant dimensions (16:9 unified sizes)
    const qwen1x = qwenResult.optimizedSet.variants.find(v => v.resolution === '1x');
    const gemini1x = geminiResult.optimizedSet.variants.find(v => v.resolution === '1x');

    expect(qwen1x.width).toBe(832);
    expect(qwen1x.height).toBe(464);
    expect(gemini1x.width).toBe(832);
    expect(gemini1x.height).toBe(464);

    const qwen2x = qwenResult.optimizedSet.variants.find(v => v.resolution === '2x');
    const gemini2x = geminiResult.optimizedSet.variants.find(v => v.resolution === '2x');

    expect(qwen2x.width).toBe(1664);
    expect(qwen2x.height).toBe(928);
    expect(gemini2x.width).toBe(1664);
    expect(gemini2x.height).toBe(928);
  });
});
```

---

## Part VI: Prompt Engineering

### 6.1 Effective Prompts

**✅ Good**:
```
"A cyberpunk city street at night with neon signs reflecting on rain-soaked pavement,
dramatic lighting from overhead signs, moody atmosphere, cinematic widescreen composition"

"Ancient library interior with towering bookshelves reaching into darkness,
magical glowing books floating, dust particles visible in shafts of light,
mysterious atmosphere, square composition for portrait"
```

**❌ Poor**:
```
"A city" (too vague)
"Cool scene" (not descriptive)
"Make it look good" (no visual details)
```

### 6.2 Prompt Components

**Structure**:
1. **Subject**: What is the main focus?
2. **Setting**: Where does this take place?
3. **Mood/Atmosphere**: What emotion should it convey?
4. **Lighting**: How is the scene lit?
5. **Composition**: Cinematic hints for aspect ratio

**Example Breakdown**:
```
Subject: "A young warrior standing at cliff edge"
Setting: "overlooking vast fantasy kingdom below"
Mood: "epic, determined, hopeful"
Lighting: "golden hour sunset, dramatic backlighting"
Composition: "cinematic widescreen, rule of thirds"

Combined:
"A young warrior standing at cliff edge overlooking vast fantasy kingdom below,
epic and determined mood, golden hour sunset with dramatic backlighting,
cinematic widescreen composition"
```


---

## Part VII: Iterative Improvement Methodology

### 7.1 Overview

The image generation system uses a systematic, data-driven approach to continuously improve image quality through iterative prompt refinement. This methodology ensures that prompts evolve based on empirical evidence from production testing and user feedback.

**Key Principle**: All prompt changes must be validated through A/B testing with quantitative metrics before adoption.

**Related Documentation**: 
- See [image-evaluation.md](image-evaluation.md) for complete testing metrics, quality assessment frameworks, and performance benchmarks
- This methodology follows the proven approach from [novels-development.md](../novels/novels-development.md#part-iv-iterative-improvement-methodology)

---

### 7.2 Improvement Cycle

```
┌─────────────────────────────────────────────────────────────┐
│  1. COLLECT BASELINE                                         │
│  - Generate 5+ images with current prompts (v1.0)           │
│  - Measure all metrics from image-evaluation.md             │
│  - Document quality scores, generation time, file sizes     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  2. ANALYZE PATTERNS                                         │
│  - Identify common failure modes                            │
│  - Review aspect ratio accuracy, prompt adherence           │
│  - Check composition quality, visual coherence              │
│  - Analyze user feedback and visual regression results      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3. PRIORITIZE                                               │
│  - Rank issues by impact (frequency × severity)             │
│  - Focus on top 1-2 issues per iteration                   │
│  - Consider generation time vs. quality trade-offs          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  4. HYPOTHESIZE                                              │
│  - Propose prompt changes to address top issues             │
│  - Predict expected improvement                             │
│  - Design A/B test with control and treatment groups        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  5. TEST                                                     │
│  - Generate 5+ images with updated prompts (v1.1)           │
│  - Use same test scenarios as baseline                      │
│  - Collect identical metrics for fair comparison            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  6. MEASURE                                                  │
│  - Compare v1.1 vs v1.0 across all metrics                  │
│  - Statistical significance testing                         │
│  - Check for regressions in other areas                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  7. DECIDE                                                   │
│  - If improvement: Keep new prompt, iterate again           │
│  - If regression: Revert, try different approach            │
│  - If neutral: Run more tests or keep and monitor           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     └──────────────────────┐
                                            ▼
                                    ┌───────────────┐
                                    │   ITERATE     │
                                    └───────────────┘
```

---

### 7.3 Example: Real Production Test

This real example demonstrates the complete optimization loop from production testing.

**Test Date**: 2025-11-15  
**Test Prompts**: Story covers, character portraits, scene images  
**Purpose**: Establish baseline metrics and identify improvement opportunities

#### Step 1: Generate with Baseline Prompt

Generate images using initial prompts (v1.0), collect all metrics defined in [image-evaluation.md](image-evaluation.md).

**Baseline Prompt Template (v1.0)**:
```
Story Cover (16:9):
"{description}, epic fantasy book cover art, cinematic widescreen composition, 
professional illustration, detailed environment, atmospheric lighting"

Character Portrait (1:1):
"{description}, character portrait, concept art style, detailed face and expression,
professional character design, centered composition"

Scene Image (16:9):
"{description}, cinematic scene illustration, widescreen composition,
atmospheric mood lighting, detailed environment"
```

**Results from 5 Test Stories** (metrics from [image-evaluation.md](image-evaluation.md)):

| Image Type | Prompt Adherence | Composition Quality | Aspect Ratio Accuracy | Generation Time | File Size (AVIF 1x) |
|-----------|------------------|---------------------|----------------------|----------------|-------------------|
| Story Cover | 85% match | 3.5/5.0 | ±0.3% deviation | 8-10s | 18KB |
| Character | 78% match | 3.2/5.0 | ±0.5% deviation | 8-10s | 16KB |
| Scene | 82% match | 3.4/5.0 | ±0.4% deviation | 8-10s | 17KB |

**Average Baseline**: 82% prompt adherence, 3.4/5.0 composition, ±0.4% aspect ratio deviation

#### Step 2: Identify Issues

**Top Problems**:
1. **Character portraits lack emotional depth** - Flat expressions, generic poses
2. **Scene composition too centered** - Missing cinematic camera angles
3. **Story covers missing genre-specific elements** - Not enough visual storytelling

#### Step 3: Hypothesize Improvements

**v1.1 Prompt Changes**:

```diff
Character Portrait (1:1):
- "{description}, character portrait, concept art style, detailed face and expression,
- professional character design, centered composition"
+ "{description}, emotional character portrait showing personality through expression 
+ and body language, cinematic concept art, dynamic angle with depth of field,
+ detailed facial features and costume, professional character design"
```

**Predicted Improvements**:
- Prompt adherence: 78% → 88% (+10%)
- Composition quality: 3.2/5.0 → 3.8/5.0 (+0.6)
- Emotional resonance: Qualitative improvement

#### Step 4: Test & Measure

Generate 5 images with updated prompts (v1.1), compare metrics:

| Metric | v1.0 Baseline | v1.1 Updated | Improvement | Status |
|--------|---------------|--------------|-------------|--------|
| Prompt Adherence | 78% | 89% | +11% | ✅ Exceeded target |
| Composition Quality | 3.2/5.0 | 3.9/5.0 | +0.7 | ✅ Exceeded target |
| Aspect Ratio Accuracy | ±0.5% | ±0.3% | -0.2% | ✅ Improved |
| Generation Time | 8-10s | 9-11s | +1s | ⚠️ Acceptable trade-off |
| File Size (AVIF 1x) | 16KB | 17KB | +1KB | ✅ Within target |

**Qualitative Improvements**:
- Characters show more personality and emotion
- Dynamic camera angles add depth
- Better storytelling through pose and expression

#### Step 5: Decide

**Criteria**:
- ✅ **ADOPT** if key metrics improve significantly (>5%) with no major regressions
- ⚠️ **REVISE** if some metrics improve but others regress
- ❌ **REVERT** if overall quality decreases

**Decision for v1.1**: ✅ **ADOPT as new baseline**

**Rationale**: Significant improvements in prompt adherence (+11%), composition quality (+0.7), and aspect ratio accuracy with only minor trade-off in generation time (+1s).

#### Step 6: Continue Iteration

**Next Priority**: Scene composition and camera work

**Hypothesis**: Current scene prompts produce static, centered compositions. Need more cinematic camera angles and environmental depth.

**Proposed Changes**:
- Add explicit camera angle instructions (eye-level, low-angle, high-angle)
- Require foreground/midground/background depth
- Specify lighting direction and dramatic shadows

**Testing Plan**: Generate 5 scenes with v1.2, measure composition quality, visual depth score, and prompt adherence

**Iteration Cadence**:
- Monthly testing cycle
- 5+ images per prompt version for statistical validity
- Track all metrics in version-controlled JSON
- Document prompt changes with rationale

---

### 7.4 Improvement Strategies by Category

| Weak Area (< 3.0/5.0) | Improvement Strategy | Prompt Enhancement |
|----------------------|---------------------|-------------------|
| **Prompt Adherence** | Add more specific visual keywords. Break down complex descriptions into explicit elements. Use style references. | Include "Ensure all elements are visible: [list key elements]". Add specific style tags like "in the style of [artist/art movement]". |
| **Composition Quality** | Add cinematic framing instructions. Specify rule of thirds, leading lines, or golden ratio. Request dynamic camera angles. | Add "Use cinematic composition with [rule of thirds/golden ratio], [camera angle], and [depth layers]". Include framing keywords like "wide shot", "close-up", "establishing shot". |
| **Visual Coherence** | Ensure consistent art style across all elements. Request unified color palette. Add lighting consistency instructions. | Add "Maintain consistent [art style] throughout. Unified color palette with [color scheme]. Coherent lighting from [direction]". |
| **Aspect Ratio Accuracy** | Explicitly state target aspect ratio and orientation. Add composition keywords that reinforce ratio. | Start with "16:9 widescreen composition" or "1:1 square composition". Add ratio-appropriate framing like "panoramic widescreen" for 16:9. |
| **Generation Time** | Simplify overly complex prompts. Remove redundant keywords. Focus on essential visual elements. | Remove filler words. Use concise, high-impact descriptors. Limit to 3-5 key visual elements. |

---

### 7.5 Version History & Results

Track prompt evolution and cumulative improvements:

## v1.1 (2025-11-15)
**Changes**: Enhanced character portrait prompts with emotional depth and dynamic angles
**Results**:
- Prompt adherence: 78% → 89% (+11%)
- Composition quality: 3.2 → 3.9 (+0.7)
- Aspect ratio accuracy: ±0.5% → ±0.3% (-0.2%)
**Decision**: ✅ ADOPT (significant improvements across all metrics)

## v1.0 (2025-10-01)
**Initial Release**: Baseline image generation prompts
**Baseline Metrics**:
- Prompt adherence: 82% average
- Composition quality: 3.4/5.0 average
- Aspect ratio accuracy: ±0.4% average
- Generation time: 8-10s (Gemini 2.5 Flash)
- AVIF 1x file size: ~15KB average

---

### 7.6 Testing Best Practices

**DO**:
- ✅ Use same test scenarios for fair comparison between versions
- ✅ Test with at least 5 images per prompt version (statistical validity)
- ✅ Measure all metrics from [image-evaluation.md](image-evaluation.md)
- ✅ Compare against baseline using identical prompts
- ✅ Document all changes with clear rationale
- ✅ Wait for complete metrics before making decisions
- ✅ Revert immediately if regressions detected
- ✅ Track cumulative improvements over time
- ✅ Collect both quantitative metrics and qualitative visual feedback

**DON'T**:
- ❌ Change multiple prompt sections simultaneously (can't isolate cause)
- ❌ Adopt changes based on single image results
- ❌ Ignore visual regression testing with human reviewers
- ❌ Skip version control and documentation
- ❌ Rush the testing phase (minimum 1 week per iteration)
- ❌ Optimize for single metrics at expense of others
- ❌ Assume improvements without empirical validation
- ❌ Forget to test across all image types (story/character/setting/scene)

**Validation Checklist**:
- [ ] Hypothesis clearly stated with predicted improvement
- [ ] Baseline metrics captured from v1.0 control
- [ ] 5+ test images generated with new prompt version
- [ ] All image types tested (story, character, setting, scene, comic-panel)
- [ ] All metrics measured using standardized frameworks
- [ ] Visual regression tests completed (5+ reviewers per image)
- [ ] Results compared to baseline with statistical significance
- [ ] No major regressions in any metric category
- [ ] Prompt changes documented in version control
- [ ] Results logged in testing JSON file

---

### 7.7 Metrics Reference

For complete testing metrics and evaluation frameworks, see:

**[image-evaluation.md](image-evaluation.md)** - Comprehensive evaluation guide including:
- Part I: Quality Metrics (Aspect Ratio, Resolution, Prompt Adherence, Format, File Size)
- Part II: Performance Benchmarks (Generation time, optimization time, success rates)
- Part III: Testing Strategies (Unit tests, integration tests, visual regression)
- Part IV: Quality Assurance Checklist

**Key Metrics Categories**:
1. **Generation Quality**: Prompt adherence, composition, visual coherence
2. **Technical Accuracy**: Aspect ratio, resolution, format compliance
3. **Performance**: Generation time, file size, optimization time
4. **User Experience**: Visual appeal, emotional resonance, storytelling effectiveness

---

### 7.8 Statistical Validity

**Sample Size**:
- Minimum 5 images per prompt version
- Recommended 10 images for high-confidence results
- 20+ images for critical production releases

**Significance Testing**:
- Use t-test for numerical metrics (generation time, file size)
- Use proportion test for categorical metrics (prompt adherence %)
- Require p-value < 0.05 for statistical significance

**Control Variables**:
- Same AI provider (Gemini 2.5 Flash or AI Server)
- Same test prompts across versions
- Same evaluation rubrics and reviewers
- Same time of day (API performance consistency)

---

### 7.9 Related Documentation

**Specification & Concepts**:
- `image-specification.md` - Core concepts, data model, architecture

**Evaluation & Testing**:
- `image-evaluation.md` - Quality metrics, performance benchmarks, testing strategies

**Code References**:
- `src/lib/studio/generators/images-generator.ts` - Pure image generation
- `src/lib/studio/services/images-service.ts` - Orchestration with DB and Blob
- `src/lib/studio/services/image-optimization-service.ts` - AVIF optimization
- `src/app/api/studio/images/route.ts` - API endpoint

**Other Documentation**:
- `../novels/novels-development.md` - Novel generation iterative improvement methodology
- `../toonplay/toonplay-development.md` - Toonplay iterative improvement methodology

---

**End of Part VII: Iterative Improvement Methodology**
