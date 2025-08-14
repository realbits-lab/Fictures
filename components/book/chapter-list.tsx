'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Chapter } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PenTool, FileText, Clock, Plus } from 'lucide-react';

interface ChapterListProps {
  bookId: string;
  chapters: Chapter[];
  onCreateChapter?: () => void;
}

export function ChapterList({ bookId, chapters, onCreateChapter }: ChapterListProps) {
  if (chapters.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No chapters yet</h3>
          <p className="text-muted-foreground mb-6">
            Start writing your first chapter to begin your story.
          </p>
          <Link href={`/books/${bookId}/chapters/1/write`}>
            <Button>
              <PenTool className="w-4 h-4 mr-2" />
              Write Chapter 1
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Chapters</h2>
        {onCreateChapter && (
          <Button onClick={onCreateChapter} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Chapter
          </Button>
        )}
      </div>
      
      <div className="grid gap-4">
        {chapters.map((chapter) => (
          <Card key={chapter.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {chapter.title}
                    {chapter.isPublished ? (
                      <Badge variant="secondary" className="text-xs">Published</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Draft</Badge>
                    )}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>{chapter.wordCount.toLocaleString()} words</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Updated {formatDistanceToNow(new Date(chapter.updatedAt))} ago</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Link href={`/books/${bookId}/chapters/${chapter.chapterNumber}/write`}>
                    <Button size="sm">
                      <PenTool className="w-4 h-4 mr-2" />
                      {chapter.wordCount > 0 ? 'Continue' : 'Write'}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}