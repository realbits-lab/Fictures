import 'server-only';

import {
  and,
  eq,
  desc,
  count,
  sql,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  storyInteraction,
  story,
  user,
  type StoryInteraction,
  type Story,
  type User,
} from './schema';
import { ChatSDKError } from '../errors';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export interface StoryInteractionWithStory extends StoryInteraction {
  story: Story & { author: User };
}

export async function likeStory(userId: string, storyId: string): Promise<StoryInteraction> {
  try {
    // Check if already liked
    const [existing] = await db
      .select()
      .from(storyInteraction)
      .where(and(
        eq(storyInteraction.userId, userId),
        eq(storyInteraction.storyId, storyId),
        eq(storyInteraction.interactionType, 'like')
      ));

    if (existing) {
      return existing;
    }

    // Create like interaction
    const [newInteraction] = await db
      .insert(storyInteraction)
      .values({
        userId,
        storyId,
        interactionType: 'like',
      })
      .returning();

    // Increment like count on story
    await db
      .update(story)
      .set({
        likeCount: sql`${story.likeCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(story.id, storyId));

    return newInteraction;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to like story',
      { cause: error }
    );
  }
}

export async function unlikeStory(userId: string, storyId: string): Promise<boolean> {
  try {
    const result = await db
      .delete(storyInteraction)
      .where(and(
        eq(storyInteraction.userId, userId),
        eq(storyInteraction.storyId, storyId),
        eq(storyInteraction.interactionType, 'like')
      ));

    if (result.count > 0) {
      // Decrement like count on story
      await db
        .update(story)
        .set({
          likeCount: sql`GREATEST(${story.likeCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(story.id, storyId));
    }

    return result.count > 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to unlike story',
      { cause: error }
    );
  }
}

export async function bookmarkStory(userId: string, storyId: string): Promise<StoryInteraction> {
  try {
    // Check if already bookmarked
    const [existing] = await db
      .select()
      .from(storyInteraction)
      .where(and(
        eq(storyInteraction.userId, userId),
        eq(storyInteraction.storyId, storyId),
        eq(storyInteraction.interactionType, 'bookmark')
      ));

    if (existing) {
      return existing;
    }

    const [newInteraction] = await db
      .insert(storyInteraction)
      .values({
        userId,
        storyId,
        interactionType: 'bookmark',
      })
      .returning();

    return newInteraction;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to bookmark story',
      { cause: error }
    );
  }
}

export async function unbookmarkStory(userId: string, storyId: string): Promise<boolean> {
  try {
    const result = await db
      .delete(storyInteraction)
      .where(and(
        eq(storyInteraction.userId, userId),
        eq(storyInteraction.storyId, storyId),
        eq(storyInteraction.interactionType, 'bookmark')
      ));

    return result.count > 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to unbookmark story',
      { cause: error }
    );
  }
}

export async function followStory(userId: string, storyId: string): Promise<StoryInteraction> {
  try {
    // Check if already following
    const [existing] = await db
      .select()
      .from(storyInteraction)
      .where(and(
        eq(storyInteraction.userId, userId),
        eq(storyInteraction.storyId, storyId),
        eq(storyInteraction.interactionType, 'follow')
      ));

    if (existing) {
      return existing;
    }

    const [newInteraction] = await db
      .insert(storyInteraction)
      .values({
        userId,
        storyId,
        interactionType: 'follow',
      })
      .returning();

    return newInteraction;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to follow story',
      { cause: error }
    );
  }
}

export async function unfollowStory(userId: string, storyId: string): Promise<boolean> {
  try {
    const result = await db
      .delete(storyInteraction)
      .where(and(
        eq(storyInteraction.userId, userId),
        eq(storyInteraction.storyId, storyId),
        eq(storyInteraction.interactionType, 'follow')
      ));

    return result.count > 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to unfollow story',
      { cause: error }
    );
  }
}

export async function getStoryInteraction(
  userId: string,
  storyId: string,
  interactionType: 'like' | 'bookmark' | 'follow'
): Promise<StoryInteraction | null> {
  try {
    const [interaction] = await db
      .select()
      .from(storyInteraction)
      .where(and(
        eq(storyInteraction.userId, userId),
        eq(storyInteraction.storyId, storyId),
        eq(storyInteraction.interactionType, interactionType)
      ));

    return interaction || null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get story interaction',
      { cause: error }
    );
  }
}

export async function getUserBookmarks(
  userId: string,
  limit = 20
): Promise<StoryInteractionWithStory[]> {
  try {
    const result = await db
      .select({
        interaction: storyInteraction,
        story: story,
        author: user,
      })
      .from(storyInteraction)
      .leftJoin(story, eq(storyInteraction.storyId, story.id))
      .leftJoin(user, eq(story.authorId, user.id))
      .where(and(
        eq(storyInteraction.userId, userId),
        eq(storyInteraction.interactionType, 'bookmark')
      ))
      .orderBy(desc(storyInteraction.createdAt))
      .limit(limit);

    return result
      .filter(row => row.story && row.author)
      .map(row => ({
        ...row.interaction,
        story: {
          ...row.story!,
          author: row.author!,
        },
      }));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user bookmarks',
      { cause: error }
    );
  }
}

export async function getUserFollowedStories(
  userId: string,
  limit = 20
): Promise<StoryInteractionWithStory[]> {
  try {
    const result = await db
      .select({
        interaction: storyInteraction,
        story: story,
        author: user,
      })
      .from(storyInteraction)
      .leftJoin(story, eq(storyInteraction.storyId, story.id))
      .leftJoin(user, eq(story.authorId, user.id))
      .where(and(
        eq(storyInteraction.userId, userId),
        eq(storyInteraction.interactionType, 'follow')
      ))
      .orderBy(desc(storyInteraction.createdAt))
      .limit(limit);

    return result
      .filter(row => row.story && row.author)
      .map(row => ({
        ...row.interaction,
        story: {
          ...row.story!,
          author: row.author!,
        },
      }));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get followed stories',
      { cause: error }
    );
  }
}

export async function getStoryInteractionCounts(storyId: string): Promise<{
  likes: number;
  bookmarks: number;
  follows: number;
}> {
  try {
    const [likeResult, bookmarkResult, followResult] = await Promise.all([
      db
        .select({ count: count() })
        .from(storyInteraction)
        .where(and(
          eq(storyInteraction.storyId, storyId),
          eq(storyInteraction.interactionType, 'like')
        )),
      db
        .select({ count: count() })
        .from(storyInteraction)
        .where(and(
          eq(storyInteraction.storyId, storyId),
          eq(storyInteraction.interactionType, 'bookmark')
        )),
      db
        .select({ count: count() })
        .from(storyInteraction)
        .where(and(
          eq(storyInteraction.storyId, storyId),
          eq(storyInteraction.interactionType, 'follow')
        )),
    ]);

    return {
      likes: likeResult[0].count,
      bookmarks: bookmarkResult[0].count,
      follows: followResult[0].count,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get story interaction counts',
      { cause: error }
    );
  }
}