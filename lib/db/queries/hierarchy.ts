import { db } from '@/lib/db';
import { 
  story, 
  part, 
  chapterEnhanced, 
  scene, 
  bookHierarchyPath, 
  contentSearchIndex,
  book
} from '@/lib/db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';

/**
 * Book Hierarchy CRUD Operations
 * 
 * Implements the 4-level hierarchy: Story > Part > Chapter > Scene
 * Provides comprehensive CRUD operations for all hierarchy levels
 * Maintains referential integrity and word count aggregation
 */

// Types for CRUD operations
export interface CreateStoryData {
  bookId: string;
  title: string;
  synopsis?: string;
  themes?: string[];
  worldSettings?: any;
  characterArcs?: any;
  plotStructure?: any;
  order?: number;
}

export interface CreatePartData {
  storyId: string;
  title: string;
  description?: string;
  partNumber: number;
  thematicFocus?: string;
  timeframe?: any;
  location?: string;
  notes?: string;
}

export interface CreateChapterData {
  partId: string;
  bookId: string;
  chapterNumber: number;
  globalChapterNumber: number;
  title: string;
  summary?: string;
  content: any;
  pov?: string;
  setting?: string;
  charactersPresent?: string[];
}

export interface CreateSceneData {
  chapterId: string;
  sceneNumber: number;
  title?: string;
  content: string;
  sceneType?: 'action' | 'dialogue' | 'exposition' | 'transition' | 'climax';
  pov?: string;
  location?: string;
  timeOfDay?: string;
  charactersPresent?: string[];
  mood?: 'tense' | 'romantic' | 'mysterious' | 'comedic' | 'dramatic' | 'neutral';
  purpose?: string;
  conflict?: string;
  resolution?: string;
}

export interface HierarchyContext {
  scene: {
    current: any;
    previous: any[];
    next: any[];
  };
  chapter: {
    summary: string;
    scenes: any[];
    pov: string;
    setting: string;
  };
  part: {
    description: string;
    thematicFocus: string;
    chapterSummaries: string[];
  };
  story: {
    synopsis: string;
    themes: string[];
    worldSettings: any;
    characterArcs: any;
  };
  book: {
    title: string;
    genre: string;
    overallProgress: number;
  };
}

export interface SearchOptions {
  levels?: ('story' | 'part' | 'chapter' | 'scene')[];
  limit?: number;
  offset?: number;
}

// ============================================================================
// STORY CRUD OPERATIONS
// ============================================================================

