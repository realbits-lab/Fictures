'use client';

import { AIWritingAssistant } from '@/components/ai-writing/writing-assistant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface WriteChapterPageProps {
  params: { id: string; chapterNumber: string };
}

export default function WriteChapterPage({ params }: WriteChapterPageProps) {
  const [content, setContent] = useState('');

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chapter Editor */}
        <div className="lg:col-span-2">
          <Card data-testid="chapter-editor">
            <CardHeader>
              <CardTitle>Chapter {params.chapterNumber}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your chapter content here..."
                className="min-h-96"
                data-testid="chapter-content-editor"
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Save Draft</Button>
                <Button>Publish Chapter</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Writing Assistant Sidebar */}
        <div className="lg:col-span-1">
          <AIWritingAssistant storyId={params.id} />
        </div>
      </div>
    </div>
  );
}