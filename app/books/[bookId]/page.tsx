import { auth } from '@/app/auth';
import { redirect, notFound } from 'next/navigation';
import { getBookWithChapters, canUserAccessBook } from '@/lib/db/queries/books';
import { BookOverviewClient } from './book-overview-client';

export default async function BookOverviewPage({ 
  params 
}: { 
  params: { bookId: string } 
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/');
  }
  
  const hasAccess = await canUserAccessBook(session.user.id, params.bookId);
  
  if (!hasAccess) {
    notFound();
  }
  
  const result = await getBookWithChapters(params.bookId);
  
  if (!result) {
    notFound();
  }
  
  return <BookOverviewClient book={result.book} chapters={result.chapters} />;
}