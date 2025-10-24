"use client";

import { useRouter } from "next/navigation";
import {
  Badge,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";

interface Story {
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

interface StoryTableViewProps {
  stories: Story[];
}

export function StoryTableView({ stories }: StoryTableViewProps) {
  const router = useRouter();

  const getVisibilityBadge = (status: string) => {
    if (status === 'published') {
      return <Badge variant="success">Public</Badge>;
    } else {
      return <Badge variant="default">Private</Badge>;
    }
  };

  const formatReaders = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? (completed / total) * 100 : 0;
  };

  if (stories.length === 0) {
    return (
      <div className="text-center py-12 text-[rgb(var(--muted-foreground))]">
        <p className="text-xl mb-2">📝 Ready to start writing?</p>
        <p>Click the "Create New Story" button above to begin your first story!</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Title</TableHead>
            <TableHead>Genre</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Chapters</TableHead>
            <TableHead className="text-center">Parts</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead className="text-center">Readers</TableHead>
            <TableHead className="text-center">Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stories.map((story) => {
            const progressPercentage = getProgressPercentage(
              story.chapters.completed,
              story.chapters.total
            );

            return (
              <TableRow
                key={story.id}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                onClick={() => router.push(`/writing/edit/story/${story.id}`)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>📖</span>
                    <span className="truncate">{story.title}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-[rgb(var(--muted-foreground))]">
                    {story.genre}
                  </span>
                </TableCell>
                <TableCell>{getVisibilityBadge(story.status)}</TableCell>
                <TableCell className="text-center">
                  <span className="text-sm">
                    {story.chapters.completed === story.chapters.total ? "✓" : "⏳"}{" "}
                    {story.chapters.completed}/{story.chapters.total}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm">
                    {story.parts.completed}/{story.parts.total}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-[80px]">
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                    <span className="text-sm text-[rgb(var(--muted-foreground))] min-w-[45px] text-right">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm">
                    📊 {formatReaders(story.readers)}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm">⭐ {story.rating.toFixed(1)}</span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
