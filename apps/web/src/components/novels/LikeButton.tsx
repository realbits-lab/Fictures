"use client";

import React, { useState, useTransition } from "react";
import { trackCommunity, trackReading } from "@/lib/analysis/google-analytics";
import { cn } from "@/lib/utils/cn";

interface LikeButtonProps {
    entityId: string;
    entityType: "story" | "chapter" | "scene" | "comment";
    initialLiked?: boolean;
    initialCount?: number;
    onLikeToggle?: (liked: boolean, count: number) => void;
    className?: string;
}

export function LikeButton({
    entityId,
    entityType,
    initialLiked = false,
    initialCount = 0,
    onLikeToggle,
    className,
}: LikeButtonProps) {
    const [liked, setLiked] = useState(initialLiked);
    const [likeCount, setLikeCount] = useState(initialCount);
    const [isPending, startTransition] = useTransition();

    const handleLike = async () => {
        startTransition(async () => {
            try {
                let endpoint = "";

                switch (entityType) {
                    case "story":
                        endpoint = `/studio/api/stories/${entityId}/like`;
                        break;
                    case "chapter":
                        endpoint = `/studio/api/chapters/${entityId}/like`;
                        break;
                    case "scene":
                        endpoint = `/studio/api/scenes/${entityId}/like`;
                        break;
                    case "comment":
                        endpoint = `/api/comments/${entityId}/like`;
                        break;
                }

                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to toggle like");
                }

                const data = await response.json();

                setLiked(data.liked);

                if (entityType === "comment" && data.likeCount !== undefined) {
                    setLikeCount(data.likeCount);
                }

                // Track like action
                if (data.liked) {
                    if (entityType === "story") {
                        trackReading.bookmark(entityId);
                    } else if (entityType === "comment") {
                        trackCommunity.like(entityId);
                    }
                }

                onLikeToggle?.(
                    data.liked,
                    entityType === "comment" ? data.likeCount : likeCount,
                );
            } catch (error) {
                console.error("Error toggling like:", error);
            }
        });
    };

    return (
        <button
            onClick={handleLike}
            disabled={isPending}
            className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                liked
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
                isPending && "opacity-50 cursor-not-allowed",
                className,
            )}
        >
            <svg
                className={cn(
                    "w-4 h-4 transition-transform",
                    liked && "scale-110",
                )}
                fill={liked ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>
            {entityType === "comment" && likeCount > 0 && (
                <span className="tabular-nums">{likeCount}</span>
            )}
            <span className="sr-only">{liked ? "Unlike" : "Like"}</span>
        </button>
    );
}
