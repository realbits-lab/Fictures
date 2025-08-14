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
  params: Promise<{ bookId: string; chapterNumber: string }>
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/');
  }
  
  // Await params as required in Next.js 15
  const { bookId, chapterNumber: chapterNumberStr } = await params;
  
  // Check if user has access to this book
  const hasAccess = await canUserAccessBook(session.user.id, bookId);
  
  if (!hasAccess) {
    notFound();
  }
  
  const book = await getBookById(bookId);
  
  if (!book) {
    notFound();
  }
  
  const chapterNumber = parseInt(chapterNumberStr);
  
  // Check if chapter exists, if not create it
  let [chapter] = await db
    .select()
    .from(chapterTable)
    .where(
      and(
        eq(chapterTable.storyId, bookId),
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
        storyId: bookId,
        chapterNumber,
        title: `Chapter ${chapterNumber}`,
        content: '',
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
      .where(eq(chapterTable.storyId, bookId));
    
    await db
      .update(bookTable)
      .set({ 
        chapterCount: allChapters.length,
        updatedAt: new Date()
      })
      .where(eq(bookTable.id, bookId));
  }
  
  // Extract content from different storage formats
  let chapterContent = '';
  
  if (typeof chapter.content === 'string') {
    // Already a string, use directly
    chapterContent = chapter.content;
  } else if (Array.isArray(chapter.content)) {
    // Legacy format: [{ type: 'paragraph', children: [{ text: content }] }]
    try {
      const firstBlock = chapter.content[0];
      if (firstBlock?.children?.[0]?.text) {
        chapterContent = firstBlock.children[0].text;
      }
    } catch (e) {
      console.warn('Failed to extract content from legacy format:', e);
    }
  } else if (typeof chapter.content === 'object' && chapter.content !== null) {
    // Fallback for other object formats
    chapterContent = JSON.stringify(chapter.content);
  }
  
  return (
    <ChapterWriteLayout 
      bookId={bookId}
      bookTitle={book.title}
      chapterNumber={chapterNumber}
      chapterId={chapter.id}
      initialContent={chapterContent}
    />
  );
}