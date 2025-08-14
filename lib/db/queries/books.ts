import { db } from '@/lib/db/drizzle';
import { book, chapter, user, chat } from '@/lib/db/schema';
import { eq, desc, asc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
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
    .from(book)
    .where(eq(book.authorId, userId))
    .orderBy(desc(book.updatedAt));
}

export async function createBook(data: {
  userId: string;
  title: string;
  description?: string;
  genre?: string;
  coverImageUrl?: string;
}) {
  const [newBook] = await db
    .insert(book)
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
      title: `${newBook.title} - Chapter 1`,
      userId: data.userId,
      chatType: 'chapter',
      visibility: 'private',
      createdAt: new Date(),
    })
    .returning();

  await db.insert(chapter).values({
    id: chapterId,
    bookId: newBook.id,
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
    .update(book)
    .set({ chapterCount: 1 })
    .where(eq(book.id, newBook.id));

  return newBook;
}

export async function getBookById(bookId: string) {
  const [bookRecord] = await db
    .select()
    .from(book)
    .where(eq(book.id, bookId))
    .limit(1);
    
  return bookRecord;
}

export async function getBookWithChapters(bookId: string) {
  const [bookRecord] = await db
    .select()
    .from(book)
    .where(eq(book.id, bookId))
    .limit(1);
    
  if (!bookRecord) {
    return null;
  }
    
  const chapters = await db
    .select()
    .from(chapter)
    .where(eq(chapter.bookId, bookId))
    .orderBy(asc(chapter.chapterNumber));
    
  return { book: bookRecord, chapters };
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
    .update(book)
    .set(updateData)
    .where(eq(book.id, bookId))
    .returning();
    
  return updated;
}

export async function deleteBook(bookId: string) {
  // Chapters will be deleted automatically due to cascade
  await db
    .delete(book)
    .where(eq(book.id, bookId));
}

export async function createChapterForBook(
  bookId: string,
  userId: string,
  chapterNumber: number,
  title?: string
) {
  const chapterId = uuidv4();
  
  // Create a chat for this chapter
  const [bookRecord] = await db
    .select()
    .from(book)
    .where(eq(book.id, bookId))
    .limit(1);
    
  if (!bookRecord) {
    throw new Error('Book not found');
  }
  
  const [newChat] = await db
    .insert(chat)
    .values({
      title: `${bookRecord.title} - ${title || `Chapter ${chapterNumber}`}`,
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
      bookId: bookId,
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
    .where(eq(chapter.bookId, bookId));
    
  await db
    .update(book)
    .set({ 
      chapterCount: currentChapterCount.length,
      updatedAt: new Date()
    })
    .where(eq(book.id, bookId));
    
  return newChapter;
}

export async function canUserAccessBook(userId: string, bookId: string): Promise<boolean> {
  const [bookRecord] = await db
    .select({ authorId: book.authorId })
    .from(book)
    .where(eq(book.id, bookId))
    .limit(1);
    
  return bookRecord?.authorId === userId;
}

// Public access functions for viewers - all books are viewable, but only published chapters
export async function getAllBooks() {
  return await db
    .select()
    .from(book)
    .orderBy(desc(book.updatedAt));
}