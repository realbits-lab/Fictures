# Comics Generation System

## Overview

The comics generation system converts narrative scene text into sequential visual comic panels optimized for vertical-scroll mobile reading. Each scene is transformed into 8-12 comic panels with AI-generated images, dialogue overlays, and sound effects.

**Format**: Mobile-first vertical scrolling with 7:4 landscape panels (1344×768 pixels)
**Terminology**: We use "toonplay" instead of "screenplay" because toonplay focuses on dialogue and images (perfect for comics), while screenplay focuses on sound and video (for films).

---

## Technology Stack

### Current Implementation

- **Text-to-Toonplay**: Google Gemini 2.5 Flash Lite (via Vercel AI SDK Gateway)
- **Image Generation**: Google Gemini 2.5 Flash Image
- **Image Format**: 1344×768 pixels (7:4 aspect ratio = 1.75:1)
- **Optimization**: 4 variants (AVIF + JPEG × 2 sizes: mobile 1x, mobile 2x)
- **Storage**: Vercel Blob Storage
- **Database**: PostgreSQL (Neon) with Drizzle ORM

### Performance

- **Generation Time**: ~8-15 minutes per scene (8-12 panels)
- **Per Panel**: ~20-25 seconds (AI generation + upload + optimization)
- **Storage**: ~350KB per original panel (30% smaller than DALL-E 3)
- **Optimized Delivery**: ~3.5-5.5MB per scene (4 variants × 8-12 panels)

---

## Generation Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                  INPUT: Scene Narrative                      │
│  • scene.content (prose, 500-1500 words)                    │
│  • Characters, settings, emotional arc                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              STEP 1: Toonplay Conversion                     │
│  AI analyzes narrative and generates panel specifications:  │
│  • Panel count (8-12 panels per scene)                      │
│  • Shot types (establishing, wide, medium, close-up)        │
│  • Camera angles, character poses                           │
│  • Dialogue extraction                                      │
│  • Sound effects (SFX)                                      │
│  • Visual descriptions for image generation                 │
│                                                             │
│  Model: Google Gemini 2.5 Flash Lite via AI SDK Gateway    │
│  Output: Structured ComicToonplay JSON                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              STEP 2: Panel Image Generation                  │
│  For each panel specification:                             │
│  1. Build detailed image prompt from toonplay              │
│  2. Generate image via Gemini 2.5 Flash (1344×768)        │
│  3. Create 4 optimized variants (AVIF/JPEG × 2 sizes)     │
│  4. Upload all images to Vercel Blob Storage               │
│  5. Store panel data in PostgreSQL                         │
│                                                             │
│  Model: Google Gemini 2.5 Flash Image                      │
│  Optimization: 4 variants (mobile-first approach)          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                OUTPUT: Comic Panels                        │
│  • Array of ComicPanel objects in database                 │
│  • Images stored in Vercel Blob                            │
│  • Ready for vertical-scroll comic reader                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Comic Panels Table

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
  narrative: text('narrative'), // Narrative text for panels without characters
  dialogue: json('dialogue').$type<DialogueItem[]>(),
  // [{ character_id, text, tone }]

  sfx: json('sfx').$type<SFXItem[]>(),
  // [{ text, emphasis: 'normal' | 'large' | 'dramatic' }]

  description: text('description'), // Visual description

  // Metadata
  metadata: json('metadata'),
  // { prompt, characters_visible, camera_angle, mood, generated_at }

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Important**: Database uses different column names than HNS interface:
- Scenes: `title` (DB) → `scene_title` (HNS), `order_index` (DB) → `scene_number` (HNS)
- Chapters: `title` (DB) → `chapter_title` (HNS), `order_index` (DB) → `chapter_number` (HNS)
- Parts: `title` (DB), `order_index` (DB)

**Field Mapping**: The API layer maps database columns to HNS interface fields automatically.

**Relations:**
- `scenes` → `comicPanels` (one-to-many)
- Cascade delete: Deleting scene removes all panels

**Indexes:**
```sql
CREATE INDEX idx_comic_panels_scene ON comic_panels(scene_id);
CREATE INDEX idx_comic_panels_order ON comic_panels(scene_id, panel_number);
```

---

## Storage Architecture

### Vercel Blob Structure

