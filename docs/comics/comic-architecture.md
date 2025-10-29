# Comic Architecture & Database Schema

## Current State Analysis

### Existing Schema (✅ Already Implemented)

**`comicPanels` table** (lines 245-274 in `schema.ts`):
```typescript
comicPanels {
  id: string (primary key)
  sceneId: string (foreign key → scenes.id, cascade delete)
  panelNumber: integer
  shotType: enum (establishing_shot, wide_shot, medium_shot, close_up, etc.)

  // Image data
  imageUrl: string
  imageVariants: json (AVIF, WebP, JPEG in multiple sizes)

  // Content overlays
  dialogue: json[] (character_id, text, tone)
  sfx: json[] (text, emphasis: normal|large|dramatic)

  // Layout
  gutterAfter: integer (vertical spacing in pixels)

  // Metadata
  metadata: json (prompt, characters_visible, camera_angle, mood, generated_at)

  createdAt, updatedAt
}
```

**Relations:**
- `scenes` → `comicPanels` (one-to-many)
- Cascade delete: deleting a scene removes all comic panels

---

## Problem Statement

### Current Limitations

1. **❌ No Comic Status Management**
   - Comic panels exist or don't exist (binary state)
   - No concept of "draft" vs "published" comics
   - Cannot preview comics before publishing

2. **❌ No Independent Publishing**
   - Text and comics share scene visibility
   - Cannot publish text first, comics later (or vice versa)
   - Cannot A/B test text vs comic versions

3. **❌ No Comic Metadata**
   - No tracking of when comics were published
   - No tracking of who published comics
   - No versioning or audit trail

4. **❌ Frontend Confusion**
   - `/novels/[id]` should show text (currently mixed)
   - `/comics/[id]` should show comics (needs implementation)
   - Users cannot choose preferred format

---

## Proposed Solution: Hybrid Architecture

### Option 1: Add Fields to `scenes` Table (✅ RECOMMENDED)

**Pros:**
- ✅ Simple implementation
- ✅ Minimal schema changes
- ✅ Backward compatible
- ✅ Independent status for text vs comics
- ✅ Leverages existing `comicPanels` infrastructure

**Cons:**
- ⚠️ Adds fields to already large table
- ⚠️ Comics metadata mixed with text metadata

#### Schema Changes

```typescript
// Add to scenes table
export const scenes = pgTable('scenes', {
  // ... existing fields ...

  // Comic publishing fields (NEW)
  comicStatus: pgEnum(['none', 'draft', 'published'])
    .default('none')
    .notNull(),
  comicPublishedAt: timestamp('comic_published_at'),
  comicPublishedBy: text('comic_published_by')
    .references(() => users.id),
  comicUnpublishedAt: timestamp('comic_unpublished_at'),
  comicUnpublishedBy: text('comic_unpublished_by')
    .references(() => users.id),

  // Optional: Track comic generation metadata
  comicGeneratedAt: timestamp('comic_generated_at'),
  comicPanelCount: integer('comic_panel_count').default(0),
  comicVersion: integer('comic_version').default(1),
});
```

#### New Enum

```typescript
export const comicStatusEnum = pgEnum('comic_status', [
  'none',      // No comic panels exist
  'draft',     // Comic panels exist but not published
  'published'  // Comic panels are published and visible
]);
```

---

### Option 2: Separate `comics` Table (Alternative)

**Pros:**
- ✅ Clean separation of concerns
- ✅ Easier to add comic-specific features
- ✅ Better for complex comic metadata

**Cons:**
- ❌ More complex queries (requires joins)
- ❌ Duplicate metadata (scene-level vs comic-level)
- ❌ Over-engineered for current needs

#### Schema (for reference)

