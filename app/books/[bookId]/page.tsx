import { auth } from '@/app/auth';
import { redirect, notFound } from 'next/navigation';
import { getBookWithChapters, canUserAccessBook } from '@/lib/db/queries/books';
import { BookOverviewClient } from './book-overview-client';

export default async function BookOverviewPage({ 
  params 
}: { 
  params: Promise<{ bookId: string }>
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/');
  }
  
  // Await params as required in Next.js 15
  const { bookId } = await params;
  
  const hasAccess = await canUserAccessBook(session.user.id, bookId);
  
  if (!hasAccess) {
    notFound();
  }
  
  const result = await getBookWithChapters(bookId);
  
  if (!result) {
    notFound();
  }
  
  return <BookOverviewClient book={result.book} chapters={result.chapters} />;
}