import { db } from '@/lib/db/drizzle';
import { story as bookTable, chapter, user, chat } from '@/lib/db/schema';
import { eq, desc, asc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Type alias for clarity - Story table is our Book table
export type Book = {
  id: string;
  title: string;
  description: string | null;
  genre: string | null;
  status: 'draft' | 'ongoing' | 'completed' | 'hiatus';
  authorId: string;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  chapterCount: number;
  readCount: number;
  likeCount: number;
  coverImageUrl: string | null;
  tags: string[];
  mature: boolean;
};

export async function getUserBooks(userId: string) {
  return await db
    .select()
    .from(bookTable)
    .where(eq(bookTable.authorId, userId))
    .orderBy(desc(bookTable.updatedAt));
}

export async function createBook(data: {
  userId: string;
  title: string;
  description?: string;
  genre?: string;
  coverImageUrl?: string;
}) {
  const [book] = await db
    .insert(bookTable)
    .values({
      authorId: data.userId,
      title: data.title,
      description: data.description || null,
      genre: data.genre || null,
      coverImageUrl: data.coverImageUrl || null,
      status: 'draft',
      isPublished: false,
      wordCount: 0,
      chapterCount: 0,
      readCount: 0,
      likeCount: 0,
      tags: [],
      mature: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Create first chapter automatically
  const chapterId = uuidv4();
  
  // Create a chat for this chapter
  const [newChat] = await db
    .insert(chat)
    .values({
      title: `${book.title} - Chapter 1`,
      userId: data.userId,
      chatType: 'chapter',
      visibility: 'private',
      createdAt: new Date(),
    })
    .returning();

  await db.insert(chapter).values({
    id: chapterId,
    storyId: book.id,
    chapterNumber: 1,
    title: 'Chapter 1',
    content: {},
    wordCount: 0,
    isPublished: false,
    chatId: newChat.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Update chapter count
  await db
    .update(bookTable)
    .set({ chapterCount: 1 })
    .where(eq(bookTable.id, book.id));

  return book;
}

export async function getBookById(bookId: string) {
  const [book] = await db
    .select()
    .from(bookTable)
    .where(eq(bookTable.id, bookId))
    .limit(1);
    
  return book;
}

export async function getBookWithChapters(bookId: string) {
  const [book] = await db
    .select()
    .from(bookTable)
    .where(eq(bookTable.id, bookId))
    .limit(1);
    
  if (!book) {
    return null;
  }
    
  const chapters = await db
    .select()
    .from(chapter)
    .where(eq(chapter.storyId, bookId))
    .orderBy(asc(chapter.chapterNumber));
    
  return { book, chapters };
}

export async function updateBook(
  bookId: string,
  data: {
    title?: string;
    description?: string;
    genre?: string;
    coverImageUrl?: string;
    status?: 'draft' | 'ongoing' | 'completed' | 'hiatus';
  }
) {
  const updateData: any = {
    updatedAt: new Date(),
  };
  
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.genre !== undefined) updateData.genre = data.genre;
  if (data.coverImageUrl !== undefined) updateData.coverImageUrl = data.coverImageUrl;
  if (data.status !== undefined) updateData.status = data.status;
  
  const [updated] = await db
    .update(bookTable)
    .set(updateData)
    .where(eq(bookTable.id, bookId))
    .returning();
    
  return updated;
}

export async function deleteBook(bookId: string) {
  // Chapters will be deleted automatically due to cascade
  await db
    .delete(bookTable)
    .where(eq(bookTable.id, bookId));
}

export async function createChapterForBook(
  bookId: string,
  userId: string,
  chapterNumber: number,
  title?: string
) {
  const chapterId = uuidv4();
  
  // Create a chat for this chapter
  const [book] = await db
    .select()
    .from(bookTable)
    .where(eq(bookTable.id, bookId))
    .limit(1);
    
  if (!book) {
    throw new Error('Book not found');
  }
  
  const [newChat] = await db
    .insert(chat)
    .values({
      title: `${book.title} - ${title || `Chapter ${chapterNumber}`}`,
      userId,
      chatType: 'chapter',
      visibility: 'private',
      createdAt: new Date(),
    })
    .returning();

  const [newChapter] = await db
    .insert(chapter)
    .values({
      id: chapterId,
      storyId: bookId,
      chapterNumber,
      title: title || `Chapter ${chapterNumber}`,
      content: {},
      wordCount: 0,
      isPublished: false,
      chatId: newChat.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
    
  // Update chapter count
  const currentChapterCount = await db
    .select({ count: chapter.chapterNumber })
    .from(chapter)
    .where(eq(chapter.storyId, bookId));
    
  await db
    .update(bookTable)
    .set({ 
      chapterCount: currentChapterCount.length,
      updatedAt: new Date()
    })
    .where(eq(bookTable.id, bookId));
    
  return newChapter;
}

export async function canUserAccessBook(userId: string, bookId: string): Promise<boolean> {
  const [book] = await db
    .select({ authorId: bookTable.authorId })
    .from(bookTable)
    .where(eq(bookTable.id, bookId))
    .limit(1);
    
  return book?.authorId === userId;
}