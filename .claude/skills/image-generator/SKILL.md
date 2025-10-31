---
name: image-generator
description: Generate AI images for novel elements using Gemini 2.5 Flash. Creates character portraits, setting environments, and scene illustrations with automatic optimization. Saves images to outputs/ directory. Use when user asks to generate, create, or visualize images for their novel.
---

# Image Generator Skill

Generate AI-powered images for novel elements using **Gemini 2.5 Flash** image generation. Creates character portraits (1024×1024), setting environments (1344×768), and scene illustrations (1344×768) with automatic 4-variant optimization.

## When to Use This Skill

Activate this skill when the user requests:
- "generate images for my novel..."
- "create character portraits for..."
- "visualize the settings in..."
- "make scene images for chapter..."
- "generate cover art for..."

## Image Generation Specifications

Based on `docs/novels/novels-generation.md` Section 2.9 and `docs/novels/novels-optimization.md`.

### Image Types & Dimensions

#### Story Cover Image
- **Size**: 1344×768 (7:4 aspect ratio)
- **Purpose**: Book cover illustration
- **Prompt Template**:
  ```
  Book cover illustration for "{storyTitle}", {storySummary}, {genre} genre,
  {tone} atmosphere, {visualStyle} art style, dramatic composition,
  professional book cover design
  ```

#### Character Portrait
- **Size**: 1024×1024 (square)
- **Purpose**: Character concept art
- **Prompt Template**:
  ```
  Portrait of {characterName}, {physicalDescription.appearance},
  {physicalDescription.distinctiveFeatures}, {visualStyle} style,
  {genre} genre aesthetic, character concept art
  ```

#### Setting Environment
- **Size**: 1344×768 (7:4 aspect ratio)
- **Purpose**: Location/environment illustration
- **Prompt Template**:
  ```
  Wide landscape view of {settingName}, {settingDescription},
  {visualReferences[0]} style, {genre} aesthetic, {colorPalette} colors,
  {mood} atmosphere, cinematic composition
  ```

#### Scene Image
- **Size**: 1344×768 (7:4 aspect ratio)
- **Purpose**: Key moment visualization
- **Prompt Template**:
  ```
  Cinematic scene from {storyTitle}: {sceneTitle}, {sceneVisualDescription},
  {settingName} environment, {charactersPresent}, {visualStyle} style,
  {genre} aesthetic, 7:4 composition
  ```

## Image Optimization Strategy

**Mobile-First Optimization** (4 variants per image):

### Formats
- **AVIF** (best compression, 93.8% browser support)
- **JPEG** (universal fallback, 100% browser support)

### Sizes
- **Mobile 1x**: 672×384 (for 320-640px viewports)
- **Mobile 2x**: 1344×768 (original Gemini size, also used for desktop)

**Total per image**: 2 formats × 2 sizes = **4 variants**

**Why not WebP?** Only adds 1.5% browser coverage over AVIF, but increases variants by 50%. Not worth the storage/processing cost.

## Image Generation Workflow

### Step 1: Load Novel Context

Read from `outputs/[story]/` directory:
- `metadata.json` - Story details
- `structure/characters.md` - Character descriptions
- `structure/settings.md` - Setting descriptions
- `chapters/*.md` - Scene content for scene images

### Step 2: Extract Visual Specifications

For each image type:
1. **Story Cover**: Extract title, summary, genre, tone, visual style
2. **Characters**: Extract name, physical description, visual style
3. **Settings**: Extract name, description, mood, color palette, visual references
4. **Scenes**: Extract scene title, visual description, setting, characters present

### Step 3: Generate Base Images

Use Gemini 2.5 Flash API to generate:
- Request image generation with constructed prompt
- Specify exact dimensions (1024×1024 or 1344×768)
- Set style parameters based on novel's visual style
- Save base image to `outputs/[story]/images/originals/`

### Step 4: Create Optimized Variants

For each base image:
1. Generate Mobile 1x (672×384 for characters, proportional for others)
   - AVIF format (best compression)
   - JPEG format (fallback)
