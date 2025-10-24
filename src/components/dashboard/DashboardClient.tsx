"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { SkeletonLoader, Skeleton, StoryCardSkeleton, Button } from "@/components/ui";
import { useUserStories } from "@/lib/hooks/use-page-cache";

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

  // Transform data to match expected format
  const stories = data?.stories || [];

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
        <p className="text-[rgb(var(--destructive))] mb-4">Failed to load your stories</p>
        <p className="text-[rgb(var(--muted-foreground))] mb-4 text-sm">{error.message}</p>
        <button 
          onClick={refreshStories} 
          className="px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-lg hover:bg-[rgb(var(--primary)/90%)] transition-colors disabled:opacity-50"
          disabled={isValidating}
        >
          {isValidating ? 'Retrying...' : 'Try Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stories Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[rgb(var(--foreground))] flex items-center gap-2">
              <span>📚</span>
              My Stories
              {isValidating && (
                <div className="w-4 h-4 border-2 border-[rgb(var(--muted))] border-t-[rgb(var(--primary))] rounded-full animate-spin ml-2"></div>
              )}
            </h2>
            <p className="text-[rgb(var(--muted-foreground))] mt-1">
              Manage and organize all your creative works
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle view={view} onViewChange={setView} />
            <Link href="/writing/new">
              <Button>
                <span className="mr-2">📖</span>
                Create New Story
              </Button>
            </Link>
          </div>
        </div>

        {view === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story: any) => (
              <StoryCard key={story.id} {...story} />
            ))}
            {stories.length === 0 && (
              <div className="col-span-full text-center py-12 text-[rgb(var(--muted-foreground))]">
                <p className="text-xl mb-2">📝 Ready to start writing?</p>
                <p>
                  Click the &quot;Create New Story&quot; button above to begin your
                  first story!
                </p>
              </div>
            )}
          </div>
        ) : (
          <StoryTableView stories={stories} />
        )}
      </section>
    </div>
  );
}