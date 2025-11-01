"use client";

import Link from "next/link";
import {
  Badge,
  Card,
  CardContent,
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
  firstChapterId,
  isPublic,
}: StoryCardProps) {
  const progressPercentage =
    chapters.total > 0 ? (chapters.completed / chapters.total) * 100 : 0;

  const getVisibilityBadge = () => {
    if (status === 'published') {
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
    <Link href={`/studio/edit/story/${id}`} className="block h-full">
      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer">
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

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-[rgb(var(--muted-foreground))]">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} />
          </div>


        </div>
      </CardContent>
    </Card>
    </Link>
  );
}