2. Keep original as Mobile 2x (also used for desktop)
   - AVIF format
   - JPEG format

Save variants to `outputs/[story]/images/variants/`

### Step 5: Update Metadata

Create image manifest:
```json
{
  "imageId": "unique-id",
  "type": "character" | "setting" | "scene" | "cover",
  "entityId": "character-id or setting-id or scene-id",
  "originalUrl": "path/to/original.png",
  "variants": [
    {
      "format": "avif",
      "width": 672,
      "height": 384,
      "url": "path/to/mobile-1x.avif",
      "size": 45000
    },
    {
      "format": "jpeg",
      "width": 672,
      "height": 384,
      "url": "path/to/mobile-1x.jpg",
      "size": 89000
    },
    {
      "format": "avif",
      "width": 1344,
      "height": 768,
      "url": "path/to/mobile-2x.avif",
      "size": 120000
    },
    {
      "format": "jpeg",
      "width": 1344,
      "height": 768,
      "url": "path/to/mobile-2x.jpg",
      "size": 245000
    }
  ],
  "generatedAt": "ISO8601 timestamp",
  "prompt": "full generation prompt",
  "model": "Gemini 2.5 Flash"
}
```

## Response Templates

### Starting Generation

```
I'll generate [N] images for your novel using Gemini 2.5 Flash.

**Image Types:**
- [M] character portraits (1024×1024)
- [P] setting environments (1344×768)
- [Q] scene illustrations (1344×768)
- [R] story cover (1344×768)

**Optimization:**
Each image will be optimized into 4 variants:
- AVIF mobile 1x (smallest, fastest)
- JPEG mobile 1x (fallback)
- AVIF mobile 2x/desktop
- JPEG mobile 2x/desktop (universal)

Total variants: [N × 4] images

Generating base images...
```

### Progress Updates

```
🎭 Generating character images...
   ✅ Character 1: [Name] - 1024×1024, 4 variants created
   ✅ Character 2: [Name] - 1024×1024, 4 variants created
   ...

🏞️ Generating setting images...
   ✅ Setting 1: [Name] - 1344×768, 4 variants created
   ✅ Setting 2: [Name] - 1344×768, 4 variants created
   ...

🎬 Generating scene images...
   ✅ Scene 1.1: [Title] - 1344×768, 4 variants created
   ✅ Scene 1.2: [Title] - 1344×768, 4 variants created
   ...

📚 Generating story cover...
   ✅ Cover: [Story Title] - 1344×768, 4 variants created
```

### Completion Report

```
✅ Image generation complete!

**Images Generated:**
- Characters: [M] portraits
- Settings: [P] environments
- Scenes: [Q] illustrations
- Cover: 1 image
- **Total**: [N] base images

**Optimization:**
- Total variants: [N × 4] images
- AVIF images: [N × 2] (50% smaller than JPEG)
- JPEG images: [N × 2] (universal fallback)
- Mobile 1x: [N × 2] (for phones)
- Mobile 2x/Desktop: [N × 2] (for tablets/desktop)

**Storage:**
- Original images: ~[X] MB
- Optimized variants: ~[Y] MB
- Total: ~[Z] MB
- Space savings: [P]% compared to originals only

**Output Location:**
outputs/[story]/images/
├── originals/          ([N] files)
├── variants/           ([N × 4] files)
└── image-manifest.json (1 file)

All images are ready for use in your novel!
```

## Document Output Formats

### Directory Structure

```
outputs/[story]/images/
├── originals/
│   ├── cover-original.png
│   ├── character-[id]-original.png
│   ├── setting-[id]-original.png
│   └── scene-[id]-original.png
├── variants/
│   ├── cover-mobile-1x.avif
│   ├── cover-mobile-1x.jpg
│   ├── cover-mobile-2x.avif
│   ├── cover-mobile-2x.jpg
│   ├── character-[id]-mobile-1x.avif
│   ├── character-[id]-mobile-1x.jpg
│   ├── character-[id]-mobile-2x.avif
│   ├── character-[id]-mobile-2x.jpg
│   └── ... (repeat for all images)
└── image-manifest.json
```

