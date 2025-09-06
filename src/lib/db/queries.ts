import { db } from './index';
import { stories, chapters, users, userStats, parts, scenes } from './schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { RelationshipManager } from './relationships';

// User authentication queries
export async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  return user || null;
}

export async function createUser(data: {
  email: string;
  name?: string;
  image?: string;
}) {
  const userId = nanoid();
  
  const [user] = await db.insert(users).values({
    id: userId,
    email: data.email,
    name: data.name,
    image: data.image,
    role: 'reader',
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  return user;
}

export async function updateUser(userId: string, data: {
  name?: string;
  image?: string;
  emailVerified?: Date;
}) {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  return user;
}

// Stories queries
export async function createStory(authorId: string, data: {
  title: string;
  description?: string;
  genre?: string;
  targetWordCount?: number;
}) {
  const storyId = nanoid();
  
  const [story] = await db.insert(stories).values({
    id: storyId,
    title: data.title,
    description: data.description,
    genre: data.genre,
    authorId,
    targetWordCount: data.targetWordCount || 50000,
    status: 'draft',
    isPublic: false,
    // Initialize bi-directional arrays
    partIds: [],
    chapterIds: [],
  }).returning();

  return story;
}

export async function getUserStories(userId: string) {
  return await db
    .select()
    .from(stories)
    .where(eq(stories.authorId, userId))
    .orderBy(desc(stories.updatedAt));
}

// Get user stories with their first chapter and counts for navigation - optimized version with only 3 DB queries
export async function getUserStoriesWithFirstChapter(userId: string) {
  // Query 1: Get all user stories
  const userStories = await getUserStories(userId);
  
  if (userStories.length === 0) return [];

  // Extract story IDs for subsequent queries
  const storyIds = userStories.map(story => story.id);

  // Query 2: Get all chapters for all user stories at once with minimal data
  const allChapters = await db
    .select({
      storyId: chapters.storyId,
      id: chapters.id,
      orderIndex: chapters.orderIndex,
      status: chapters.status
    })
    .from(chapters)
    .where(inArray(chapters.storyId, storyIds))
    .orderBy(chapters.orderIndex);

  // Query 3: Get all parts for all user stories at once with minimal data
  const allParts = await db
    .select({
      storyId: parts.storyId,
      id: parts.id
    })
    .from(parts)
    .where(inArray(parts.storyId, storyIds));

  // Process data efficiently in memory
  const storiesWithData = userStories.map(story => {
    const storyChapters = allChapters.filter(ch => ch.storyId === story.id);
    const storyParts = allParts.filter(pt => pt.storyId === story.id);
    
    // Get first chapter (already ordered by orderIndex)
    const firstChapter = storyChapters.length > 0 ? storyChapters[0] : null;
    
    // Count completed chapters
    const completedChapters = storyChapters.filter(ch => 
      ch.status === 'completed' || ch.status === 'published'
    ).length;
    
    // Check if story is actually published (has published chapters AND is public)
    const hasPublishedChapters = storyChapters.some(chapter => chapter.status === 'published');
    const actualStatus = (story.isPublic && story.status === 'published' && hasPublishedChapters) 
      ? 'published' 
      : story.status;
    
    return {
      ...story,
      status: actualStatus, // Override with actual publication status
      firstChapterId: firstChapter?.id || null,
      totalChapters: storyChapters.length,
      completedChapters,
      totalParts: storyParts.length,
      completedParts: storyParts.length // Assuming all parts are "completed" if they exist
    };
  });
  
  return storiesWithData;
}

export async function getStoryById(storyId: string, userId?: string) {
  const story = await db
    .select()
    .from(stories)
    .where(eq(stories.id, storyId))
    .limit(1);

  if (!story[0]) return null;

  // Check if user has access (public stories or user's own stories)
  if (!story[0].isPublic && story[0].authorId !== userId) {
    return null;
  }

  return story[0];
}

export async function updateStory(storyId: string, userId: string, data: Partial<{
  title: string;
  description: string;
  genre: string;
  status: string;
  isPublic: boolean;
  targetWordCount: number;
}>) {
  const [updatedStory] = await db
    .update(stories)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(stories.id, storyId), eq(stories.authorId, userId)))
    .returning();

  return updatedStory;
}

