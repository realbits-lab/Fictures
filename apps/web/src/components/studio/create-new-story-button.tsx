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
            // Navigate directly to agent chat page
            // The agent will handle story creation
            router.push("/studio/agent/new");
        } catch (error) {
            console.error("Error navigating to story creation:", error);
            alert("Failed to navigate to story creation. Please try again.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <button
            type="button"
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
