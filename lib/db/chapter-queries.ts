import 'server-only';

import {
  and,
  asc,
  desc,
  eq,
  sql,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  chapter,
  book,
  type Chapter,
} from './schema';
import { ChatSDKError } from '../errors';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export interface CreateChapterData {
  bookId: string;
  title: string;
  content: any; // ProseMirror JSON
  authorNote?: string;
  chapterNumber: number;
}

export interface UpdateChapterData {
  title?: string;
  content?: any;
  authorNote?: string;
  isPublished?: boolean;
}

export async function createChapter(data: CreateChapterData): Promise<Chapter> {
  if (!data.title) {
    throw new ChatSDKError('bad_request:validation', 'Chapter title is required');
  }

  if (!data.bookId) {
    throw new ChatSDKError('bad_request:validation', 'Book ID is required');
  }

  if (!data.content) {
    throw new ChatSDKError('bad_request:validation', 'Chapter content is required');
  }

  try {
    const [newChapter] = await db
      .insert(chapter)
      .values({
        bookId: data.bookId,
        title: data.title,
        content: data.content,
        authorNote: data.authorNote || null,
        chapterNumber: data.chapterNumber,
        wordCount: 0, // Will be calculated by content
        isPublished: false,
      })
      .returning();

    // Update book chapter count
    await db
      .update(book)
      .set({
        chapterCount: sql`${book.chapterCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(book.id, data.bookId));

    return newChapter;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create chapter',
      { cause: error }
    );
  }
}

export async function getChapterById(chapterId: string): Promise<Chapter | null> {
  try {
    const [selectedChapter] = await db
      .select()
      .from(chapter)
      .where(eq(chapter.id, chapterId));

    return selectedChapter || null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chapter by ID',
      { cause: error }
    );
  }
}

export async function updateChapter(
  chapterId: string,
  updates: UpdateChapterData
): Promise<Chapter> {
  try {
    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    };

    if (updates.isPublished && !updates.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const [updatedChapter] = await db
      .update(chapter)
      .set(updateData)
      .where(eq(chapter.id, chapterId))
      .returning();

    if (!updatedChapter) {
      throw new ChatSDKError('not_found', 'Chapter not found');
    }

    return updatedChapter;
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chapter',
      { cause: error }
    );
  }
}

export async function deleteChapter(chapterId: string): Promise<boolean> {
  try {
    // Get the chapter to find the book ID
    const chapterToDelete = await getChapterById(chapterId);
    if (!chapterToDelete) {
      return false;
    }

    const result = await db.delete(chapter).where(eq(chapter.id, chapterId));

    if (result.count > 0) {
      // Update book chapter count
      await db
        .update(book)
        .set({
          chapterCount: sql`GREATEST(${book.chapterCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(book.id, chapterToDelete.bookId));
    }

    return result.count > 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chapter',
      { cause: error }
    );
  }
}

export async function getChaptersByBook(bookId: string): Promise<Chapter[]> {
  try {
    return await db
      .select()
      .from(chapter)
      .where(eq(chapter.bookId, bookId))
      .orderBy(asc(chapter.chapterNumber));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chapters by book',
      { cause: error }
    );
  }
}

export async function getPublishedChaptersByBook(bookId: string): Promise<Chapter[]> {
  try {
    return await db
      .select()
      .from(chapter)
      .where(and(
        eq(chapter.bookId, bookId),
        eq(chapter.isPublished, true)
      ))
      .orderBy(asc(chapter.chapterNumber));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get published chapters by book',
      { cause: error }
    );
  }
}

export async function getChapterByNumber(
  bookId: string,
  chapterNumber: number
): Promise<Chapter | null> {
  try {
    const [selectedChapter] = await db
      .select()
      .from(chapter)
      .where(and(
        eq(chapter.bookId, bookId),
        eq(chapter.chapterNumber, chapterNumber)
      ));

    return selectedChapter || null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chapter by number',
      { cause: error }
    );
  }
}

export async function publishChapter(chapterId: string): Promise<Chapter> {
  try {
    const [publishedChapter] = await db
      .update(chapter)
      .set({
        isPublished: true,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(chapter.id, chapterId))
      .returning();

    if (!publishedChapter) {
      throw new ChatSDKError('not_found', 'Chapter not found');
    }

    return publishedChapter;
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to publish chapter',
      { cause: error }
    );
  }
}

export async function unpublishChapter(chapterId: string): Promise<Chapter> {
  try {
    const [unpublishedChapter] = await db
      .update(chapter)
      .set({
        isPublished: false,
        publishedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(chapter.id, chapterId))
      .returning();

    if (!unpublishedChapter) {
      throw new ChatSDKError('not_found', 'Chapter not found');
    }

    return unpublishedChapter;
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to unpublish chapter',
      { cause: error }
    );
  }
}

export async function getNextChapter(
  bookId: string,
  currentChapterNumber: number
): Promise<Chapter | null> {
  try {
    const [nextChapter] = await db
      .select()
      .from(chapter)
      .where(and(
        eq(chapter.bookId, bookId),
        sql`${chapter.chapterNumber} > ${currentChapterNumber}`,
        eq(chapter.isPublished, true)
      ))
      .orderBy(asc(chapter.chapterNumber))
      .limit(1);

    return nextChapter || null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get next chapter',
      { cause: error }
    );
  }
}

export async function getPreviousChapter(
  bookId: string,
  currentChapterNumber: number
): Promise<Chapter | null> {
  try {
    const [previousChapter] = await db
      .select()
      .from(chapter)
      .where(and(
        eq(chapter.bookId, bookId),
        sql`${chapter.chapterNumber} < ${currentChapterNumber}`,
        eq(chapter.isPublished, true)
      ))
      .orderBy(desc(chapter.chapterNumber))
      .limit(1);

    return previousChapter || null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get previous chapter',
      { cause: error }
    );
  }
}