### image-manifest.json

```json
{
  "storyId": "story-slug",
  "generatedAt": "ISO8601 timestamp",
  "totalImages": 0,
  "totalVariants": 0,
  "visualStyle": "realistic | anime | painterly | cinematic",
  "images": {
    "cover": {
      "imageId": "cover-id",
      "type": "cover",
      "originalUrl": "originals/cover-original.png",
      "variants": [
        {
          "format": "avif",
          "width": 672,
          "height": 384,
          "url": "variants/cover-mobile-1x.avif",
          "size": 45000
        },
        ...
      ],
      "generatedAt": "ISO8601",
      "prompt": "full prompt text",
      "model": "Gemini 2.5 Flash"
    },
    "characters": [
      {
        "imageId": "char-id-1",
        "type": "character",
        "entityId": "character-1",
        "name": "Character Name",
        "originalUrl": "originals/character-1-original.png",
        "variants": [...],
        "generatedAt": "ISO8601",
        "prompt": "full prompt",
        "model": "Gemini 2.5 Flash"
      }
    ],
    "settings": [
      {
        "imageId": "setting-id-1",
        "type": "setting",
        "entityId": "setting-1",
        "name": "Setting Name",
        "originalUrl": "originals/setting-1-original.png",
        "variants": [...],
        "generatedAt": "ISO8601",
        "prompt": "full prompt",
        "model": "Gemini 2.5 Flash"
      }
    ],
    "scenes": [
      {
        "imageId": "scene-id-1",
        "type": "scene",
        "entityId": "scene-1.1",
        "title": "Scene Title",
        "chapterId": "chapter-1",
        "originalUrl": "originals/scene-1-1-original.png",
        "variants": [...],
        "generatedAt": "ISO8601",
        "prompt": "full prompt",
        "model": "Gemini 2.5 Flash"
      }
    ]
  },
  "statistics": {
    "coverImages": 1,
    "characterImages": 0,
    "settingImages": 0,
    "sceneImages": 0,
    "totalOriginals": 0,
    "totalVariants": 0,
    "totalSizeBytes": 0,
    "avifSavings": "percentage"
  }
}
```

## Prompt Construction Examples

### Character Portrait Prompt

**Input Data**:
```json
{
  "name": "Yuna",
  "physicalDescription": {
    "age": "mid-30s",
    "appearance": "Weather-worn Korean woman with determined eyes and strong hands",
    "distinctiveFeatures": "Scarred left hand from old burn, always wears mother's jade bracelet",
    "style": "Practical work clothes, faded and patched"
  },
  "visualStyle": "realistic",
  "genre": "Post-War Drama"
}
```

**Generated Prompt**:
```
Portrait of Yuna, weather-worn Korean woman in her mid-30s with determined eyes
and strong hands, scarred left hand from old burn, jade bracelet visible,
practical work clothes that are faded and patched, realistic style,
post-war drama aesthetic, character concept art
```

### Setting Environment Prompt

**Input Data**:
```json
{
  "name": "The Ruined Garden",
  "description": "A bombed-out city block where Yuna attempts to grow vegetables in contaminated soil. Once a thriving community park, it now symbolizes both the destruction of war and the fragile possibility of renewal.",
  "mood": "hopeful but fragile",
  "colorPalette": ["dusty browns", "harsh whites", "rare deep greens", "golden hour light"],
  "visualReferences": ["Mad Max Fury Road desert scenes", "Children of Men urban decay"],
  "visualStyle": "cinematic"
}
```

**Generated Prompt**:
```
Wide landscape view of The Ruined Garden, bombed-out city block with struggling
vegetable garden in contaminated soil, community park destroyed by war with signs
of renewal, Mad Max Fury Road style, post-war drama aesthetic, dusty browns and
harsh whites with rare deep greens and golden hour light colors, hopeful but fragile
atmosphere, cinematic composition
```

### Scene Image Prompt

