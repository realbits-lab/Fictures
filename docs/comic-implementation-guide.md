# Comic Implementation Guide

## Overview

This guide provides a complete roadmap for implementing independent comic publishing for your story platform.

---

## What Changed

### 1. Database Schema ✅

**Added to `scenes` table:**
```typescript
comicStatus: 'none' | 'draft' | 'published'  // Default: 'none'
comicPublishedAt: timestamp | null
comicPublishedBy: userId | null
comicUnpublishedAt: timestamp | null
comicUnpublishedBy: userId | null
comicGeneratedAt: timestamp | null
comicPanelCount: number  // Default: 0
comicVersion: number     // Default: 1
```

**Files modified:**
- ✅ `drizzle/0029_add_comic_status_fields.sql` - Database migration
- ✅ `src/lib/db/schema.ts` - TypeScript schema with new enum and fields

---

## Architecture Benefits

### 1. **Independent Publishing**
- 📝 Publish text content immediately
- 🎨 Generate comics as separate workflow
- 📊 Preview comics before publishing
- 🔄 Regenerate comics without affecting text

### 2. **Clear Route Separation**
```
/novels/[id]  → Text-only reading (📝 content + imageUrl)
/comics/[id]  → Comic-only reading (🎨 comicPanels)
/studio/...   → Manage both independently
```

### 3. **Flexible Workflows**

**Scenario A: Text First**
1. Write scene → Publish text (`visibility: 'public'`)
2. Generate comic panels → Save as draft (`comicStatus: 'draft'`)
3. Review comic → Publish comic (`comicStatus: 'published'`)

**Scenario B: Both Together**
1. Generate complete story (text + comics)
2. Publish both simultaneously
3. Users can choose format preference

**Scenario C: Comics Only**
1. Generate comic panels
2. Publish comics without text content
3. Visual storytelling mode

---

## Database Migration

### Step 1: Run Migration

```bash
# Generate migration (already created)
dotenv --file .env.local run pnpm db:migrate

# Or push directly to database
dotenv --file .env.local run pnpm db:push
```

### Step 2: Verify Migration

```bash
# Check that comic_status enum exists
psql $POSTGRES_URL -c "SELECT enum_range(NULL::comic_status);"

# Check that scenes table has new columns
psql $POSTGRES_URL -c "\d scenes" | grep comic

# Verify backfill worked
psql $POSTGRES_URL -c "SELECT id, comic_status, comic_panel_count FROM scenes WHERE comic_status = 'published';"
```

---

## API Endpoints to Create

### 1. **Publish Comic** (`POST /api/scenes/[sceneId]/comic/publish`)

```typescript
import { db } from '@/lib/db';
import { scenes, comicPanels } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  req: Request,
  { params }: { params: { sceneId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sceneId } = params;

  // Verify comic panels exist
  const panels = await db.query.comicPanels.findMany({
    where: eq(comicPanels.sceneId, sceneId),
  });

  if (panels.length === 0) {
    return NextResponse.json(
      { error: 'No comic panels to publish' },
      { status: 400 }
    );
  }

  // Update scene comic status
  await db.update(scenes)
    .set({
      comicStatus: 'published',
      comicPublishedAt: new Date(),
      comicPublishedBy: session.user.id,
      comicPanelCount: panels.length,
    })
    .where(eq(scenes.id, sceneId));

  return NextResponse.json({
    success: true,
    comicStatus: 'published',
    panelCount: panels.length,
  });
}
```

### 2. **Unpublish Comic** (`POST /api/scenes/[sceneId]/comic/unpublish`)

```typescript
export async function POST(
  req: Request,
  { params }: { params: { sceneId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sceneId } = params;

  await db.update(scenes)
    .set({
      comicStatus: 'draft',
      comicUnpublishedAt: new Date(),
      comicUnpublishedBy: session.user.id,
    })
    .where(eq(scenes.id, sceneId));

  return NextResponse.json({ success: true, comicStatus: 'draft' });
}
```

### 3. **Generate Comic** (`POST /api/scenes/[sceneId]/comic/generate`)

```typescript
export async function POST(
  req: Request,
  { params }: { params: { sceneId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sceneId } = params;

  // Get scene content
  const scene = await db.query.scenes.findFirst({
    where: eq(scenes.id, sceneId),
  });

  if (!scene) {
    return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
  }

  // TODO: Implement comic panel generation from scene content
  // This would use AI to:
  // 1. Split scene into panels
  // 2. Generate images for each panel
  // 3. Extract dialogue and SFX
  // 4. Save to comicPanels table

  const generatedPanels = await generateComicPanels(scene);

  // Save panels
  await db.insert(comicPanels).values(generatedPanels);

  // Update scene metadata
  await db.update(scenes)
    .set({
      comicStatus: 'draft',
      comicGeneratedAt: new Date(),
      comicPanelCount: generatedPanels.length,
      comicVersion: (scene.comicVersion || 0) + 1,
    })
    .where(eq(scenes.id, sceneId));

  return NextResponse.json({
    success: true,
    comicStatus: 'draft',
    panelCount: generatedPanels.length,
  });
}
```

