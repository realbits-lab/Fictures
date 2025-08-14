'use client';

import { Book } from '@/lib/db/queries/books';
import { BookCard } from './book-card';
import { BookPlus } from 'lucide-react';

interface BookGridProps {
  books: Book[];
  onCreateNew?: () => void;
}

export function BookGrid({ books, onCreateNew }: BookGridProps) {
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <BookPlus className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No books yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Start your writing journey by creating your first book. Each book can contain multiple chapters.
        </p>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create Your First Book
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}