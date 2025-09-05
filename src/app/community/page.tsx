"use client";

import { useState, useEffect } from 'react';
import { MainLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from "@/components/ui";
import Link from "next/link";
import { CommunityStoryCard } from "@/components/community/CommunityStoryCard";

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
  const [stories, setStories] = useState<CommunityStory[]>([]);
  const [stats, setStats] = useState<CommunityStats>({
    activeToday: 0,
    commentsToday: 0,
    averageRating: 0,
    totalStories: 0,
    totalPosts: 0,
    totalMembers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch public stories
        const response = await fetch('/api/community/stories');
        if (!response.ok) {
          throw new Error('Failed to fetch community stories');
        }
        
        const data = await response.json();
        
        if (data.success) {
          const storiesData = data.stories.map((story: any) => ({
            ...story,
            // Keep author as object structure for CommunityStoryCard
            author: story.author?.name || story.author || 'Unknown Author',
            description: story.description || 'No description available',
            coverImage: story.coverImage || "/api/placeholder/200/300",
            lastActivity: formatRelativeTime(story.lastActivity),
          }));
          
          setStories(storiesData);
          
          // Calculate stats from fetched data
          const calculatedStats: CommunityStats = {
            totalStories: storiesData.length,
            totalPosts: storiesData.reduce((sum: number, story: CommunityStory) => sum + story.totalPosts, 0),
            totalMembers: storiesData.reduce((sum: number, story: CommunityStory) => sum + story.totalMembers, 0),
            activeToday: storiesData.filter((story: CommunityStory) => story.isActive).length,
            commentsToday: Math.floor(storiesData.reduce((sum: number, story: CommunityStory) => sum + story.totalPosts, 0) * 0.3), // Estimate
            averageRating: 4.7, // Default for now
          };
          
          setStats(calculatedStats);
        } else {
          throw new Error(data.error || 'Failed to fetch stories');
        }
      } catch (err) {
        console.error('Error fetching community data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // Fallback to empty state
        setStories([]);
        setStats({
          activeToday: 0,
          commentsToday: 0,
          averageRating: 0,
          totalStories: 0,
          totalPosts: 0,
          totalMembers: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunityData();
  }, []);

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
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
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading community data...</p>
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
        )}

        {/* Story Selection */}
        {!isLoading && !error && (
          <div>
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
                {stats.activeToday > 0 && (
                  <Badge variant="success" className="animate-pulse">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Live Discussions
                  </Badge>
                )}
              </div>
            </div>

            {/* Story Grid */}
            {stories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {stories.map((story) => (
                  <CommunityStoryCard key={story.id} story={story} />
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