---

## Frontend Implementation

### 1. **Update `/novels/[id]` Route**

**File:** `src/app/novels/[id]/page.tsx`

```typescript
// Query only text content (ignore comic status)
const scenes = await db.query.scenes.findMany({
  where: and(
    eq(scenes.chapterId, chapterId),
    eq(scenes.visibility, 'public'),
  ),
  columns: {
    id: true,
    title: true,
    content: true,       // ✅ Text content
    imageUrl: true,      // ✅ Scene image
    imageVariants: true,
    comicStatus: false,  // ❌ Don't need comic status
  },
  orderBy: [asc(scenes.orderIndex)],
});
```

### 2. **Create `/comics/[id]` Route**

**File:** `src/app/comics/[id]/page.tsx`

```typescript
import { MainLayout } from '@/components/layout';
import { ComicReaderClient } from '@/components/reading/ComicReaderClient';
import { getStoryWithComics } from '@/lib/db/cached-queries';
import { notFound } from 'next/navigation';

export default async function ComicReadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Query only published comics
  const story = await getStoryWithComics(id);

  if (!story) {
    notFound();
  }

  return (
    <MainLayout>
      <ComicReaderClient storyId={id} initialData={story} />
    </MainLayout>
  );
}
```

**Helper function:**
```typescript
// src/lib/db/cached-queries.ts
export async function getStoryWithComics(storyId: string) {
  const story = await db.query.stories.findFirst({
    where: eq(stories.id, storyId),
    with: {
      parts: {
        with: {
          chapters: {
            with: {
              scenes: {
                where: and(
                  eq(scenes.visibility, 'public'),
                  eq(scenes.comicStatus, 'published'),  // ✅ Only published comics
                ),
                with: {
                  comicPanels: {
                    orderBy: [asc(comicPanels.panelNumber)],
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return story;
}
```

### 3. **Create ComicReaderClient Component**

**File:** `src/components/reading/ComicReaderClient.tsx`

```typescript
'use client';

import { ComicViewer } from '@/components/comic/comic-viewer';

export function ComicReaderClient({ storyId, initialData }) {
  const [selectedSceneId, setSelectedSceneId] = useState(null);

  // Similar structure to ChapterReaderClient but for comics
  // - Show scene list (only scenes with comicStatus: 'published')
  // - Render ComicViewer for each scene
  // - Bottom nav for previous/next

  return (
    <div className="comic-reader">
      {/* Sidebar: Scene list */}
      {/* Main: ComicViewer */}
      {/* Bottom: Navigation */}
    </div>
  );
}
```

### 4. **Update Studio Scene Card**

**File:** `src/components/studio/scene-card.tsx`

```typescript
export function SceneCard({ scene }) {
  const handlePublishComic = async () => {
    await fetch(`/api/scenes/${scene.id}/comic/publish`, {
      method: 'POST',
    });
    // Refresh data
  };

  return (
    <Card>
      <div className="grid grid-cols-2 gap-4">
        {/* Text Publishing */}
        <div>
          <h4 className="font-semibold">Text Content</h4>
          <Badge>{scene.visibility}</Badge>
          <Button onClick={handlePublishText}>
            {scene.visibility === 'public' ? 'Unpublish' : 'Publish'} Text
          </Button>
        </div>

        {/* Comic Publishing */}
        <div>
          <h4 className="font-semibold">
            Comic ({scene.comicPanelCount} panels)
          </h4>
          <Badge variant={
            scene.comicStatus === 'published' ? 'success' :
            scene.comicStatus === 'draft' ? 'warning' : 'default'
          }>
            {scene.comicStatus}
          </Badge>

          {scene.comicStatus === 'none' && (
            <Button onClick={handleGenerateComic}>
              Generate Comic
            </Button>
          )}

          {scene.comicStatus === 'draft' && (
            <>
              <Button onClick={handlePublishComic}>Publish Comic</Button>
              <Button onClick={handleRegenerateComic} variant="outline">
                Regenerate
              </Button>
            </>
          )}

          {scene.comicStatus === 'published' && (
            <Button onClick={handleUnpublishComic} variant="destructive">
              Unpublish Comic
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
```

---

## Analytics & Tracking

### Track Format Preferences

```typescript
// Track which format users view
await db.insert(analyticsEvents).values({
  eventType: 'story_view',
  userId: session?.user?.id,
  sessionId: sessionId,
  storyId: storyId,
  metadata: {
    viewFormat: 'comic', // or 'text'
    sceneId: sceneId,
  },
});
```

### Query Format Analytics

