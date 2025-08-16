import 'server-only';

import {
  and,
  desc,
  eq,
  asc,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  bookmark,
  book,
  chapter,
  user,
  type Bookmark,
  type Book,
  type Chapter,
  type User,
} from './schema';
import { ChatSDKError } from '../errors';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export interface BookmarkWithDetails extends Bookmark {
  book: Book & { author: User };
  chapter: Chapter;
}

export interface CreateBookmarkData {
  userId: string;
  bookId: string;
  chapterNumber: number;
  position: number;
  note?: string;
  isAutomatic?: boolean;
}

export async function createBookmark(data: CreateBookmarkData): Promise<Bookmark> {
  try {
    // Find the chapter ID based on book and chapter number
    const [targetChapter] = await db
      .select({ id: chapter.id })
      .from(chapter)
      .where(and(
        eq(chapter.bookId, data.bookId),
        eq(chapter.chapterNumber, data.chapterNumber)
      ));

    if (!targetChapter) {
      throw new ChatSDKError('not_found:database', 'Chapter not found');
    }

    const [newBookmark] = await db
      .insert(bookmark)
      .values({
        userId: data.userId,
        bookId: data.bookId,
        chapterId: targetChapter.id,
        position: data.position.toString(),
        note: data.note || null,
        isAutomatic: data.isAutomatic || false,
      })
      .returning();

    return newBookmark;
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create bookmark'
    );
  }
}

export async function getUserBookmarks(userId: string): Promise<BookmarkWithDetails[]> {
  try {
    const result = await db
      .select({
        bookmark: bookmark,
        book: book,
        chapter: chapter,
        author: user,
      })
      .from(bookmark)
      .leftJoin(book, eq(bookmark.bookId, book.id))
      .leftJoin(chapter, eq(bookmark.chapterId, chapter.id))
      .leftJoin(user, eq(book.authorId, user.id))
      .where(eq(bookmark.userId, userId))
      .orderBy(desc(bookmark.createdAt));

    return result
      .filter(row => row.bookmark && row.book && row.chapter && row.author)
      .map(row => ({
        ...row.bookmark!,
        book: {
          ...row.book!,
          author: row.author!,
        },
        chapter: row.chapter!,
      }));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user bookmarks'
    );
  }
}

export async function getBookBookmarks(
  userId: string,
  bookId: string
): Promise<BookmarkWithDetails[]> {
  try {
    const result = await db
      .select({
        bookmark: bookmark,
        book: book,
        chapter: chapter,
        author: user,
      })
      .from(bookmark)
      .leftJoin(book, eq(bookmark.bookId, book.id))
      .leftJoin(chapter, eq(bookmark.chapterId, chapter.id))
      .leftJoin(user, eq(book.authorId, user.id))
      .where(and(
        eq(bookmark.userId, userId),
        eq(bookmark.bookId, bookId)
      ))
      .orderBy(asc(chapter.chapterNumber));

    return result
      .filter(row => row.bookmark && row.book && row.chapter && row.author)
      .map(row => ({
        ...row.bookmark!,
        book: {
          ...row.book!,
          author: row.author!,
        },
        chapter: row.chapter!,
      }));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get book bookmarks'
    );
  }
}

export async function deleteBookmark(
  bookmarkId: string,
  userId: string
): Promise<boolean> {
  try {
    const result = await db
      .delete(bookmark)
      .where(and(
        eq(bookmark.id, bookmarkId),
        eq(bookmark.userId, userId)
      ));

    return result.count > 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete bookmark'
    );
  }
}

export async function updateBookmark(
  bookmarkId: string,
  userId: string,
  updates: {
    position?: number;
    note?: string;
  }
): Promise<Bookmark> {
  try {
    const updateData: any = {};
    
    if (updates.position !== undefined) {
      updateData.position = updates.position.toString();
    }
    if (updates.note !== undefined) {
      updateData.note = updates.note;
    }

    const [updated] = await db
      .update(bookmark)
      .set(updateData)
      .where(and(
        eq(bookmark.id, bookmarkId),
        eq(bookmark.userId, userId)
      ))
      .returning();

    if (!updated) {
      throw new ChatSDKError('not_found:database', 'Bookmark not found');
    }

    return updated;
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update bookmark'
    );
  }
}

export async function getBookmarkByChapter(
  userId: string,
  bookId: string,
  chapterNumber: number
): Promise<Bookmark | null> {
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
      return null;
    }

    const [existingBookmark] = await db
      .select()
      .from(bookmark)
      .where(and(
        eq(bookmark.userId, userId),
        eq(bookmark.chapterId, targetChapter.id)
      ));

    return existingBookmark || null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get bookmark by chapter'
    );
  }
}