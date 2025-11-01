import { db } from './index';
import { stories, chapters, parts, scenes } from './schema';
import { eq, asc, inArray } from 'drizzle-orm';

/**
 * ⚡ Strategy 3: Smart Data Reduction
 *
 * Optimized queries for reading mode that skip studio-only fields
 * while keeping imageVariants for AVIF/WebP optimization.
 *
 * Fields SKIPPED (studio-only):
 * - Chapter: arcPosition, adversityType, virtueType, seedsPlanted, seedsResolved
 * - Scene: characterFocus, sensoryAnchors, voiceStyle, planning metadata
 *
 * Fields KEPT (critical for reading):
 * - imageUrl, imageVariants (for AVIF/WebP optimization)
 * - content, title, description (for display)
 * - orderIndex, status, visibility (for navigation)
 */

/**
 * Get story with structure optimized for reading mode
 * Reduces data transfer by ~25% compared to full studio query
 */
export async function getStoryForReading(storyId: string) {
  // Get story with only reading-relevant fields
  const [story] = await db.select({
    id: stories.id,
    title: stories.title,
    description: stories.description,
    genre: stories.genre,
    tone: stories.tone,
    moralFramework: stories.moralFramework,
    summary: stories.summary,
    status: stories.status,
    authorId: stories.authorId,
    userId: stories.userId,
    imageUrl: stories.imageUrl,
    imageVariants: stories.imageVariants, // ⚡ CRITICAL: Needed for AVIF optimization
    totalWords: stories.totalWords,
    createdAt: stories.createdAt,
    updatedAt: stories.updatedAt,
  })
    .from(stories)
    .where(eq(stories.id, storyId))
    .limit(1);

  if (!story) return null;

  if (!story) return null;

  // Get parts with reading-relevant fields only
  const storyParts = await db.select({
    id: parts.id,
    storyId: parts.storyId,
    title: parts.title,
    description: parts.description,
    orderIndex: parts.orderIndex,
    createdAt: parts.createdAt,
    updatedAt: parts.updatedAt,
  })
    .from(parts)
    .where(eq(parts.storyId, storyId))
    .orderBy(asc(parts.orderIndex));

  // Get chapters with reading-relevant fields only (skip studio metadata)
  const allChapters = await db.select({
    id: chapters.id,
    storyId: chapters.storyId,
    partId: chapters.partId,
    title: chapters.title,
    summary: chapters.summary,
    status: chapters.status,
    orderIndex: chapters.orderIndex,
    imageUrl: chapters.imageUrl,
    imageVariants: chapters.imageVariants, // ⚡ CRITICAL: Needed for AVIF optimization
    totalWords: chapters.totalWords,
    createdAt: chapters.createdAt,
    updatedAt: chapters.updatedAt,
    // ❌ SKIPPED: arcPosition, adversityType, virtueType, seedsPlanted, seedsResolved (studio-only)
  })
    .from(chapters)
    .where(eq(chapters.storyId, storyId))
    .orderBy(asc(chapters.orderIndex));

  // For reading mode, scenes are loaded on demand (see getChapterScenesForReading)
  return {
    ...story,
    parts: storyParts.map(part => ({
      ...part,
      chapters: allChapters
        .filter(chapter => chapter.partId === part.id)
        .map(chapter => ({
          ...chapter,
          scenes: undefined // Will be loaded on demand
        }))
    })),
    chapters: allChapters
      .filter(chapter => !chapter.partId)
      .map(chapter => ({
        ...chapter,
        scenes: undefined // Will be loaded on demand
      }))
  };
}

/**
 * Get chapter scenes optimized for reading mode
 * Loads scenes on demand to reduce initial payload
 */
export async function getChapterScenesForReading(chapterId: string) {
  return await db.select({
    id: scenes.id,
    chapterId: scenes.chapterId,
    title: scenes.title,
    content: scenes.content,
    goal: scenes.goal,
    conflict: scenes.conflict,
    outcome: scenes.outcome,
    orderIndex: scenes.orderIndex,
    visibility: scenes.visibility,
    publishedAt: scenes.publishedAt,
    imageUrl: scenes.imageUrl,
    imageVariants: scenes.imageVariants, // ⚡ CRITICAL: Needed for AVIF optimization
    createdAt: scenes.createdAt,
    updatedAt: scenes.updatedAt,
    // ❌ SKIPPED: characterFocus, sensoryAnchors, voiceStyle, planning metadata (studio-only)
  })
    .from(scenes)
    .where(eq(scenes.chapterId, chapterId))
    .orderBy(asc(scenes.orderIndex));
}

/**
 * Calculate estimated data reduction
 *
 * Studio-only fields per entity:
 * - Chapter: ~200 bytes (5 fields × ~40 bytes each)
 * - Scene: ~600 bytes (3 arrays × ~200 bytes each)
 *
 * For a typical story with 10 chapters, 30 scenes:
 * - Chapters: 10 × 200 bytes = 2 KB saved
 * - Scenes: 30 × 600 bytes = 18 KB saved
 * - Total: ~20 KB saved (~25% reduction for typical 80 KB story)
 *
 * While keeping imageVariants (~3 KB) enables AVIF optimization
 * that saves ~125 KB per image (40x ROI).
 */
