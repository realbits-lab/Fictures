import { db } from './index';
import { stories, chapters, users, userStats, parts, scenes } from './schema';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

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
export async function createChapter(storyId: string, data: {
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
    partId: data.partId,
    orderIndex: data.orderIndex,
    targetWordCount: data.targetWordCount || 4000,
    status: 'draft',
    content: '',
  }).returning();

  return chapter;
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

  // Get scenes for all chapters - we'll return empty array for now since we need specific chapter scenes
  const allScenes: Array<{
    id: string;
    title: string;
    status: string;
    wordCount: number;
    goal: string;
    conflict: string;
    outcome: string;
  }> = [];

  // Structure the data to match the StoryNavigationSidebar interface
  const structuredParts = storyParts.map(part => ({
    id: part.id,
    title: part.title,
    orderIndex: part.orderIndex,
    chapters: storyChapters
      .filter(ch => ch.partId === part.id)
      .map(ch => ({
        id: ch.id,
        title: ch.title,
        orderIndex: ch.orderIndex,
        status: ch.status || 'draft',
        wordCount: ch.wordCount || 0,
        targetWordCount: ch.targetWordCount || 4000,
      }))
  }));

  // Get standalone chapters (not in parts)
  const standaloneChapters = storyChapters
    .filter(ch => !ch.partId)
    .map(ch => ({
      id: ch.id,
      title: ch.title,
      orderIndex: ch.orderIndex,
      status: ch.status || 'draft',
      wordCount: ch.wordCount || 0,
      targetWordCount: ch.targetWordCount || 4000,
    }));

  return {
    id: story.id,
    title: story.title,
    genre: story.genre || 'General',
    status: story.status || 'draft',
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

  return {
    chapter: result.chapter,
    partTitle: result.part?.title || null,
    storyId: result.story?.id
  };
}