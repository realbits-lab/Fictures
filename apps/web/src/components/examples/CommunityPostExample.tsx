"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui";
import {
    useProtectedAction,
    useRoleProtectedAction,
} from "@/hooks/useProtectedAction";

interface CommunityPostExampleProps {
    postId: string;
    title: string;
    content: string;
    author: string;
    likes: number;
    comments: number;
}

/**
 * Example component demonstrating authentication patterns for community features
 *
 * Key patterns:
 * 1. Anonymous users can view content freely
 * 2. Authentication required for interactions (like, comment, share)
 * 3. Role-based actions (only writers can create posts)
 * 4. Different UI states based on auth status
 */
export function CommunityPostExample({
    postId,
    title,
    content,
    author,
    likes: initialLikes,
    comments,
}: CommunityPostExampleProps) {
    const { data: session } = useSession();
    const [likes, setLikes] = useState(initialLikes);
    const [isLiked, setIsLiked] = useState(false);

    // Protected actions - these will show login modal if user is not authenticated
    const { executeAction: handleLike, requiresAuth: likeRequiresAuth } =
        useProtectedAction(() => {
            // Simulate API call
            console.log(`Liking post ${postId}`);
            setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
            setIsLiked(!isLiked);
        });

    const { executeAction: handleComment, requiresAuth: commentRequiresAuth } =
        useProtectedAction(() => {
            // This would navigate to the comment form or open a modal
            console.log(`Opening comment form for post ${postId}`);
        });

    const { executeAction: handleShare } = useProtectedAction(() => {
        // This would open a share modal
        console.log(`Opening share dialog for post ${postId}`);
    });

    // Role-based protected action - only writers and managers can create posts
    const { executeAction: handleCreatePost, isAuthorized: canCreatePost } =
        useRoleProtectedAction(
            () => {
                console.log("Creating new post");
            },
            ["writer", "manager"],
            "/write/new",
        );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4">
            {/* Post content - visible to everyone */}
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                    {content}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    by {author}
                </p>
            </div>

            {/* Interaction buttons */}
            <div className="flex items-center space-x-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                {/* Like button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    className={`flex items-center space-x-2 ${isLiked ? "text-red-500" : ""}`}
                    title={likeRequiresAuth ? "Sign in to like this post" : ""}
                >
                    <span>{isLiked ? "❤️" : "🤍"}</span>
                    <span>{likes}</span>
                    {likeRequiresAuth && (
                        <span className="text-xs">(sign in)</span>
                    )}
                </Button>

                {/* Comment button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleComment}
                    className="flex items-center space-x-2"
                    title={commentRequiresAuth ? "Sign in to comment" : ""}
                >
                    <span>💬</span>
                    <span>{comments}</span>
                    {commentRequiresAuth && (
                        <span className="text-xs">(sign in)</span>
                    )}
                </Button>

                {/* Share button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="flex items-center space-x-2"
                >
                    <span>🔗</span>
                    <span>Share</span>
                    {!session && <span className="text-xs">(sign in)</span>}
                </Button>

                {/* Create post button - only for writers/managers */}
                {canCreatePost && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCreatePost}
                        className="ml-auto"
                    >
                        ✍️ Create Post
                    </Button>
                )}
            </div>

            {/* Auth status indicator (for demo purposes) */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                <strong>Demo Info:</strong>{" "}
                {session ? (
                    <span className="text-green-600 dark:text-green-400">
                        Signed in as {session.user?.name} (
                        {session.user?.role || "reader"})
                    </span>
                ) : (
                    <span className="text-orange-600 dark:text-orange-400">
                        Not signed in - can browse but interactions require
                        authentication
                    </span>
                )}
            </div>
        </div>
    );
}

// Example usage in a community page:
/*
export function CommunityPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Community Posts</h1>
      
      <CommunityPostExample
        postId="1"
        title="Welcome to the Community!"
        content="This is an example post showing how authentication works. Anyone can read this, but you need to sign in to interact."
        author="Community Manager"
        likes={42}
        comments={15}
      />
      
      <CommunityPostExample
        postId="2"
        title="Writing Tips for Beginners"
        content="Here are some great tips for new writers just getting started..."
        author="Professional Writer"
        likes={128}
        comments={34}
      />
    </div>
  );
}
*/
