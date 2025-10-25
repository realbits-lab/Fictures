import { withCache, invalidateCache, getCache } from '../cache/redis-cache';
import { measureAsync } from '../cache/performance-logger';
import * as queries from './queries';

const CACHE_TTL = {
  PUBLISHED_CONTENT: 600,   // 10 minutes for published (shared by all users)
  PRIVATE_CONTENT: 180,      // 3 minutes for private (user-specific)
  LIST: 300,                 // 5 minutes for lists
};

/**
 * Smart caching strategy:
 * - Published content: Shared cache (one entry for all users)
 * - Private content: User-specific cache (separate entries per user)
 * - Non-authenticated users: Only access published content from shared cache
 */

export async function getStoryById(storyId: string, userId?: string) {
  return measureAsync(
    'getStoryById',
    async () => {
      // Try public cache first (most stories are published)
      const publicCacheKey = `story:${storyId}:public`;
      const cachedPublic = await getCache().get(publicCacheKey);

      if (cachedPublic) {
        console.log(`[Cache] HIT public story: ${storyId}`);
        return cachedPublic;
      }

      // If user is authenticated, try user-specific cache
      if (userId) {
        const userCacheKey = `story:${storyId}:user:${userId}`;
        const cachedUser = await getCache().get(userCacheKey);

        if (cachedUser) {
          console.log(`[Cache] HIT user-specific story: ${storyId}`);
          return cachedUser;
        }
      }

      // Cache miss - fetch from database
      const story = await queries.getStoryById(storyId, userId);

      if (!story) return null;

      // Cache based on story status
      const isPublished = story.status === 'published';

      if (isPublished) {
        // Published stories: Shared cache for ALL users
        await getCache().set(publicCacheKey, story, CACHE_TTL.PUBLISHED_CONTENT);
        console.log(`[Cache] SET public story: ${storyId} (shared by all users)`);
      } else if (userId) {
        // Private stories: User-specific cache
        const userCacheKey = `story:${storyId}:user:${userId}`;
        await getCache().set(userCacheKey, story, CACHE_TTL.PRIVATE_CONTENT);
        console.log(`[Cache] SET private story: ${storyId} (user: ${userId})`);
      }

      return story;
    },
    { storyId, userId, cached: true }
  ).then(r => r.result);
}

export async function getStoryChapters(storyId: string, userId?: string) {
  return measureAsync(
    'getStoryChapters',
    async () => {
      // First check if story is published (from cache or DB)
      const story = await getStoryById(storyId, userId);
      if (!story) return [];

      const isPublished = story.status === 'published';
      const cacheKey = isPublished
        ? `story:${storyId}:chapters:public`
        : `story:${storyId}:chapters:user:${userId}`;

      return withCache(
        cacheKey,
        () => queries.getStoryChapters(storyId, userId),
        isPublished ? CACHE_TTL.PUBLISHED_CONTENT : CACHE_TTL.PRIVATE_CONTENT
      );
    },
    { storyId, userId, cached: true }
  ).then(r => r.result);
}

export async function getChapterById(chapterId: string, userId?: string) {
  return measureAsync(
    'getChapterById',
    async () => {
      // Try public cache first
      const publicCacheKey = `chapter:${chapterId}:public`;
      const cachedPublic = await getCache().get(publicCacheKey);

      if (cachedPublic) return cachedPublic;

      // Fetch from database
      const chapter = await queries.getChapterById(chapterId, userId);

      if (!chapter) return null;

      // Chapters from published stories are cached publicly
      // (We assume if user can access it, it's either published or they're the author)
      await getCache().set(publicCacheKey, chapter, CACHE_TTL.PUBLISHED_CONTENT);

      return chapter;
    },
    { chapterId, userId, cached: true }
  ).then(r => r.result);
}

export async function getSceneById(sceneId: string, userId?: string) {
  return measureAsync(
    'getSceneById',
    async () => {
      // Try public cache first
      const publicCacheKey = `scene:${sceneId}:public`;
      const cachedPublic = await getCache().get(publicCacheKey);

      if (cachedPublic) {
        console.log(`[Cache] HIT public scene: ${sceneId}`);
        return cachedPublic;
      }

      // If user is authenticated, try user-specific cache
      if (userId) {
        const userCacheKey = `scene:${sceneId}:user:${userId}`;
        const cachedUser = await getCache().get(userCacheKey);

        if (cachedUser) {
          console.log(`[Cache] HIT user-specific scene: ${sceneId}`);
          return cachedUser;
        }
      }

      // Cache miss - fetch from database
      const scene = await queries.getSceneById(sceneId, userId);

      if (!scene) return null;

      // Check if scene is from a published story
      const isPublished = scene.story?.status === 'published';

      if (isPublished) {
        // Published scenes: Shared cache for ALL users
        await getCache().set(publicCacheKey, scene, CACHE_TTL.PUBLISHED_CONTENT);
        console.log(`[Cache] SET public scene: ${sceneId} (shared by all users)`);
      } else if (userId) {
        // Private scenes: User-specific cache
        const userCacheKey = `scene:${sceneId}:user:${userId}`;
        await getCache().set(userCacheKey, scene, CACHE_TTL.PRIVATE_CONTENT);
        console.log(`[Cache] SET private scene: ${sceneId} (user: ${userId})`);
      }

      return scene;
    },
    { sceneId, userId, cached: true }
  ).then(r => r.result);
}

export async function getStoryWithStructure(
  storyId: string,
  includeScenes: boolean = true,
  userId?: string
) {
  return measureAsync(
    'getStoryWithStructure',
    async () => {
      // Check story status first
      const story = await getStoryById(storyId, userId);
      if (!story) return null;

      const isPublished = story.status === 'published';
      const cacheKey = isPublished
        ? `story:${storyId}:structure:scenes:${includeScenes}:public`
        : `story:${storyId}:structure:scenes:${includeScenes}:user:${userId}`;

      return withCache(
        cacheKey,
        () => queries.getStoryWithStructure(storyId, includeScenes, userId),
        isPublished ? CACHE_TTL.PUBLISHED_CONTENT : CACHE_TTL.PRIVATE_CONTENT
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
        CACHE_TTL.PUBLISHED_CONTENT
      );
    },
    { cached: true }
  ).then(r => r.result);
}

export async function getChapterWithPart(chapterId: string, userId?: string) {
  const publicCacheKey = `chapter:${chapterId}:with-part:public`;

  return measureAsync(
    'getChapterWithPart',
    async () => {
      return withCache(
        publicCacheKey,
        () => queries.getChapterWithPart(chapterId, userId),
        CACHE_TTL.PUBLISHED_CONTENT
      );
    },
    { chapterId, userId, cached: true }
  ).then(r => r.result);
}

// Write operations with smart cache invalidation
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

  // Invalidate both public and user-specific caches
  await invalidateCache([
    `story:${storyId}:public`,              // Public cache
    `story:${storyId}:user:${userId}`,      // User cache
    `story:${storyId}:*`,                   // All story variants
    `user:${userId}:stories*`,               // User's story lists
    `stories:published`,                     // Published stories list
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
      `chapter:${chapterId}:*`,                 // All chapter variants
      `story:${chapter.storyId}:*`,             // All story variants
      `user:${userId}:stories*`,                 // User's story lists
      `stories:published`,                       // Published stories list
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

// Re-export non-cached functions
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
