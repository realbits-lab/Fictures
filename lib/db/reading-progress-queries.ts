import 'server-only';

import {
  and,
  desc,
  eq,
  sql,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  readingProgress,
  book,
  user,
  chapter,
  type ReadingProgress,
  type Book,
  type User,
} from './schema';
import { ChatSDKError } from '../errors';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export interface ReadingProgressWithBook extends ReadingProgress {
  book: Book & { author: User };
}

export async function updateReadingProgress({
  userId,
  bookId,
  chapterNumber,
  position,
}: {
  userId: string;
  bookId: string;
  chapterNumber: number;
  position: number;
}): Promise<ReadingProgress> {
  try {
    // Find the chapter ID based on book and chapter number
    const [targetChapter] = await db
      .select({ id: chapter.id })
      .from(chapter)
      .where(and(
        eq(chapter.bookId, bookId),
        eq(chapter.chapterNumber, chapterNumber)
      ));

    if (!targetChapter) {
      throw new ChatSDKError('not_found', 'Chapter not found');
    }

    const [existingProgress] = await db
      .select()
      .from(readingProgress)
      .where(and(
        eq(readingProgress.userId, userId),
        eq(readingProgress.bookId, bookId)
      ));

    if (existingProgress) {
      const [updated] = await db
        .update(readingProgress)
        .set({
          currentChapterId: targetChapter.id,
          currentPosition: position.toString(),
          lastReadAt: new Date(),
          totalTimeRead: sql`${readingProgress.totalTimeRead} + 1`,
        })
        .where(and(
          eq(readingProgress.userId, userId),
          eq(readingProgress.bookId, bookId)
        ))
        .returning();
      
      return updated;
    } else {
      const [created] = await db
        .insert(readingProgress)
        .values({
          userId,
          bookId,
          currentChapterId: targetChapter.id,
          currentPosition: position.toString(),
          lastReadAt: new Date(),
          totalTimeRead: 1,
          isCompleted: false,
        })
        .returning();
      
      return created;
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update reading progress',
      { cause: error }
    );
  }
}

export async function getReadingProgress(
  userId: string,
  bookId: string
): Promise<ReadingProgress | null> {
  try {
    const [progress] = await db
      .select()
      .from(readingProgress)
      .where(and(
        eq(readingProgress.userId, userId),
        eq(readingProgress.bookId, bookId)
      ));

    return progress || null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get reading progress',
      { cause: error }
    );
  }
}

export async function getReadingHistoryByUser(
  userId: string,
  limit = 20
): Promise<ReadingProgressWithBook[]> {
  try {
    const result = await db
      .select({
        progress: readingProgress,
        book: book,
        author: user,
      })
      .from(readingProgress)
      .leftJoin(book, eq(readingProgress.bookId, book.id))
      .leftJoin(user, eq(book.authorId, user.id))
      .where(eq(readingProgress.userId, userId))
      .orderBy(desc(readingProgress.lastReadAt))
      .limit(limit);

    return result
      .filter(row => row.book && row.author)
      .map(row => ({
        ...row.progress,
        book: {
          ...row.book!,
          author: row.author!,
        },
      }));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get reading history',
      { cause: error }
    );
  }
}

export async function markBookComplete(
  userId: string,
  bookId: string
): Promise<ReadingProgress> {
  try {
    const [updated] = await db
      .update(readingProgress)
      .set({
        isCompleted: true,
        lastReadAt: new Date(),
      })
      .where(and(
        eq(readingProgress.userId, userId),
        eq(readingProgress.bookId, bookId)
      ))
      .returning();

    if (!updated) {
      throw new ChatSDKError('not_found', 'Reading progress not found');
    }

    return updated;
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to mark book complete',
      { cause: error }
    );
  }
}

export async function getProgressPercentage(
  userId: string,
  bookId: string
): Promise<number> {
  try {
    const progress = await getReadingProgress(userId, bookId);
    if (!progress) {
      return 0;
    }
    
    return Number.parseFloat(progress.currentPosition);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get progress percentage',
      { cause: error }
    );
  }
}

export async function getCurrentChapterNumber(
  userId: string,
  bookId: string
): Promise<number | null> {
  try {
    const progress = await getReadingProgress(userId, bookId);
    if (!progress?.currentChapterId) {
      return null;
    }
    
    // Get chapter number from chapter ID
    const [chapterInfo] = await db
      .select({ chapterNumber: chapter.chapterNumber })
      .from(chapter)
      .where(eq(chapter.id, progress.currentChapterId));
    
    return chapterInfo?.chapterNumber || null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get current chapter number',
      { cause: error }
    );
  }
}