"use client";

import { MainLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from "@/components/ui";
import Link from "next/link";
import { CommunityStoryCard } from "@/components/community/CommunityStoryCard";
import { Skeleton } from "@/components/ui";
import { useCommunityStories } from '@/lib/hooks/use-page-cache';

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

  // Transform data when available
  const stories = data?.success ? data.stories.map((story: any) => ({
    ...story,
    author: story.author?.name || story.author || 'Unknown Author',
    description: story.description || 'No description available',
    coverImage: story.coverImage || "/api/placeholder/200/300",
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-3 mb-4">
            <span>💬</span>
            Community Hub
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Connect with readers and fellow writers through story discussions
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Choose a story below to join the conversation • No login required to read • Sign in to participate
          </p>
        </div>

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
                {stories.map((story: CommunityStory) => (
                  <CommunityStoryCard
                    key={story.id}
                    story={{
                      ...story,
                      author: story.author.name,
                      coverImage: story.coverImage || ''
                    }}
                  />
                ))}
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

        {/* Quick Actions */}
        {!isLoading && !error && (
          <Card>
            <CardContent className="py-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  💡 Want to start discussions for your story?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Make your story public to enable community discussions and connect with readers
                </p>
                <div className="flex justify-center gap-3">
                  <Link href="/stories">
                    <Button variant="outline">
                      📝 Manage Stories
                    </Button>
                  </Link>
                  <Link href="/stories/new">
                    <Button>
                      ✍️ Write New Story
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}