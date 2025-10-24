# Schema Refactoring Summary

## Date: October 24, 2025

## Overview
Removed redundant ID array fields (`partIds`, `chapterIds`, `sceneIds`) from the database schema. These arrays were duplicating data already available through foreign key relationships.

## Problem
The database had a **hybrid design** with:
- ✅ Proper relational tables with foreign keys
- ❌ Redundant JSON ID arrays on each table
- ⚠️ Two sources of truth for the same data

### Example of Redundancy
```typescript
// BEFORE: Data stored in TWO places
stories table:
  - chapterIds: ['ch1', 'ch2', 'ch3']  // ❌ Redundant array

chapters table:
  - id: 'ch1', storyId: 'story1'       // ✅ Already has foreign key
  - id: 'ch2', storyId: 'story1'
  - id: 'ch3', storyId: 'story1'
```

## What Was Changed

### 1. Database Schema (`src/lib/db/schema.ts`)
**Removed fields:**
- `stories.partIds`
- `stories.chapterIds`
- `parts.chapterIds`
- `chapters.sceneIds`

**Kept:**
- All foreign key relationships (`storyId`, `partId`, `chapterId`)
- All `orderIndex` columns for ordering
- All `hnsData` JSON fields (for flexible HNS methodology metadata)

### 2. Database Migration
**Created:** `drizzle/0023_remove_redundant_id_arrays.sql`
- Drops the redundant JSON columns
- Migration ran successfully ✅

### 3. RelationshipManager (`src/lib/db/relationships.ts`)
**Completely rewritten** to use foreign key queries instead of JSON array manipulation.

#### Key Changes:
- **Add operations**: No longer update JSON arrays, just create records with foreign keys
- **Delete operations**: Use foreign key relationships to find and delete related records
- **Query operations**: Use `WHERE` clauses with foreign keys and `ORDER BY orderIndex`
- **New helper methods**: Added `getStoryParts()`, `getStoryChapters()`, `getPartChapters()`, `getChapterScenes()`

#### Example Before/After:
```typescript
// BEFORE: Manipulating JSON arrays
await tx.update(stories)
  .set({
    partIds: sql`(COALESCE(part_ids, '[]'::json)::jsonb || ${JSON.stringify([partId])}::jsonb)::json`
  })
  .where(eq(stories.id, storyId));

// AFTER: Just update timestamp (foreign key handles relationship)
await tx.update(stories)
  .set({ updatedAt: new Date() })
  .where(eq(stories.id, storyId));
```

```typescript
// BEFORE: Get parts using stored IDs
const storyParts = story.partIds.length > 0
  ? await db.select().from(parts).where(inArray(parts.id, story.partIds))
  : [];

// AFTER: Get parts using foreign key
const storyParts = await db.select()
  .from(parts)
  .where(eq(parts.storyId, storyId))
  .orderBy(asc(parts.orderIndex));
```

## What Still Needs Updating

### Critical Files (47 files reference the old arrays)
Found 47 files that still reference `partIds`, `chapterIds`, or `sceneIds`.

### Priority 1: API Routes
These need immediate updates:
- `src/app/api/stories/[id]/route.ts`
- `src/app/api/parts/route.ts`
- `src/app/api/chapters/[id]/scenes/route.ts`
- `src/lib/ai/story-development.ts`

### Priority 2: Services
- `src/lib/db/queries.ts`
- `src/lib/services/scene-publishing.ts`
- `src/lib/services/insights.ts`

### Priority 3: UI Components
- `src/components/writing/UnifiedWritingEditor.tsx`
- `src/components/writing/ChapterPromptEditor.tsx`

## Migration Strategy for Remaining Code

### Pattern to Follow:
1. **Remove array access**: `story.partIds.map(...)` ❌
2. **Use RelationshipManager helpers**: `RelationshipManager.getStoryParts(storyId)` ✅
3. **Use foreign key queries**: `db.select().from(parts).where(eq(parts.storyId, storyId))` ✅

### Example Updates Needed:

#### API Routes
```typescript
// BEFORE
const story = await db.select().from(stories).where(eq(stories.id, id));
const parts = await db.select().from(parts).where(inArray(parts.id, story.partIds));

// AFTER
const story = await db.select().from(stories).where(eq(stories.id, id));
const parts = await RelationshipManager.getStoryParts(id);
// OR
const parts = await db.select().from(parts)
  .where(eq(parts.storyId, id))
  .orderBy(asc(parts.orderIndex));
```

#### Story Generation Code
```typescript
// BEFORE
await tx.update(stories).set({
  chapterIds: [...story.chapterIds, newChapterId]
});

// AFTER
// No need to update anything - foreign key handles it!
// The chapter already has storyId set
```

## Benefits of This Refactor

### ✅ Data Integrity
- Single source of truth (foreign keys)
- No risk of array/foreign key mismatch
- Database constraints enforce relationships

### ✅ Simpler Code
- No complex JSON array manipulation
- Standard SQL queries
- Easier to understand and maintain

### ✅ Better Performance
- Proper indexes on foreign keys
- No JSON parsing overhead
- More efficient queries

### ✅ Easier Ordering
- `orderIndex` column is explicit and clear
- Can reorder with simple UPDATE queries
- No array reordering complexity

## Next Steps

1. **Update API routes** (Priority 1)
2. **Update service layer** (Priority 2)
3. **Update UI components** (Priority 3)
4. **Test thoroughly**
5. **Remove any remaining references to old arrays**

## Helper Methods Available

The new `RelationshipManager` provides these helpers:

```typescript
// Get all related entities (ordered by orderIndex)
RelationshipManager.getStoryParts(storyId)
RelationshipManager.getStoryChapters(storyId)
RelationshipManager.getPartChapters(partId)
RelationshipManager.getChapterScenes(chapterId)

// Get full story structure
RelationshipManager.getStoryWithStructure(storyId, includeScenes)

// Reorder entities
RelationshipManager.reorderParts(partIds)
RelationshipManager.reorderChapters(chapterIds)
RelationshipManager.reorderScenes(sceneIds)

// Validate consistency
RelationshipManager.validateConsistency(storyId)
```

## Testing Checklist

- [ ] Create new story with parts/chapters/scenes
- [ ] Delete parts/chapters/scenes
- [ ] Reorder parts/chapters/scenes
- [ ] Move chapters between parts
- [ ] Read full story structure
- [ ] Verify scene publishing still works
- [ ] Check analytics and insights
- [ ] Test all API endpoints

## Notes

- `hnsData` JSON fields are KEPT - they store flexible HNS methodology metadata
- `characterIds` and `placeIds` in scenes are KEPT - they're for many-to-many relationships
- All foreign keys and relations in Drizzle ORM are unchanged
- Migration is **irreversible** - the columns are permanently dropped
