import { auth } from '@/app/auth';
import { redirect } from 'next/navigation';
import { getUserBooks } from '@/lib/db/queries/books';
import { BooksPageClient } from './books-page-client';

export default async function BooksPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/');
  }
  
  const books = await getUserBooks(session.user.id);
  
  return <BooksPageClient initialBooks={books} />;
}