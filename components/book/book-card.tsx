'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Book } from '@/lib/db/queries/books';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, PenTool, Clock, FileText } from 'lucide-react';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500';
      case 'ongoing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'hiatus':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold line-clamp-1">{book.title}</h3>
          <Badge className={`${getStatusColor(book.status)} text-white`}>
            {book.status}
          </Badge>
        </div>
        {book.genre && (
          <p className="text-sm text-muted-foreground">{book.genre}</p>
        )}
      </CardHeader>
      
      <CardContent className="pb-4">
        {book.coverImageUrl ? (
          <div className="aspect-[3/4] relative mb-4 bg-muted rounded-md overflow-hidden">
            <img
              src={book.coverImageUrl}
              alt={book.title}
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div className="aspect-[3/4] relative mb-4 bg-muted rounded-md flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        {book.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {book.description}
          </p>
        )}
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>{book.chapterCount} chapters</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <PenTool className="w-4 h-4" />
            <span>{book.wordCount.toLocaleString()} words</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Updated {formatDistanceToNow(new Date(book.updatedAt))} ago</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-4">
        <Link href={`/books/${book.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}