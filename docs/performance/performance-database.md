---
title: "Database Optimization Strategy - PostgreSQL (Neon) & Redis"
---

# Database Optimization Strategy - PostgreSQL (Neon) & Redis

**Date:** October 25, 2025
**Status:** ✅ Phase 1 COMPLETED - Critical optimizations applied
**Goal:** Optimize database queries and indexing for maximum performance

---

## Current Performance Analysis

### Identified Bottlenecks

1. **N+1 Query Problem** (CRITICAL)
   - Location: `src/lib/db/relationships.ts:341-347`
   - Issue: Looping over chapters and querying scenes separately
   - Impact: 10 chapters = 11 database queries (1 for chapters + 10 for scenes)

2. **Missing Database Indexes** (HIGH PRIORITY)
   - No indexes on frequently queried columns
   - Impact: Full table scans on large tables

3. **Suboptimal Cache Key Structure**
   - Current: Simple string keys
   - Opportunity: Use Redis sorted sets for ordered data

---

## PostgreSQL (Neon) Optimizations

### 1. Database Indexes Strategy

#### Priority 1: Foreign Key Indexes (CRITICAL)

**Problem:** Foreign key columns are frequently used in WHERE clauses and JOINs but have no indexes.

**Solution:**
```sql
-- Stories table (with Adversity-Triumph fields)
CREATE INDEX idx_stories_author_id ON stories(author_id);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_status_created ON stories(status, created_at DESC);
CREATE INDEX idx_stories_view_count ON stories(view_count DESC); -- For popular stories
CREATE INDEX idx_stories_tone ON stories(tone); -- Filter by emotional direction

-- Chapters table (with Adversity-Triumph cycle tracking)
CREATE INDEX idx_chapters_story_id ON chapters(story_id);
CREATE INDEX idx_chapters_part_id ON chapters(part_id);
CREATE INDEX idx_chapters_story_order ON chapters(story_id, order_index);
CREATE INDEX idx_chapters_status ON chapters(status);
CREATE INDEX idx_chapters_character_id ON chapters(character_id); -- Primary character arc
CREATE INDEX idx_chapters_arc_position ON chapters(arc_position); -- Macro arc tracking
CREATE INDEX idx_chapters_virtue_type ON chapters(virtue_type); -- Moral virtue filtering

-- Parts table (with character arcs)
CREATE INDEX idx_parts_story_id ON parts(story_id);
CREATE INDEX idx_parts_story_order ON parts(story_id, order_index);

-- Scenes table (with visibility and publishing)
CREATE INDEX idx_scenes_chapter_id ON scenes(chapter_id);
CREATE INDEX idx_scenes_chapter_order ON scenes(chapter_id, order_index);
CREATE INDEX idx_scenes_visibility ON scenes(visibility); -- Public/private/unlisted filtering
CREATE INDEX idx_scenes_published_at ON scenes(published_at DESC); -- Published scenes
CREATE INDEX idx_scenes_comic_status ON scenes(comic_status); -- Comic panel tracking
CREATE INDEX idx_scenes_view_count ON scenes(view_count DESC); -- Popular scenes
CREATE INDEX idx_scenes_novel_view_count ON scenes(novel_view_count DESC); -- Novel format analytics
CREATE INDEX idx_scenes_comic_view_count ON scenes(comic_view_count DESC); -- Comic format analytics

-- Characters table (with core traits)
CREATE INDEX idx_characters_story_id ON characters(story_id);
CREATE INDEX idx_characters_is_main ON characters(is_main); -- Filter main characters
CREATE INDEX idx_characters_story_main ON characters(story_id, is_main); -- Composite for main character queries

-- Settings table (environment and adversity)
CREATE INDEX idx_settings_story_id ON settings(story_id);

-- AI Interactions table
CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_created ON ai_interactions(created_at DESC);
```

**Expected Impact:**
- Query performance: **50-80% faster** for filtered queries
- JOIN operations: **70-90% faster**
- Popular story queries: **Instant** with view_count index

#### Priority 2: Composite Indexes (HIGH IMPACT)

**Problem:** Queries often filter by multiple columns (e.g., status + orderIndex).

