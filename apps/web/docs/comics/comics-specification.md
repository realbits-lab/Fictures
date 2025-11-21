# Comics Generation Specification: Novel-to-Webtoon Adaptation

## Executive Summary

This document specifies the comics generation system that transforms narrative prose scenes into sequential visual comic panels optimized for mobile vertical-scroll reading. The system uses the **"Toonplay Converter"** methodology to convert literary scenes into webtoon-formatted visual storytelling.

**Core Principle**: Transform prose into visual narratives through panel-by-panel adaptation, preserving emotional beats and character arcs while optimizing for mobile-first webtoon consumption.

**Related Documents:**
- 📋 **Development Guide** (`comics-development.md`): API specifications, toonplay prompts, and implementation details
- 🧪 **Evaluation Guide** (`comics-evaluation.md`): Quality metrics, testing strategies, and validation methods
- 📖 **Novels Specification** (`../novels/novels-specification.md`): Source narrative system (Adversity-Triumph Engine)

---

## Part I: Core Concepts

### 1.1 What is "Toonplay"?

**Toonplay** is the comics equivalent of a screenplay, but optimized for visual storytelling:

| Film Screenplay | Webtoon Toonplay |
|-----------------|------------------|
| Sound + Video focus | Dialogue + Image focus |
| Audio-visual directions | Visual-only descriptions |
| Camera movements for video | Shot types for static panels |
| Scene-based structure | Panel-based structure |

**Why "Toonplay" instead of "Screenplay":**
- Focuses on **dialogue and static images** (perfect for comics)
- Screenplay implies **sound and motion** (for films)
- Toonplay = Visual storytelling specification for webtoon format

### 1.2 Comics System Overview

**Architecture**: Independent publishing system with dual reading formats

```
┌────────────────────────────────────────────────────────────┐
│                    DUAL READING FORMATS                     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  /novels/{storyId}              /comics/{storyId}          │
│  ├─ Traditional text            ├─ Visual comic panels      │
│  ├─ Scene illustrations         ├─ Sequential panels        │
│  ├─ Prose content               ├─ Dialogue overlays        │
│  └─ novel_status = 'published'  └─ comic_status = 'published'│
│                                                             │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                  INDEPENDENT PUBLISHING                     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Scene Text (novel_status)      Comic Panels (comic_status) │
│  ├─ draft (not published)       ├─ draft (not published)    │
│  └─ published (visible)         └─ published (visible)      │
│                                                              │
│  Comic Existence Check: comic_panel_count = 0 (no panels)   │
│                                                             │
│  Publishing Flow:                                           │
│  1. Generate scene text → Publish text (novels)            │
│  2. Generate comic panels → Preview → Publish (comics)     │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Key Characteristics:**
- **Source**: Prose scenes from Adversity-Triumph Engine novel generation
- **Output**: 8-12 sequential comic panels per scene
- **Format**: Mobile-first vertical scroll (webtoon style)
- **Independence**: Text and comics publish separately

### 1.3 Generation Pipeline

```
┌────────────────────────────────────────────────────────────┐
│               COMICS GENERATION PIPELINE                    │
└────────────────────────────────────────────────────────────┘

INPUT: Scene Narrative (Prose)
  ├─ scene.content (500-1500 words)
  ├─ Characters with consistent visual descriptions
  ├─ Settings with environmental details
  └─ Story genre, tone, emotional beats

         ↓

PHASE 1: Toonplay Conversion
  ├─ AI analyzes narrative structure
  ├─ Breaks into 8-12 visual panels (TARGET: 10)
  ├─ Determines shot types for each panel
  ├─ Extracts dialogue (max 3 bubbles per panel)
  ├─ Identifies sound effects (SFX)
  ├─ Creates visual descriptions
  └─ Model: Gemini 2.5 Flash Lite via AI SDK

         ↓

PHASE 2: Panel Image Generation
  ├─ For each panel specification:
  │   ├─ Build detailed image prompt
  │   ├─ Generate image (9:16 aspect ratio, provider-specific dimensions)
  │   ├─ Create 2 AVIF optimized variants (1x and 2x)
  │   ├─ Upload to Vercel Blob Storage
  │   └─ Save panel data to database
  └─ Model: Gemini 2.5 Flash Image or AI Server
  └─ See: ../image/image-specification.md for generation details

         ↓

