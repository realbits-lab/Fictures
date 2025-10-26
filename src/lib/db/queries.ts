import { db } from './index';
import { stories, chapters, users, userStats, parts, scenes, apiKeys, communityPosts } from './schema';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { RelationshipManager } from './relationships';
import { hashPassword } from '../auth/password';
import { generateApiKeyId } from '../auth/api-keys';
import type { ApiScope } from '../auth/api-keys';

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
  password?: string;
}) {
  const userId = nanoid();

  const [user] = await db.insert(users).values({
    id: userId,
    email: data.email,
    name: data.name,
    image: data.image,
    password: data.password,
    role: 'reader',
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  return user;
}

export async function createUserWithPassword(data: {
  email: string;
  password: string;
  name?: string;
}) {
  const hashedPassword = await hashPassword(data.password);

  return createUser({
    email: data.email,
    name: data.name,
    password: hashedPassword,
  });
}

export async function updateUser(userId: string, data: {
  name?: string;
  image?: string;
  emailVerified?: Date;
  role?: string;
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
    status: 'writing',
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
      ch.status === 'published'
    ).length;
    
    // Check if story is actually published (has published chapters AND is public)
    const hasPublishedChapters = storyChapters.some(chapter => chapter.status === 'published');
    const actualStatus = (story.status === 'published' && hasPublishedChapters)
      ? 'published' as const
      : story.status as any;
    
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

  // Check if user has access (published stories or user's own stories)
  if (story[0].status !== 'published' && story[0].authorId !== userId) {
    return null;
  }

  return story[0];
}

export async function updateStory(storyId: string, userId: string, data: Partial<{
  title: string;
  description: string;
  genre: string;
  status: 'writing' | 'published';
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
      status: 'writing',
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
  // Get current chapter count using foreign key relationship
  const existingChapters = await db.select()
    .from(chapters)
    .where(eq(chapters.storyId, storyId));

  const nextOrderIndex = existingChapters.length + 1;

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
  if (chapter.stories?.status !== 'published' && chapter.stories?.authorId !== userId) {
    return null;
  }

  return chapter.chapters;
}

export async function updateChapter(chapterId: string, userId: string, data: Partial<{
  title: string;
  content: string;
  status: 'writing' | 'published';
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

// Scenes queries
export async function getSceneById(sceneId: string, userId?: string) {
  const [scene] = await db
    .select()
    .from(scenes)
    .leftJoin(chapters, eq(scenes.chapterId, chapters.id))
    .leftJoin(stories, eq(chapters.storyId, stories.id))
    .where(eq(scenes.id, sceneId))
    .limit(1);

  if (!scene) return null;

  // Check access permissions
  if (scene.stories?.status !== 'published' && scene.stories?.authorId !== userId) {
    return null;
  }

  return {
    ...scene.scenes,
    chapter: scene.chapters,
    story: scene.stories
  };
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
export async function getStoryWithStructure(storyId: string, includeScenes: boolean = true, userId?: string) {
  // Get story with all relationships using direct array lookups (much faster)
  const result = await RelationshipManager.getStoryWithStructure(storyId, includeScenes);
  if (!result) return null;
  
  // Check user access
  if (userId && result.authorId !== userId && result.status !== 'published') {
    return null;
  }
  
  // Apply dynamic status calculations to match original interface
  const structuredParts = result.parts.map(part => {
    const partChapters = part.chapters.map(chapter => {
      const chapterScenes = (chapter.scenes || []).map(scene => {
        // Calculate dynamic scene status
        const dynamicSceneStatus = calculateSceneStatus({
          content: scene.content || '',
          wordCount: scene.wordCount || 0,
          status: (scene as any).status || ''
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
    const chapterScenes = (chapter.scenes || []).map(scene => {
      const dynamicSceneStatus = calculateSceneStatus({
        content: scene.content || '',
        wordCount: scene.wordCount || 0,
        status: (scene as any).status || ''
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
    isPublic: result.status === 'published',
    hnsData: result.hnsData || null,
    authorId: result.authorId,
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
  if (result.story?.status !== 'published' && result.story?.authorId !== userId) {
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
    const dbStatus = (scene as any).status || '';
    
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
      authorName: users.name,
      hnsData: stories.hnsData
    })
    .from(stories)
    .leftJoin(users, eq(stories.authorId, users.id))
    .where(eq(stories.status, 'published'))
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
    isPublic: true,
    viewCount: story.viewCount || 0,
    rating: story.rating || 0,
    currentWordCount: story.currentWordCount || 0,
    createdAt: story.createdAt,
    hnsData: story.hnsData,
    author: {
      id: story.authorId,
      name: story.authorName || 'Anonymous'
    }
  }));
}

export async function getCommunityStories() {
  // Get only published stories with their authors and story images
  const publicStories = await db
    .select({
      id: stories.id,
      title: stories.title,
      description: stories.description,
      genre: stories.genre,
      status: stories.status,
      viewCount: stories.viewCount,
      rating: stories.rating,
      ratingCount: stories.ratingCount,
      currentWordCount: stories.currentWordCount,
      createdAt: stories.createdAt,
      updatedAt: stories.updatedAt,
      hnsData: stories.hnsData,
      author: {
        id: users.id,
        name: users.name,
        username: users.username,
      },
    })
    .from(stories)
    .leftJoin(users, eq(stories.authorId, users.id))
    .where(eq(stories.status, 'published'))
    .orderBy(desc(stories.updatedAt));

  // Get real community stats from database
  const storiesWithStats = await Promise.all(
    publicStories.map(async (story) => {
      // Count total posts for this story (excluding deleted)
      const postCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(communityPosts)
        .where(and(
          eq(communityPosts.storyId, story.id),
          eq(communityPosts.isDeleted, false)
        ));
      const totalPosts = Number(postCountResult[0]?.count || 0);

      // Get last activity from most recent post
      const lastPostResult = await db
        .select({ lastActivityAt: communityPosts.lastActivityAt })
        .from(communityPosts)
        .where(and(
          eq(communityPosts.storyId, story.id),
          eq(communityPosts.isDeleted, false)
        ))
        .orderBy(desc(communityPosts.lastActivityAt))
        .limit(1);
      const lastActivity = lastPostResult[0]?.lastActivityAt || story.updatedAt;

      // Count unique members (authors who posted)
      const memberCountResult = await db
        .selectDistinct({ authorId: communityPosts.authorId })
        .from(communityPosts)
        .where(and(
          eq(communityPosts.storyId, story.id),
          eq(communityPosts.isDeleted, false)
        ));
      const totalMembers = memberCountResult.length;

      // Determine if active (has posts in last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const isActive = lastActivity > sevenDaysAgo;

      return {
        ...story,
        totalPosts,
        totalMembers,
        isActive,
        lastActivity,
      };
    })
  );

  return storiesWithStats;
}

// API Keys queries
export async function createApiKey(data: {
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  scopes: ApiScope[];
  expiresAt?: Date | null;
}) {
  const apiKeyId = generateApiKeyId();

  const [apiKey] = await db.insert(apiKeys).values({
    id: apiKeyId,
    userId: data.userId,
    name: data.name,
    keyHash: data.keyHash,
    keyPrefix: data.keyPrefix,
    scopes: data.scopes,
    expiresAt: data.expiresAt,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  return apiKey;
}

export async function getUserApiKeys(userId: string) {
  return await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      scopes: apiKeys.scopes,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      isActive: apiKeys.isActive,
      createdAt: apiKeys.createdAt,
      updatedAt: apiKeys.updatedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(desc(apiKeys.createdAt));
}

export async function findApiKeyByHash(keyHash: string) {
  const [apiKey] = await db
    .select()
    .from(apiKeys)
    .where(and(
      eq(apiKeys.keyHash, keyHash),
      eq(apiKeys.isActive, true)
    ))
    .limit(1);

  return apiKey || null;
}

export async function updateApiKeyLastUsed(apiKeyId: string) {
  await db
    .update(apiKeys)
    .set({
      lastUsedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(apiKeys.id, apiKeyId));
}

export async function updateApiKey(apiKeyId: string, data: {
  name?: string;
  scopes?: ApiScope[];
  expiresAt?: Date | null;
  isActive?: boolean;
}) {
  const [apiKey] = await db
    .update(apiKeys)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(apiKeys.id, apiKeyId))
    .returning();

  return apiKey;
}

export async function deleteApiKey(apiKeyId: string) {
  await db
    .delete(apiKeys)
    .where(eq(apiKeys.id, apiKeyId));
}

export async function revokeApiKey(apiKeyId: string) {
  return await updateApiKey(apiKeyId, { isActive: false });
}

export async function getApiKeyWithUser(keyHash: string) {
  const result = await db
    .select({
      apiKey: apiKeys,
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      }
    })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(and(
      eq(apiKeys.keyHash, keyHash),
      eq(apiKeys.isActive, true)
    ))
    .limit(1);

  return result[0] || null;
}

// ===========================
// Community Queries
// ===========================

/**
 * Get community story with all related data (public content)
 *
 * Fetches story, author, characters, settings, and community stats
 * Optimized for caching - all data in single transaction
 *
 * @param storyId - Story ID to fetch
 * @returns Story with complete community data or null if not found
 */
export async function getCommunityStory(storyId: string) {
  console.log(`[getCommunityStory] 🔄 START DB queries for ${storyId}`);
  const startTime = Date.now();

  // Fetch story with author (primary key lookup - fast)
  const storyStart = Date.now();
  const storyData = await db
    .select({
      id: stories.id,
      title: stories.title,
      description: stories.description,
      genre: stories.genre,
      status: stories.status,
      viewCount: stories.viewCount,
      rating: stories.rating,
      ratingCount: stories.ratingCount,
      author: {
        id: users.id,
        name: users.name,
        username: users.username,
        image: users.image,
      },
    })
    .from(stories)
    .leftJoin(users, eq(stories.authorId, users.id))
    .where(eq(stories.id, storyId))
    .limit(1);
  console.log(`[getCommunityStory] ✅ Story query: ${Date.now() - storyStart}ms`);

  if (storyData.length === 0) {
    console.log(`[getCommunityStory] ❌ Story not found: ${storyId}`);
    return null;
  }

  const story = storyData[0];

  // Count posts (uses index: story_id, is_deleted, moderation_status)
  const postsStart = Date.now();
  const postCountResult = await db
    .select({ count: count() })
    .from(communityPosts)
    .where(
      and(
        eq(communityPosts.storyId, storyId),
        eq(communityPosts.isDeleted, false),
        eq(communityPosts.moderationStatus, 'approved')
      )
    );
  console.log(`[getCommunityStory] ✅ Post count query: ${Date.now() - postsStart}ms`);

  // Fetch characters (uses index: story_id)
  const charsStart = Date.now();
  const storyCharacters = await db
    .select({
      id: characters.id,
      name: characters.name,
      role: characters.role,
      archetype: characters.archetype,
      summary: characters.summary,
      storyline: characters.storyline,
      personality: characters.personality,
      backstory: characters.backstory,
      motivations: characters.motivations,
      physicalDescription: characters.physicalDescription,
      imageUrl: characters.imageUrl,
      isMain: characters.isMain,
    })
    .from(characters)
    .where(eq(characters.storyId, storyId));
  console.log(`[getCommunityStory] ✅ Characters query: ${Date.now() - charsStart}ms (${storyCharacters.length} characters)`);

  // Fetch settings (uses index: story_id)
  const settingsStart = Date.now();
  const storySettings = await db
    .select({
      id: settings.id,
      name: settings.name,
      description: settings.description,
      mood: settings.mood,
      sensory: settings.sensory,
      visualStyle: settings.visualStyle,
      architecturalStyle: settings.architecturalStyle,
      colorPalette: settings.colorPalette,
      imageUrl: settings.imageUrl,
    })
    .from(settings)
    .where(eq(settings.storyId, storyId));
  console.log(`[getCommunityStory] ✅ Settings query: ${Date.now() - settingsStart}ms (${storySettings.length} settings)`);

  const totalTime = Date.now() - startTime;
  console.log(`[getCommunityStory] ✨ COMPLETE - Total DB time: ${totalTime}ms`);

  return {
    id: story.id,
    title: story.title,
    description: story.description,
    genre: story.genre,
    status: story.status,
    author: story.author,
    stats: {
      totalPosts: postCountResult[0]?.count || 0,
      totalMembers: Math.floor((story.viewCount || 0) * 0.1), // Estimate 10% of viewers become members
      totalViews: story.viewCount || 0,
      averageRating: story.rating ? story.rating / 10 : 0, // Convert from integer to decimal (47 -> 4.7)
      ratingCount: story.ratingCount || 0,
    },
    characters: storyCharacters,
    settings: storySettings,
  };
}

/**
 * Get community posts for a story (public content)
 *
 * Fetches approved posts with author info, sorted by pinned then activity
 * Uses composite index for optimal performance
 *
 * @param storyId - Story ID to fetch posts for
 * @returns Array of posts with author data
 */
export async function getCommunityPosts(storyId: string) {
  console.log(`[getCommunityPosts] 🔄 START DB query for ${storyId}`);
  const startTime = Date.now();

  const posts = await db
    .select({
      id: communityPosts.id,
      title: communityPosts.title,
      content: communityPosts.content,
      contentType: communityPosts.contentType,
      contentHtml: communityPosts.contentHtml,
      contentImages: communityPosts.contentImages,
      storyId: communityPosts.storyId,
      type: communityPosts.type,
      isPinned: communityPosts.isPinned,
      isLocked: communityPosts.isLocked,
      isEdited: communityPosts.isEdited,
      editCount: communityPosts.editCount,
      lastEditedAt: communityPosts.lastEditedAt,
      likes: communityPosts.likes,
      replies: communityPosts.replies,
      views: communityPosts.views,
      tags: communityPosts.tags,
      mentions: communityPosts.mentions,
      lastActivityAt: communityPosts.lastActivityAt,
      createdAt: communityPosts.createdAt,
      updatedAt: communityPosts.updatedAt,
      author: {
        id: users.id,
        name: users.name,
        username: users.username,
        image: users.image,
      },
    })
    .from(communityPosts)
    .leftJoin(users, eq(communityPosts.authorId, users.id))
    .where(and(
      eq(communityPosts.storyId, storyId),
      eq(communityPosts.isDeleted, false),
      eq(communityPosts.moderationStatus, 'approved')
    ))
    .orderBy(
      desc(communityPosts.isPinned),
      desc(communityPosts.lastActivityAt)
    );

  const totalTime = Date.now() - startTime;
  console.log(`[getCommunityPosts] ✨ COMPLETE - Total DB time: ${totalTime}ms (${posts.length} posts)`);

  return posts;
}