import { auth } from '@/app/auth';
import { redirect, notFound } from 'next/navigation';
import { canUserAccessBook, getBookById } from '@/lib/db/queries/books';
import { db } from '@/lib/db/drizzle';
import { chapter as chapterTable, chat, story as bookTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import ChapterWriteLayout from '@/components/chapter/chapter-write-layout';

export default async function ChapterWritePage({ 
  params 
}: { 
  params: { bookId: string; chapterNumber: string } 
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/');
  }
  
  // Check if user has access to this book
  const hasAccess = await canUserAccessBook(session.user.id, params.bookId);
  
  if (!hasAccess) {
    notFound();
  }
  
  const book = await getBookById(params.bookId);
  
  if (!book) {
    notFound();
  }
  
  const chapterNumber = parseInt(params.chapterNumber);
  
  // Check if chapter exists, if not create it
  let [chapter] = await db
    .select()
    .from(chapterTable)
    .where(
      and(
        eq(chapterTable.storyId, params.bookId),
        eq(chapterTable.chapterNumber, chapterNumber)
      )
    )
    .limit(1);
  
  if (!chapter) {
    // Create a new chapter
    const [newChat] = await db
      .insert(chat)
      .values({
        title: `${book.title} - Chapter ${chapterNumber}`,
        userId: session.user.id,
        chatType: 'chapter',
        visibility: 'private',
        createdAt: new Date(),
      })
      .returning();
    
    [chapter] = await db
      .insert(chapterTable)
      .values({
        storyId: params.bookId,
        chapterNumber,
        title: `Chapter ${chapterNumber}`,
        content: {},
        wordCount: 0,
        isPublished: false,
        chatId: newChat.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    // Update book chapter count if needed
    const allChapters = await db
      .select()
      .from(chapterTable)
      .where(eq(chapterTable.storyId, params.bookId));
    
    await db
      .update(bookTable)
      .set({ 
        chapterCount: allChapters.length,
        updatedAt: new Date()
      })
      .where(eq(bookTable.id, params.bookId));
  }
  
  return (
    <ChapterWriteLayout 
      bookId={params.bookId}
      bookTitle={book.title}
      chapterNumber={chapterNumber}
      chapterId={chapter.id}
      initialContent={chapter.content as string || ''}
    />
  );
}