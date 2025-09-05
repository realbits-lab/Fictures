"use client";

import { useSession } from 'next-auth/react';
import { SkeletonLoader, StoryCardSkeleton, DashboardWidgetSkeleton } from "@/components/ui";
import { useUserStories } from "@/lib/hooks/use-page-cache";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

import { AIAssistantWidget } from "./AIAssistantWidget";
import { CommunityHighlights } from "./CommunityHighlights";
import { CreateStoryCard } from "./CreateStoryCard";
import { PublishingSchedule } from "./PublishingSchedule";
import { RecentActivity } from "./RecentActivity";
import { StoryCard } from "./StoryCard";

function CreateStoryCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-600 p-6">
      <div className="text-center">
        <Skeleton height={48} width={48} className="mx-auto mb-4 rounded-full" />
        <Skeleton height={20} width="60%" className="mx-auto mb-2" />
        <Skeleton height={16} width="80%" className="mx-auto" />
      </div>
    </div>
  );
}

function StoriesSkeletonSection() {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Skeleton height={32} width={32} />
            <Skeleton height={32} width={150} />
          </div>
          <Skeleton height={16} width={250} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CreateStoryCardSkeleton />
        <StoryCardSkeleton />
        <StoryCardSkeleton />
      </div>
    </section>
  );
}

function DashboardWidgetsSkeletonSection() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <DashboardWidgetSkeleton />
        <DashboardWidgetSkeleton />
      </div>
      <div className="space-y-6">
        <DashboardWidgetSkeleton />
        <DashboardWidgetSkeleton />
      </div>
    </section>
  );
}

export function DashboardClient() {
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
      <SkeletonLoader theme="light">
        <div className="space-y-8">
          <StoriesSkeletonSection />
          <DashboardWidgetsSkeletonSection />
        </div>
      </SkeletonLoader>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load your stories</p>
        <p className="text-gray-600 mb-4 text-sm">{error.message}</p>
        <button 
          onClick={refreshStories} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>📚</span>
              My Stories
              {isValidating && (
                <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin ml-2"></div>
              )}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and organize all your creative works
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CreateStoryCard />
          {stories.map((story) => (
            <StoryCard key={story.id} {...story} />
          ))}
          {stories.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p className="text-xl mb-2">📝 Ready to start writing?</p>
              <p>
                Click the &quot;Create New Story&quot; card above to begin your
                first story!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Dashboard Widgets */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <RecentActivity />
          <AIAssistantWidget />
        </div>
        <div className="space-y-6">
          <PublishingSchedule />
          <CommunityHighlights />
        </div>
      </section>
    </div>
  );
}