"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui";
import { STORY_GENRES } from "@/lib/constants/genres";

const VALID_GENRES = STORY_GENRES;

interface StoryMetadataEditorProps {
    storyId: string;
    currentGenre: string;
    currentTitle: string;
    onUpdate?: () => void;
    disabled?: boolean;
}

export function StoryMetadataEditor({
    storyId,
    currentGenre,
    currentTitle,
    onUpdate,
    disabled = false,
}: StoryMetadataEditorProps) {
    const [genre, setGenre] = useState(currentGenre);
    const [isLoading, setIsLoading] = useState(false);
    const hasChanges = genre !== currentGenre;

    const handleSave = async () => {
        if (!hasChanges) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/studio/story/${storyId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ genre }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update genre");
            }

            toast.success("Genre updated successfully!", {
                duration: 3000,
                position: "top-right",
            });

            // Trigger parent update
            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error("Failed to update genre:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to update genre",
                {
                    duration: 5000,
                    position: "top-right",
                },
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setGenre(currentGenre);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>📝 Story Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Title Display (read-only for now) */}
                <div>
                    <label className="block text-sm font-medium text-[rgb(var(--color-muted-foreground))] mb-1">
                        Title
                    </label>
                    <div className="text-base font-medium text-[rgb(var(--color-foreground))]">
                        {currentTitle}
                    </div>
                </div>

                {/* Genre Selector */}
                <div>
                    <label className="block text-sm font-medium text-[rgb(var(--color-muted-foreground))] mb-2">
                        Genre
                    </label>
                    <select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        disabled={disabled || isLoading}
                        className="w-full px-3 py-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {VALID_GENRES.map((genreOption) => (
                            <option key={genreOption} value={genreOption}>
                                {genreOption}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Save/Cancel Buttons */}
                {hasChanges && (
                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Saving...
                                </>
                            ) : (
                                <>💾 Save Changes</>
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
