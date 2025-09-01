import React from "react";
import { Card, CardHeader, CardTitle, CardContent, Progress, Badge, Button } from "@/components/ui";

interface StoryOverviewProps {
  story: {
    id: string;
    title: string;
    genre: string;
    status: string;
    startDate: string;
    wordCount: number;
    targetWordCount: number;
    readers: number;
    rating: number;
    parts: Array<{
      id: string;
      title: string;
      completed: boolean;
      chapters: number;
      wordCount: number;
    }>;
  };
}

export function StoryOverview({ story }: StoryOverviewProps) {
  const progressPercentage = (story.wordCount / story.targetWordCount) * 100;

  return (
    <div className="space-y-6">
      {/* Story Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            📄 {story.title}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span>🏷️ {story.genre}</span>
            <span>📅 Started: {story.startDate}</span>
            <Badge variant="info">{story.status}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">📤 Share</Button>
          <Button>📝 Continue Writing</Button>
        </div>
      </div>

      {/* Story Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Story Progress Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress:</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} showValue={false} />
          </div>

          {/* Parts Overview */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">📋 Parts Overview:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {story.parts.map((part, index) => (
                <div key={part.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    Part {index + 1}: {part.title}
                  </h5>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    <div className="flex items-center gap-1">
                      <span>{part.completed ? "✓" : "⏳"}</span>
                      <span>{part.chapters} Ch.</span>
                    </div>
                    <div className="mt-1">{part.wordCount.toLocaleString()} words</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Status */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                🎯 <strong>Current:</strong> Writing Chapter 16 &ldquo;Final Confrontation&rdquo;
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                📊 <strong>Total:</strong> {story.wordCount.toLocaleString()} words | 👥 {story.readers.toLocaleString()} readers | ⭐ {story.rating.toFixed(1)} rating
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Story Foundation and AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>🎯 Story Foundation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Central Question:</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                &ldquo;Can Maya master shadow magic to save Elena before power corrupts her?&rdquo;
              </p>
              <Button size="sm" variant="ghost" className="mt-2">✏️ Edit</Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm"><strong>Target Word Count:</strong> {story.targetWordCount.toLocaleString()}</p>
              <p className="text-sm"><strong>Current Progress:</strong> {story.wordCount.toLocaleString()} ({Math.round(progressPercentage)}%)</p>
              <p className="text-sm"><strong>Genre:</strong> {story.genre}</p>
              <p className="text-sm"><strong>Themes:</strong> Power, Family, Sacrifice</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🤖 AI Assistant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              &ldquo;Analyzing character hierarchy. Maya&rsquo;s arc shows positive change potential. Suggest expanding Marcus&rsquo;s mentor role in Part III.&rdquo;
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary">Apply</Button>
              <Button size="sm" variant="ghost">Analyze</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}