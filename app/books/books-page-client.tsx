'use client';

import { useState } from 'react';
import { Book } from '@/lib/db/queries/books';
import { BookGrid } from '@/components/book/book-grid';
import { CreateBookDialog } from '@/components/book/create-book-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, BookOpen } from 'lucide-react';

interface BooksPageClientProps {
  initialBooks: Book[];
}

export function BooksPageClient({ initialBooks }: BooksPageClientProps) {
  const [books, setBooks] = useState(initialBooks);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleBookCreated = async (bookId: string) => {
    // Refresh the books list
    try {
      const response = await fetch('/api/books');
      if (response.ok) {
        const { books: updatedBooks } = await response.json();
        setBooks(updatedBooks);
      }
    } catch (error) {
      console.error('Error refreshing books:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">My Books</h1>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} size="lg">
            <PlusCircle className="w-5 h-5 mr-2" />
            Create New Book
          </Button>
        </div>
        
        <p className="text-muted-foreground">
          Manage your books and organize your writing. Each book can contain multiple chapters.
        </p>
      </div>

      <BookGrid 
        books={books} 
        onCreateNew={() => setCreateDialogOpen(true)} 
      />

      <CreateBookDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onBookCreated={handleBookCreated}
      />
    </div>
  );
}