/**
 * Google Analytics utility functions
 * Provides type-safe wrappers for Google Analytics tracking
 */

// Export GA Measurement ID for use in components
export const GA_MEASUREMENT_ID: string =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

// Check if gtag is available (Google Analytics script loaded)
declare global {
    interface Window {
        gtag?: (
            command: string,
            targetId: string,
            config?: Record<string, any>,
        ) => void;
    }
}

/**
 * Track a page view
 * @param url - The URL to track
 */
export function pageview(url: string): void {
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("config", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "", {
            page_path: url,
        });
    }
}

/**
 * Track a custom event
 * @param action - Event action
 * @param category - Event category
 * @param label - Event label
 * @param value - Event value (optional)
 */
export function event({
    action,
    category,
    label,
    value,
}: {
    action: string;
    category: string;
    label?: string;
    value?: number;
}): void {
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    }
}

/**
 * Track a story view event
 */
export function trackStoryView(storyId: string, title: string): void {
    event({
        action: "view_story",
        category: "Story",
        label: `${storyId}: ${title}`,
    });
}

/**
 * Track a chapter read event
 */
export function trackChapterRead(storyId: string, chapterId: string): void {
    event({
        action: "read_chapter",
        category: "Chapter",
        label: `Story: ${storyId}, Chapter: ${chapterId}`,
    });
}

/**
 * Track a scene read event
 */
export function trackSceneRead(sceneId: string): void {
    event({
        action: "read_scene",
        category: "Scene",
        label: sceneId,
    });
}

/**
 * Track user engagement events
 * @param action - The engagement action (e.g., 'click', 'scroll', 'hover')
 * @param target - The target element or feature
 */
export function trackEngagement(action: string, target: string): void {
    event({
        action,
        category: "Engagement",
        label: target,
    });
}

/**
 * Track reading progress events
 */
export function trackReading(
    storyId: string,
    chapterId?: string,
    sceneId?: string,
): void {
    event({
        action: "reading_progress",
        category: "Reading",
        label: `Story: ${storyId}${chapterId ? `, Chapter: ${chapterId}` : ""}${sceneId ? `, Scene: ${sceneId}` : ""}`,
    });
}

/**
 * Track community engagement events
 */
export function trackCommunity(action: string, target: string): void {
    event({
        action,
        category: "Community",
        label: target,
    });
}

/**
 * Track story-related events (creation, update, etc.)
 */
export function trackStoryEvent(
    action: string,
    storyId: string,
    metadata?: string,
): void {
    event({
        action,
        category: "Story",
        label: `${storyId}${metadata ? `: ${metadata}` : ""}`,
    });
}