// Chapters queries
export async function createChapter(storyId: string, authorId: string, data: {
  title: string;
  partId?: string;
  orderIndex: number;
  targetWordCount?: number;
}) {
  // Use RelationshipManager for bi-directional consistency
  const chapterId = await RelationshipManager.addChapterToStory(
    storyId,
    {
      title: data.title,
      authorId,
      orderIndex: data.orderIndex,
      targetWordCount: data.targetWordCount || 4000,
      status: 'draft',
      sceneIds: [], // Initialize empty scene IDs
    },
    data.partId
  );
  
  // Return the created chapter
  const [chapter] = await db.select()
    .from(chapters)
    .where(eq(chapters.id, chapterId))
    .limit(1);
    
  return chapter!;
}

// Create the first chapter for a story
export async function createFirstChapter(storyId: string, authorId: string) {
  // Use bi-directional lookup for faster chapter count
  const [story] = await db.select()
    .from(stories)
    .where(eq(stories.id, storyId))
    .limit(1);
    
  if (!story) throw new Error('Story not found');
  
  const nextOrderIndex = story.chapterIds.length + 1;

  return createChapter(storyId, authorId, {
    title: `Chapter ${nextOrderIndex}`,
    orderIndex: nextOrderIndex,
    targetWordCount: 4000,
  });
}

export async function getChapterById(chapterId: string, userId?: string) {
  const [chapter] = await db
    .select()
    .from(chapters)
    .leftJoin(stories, eq(chapters.storyId, stories.id))
    .where(eq(chapters.id, chapterId))
    .limit(1);

  if (!chapter) return null;

  // Check access permissions
  if (!chapter.stories?.isPublic && chapter.stories?.authorId !== userId) {
    return null;
  }

  return chapter.chapters;
}

export async function updateChapter(chapterId: string, userId: string, data: Partial<{
  title: string;
  content: string;
  status: string;
  wordCount: number;
  publishedAt: Date;
  scheduledFor: Date;
}>) {
  // First verify user owns the story
  const [chapter] = await db
    .select({ authorId: stories.authorId })
    .from(chapters)
    .leftJoin(stories, eq(chapters.storyId, stories.id))
    .where(eq(chapters.id, chapterId))
    .limit(1);

  if (!chapter || chapter.authorId !== userId) {
    throw new Error('Chapter not found or access denied');
  }

  const [updatedChapter] = await db
    .update(chapters)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(chapters.id, chapterId))
    .returning();

  return updatedChapter;
}

export async function getStoryChapters(storyId: string, userId?: string) {
  // First check if user has access to the story
  const story = await getStoryById(storyId, userId);
  if (!story) return [];

  return await db
    .select()
    .from(chapters)
    .where(eq(chapters.storyId, storyId))
    .orderBy(chapters.orderIndex);
}

// User stats helpers
export async function updateUserStats(userId: string, updates: Partial<{
  totalWordsWritten: number;
  storiesPublished: number;
  chaptersPublished: number;
  lastWritingDate: Date;
}>) {
  await db
    .update(userStats)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(userStats.userId, userId));
}

// Dynamic status calculation utilities
export function calculateSceneStatus(scene: { content?: string; wordCount?: number; status?: string }) {
  // Always respect explicit database status first
  if (scene.status === 'complete') {
    return 'completed';
  }
  if (scene.status === 'completed') {
    return 'completed';
  }
  if (scene.status === 'in_progress') {
    return 'in_progress';
  }
  if (scene.status === 'planned') {
    return 'planned';
  }
  if (scene.status === 'draft') {
    return 'draft';
  }
  
  // If no explicit database status, calculate based on content
  if (!scene.content || scene.content.trim() === '') {
    return 'draft';
  }
  
  // Consider a scene completed if it has substantial content (200+ words)
  if (scene.wordCount && scene.wordCount >= 200) {
    return 'completed';
  }
  
  // Scenes with some content but less than 200 words are in progress
  return scene.wordCount && scene.wordCount > 0 ? 'in_progress' : 'draft';
}

