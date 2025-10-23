"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { CommunityStorySidebar } from '@/components/community/CommunityStorySidebar';
import { CommunityPostsList } from '@/components/community/CommunityPostsList';
import { CreatePostForm } from '@/components/community/CreatePostForm';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import Link from 'next/link';
import { toast } from 'sonner';

interface StoryData {
  id: string;
  title: string;
  description: string;
  genre: string;
  status: string;
  author: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
  stats: {
    totalPosts: number;
    totalMembers: number;
    totalViews: number;
    averageRating: number;
    ratingCount: number;
  };
}

export default function StoryCommunityPage() {
  const params = useParams();
  const { data: session } = useSession();
  const storyId = params.storyId as string;
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [story, setStory] = useState<StoryData | null>(null);
  const [isLoadingStory, setIsLoadingStory] = useState(true);

  const { executeAction: handleCreatePost } = useProtectedAction(() => {
    setShowCreateForm(true);
  });

  const fetchStory = async () => {
    try {
      setIsLoadingStory(true);
      const response = await fetch(`/api/community/stories/${storyId}`);
      const data = await response.json();

      if (data.success) {
        setStory(data.story);
      } else {
        toast.error('Failed to load story data');
      }
    } catch (error) {
      console.error('Error fetching story:', error);
      toast.error('Failed to load story data');
    } finally {
      setIsLoadingStory(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/community/stories/${storyId}/posts`);
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts);
      } else {
        toast.error('Failed to load posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStory();
    fetchPosts();
  }, [storyId]);

  const handlePostCreated = () => {
    setShowCreateForm(false);
    fetchPosts();
    fetchStory(); // Refresh story stats to update post count
  };

  if (isLoadingStory || !story) {
    return (
      <MainLayout>
        <div className="flex gap-6">
          <aside className="w-80 flex-shrink-0">
            <CommunityStorySidebar currentStoryId={storyId} />
          </aside>
          <main className="flex-1 space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            </div>
          </main>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0">
          <CommunityStorySidebar currentStoryId={storyId} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-6">
          {/* Story Header */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Link href="/community" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    ← Back to Community Hub
                  </Link>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  📖 {story.title}
                </h1>
                <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">
                  {story.genre} • by {story.author.name}
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {story.description}
                </p>
              </div>
              <Badge variant="success" className="ml-4">
                🚀 {story.status}
              </Badge>
            </div>

            {/* Community Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="text-xl font-bold text-green-600">{story.stats.totalPosts}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Posts</div>
              </div>
              <div className="text-center bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="text-xl font-bold text-purple-600">{story.stats.totalMembers.toLocaleString()}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Members</div>
              </div>
              <div className="text-center bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="text-xl font-bold text-blue-600">{story.stats.totalViews.toLocaleString()}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Views</div>
              </div>
              <div className="text-center bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="text-xl font-bold text-yellow-600">
                  {story.stats.averageRating > 0 ? story.stats.averageRating.toFixed(1) : 'N/A'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Rating {story.stats.ratingCount > 0 && `(${story.stats.ratingCount})`}
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                💬 Community Discussions
              </h2>
              <Badge variant="info">
                {posts.length} posts
              </Badge>
            </div>

            <Button
              onClick={handleCreatePost}
              className="flex items-center gap-2"
            >
              <span>✍️</span>
              {session ? 'Create Post' : 'Sign in to Post'}
            </Button>
          </div>

          {/* Create Post Form */}
          {showCreateForm && (
            <CreatePostForm
              storyId={storyId}
              onPostCreated={handlePostCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          {/* Posts List */}
          <CommunityPostsList posts={posts} onPostDeleted={fetchPosts} />

          {/* Anonymous User CTA */}
          {!session && (
            <Card className="border-dashed border-2 border-blue-200 dark:border-blue-800">
              <CardContent className="py-8 text-center">
                <div className="text-4xl mb-4">👋</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Join the conversation!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Sign in to create posts, reply to discussions, and connect with other readers
                </p>
                <Button onClick={() => handleCreatePost()}>
                  🚀 Sign In to Participate
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </MainLayout>
  );
}