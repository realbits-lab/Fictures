import { db } from './index';
import { stories, chapters, users, userStats, parts, scenes } from './schema';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

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

// Get user stories with their first chapter and counts for navigation
export async function getUserStoriesWithFirstChapter(userId: string) {
  const userStories = await getUserStories(userId);
  
  const storiesWithData = await Promise.all(
    userStories.map(async (story) => {
      // Get the first chapter of this story
      const [firstChapter] = await db
        .select()
        .from(chapters)
        .where(eq(chapters.storyId, story.id))
        .orderBy(chapters.orderIndex)
        .limit(1);
      
      // Get all chapters for counting
      const allChapters = await db
        .select()
        .from(chapters)
        .where(eq(chapters.storyId, story.id));
      
      // Get all parts for counting
      const allParts = await db
        .select()
        .from(parts)
        .where(eq(parts.storyId, story.id));
      
      // Count completed chapters
      const completedChapters = allChapters.filter(ch => 
        ch.status === 'completed' || ch.status === 'published'
      ).length;
      
      return {
        ...story,
        firstChapterId: firstChapter?.id || null,
        totalChapters: allChapters.length,
        completedChapters,
        totalParts: allParts.length,
        completedParts: allParts.length // Assuming all parts are "completed" if they exist
      };
    })
  );
  
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
  const chapterId = nanoid();
  
  const [chapter] = await db.insert(chapters).values({
    id: chapterId,
    title: data.title,
    storyId,
    authorId,
    partId: data.partId,
    orderIndex: data.orderIndex,
    targetWordCount: data.targetWordCount || 4000,
    status: 'draft',
    content: '',
  }).returning();

  return chapter;
}

