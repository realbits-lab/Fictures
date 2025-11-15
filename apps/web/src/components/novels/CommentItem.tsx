"use client";

import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils/cn";
import { CommentForm } from "./CommentForm";
import { LikeDislikeButton } from "./LikeDislikeButton";

interface Comment {
    id: string;
    content: string;
    userId: string;
    userName: string | null;
    userImage: string | null;
    storyId: string;
    chapterId: string | null;
    sceneId: string | null;
    parentCommentId: string | null;
    depth: number;
    likeCount: number;
    dislikeCount: number;
    replyCount: number;
    isEdited: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    replies?: Comment[];
}

interface CommentItemProps {
    comment: Comment;
    storyId: string;
    chapterId?: string;
    sceneId?: string;
    currentUserId?: string;
    onCommentAdded?: (comment: Comment) => void;
    onCommentUpdated?: (comment: Comment) => void;
    onCommentDeleted?: (commentId: string) => void;
    className?: string;
}

export function CommentItem({
    comment,
    storyId,
    chapterId,
    sceneId,
    currentUserId,
    onCommentAdded,
    onCommentUpdated,
    onCommentDeleted,
    className,
}: CommentItemProps) {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [isPending, startTransition] = useTransition();

    const isOwner = currentUserId === comment.userId;
    const canReply = comment.depth < 3;

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this comment?")) {
            return;
        }

        startTransition(async () => {
            try {
                const response = await fetch(`/api/comments/${comment.id}`, {
                    method: "DELETE",
                });

                if (!response.ok) {
                    throw new Error("Failed to delete comment");
                }

                onCommentDeleted?.(comment.id);
            } catch (error) {
                console.error("Error deleting comment:", error);
                alert("Failed to delete comment");
            }
        });
    };

    const handleReplySuccess = (newComment: Comment) => {
        setShowReplyForm(false);
        onCommentAdded?.(newComment);
    };

    const handleEditSuccess = (updatedComment: Comment) => {
        setShowEditForm(false);
        onCommentUpdated?.(updatedComment);
    };

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex gap-3">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                    {comment.userImage ? (
                        <Image
                            src={comment.userImage}
                            alt={comment.userName || "User"}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                            {comment.userName?.[0]?.toUpperCase() || "U"}
                        </div>
                    )}
                </div>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {comment.userName || "Anonymous"}
                        </span>
                        <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.createdAt), {
                                addSuffix: true,
                            })}
                        </span>
                        {comment.isEdited && (
                            <span className="text-xs text-gray-500 italic">
                                (edited)
                            </span>
                        )}
                    </div>

                    {showEditForm ? (
                        <CommentForm
                            storyId={storyId}
                            chapterId={chapterId}
                            sceneId={sceneId}
                            initialContent={comment.content}
                            mode="edit"
                            onSuccess={handleEditSuccess}
                            onCancel={() => setShowEditForm(false)}
                        />
                    ) : (
                        <>
                            <p
                                className={cn(
                                    "text-sm whitespace-pre-wrap break-words",
                                    comment.isDeleted
                                        ? "text-gray-500 dark:text-gray-500 italic"
                                        : "text-gray-700 dark:text-gray-300",
                                )}
                            >
                                {comment.content}
                            </p>

                            {/* Actions - hide for deleted comments */}
                            {!comment.isDeleted && (
                                <div className="flex items-center gap-2 mt-2">
                                    <LikeDislikeButton
                                        entityId={comment.id}
                                        entityType="comment"
                                        initialLikeCount={comment.likeCount}
                                        initialDislikeCount={
                                            comment.dislikeCount
                                        }
                                        size="sm"
                                    />

                                    {canReply && (
                                        <button
                                            onClick={() =>
                                                setShowReplyForm(!showReplyForm)
                                            }
                                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium"
                                        >
                                            Reply{" "}
                                            {comment.replyCount > 0 &&
                                                `(${comment.replyCount})`}
                                        </button>
                                    )}

                                    {isOwner && (
                                        <>
                                            <button
                                                onClick={() =>
                                                    setShowEditForm(true)
                                                }
                                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                onClick={handleDelete}
                                                disabled={isPending}
                                                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium disabled:opacity-50"
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* Reply Form */}
                    {showReplyForm && (
                        <div className="mt-3">
                            <CommentForm
                                storyId={storyId}
                                chapterId={chapterId}
                                sceneId={sceneId}
                                parentCommentId={comment.id}
                                mode="reply"
                                onSuccess={handleReplySuccess}
                                onCancel={() => setShowReplyForm(false)}
                            />
                        </div>
                    )}

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                            {comment.replies.map((reply) => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    storyId={storyId}
                                    chapterId={chapterId}
                                    sceneId={sceneId}
                                    currentUserId={currentUserId}
                                    onCommentAdded={onCommentAdded}
                                    onCommentUpdated={onCommentUpdated}
                                    onCommentDeleted={onCommentDeleted}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
