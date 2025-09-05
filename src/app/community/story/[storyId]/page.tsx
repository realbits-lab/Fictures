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

// Mock data - replace with real API calls
const getStoryData = (storyId: string) => ({
  id: storyId,
  title: storyId === 'yWzfrPc85xT0SfF3rzxjU' ? 'Digital Nexus: The Code Between Worlds' : 'The Last Guardian',
  genre: storyId === 'yWzfrPc85xT0SfF3rzxjU' ? 'Science Fiction/Fantasy' : 'Epic Fantasy',
  author: 'Thomas Jeon',
  description: storyId === 'yWzfrPc85xT0SfF3rzxjU' ? 
    'A gripping tale of virtual reality, shadow magic, and the thin line between code and reality.' :
    'An epic journey through mystical realms where ancient guardians protect the balance of magic.',
  status: 'published',
  totalPosts: 89,
  totalMembers: 1247,
  totalViews: 45892,
  averageRating: 4.7,
});

const getMockPosts = (storyId: string) => [
  {
    id: '1',
    title: '🤔 Theory: Maya\'s Shadow Powers Connection to the Digital Realm',
    content: 'I\'ve been analyzing the latest chapters and I think Maya\'s shadow powers aren\'t just magic - they\'re somehow connected to the digital simulation. Notice how her abilities glitch when she\'s stressed? What if the shadow realm is actually a deeper layer of the simulation?',
    author: {
      id: 'user1',
      name: 'TheoryMaster',
      avatar: null,
    },
    type: 'theory',
    likes: 47,
    replies: 23,
    views: 156,
    isPinned: true,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
  },
  {
    id: '2', 
    title: '💭 Discussion: What do you think will happen to Elena?',
    content: 'After Chapter 15, I\'m really worried about Elena. She seemed to know something about Maya\'s power limits. Do you think she\'ll survive the shadow realm transformation? I have a feeling she might become the key to understanding the connection between both worlds.',
    author: {
      id: 'user2',
      name: 'ShadowFan2024',
      avatar: null,
    },
    type: 'discussion',
    likes: 32,
    replies: 18,
    views: 203,
    isPinned: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: '3',
    title: '🎨 Fan Art: Maya vs The Void Collector',
    content: 'I drew Maya facing off against the Void Collector from Chapter 14! I imagined her shadow powers manifesting as code streams. Hope you like it! The way the author describes the battle scenes is so cinematic.',
    author: {
      id: 'user3', 
      name: 'ArtistPro',
      avatar: null,
    },
    type: 'fan-content',
    likes: 89,
    replies: 12,
    views: 341,
    isPinned: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    lastActivity: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
  },
];

export default function StoryCommunityPage() {
  const params = useParams();
  const { data: session } = useSession();
  const storyId = params.storyId as string;
  const [showCreateForm, setShowCreateForm] = useState(false);

  const story = getStoryData(storyId);
  const posts = getMockPosts(storyId);

  const { executeAction: handleCreatePost } = useProtectedAction(() => {
    setShowCreateForm(true);
  });

  const handlePostCreated = () => {
    setShowCreateForm(false);
    // Refresh posts list
  };

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
                  {story.genre} • by {story.author}
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
                <div className="text-xl font-bold text-green-600">{story.totalPosts}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Posts</div>
              </div>
              <div className="text-center bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="text-xl font-bold text-purple-600">{story.totalMembers.toLocaleString()}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Members</div>
              </div>
              <div className="text-center bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="text-xl font-bold text-blue-600">{story.totalViews.toLocaleString()}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Views</div>
              </div>
              <div className="text-center bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="text-xl font-bold text-yellow-600">{story.averageRating}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Rating</div>
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
          <CommunityPostsList posts={posts} />

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