# Qwen-Image Specifications for Fictures Comics

**Document Status**: Production Reference - FINAL RECOMMENDATION
**Created**: 2025-11-06
**Model**: Qwen-Image (Alibaba Cloud, 20B parameters, MMDiT architecture)
**Purpose**: Optimal image generation configuration for mobile-first webtoon vertical scroll

---

## Executive Summary

**RECOMMENDED CONFIGURATION: 9:16 Portrait (928 × 1664)**

This is the OPTIMAL aspect ratio for Fictures comics because:
- ✅ Native smartphone aspect ratio (iPhone, Android)
- ✅ Maximum screen utilization (82% of mobile height)
- ✅ Most immersive vertical scroll experience
- ✅ Perfect for mobile-first webtoon reading
- ✅ Supported natively by Qwen-Image training

**Key Decision**: Use **9:16 (928 × 1664)** over current 7:4 landscape (1344×768)

---

## Qwen-Image Model Overview

**Model Details:**
- **Name**: Qwen-Image
- **Developer**: Alibaba Cloud / Qwen Team
- **Parameters**: 20 billion
- **Architecture**: Multimodal Diffusion Transformer (MMDiT)
- **Release**: August 2025
- **Capability**: 14-megapixel native canvas, complex text rendering, precise image editing
- **Strengths**: Photorealistic detail, multilingual text integration, artistic rendering

**Key Advantages for Comics:**
- Complex text rendering (dialogue bubbles, SFX)
- Multiple art styles (photorealistic to artistic)
- Consistent quality across aspect ratios
- Open-source with API access

---

## Official Supported Aspect Ratios