```sql
-- Which format is more popular?
SELECT
  metadata->>'viewFormat' as format,
  COUNT(*) as views
FROM analytics_events
WHERE event_type = 'story_view'
  AND story_id = 'story_123'
GROUP BY format;

-- Comic completion rate
SELECT
  COUNT(DISTINCT scene_id) FILTER (WHERE comic_status = 'published') as published_comics,
  COUNT(DISTINCT scene_id) as total_scenes,
  ROUND(100.0 * COUNT(DISTINCT scene_id) FILTER (WHERE comic_status = 'published') / COUNT(DISTINCT scene_id), 2) as completion_rate
FROM scenes
WHERE chapter_id = 'chapter_123';
```

---

## Testing Checklist

### Database Migration
- [ ] Migration runs without errors
- [ ] `comic_status` enum created
- [ ] New columns added to `scenes` table
- [ ] Indexes created successfully
- [ ] Existing comic panels backfilled as 'published'

### API Endpoints
- [ ] `POST /api/scenes/[id]/comic/publish` works
- [ ] `POST /api/scenes/[id]/comic/unpublish` works
- [ ] `POST /api/scenes/[id]/comic/generate` works
- [ ] Authorization checks work (only owner can manage)
- [ ] Validates comic panels exist before publishing

### Frontend Routes
- [ ] `/novels/[id]` shows only text content
- [ ] `/comics/[id]` shows only comic panels
- [ ] `/comics/[id]` filters by `comicStatus: 'published'`
- [ ] Studio UI shows both text and comic status
- [ ] Scene cards show correct publish buttons

### User Experience
- [ ] Can publish text without comics
- [ ] Can publish comics without text
- [ ] Can publish both independently
- [ ] Can unpublish comics while text remains published
- [ ] Comic panels display correctly in comic viewer

---

## Performance Considerations

### Database Indexes

Already created in migration:
```sql
CREATE INDEX idx_scenes_comic_status ON scenes(comic_status);
CREATE INDEX idx_scenes_comic_published_at ON scenes(comic_published_at);
```

### Caching Strategy

```typescript
// Cache comic scenes separately from text scenes
export async function getCachedComicScenes(chapterId: string) {
  return unstable_cache(
    async () => {
      return await db.query.scenes.findMany({
        where: and(
          eq(scenes.chapterId, chapterId),
          eq(scenes.comicStatus, 'published'),
        ),
        with: { comicPanels: true },
      });
    },
    [`comic-scenes-${chapterId}`],
    { revalidate: 1800 } // 30 minutes
  );
}
```

---

## Future Enhancements

### 1. **Webtoon vs Traditional Layouts**
```typescript
comicLayout: 'webtoon' | 'traditional' | 'manga'
```

### 2. **Comic Versioning**
```typescript
// Allow regenerating comics
comicVersion: number
comicArchive: json[] // Store previous versions
```

### 3. **Panel-Level Comments**
```typescript
// Allow comments on specific panels
export const panelComments = pgTable('panel_comments', {
  panelId: text('panel_id').references(() => comicPanels.id),
  // ... other fields
});
```

### 4. **A/B Testing**
```typescript
// Test which format performs better
comicVariant: 'A' | 'B'
```

---

## Rollback Plan

If issues arise, rollback with:

```sql
-- Remove columns
ALTER TABLE scenes
DROP COLUMN IF EXISTS comic_status,
DROP COLUMN IF EXISTS comic_published_at,
DROP COLUMN IF EXISTS comic_published_by,
DROP COLUMN IF EXISTS comic_unpublished_at,
DROP COLUMN IF EXISTS comic_unpublished_by,
DROP COLUMN IF EXISTS comic_generated_at,
DROP COLUMN IF EXISTS comic_panel_count,
DROP COLUMN IF EXISTS comic_version;

-- Drop enum
DROP TYPE IF EXISTS comic_status;

-- Drop indexes
DROP INDEX IF EXISTS idx_scenes_comic_status;
DROP INDEX IF EXISTS idx_scenes_comic_published_at;
```

---

## Summary

### Files Created
1. ✅ `docs/comic-architecture.md` - Complete architecture documentation
2. ✅ `docs/comic-implementation-guide.md` - This implementation guide
3. ✅ `drizzle/0029_add_comic_status_fields.sql` - Database migration

### Files Modified
1. ✅ `src/lib/db/schema.ts` - Added `comicStatusEnum` and fields to `scenes` table
2. ✅ `src/components/reading/ChapterReaderClient.tsx` - Removed view toggle buttons

### Next Steps
1. **Run migration**: `dotenv --file .env.local run pnpm db:migrate`
2. **Create API endpoints**: `/api/scenes/[id]/comic/publish`, etc.
3. **Create `/comics/[id]` route**: Comic reading view
4. **Update Studio UI**: Add comic status and buttons
5. **Test workflows**: Publish text, generate comics, publish comics
6. **Add analytics**: Track format preferences

---

**Ready to implement!** 🚀

All architecture is designed, migration is ready, and TypeScript types are updated. You can now:
1. Run the migration to add database fields
2. Build the API endpoints for comic management
3. Create the comic reader route
4. Update the Studio UI for managing comics

The system supports independent publishing of text and comics while maintaining backward compatibility with existing data.
