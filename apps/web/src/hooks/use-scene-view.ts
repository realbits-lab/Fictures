/**
 * useSceneView Hook
 *
 * Tracks scene views when users read scenes
 * - Debounces API calls to prevent duplicate tracking
 * - Works for both logged-in and anonymous users
 * - Tracks only once per scene per session/user
 */

import { useEffect, useRef } from "react";
import { useSWRConfig } from "swr";

interface UseSceneViewOptions {
    enabled?: boolean;
    debounceMs?: number;
    readingFormat?: "novel" | "comic";
}

export function useSceneView(
    sceneId: string | null,
    options: UseSceneViewOptions = {},
) {
    const {
        enabled = true,
        debounceMs = 1000,
        readingFormat = "novel",
    } = options;
    const { mutate } = useSWRConfig();

    // Track which scenes have been viewed in this session (client-side only)
    // Use format-specific key to allow tracking same scene in both formats
    const viewedScenes = useRef<Set<string>>(new Set());
    const trackingTimeout = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!sceneId || !enabled) {
            return;
        }

        // Create format-specific tracking key
        const trackingKey = `${sceneId}:${readingFormat}`;

        // Skip if already tracked in this session
        if (viewedScenes.current.has(trackingKey)) {
            console.log(
                `Scene ${sceneId} (${readingFormat}) already tracked in this session`,
            );
            return;
        }

        // Clear any pending tracking
        if (trackingTimeout.current) {
            clearTimeout(trackingTimeout.current);
        }

        // Debounce the tracking call
        trackingTimeout.current = setTimeout(async () => {
            try {
                console.log(
                    `Tracking ${readingFormat} view for scene: ${sceneId}`,
                );

                const response = await fetch(
                    `/api/studio/scenes/${sceneId}/view`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            reading_format: readingFormat,
                        }),
                    },
                );

                if (!response.ok) {
                    console.error(
                        `Failed to track scene view: ${response.statusText}`,
                    );
                    return;
                }

                const data = await response.json();

                if (data.success) {
                    // Mark as viewed in this session
                    viewedScenes.current.add(trackingKey);

                    console.log(
                        `Scene view tracked: ${sceneId} (${readingFormat})`,
                        `\n   Total Views: ${data.viewCount} (Novel: ${data.novelViewCount}, Comic: ${data.comicViewCount})`,
                        `\n   Unique Views: ${data.uniqueViewCount} (Novel: ${data.novelUniqueViewCount}, Comic: ${data.comicUniqueViewCount})`,
                        `\n   New View: ${data.isNewView ? "Yes" : "No"}`,
                    );

                    // Revalidate scene data to get updated view counts
                    mutate((key) => {
                        if (typeof key === "string" && key.includes(sceneId)) {
                            return true;
                        }
                        return false;
                    });
                }
            } catch (error) {
                console.error("Error tracking scene view:", error);
            }
        }, debounceMs);

        // Cleanup timeout on unmount or scene change
        return () => {
            if (trackingTimeout.current) {
                clearTimeout(trackingTimeout.current);
            }
        };
    }, [sceneId, enabled, debounceMs, readingFormat, mutate]);

    return {
        hasViewed: sceneId ? viewedScenes.current.has(sceneId) : false,
    };
}

/**
 * Get view statistics for a scene
 */
export async function getSceneViewStats(sceneId: string): Promise<{
    viewCount: number;
    uniqueViewCount: number;
    lastViewedAt: string | null;
    hasViewedByCurrentUser: boolean;
} | null> {
    try {
        const response = await fetch(`/api/studio/scenes/${sceneId}/view`);

        if (!response.ok) {
            console.error(
                `Failed to get scene view stats: ${response.statusText}`,
            );
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Error getting scene view stats:", error);
        return null;
    }
}