**Solution:**
```sql
-- Composite indexes for common query patterns (Adversity-Triumph optimized)
CREATE INDEX idx_stories_author_status ON stories(author_id, status);
CREATE INDEX idx_stories_tone_status ON stories(tone, status); -- Filter by tone + published/writing

-- Chapters with Adversity-Triumph tracking
CREATE INDEX idx_chapters_story_status_order ON chapters(story_id, status, order_index);
CREATE INDEX idx_chapters_character_arc ON chapters(character_id, arc_position); -- Track character arc progression
CREATE INDEX idx_chapters_story_virtue ON chapters(story_id, virtue_type); -- Filter by tested virtue

-- Scenes with visibility and publishing
CREATE INDEX idx_scenes_chapter_visibility_order ON scenes(chapter_id, visibility, order_index); -- Public scenes in order
CREATE INDEX idx_scenes_visibility_published ON scenes(visibility, published_at DESC); -- Recently published public scenes
CREATE INDEX idx_scenes_comic_status_order ON scenes(chapter_id, comic_status, order_index); -- Comic panel availability
```

**Expected Impact:**
- Multi-column filters: **60-90% faster**
- Sorted queries: No additional sorting needed

#### Priority 3: Text Search Indexes (OPTIONAL)

**Problem:** Searching story titles/content is slow without full-text indexes.

**Solution:**
```sql
-- Full-text search on stories
CREATE INDEX idx_stories_title_search ON stories USING GIN (to_tsvector('english', title));
CREATE INDEX idx_stories_description_search ON stories USING GIN (to_tsvector('english', description));

-- Full-text search on scenes (if needed)
CREATE INDEX idx_scenes_content_search ON scenes USING GIN (to_tsvector('english', content));
```

**Expected Impact:**
- Text search: **10-100x faster** depending on data size

---

### 2. Fix N+1 Query Problem

#### Current Implementation (PROBLEMATIC)

```typescript
// src/lib/db/relationships.ts:341-347
const scenesByChapter: Record<string, typeof allScenes> = {};
for (const chapterId of chapterIds) {
  scenesByChapter[chapterId] = await db.select()
    .from(scenes)
    .where(eq(scenes.chapterId, chapterId))
    .orderBy(asc(scenes.orderIndex));
}
```

**Problem:**
- If story has 10 chapters, this makes **10 separate database queries**
- Each query has network latency + query execution time
- Total time: ~10 * (network latency + query time) = 500-1000ms

#### Optimized Implementation (SOLUTION)

```typescript
// Fetch ALL scenes for ALL chapters in a SINGLE query
const allScenes = await db.select()
  .from(scenes)
  .where(inArray(scenes.chapterId, chapterIds))
  .orderBy(asc(scenes.chapterId), asc(scenes.orderIndex));

// Group scenes by chapter in memory (fast)
const scenesByChapter: Record<string, typeof allScenes> = {};
for (const scene of allScenes) {
  if (!scenesByChapter[scene.chapterId]) {
    scenesByChapter[scene.chapterId] = [];
  }
  scenesByChapter[scene.chapterId].push(scene);
}
```

**Expected Impact:**
- Reduces 10 queries to **1 query**
- Network latency: **90% reduction** (1 round trip instead of 10)
- Total query time: **500-1000ms → 50-100ms** (10x faster)

---

### 3. Query Optimization Best Practices

#### A. Use Prepared Statements

**Problem:** Query compilation happens on every request.

**Solution:**
```typescript
// Drizzle automatically uses prepared statements
// But we can optimize by caching query builders

// Bad: Creates new query builder each time
export function getStoryById(id: string) {
  return db.select().from(stories).where(eq(stories.id, id));
}

// Good: Reuse query builder
const storyByIdQuery = db.select().from(stories).where(eq(stories.id, sql.placeholder('id')));

export function getStoryById(id: string) {
  return storyByIdQuery.execute({ id });
}
```

#### B. Select Only Required Columns

**Problem:** Selecting all columns wastes bandwidth and memory.

