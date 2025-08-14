'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Book } from '@/lib/db/queries/books';
import { Chapter } from '@/lib/db/schema';
import { ChapterList } from '@/components/book/chapter-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  ArrowLeft, 
  Edit, 
  FileText, 
  Clock,
  BarChart,
  Settings,
  PenTool
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BookOverviewClientProps {
  book: Book;
  chapters: Chapter[];
}

export function BookOverviewClient({ book, chapters }: BookOverviewClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleCreateChapter = async () => {
    const nextChapterNumber = chapters.length + 1;
    router.push(`/books/${book.id}/chapters/${nextChapterNumber}/write`);
  };


  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/books">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Books
          </Button>
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{book.title}</h1>
              <Badge className={`${getStatusColor(book.status)} text-white`}>
                {book.status}
              </Badge>
            </div>
            
            {book.genre && (
              <p className="text-muted-foreground mb-2">{book.genre}</p>
            )}
            
            {book.description && (
              <p className="text-muted-foreground max-w-3xl">{book.description}</p>
            )}
          </div>
          
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Edit Book
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Chapters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{book.chapterCount}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Words
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{book.wordCount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Read Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{book.readCount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm">
                {formatDistanceToNow(new Date(book.updatedAt))} ago
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chapters */}
      <ChapterList 
        bookId={book.id} 
        chapters={chapters}
        onCreateChapter={handleCreateChapter}
      />
    </div>
  );
}