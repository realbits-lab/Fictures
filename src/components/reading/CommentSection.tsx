'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';

interface Comment {
  id: string;
  content: string;
  userId: string;
  userName: string | null;
  userImage: string | null;
  parentCommentId: string | null;
  depth: number;
  likeCount: number;
  replyCount: number;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  replies?: Comment[];
}

interface CommentSectionProps {
  storyId: string;
  chapterId?: string;
  sceneId?: string;
  currentUserId?: string;
  className?: string;
}

export function CommentSection({
  storyId,
  chapterId,
  sceneId,
  currentUserId,
  className,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError('');

      let url = `/api/stories/${storyId}/comments`;
      const params = new URLSearchParams();

      if (sceneId) {
        params.append('sceneId', sceneId);
      } else if (chapterId) {
        params.append('chapterId', chapterId);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [storyId, chapterId, sceneId]);

  const handleCommentAdded = (newComment: Comment) => {
    if (newComment.parentCommentId) {
      setComments((prev) => {
        const updatedComments = [...prev];
        const parentIndex = updatedComments.findIndex(
          (c) => c.id === newComment.parentCommentId
        );

        if (parentIndex !== -1) {
          if (!updatedComments[parentIndex].replies) {
            updatedComments[parentIndex].replies = [];
          }
          updatedComments[parentIndex].replies!.push(newComment);
          updatedComments[parentIndex].replyCount += 1;
        }

        return updatedComments;
      });
    } else {
      setComments((prev) => [newComment, ...prev]);
    }
  };

  const handleCommentUpdated = (updatedComment: Comment) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === updatedComment.id ? { ...comment, ...updatedComment } : comment
      )
    );
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, content: '[deleted]', isDeleted: true }
          : comment
      )
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h2>
      </div>

      {currentUserId && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <CommentForm
            storyId={storyId}
            chapterId={chapterId}
            sceneId={sceneId}
            onSuccess={handleCommentAdded}
          />
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && comments.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            No comments yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Be the first to share your thoughts!
          </p>
        </div>
      )}

      {!loading && !error && comments.length > 0 && (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <CommentItem
                comment={comment}
                storyId={storyId}
                chapterId={chapterId}
                sceneId={sceneId}
                currentUserId={currentUserId}
                onCommentAdded={handleCommentAdded}
                onCommentUpdated={handleCommentUpdated}
                onCommentDeleted={handleCommentDeleted}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
