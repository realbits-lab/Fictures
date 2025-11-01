---
title: "Comics Architecture"
---

# Comics Architecture

## Overview

Fictures supports independent publishing of text content and comic panels. Stories can be read in two formats:
- **Novels** (`/novels/[id]`) - Traditional text reading with scene illustrations
- **Comics** (`/comics/[id]`) - Visual storytelling with sequential comic panels

Text and comics have independent publishing workflows, allowing authors to:
- Publish text immediately while comics are being generated
- Preview comics before making them public
- Track engagement for each format separately

---

## Database Schema

### Scenes Table (Comic Status Fields)

```typescript
export const scenes = pgTable('scenes', {
  // ... existing scene fields ...

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
```

### Comic Status Enum

```typescript
export const comicStatusEnum = pgEnum('comic_status', [
  'none',      // No comic panels exist
  'draft',     // Comic panels generated but not published
  'published'  // Comic panels are public and visible
]);
```

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

  // Image data (1344×768, 7:4 ratio from Gemini 2.5 Flash)
  imageUrl: text('image_url').notNull(),
  imageVariants: json('image_variants'), // 4 variants: AVIF + JPEG × 2 sizes

  // Content overlays
  narrative: text('narrative'), // Narrative text for panels without characters
  dialogue: json('dialogue').$type<DialogueItem[]>(),
  sfx: json('sfx').$type<SFXItem[]>(),
  description: text('description'), // Visual description

  // Metadata
  metadata: json('metadata'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Relations:**
- `scenes` → `comicPanels` (one-to-many)
- Cascade delete: Deleting a scene removes all associated comic panels

---

## Storage Architecture

### Vercel Blob Structure

```
stories/{storyId}/
  ├── story/      # Story cover image (1 per story)
  ├── character/  # Character portraits (1 per character)
  ├── setting/    # Setting visuals (1 per setting)
  ├── scene/      # Scene illustrations for text reading (1 per scene)
  └── comics/     # Comic panels for comic reading ⭐
      └── {sceneId}/
          ├── panel-1.png  (1344×768, 7:4 ratio)
          ├── panel-2.png
          ├── panel-3.png
          └── panel/       # Optimized variants directory
              ├── original/
              │   └── {imageId}.png
              ├── avif/
              │   ├── 672x384/{imageId}.avif
              │   └── 1344x768/{imageId}.avif
              └── jpeg/
                  ├── 672x384/{imageId}.jpeg
                  └── 1344x768/{imageId}.jpeg
```

**URL Format:**
```
Original panels:
https://[blob].vercel-storage.com/stories/3JpLd.../comics/s25AR.../panel-1.png

Optimized variants:
https://[blob].vercel-storage.com/stories/3JpLd.../comics/s25AR.../panel/avif/672x384/[id].avif
https://[blob].vercel-storage.com/stories/3JpLd.../comics/s25AR.../panel/jpeg/1344x768/[id].jpeg
```

**Design Principles:**
- **Flat structure** for single images (story/, character/, scene/)
- **Nested structure** for multi-image content (comics/{sceneId}/)
- **Optimized variants** under `panel/` subdirectory within scene folder
- **Semantic clarity** - comics treated as distinct content type, not "scene images"

---

## API Endpoints

### 1. Generate Comic Panels

**Endpoint:** `POST /api/scenes/[id]/comic/generate`

**Purpose:** Generate comic panels from scene text content

**Process:**
1. Fetch scene content and context
2. Use AI to split scene into panels (8-12 panels typical)
3. Generate images for each panel (Gemini 2.5 Flash, 1344×768, 7:4 ratio)
4. Extract dialogue and sound effects
5. Save panels to `comic_panels` table
6. Update scene: `comicStatus: 'draft'`

**Response:**
```json
{
  "success": true,
  "comicStatus": "draft",
  "panelCount": 10,
  "panels": [...]
}
```

### 2. Publish Comic

**Endpoint:** `POST /api/scenes/[id]/comic/publish`

**Purpose:** Make comic panels publicly visible

**Validation:**
- Verifies comic panels exist
- Checks scene ownership

**Updates:**
```typescript
{
  comicStatus: 'published',
  comicPublishedAt: new Date(),
  comicPublishedBy: userId,
  comicPanelCount: panelCount
}
```

### 3. Unpublish Comic

**Endpoint:** `POST /api/scenes/[id]/comic/unpublish`

**Purpose:** Revert comic to draft status

**Updates:**
```typescript
{
  comicStatus: 'draft',
  comicUnpublishedAt: new Date(),
  comicUnpublishedBy: userId
}
```

---

## Frontend Routes & Queries

### Novel Reading (`/novels/[id]`)

**Shows:** Text content + scene illustrations

**Query Pattern:**
```typescript
const scenes = await db.query.scenes.findMany({
  where: and(
    eq(scenes.chapterId, chapterId),
    eq(scenes.visibility, 'public'),
    // Don't filter by comicStatus - text shown if scene is public
  ),
  columns: {
    id: true,
    title: true,
    content: true,      // ✅ Text content
    imageUrl: true,     // ✅ Scene illustration
    imageVariants: true,
    comicStatus: false, // Not needed
  },
  orderBy: [asc(scenes.orderIndex)],
});
```

### Comic Reading (`/comics/[id]`)

**Shows:** Comic panels only

**Query Pattern:**
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
    content: false,     // Don't show text
    imageUrl: false,    // Don't show scene illustration
    comicPanelCount: true,
  },
});
```

### Studio Management (`/studio/edit/[chapterId]`)

**Shows:** Both text and comic status with independent controls

**Query Pattern:**
```typescript
const scene = await db.query.scenes.findFirst({
  where: eq(scenes.id, sceneId),
  with: {
    comicPanels: true,
  },
});
```

---

## UI Components

### ComicStatusCard

**Location:** `src/components/comic/comic-status-card.tsx`

**Props:**
```typescript
interface ComicStatusCardProps {
  sceneId: string;
  comicStatus: 'none' | 'draft' | 'published';
  comicPanelCount?: number;
  comicPublishedAt?: string | null;
  comicGeneratedAt?: string | null;
  onStatusChange?: () => void;
}
```

**UI States:**

1. **None** - No panels generated
   - Shows help text
   - "Generate comic panels first to enable publishing"

2. **Draft** - Panels generated, not published
   - Shows panel count and generated date
   - Buttons: "Publish Comic" + "Regenerate"
   - Message: "Preview your comic before publishing"

3. **Published** - Panels are public
   - Shows panel count, generated date, published date
   - Button: "Unpublish Comic"
   - Message: "Comic is visible at /comics/[id]"

**Usage in Studio:**
```tsx
<ComicStatusCard
  sceneId={sceneId}
  comicStatus={scene.comicStatus}
  comicPanelCount={scene.comicPanelCount}
  comicPublishedAt={scene.comicPublishedAt}
  comicGeneratedAt={scene.comicGeneratedAt}
  onStatusChange={() => mutate()}
