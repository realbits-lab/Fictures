"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

export function CreateNewStoryButton() {
    const router = useRouter();
    const { data: session } = useSession();
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateNewStory = async () => {
        if (!session?.user?.id) {
            router.push("/login");
            return;
        }

        setIsCreating(true);
        try {
            // Create empty story
            const requestBody: {
                userId: string;
                title: string;
            } = {
                userId: session.user.id,
                title: "Untitled Story",
            };

            const response = await fetch("/studio/api/stories/create-empty", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error("Failed to create story");
            }

            const data = await response.json();

            // Navigate to agent chat page with the new story
            router.push(`/studio/agent/new?storyId=${data.storyId}`);
        } catch (error) {
            console.error("Error creating story:", error);
            alert("Failed to create story. Please try again.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <button
            onClick={handleCreateNewStory}
            disabled={isCreating}
            className="inline-flex items-center justify-center rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))] shadow-sm px-3 py-1.5 text-sm font-medium transition-all hover:bg-[rgb(var(--color-primary))]/90 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
        >
            {isCreating ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                </>
            ) : (
                <>
                    <Sparkles className="h-4 w-4" />
                    Create New Story
                </>
            )}
        </button>
    );
}
