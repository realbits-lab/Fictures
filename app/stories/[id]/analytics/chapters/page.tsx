'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ChapterAnalyticsPageProps {
  params: { id: string };
}

export default function ChapterAnalyticsPage({ params }: ChapterAnalyticsPageProps) {
  const chapterAnalytics = [
    {
      chapter: 1,
      title: 'The Beginning',
      reads: 1520,
      engagement: 85,
      comments: 23,
      completionRate: 92
    },
    {
      chapter: 2,
      title: 'The Mystery Deepens',
      reads: 1340,
      engagement: 78,
      comments: 31,
      completionRate: 88
    },
    {
      chapter: 3,
      title: 'First Clues',
      reads: 1180,
      engagement: 82,
      comments: 19,
      completionRate: 85
    }
  ];

  return (
    <div className="container mx-auto p-6" data-testid="chapter-analytics-page">
      <h1 className="text-3xl font-bold mb-6">Chapter Analytics</h1>
      
      <div className="space-y-4">
        {chapterAnalytics.map((chapter) => (
          <Card key={chapter.chapter} data-testid="chapter-analytics-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Chapter {chapter.chapter}: {chapter.title}</CardTitle>
                <Badge variant="outline">{chapter.reads} reads</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600" data-testid="chapter-reads">
                    {chapter.reads.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Reads</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Progress value={chapter.engagement} className="w-16" />
                    <span className="text-sm font-medium" data-testid="chapter-engagement">
                      {chapter.engagement}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">Engagement</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600" data-testid="chapter-comments">
                    {chapter.comments}
                  </div>
                  <div className="text-sm text-gray-600">Comments</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600" data-testid="chapter-completion">
                    {chapter.completionRate}%
                  </div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}