**Solution:**
```typescript
// Bad: Select all columns (including heavy JSON fields)
const stories = await db.select().from(stories);

// Good: Select only needed columns for story list
const stories = await db.select({
  id: stories.id,
  title: stories.title,
  status: stories.status,
  authorId: stories.authorId,
  tone: stories.tone, // Adversity-Triumph field
  viewCount: stories.viewCount,
  imageUrl: stories.imageUrl, // Skip heavy imageVariants JSON
}).from(stories);

// Even better: Create reusable column sets for different use cases
const storyListColumns = {
  id: stories.id,
  title: stories.title,
  status: stories.status,
  authorId: stories.authorId,
  tone: stories.tone,
  viewCount: stories.viewCount,
  createdAt: stories.createdAt,
  imageUrl: stories.imageUrl, // Only URL, not full variants
};

const storyDetailColumns = {
  ...storyListColumns,
  summary: stories.summary,
  moralFramework: stories.moralFramework,
  imageVariants: stories.imageVariants, // Include for detail view
  partIds: stories.partIds,
  chapterIds: stories.chapterIds,
  sceneIds: stories.sceneIds,
};

// Scene columns optimized for reading vs editing
const sceneReadingColumns = {
  id: scenes.id,
  title: scenes.title,
  content: scenes.content,
  orderIndex: scenes.orderIndex,
  imageUrl: scenes.imageUrl,
  imageVariants: scenes.imageVariants,
  cyclePhase: scenes.cyclePhase,
  emotionalBeat: scenes.emotionalBeat,
  visibility: scenes.visibility,
  publishedAt: scenes.publishedAt,
};

const sceneEditingColumns = {
  ...sceneReadingColumns,
  characterFocus: scenes.characterFocus, // Planning metadata
  sensoryAnchors: scenes.sensoryAnchors,
  dialogueVsDescription: scenes.dialogueVsDescription,
  suggestedLength: scenes.suggestedLength,
};
```

**Expected Impact:**
- Bandwidth: **30-70% reduction**
- Memory usage: **40-60% reduction**
- Parse time: **20-40% faster**

#### C. Optimize JOIN Strategy

**Problem:** Multiple LEFT JOINs can be slow.

**Solution:**
```typescript
// Consider separate queries + in-memory join for better performance
// Especially when one table is much larger than the other

// Option 1: Single query with JOIN (good for small datasets)
const result = await db.select()
  .from(stories)
  .leftJoin(chapters, eq(chapters.storyId, stories.id))
  .leftJoin(scenes, eq(scenes.chapterId, chapters.id))
  .where(eq(stories.id, storyId));

// Option 2: Separate queries + in-memory join (good for large datasets)
const story = await db.select().from(stories).where(eq(stories.id, storyId));
const chapters = await db.select().from(chapters).where(eq(chapters.storyId, storyId));
const scenes = await db.select().from(scenes).where(inArray(scenes.chapterId, chapterIds));

// Assemble in memory (fast)
const result = assembleStoryStructure(story, chapters, scenes);
```

---

## Redis Optimizations

### 1. Use Redis Sorted Sets for Ordered Data

**Problem:** Currently storing entire objects as JSON strings.

**Current Implementation:**
```typescript
// Store entire scene as JSON
await redis.set(`scene:${sceneId}:public`, JSON.stringify(scene), { ex: 3600 });
```

**Optimized Implementation:**
```typescript
// Use sorted sets for ordered collections
await redis.zadd(
  `chapter:${chapterId}:scenes`,
  { score: scene.orderIndex, member: scene.id }
);

// Store individual scenes as hashes (more efficient)
await redis.hset(`scene:${sceneId}`, {
  title: scene.title,
  content: scene.content,
  status: scene.status,
  wordCount: scene.wordCount.toString(),
  orderIndex: scene.orderIndex.toString(),
});

// Retrieve ordered scenes for a chapter
const sceneIds = await redis.zrange(`chapter:${chapterId}:scenes`, 0, -1);
const scenes = await Promise.all(
  sceneIds.map(id => redis.hgetall(`scene:${id}`))
);
```

**Expected Impact:**
- Memory: **20-40% reduction** (hashes vs JSON)
- Ordered retrieval: **O(log N)** instead of O(N)
- Partial updates: Update single field instead of entire object

### 2. Pipeline Operations for Batch Queries

**Problem:** Multiple Redis operations have individual network latency.

