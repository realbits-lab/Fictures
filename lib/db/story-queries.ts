import 'server-only';

import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  story,
  chapter,
  user,
  type Story,
  type Chapter,
  type User,
} from './schema';
import { ChatSDKError } from '../errors';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export interface CreateStoryData {
  title: string;
  description?: string;
  genre?: string;
  authorId: string;
  tags?: string[];
  mature?: boolean;
}

export interface UpdateStoryData {
  title?: string;
  description?: string;
  genre?: string;
  status?: 'draft' | 'ongoing' | 'completed' | 'hiatus';
  isPublished?: boolean;
  mature?: boolean;
  tags?: string[];
  coverImageUrl?: string;
}

export interface StoryWithAuthor extends Story {
  author: User;
}

export interface StoryWithChapters extends Story {
  chapters: Chapter[];
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface SearchOptions {
  genre?: string;
  status?: string;
  mature?: boolean;
}

export interface PaginatedStories {
  stories: StoryWithAuthor[];
  totalCount: number;
}

export async function createStory(data: CreateStoryData): Promise<Story> {
  if (!data.title) {
    throw new ChatSDKError('bad_request:validation', 'Title is required');
  }

  if (!data.authorId) {
    throw new ChatSDKError('bad_request:validation', 'Author ID is required');
  }

  try {
    const [newStory] = await db
      .insert(story)
      .values({
        title: data.title,
        description: data.description || null,
        genre: data.genre || null,
        authorId: data.authorId,
        tags: data.tags || [],
        mature: data.mature || false,
        status: 'draft',
        isPublished: false,
        wordCount: 0,
        chapterCount: 0,
        readCount: 0,
        likeCount: 0,
      })
      .returning();

    return newStory;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create story',
      { cause: error }
    );
  }
}

export async function getStoryById(storyId: string): Promise<StoryWithAuthor | null> {
  try {
    const result = await db
      .select({
        story: story,
        author: user,
      })
      .from(story)
      .leftJoin(user, eq(story.authorId, user.id))
      .where(eq(story.id, storyId));

    if (result.length === 0 || !result[0].author) {
      return null;
    }

    return {
      ...result[0].story,
      author: result[0].author,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get story by ID',
      { cause: error }
    );
  }
}

export async function updateStory(storyId: string, updates: UpdateStoryData): Promise<Story> {
  try {
    const [updatedStory] = await db
      .update(story)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(story.id, storyId))
      .returning();

    if (!updatedStory) {
      throw new ChatSDKError('not_found', 'Story not found');
    }

    return updatedStory;
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update story',
      { cause: error }
    );
  }
}

export async function deleteStory(storyId: string): Promise<boolean> {
  try {
    const result = await db.delete(story).where(eq(story.id, storyId));
    return result.count > 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete story',
      { cause: error }
    );
  }
}

export async function getStoriesByAuthor(authorId: string): Promise<Story[]> {
  try {
    return await db
      .select()
      .from(story)
      .where(eq(story.authorId, authorId))
      .orderBy(desc(story.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stories by author',
      { cause: error }
    );
  }
}

export async function getPublishedStories(options: PaginationOptions): Promise<PaginatedStories> {
  const { page, limit } = options;
  const offset = (page - 1) * limit;

  try {
    const [storiesResult, countResult] = await Promise.all([
      db
        .select({
          story: story,
          author: user,
        })
        .from(story)
        .leftJoin(user, eq(story.authorId, user.id))
        .where(eq(story.isPublished, true))
        .orderBy(desc(story.publishedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(story)
        .where(eq(story.isPublished, true)),
    ]);

    const stories: StoryWithAuthor[] = storiesResult
      .filter(result => result.author)
      .map(result => ({
        ...result.story,
        author: result.author!,
      }));

    return {
      stories,
      totalCount: countResult[0].count,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get published stories',
      { cause: error }
    );
  }
}

export async function searchStories(query: string, options?: SearchOptions): Promise<StoryWithAuthor[]> {
  try {
    const conditions: SQL[] = [
      eq(story.isPublished, true),
      or(
        ilike(story.title, `%${query}%`),
        ilike(story.description, `%${query}%`)
      )!,
    ];

    if (options?.genre) {
      conditions.push(eq(story.genre, options.genre));
    }

    if (options?.status) {
      conditions.push(eq(story.status, options.status as any));
    }

    if (typeof options?.mature === 'boolean') {
      conditions.push(eq(story.mature, options.mature));
    }

    const result = await db
      .select({
        story: story,
        author: user,
      })
      .from(story)
      .leftJoin(user, eq(story.authorId, user.id))
      .where(and(...conditions))
      .orderBy(desc(story.readCount));

    return result
      .filter(result => result.author)
      .map(result => ({
        ...result.story,
        author: result.author!,
      }));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to search stories',
      { cause: error }
    );
  }
}

export async function getStoriesByGenre(genre: string): Promise<Story[]> {
  try {
    return await db
      .select()
      .from(story)
      .where(and(
        eq(story.genre, genre),
        eq(story.isPublished, true)
      ))
      .orderBy(desc(story.readCount));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stories by genre',
      { cause: error }
    );
  }
}

export async function incrementReadCount(storyId: string): Promise<boolean> {
  try {
    const result = await db
      .update(story)
      .set({
        readCount: sql`${story.readCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(story.id, storyId));

    return result.count > 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to increment read count',
      { cause: error }
    );
  }
}

export async function getStoryWithChapters(storyId: string): Promise<StoryWithChapters | null> {
  try {
    const [storyResult, chaptersResult] = await Promise.all([
      db
        .select()
        .from(story)
        .where(eq(story.id, storyId)),
      db
        .select()
        .from(chapter)
        .where(eq(chapter.storyId, storyId))
        .orderBy(asc(chapter.chapterNumber)),
    ]);

    if (storyResult.length === 0) {
      return null;
    }

    return {
      ...storyResult[0],
      chapters: chaptersResult,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get story with chapters',
      { cause: error }
    );
  }
}