export function calculateChapterStatus(scenes: Array<{ status: string }>) {
  if (!scenes || scenes.length === 0) {
    return 'draft';
  }
  
  const completedScenes = scenes.filter(scene => scene.status === 'completed').length;
  const inProgressScenes = scenes.filter(scene => scene.status === 'in_progress').length;
  const totalScenes = scenes.length;
  
  if (completedScenes === totalScenes && totalScenes > 0) {
    return 'completed';
  } else if (completedScenes > 0 || inProgressScenes > 0) {
    return 'in_progress'; 
  } else {
    return 'draft';
  }
}

export function calculatePartStatus(chapters: Array<{ status: string }>) {
  if (!chapters || chapters.length === 0) {
    return 'draft';
  }
  
  const completedChapters = chapters.filter(chapter => chapter.status === 'completed').length;
  const inProgressChapters = chapters.filter(chapter => chapter.status === 'in_progress').length;
  const totalChapters = chapters.length;
  
  if (completedChapters === totalChapters && totalChapters > 0) {
    return 'completed';
  } else if (completedChapters > 0 || inProgressChapters > 0) {
    return 'in_progress';
  } else {
    return 'draft';
  }
}

export function calculateStoryStatus(parts: Array<{ status: string }>, chapters: Array<{ status: string }>) {
  const allChapters = [...parts.flatMap(part => [{ status: part.status }]), ...chapters];
  
  if (allChapters.length === 0) {
    return 'draft';
  }
  
  const completedUnits = allChapters.filter(unit => unit.status === 'completed').length;
  const inProgressUnits = allChapters.filter(unit => unit.status === 'in_progress').length;
  const totalUnits = allChapters.length;
  
  if (completedUnits === totalUnits && totalUnits > 0) {
    return 'completed';
  } else if (completedUnits > 0 || inProgressUnits > 0) {
    return 'in_progress';
  } else {
    return 'draft';
  }
}