```
stories/{storyId}/
  ├── story/      # Story cover (1 per story)
  ├── character/  # Character portraits (1 per character)
  ├── setting/    # Setting visuals (1 per setting)
  ├── scene/      # Scene illustrations for text reading (1 per scene)
  └── comics/     # Comic panels for comic reading
      └── {sceneId}/
          ├── panel-1.png  (1344×768 original)
          ├── panel-2.png
          └── panel-3.png
```

**Optimized Variants** (4 per panel):
```
AVIF: 672×384, 1344×768
JPEG: 672×384, 1344×768
```

**URL Format:**
```
Original:
https://[blob].vercel-storage.com/stories/{storyId}/comics/{sceneId}/panel-1.png

Optimized:
https://[blob].vercel-storage.com/stories/{storyId}/comics/{sceneId}/avif/672x384/panel-1.avif
https://[blob].vercel-storage.com/stories/{storyId}/comics/{sceneId}/avif/1344x768/panel-1.avif
https://[blob].vercel-storage.com/stories/{storyId}/comics/{sceneId}/jpeg/672x384/panel-1.jpeg
https://[blob].vercel-storage.com/stories/{storyId}/comics/{sceneId}/jpeg/1344x768/panel-1.jpeg
```

---

## API Endpoints

### Generate Comic Panels

**Endpoint:** `POST /api/scenes/[id]/comic/generate`

**Purpose:** Generate comic panels from scene narrative

**Request:**
```json
{
  "targetPanelCount": 10,  // Optional: 8-12 (default: 10)
  "regenerate": false      // Optional: overwrite existing panels
}
```

**Response** (Server-Sent Events):
```typescript
// Progress updates
data: {"type":"progress","current":10,"total":100,"status":"Converting scene to toonplay..."}
data: {"type":"progress","current":20,"total":100,"status":"Generating panel 1/10: establishing_shot"}
data: {"type":"progress","current":90,"total":100,"status":"Generating panel 10/10: close_up"}
data: {"type":"progress","current":100,"total":100,"status":"Panel generation complete!"}

// Final result
data: {"type":"complete","result":{ toonplay, panels, metadata }}
```

**Authentication:** NextAuth.js session or API key with `ai:use` scope

**Error Handling:**
- 401: Unauthorized (no session/API key)
- 403: Access denied (not story owner or admin)
- 404: Scene not found
- 400: Invalid targetPanelCount (must be 8-12)
- 500: Generation error

### Get Scene Panels

**Endpoint:** `GET /api/scenes/[id]/comic/panels`

**Response:**
```json
{
  "sceneId": "s25ARzn_TttzuO9r5lvX3",
  "totalPanels": 10,
  "panels": [
    {
      "id": "panel_abc123",
      "panelNumber": 1,
      "shotType": "establishing_shot",
      "imageUrl": "https://...",
      "imageVariants": { variants: [...] },
      "dialogue": [{ "character_id": "char_001", "text": "..." }],
      "sfx": [{ "text": "CRASH", "emphasis": "dramatic" }]
    },
    // ... panels 2-10
  ]
}
```

---

## Frontend Usage

### Comic Reader Component

```tsx
// src/components/comic/ComicViewer.tsx
'use client';

import { PanelRenderer } from './PanelRenderer';

export function ComicViewer({ sceneId }: { sceneId: string }) {
  const [panels, setPanels] = useState([]);

  useEffect(() => {
    fetch(`/api/scenes/${sceneId}/comic/panels`)
      .then(res => res.json())
      .then(data => setPanels(data.panels));
  }, [sceneId]);

  return (
    <div className="comic-container max-w-[1344px] mx-auto space-y-6">
      {panels.map((panel) => (
        <PanelRenderer key={panel.id} panel={panel} />
      ))}
    </div>
  );
}
```

### Panel Renderer

```tsx
// src/components/comic/PanelRenderer.tsx
'use client';

import Image from 'next/image';
import { DialogueBubble } from './DialogueBubble';

export function PanelRenderer({ panel }) {
  return (
    <div className="relative w-full aspect-video">
      {/* Base panel image */}
      <Image
        src={panel.imageUrl}
        alt={panel.shotType}
        width={1344}
        height={768}
        className="w-full h-auto"
      />

      {/* Dialogue bubbles overlay */}
      {panel.dialogue?.map((d, i) => (
        <DialogueBubble key={i} {...d} />
      ))}

      {/* Sound effects overlay */}
      {panel.sfx?.map((sfx, i) => (
        <SFXText key={i} {...sfx} />
      ))}
    </div>
  );
}
```