**Input Data**:
```json
{
  "sceneTitle": "We Both Live or We Both Die",
  "sceneVisualDescription": "Yuna kneeling in harsh sunlight, pouring her last water onto struggling seedlings, surrounded by cracked earth and ruins",
  "settingName": "The Ruined Garden",
  "charactersPresent": ["Yuna (Korean woman, mid-30s, determined)"],
  "storyTitle": "The Last Garden",
  "visualStyle": "cinematic"
}
```

**Generated Prompt**:
```
Cinematic scene from The Last Garden: We Both Live or We Both Die, Yuna
(Korean woman, mid-30s) kneeling in harsh sunlight pouring last water onto
struggling seedlings, surrounded by cracked earth and ruins, The Ruined Garden
environment, cinematic style, post-war drama aesthetic, 7:4 composition
```

## Best Practices

1. **Consistent style**: Use same visualStyle across all images for cohesion
2. **Descriptive prompts**: Include genre, mood, and specific visual details
3. **Reference inspiration**: Mention films, artists, or styles for better results
4. **Batch processing**: Generate all images of one type before moving to next
5. **Save prompts**: Keep full prompt text for reproducibility

## Advanced Usage

### Selective Generation

Generate only specific image types:
```
User: "Generate just the character portraits"
Assistant: "I'll generate [N] character portraits without settings or scenes..."
```

### Regeneration

Regenerate specific images with adjusted prompts:
```
User: "Regenerate character 2's portrait with darker clothing"
Assistant: "I'll regenerate that portrait with updated prompt..."
```

### Style Variants

Generate same image in multiple styles:
```
User: "Generate the cover in both realistic and anime styles"
Assistant: "I'll create two versions of the cover..."
```

## Error Handling

### Generation Failure

```
❌ Image generation failed for [Image Type]

Error: [error message from Gemini API]

Options:
1. Retry with same prompt
2. Adjust prompt and retry
3. Skip this image and continue
4. Pause generation
```

### Optimization Failure

```
⚠️ Variant optimization failed for [Image]

The original image was saved successfully, but variant creation failed.

Error: [error message]

The original can still be used, but won't have mobile-optimized versions.
Would you like to retry optimization?
```

## Troubleshooting

**Q: Images don't match the story tone**
A: Review and adjust visualStyle in novel metadata. Options: realistic, anime, painterly, cinematic

**Q: Character portraits don't match descriptions**
A: Check physical descriptions in character profiles are detailed enough. Add distinctive features and style notes.

**Q: Generation is slow**
A: Image generation takes 5-15 seconds per image. For novels with many scenes, this can take 30-60 minutes total.

**Q: Can I use my own images?**
A: Yes, place them in `outputs/[story]/images/originals/` and run optimization separately.

## Performance Metrics

**Expected Times:**
- Character portrait: 5-10 seconds
- Setting environment: 10-15 seconds
- Scene image: 10-15 seconds
- Story cover: 10-15 seconds
- Optimization per image: 2-3 seconds

**Storage Estimates:**
- Original PNG: ~500KB - 2MB each
- AVIF mobile 1x: ~30-50KB each
- JPEG mobile 1x: ~80-120KB each
- AVIF mobile 2x: ~100-150KB each
- JPEG mobile 2x: ~200-300KB each

**Example Novel:**
- 4 characters = 16 images (4MB originals, 2MB variants)
- 4 settings = 16 images (4MB originals, 2MB variants)
- 20 scenes = 80 images (20MB originals, 10MB variants)
- 1 cover = 4 images (1MB original, 0.5MB variants)
- **Total**: 116 images, ~29MB originals, ~14.5MB variants, ~43.5MB total

## Technical Notes

- **Model**: Gemini 2.5 Flash via Google AI API
- **Original format**: PNG (lossless)
- **Optimization**: Sharp.js library
- **Browser support**: AVIF 93.8%, JPEG 100%
- **Mobile-first**: Optimizes for majority mobile users

## Related Skills

- `novel-generator`: Generate novels that need images
- `novel-evaluator`: Evaluate novels before creating visuals