// Comprehensive story data with parts, chapters, and scenes - OPTIMIZED with bi-directional relationships
export async function getStoryWithStructure(storyId: string, userId?: string) {
  // Get story with all relationships using direct array lookups (much faster)
  const result = await RelationshipManager.getStoryWithStructure(storyId);
  if (!result) return null;
  
  // Check user access
  if (userId && result.authorId !== userId && !result.isPublic) {
    return null;
  }
  
  // Apply dynamic status calculations to match original interface
  const structuredParts = result.parts.map(part => {
    const partChapters = part.chapters.map(chapter => {
      const chapterScenes = chapter.scenes.map(scene => {
        // Calculate dynamic scene status
        const dynamicSceneStatus = calculateSceneStatus({
          content: scene.content || '',
          wordCount: scene.wordCount || 0,
          status: scene.status || ''
        });
        
        return {
          id: scene.id,
          title: scene.title,
          status: dynamicSceneStatus,
          wordCount: scene.wordCount || 0,
          goal: scene.goal || '',
          conflict: scene.conflict || '',
          outcome: scene.outcome || '',
          content: scene.content || '',
          orderIndex: scene.orderIndex
        };
      }).sort((a, b) => a.orderIndex - b.orderIndex);
      
      // Calculate dynamic chapter status
      const dynamicChapterStatus = calculateChapterStatus(chapterScenes);
      const finalStatus = chapter.status === 'published' ? 'published' : dynamicChapterStatus;
      
      return {
        id: chapter.id,
        title: chapter.title,
        orderIndex: chapter.orderIndex,
        status: finalStatus,
        wordCount: chapter.wordCount || 0,
        targetWordCount: chapter.targetWordCount || 4000,
        scenes: chapterScenes
      };
    });
    
    // Calculate dynamic part status
    const dynamicPartStatus = calculatePartStatus(partChapters);
    
    return {
      id: part.id,
      title: part.title,
      orderIndex: part.orderIndex,
      status: dynamicPartStatus,
      chapters: partChapters
    };
  });
  
  // Process standalone chapters
  const standaloneChapters = result.chapters.map(chapter => {
    const chapterScenes = chapter.scenes.map(scene => {
      const dynamicSceneStatus = calculateSceneStatus({
        content: scene.content || '',
        wordCount: scene.wordCount || 0,
        status: scene.status || ''
      });
      
      return {
        id: scene.id,
        title: scene.title,
        status: dynamicSceneStatus,
        wordCount: scene.wordCount || 0,
        goal: scene.goal || '',
        conflict: scene.conflict || '',
        outcome: scene.outcome || '',
        content: scene.content || '',
        orderIndex: scene.orderIndex
      };
    }).sort((a, b) => a.orderIndex - b.orderIndex);
    
    const dynamicChapterStatus = calculateChapterStatus(chapterScenes);
    const finalStatus = chapter.status === 'published' ? 'published' : dynamicChapterStatus;
    
    return {
      id: chapter.id,
      title: chapter.title,
      orderIndex: chapter.orderIndex,
      status: finalStatus,
      wordCount: chapter.wordCount || 0,
      targetWordCount: chapter.targetWordCount || 4000,
      scenes: chapterScenes
    };
  });
  
  // Calculate dynamic story status
  const dynamicStoryStatus = calculateStoryStatus(structuredParts, standaloneChapters);
  const finalStoryStatus = result.status === 'published' ? 'published' : dynamicStoryStatus;
  
  return {
    id: result.id,
    title: result.title,
    description: result.description,
    genre: result.genre || 'General',
    status: finalStoryStatus,
    storyData: result.storyData || null,
    userId: result.authorId,
    parts: structuredParts,
    chapters: standaloneChapters,
    scenes: [] // Legacy field - scenes are now nested in chapters
  };
}

// Get chapter with part information
export async function getChapterWithPart(chapterId: string, userId?: string) {
  
  const [result] = await db
    .select({
      chapter: {
        id: chapters.id,
        title: chapters.title,
        summary: chapters.summary,
        storyId: chapters.storyId,
        partId: chapters.partId,
        authorId: chapters.authorId,
        orderIndex: chapters.orderIndex,
        wordCount: chapters.wordCount,
        targetWordCount: chapters.targetWordCount,
        status: chapters.status,
        purpose: chapters.purpose,
        hook: chapters.hook,
        characterFocus: chapters.characterFocus,
        publishedAt: chapters.publishedAt,
        scheduledFor: chapters.scheduledFor,
        createdAt: chapters.createdAt,
        updatedAt: chapters.updatedAt,
      },
      part: parts,
      story: stories
    })
    .from(chapters)
    .leftJoin(parts, eq(chapters.partId, parts.id))
    .leftJoin(stories, eq(chapters.storyId, stories.id))
    .where(eq(chapters.id, chapterId))
    .limit(1);

  if (!result) return null;

  // Check access permissions
  if (!result.story?.isPublic && result.story?.authorId !== userId) {
    return null;
  }

  // Get scenes for this chapter
  const chapterScenes = await db
    .select()
    .from(scenes)
    .where(eq(scenes.chapterId, chapterId))
    .orderBy(scenes.orderIndex);

  // Map scenes with dynamic status calculation
  const scenesWithStatus = chapterScenes.map(scene => {
    const sceneContent = scene.content || '';
    const sceneWordCount = scene.wordCount || 0;
    const dbStatus = scene.status || '';
    
    const dynamicSceneStatus = calculateSceneStatus({ 
      content: sceneContent, 
      wordCount: sceneWordCount,
      status: dbStatus
    });
    
    return {
      id: scene.id,
      title: scene.title,
      status: dynamicSceneStatus,
      wordCount: sceneWordCount,
      goal: scene.goal || '',
      conflict: scene.conflict || '',
      outcome: scene.outcome || '',
      content: sceneContent,
      orderIndex: scene.orderIndex
    };
  });

  return {
    chapter: {
      ...result.chapter,
      scenes: scenesWithStatus
    },
    partTitle: result.part?.title || null,
    storyId: result.story?.id
  };
}