/>
```

---

## User Flows

### Flow 1: Text First, Comics Later

```
1. Author writes scene text
2. Publish text (visibility: 'public')
   → Text appears at /novels/[storyId]
3. Click "Generate Comic Panels"
   → Status: comicStatus: 'draft'
4. Preview comic panels in Studio
5. Click "Publish Comic"
   → Status: comicStatus: 'published'
   → Comics appear at /comics/[storyId]
```

### Flow 2: Both Together

```
1. Generate complete story (text + comics)
2. Publish text independently
   → Visible at /novels/[storyId]
3. Publish comics independently
   → Visible at /comics/[storyId]
4. Users can choose preferred format
```

### Flow 3: Comics Only

```
1. Generate comic panels
2. Keep text as draft/private (visibility: 'draft')
3. Publish comics (comicStatus: 'published')
   → Comics-only reading at /comics/[storyId]
```

---

## Process Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   COMIC GENERATION WORKFLOW                  │
└─────────────────────────────────────────────────────────────┘

1. GENERATE
   POST /api/scenes/[id]/comic/generate
   │
   ├─> Fetch scene content
   ├─> AI splits into 8-12 panels (typical)
   ├─> Generate images (Gemini 2.5 Flash, 1344×768, 7:4)
   ├─> Extract dialogue & SFX
   ├─> Save to comic_panels table
   └─> Update scene: comicStatus = 'draft'

2. DRAFT STATE
   comicStatus: 'draft'
   │
   ├─> Author previews in Studio
   ├─> Not visible at /comics/[id]
   └─> Can regenerate if needed

3. PUBLISH
   POST /api/scenes/[id]/comic/publish
   │
   ├─> Verify panels exist
   ├─> Update: comicStatus = 'published'
   └─> Record publishedAt, publishedBy

4. PUBLISHED STATE
   comicStatus: 'published'
   │
   ├─> Visible at /comics/[id]
   ├─> Can unpublish to draft
   └─> Independent from text status

┌─────────────────────────────────────────────────────────────┐
│                   READING ROUTES                             │
└─────────────────────────────────────────────────────────────┘

/novels/[id]
  Query: visibility = 'public'
  Shows: scene.content + scene.imageUrl
  Format: Traditional text reading

/comics/[id]
  Query: visibility = 'public' AND comicStatus = 'published'
  Shows: comicPanels (ordered by panelNumber)
  Format: Sequential visual storytelling with static spacing (space-y-6, 24px)
```

---

## Key Architecture Benefits

### Independent Publishing
- Publish text immediately while comics are being generated
- Preview and refine comics before making them public
- A/B test text vs comic engagement

### Clear Content Separation
- `/novels/[id]` - Text-only experience
- `/comics/[id]` - Comic-only experience
- No UI confusion about viewing mode

### Flexible Workflows
- Text-first workflow (common for writers)
- Comics-first workflow (visual storytellers)
- Simultaneous publishing (generated stories)

### Scalable Architecture
- Easy to add comic versioning (regenerate panels)
- Dynamic layout calculation via comic-layout service
- Can add layout options (webtoon vs traditional)
- Can add comic-specific features (zoom, pan)

---

## Technical Specifications

### Image Format
- **Model:** Google Gemini 2.5 Flash Image
- **Dimensions:** 1344×768 pixels (7:4 ratio, ~16:9)
- **Optimization:** 4 variants per panel (AVIF + JPEG × 2 sizes)

### Panel Count
- **Typical:** 8-12 panels per scene
- **Range:** Configured in screenplay-converter.ts
  - Target: 10 panels for optimal pacing
  - Max: 12 panels for complex action sequences
  - Min: 8 panels for quiet, reflective moments

### Panel Spacing
- **Current Implementation:** Static spacing using Tailwind `space-y-6` class (24px between panels)
- **View Component:** `src/components/comic/comic-viewer.tsx` uses fixed spacing
- **Legacy Constants** (defined in `comic-layout.ts` but not actively used):
  - GUTTER_MIN: 50px (continuous action)
  - GUTTER_BEAT_CHANGE: 80px (moment changes)
  - GUTTER_SCENE_TRANSITION: 100px (major transitions)
  - GUTTER_MAX: 120px (maximum recommended)

---

## Related Documentation

- **Comic Panel Generation:** `docs/comics/comics-generation.md`
- **Image System:** `docs/image/image-architecture.md`
- **Image Optimization:** `docs/image/image-optimization.md`
- **Database Optimization:** `docs/comics/comics-optimization.md`