PHASE 3: Database Storage
  ├─ Save comicPanels records (ordered by panelNumber)
  ├─ Update scene: comic_status = 'draft', comic_panel_count = N
  ├─ Store metadata: panelCount, generatedAt, version
  └─ Link to scene via sceneId (cascade delete)

         ↓

OUTPUT: Sequential Comic Panels
  ├─ Array of ComicPanel objects
  ├─ Images in Vercel Blob
  ├─ Ready for preview/publishing
  └─ Generation time: ~8-15 minutes per scene
```

### 1.4 Visual Grammar: Panel & Shot Types

**Shot Type Distribution** (for 10-panel scene):

| Shot Type | Count | Purpose | Visual Coverage |
|-----------|-------|---------|-----------------|
| **establishing_shot** | 1 | Scene opening, location | Wide environment, full setting |
| **wide_shot** | 2-3 | Multiple characters, action | Full bodies, spatial relationships |
| **medium_shot** | 3-4 | Conversations, main storytelling | Waist-up, character interactions |
| **close_up** | 2-3 | Emotional beats, reactions | Face focus, expressions |
| **extreme_close_up** | 0-1 | Climactic moments, details | Eyes, hands, objects |
| **over_shoulder** | 0-1 | Dialogue scenes, tension | POV perspective |
| **dutch_angle** | 0-1 | Disorientation, unease | Tilted camera angle |

**Visual Variety Principle**: Vary shot types for engaging visual rhythm, avoid monotonous sequences.

### 1.5 Content Structure: Dialogue vs. Narration

**Webtoon Content Proportion Guidelines:**

```
┌────────────────────────────────────────────────────────────┐
│                   CONTENT DISTRIBUTION                      │
└────────────────────────────────────────────────────────────┘

📊 Dialogue:        ~70% of panels (primary story driver)
   - Character speech bubbles
   - Max 3 bubbles per panel
   - Max 150 characters per bubble
   - Concise, action-oriented

📊 Visual Action:   ~30% of panels (shown, not told)
   - Silent panels with pure visual storytelling
   - Action sequences without dialogue
   - Establishing shots, transitions

📊 Narration:       <5% of panels (use sparingly)
   - Caption boxes for scene transitions
   - Time/location indicators
   - Avoid explaining what can be shown
```

**Critical Rule**: Comics are a **visual medium**. Show through images and dialogue, minimize narration.

### 1.6 Mobile-First Design Philosophy

**Target Device**: Mobile phones in portrait orientation (95%+ of webtoon readers)

**Image Specifications:**
- **Aspect Ratio**: 9:16 (portrait, mobile-optimized)
- **Original Dimensions**: Provider-dependent (see [Image Specification](../image/image-specification.md))
  - Gemini: 576×1024 pixels
  - AI Server: 928×1664 pixels
- **Format**: PNG original, AVIF-only optimized variants
- **Optimization**: 2 AVIF variants per panel (50% and 100% of original size)
  - See [Image Optimization](../image/image-specification.md#part-iii-image-optimization) for complete details

**Panel Spacing** (Critical for Reading Rhythm):
- **Current**: 24px static spacing (Tailwind `space-y-6`)
- **Planned**: Dynamic 50-400px spacing based on narrative pacing
  - TIGHT (50px): Continuous action
  - STANDARD (100px): Default beat-to-beat
  - TRANSITION (200px): Shot type changes
  - SCENE_BREAK (400px): Major narrative breaks

---

## Part II: Data Model & Database Schema

### 2.1 Core Tables

#### 2.1.1 Scenes Table (Comic Status Fields)

**Purpose**: Track comic publishing status independently from text visibility

```typescript
// Database schema (src/lib/schemas/database/index.ts)
export const scenes = pgTable('scenes', {
  // ... existing scene fields (id, title, content, visibility, etc.) ...

  // Novel text publishing status
  novelStatus: status('novel_status')
    .default('draft')
    .notNull(),

  // Comic publishing status
  comicStatus: status('comic_status')
    .default('draft')
    .notNull(),

  // Publishing metadata
  publishedAt: timestamp('published_at'),
  publishedBy: text('published_by')
    .references(() => users.id),
  unpublishedAt: timestamp('unpublished_at'),
  unpublishedBy: text('unpublished_by')
    .references(() => users.id),

  comicPublishedAt: timestamp('comic_published_at'),
  comicPublishedBy: text('comic_published_by')
    .references(() => users.id),
  comicUnpublishedAt: timestamp('comic_unpublished_at'),
  comicUnpublishedBy: text('comic_unpublished_by')
    .references(() => users.id),

  // Generation metadata
  comicGeneratedAt: timestamp('comic_generated_at'),
  comicPanelCount: integer('comic_panel_count').default(0),
  comicVersion: integer('comic_version').default(1),
});

