/**
 * Google Analytics utility functions
 * Provides type-safe wrappers for Google Analytics tracking
 */

// Check if gtag is available (Google Analytics script loaded)
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}

/**
 * Track a page view
 * @param url - The URL to track
 */
export function pageview(url: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '', {
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
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
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
    action: 'view_story',
    category: 'Story',
    label: `${storyId}: ${title}`,
  });
}

/**
 * Track a chapter read event
 */
export function trackChapterRead(storyId: string, chapterId: string): void {
  event({
    action: 'read_chapter',
    category: 'Chapter',
    label: `Story: ${storyId}, Chapter: ${chapterId}`,
  });
}

/**
 * Track a scene read event
 */
export function trackSceneRead(sceneId: string): void {
  event({
    action: 'read_scene',
    category: 'Scene',
    label: sceneId,
  });
}
