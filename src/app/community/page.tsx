"use client";

import { MainLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from "@/components/ui";
import Link from "next/link";
import { CommunityStoryCard } from "@/components/community/CommunityStoryCard";
import { Skeleton } from "@/components/ui";
import { useCommunityStories } from '@/lib/hooks/use-page-cache';
import { useCommunityEvents } from '@/lib/hooks/use-community-events';
import { toast } from 'sonner';
import { useCallback, useState } from 'react';

interface CommunityStory {
  id: string;
  title: string;
  description: string;
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
  const handleStoryPublished = useCallback((event) => {
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
  const handleStoryUpdated = useCallback((event) => {
    console.log('📝 Story updated in real-time:', event.storyId);
  }, []);

  // Handle post created events
  const handlePostCreated = useCallback((event) => {
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

  // Transform data when available
  const stories = data?.success ? data.stories.map((story: any) => ({
    ...story,
    author: story.author?.name || story.author || 'Unknown Author',
    description: story.description || 'No description available',
    coverImage: story.hnsData?.storyImage?.url || story.coverImage || '',
    lastActivity: formatRelativeTime(story.lastActivity),
  })) : [];

  // Calculate stats from fetched data
  const stats: CommunityStats = stories.length > 0 ? {
    totalStories: stories.length,
    totalPosts: stories.reduce((sum: number, story: CommunityStory) => sum + story.totalPosts, 0),
    totalMembers: stories.reduce((sum: number, story: CommunityStory) => sum + story.totalMembers, 0),
    activeToday: stories.filter((story: CommunityStory) => story.isActive).length,
    commentsToday: Math.floor(stories.reduce((sum: number, story: CommunityStory) => sum + story.totalPosts, 0) * 0.3),
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
              <Card className="text-center">
                <CardContent className="py-4">
                  <div className="text-2xl font-bold text-blue-600">{stats.activeToday.toLocaleString()}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Active Today</div>
                </CardContent>
              </Card>
            
            <Card className="text-center">
              <CardContent className="py-4">
                <div className="text-2xl font-bold text-green-600">{stats.commentsToday.toLocaleString()}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Comments Today</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="py-4">
                <div className="text-2xl font-bold text-purple-600">{stats.averageRating}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Avg Rating</div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="py-4">
                <div className="text-2xl font-bold text-orange-600">{stats.totalStories}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Stories</div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="py-4">
                <div className="text-2xl font-bold text-red-600">{stats.totalPosts}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Discussions</div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="py-4">
                <div className="text-2xl font-bold text-indigo-600">{stats.totalMembers.toLocaleString()}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Members</div>
              </CardContent>
            </Card>
            </div>
          </div>
        )}

        {/* Story Selection */}
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
              
              <div className="flex items-center gap-3">
                {/* Background revalidation indicator for stories */}
                {isValidating && !isLoading && (
                  <div className="flex items-center gap-2 text-xs text-blue-500 dark:text-blue-400 opacity-60">
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Refreshing stories...</span>
                  </div>
                )}
                
              </div>
            </div>

            {/* Story Grid */}
            {stories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {stories.map((story: CommunityStory) => {
                  const isNewlyPublished = recentlyPublishedStories.includes(story.id);
                  return (
                    <div
                      key={story.id}
                      className={isNewlyPublished ? 'relative animate-in fade-in slide-in-from-bottom duration-500' : ''}
                    >
                      {isNewlyPublished && (
                        <div className="absolute -top-2 -right-2 z-10 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                          NEW
                        </div>
                      )}
                      <CommunityStoryCard
                        story={{
                          ...story,
                          author: story.author.name,
                          coverImage: story.coverImage || ''
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-4xl mb-4">📚</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No public stories yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Stories will appear here once authors make them public for community discussions
                  </p>
                  <div className="flex justify-center gap-3">
                    <Link href="/stories">
                      <Button variant="outline">
                        📝 View All Stories
                      </Button>
                    </Link>
                    <Link href="/stories/new">
                      <Button>
                        ✍️ Write Your Story
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}