// Unified status enum (used for stories, novel_status, comic_status)
export const status = pgEnum('status', [
  'draft',      // Not published (private, author-only)
  'published'   // Published and visible to readers
]);
```

**Field Descriptions:**

| Field | Type | Purpose | Usage |
|-------|------|---------|-------|
| `novelStatus` | enum (status) | Novel text publishing state | Query filter for `/novels/{id}` |
| `comicStatus` | enum (status) | Comic panels publishing state | Query filter for `/comics/{id}` |
| `publishedAt` | timestamp | When novel text published | Display metadata |
| `publishedBy` | text | User who published novel text | Audit trail |
| `unpublishedAt` | timestamp | When novel text unpublished | Audit trail |
| `unpublishedBy` | text | User who unpublished novel text | Audit trail |
| `comicPublishedAt` | timestamp | When comic published | Display metadata |
| `comicPublishedBy` | text | User who published comic | Audit trail |
| `comicUnpublishedAt` | timestamp | When comic unpublished | Audit trail |
| `comicUnpublishedBy` | text | User who unpublished comic | Audit trail |
| `comicGeneratedAt` | timestamp | Comic generation time | Metadata |
| `comicPanelCount` | integer | Number of panels | Display info, existence check (0 = no comic) |
| `comicVersion` | integer | Regeneration version | Version tracking |

#### 2.1.2 Comic Panels Table

**Purpose**: Store sequential comic panel data with images and overlays

```typescript
export const comicPanels = pgTable('comic_panels', {
  id: text('id').primaryKey(),
  sceneId: text('scene_id')
    .references(() => scenes.id, { onDelete: 'cascade' })
    .notNull(),
  panelNumber: integer('panel_number').notNull(),

  // Visual composition
  shotType: shotTypeEnum('shot_type').notNull(),
  // 'establishing_shot' | 'wide_shot' | 'medium_shot' |
  // 'close_up' | 'extreme_close_up' | 'over_shoulder' | 'dutch_angle'

  // Image data (9:16 aspect ratio, provider-specific dimensions)
  imageUrl: text('image_url').notNull(),
  imageVariants: json('image_variants'), // 2 AVIF variants (1x + 2x)
  // See: ../image/image-specification.md for ImageVariants structure

  // Content overlays
  narrative: text('narrative'),  // Narrative text for panels without characters
  dialogue: json('dialogue').$type<DialogueItem[]>(),
  // [{ character_id, text, tone }]

  sfx: json('sfx').$type<SFXItem[]>(),
  // [{ text, emphasis: 'normal' | 'large' | 'dramatic' }]

  description: text('description'), // Visual description for AI generation

  // Metadata
  metadata: json('metadata'),
  // { prompt, characters_visible, camera_angle, mood, generated_at }

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Relations:**
- `scenes` → `comicPanels` (one-to-many)
- **Cascade delete**: Deleting scene removes all associated panels

**Indexes:**
```sql
CREATE INDEX idx_comic_panels_scene ON comic_panels(scene_id);
CREATE INDEX idx_comic_panels_order ON comic_panels(scene_id, panel_number);
```

### 2.2 JSON Field Structures

#### 2.2.1 DialogueItem

```typescript
interface DialogueItem {
  character_id: string;  // Links to characters table
  text: string;          // Max 150 characters
  tone?: string;         // 'calm' | 'angry' | 'excited' | 'sad' | etc.
}
```

**Example:**
```json
[
  {
    "character_id": "char_abc123",
    "text": "Behind you!",
    "tone": "urgent"
  },
  {
    "character_id": "char_def456",
    "text": "I know!",
    "tone": "confident"
  }
]
```

#### 2.2.2 SFXItem

```typescript
interface SFXItem {
  text: string;  // Sound effect text (e.g., "CRASH", "WHOOSH")
  emphasis: 'normal' | 'large' | 'dramatic';
}
```

**Example:**
```json
[
  {
    "text": "CRASH",
    "emphasis": "dramatic"
  }
]
```

#### 2.2.3 ImageVariants

**See**: [Image Specification - ImageVariants Structure](../image/image-specification.md#part-iii-image-optimization) for complete interface definition.

**Summary**: Contains 2 AVIF variants (mobile 1x and 2x) with URLs, dimensions, and metadata.

---

## Part III: Storage Architecture

### 3.1 Vercel Blob Structure

**Environment-Based Root Directory**:

```
{environment}/                    # Environment prefix (main/ or develop/)
  ├─ main/           (production: NODE_ENV=production)
  └─ develop/        (development: NODE_ENV=development)
```

**Purpose**: Isolate development and production blob storage

**Utility**: `getBlobPath()` automatically adds environment prefix
- `NODE_ENV=production` → Prefix: `main/`
- `NODE_ENV=development` → Prefix: `develop/`

**Full Storage Structure**:

```
{environment}/stories/{storyId}/
  ├── story/      # Story cover image (1 per story)
  ├── character/  # Character portraits (1 per character)
  ├── setting/    # Setting visuals (1 per setting)
  ├── scene/      # Scene illustrations for text reading (1 per scene)
  └── comics/     # Comic panels for comic reading ⭐
      └── {sceneId}/
          └── panel/
              ├── original/
              │   ├── panel-1.png  (9:16 portrait, original PNG)
              │   ├── panel-2.png
              │   └── panel-3.png
              └── avif/
                  ├── 464x832/       # Mobile 1x (unified dimensions)
                  │   ├── panel-1.avif
                  │   ├── panel-2.avif
                  │   └── panel-3.avif
                  └── 928x1664/      # Mobile 2x / Desktop (unified dimensions)
                      ├── panel-1.avif
                      ├── panel-2.avif
                      └── panel-3.avif
```

**URL Format Examples**:

```
Development Environment (NODE_ENV=development):

Original panel:
https://[blob].vercel-storage.com/develop/stories/3JpLd.../comics/s25AR.../panel/original/panel-1.png

AVIF variants (unified dimensions):
https://[blob].vercel-storage.com/develop/stories/3JpLd.../comics/s25AR.../panel/avif/464x832/panel-1.avif
https://[blob].vercel-storage.com/develop/stories/3JpLd.../comics/s25AR.../panel/avif/928x1664/panel-1.avif

Production Environment (NODE_ENV=production):

Original panel:
https://[blob].vercel-storage.com/main/stories/3JpLd.../comics/s25AR.../panel/original/panel-1.png

AVIF variants (unified dimensions):
https://[blob].vercel-storage.com/main/stories/3JpLd.../comics/s25AR.../panel/avif/464x832/panel-1.avif
https://[blob].vercel-storage.com/main/stories/3JpLd.../comics/s25AR.../panel/avif/928x1664/panel-1.avif
```

**Design Principles:**
- **Environment isolation**: `main/` (production) vs `develop/` (development) root prefixes
- **Flat structure** for single images (story/, character/, scene/)
- **Nested structure** for multi-image content (comics/{sceneId}/)
- **Semantic clarity**: comics treated as distinct content type
- **Unified dimensions**: 464×832 (1x) and 928×1664 (2x) for all 9:16 panels
- **AVIF-only variants**: Optimal mobile performance (93.8% browser support)
- **Automatic path resolution**: `getBlobPath()` utility handles environment prefixes

**Complete Documentation**: See [Image Storage Architecture](../image/image-specification.md#part-iv-storage--delivery) for:
- Environment-based routing logic
- Provider-agnostic variant generation
- Placeholder fallback strategies
- CDN caching configuration

---

## Part IV: Publishing & Reading Workflows

### 4.1 User Flow: Text First, Comics Later

```
┌────────────────────────────────────────────────────────────┐
│                 TYPICAL AUTHOR WORKFLOW                     │
└────────────────────────────────────────────────────────────┘

1. Author writes scene text (Studio)
   └─> novel_status: 'draft'

2. Publish scene text
   └─> novel_status: 'published'
   └─> Text appears at /novels/[storyId]

3. Generate comic panels (Studio → Comic Panel Generator)
   └─> comic_status: 'draft', comic_panel_count: N
   └─> 8-12 panels generated (~8-15 min)

4. Preview comic panels in Studio
   └─> Review panel quality
   └─> Check dialogue placement
   └─> Verify character consistency

5. Publish comic
   └─> comic_status: 'published'
   └─> Comics appear at /comics/[storyId]

6. Readers can choose format
   ├─> /novels/[storyId] - Traditional text reading
   └─> /comics/[storyId] - Visual comic reading
```

### 4.2 Query Patterns by Route

#### 4.2.1 Novel Reading (`/novels/[id]`)

**Shows**: Text content + scene illustrations

```typescript
const scenes = await db.query.scenes.findMany({
  where: and(
    eq(scenes.chapterId, chapterId),
    eq(scenes.novelStatus, 'published'),
  ),
  columns: {
    id: true,
    title: true,
    content: true,      // ✅ Text content
    imageUrl: true,     // ✅ Scene illustration
    imageVariants: true,
    comicStatus: false, // Not needed for novel view
  },
  orderBy: [asc(scenes.orderIndex)],
});
```

#### 4.2.2 Comic Reading (`/comics/[id]`)

**Shows**: Comic panels only (no text content)

```typescript
const scenes = await db.query.scenes.findMany({
  where: and(
    eq(scenes.chapterId, chapterId),
    eq(scenes.novelStatus, 'published'),
    eq(scenes.comicStatus, 'published'), // ✅ Only published comics
    gt(scenes.comicPanelCount, 0), // ✅ Only scenes with comic panels
  ),
  with: {
    comicPanels: {
      orderBy: [asc(comicPanels.panelNumber)],
    },
  },
  columns: {
    id: true,
    title: true,
    content: false,     // Don't show text content
    imageUrl: false,    // Don't show scene illustration
    comicPanelCount: true,
  },
});
```

#### 4.2.3 Studio Management (`/studio/edit/[chapterId]`)

**Shows**: Both text and comic status with independent controls

```typescript
const scene = await db.query.scenes.findFirst({
  where: eq(scenes.id, sceneId),
  with: {
    comicPanels: true, // Include all panels for preview
  },
});

// UI displays:
// - Novel text publishing controls (novel_status: draft/published)
// - Comic publishing controls (comic_status: draft/published)
// - "Generate Comic Panels" button (if comic_panel_count = 0)
// - "Preview Comics" button (if comic_status = 'draft')
// - "Publish Comics" button (if comic_status = 'draft')
// - "Unpublish Comics" button (if comic_status = 'published')
```

### 4.3 Benefits of Independent Publishing

**Flexibility:**
- ✅ Publish text immediately while comics are being generated
- ✅ Preview and refine comics before making them public
- ✅ Support different reader preferences (text vs visual)
- ✅ A/B test engagement between formats

**Clear Separation:**
- ✅ `/novels/{id}` - Pure text reading experience
- ✅ `/comics/{id}` - Pure visual comic experience
- ✅ No UI confusion about viewing mode

**Scalable Architecture:**
- ✅ Easy to add comic versioning (regenerate panels)
- ✅ Can support multiple comic styles per scene
- ✅ Can add layout options (webtoon vs traditional)

---

## Part V: Technical Specifications

### 5.1 Image Generation

**Image Type**: `comic-panel` (9:16 portrait aspect ratio)

**AI Providers**:
- **Gemini 2.5 Flash Image**: 576×1024 pixels (default)
- **AI Server (Qwen-Image)**: 928×1664 pixels (optional)

**Generation Process**:
- **Format**: PNG (original)
- **Quality**: Standard
- **Generation Time**: ~20-25 seconds per panel (Gemini), ~5-10 seconds (AI Server)
- **Automatic Optimization**: 2 AVIF variants generated after each panel

**Complete Specifications**: See [Image Specification](../image/image-specification.md) for:
- Provider configuration
- Dimension details
- Optimization pipeline
- Performance benchmarks

### 5.2 Panel Count Guidelines

**Target Range**: 8-12 panels per scene (DEFAULT: 10 panels)

**Panel Count by Scene Type:**

| Scene Type | Min | Target | Max | Rationale |
|------------|-----|--------|-----|-----------|
| Quiet/Reflective | 8 | 9 | 10 | Minimal dialogue, contemplative |
| Dialogue-Heavy | 8 | 9 | 10 | Conversation focus |
| Balanced Narrative | 8 | 10 | 11 | Standard storytelling |
| Action Sequence | 10 | 11 | 12 | Dynamic movement, multiple beats |
| Complex Scene | 10 | 11 | 12 | Multiple characters, location changes |

**Professional Context** (WEBTOON standards):
- **Canvas Creators** (independent): 20-50 panels/week sustainable
- **Originals Teams** (paid): 30-70 panels/week
- **Fictures**: 8-12 panels per scene = 1-2 key story beats (industry standard)

### 5.3 Typography Standards

**For 800px Export Width** (future portrait format):

```typescript
const TYPOGRAPHY_CONFIG = {
  // Dialogue bubbles
  dialogue: {
    fontSize: '18px',           // 18-20px range (minimum 16px)
    fontFamily: '"Comic Sans MS", sans-serif',
    lineHeight: 1.3,
    maxBubblesPerPanel: 3,
    maxWordsPerBubble: 25,
    maxCharsPerBubble: 150,
    padding: '12px 16px',
    bubbleColor: 'white',
    bubbleBorder: '2px solid black',
    textColor: 'black',
  },

  // Narrative captions (use sparingly <5%)
  narrative: {
    fontSize: '16px',
    fontFamily: 'system-ui, sans-serif',
    lineHeight: 1.4,
    maxCharsPerCaption: 100,
    padding: '8px 12px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    textColor: 'white',
  },

  // Sound effects (SFX)
  sfx: {
    fontSize: {
      normal: '20px',
      large: '28px',
      dramatic: '36px',
    },
    fontFamily: '"Impact", sans-serif',
    fontWeight: 'bold',
    textStroke: '2px black',
    textColor: 'white',
  },
};
```

---

## Part VI: Future Optimization Roadmap

### 6.1 Critical Improvements Planned

**1. Portrait Aspect Ratio (✅ IMPLEMENTED)**

**Status**: Comic panels now use 9:16 portrait aspect ratio
- **Gemini**: 576×1024 pixels
- **AI Server**: 928×1664 pixels
- **Mobile Coverage**: 82% screen coverage on iPhone (9:16 panel scaled to 390px width)

**Impact**: Optimized for 95%+ of webtoon readers on mobile devices in portrait orientation.

**2. Dynamic Panel Spacing (Critical)**

**Current**: 24px static spacing
**Planned**: 50-400px dynamic spacing based on narrative pacing

```typescript
const PANEL_SPACING = {
  TIGHT: 50,        // Continuous action
  STANDARD: 100,    // Default beat-to-beat
  TRANSITION: 200,  // Shot type changes
  SCENE_BREAK: 400, // Major narrative breaks
};
```

**Why**: Space = Time in vertical scroll webtoons. Current spacing breaks webtoon pacing grammar.

### 6.2 Genre-Aware Panel Targeting

```typescript
const PANEL_COUNT_BY_GENRE = {
  'romance': { min: 8, target: 9, max: 10 },      // Dialogue-heavy
  'action': { min: 10, target: 11, max: 12 },     // Dynamic sequences
  'thriller': { min: 10, target: 11, max: 12 },   // Tension building
  'slice-of-life': { min: 8, target: 9, max: 10 }, // Quiet moments
};
```

---

## Conclusion

The comics generation system transforms prose narratives into mobile-optimized visual storytelling through:

1. **Toonplay Conversion**: Structured adaptation of prose to visual panels
2. **Panel Generation**: AI-generated images with optimized variants
3. **Independent Publishing**: Separate text and comic publishing workflows
4. **Mobile-First Design**: Vertical scroll format with responsive images

**Next Steps:**
- See `comics-development.md` for API specifications and implementation details
- See `comics-evaluation.md` for quality metrics and testing strategies

**Related Systems:**
- **Source narratives**: `../novels/novels-specification.md` (Adversity-Triumph Engine)
- **Image generation**: `../image/image-specification.md` (Dual-provider support, aspect ratios)
- **Image optimization**: `../image/image-specification.md#part-iii-image-optimization` (AVIF-only, 2 variants)
- **Image evaluation**: `../image/image-evaluation.md` (Quality metrics, performance benchmarks)
- **Image development**: `../image/image-development.md` (API specifications, implementation)
