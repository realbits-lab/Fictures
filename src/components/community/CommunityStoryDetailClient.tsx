/**
 * Community Story Detail Client Component
 *
 * Handles client-side interactivity for story detail page:
 * - Create/delete posts
 * - Real-time post updates
 * - Authentication checks
 * - SWR data revalidation
 */

'use client';

import { useState } from 'react';
// import { useSession } from "next/auth/react";
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { CommunityStorySidebar } from '@/components/community/CommunityStorySidebar';
import { CommunityPostsList } from '@/components/community/CommunityPostsList';
import { CreatePostForm } from '@/components/community/CreatePostForm';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import { useCommunityStory, useCommunityPosts, useRevalidateCommunityPosts } from '@/lib/hooks/use-community-cache';

interface Character {
  id: string;
  name: string;
  summary: string | null;
  isMain: boolean | null;
  coreTrait: string | null;
  internalFlaw: string | null;
  externalGoal: string | null;
  personality: unknown;
  backstory: unknown;
  relationships: unknown;
  physicalDescription: unknown;
  voiceStyle: string | null;
  imageUrl: string | null;
  visualStyle: string | null;
}

interface Setting {
  id: string;
  name: string;
  summary: string | null;
  mood: string | null;
  sensory: Record<string, string[]> | null;
  visualStyle: string | null;
  architecturalStyle: string | null;
  colorPalette: string[] | null;
  imageUrl: string | null;
}

interface StoryData {
  id: string;
  title: string;
  summary: string;
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
  characters: Character[];
  settings: Setting[];
}

interface Post {
  id: string;
  title: string;
  content: string;
  storyId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
  viewCount: number | null;
  likeCount: number | null;
  replyCount: number | null;
}

interface CommunityStoryDetailClientProps {
  initialStory: StoryData;
  initialPosts: Post[];
  storyId: string;
}

export function CommunityStoryDetailClient({
  initialStory,
  initialPosts,
  storyId
}: CommunityStoryDetailClientProps) {
  // const { data: session } = useSession();
  const session = null; // Temporary - TODO: Fix useSession import issue
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Use SWR with SSR fallback data
  const { data: storyData } = useCommunityStory(storyId);
  const { data: postsData } = useCommunityPosts(storyId);

  const revalidatePosts = useRevalidateCommunityPosts(storyId);

  const { executeAction: handleCreatePost } = useProtectedAction(() => {
    setShowCreateForm(true);
  });

  const handlePostCreated = async () => {
    setShowCreateForm(false);
    await revalidatePosts();
  };

  const handlePostDeleted = async () => {
    await revalidatePosts();
  };

  // Use SSR data as fallback
  const story = storyData?.story || initialStory;
  const posts = postsData?.posts || initialPosts;

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-80 flex-shrink-0">
        <CommunityStorySidebar
          currentStoryId={storyId}
          characters={story.characters}
          settings={story.settings}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 space-y-6">
        {/* Story Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                📖 {story.title}
              </h1>
              <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">
                {story.genre} • by {story.author.name}
              </p>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {story.summary}
              </p>
            </div>
            <Badge variant="default" className="ml-4">
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
            <Badge variant="secondary">
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
        <CommunityPostsList posts={posts} onPostDeleted={handlePostDeleted} />

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
  );
}
