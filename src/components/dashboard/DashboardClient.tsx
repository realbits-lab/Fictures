"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { SkeletonLoader, Skeleton, StoryCardSkeleton, Button } from "@/components/ui";
import { useUserStories } from "@/lib/hooks/use-page-cache";
import { StoryGrid } from "@/components/browse/StoryGrid";

import { StoryCard } from "./StoryCard";
import { ViewToggle } from "./view-toggle";
import { StoryTableView } from "./story-table-view";

function StoriesSkeletonSection() {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-38" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StoryCardSkeleton />
        <StoryCardSkeleton />
        <StoryCardSkeleton />
      </div>
    </section>
  );
}


export function DashboardClient() {
  const [view, setView] = useState<"card" | "table">("card");
  const { data: session } = useSession();
  const { data, isLoading, isValidating, error, mutate: refreshStories } = useUserStories();

  // Transform data to match StoryGrid expected format
  const stories = (data?.stories || []).map((story: any) => ({
    id: story.id,
    title: story.title,
    summary: story.summary || '', // Story summary from database
    genre: story.genre || "General",
    status: story.status,
    isPublic: story.isPublic || false,
    viewCount: story.readers || 0,
    rating: story.rating || 0,
    createdAt: new Date(),
    imageUrl: story.imageUrl || '',
    imageVariants: story.imageVariants,
    author: {
      id: session?.user?.id || '',
      name: session?.user?.name || 'You',
    },
  }));

  // Show loading state
  if (!session?.user?.id) {
    return <div>Please sign in to view your dashboard.</div>;
  }

  // Show skeleton loading while fetching
  if (isLoading) {
    return (
      <SkeletonLoader>
        <div className="space-y-8">
          <StoriesSkeletonSection />
        </div>
      </SkeletonLoader>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-[rgb(var(--color-destructive))] mb-4">Failed to load your stories</p>
        <p className="text-[rgb(var(--color-muted-foreground))] mb-4 text-sm">{error.message}</p>
        <button 
          onClick={refreshStories} 
          className="px-4 py-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))] rounded-lg hover:bg-[rgb(var(--color-primary)/90%)] transition-colors disabled:opacity-50"
          disabled={isValidating}
        >
          {isValidating ? 'Retrying...' : 'Try Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))]">
      <div className="container mx-auto px-4 pt-1 pb-8">
        {/* Background validation indicator in top right */}
        {isValidating && !isLoading && (
          <div className="fixed top-20 right-4 z-50 bg-[rgb(var(--color-background))] rounded-lg shadow-lg border border-[rgb(var(--color-border))] px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--color-muted-foreground))]">
              <div className="w-4 h-4 border-2 border-[rgb(var(--color-primary)/30%)] border-t-[rgb(var(--color-primary))] rounded-full animate-spin" />
              <span>Refreshing stories...</span>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))] flex items-center gap-2">
              <span>📚</span>
              My Stories
            </h2>
            <p className="text-[rgb(var(--color-muted-foreground))] mt-1">
              Manage and organize all your creative works
            </p>
          </div>
          <Link href="/studio/new">
            <Button>
              <span className="mr-2">📖</span>
              Create New Story
            </Button>
          </Link>
        </div>

        {/* Use StoryGrid component with studio pageType */}
        <StoryGrid stories={stories} currentUserId={session?.user?.id} pageType="studio" />
      </div>
    </div>
  );
}