/**
 * Progressive Comic Panel Component
 *
 * Implements progressive loading for comic panels:
 * - First N panels load immediately
 * - Remaining panels load as they enter viewport (Intersection Observer)
 * - Shows skeleton while loading
 * - Optimizes performance for long comic scenes
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { PanelRenderer, PanelRendererSkeleton } from "./panel-renderer";

interface PanelData {
    id: string;
    panel_number: number;
    shot_type: string;
    image_url: string;
    image_variants?: {
        variants: Array<{
            url: string;
            format: string;
            width: number;
            height: number;
        }>;
    };
    narrative?: string | null;
    dialogue?: Array<{
        character_id: string;
        text: string;
        tone?: string;
    }>;
    sfx?: Array<{
        text: string;
        emphasis: "normal" | "large" | "dramatic";
    }>;
    description?: string | null;
}

interface ProgressiveComicPanelProps {
    panel: PanelData;
    panelIndex: number;
    totalPanels: number;
    characterNames?: Record<string, string>;
    onLoad?: (panelNumber: number) => void;
    initialLoadCount?: number; // How many panels to load immediately (default: 3)
}

/**
 * Get recommended initial load count based on screen size
 */
export function getRecommendedInitialLoadCount(): number {
    if (typeof window === "undefined") return 3;

    const screenHeight = window.innerHeight;

    // Mobile (< 768px)
    if (window.innerWidth < 768) {
        return screenHeight < 700 ? 2 : 3;
    }

    // Tablet (768-1024px)
    if (window.innerWidth < 1024) {
        return screenHeight < 800 ? 3 : 4;
    }

    // Desktop (> 1024px)
    return screenHeight < 900 ? 4 : 5;
}

export function ProgressiveComicPanel({
    panel,
    panelIndex,
    totalPanels,
    characterNames = {},
    onLoad,
    initialLoadCount = 3,
}: ProgressiveComicPanelProps) {
    const [shouldLoad, setShouldLoad] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const observerRef = useRef<HTMLDivElement>(null);

    // Determine if this panel should load immediately
    const shouldLoadImmediately = panelIndex < initialLoadCount;

    useEffect(() => {
        // Load immediately if in initial batch
        if (shouldLoadImmediately) {
            setShouldLoad(true);
            return;
        }

        // Use Intersection Observer for lazy loading
        if (!observerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !shouldLoad) {
                        setShouldLoad(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: "200px", // Start loading 200px before panel enters viewport
                threshold: 0.01,
            },
        );

        observer.observe(observerRef.current);

        return () => observer.disconnect();
    }, [shouldLoadImmediately, shouldLoad]);

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.(panel.panel_number);
    };

    return (
        <div ref={observerRef} className="relative">
            {shouldLoad ? (
                <PanelRenderer
                    panelNumber={panel.panel_number}
                    imageUrl={panel.image_url}
                    imageVariants={panel.image_variants}
                    narrative={panel.narrative}
                    dialogue={panel.dialogue}
                    sfx={panel.sfx}
                    description={panel.description}
                    characterNames={characterNames}
                    shotType={panel.shot_type}
                    priority={panelIndex < 2} // Prioritize first 2 panels
                    onLoad={handleLoad}
                />
            ) : (
                <PanelRendererSkeleton />
            )}
        </div>
    );
}