---

## Generation Process Flow

### Toonplay Conversion

**Input:** Scene narrative text (prose)

**AI Instructions:**
1. Break narrative into 8-12 visual panels (TARGET: 10 panels)
   - More panels (10-12) for complex action sequences
   - Fewer panels (8-9) for quiet, reflective moments
2. Each panel must SHOW action (minimize narration)
3. Use varied shot types for visual interest
4. Maintain character consistency across panels
5. Extract dialogue (max 2-3 bubbles per panel, 150 chars each)
6. Add sound effects for impactful moments

**Output Schema:**
```typescript
interface ComicToonplay {
  scene_id: string;
  scene_title: string;
  total_panels: number;  // 8-12 (default: 10)
  panels: [
    {
      panel_number: number;
      shot_type: ShotType;
      description: string;  // Visual description for AI
      characters_visible: string[];
      character_poses: { [character_id]: string };
      setting_focus: string;
      lighting: string;
      camera_angle: string;
      dialogue: [{ character_id, text, tone }];
      sfx: [{ text, emphasis }];
      mood: string;
    }
  ];
}
```

### Image Generation

**Per Panel:**
1. Build detailed prompt from toonplay
2. Include character consistency references
3. Specify camera angle and composition
4. Generate via Gemini 2.5 Flash (1344×768)
5. Create 4 optimized variants
6. Upload to Vercel Blob
7. Store panel in database

**Prompt Template:**
```
Professional {genre} comic panel, {shot_type}, {camera_angle}.

SCENE: {setting_focus}. {atmosphere}.

CHARACTERS: {character_descriptions_with_poses}

LIGHTING: {lighting}

ACTION: {description}

MOOD: {mood}

Style: Clean comic linework, vibrant colors, semi-realistic proportions,
7:4 landscape format (1344×768), professional {genre} comic art style.
```

---

## User Flows

### Flow 1: Generate Comics from Studio

```
1. Author navigates to scene in Studio
2. Click "Generate Comic Panels" button
3. System converts narrative to toonplay (15-30s)
4. System generates 8-12 panel images (~3-5 minutes)
5. Panels saved to database with status: draft
6. Author reviews panels in preview
7. Author publishes comic (comicStatus: published)
8. Comics visible at /comics/[storyId]
```

### Flow 2: Read Comics

```
1. Reader navigates to /comics/[storyId]
2. System loads all scenes with comicStatus: 'published'
3. ComicViewer renders panels vertically
4. Reader scrolls through panels
5. Dialogue bubbles and SFX overlay images
6. Static spacing (24px) between panels provides reading rhythm
```

---

## Component Architecture

### File Structure

```
src/
├── lib/
│   ├── ai/
│   │   ├── comic-panel-generator.ts      # Main orchestrator
│   │   └── toonplay-converter.ts         # Narrative → Toonplay
│   ├── services/
│   │   ├── image-generation.ts           # Gemini 2.5 Flash wrapper
│   │   ├── image-optimization.ts         # 4-variant generation
│   │   └── comic-layout.ts               # Layout calculations
│   └── db/
│       └── schema.ts                      # comicPanels table
├── app/
│   └── api/
│       └── scenes/
│           └── [id]/
│               └── comic/
│                   ├── generate/route.ts # POST generation
│                   └── panels/route.ts   # GET panels
└── components/
    └── comic/
        ├── ComicViewer.tsx               # Vertical scroll reader
        ├── PanelRenderer.tsx             # Individual panel
        ├── DialogueBubble.tsx            # Speech bubble overlay
        └── comic-panel-generator-button.tsx  # Studio UI
```

---

## Related Documentation

- **Architecture**: `docs/comics/comics-architecture.md` - Publishing system
- **Database Optimization**: `docs/comics/comic-database-optimization.md`
- **Image Optimization**: `docs/image-optimization.md` - 4-variant system
- **Storage Guide**: `docs/comics/comics-architecture.md` - Blob structure