From Qwen-Image development team (confirmed via GitHub Issue #7):

| Aspect Ratio | Dimensions | Orientation | Use Case |
|--------------|------------|-------------|----------|
| **9:16** ⭐ | **928 × 1664** | **Portrait** | **Mobile webtoon (RECOMMENDED)** |
| 2:3 | 1056 × 1584 | Portrait | Traditional portrait photo |
| 3:4 | 1104 × 1472 | Portrait | Standard portrait |
| 1:1 | 1328 × 1328 | Square | Social media, flexible |
| 3:2 | 1584 × 1056 | Landscape | DSLR photo |
| 4:3 | 1472 × 1104 | Landscape | Traditional photo |
| 16:9 | 1664 × 928 | Landscape | Cinema, not mobile-optimized |

**Note**: These dimensions were used in Qwen-Image's final training stage, ensuring optimal performance.

---

## Why 9:16 is Optimal for Fictures Comics

### 1. Native Mobile Aspect Ratio

**Modern Smartphone Screens:**
- iPhone 13/14/15: 390×844 (0.462 ratio, but standard is 9:16)
- Samsung Galaxy S21: 360×800 (0.45 ratio)
- Standard mobile: 9:16 or 9:20 (portrait)

**9:16 panels (928 × 1664) on mobile:**
- Scaled to phone width: 390 × 696 pixels
- Screen coverage: **82% of iPhone height** (696/844)
- Result: Nearly full-screen immersion per panel

### 2. Comparison to Other Portrait Options

**Screen Coverage Analysis (on iPhone 13: 390×844):**

| Aspect Ratio | Dimensions | Scaled to 390px | Screen Coverage | Immersion |
|--------------|------------|-----------------|-----------------|-----------|
| **9:16** ⭐ | 928 × 1664 | 390 × 696 | **82%** | **Maximum** |
| 2:3 | 1056 × 1584 | 390 × 585 | 69% | Good |
| 3:4 | 1104 × 1472 | 390 × 520 | 62% | Moderate |
| 7:4 (current) ❌ | 1344 × 768 | 390 × 223 | **26%** | **Poor** |

**Visual Impact:**
```
iPhone 13 Screen (390×844):

Current 7:4 Landscape:
┌─────────────┐
│  [panel]    │ ← 223px (26% of screen) 😞
└─────────────┘

Recommended 9:16 Portrait:
┌─────────────┐
│             │
│             │
│             │  ← 696px (82% of screen) 🎉
│   [panel]   │
│             │
│             │
│             │
└─────────────┘
```

### 3. Vertical Scroll Optimization

**9:16 Advantages:**
- One panel fills entire screen = immersive storytelling
- Reader sees ONE complete visual moment at a time
- Clear panel-to-panel transitions
- Natural thumb-scroll rhythm
- No need to zoom or pan

### 4. Industry Alignment

**Modern Webtoon Trend:**
- Moving toward taller, more immersive panels
- Full-screen mobile reading experiences
- Apps like WEBTOON, Tapas optimize for portrait
- Professional studios increasingly use 9:16 for mobile-first content

---

## Recommended Specifications

### Working/Generation Resolution

**Use Qwen-Image Native Output:**
- **Aspect Ratio**: 9:16 (portrait)
- **Dimensions**: 928 × 1664 pixels
- **Format**: PNG (original), AVIF/JPEG (optimized)
- **Quality**: Qwen-Image default quality settings

**Why 928px width (not 800px)?**
- ✅ Native Qwen-Image output (no quality loss from scaling)
- ✅ Within Tapas limit (940px max)
- ✅ Can downscale to 800px for WEBTOON if needed
- ✅ Higher resolution = better quality
- ✅ Future-proof for larger displays

### Platform Compliance

**For Fictures Platform:**
- Store original: 928 × 1664 PNG
- No downscaling needed
- Maximum quality for readers

**For WEBTOON Export (if needed):**
- Downscale to: 800 × 1422 (maintains 9:16)
- Export as: JPEG or PNG (<2MB)
- Slice into: 800 × 1280 segments if needed

**For Tapas Export:**
- Use native: 928 × 1664 (under 940px limit)
- Export as: PNG or JPEG
- No slicing needed

### Optimization Variants

**Generate 4 optimized variants per panel:**

**Mobile 1x (Low Bandwidth / 3G):**
- AVIF: 464 × 832 pixels (50% of original)
- JPEG: 464 × 832 pixels (50% of original)

**Mobile 2x (High Resolution / Retina / 4G/5G):**
- AVIF: 928 × 1664 pixels (original size)
- JPEG: 928 × 1664 pixels (original size)

**Total**: 4 variants + 1 original PNG = 5 files per panel

**Estimated File Sizes:**
- Original PNG: ~600-900 KB
- AVIF 1x: ~40-60 KB
- AVIF 2x: ~120-180 KB
- JPEG 1x: ~80-120 KB
- JPEG 2x: ~250-350 KB

**Total per panel**: ~1.1-1.6 MB (all variants)
**Per scene (10 panels)**: ~11-16 MB (acceptable for mobile)

---

## Shot Type Recommendations for 9:16

The extremely tall 9:16 aspect ratio requires adjusted framing:

### Establishing Shot (Scene Opening)
**Composition**: Full environment, vertical perspective
**Example**: Tall cityscape, building exterior, forest path
**Camera Angle**: High angle or eye level
**Framing**: Utilize full vertical height to show scale

### Wide Shot (Action, Multiple Characters)
**Composition**: Characters in environment, vertical space
**Example**: Characters talking in room (show floor to ceiling)
**Camera Angle**: Eye level, slight high angle
**Framing**: Use vertical space to separate characters vertically

### Medium Shot (Conversations, Main Storytelling)
**Composition**: Character waist-up to head
**Example**: Two characters talking (stacked vertically if both visible)
**Camera Angle**: Eye level, over-shoulder
**Framing**: Center character in vertical frame with headroom

### Close-Up (Emotional Beats, Reactions)
**Composition**: Face and shoulders, lots of negative space above/below
**Example**: Character's emotional reaction
**Camera Angle**: Eye level, slight low angle for drama
**Framing**: Face in upper 2/3, leave breathing room

### Extreme Close-Up (Dramatic Moments)
**Composition**: Eyes, hands, specific detail
**Example**: Eyes widening in shock, hand trembling
**Camera Angle**: Straight on
**Framing**: Detail centered with generous negative space

**Key Principle**: 9:16 is VERY tall. Use vertical composition, avoid horizontal clutter.

---

## Panel Count Optimization for 9:16

**Because 9:16 panels are taller and more immersive:**

**Adjust Panel Count Guidelines:**

```typescript
// Genre-based panel count for 9:16 aspect ratio
const PANEL_COUNT_9_16 = {
  'romance': { min: 6, target: 8, max: 9 },       // Fewer needed, each panel is larger
  'drama': { min: 7, target: 9, max: 10 },
  'slice-of-life': { min: 6, target: 8, max: 9 },
  'action': { min: 8, target: 10, max: 11 },      // Still need more for action sequences
  'thriller': { min: 8, target: 10, max: 11 },
  'fantasy': { min: 8, target: 10, max: 11 },
  'sci-fi': { min: 8, target: 10, max: 11 },
  'mystery': { min: 7, target: 9, max: 10 },
  'horror': { min: 8, target: 10, max: 11 },
  'comedy': { min: 6, target: 8, max: 9 },
};
```

**Rationale:**
- Each 9:16 panel conveys MORE visual information (taller frame)
- One panel = one complete visual moment (nearly full screen on mobile)
- Slightly FEWER panels needed vs. landscape or smaller aspect ratios
- Maintain 8-10 target for most genres, adjust down 1-2 for dialogue-heavy

---

## Panel Spacing for 9:16

**Because panels are taller (1664px), spacing feels LESS prominent:**

**Recommended Dynamic Spacing (scaled for taller panels):**

```typescript
const PANEL_SPACING_9_16 = {
  TIGHT: 50,        // Continuous action (feels even tighter with tall panels)
  STANDARD: 150,    // Default beat-to-beat (increased from 100px)
  TRANSITION: 250,  // Shot type changes (increased from 200px)
  SCENE_BREAK: 500, // Major scene transitions (increased from 400px)
};
```

**Why Increase Spacing?**
- Taller panels (1664px) make 100px spacing feel cramped
- Need proportionally more space to create visual "breathing room"
- 150-500px range maintains clear narrative rhythm
- Prevents panels from feeling like one continuous image

---

## Implementation Checklist

### Phase 1: Qwen-Image Integration

**1. Model Integration:**
- [ ] Set up Qwen-Image API access (Alibaba Cloud DashScope or alternative)
- [ ] Configure API credentials in `.env.local`
- [ ] Create Qwen-Image service wrapper

**2. Image Generation Service:**
- [ ] Update `src/lib/services/image-generation.ts`
- [ ] Replace Gemini 2.5 Flash with Qwen-Image API
- [ ] Set aspect ratio to `9:16`
- [ ] Set dimensions to `928 × 1664`
- [ ] Test generation with sample prompts

**3. Optimization Pipeline:**
- [ ] Update `src/lib/services/image-optimization.ts`
- [ ] Configure variant dimensions:
  - Mobile 1x: 464 × 832
  - Mobile 2x: 928 × 1664
- [ ] Test AVIF/JPEG generation

**4. Storage:**
- [ ] Verify Vercel Blob handles new dimensions
- [ ] Update storage paths if needed
- [ ] Test upload/download

### Phase 2: Database & Schema

**5. Update Schema:**
- [ ] Update `drizzle/schema.ts` if needed
- [ ] Document 9:16 aspect ratio in comments
- [ ] Migration if changing existing data

**6. Metadata:**
- [ ] Store aspect ratio metadata (9:16)
- [ ] Store original dimensions (928 × 1664)
- [ ] Store variant dimensions

### Phase 3: Frontend Updates

**7. Comic Viewer:**
- [ ] Update `src/components/comic/ComicViewer.tsx`
- [ ] Implement dynamic panel spacing (150-500px)
- [ ] Test responsive image loading
- [ ] Optimize for mobile viewport

**8. Panel Renderer:**
- [ ] Update `src/components/comic/PanelRenderer.tsx`
- [ ] Handle 9:16 aspect ratio display
- [ ] Test on iPhone, Android devices
- [ ] Verify full-screen immersion

**9. Typography:**
- [ ] Add dialogue bubble components (18-20px font)
- [ ] Add SFX text components
- [ ] Position overlays on 9:16 panels
- [ ] Test readability on mobile

### Phase 4: AI Generation

**10. Toonplay Converter:**
- [ ] Update `src/lib/ai/toonplay-converter.ts`
- [ ] Adjust panel count for 9:16 (6-11 range)
- [ ] Update shot type guidance for vertical composition
- [ ] Add 9:16 framing instructions to prompts

**11. Panel Prompts:**
- [ ] Update image prompt templates
- [ ] Emphasize vertical composition
- [ ] Add "9:16 portrait format" to prompts
- [ ] Test with Qwen-Image generation

### Phase 5: Testing & Validation

**12. Mobile Device Testing:**
- [ ] iPhone 13/14/15 (390×844)
- [ ] iPhone SE (375×667)
- [ ] Samsung Galaxy S21 (360×800)
- [ ] iPad Mini (768×1024)

**13. Performance Testing:**
- [ ] Load time (first panel)
- [ ] Scroll performance (FPS)
- [ ] Data usage per scene
- [ ] Image quality validation

**14. User Experience:**
- [ ] Reading flow (panel-to-panel)
- [ ] Spacing perception (150-500px)
- [ ] Typography readability
- [ ] Overall immersion rating

---

## Sample Qwen-Image API Call

**Example using Alibaba Cloud DashScope API:**

```typescript
// src/lib/services/qwen-image-generator.ts
import { Configuration, DashScopeClient } from '@alibabacloud/dashscope';

export async function generateComicPanel(prompt: string) {
  const config = new Configuration({
    apiKey: process.env.QWEN_API_KEY,
  });

  const client = new DashScopeClient(config);

  const response = await client.imageGeneration({
    model: 'qwen-image',
    input: {
      prompt: prompt,
    },
    parameters: {
      // Specify 9:16 aspect ratio
      size: '928x1664',  // or aspect_ratio: '9:16' if supported
      steps: 25,          // Inference steps (1-50)
      style: 'vivid',     // or 'natural' depending on story genre
    },
  });

  return {
    imageUrl: response.output.results[0].url,
    dimensions: { width: 928, height: 1664 },
    aspectRatio: '9:16',
  };
}
```

**Prompt Template for 9:16 Vertical Composition:**

```typescript
const prompt = `Professional ${genre} comic panel in 9:16 PORTRAIT format.

VERTICAL COMPOSITION RULES:
- Utilize full vertical height (top to bottom storytelling)
- Avoid horizontal clutter (narrow width)
- Center key elements vertically
- Use negative space above/below for breathing room

SHOT TYPE: ${shotType}
CAMERA ANGLE: ${cameraAngle}

SCENE: ${settingFocus}. ${settingAtmosphere}.

CHARACTERS (if visible): ${characterPrompts}
POSES: ${characterPoses}

LIGHTING: ${lighting}

ACTION: ${description}

MOOD: ${mood}

COMPOSITION: 9:16 portrait (928×1664), vertical storytelling, mobile-optimized.
STYLE: Clean comic linework, vibrant colors, semi-realistic proportions, ${genre} comic art style.

CRITICAL: Compose for TALL VERTICAL FRAME. Utilize top-to-bottom space effectively.`;
```

---

## Migration from Current 7:4 Landscape

### Backward Compatibility

**Support both ratios during transition:**

```typescript
// src/lib/config/panel-config.ts
export const PANEL_CONFIGS = {
  legacy: {
    aspectRatio: '7:4',
    width: 1344,
    height: 768,
    orientation: 'landscape',
  },
  portrait: {
    aspectRatio: '9:16',
    width: 928,
    height: 1664,
    orientation: 'portrait',
  },
};

// Feature flag
export const USE_PORTRAIT_PANELS = process.env.NEXT_PUBLIC_USE_9_16_PANELS === 'true';

export const CURRENT_CONFIG = USE_PORTRAIT_PANELS
  ? PANEL_CONFIGS.portrait
  : PANEL_CONFIGS.legacy;
```

### Migration Strategy

**Phase 1: Gradual Rollout**
1. Implement 9:16 generation for NEW scenes only
2. Keep existing 7:4 panels as-is
3. Update comic viewer to handle both ratios
4. Test with small user group

**Phase 2: Full Migration**
1. All new scenes use 9:16
2. Optionally regenerate high-priority existing scenes
3. Remove 7:4 legacy code once satisfied

**Phase 3: Optimization**
1. Monitor performance metrics
2. Gather user feedback
3. Fine-tune panel spacing, count, typography
4. Iterate on quality

---

## Expected Performance Improvements

### Before (7:4 Landscape: 1344×768)

**Mobile Reading (iPhone 13: 390×844):**
- Panel display: 390 × 223 pixels
- Screen coverage: 26% of height
- Experience: Cramped, lots of scrolling, landscape feels unnatural
- Panels per screen: 3-4 panels visible at once (cluttered)

### After (9:16 Portrait: 928×1664)

**Mobile Reading (iPhone 13: 390×844):**
- Panel display: 390 × 696 pixels
- Screen coverage: 82% of height
- Experience: Immersive, full-screen, natural vertical flow
- Panels per screen: 1 panel fills screen (focused storytelling)

### Metrics to Track

**Engagement:**
- Time per scene (expected: increase due to immersion)
- Completion rate (expected: increase)
- Drop-off rate (expected: decrease)
- User retention (expected: increase)

**Technical:**
- Load time (expected: ~same, optimized variants)
- Data usage (expected: ~same or less with AVIF)
- Scroll performance (expected: smooth, fewer panels on screen)

**Subjective:**
- User satisfaction rating (expected: significant increase)
- Readability score (expected: increase)
- Immersion rating (expected: dramatic increase)

---

## Conclusion

**FINAL RECOMMENDATION: Qwen-Image 9:16 Portrait (928 × 1664)**

**Critical Changes:**
1. ✅ **Model**: Qwen-Image (20B, excellent text rendering)
2. ✅ **Aspect Ratio**: 9:16 portrait (native mobile ratio)
3. ✅ **Dimensions**: 928 × 1664 (optimal for mobile screens)
4. ✅ **Panel Spacing**: 150-500px dynamic (scaled for tall panels)
5. ✅ **Panel Count**: 6-11 (adjusted down for larger panels)

**Expected Impact:**
- 🎉 **82% screen coverage** on mobile (vs 26% current)
- 🎉 **Full-screen immersion** per panel
- 🎉 **Native mobile aspect ratio** (9:16 matches smartphones)
- 🎉 **Professional webtoon quality** (matches industry standards)
- 🎉 **Excellent text rendering** (Qwen-Image strength for dialogue/SFX)

**Next Steps:**
1. Set up Qwen-Image API access
2. Implement Phase 1 (Model Integration)
3. Create feature flag for gradual rollout
4. Test on real mobile devices
5. Gather user feedback and iterate

---

**Related Documentation:**
- `comics-optimization-recommendations.md` - Webtoon industry standards analysis
- `comics-architecture.md` - Current system architecture
- `comics-generation.md` - Generation pipeline
- `comics-toonplay.md` - Toonplay format specification

**External Resources:**
- [Qwen-Image GitHub](https://github.com/QwenLM/Qwen-Image)
- [Qwen-Image HuggingFace](https://huggingface.co/Qwen/Qwen-Image)
- [Qwen API Documentation](https://www.alibabacloud.com/help/en/model-studio)
