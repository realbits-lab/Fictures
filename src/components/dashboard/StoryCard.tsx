import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  Progress,
} from "@/components/ui";
import { JsonView } from "react-json-view-lite";

interface StoryCardProps {
  id: string;
  title: string;
  genre: string;
  parts: {
    completed: number;
    total: number;
  };
  chapters: {
    completed: number;
    total: number;
  };
  readers: number;
  rating: number;
  status: "draft" | "publishing" | "completed";
  wordCount?: number;
  firstChapterId?: string | null;
  storyData?: Record<string, unknown> | null;
}

export function StoryCard({
  id,
  title,
  genre,
  parts,
  chapters,
  readers,
  rating,
  status,
  wordCount,
  firstChapterId,
  storyData,
}: StoryCardProps) {
  const progressPercentage =
    chapters.total > 0 ? (chapters.completed / chapters.total) * 100 : 0;

  const getStatusBadge = () => {
    switch (status) {
      case "draft":
        return <Badge variant="default">Draft</Badge>;
      case "publishing":
        return <Badge variant="info">Publishing</Badge>;
      case "completed":
        return <Badge variant="success">Complete</Badge>;
      default:
        return <Badge variant="default">Draft</Badge>;
    }
  };

  const formatReaders = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              📖 {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{genre}</p>
          </div>
          {getStatusBadge()}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-gray-600 dark:text-gray-400">
                📄 Parts: {parts.completed}/{parts.total}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {chapters.completed === chapters.total ? "✓" : "⏳"} Chapters:{" "}
                {chapters.completed}/{chapters.total}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-600 dark:text-gray-400">
                📊 Readers: {formatReaders(readers)}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                ⭐ Rating: {rating.toFixed(1)}
              </p>
            </div>
          </div>

          {wordCount && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              📝 {wordCount.toLocaleString()} words
            </p>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} />
          </div>

          {storyData && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">📊 Story Data</h4>
              <div className="text-xs max-h-32 overflow-auto">
                <JsonView 
                  data={storyData} 
                  shouldExpandNode={(level, value, field) => level < 1}
                  style={{
                    container: 'font-mono text-gray-600 dark:text-gray-400',
                    basicChildStyle: 'padding-left: 0.75rem',
                    label: 'color: rgb(59 130 246)', // blue-500
                    clickableLabel: 'color: rgb(59 130 246); cursor: pointer',
                    valueText: 'color: rgb(34 197 94)', // green-500
                    undefinedValue: 'color: rgb(156 163 175)', // gray-400
                    nullValue: 'color: rgb(156 163 175)',
                    booleanValue: 'color: rgb(168 85 247)', // purple-500
                    numberValue: 'color: rgb(249 115 22)', // orange-500
                    stringValue: 'color: rgb(34 197 94)',
                    collapseIcon: 'color: rgb(107 114 128)', // gray-500
                    expandIcon: 'color: rgb(107 114 128)',
                    punctuation: 'color: rgb(107 114 128)'
                  }}
                />
              </div>
            </div>
          )}

        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        {firstChapterId ? (
          <Link href={`/write/${firstChapterId}`} className="flex-1">
            <Button size="sm" className="w-full">
              📝 Write
            </Button>
          </Link>
        ) : (
          <Link href={`/stories/${id}/new-chapter`} className="flex-1">
            <Button size="sm" className="w-full">
              📝 Start Writing
            </Button>
          </Link>
        )}
        <Link href={`/stories/${id}/stats`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full">
            📊 Stats
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
