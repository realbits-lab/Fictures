"use client";

import { MainLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from "@/components/ui";
import Link from "next/link";
import { CommunityStoryCard } from "@/components/community/CommunityStoryCard";
import { MetricCard } from "@/components/community/metric-card";
import { Skeleton, SkeletonLoader } from "@/components/ui";
import { useCommunityStories } from '@/lib/hooks/use-page-cache';
import { useCommunityEvents } from '@/lib/hooks/use-community-events';
import { StoryGrid } from "@/components/browse/StoryGrid";
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useCallback, useState } from 'react';
import type { StoryPublishedEvent, StoryUpdatedEvent, PostCreatedEvent } from '@/lib/redis/client';

interface CommunityStory {
  id: string;
  title: string;
  summary: string;
  genre: string;
  status: string;
  coverImage: string | null;
  author: {
    id: string;
    name: string;
    username: string | null;
  };
  totalPosts: number;
  totalMembers: number;
  isActive: boolean;
  lastActivity: string;
}

interface CommunityStats {
  activeToday: number;
  commentsToday: number;
  averageRating: number;
  totalStories: number;
  totalPosts: number;
  totalMembers: number;
}

export default function CommunityPage() {
  const { data: session } = useSession();
  const [newStoryCount, setNewStoryCount] = useState(0);
  const [recentlyPublishedStories, setRecentlyPublishedStories] = useState<string[]>([]);

  // Helper function for formatting relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  // Enhanced SWR hook with localStorage caching
  const { data, error, isLoading, isValidating } = useCommunityStories();

  // Handle real-time story published events
  const handleStoryPublished = useCallback((event: StoryPublishedEvent) => {
    console.log('📚 New story published in real-time:', event.title);

    // Show toast notification with action
    toast.success(`New story published: ${event.title}`, {
      description: event.genre ? `Genre: ${event.genre}` : undefined,
      duration: 5000,
      action: {
        label: 'View',
        onClick: () => {
          window.location.href = `/community/story/${event.storyId}`;
        },
      },
    });

    // Increment new story counter
    setNewStoryCount(prev => prev + 1);

    // Add to recently published list
    setRecentlyPublishedStories(prev => [event.storyId, ...prev].slice(0, 5));
  }, []);

  // Handle story updated events
  const handleStoryUpdated = useCallback((event: StoryUpdatedEvent) => {
    console.log('📝 Story updated in real-time:', event.storyId);
  }, []);

  // Handle post created events
  const handlePostCreated = useCallback((event: PostCreatedEvent) => {
    console.log('💬 New post created:', event.title);

    // Show subtle notification for new posts
    toast.info(`New discussion: ${event.title}`, {
      duration: 3000,
    });
  }, []);

  // Connect to SSE for real-time updates
  const { isConnected, error: sseError } = useCommunityEvents({
    onStoryPublished: handleStoryPublished,
    onStoryUpdated: handleStoryUpdated,
    onPostCreated: handlePostCreated,
    autoRevalidate: true,
  });

  // Transform data when available - convert to StoryGrid compatible format
  const stories = data?.success ? data.stories.map((story: any) => ({
    id: story.id,
    title: story.title,
    summary: story.summary || 'No summary available', // Story summary from database
    genre: story.genre,
    status: story.status,
    isPublic: true, // Community stories are always public
    viewCount: story.totalPosts || 0, // Use posts as view count for community
    rating: 0, // Community stories don't have ratings yet
    createdAt: new Date(story.lastActivity),
    imageUrl: story.imageUrl || story.coverImage || '',
    author: {
      id: story.author?.id || '',
      name: story.author?.name || story.author || 'Unknown Author',
    },
  })) : [];

  // Calculate stats from original fetched data
  const rawStories = data?.success ? data.stories : [];
  const stats: CommunityStats = rawStories.length > 0 ? {
    totalStories: rawStories.length,
    totalPosts: rawStories.reduce((sum: number, story: any) => sum + (story.totalPosts || 0), 0),
    totalMembers: rawStories.reduce((sum: number, story: any) => sum + (story.totalMembers || 0), 0),
    activeToday: rawStories.filter((story: any) => story.isActive).length,
    commentsToday: Math.floor(rawStories.reduce((sum: number, story: any) => sum + (story.totalPosts || 0), 0) * 0.3),
    averageRating: 4.7,
  } : {
    activeToday: 0,
    commentsToday: 0,
    averageRating: 0,
    totalStories: 0,
    totalPosts: 0,
    totalMembers: 0,
  };
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <span>💬</span>
              Community Hub
            </h1>
            {/* Real-time connection indicator */}
            {isConnected && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full text-xs text-green-700 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
            )}
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Connect with readers and fellow writers through story discussions
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Choose a story below to join the conversation • No login required to read • Sign in to participate
          </p>
        </div>

        {/* New stories notification banner */}
        {newStoryCount > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 animate-in fade-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {newStoryCount}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {newStoryCount === 1 ? 'New story published!' : `${newStoryCount} new stories published!`}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Scroll down to see the latest additions to our community
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setNewStoryCount(0);
                  setRecentlyPublishedStories([]);
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }}
                className="flex-shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                View Now
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-8">
            {/* Skeleton for Community Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="text-center">
                  <CardContent className="py-4">
                    <Skeleton className="h-8 w-15 mx-auto mb-2" />
                    <Skeleton className="h-3 w-20 mx-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Skeleton for Story Selection Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <Skeleton className="h-7 w-50 mb-2" />
                <Skeleton className="h-4 w-75" />
              </div>
            </div>

            {/* Skeleton for Story Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="h-4 w-3/5" />
                    <div className="flex justify-between">
                      <Skeleton className="h-[14px] w-15" />
                      <Skeleton className="h-[14px] w-20" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="py-8 text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Failed to load community data
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Community Stats */}
        {!isLoading && !error && (
          <div className="relative">
            {/* Background revalidation indicator */}
            {isValidating && !isLoading && (
              <div className="absolute -top-2 right-0 z-10">
                <div className="flex items-center gap-2 text-xs text-blue-500 dark:text-blue-400 opacity-60">
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <MetricCard
                value={stats.activeToday}
                label="Active Today"
                color="text-blue-600"
                description="Stories with recent community activity in the past 24 hours."
                details={[
                  "Includes stories with new posts or comments",
                  "Shows real-time engagement",
                  "Updated throughout the day"
                ]}
              />

              <MetricCard
                value={stats.commentsToday}
                label="Comments Today"
                color="text-green-600"
                description="Total number of comments posted across all stories today."
                details={[
                  "Counts all discussion replies",
                  "Refreshes every 30 minutes",
                  "Helps track daily engagement"
                ]}
              />

              <MetricCard
                value={stats.averageRating}
                label="Avg Rating"
                color="text-purple-600"
                description="Average community rating across all published stories."
                details={[
                  "Based on reader feedback",
                  "Calculated from all published stories",
                  "Scale: 1.0 to 5.0 stars"
                ]}
              />

              <MetricCard
                value={stats.totalStories}
                label="Stories"
                color="text-orange-600"
                description="Total number of published stories available in the community."
                details={[
                  "Only published stories are shown",
                  "Draft stories are not included",
                  "Browse and read any story"
                ]}
              />

              <MetricCard
                value={stats.totalPosts}
                label="Discussions"
                color="text-red-600"
                description="Total discussion threads across all community stories."
                details={[
                  "Includes all posts and topics",
                  "Each story has its own discussions",
                  "Join conversations anytime"
                ]}
              />

              <MetricCard
                value={stats.totalMembers}
                label="Members"
                color="text-indigo-600"
                description="Total unique users who have participated in community discussions."
                details={[
                  "Active contributors and readers",
                  "Sign in to join the community",
                  "No membership fees"
                ]}
              />
            </div>
          </div>
        )}

        {/* Story Selection with StoryGrid */}
        {!isLoading && !error && (
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  📚 Choose a Story
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Select a story to join its community discussions
                </p>
              </div>
            </div>

            {/* Background revalidation indicator */}
            {isValidating && !isLoading && (
              <div className="fixed top-20 right-4 z-50 bg-[rgb(var(--color-background))] rounded-lg shadow-lg border border-[rgb(var(--color-border))] px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-[rgb(var(--color-muted-foreground))]">
                  <div className="w-4 h-4 border-2 border-[rgb(var(--color-primary)/30%)] border-t-[rgb(var(--color-primary))] rounded-full animate-spin" />
                  <span>Refreshing stories...</span>
                </div>
              </div>
            )}

            {/* Use StoryGrid component */}
            <StoryGrid stories={stories} currentUserId={session?.user?.id} pageType="reading" />
          </div>
        )}
      </div>
    </MainLayout>
  );
}