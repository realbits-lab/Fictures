"use client";

import { type Comment, useComments } from "@/lib/hooks/use-comments";
import { cn } from "@/lib/utils/cn";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";

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
    // Use optimized comments hook with 3-layer caching
    const {
        comments,
        isLoading: loading,
        error,
        invalidate,
        addOptimisticComment,
        removeOptimisticComment,
        updateOptimisticComment,
    } = useComments({
        storyId,
        chapterId,
        sceneId,
    });

    const handleCommentAdded = async (newComment: Comment) => {
        // Optimistically update UI
        addOptimisticComment(newComment);

        // Invalidate cache to refetch fresh data from server
        await invalidate();
    };

    const handleCommentUpdated = async (updatedComment: Comment) => {
        // Optimistically update UI
        updateOptimisticComment(updatedComment.id, updatedComment);

        // Invalidate cache to refetch fresh data from server
        await invalidate();
    };

    const handleCommentDeleted = async (commentId: string) => {
        // Optimistically update UI
        removeOptimisticComment(commentId);

        // Invalidate cache to refetch fresh data from server
        await invalidate();
    };

    return (
        <div className={cn("space-y-6", className)}>
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
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {error instanceof Error
                            ? error.message
                            : "Failed to load comments"}
                    </p>
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
