import { withCache, invalidateCache } from '../cache/redis-cache';
import { measureAsync } from '../cache/performance-logger';
import * as queries from './queries';

const CACHE_TTL = {
  STORY: 300,
  CHAPTER: 300,
  SCENE: 300,
  PART: 300,
  STRUCTURE: 600,
  LIST: 180,
  PUBLISHED: 600,
};

export async function getStoryById(storyId: string, userId?: string) {
  return measureAsync(
    'getStoryById',
    async () => {
      const story = await queries.getStoryById(storyId, userId);

      if (!story) return null;

      const isPublic = story.status === 'published';
      const cacheKey = isPublic
        ? `story:${storyId}:public`
        : `story:${storyId}:user:${userId}`;

      return withCache(
        cacheKey,
        () => Promise.resolve(story),
        isPublic ? CACHE_TTL.PUBLISHED : CACHE_TTL.STORY
      );
    },
    { storyId, userId, cached: true }
  ).then(r => r.result);
}

export async function getStoryChapters(storyId: string, userId?: string) {
  const cacheKey = `story:${storyId}:chapters:user:${userId || 'public'}`;

  return measureAsync(
    'getStoryChapters',
    async () => {
      return withCache(
        cacheKey,
        () => queries.getStoryChapters(storyId, userId),
        CACHE_TTL.CHAPTER
      );
    },
    { storyId, userId, cached: true }
  ).then(r => r.result);
}

export async function getChapterById(chapterId: string, userId?: string) {
  const cacheKey = `chapter:${chapterId}:user:${userId || 'public'}`;

  return measureAsync(
    'getChapterById',
    async () => {
      return withCache(
        cacheKey,
        () => queries.getChapterById(chapterId, userId),
        CACHE_TTL.CHAPTER
      );
    },
    { chapterId, userId, cached: true }
  ).then(r => r.result);
}

export async function getStoryWithStructure(
  storyId: string,
  includeScenes: boolean = true,
  userId?: string
) {
  const cacheKey = `story:${storyId}:structure:scenes:${includeScenes}:user:${userId || 'public'}`;

  return measureAsync(
    'getStoryWithStructure',
    async () => {
      return withCache(
        cacheKey,
        () => queries.getStoryWithStructure(storyId, includeScenes, userId),
        CACHE_TTL.STRUCTURE
      );
    },
    { storyId, includeScenes, userId, cached: true }
  ).then(r => r.result);
}

export async function getUserStories(userId: string) {
  const cacheKey = `user:${userId}:stories`;

  return measureAsync(
    'getUserStories',
    async () => {
      return withCache(
        cacheKey,
        () => queries.getUserStories(userId),
        CACHE_TTL.LIST
      );
    },
    { userId, cached: true }
  ).then(r => r.result);
}

export async function getUserStoriesWithFirstChapter(userId: string) {
  const cacheKey = `user:${userId}:stories:with-first-chapter`;

  return measureAsync(
    'getUserStoriesWithFirstChapter',
    async () => {
      return withCache(
        cacheKey,
        () => queries.getUserStoriesWithFirstChapter(userId),
        CACHE_TTL.LIST
      );
    },
    { userId, cached: true }
  ).then(r => r.result);
}

export async function getPublishedStories() {
  const cacheKey = 'stories:published';

  return measureAsync(
    'getPublishedStories',
    async () => {
      return withCache(
        cacheKey,
        () => queries.getPublishedStories(),
        CACHE_TTL.LIST
      );
    },
    { cached: true }
  ).then(r => r.result);
}

export async function getChapterWithPart(chapterId: string, userId?: string) {
  const cacheKey = `chapter:${chapterId}:with-part:user:${userId || 'public'}`;

  return measureAsync(
    'getChapterWithPart',
    async () => {
      return withCache(
        cacheKey,
        () => queries.getChapterWithPart(chapterId, userId),
        CACHE_TTL.CHAPTER
      );
    },
    { chapterId, userId, cached: true }
  ).then(r => r.result);
}

export async function updateStory(
  storyId: string,
  userId: string,
  data: Partial<{
    title: string;
    description: string;
    genre: string;
    status: 'writing' | 'published';
    targetWordCount: number;
  }>
) {
  const result = await measureAsync(
    'updateStory',
    () => queries.updateStory(storyId, userId, data),
    { storyId, userId }
  );

  await invalidateCache([
    `story:${storyId}:*`,
    `user:${userId}:stories*`,
    `stories:published`,
  ]);

  return result.result;
}

export async function updateChapter(
  chapterId: string,
  userId: string,
  data: Partial<{
    title: string;
    content: string;
    status: 'writing' | 'published';
    wordCount: number;
    publishedAt: Date;
    scheduledFor: Date;
  }>
) {
  const result = await measureAsync(
    'updateChapter',
    () => queries.updateChapter(chapterId, userId, data),
    { chapterId, userId }
  );

  const chapter = result.result;
  if (chapter) {
    await invalidateCache([
      `chapter:${chapterId}:*`,
      `story:${chapter.storyId}:*`,
      `user:${userId}:stories*`,
      `stories:published`,
    ]);
  }

  return chapter;
}

export async function createStory(
  authorId: string,
  data: {
    title: string;
    description?: string;
    genre?: string;
    targetWordCount?: number;
  }
) {
  const result = await measureAsync(
    'createStory',
    () => queries.createStory(authorId, data),
    { authorId }
  );

  await invalidateCache([
    `user:${authorId}:stories*`,
  ]);

  return result.result;
}

export async function createChapter(
  storyId: string,
  authorId: string,
  data: {
    title: string;
    partId?: string;
    orderIndex: number;
    targetWordCount?: number;
  }
) {
  const result = await measureAsync(
    'createChapter',
    () => queries.createChapter(storyId, authorId, data),
    { storyId, authorId }
  );

  await invalidateCache([
    `story:${storyId}:*`,
    `user:${authorId}:stories*`,
  ]);

  return result.result;
}

export async function createFirstChapter(storyId: string, authorId: string) {
  const result = await measureAsync(
    'createFirstChapter',
    () => queries.createFirstChapter(storyId, authorId),
    { storyId, authorId }
  );

  await invalidateCache([
    `story:${storyId}:*`,
    `user:${authorId}:stories*`,
  ]);

  return result.result;
}

export {
  findUserByEmail,
  createUser,
  createUserWithPassword,
  updateUser,
  updateUserStats,
  calculateSceneStatus,
  calculateChapterStatus,
  calculatePartStatus,
  calculateStoryStatus,
  createApiKey,
  getUserApiKeys,
  findApiKeyByHash,
  updateApiKeyLastUsed,
  updateApiKey,
  deleteApiKey,
  revokeApiKey,
  getApiKeyWithUser,
} from './queries';
