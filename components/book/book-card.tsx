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
  variant?: 'private' | 'public';
}

export function BookCard({ book, variant = 'private' }: BookCardProps) {
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
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h3 className="text-base font-semibold line-clamp-1">{book.title}</h3>
          <Badge className={`${getStatusColor(book.status)} text-white text-xs`}>
            {book.status}
          </Badge>
        </div>
        {book.genre && (
          <p className="text-xs text-muted-foreground">{book.genre}</p>
        )}
      </CardHeader>
      
      <CardContent className="pb-2">
        {book.coverImageUrl ? (
          <div className="aspect-[4/3] relative mb-2 bg-muted rounded-md overflow-hidden">
            <img
              src={book.coverImageUrl}
              alt={book.title}
              className="object-cover size-full"
            />
          </div>
        ) : (
          <div className="aspect-[4/3] relative mb-2 bg-muted rounded-md flex items-center justify-center">
            <BookOpen className="size-8 text-muted-foreground" />
          </div>
        )}
        
        {book.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
            {book.description}
          </p>
        )}
        
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <FileText className="size-3" />
            <span>{book.chapterCount} chapters</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <PenTool className="size-3" />
            <span>{book.wordCount.toLocaleString()} words</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="size-3" />
            <span>Updated {formatDistanceToNow(new Date(book.updatedAt))} ago</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        <Link 
          href={variant === 'public' ? `/read/${book.id}` : `/books/${book.id}`} 
          className="w-full"
        >
          <Button variant="outline" className="w-full h-8 text-xs">
            {variant === 'public' ? 'Read Story' : 'View Details'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}