export async function createStory(data: CreateStoryData) {
  const result = await db.insert(story).values({
    bookId: data.bookId,
    title: data.title,
    synopsis: data.synopsis,
    themes: data.themes || [],
    worldSettings: data.worldSettings,
    characterArcs: data.characterArcs,
    plotStructure: data.plotStructure,
    order: data.order || 0,
    wordCount: 0,
    partCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();

  return result[0];
}

export async function getStoryWithParts(storyId: string) {
  const storyResult = await db.select()
    .from(story)
    .where(eq(story.id, storyId));

  if (storyResult.length === 0) {
    return null;
  }

  const storyData = storyResult[0];
  const partsResult = await db.select()
    .from(part)
    .where(eq(part.storyId, storyId))
    .orderBy(part.order);

  return {
    ...storyData,
    parts: partsResult
  };
}

export async function updateStory(storyId: string, updates: Partial<CreateStoryData>) {
  const result = await db.update(story)
    .set({
      ...updates,
      updatedAt: new Date()
    })
    .where(eq(story.id, storyId))
    .returning();

  return result[0];
}

export async function deleteStory(storyId: string) {
  await db.delete(story).where(eq(story.id, storyId));
}

// ============================================================================
// PART CRUD OPERATIONS
// ============================================================================

export async function createPart(data: CreatePartData) {
  const result = await db.insert(part).values({
    storyId: data.storyId,
    title: data.title,
    description: data.description,
    partNumber: data.partNumber,
    thematicFocus: data.thematicFocus,
    timeframe: data.timeframe,
    location: data.location,
    wordCount: 0,
    chapterCount: 0,
    order: 0,
    isComplete: false,
    notes: data.notes,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();

  // Update story part count
  await updateStoryPartCount(data.storyId);

  return result[0];
}

export async function getPartWithChapters(partId: string) {
  const partResult = await db.select()
    .from(part)
    .where(eq(part.id, partId));

  if (partResult.length === 0) {
    return null;
  }

  const partData = partResult[0];
  const chaptersResult = await db.select()
    .from(chapterEnhanced)
    .where(eq(chapterEnhanced.partId, partId))
    .orderBy(chapterEnhanced.order);

  return {
    ...partData,
    chapters: chaptersResult
  };
}

export async function updatePart(partId: string, updates: Partial<CreatePartData>) {
  const result = await db.update(part)
    .set({
      ...updates,
      updatedAt: new Date()
    })
    .where(eq(part.id, partId))
    .returning();

  return result[0];
}

export async function deletePart(partId: string) {
  const partData = await db.select().from(part).where(eq(part.id, partId));
  if (partData.length > 0) {
    const storyId = partData[0].storyId;
    await db.delete(part).where(eq(part.id, partId));
    await updateStoryPartCount(storyId);
  }
}

// ============================================================================
// CHAPTER CRUD OPERATIONS
// ============================================================================

export async function createChapter(data: CreateChapterData) {
  const result = await db.insert(chapterEnhanced).values({
    partId: data.partId,
    bookId: data.bookId,
    chapterNumber: data.chapterNumber,
    globalChapterNumber: data.globalChapterNumber,
    title: data.title,
    summary: data.summary,
    content: data.content,
    wordCount: 0,
    sceneCount: 0,
    order: 0,
    pov: data.pov,
    setting: data.setting,
    charactersPresent: data.charactersPresent || [],
    isPublished: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();

  // Update part chapter count
  await updatePartChapterCount(data.partId);

  return result[0];
}

export async function getChapterWithScenes(chapterId: string) {
  const chapterResult = await db.select()
    .from(chapterEnhanced)
    .where(eq(chapterEnhanced.id, chapterId));

  if (chapterResult.length === 0) {
    return null;
  }

  const chapterData = chapterResult[0];
  const scenesResult = await db.select()
    .from(scene)
    .where(eq(scene.chapterId, chapterId))
    .orderBy(scene.order);

  return {
    ...chapterData,
    scenes: scenesResult
  };
}

export async function updateChapter(chapterId: string, updates: Partial<CreateChapterData>) {
  const result = await db.update(chapterEnhanced)
    .set({
      ...updates,
      updatedAt: new Date()
    })
    .where(eq(chapterEnhanced.id, chapterId))
    .returning();

  return result[0];
}

export async function deleteChapter(chapterId: string) {
  const chapterData = await db.select().from(chapterEnhanced).where(eq(chapterEnhanced.id, chapterId));
  if (chapterData.length > 0) {
    const partId = chapterData[0].partId;
    await db.delete(chapterEnhanced).where(eq(chapterEnhanced.id, chapterId));
    await updatePartChapterCount(partId);
  }
}

// ============================================================================
// SCENE CRUD OPERATIONS
// ============================================================================

export async function createScene(data: CreateSceneData) {
  const result = await db.insert(scene).values({
    chapterId: data.chapterId,
    sceneNumber: data.sceneNumber,
    title: data.title,
    content: data.content,
    wordCount: data.content.split(' ').length, // Simple word count
    order: 0,
    sceneType: data.sceneType || 'action',
    pov: data.pov,
    location: data.location,
    timeOfDay: data.timeOfDay,
    charactersPresent: data.charactersPresent || [],
    mood: data.mood || 'neutral',
    purpose: data.purpose,
    conflict: data.conflict,
    resolution: data.resolution,
    isComplete: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();

  // Update chapter scene count and word count
  await updateChapterSceneCount(data.chapterId);
  await updateWordCounts('scene', result[0].id);

  return result[0];
}

export async function getSceneDetails(sceneId: string) {
  const result = await db.select()
    .from(scene)
    .where(eq(scene.id, sceneId));

  return result[0] || null;
}

export async function updateScene(sceneId: string, updates: Partial<CreateSceneData>) {
  const result = await db.update(scene)
    .set({
      ...updates,
      updatedAt: new Date()
    })
    .where(eq(scene.id, sceneId))
    .returning();

  // Update word counts after scene content changes
  if (updates.content) {
    await updateWordCounts('scene', sceneId);
  }

  return result[0];
}

export async function deleteScene(sceneId: string) {
  const sceneData = await db.select().from(scene).where(eq(scene.id, sceneId));
  if (sceneData.length > 0) {
    const chapterId = sceneData[0].chapterId;
    await db.delete(scene).where(eq(scene.id, sceneId));
    await updateChapterSceneCount(chapterId);
    await updateWordCounts('chapter', chapterId);
  }
}

// ============================================================================
// HIERARCHY NAVIGATION AND CONTEXT
// ============================================================================

export async function getHierarchyPath(level: string, entityId: string) {
  const result = await db.select()
    .from(bookHierarchyPath)
    .where(and(
      eq(bookHierarchyPath.level, level),
      eq(bookHierarchyPath.entityId, entityId)
    ));

  return result[0] || null;
}

export async function buildHierarchyContext(sceneId: string): Promise<HierarchyContext> {
  // Get scene
  const sceneData = await getSceneDetails(sceneId);
  if (!sceneData) {
    throw new Error('Scene not found');
  }

  // Get chapter with scenes
  const chapterData = await getChapterWithScenes(sceneData.chapterId);
  if (!chapterData) {
    throw new Error('Chapter not found');
  }

  // Get part
  const partData = await getPartWithChapters(chapterData.partId);
  if (!partData) {
    throw new Error('Part not found');
  }

  // Get story
  const storyData = await getStoryWithParts(partData.storyId);
  if (!storyData) {
    throw new Error('Story not found');
  }

  // Get book
  const bookResult = await db.select().from(book).where(eq(book.id, storyData.bookId));
  const bookData = bookResult[0];

  // Get previous and next scenes
  const currentSceneIndex = chapterData.scenes.findIndex(s => s.id === sceneId);
  const previousScenes = chapterData.scenes.slice(Math.max(0, currentSceneIndex - 3), currentSceneIndex);
  const nextScenes = chapterData.scenes.slice(currentSceneIndex + 1, currentSceneIndex + 4);

  return {
    scene: {
      current: sceneData,
      previous: previousScenes,
      next: nextScenes
    },
    chapter: {
      summary: chapterData.summary || '',
      scenes: chapterData.scenes,
      pov: chapterData.pov || '',
      setting: chapterData.setting || ''
    },
    part: {
      description: partData.description || '',
      thematicFocus: partData.thematicFocus || '',
      chapterSummaries: partData.chapters.map(c => c.summary).filter(Boolean)
    },
    story: {
      synopsis: storyData.synopsis || '',
      themes: storyData.themes || [],
      worldSettings: storyData.worldSettings,
      characterArcs: storyData.characterArcs
    },
    book: {
      title: bookData.title,
      genre: bookData.genre || '',
      overallProgress: Math.round((bookData.wordCount / 80000) * 100) // Assume 80k target
    }
  };
}

// ============================================================================
// SEARCH FUNCTIONALITY
// ============================================================================

export async function searchHierarchy(bookId: string, query: string, options: SearchOptions = {}) {
  const { 
    levels = ['story', 'part', 'chapter', 'scene'],
    limit = 20,
    offset = 0 
  } = options;

  return await db
    .select({
      id: contentSearchIndex.entityId,
      type: contentSearchIndex.entityType,
      title: contentSearchIndex.title,
      path: contentSearchIndex.path,
      snippet: sql`
        ts_headline(
          'english',
          ${contentSearchIndex.searchableText},
          plainto_tsquery('english', ${query}),
          'MaxWords=50, MinWords=25'
        )
      `,
      rank: sql`
        ts_rank(
          to_tsvector('english', ${contentSearchIndex.searchableText}),
          plainto_tsquery('english', ${query})
        )
      `
    })
    .from(contentSearchIndex)
    .where(
      and(
        eq(contentSearchIndex.bookId, bookId),
        inArray(contentSearchIndex.entityType, levels),
        sql`
          to_tsvector('english', ${contentSearchIndex.searchableText}) 
          @@ plainto_tsquery('english', ${query})
        `
      )
    )
    .orderBy(desc(sql`rank`))
    .limit(limit)
    .offset(offset);
}

// ============================================================================
// WORD COUNT MANAGEMENT
// ============================================================================

export async function updateWordCounts(level: string, entityId: string) {
  switch (level) {
    case 'scene':
      await updateSceneWordCount(entityId);
      break;
    case 'chapter':
      await updateChapterWordCount(entityId);
      break;
    case 'part':
      await updatePartWordCount(entityId);
      break;
    case 'story':
      await updateStoryWordCount(entityId);
      break;
  }
}

async function updateSceneWordCount(sceneId: string) {
  const sceneData = await db.select().from(scene).where(eq(scene.id, sceneId));
  if (sceneData.length > 0) {
    const wordCount = sceneData[0].content.split(' ').length;
    await db.update(scene)
      .set({ wordCount, updatedAt: new Date() })
      .where(eq(scene.id, sceneId));
    
    // Propagate up to chapter
    await updateChapterWordCount(sceneData[0].chapterId);
  }
}

async function updateChapterWordCount(chapterId: string) {
  const scenes = await db.select().from(scene).where(eq(scene.chapterId, chapterId));
  const totalWordCount = scenes.reduce((sum, s) => sum + s.wordCount, 0);
  
  await db.update(chapterEnhanced)
    .set({ wordCount: totalWordCount, updatedAt: new Date() })
    .where(eq(chapterEnhanced.id, chapterId));

  // Get part ID and propagate up
  const chapterData = await db.select().from(chapterEnhanced).where(eq(chapterEnhanced.id, chapterId));
  if (chapterData.length > 0) {
    await updatePartWordCount(chapterData[0].partId);
  }
}

async function updatePartWordCount(partId: string) {
  const chapters = await db.select().from(chapterEnhanced).where(eq(chapterEnhanced.partId, partId));
  const totalWordCount = chapters.reduce((sum, c) => sum + c.wordCount, 0);
  
  await db.update(part)
    .set({ wordCount: totalWordCount, updatedAt: new Date() })
    .where(eq(part.id, partId));

  // Get story ID and propagate up
  const partData = await db.select().from(part).where(eq(part.id, partId));
  if (partData.length > 0) {
    await updateStoryWordCount(partData[0].storyId);
  }
}

async function updateStoryWordCount(storyId: string) {
  const parts = await db.select().from(part).where(eq(part.storyId, storyId));
  const totalWordCount = parts.reduce((sum, p) => sum + p.wordCount, 0);
  
  await db.update(story)
    .set({ wordCount: totalWordCount, updatedAt: new Date() })
    .where(eq(story.id, storyId));

  // Get book ID and update book word count
  const storyData = await db.select().from(story).where(eq(story.id, storyId));
  if (storyData.length > 0) {
    await updateBookWordCount(storyData[0].bookId);
  }
}

async function updateBookWordCount(bookId: string) {
  const stories = await db.select().from(story).where(eq(story.bookId, bookId));
  const totalWordCount = stories.reduce((sum, s) => sum + s.wordCount, 0);
  
  await db.update(book)
    .set({ wordCount: totalWordCount, updatedAt: new Date() })
    .where(eq(book.id, bookId));
}

// ============================================================================
// COUNT MANAGEMENT HELPERS
// ============================================================================

async function updateStoryPartCount(storyId: string) {
  const parts = await db.select().from(part).where(eq(part.storyId, storyId));
  await db.update(story)
    .set({ partCount: parts.length, updatedAt: new Date() })
    .where(eq(story.id, storyId));
}

async function updatePartChapterCount(partId: string) {
  const chapters = await db.select().from(chapterEnhanced).where(eq(chapterEnhanced.partId, partId));
  await db.update(part)
    .set({ chapterCount: chapters.length, updatedAt: new Date() })
    .where(eq(part.id, partId));
}

async function updateChapterSceneCount(chapterId: string) {
  const scenes = await db.select().from(scene).where(eq(scene.chapterId, chapterId));
  await db.update(chapterEnhanced)
    .set({ sceneCount: scenes.length, updatedAt: new Date() })
    .where(eq(chapterEnhanced.id, chapterId));
}