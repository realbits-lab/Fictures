"use client";

import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  Progress,
} from "@/components/ui";

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
  status: "draft" | "publishing" | "completed" | "published";
  wordCount?: number;
  firstChapterId?: string | null;
  isPublic?: boolean;
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
  isPublic,
}: StoryCardProps) {
  const progressPercentage =
    chapters.total > 0 ? (chapters.completed / chapters.total) * 100 : 0;

  const getVisibilityBadge = () => {
    if (isPublic === true) {
      return (
        <Badge variant="success">
          Public
        </Badge>
      );
    } else {
      return (
        <Badge variant="default">
          Private
        </Badge>
      );
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
            <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">
              📖 {title}
            </h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">{genre}</p>
          </div>
          {getVisibilityBadge()}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-[rgb(var(--muted-foreground))]">
                📄 Parts: {parts.completed}/{parts.total}
              </p>
              <p className="text-[rgb(var(--muted-foreground))]">
                {chapters.completed === chapters.total ? "✓" : "⏳"} Chapters:{" "}
                {chapters.completed}/{chapters.total}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[rgb(var(--muted-foreground))]">
                📊 Readers: {formatReaders(readers)}
              </p>
              <p className="text-[rgb(var(--muted-foreground))]">
                ⭐ Rating: {rating.toFixed(1)}
              </p>
            </div>
          </div>

          {wordCount && (
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              📝 {wordCount.toLocaleString()} words
            </p>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-[rgb(var(--muted-foreground))]">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} />
          </div>


        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Link href={`/write/story/${id}`} className="flex-1">
          <Button size="sm" className="w-full">
            📝 Write
          </Button>
        </Link>
        <Link href={`/stories/${id}/stats`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full">
            📊 Stats
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