// Create the first chapter for a story
export async function createFirstChapter(storyId: string, authorId: string) {
  // Get the next order index (should be 1 for first chapter)
  const existingChapters = await db
    .select()
    .from(chapters)
    .where(eq(chapters.storyId, storyId))
    .orderBy(desc(chapters.orderIndex));
  
  const nextOrderIndex = existingChapters.length > 0 
    ? existingChapters[0].orderIndex + 1 
    : 1;

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

// Comprehensive story data with parts, chapters, and scenes
export async function getStoryWithStructure(storyId: string, userId?: string) {
  // First check if user has access to the story
  const story = await getStoryById(storyId, userId);
  if (!story) return null;

  // Get all parts for the story
  const storyParts = await db
    .select()
    .from(parts)
    .where(eq(parts.storyId, storyId))
    .orderBy(parts.orderIndex);

  // Get all chapters for the story
  const storyChapters = await db
    .select()
    .from(chapters)
    .where(eq(chapters.storyId, storyId))
    .orderBy(chapters.orderIndex);

  // Get all scenes for chapters in this story
  const allScenes = await db
    .select()
    .from(scenes)
    .leftJoin(chapters, eq(scenes.chapterId, chapters.id))
    .where(eq(chapters.storyId, storyId))
    .orderBy(scenes.orderIndex);

  // Structure the data to match the StoryNavigationSidebar interface with dynamic status calculation
  const structuredParts = storyParts.map(part => {
    const partChapters = storyChapters
      .filter(ch => ch.partId === part.id)
      .map(ch => {
        const chapterScenes = allScenes
          .filter(sceneData => sceneData.scenes?.chapterId === ch.id)
          .map(sceneData => {
            // Calculate dynamic scene status based on content and word count
            const sceneContent = sceneData.scenes?.content || '';
            const sceneWordCount = sceneData.scenes?.wordCount || 0;
            const dynamicSceneStatus = calculateSceneStatus({ 
              content: sceneContent, 
              wordCount: sceneWordCount,
              status: sceneData.scenes?.status || ''
            });
            
            return {
              id: sceneData.scenes?.id || '',
              title: sceneData.scenes?.title || '',
              status: dynamicSceneStatus,
              wordCount: sceneWordCount,
              goal: sceneData.scenes?.goal || '',
              conflict: sceneData.scenes?.conflict || '',
              outcome: sceneData.scenes?.outcome || '',
              content: sceneContent
            };
          });

        // Use database status if published, otherwise use calculated status
        const dynamicChapterStatus = calculateChapterStatus(chapterScenes);
        const finalStatus = ch.status === 'published' ? 'published' : dynamicChapterStatus;
        
        return {
          id: ch.id,
          title: ch.title,
          orderIndex: ch.orderIndex,
          status: finalStatus,
          wordCount: ch.wordCount || 0,
          targetWordCount: ch.targetWordCount || 4000,
          scenes: chapterScenes,
          content: ch.content
        };
      });

    // Calculate dynamic part status based on chapter completion
    const dynamicPartStatus = calculatePartStatus(partChapters);

    return {
      id: part.id,
      title: part.title,
      orderIndex: part.orderIndex,
      status: dynamicPartStatus,
      chapters: partChapters
    };
  });

  // Get standalone chapters (not in parts) with dynamic status calculation
  const standaloneChapters = storyChapters
    .filter(ch => !ch.partId)
    .map(ch => {
      const chapterScenes = allScenes
        .filter(sceneData => sceneData.scenes?.chapterId === ch.id)
        .map(sceneData => {
          // Calculate dynamic scene status based on content and word count
          const sceneContent = sceneData.scenes?.content || '';
          const sceneWordCount = sceneData.scenes?.wordCount || 0;
          const dynamicSceneStatus = calculateSceneStatus({ 
            content: sceneContent, 
            wordCount: sceneWordCount,
            status: sceneData.scenes?.status || ''
          });
          
          return {
            id: sceneData.scenes?.id || '',
            title: sceneData.scenes?.title || '',
            status: dynamicSceneStatus,
            wordCount: sceneWordCount,
            goal: sceneData.scenes?.goal || '',
            conflict: sceneData.scenes?.conflict || '',
            outcome: sceneData.scenes?.outcome || '',
            content: sceneContent
          };
        });

      // Use database status if published, otherwise use calculated status
      const dynamicChapterStatus = calculateChapterStatus(chapterScenes);
      const finalStatus = ch.status === 'published' ? 'published' : dynamicChapterStatus;
      
      return {
        id: ch.id,
        title: ch.title,
        orderIndex: ch.orderIndex,
        status: finalStatus,
        wordCount: ch.wordCount || 0,
        targetWordCount: ch.targetWordCount || 4000,
        scenes: chapterScenes,
        content: ch.content
      };
    });

  // Use database status if published, otherwise use calculated status
  const dynamicStoryStatus = calculateStoryStatus(structuredParts, standaloneChapters);
  const finalStoryStatus = story.status === 'published' ? 'published' : dynamicStoryStatus;

  return {
    id: story.id,
    title: story.title,
    description: story.description,
    genre: story.genre || 'General',
    status: finalStoryStatus,
    storyData: story.storyData || null,
    userId: story.authorId,
    parts: structuredParts,
    chapters: standaloneChapters,
    scenes: allScenes
  };
}

// Get chapter with part information
export async function getChapterWithPart(chapterId: string, userId?: string) {
  
  const [result] = await db
    .select({
      chapter: chapters,
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

// Get published stories for Browse page - only stories with actual published content
export async function getPublishedStories() {
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

  // Filter out stories that don't have substantial published content
  const validPublishedStories = [];
  
  for (const story of publishedStories) {
    // Get the actual story structure to verify it has real content
    const storyStructure = await getStoryWithStructure(story.id);
    
    if (storyStructure) {
      // Calculate total word count from actual scenes
      let totalWords = 0;
      const allChapters = [...storyStructure.parts.flatMap(part => part.chapters), ...storyStructure.chapters];
      
      for (const chapter of allChapters) {
        if (chapter.scenes) {
          totalWords += chapter.scenes.reduce((sum, scene) => sum + (scene.wordCount || 0), 0);
        }
      }
      
      // Check if any chapters are published - need to check actual database status
      // since getStoryWithStructure overrides with calculated status
      const rawChapters = await db
        .select()
        .from(chapters)
        .where(eq(chapters.storyId, story.id));
      
      const hasPublishedChapters = rawChapters.some(chapter => chapter.status === 'published');
      
      // Only include stories with published chapters and substantial content (500+ words minimum)
      if (hasPublishedChapters && totalWords >= 500) {
        validPublishedStories.push({
          ...story,
          currentWordCount: totalWords // Use the actual calculated word count
        });
      }
    }
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