```typescript
export const comics = pgTable('comics', {
  id: text('id').primaryKey(),
  sceneId: text('scene_id')
    .references(() => scenes.id, { onDelete: 'cascade' })
    .notNull()
    .unique(), // One comic per scene

  status: pgEnum(['draft', 'published'])
    .default('draft')
    .notNull(),

  panelCount: integer('panel_count').default(0),
  version: integer('version').default(1),

  // Publishing metadata
  publishedAt: timestamp('published_at'),
  publishedBy: text('published_by').references(() => users.id),
  unpublishedAt: timestamp('unpublished_at'),
  unpublishedBy: text('unpublished_by').references(() => users.id),

  // Generation metadata
  generatedAt: timestamp('generated_at'),
  generatedBy: text('generated_by').references(() => users.id),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

## Recommended Implementation: Option 1

### Migration Steps

1. **Create enum**:
   ```sql
   CREATE TYPE comic_status AS ENUM ('none', 'draft', 'published');
   ```

2. **Add columns to scenes table**:
   ```sql
   ALTER TABLE scenes
   ADD COLUMN comic_status comic_status NOT NULL DEFAULT 'none',
   ADD COLUMN comic_published_at TIMESTAMP,
   ADD COLUMN comic_published_by TEXT REFERENCES users(id),
   ADD COLUMN comic_unpublished_at TIMESTAMP,
   ADD COLUMN comic_unpublished_by TEXT REFERENCES users(id),
   ADD COLUMN comic_generated_at TIMESTAMP,
   ADD COLUMN comic_panel_count INTEGER DEFAULT 0,
   ADD COLUMN comic_version INTEGER DEFAULT 1;
   ```

3. **Create indexes**:
   ```sql
   CREATE INDEX idx_scenes_comic_status ON scenes(comic_status);
   CREATE INDEX idx_scenes_comic_published_at ON scenes(comic_published_at);
   ```

4. **Backfill existing data**:
   ```sql
   -- Set comic_status to 'published' for scenes that have comic panels
   UPDATE scenes
   SET comic_status = 'published',
       comic_panel_count = (
         SELECT COUNT(*) FROM comic_panels
         WHERE scene_id = scenes.id
       )
   WHERE id IN (
     SELECT DISTINCT scene_id FROM comic_panels
   );
   ```

---

## Frontend Usage Patterns

### 1. Novel View (`/novels/[id]`)

**Shows:** Text content only

```typescript
// Query: Get scenes with published TEXT
const textScenes = await db.query.scenes.findMany({
  where: and(
    eq(scenes.chapterId, chapterId),
    eq(scenes.visibility, 'public'),
    // Don't filter by comicStatus - text is always shown if scene is public
  ),
  columns: {
    id: true,
    title: true,
    content: true,          // ✅ Show text content
    imageUrl: true,         // ✅ Show scene image
    imageVariants: true,
    comicStatus: false,     // ❌ Ignore comic status
  },
});
```

### 2. Comic View (`/comics/[id]`)

**Shows:** Comic panels only

```typescript
// Query: Get scenes with published COMICS
const comicScenes = await db.query.scenes.findMany({
  where: and(
    eq(scenes.chapterId, chapterId),
    eq(scenes.visibility, 'public'),
    eq(scenes.comicStatus, 'published'),  // ✅ Only published comics
  ),
  with: {
    comicPanels: {
      orderBy: [asc(comicPanels.panelNumber)],
    },
  },
  columns: {
    id: true,
    title: true,
    content: false,         // ❌ Don't show text content
    imageUrl: false,        // ❌ Don't show scene image
    comicPanelCount: true,
  },
});
```

### 3. Studio Edit View (`/studio/edit/[chapterId]`)

**Shows:** Both text and comic status

```typescript
const scene = await db.query.scenes.findFirst({
  where: eq(scenes.id, sceneId),
  with: {
    comicPanels: true,
  },
});

// UI shows:
// - Text content with publish status
// - Comic panels with publish status
// - Separate publish buttons for each
```

---

## API Endpoints

### 1. Publish Comic

```typescript
// POST /api/scenes/{sceneId}/comic/publish
async function publishComic(sceneId: string, userId: string) {
  // Verify comic panels exist
  const panelCount = await db.query.comicPanels.count({
    where: eq(comicPanels.sceneId, sceneId),
  });

  if (panelCount === 0) {
    throw new Error('No comic panels to publish');
  }

  // Update scene comic status
  await db.update(scenes)
    .set({
      comicStatus: 'published',
      comicPublishedAt: new Date(),
      comicPublishedBy: userId,
      comicPanelCount: panelCount,
    })
    .where(eq(scenes.id, sceneId));
}
```

### 2. Unpublish Comic

```typescript
// POST /api/scenes/{sceneId}/comic/unpublish
async function unpublishComic(sceneId: string, userId: string) {
  await db.update(scenes)
    .set({
      comicStatus: 'draft',
      comicUnpublishedAt: new Date(),
      comicUnpublishedBy: userId,
    })
    .where(eq(scenes.id, sceneId));
}
```

### 3. Generate Comic Panels

```typescript
// POST /api/scenes/{sceneId}/comic/generate
async function generateComicPanels(sceneId: string) {
  // 1. Generate comic panels using AI
  const panels = await generatePanelsFromSceneContent(sceneId);

  // 2. Save panels to database
  await db.insert(comicPanels).values(panels);

  // 3. Update scene metadata
  await db.update(scenes)
    .set({
      comicStatus: 'draft',  // Auto-draft, requires manual publish
      comicGeneratedAt: new Date(),
      comicPanelCount: panels.length,
    })
    .where(eq(scenes.id, sceneId));
}
```

---

## UI Components

### Scene Card (Studio)

```tsx
<SceneCard scene={scene}>
  <div className="flex gap-4">
    {/* Text Status */}
    <div className="flex-1">
      <h4>Text Content</h4>
      <Badge>{scene.visibility}</Badge>
      <Button onClick={() => publishText(scene.id)}>
        Publish Text
      </Button>
    </div>

    {/* Comic Status */}
    <div className="flex-1">
      <h4>Comic ({scene.comicPanelCount} panels)</h4>
      <Badge>{scene.comicStatus}</Badge>
      {scene.comicStatus === 'none' && (
        <Button onClick={() => generateComic(scene.id)}>
          Generate Comic
        </Button>
      )}
      {scene.comicStatus === 'draft' && (
        <Button onClick={() => publishComic(scene.id)}>
          Publish Comic
        </Button>
      )}
      {scene.comicStatus === 'published' && (
        <Button onClick={() => unpublishComic(scene.id)}>
          Unpublish Comic
        </Button>
      )}
    </div>
  </div>