**Solution:**
```typescript
// Bad: Sequential operations
const story = await redis.get(`story:${storyId}`);
const chapters = await redis.get(`story:${storyId}:chapters`);
const scenes = await redis.get(`chapter:${chapterId}:scenes`);
// Total: 3 * network latency

// Good: Pipeline operations
const pipeline = redis.pipeline();
pipeline.get(`story:${storyId}`);
pipeline.get(`story:${storyId}:chapters`);
pipeline.get(`chapter:${chapterId}:scenes`);
const results = await pipeline.exec();
// Total: 1 * network latency
```

**Expected Impact:**
- Network latency: **70-90% reduction**
- Total time: **3-5x faster** for batch operations

### 3. Cache Key Structure Optimization

**Current Structure:**
```
story:{id}:public
story:{id}:structure:scenes:false:public
scene:{id}:public
```

**Optimized Structure (Adversity-Triumph Schema):**
```
# Namespaced and hierarchical - Stories
fictures:story:{id}:public (HASH: title, status, summary, tone, moralFramework, imageUrl, imageVariants)
fictures:story:{id}:parts (ZSET: score=orderIndex, member=partId)
fictures:story:{id}:chapters (ZSET: score=orderIndex, member=chapterId)
fictures:popular:stories (ZSET: score=viewCount, member=storyId)

# Parts with character arcs
fictures:part:{id} (HASH: title, summary, characterArcs)

# Chapters with Adversity-Triumph tracking
fictures:chapter:{id} (HASH: title, summary, characterId, arcPosition, adversityType, virtueType, seedsPlanted, seedsResolved)
fictures:chapter:{id}:scenes (ZSET: score=orderIndex, member=sceneId)

# Scenes with visibility and publishing
fictures:scene:{id}:public (HASH: title, content, cyclePhase, emotionalBeat, visibility, publishedAt, viewCount)
fictures:scene:{id}:planning (HASH: characterFocus, sensoryAnchors, dialogueVsDescription, suggestedLength)

# Characters with core traits
fictures:story:{id}:characters (ZSET: score=isMain, member=characterId)
fictures:character:{id} (HASH: name, coreTrait, internalFlaw, externalGoal, relationships, voiceStyle)

# Settings with adversity elements
fictures:story:{id}:settings (SET: settingId)
fictures:setting:{id} (HASH: name, description, adversityElements, symbolicMeaning, cycleAmplification)
```

**Benefits:**
- Namespace collision prevention
- Efficient range queries with sorted sets
- Memory-efficient storage with hashes
- Better cache invalidation patterns

### 4. Cache Warming Strategy

**Problem:** First visit always hits database (cold cache).

**Solution:**
```typescript
// Background job to warm popular published content
async function warmPopularStoriesCache() {
  // Get top 100 popular published stories (Adversity-Triumph Engine)
  const popularStories = await db
    .select({
      id: stories.id,
      tone: stories.tone,
      viewCount: stories.viewCount,
    })
    .from(stories)
    .where(eq(stories.status, 'published'))
    .orderBy(desc(stories.viewCount))
    .limit(100);

  console.log(`[Cache Warming] Found ${popularStories.length} popular stories`);

  // Warm cache in batches
  const batchSize = 10;
  for (let i = 0; i < popularStories.length; i += batchSize) {
    const batch = popularStories.slice(i, i + batchSize);

    // Fetch full story data including Adversity-Triumph fields
    await Promise.all(
      batch.map(async (story) => {
        // Warm story cache (summary, tone, moralFramework, IDs)
        await getStoryWithStructure(story.id, false);

        // Warm public scenes cache (visibility=public only)
        await getPublishedScenes(story.id);

        // Warm character cache (coreTrait, relationships)
        await getStoryCharacters(story.id);
      })
    );

    console.log(`[Cache Warming] Warmed batch ${i / batchSize + 1}`);
  }
}

// Warm only public/published scenes
async function getPublishedScenes(storyId: string) {
  return db.select()
    .from(scenes)
    .where(
      and(
        eq(scenes.storyId, storyId),
        eq(scenes.visibility, 'public')
      )
    )
    .orderBy(asc(scenes.orderIndex));
}

// Run every 30 minutes to keep popular content cached
setInterval(warmPopularStoriesCache, 30 * 60 * 1000);
```

---

## Performance Targets