// Get published stories for Browse page - optimized version with only 3 DB queries
export async function getPublishedStories() {
  // Query 1: Get all published stories with their authors
  const publishedStories = await db
    .select({
      id: stories.id,
      title: stories.title,
      description: stories.description,
      genre: stories.genre,
      status: stories.status,
      viewCount: stories.viewCount,
      rating: stories.rating,
      currentWordCount: stories.currentWordCount,
      createdAt: stories.createdAt,
      authorId: stories.authorId,
      authorName: users.name
    })
    .from(stories)
    .leftJoin(users, eq(stories.authorId, users.id))
    .where(and(
      eq(stories.isPublic, true), 
      eq(stories.status, 'published')
    ))
    .orderBy(desc(stories.updatedAt));

  if (publishedStories.length === 0) return [];

  // Extract story IDs for subsequent queries
  const storyIds = publishedStories.map(story => story.id);

  // Query 2: Get all chapters for all published stories at once with aggregated data
  const storyChapters = await db
    .select({
      storyId: chapters.storyId,
      chapterId: chapters.id,
      chapterWordCount: chapters.wordCount,
      chapterStatus: chapters.status,
      hasPublishedChapter: eq(chapters.status, 'published')
    })
    .from(chapters)
    .where(inArray(chapters.storyId, storyIds));

  // Query 3: Get all scenes for all chapters in published stories with aggregated data
  const chapterIds = storyChapters.map(ch => ch.chapterId);
  const chapterScenes = chapterIds.length > 0 ? await db
    .select({
      chapterId: scenes.chapterId,
      sceneWordCount: scenes.wordCount
    })
    .from(scenes)
    .where(inArray(scenes.chapterId, chapterIds))
    : [];

  // Process data to calculate word counts - show all published stories
  const validPublishedStories = [];

  for (const story of publishedStories) {
    const storyChaps = storyChapters.filter(ch => ch.storyId === story.id);
    
    // Calculate total word count from scenes or chapters
    let totalWords = 0;
    
    for (const chapter of storyChaps) {
      const chapScenes = chapterScenes.filter(sc => sc.chapterId === chapter.chapterId);
      
      if (chapScenes.length > 0) {
        // Use scene word counts if available
        const sceneWords = chapScenes.reduce((sum, scene) => sum + (scene.sceneWordCount || 0), 0);
        if (sceneWords > 0) {
          totalWords += sceneWords;
        } else {
          // Fallback to chapter word count if scenes exist but have no word count
          totalWords += chapter.chapterWordCount || 0;
        }
      } else {
        // Use chapter word count when no scenes exist
        totalWords += chapter.chapterWordCount || 0;
      }
    }

    // Use calculated word count or fall back to story's currentWordCount
    const finalWordCount = totalWords > 0 ? totalWords : (story.currentWordCount || 0);
    
    // Include all published stories (the DB query already filtered for public + published)
    validPublishedStories.push({
      ...story,
      currentWordCount: finalWordCount
    });
  }

  return validPublishedStories.map(story => ({
    id: story.id,
    title: story.title,
    description: story.description || '',
    genre: story.genre || 'Fiction',
    status: story.status,
    viewCount: story.viewCount || 0,
    rating: story.rating || 0,
    currentWordCount: story.currentWordCount || 0,
    createdAt: story.createdAt,
    author: {
      id: story.authorId,
      name: story.authorName || 'Anonymous'
    }
  }));
}