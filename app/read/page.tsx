import { getAllBooks } from '@/lib/db/queries/books';
import { BookGrid } from '@/components/book/book-grid';
import Link from 'next/link';
import { auth } from '@/app/auth';

export default async function PublishedBooksPage() {
  const books = await getAllBooks();
  const session = await auth();

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Discover Stories</h1>
          <p className="text-lg text-gray-600">
            Browse published stories from our community of writers
          </p>
        </div>
      </div>

      {books.length > 0 ? (
        <BookGrid books={books} variant="public" />
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-400 mb-2">
            No Stories Available Yet
          </h2>
          <p className="text-gray-500">
            Check back soon for new stories from our authors!
          </p>
        </div>
      )}
    </div>
  );
}