| Optimization | Current | Target | Expected Improvement |
|--------------|---------|--------|---------------------|
| **N+1 Query Fix** | 500-1000ms | 50-100ms | **10x faster** |
| **Database Indexes** | 200-500ms | 50-100ms | **3-5x faster** |
| **Redis Pipeline** | 150ms | 50ms | **3x faster** |
| **Column Selection** | 100KB | 30KB | **70% reduction** |
| **Cache Warming** | 3.7s cold | 0.5s | **7x faster** |

**Overall Expected Improvement:**
- Cold cache: 3.7s → **`<0`.5s** (7x faster)
- Warm cache: 0.5s → **`<0`.1s** (5x faster)
- Database load: **60-80% reduction**

---

## Database Schema Reference

### Current Schema (Adversity-Triumph Engine)

**Stories Table:**
- **Core fields**: id, title, genre, status, authorId
- **Image fields**: imageUrl, imageVariants (optimized variants)
- **Adversity-Triumph fields**: summary, tone, moralFramework
- **ID arrays**: partIds, chapterIds, sceneIds (quick access)
- **Tracking**: viewCount, rating, ratingCount

**Parts Table:**
- **Core fields**: id, title, storyId, authorId, orderIndex
- **Adversity-Triumph fields**:
  - summary (multi-character MACRO arcs)
  - characterArcs (array of macro adversity-triumph cycles per character)

**Chapters Table:**
- **Core fields**: id, title, summary, storyId, partId, orderIndex, status
- **Publishing**: publishedAt, scheduledFor
- **Adversity-Triumph fields**:
  - characterId, arcPosition, contributesToMacroArc
  - focusCharacters (array of character IDs)
  - adversityType, virtueType
  - seedsPlanted, seedsResolved (setup/payoff tracking)
  - connectsToPreviousChapter, createsNextAdversity

**Scenes Table:**
- **Core fields**: id, title, content, chapterId, orderIndex
- **Image fields**: imageUrl, imageVariants
- **Adversity-Triumph fields**:
  - cyclePhase, emotionalBeat
  - Planning metadata: characterFocus, sensoryAnchors, dialogueVsDescription, suggestedLength
- **Publishing fields**:
  - visibility (private/unlisted/public), publishedAt, scheduledFor
  - autoPublish, publishedBy, unpublishedAt, unpublishedBy
- **Comic fields**: comicStatus, comicPublishedAt, comicPanelCount, comicVersion
- **View tracking**: viewCount, uniqueViewCount, novelViewCount, comicViewCount

**Characters Table:**
- **Core fields**: id, name, storyId, isMain
- **Image fields**: imageUrl, imageVariants
- **Adversity-Triumph fields**:
  - coreTrait (defining moral virtue)
  - internalFlaw (source of adversity)
  - externalGoal
  - relationships (Jeong system tracking)
  - voiceStyle (dialogue generation)

**Settings Table:**
- **Core fields**: id, name, storyId, description
- **Image fields**: imageUrl, imageVariants
- **Adversity-Triumph fields**:
  - adversityElements (physicalObstacles, scarcityFactors, dangerSources, socialDynamics)
  - symbolicMeaning (reflects moral framework)
  - cycleAmplification (how setting amplifies each cycle phase)
  - emotionalResonance

### Index Strategy for Adversity-Triumph Schema

**Additional indexes for new fields:**
```sql
-- Scenes publishing and visibility
CREATE INDEX idx_scenes_visibility ON scenes(visibility);
CREATE INDEX idx_scenes_published_at ON scenes(published_at DESC);
CREATE INDEX idx_scenes_comic_status ON scenes(comic_status);

-- View tracking for analytics
CREATE INDEX idx_scenes_view_count ON scenes(view_count DESC);
CREATE INDEX idx_scenes_novel_view_count ON scenes(novel_view_count DESC);
CREATE INDEX idx_scenes_comic_view_count ON scenes(comic_view_count DESC);

-- Chapter adversity-triumph tracking
CREATE INDEX idx_chapters_character_id ON chapters(character_id);
CREATE INDEX idx_chapters_arc_position ON chapters(arc_position);
CREATE INDEX idx_chapters_virtue_type ON chapters(virtue_type);

-- Characters core trait system
CREATE INDEX idx_characters_is_main ON characters(is_main);
CREATE INDEX idx_characters_story_main ON characters(story_id, is_main);
```