</SceneCard>
```

### Reader Navigation

```tsx
<StoryViewToggle>
  <Link href={`/novels/${storyId}`}>
    <Button variant={mode === 'text' ? 'solid' : 'ghost'}>
      📝 Text View
    </Button>
  </Link>
  <Link href={`/comics/${storyId}`}>
    <Button variant={mode === 'comic' ? 'solid' : 'ghost'}>
      🎨 Comic View
    </Button>
  </Link>
</StoryViewToggle>
```

---

## Benefits of This Architecture

### 1. **Independent Publishing Workflows**
- ✅ Publish text immediately while comics are in progress
- ✅ Preview comics before making them public
- ✅ A/B test different versions

### 2. **Clear Separation of Routes**
- ✅ `/novels/[id]` → Text-only reading experience
- ✅ `/comics/[id]` → Comic-only reading experience
- ✅ No confusion about what user is viewing

### 3. **Granular Analytics**
- ✅ Track which format users prefer (text vs comic)
- ✅ Measure engagement per format
- ✅ Optimize generation based on consumption

### 4. **Future Extensibility**
- ✅ Easy to add comic versioning (regenerate panels)
- ✅ Can add webtoon vs traditional panel layouts
- ✅ Can add comic-specific features (zoom, pan, etc.)

### 5. **Backward Compatible**
- ✅ Existing `comicPanels` table unchanged
- ✅ Existing text publishing workflow unchanged
- ✅ Can migrate gradually (default `comicStatus: 'none'`)

---

## Migration Checklist

- [ ] Create `comic_status` enum in database
- [ ] Add columns to `scenes` table via migration
- [ ] Create indexes for performance
- [ ] Backfill existing comic panels → set status to 'published'
- [ ] Update TypeScript schema (`src/lib/db/schema.ts`)
- [ ] Update API endpoints for comic publishing
- [ ] Create `/comics/[id]` route
- [ ] Update Studio UI to show comic status
- [ ] Add comic generation/publish buttons
- [ ] Update analytics to track comic vs text views

---

## Recommended Next Steps

1. **Review and approve this architecture**
2. **Create database migration** (add fields to scenes table)
3. **Update TypeScript schema** with new fields and enum
4. **Implement API endpoints** for comic publishing
5. **Update Studio UI** to manage comic status
6. **Create `/comics/[id]` route** for comic reading view
7. **Add analytics** to track format preferences

---

## Alternative: Keep It Simple (Minimal Approach)

If full publishing workflow is overkill, consider **just adding a boolean**:

```typescript
// Minimal approach - just track if comics exist and are ready
export const scenes = pgTable('scenes', {
  // ... existing fields ...
  hasComics: boolean('has_comics').default(false),
  comicsPublished: boolean('comics_published').default(false),
});
```

Then:
- `/novels/[id]` → Always shows text
- `/comics/[id]` → Only shows scenes where `comicsPublished: true`

**Trade-offs:**
- ✅ Ultra simple
- ✅ Backward compatible
- ❌ No draft/preview workflow
- ❌ No metadata (who/when published)
- ❌ Less flexible for future features

---

**Recommendation:** Use **Option 1 (Full Status Enum)** for production-grade system with room to grow.
