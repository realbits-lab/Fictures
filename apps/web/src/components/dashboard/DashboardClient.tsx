"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { StoryGrid } from "@/components/browse/StoryGrid";
import {
    BackgroundValidationIndicator,
    StoryGridSkeleton,
    StoryLoadingError,
} from "@/components/common";
import { SkeletonLoader } from "@/components/ui";
import { useUserStories } from "@/lib/hooks/use-page-cache";

export function DashboardClient() {
    const [_view, _setView] = useState<"card" | "table">("card");
    const { data: session } = useSession();
    const {
        data,
        isLoading,
        isValidating,
        error,
        mutate: refreshStories,
    } = useUserStories();

    // Transform data to match StoryGrid expected format
    const stories = (Array.isArray(data) ? data : (data as any)?.stories || []).map((story: any) => ({
        id: story.id,
        title: story.title,
        summary: story.summary || "", // Story summary from database
        genre: story.genre || "General",
        status: story.status,
        isPublic: story.isPublic || false,
        viewCount: story.readers || 0,
        rating: story.rating || 0,
        createdAt: new Date(),
        imageUrl: story.imageUrl || "",
        imageVariants: story.imageVariants,
        author: {
            id: session?.user?.id || "",
            name: session?.user?.name || "You",
        },
    }));

    // Show loading state
    if (!session?.user?.id) {
        return <div>Please sign in to view your dashboard.</div>;
    }

    // Show skeleton loading while fetching
    if (isLoading) {
        return (
            <SkeletonLoader>
                <StoryGridSkeleton showFilters={false} cardCount={6} />
            </SkeletonLoader>
        );
    }

    // Show error state
    if (error) {
        return (
            <StoryLoadingError
                title="Failed to load your stories"
                message={error.message}
                onRetry={refreshStories}
                isRetrying={isValidating}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[rgb(var(--color-background))]">
            <div className="container mx-auto px-4 pt-1 pb-8">
                {/* Background validation indicator in top right */}
                {isValidating && !isLoading && (
                    <BackgroundValidationIndicator text="Refreshing stories..." />
                )}

                {/* Use StoryGrid component with studio pageType */}
                <StoryGrid
                    stories={stories}
                    currentUserId={session?.user?.id}
                    pageType="studio"
                />
            </div>
        </div>
    );
}
