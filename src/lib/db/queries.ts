import { db } from './index';
import { stories, chapters, users, userStats } from './schema';
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