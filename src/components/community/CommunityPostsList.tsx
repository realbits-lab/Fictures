"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import { toast } from 'sonner';

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
  type: string;
  likes: number;
  replies: number;
  views: number;
  isPinned: boolean;
  createdAt: string;
  lastActivity: string;
}

interface CommunityPostsListProps {
  posts: Post[];
  onPostDeleted?: () => void;
}

const getPostTypeConfig = (type: string) => {
  switch (type) {
    case 'theory':
      return { icon: '🤔', label: 'Theory', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' };
    case 'discussion':
      return { icon: '💭', label: 'Discussion', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' };
    case 'fan-content':
      return { icon: '🎨', label: 'Fan Content', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' };
    case 'question':
      return { icon: '❓', label: 'Question', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' };
    case 'review':
      return { icon: '⭐', label: 'Review', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' };
    default:
      return { icon: '💬', label: 'Post', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' };
  }
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 48) return '1 day ago';
  return `${Math.floor(diffInHours / 24)} days ago`;
};

function CommunityPost({ post, onDelete }: { post: Post; onDelete?: () => void }) {
  const { data: session } = useSession();
  const [likes, setLikes] = useState(post.likes);
  const [isLiked, setIsLiked] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const typeConfig = getPostTypeConfig(post.type);
  const isAuthor = session?.user?.id === post.author.id;

  const { executeAction: handleLike, requiresAuth: likeRequiresAuth } = useProtectedAction(() => {
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
    setIsLiked(!isLiked);
  });

  const { executeAction: handleReply, requiresAuth: replyRequiresAuth } = useProtectedAction(() => {
    setShowReplies(true);
  });

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/community/posts/${post.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete post');
      }

      toast.success('Post deleted successfully');
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete post. Please try again.'
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Card className={`${post.isPinned ? 'border-yellow-300 dark:border-yellow-600' : ''}`}>
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            {/* Author Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {post.author.name[0].toUpperCase()}
            </div>
            
            {/* Author Info & Type */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {post.author.name}
                </span>
                <Badge className={`${typeConfig.color} text-xs`}>
                  {typeConfig.icon} {typeConfig.label}
                </Badge>
                {post.isPinned && (
                  <Badge variant="warning" className="text-xs">
                    📌 Pinned
                  </Badge>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatRelativeTime(post.createdAt)}
                {post.lastActivity !== post.createdAt && (
                  <span> • Last activity {formatRelativeTime(post.lastActivity)}</span>
                )}
              </div>
            </div>
          </div>

          {/* View Count */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            👁️ {post.views}
          </div>
        </div>

        {/* Post Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 leading-tight">
          {post.title}
        </h3>

        {/* Post Content */}
        <div className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
          {post.content}
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-6">
            {/* Like Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
              title={likeRequiresAuth ? 'Sign in to like' : ''}
            >
              <span>{isLiked ? '❤️' : '🤍'}</span>
              <span>{likes}</span>
              {likeRequiresAuth && <span className="text-xs">(sign in)</span>}
            </Button>

            {/* Reply Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReply}
              className="flex items-center gap-2 text-gray-500 hover:text-blue-500"
              title={replyRequiresAuth ? 'Sign in to reply' : ''}
            >
              <span>💬</span>
              <span>{post.replies}</span>
              {replyRequiresAuth && <span className="text-xs">(sign in)</span>}
            </Button>

            {/* Share Button */}
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-gray-500 hover:text-green-500"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href + '#post-' + post.id);
                alert('Link copied to clipboard!');
              }}
            >
              <span>🔗</span>
              <span>Share</span>
            </Button>
          </div>

          {/* Report/More Actions */}
          <div className="flex items-center gap-2">
            {isAuthor && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Are you sure?
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? '⏳ Deleting...' : '✓ Yes, Delete'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-400 hover:text-gray-600"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                    >
                      ✗ Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={handleDelete}
                  >
                    🗑️ Delete
                  </Button>
                )}
              </>
            )}
            {session && !isAuthor && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-400 hover:text-gray-600"
                onClick={() => toast.info('Reporting functionality would be here')}
              >
                ⚠️ Report
              </Button>
            )}
          </div>
        </div>

        {/* Reply Section Preview */}
        {post.replies > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplies(!showReplies)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showReplies ? '👆 Hide replies' : `👇 View all ${post.replies} replies`}
            </Button>
            
            {showReplies && (
              <div className="mt-3 ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 italic">
                  Replies would be loaded here...
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CommunityPostsList({ posts, onPostDeleted }: CommunityPostsListProps) {
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'replies'>('recent');

  const sortedPosts = [...posts].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.likes + b.views) - (a.likes + a.views);
      case 'replies':
        return b.replies - a.replies;
      case 'recent':
      default:
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    }
  });

  // Move pinned posts to top
  const pinnedPosts = sortedPosts.filter(post => post.isPinned);
  const regularPosts = sortedPosts.filter(post => !post.isPinned);
  const finalPosts = [...pinnedPosts, ...regularPosts];

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[
            { key: 'recent', label: '🕒 Recent', desc: 'Latest activity' },
            { key: 'popular', label: '🔥 Popular', desc: 'Most likes & views' },
            { key: 'replies', label: '💬 Most Discussed', desc: 'Most replies' },
          ].map((option) => (
            <Button
              key={option.key}
              variant={sortBy === option.key ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSortBy(option.key as typeof sortBy)}
              title={option.desc}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          {finalPosts.length}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {finalPosts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No discussions yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Be the first to start a conversation about this story!
              </p>
            </CardContent>
          </Card>
        ) : (
          finalPosts.map((post) => (
            <CommunityPost key={post.id} post={post} onDelete={onPostDeleted} />
          ))
        )}
      </div>
    </div>
  );
}