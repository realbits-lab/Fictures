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
│  └─ visibility = 'public'       └─ comicStatus = 'published'│
│                                                             │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                  INDEPENDENT PUBLISHING                     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Scene Text (visibility)        Comic Panels (comicStatus)  │
│  ├─ draft                       ├─ none (no panels exist)   │
│  ├─ public                      ├─ draft (generated)        │
│  └─ private                     └─ published (visible)      │
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
  │   ├─ Generate image (1344×768, 7:4 ratio)
  │   ├─ Create 4 optimized variants (AVIF/JPEG × 2 sizes)
  │   ├─ Upload to Vercel Blob Storage
  │   └─ Save panel data to database
  └─ Model: Gemini 2.5 Flash Image

         ↓

PHASE 3: Database Storage
  ├─ Save comicPanels records (ordered by panelNumber)
  ├─ Update scene: comicStatus = 'draft'
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
- **Current**: 1344×768 pixels (7:4 landscape ratio)
- **Format**: PNG original, AVIF/JPEG optimized variants
- **Optimization**: 4 variants per panel
  - Mobile 1x: 672×384 pixels
  - Mobile 2x: 1344×768 pixels (original used)
  - Formats: AVIF (best compression), JPEG (fallback)

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

  // Comic publishing status
  comicStatus: comicStatusEnum('comic_status')
    .default('none')
    .notNull(),

  // Publishing metadata
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

// Comic status enum
export const comicStatusEnum = pgEnum('comic_status', [
  'none',      // No comic panels exist
  'draft',     // Panels generated but not published
  'published'  // Panels are public and visible
]);
```

**Field Descriptions:**

| Field | Type | Purpose | Usage |
|-------|------|---------|-------|
| `comicStatus` | enum | Publishing state | Query filter for `/comics/{id}` |
| `comicPublishedAt` | timestamp | When published | Display metadata |
| `comicPublishedBy` | text | User who published | Audit trail |
| `comicUnpublishedAt` | timestamp | When unpublished | Audit trail |
| `comicUnpublishedBy` | text | User who unpublished | Audit trail |
| `comicGeneratedAt` | timestamp | Generation time | Metadata |
| `comicPanelCount` | integer | Number of panels | Display info |
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

  // Image data (1344×768, 7:4 aspect ratio)
  imageUrl: text('image_url').notNull(),
  imageVariants: json('image_variants'), // 4 variants (AVIF/JPEG × 2 sizes)

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

```typescript
interface ImageVariants {
  imageId: string;
  originalUrl: string;
  variants: ImageVariant[];
  generatedAt: string;
}

interface ImageVariant {
  url: string;
  format: 'avif' | 'jpeg';
  width: number;
  height: number;
}
```

---

## Part III: Storage Architecture

### 3.1 Vercel Blob Structure

```
stories/{storyId}/
  ├── story/      # Story cover image (1 per story)
  ├── character/  # Character portraits (1 per character)
  ├── setting/    # Setting visuals (1 per setting)
  ├── scene/      # Scene illustrations for text reading (1 per scene)
  └── comics/     # Comic panels for comic reading ⭐
      └── {sceneId}/
          ├── panel-1.png  (1344×768, 7:4 ratio, original)
          ├── panel-2.png
          ├── panel-3.png
          └── panel/       # Optimized variants directory
              ├── avif/
              │   ├── 672x384/{imageId}.avif    (mobile 1x)
              │   └── 1344x768/{imageId}.avif   (mobile 2x)
              └── jpeg/
                  ├── 672x384/{imageId}.jpeg    (mobile 1x)
                  └── 1344x768/{imageId}.jpeg   (mobile 2x)
```

**URL Format Examples:**

```
Original panel:
https://[blob].vercel-storage.com/stories/3JpLd.../comics/s25AR.../panel-1.png

Optimized variants:
https://[blob].vercel-storage.com/stories/3JpLd.../comics/s25AR.../panel/avif/672x384/[id].avif
https://[blob].vercel-storage.com/stories/3JpLd.../comics/s25AR.../panel/avif/1344x768/[id].avif
https://[blob].vercel-storage.com/stories/3JpLd.../comics/s25AR.../panel/jpeg/672x384/[id].jpeg
https://[blob].vercel-storage.com/stories/3JpLd.../comics/s25AR.../panel/jpeg/1344x768/[id].jpeg
```

**Design Principles:**
- **Flat structure** for single images (story/, character/, scene/)
- **Nested structure** for multi-image content (comics/{sceneId}/)
- **Semantic clarity** - comics treated as distinct content type
- **Optimized variants** under `panel/` subdirectory for responsive loading

---

## Part IV: Publishing & Reading Workflows

### 4.1 User Flow: Text First, Comics Later

```
┌────────────────────────────────────────────────────────────┐
│                 TYPICAL AUTHOR WORKFLOW                     │
└────────────────────────────────────────────────────────────┘

1. Author writes scene text (Studio)
   └─> visibility: 'draft'

2. Publish scene text
   └─> visibility: 'public'
   └─> Text appears at /novels/[storyId]

3. Generate comic panels (Studio → Comic Panel Generator)
   └─> comicStatus: 'draft'
   └─> 8-12 panels generated (~8-15 min)

4. Preview comic panels in Studio
   └─> Review panel quality
   └─> Check dialogue placement
   └─> Verify character consistency

5. Publish comic
   └─> comicStatus: 'published'
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
    eq(scenes.visibility, 'public'),
    // Don't filter by comicStatus - show text if scene is public
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
    eq(scenes.visibility, 'public'),
    eq(scenes.comicStatus, 'published'), // ✅ Only published comics
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
// - Text publishing controls (visibility: draft/public/private)
// - Comic publishing controls (comicStatus: none/draft/published)
// - "Generate Comic Panels" button (if none)
// - "Preview Comics" button (if draft)
// - "Publish Comics" button (if draft)
// - "Unpublish Comics" button (if published)
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

**Model**: Google Gemini 2.5 Flash Image (via Google AI API)

**Specifications:**
- **Dimensions**: 1344×768 pixels
- **Aspect Ratio**: 7:4 (1.75:1) landscape
- **Format**: PNG (original)
- **Quality**: Standard
- **Generation Time**: ~20-25 seconds per panel

**Optimization** (Automatic):
- **Variants**: 4 per panel
- **Formats**: AVIF (best compression), JPEG (universal fallback)
- **Sizes**: Mobile 1x (672×384), Mobile 2x (1344×768)
- **Process**: Automatic after each panel generation

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

**1. Portrait Aspect Ratio (High Priority)**

**Current**: 1344×768 (7:4 landscape) - Not mobile-optimized
**Planned**: 800×1143 (7:10 portrait) - Fills mobile screens naturally

**Why**: 95%+ of webtoon readers use mobile devices in portrait orientation.

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
- Source narratives: `../novels/novels-specification.md` (Adversity-Triumph Engine)
- Image system: `../image/image-architecture.md` (Gemini 2.5 Flash + optimization)
