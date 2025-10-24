/**
 * Google Analytics utilities for tracking events and page views
 */

// Type definitions for Google Analytics
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

/**
 * Initialize Google Analytics page view
 */
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

/**
 * Track custom events
 */
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

/**
 * Story-related events
 */
export const trackStoryEvent = {
  create: (storyId: string) => {
    event({
      action: 'create_story',
      category: 'Story',
      label: storyId,
    });
  },

  view: (storyId: string, storyTitle?: string) => {
    event({
      action: 'view_story',
      category: 'Story',
      label: storyTitle || storyId,
    });
  },

  edit: (storyId: string) => {
    event({
      action: 'edit_story',
      category: 'Story',
      label: storyId,
    });
  },

  delete: (storyId: string) => {
    event({
      action: 'delete_story',
      category: 'Story',
      label: storyId,
    });
  },

  publish: (storyId: string) => {
    event({
      action: 'publish_story',
      category: 'Story',
      label: storyId,
    });
  },

  generateContent: (contentType: 'chapter' | 'scene' | 'character', storyId: string) => {
    event({
      action: `generate_${contentType}`,
      category: 'AI Generation',
      label: storyId,
    });
  },
};

/**
 * User engagement events
 */
export const trackEngagement = {
  signIn: (method: 'google' | 'email') => {
    event({
      action: 'sign_in',
      category: 'User',
      label: method,
    });
  },

  signOut: () => {
    event({
      action: 'sign_out',
      category: 'User',
    });
  },

  signUp: (method: 'google' | 'email') => {
    event({
      action: 'sign_up',
      category: 'User',
      label: method,
    });
  },

  pageView: (pageName: string, userId?: string) => {
    event({
      action: 'page_view',
      category: 'Engagement',
      label: pageName,
    });
  },
};

/**
 * Reading events
 */
export const trackReading = {
  startReading: (storyId: string, chapterId?: string) => {
    event({
      action: 'start_reading',
      category: 'Reading',
      label: chapterId ? `${storyId}-${chapterId}` : storyId,
    });
  },

  finishChapter: (storyId: string, chapterId: string) => {
    event({
      action: 'finish_chapter',
      category: 'Reading',
      label: `${storyId}-${chapterId}`,
    });
  },

  bookmark: (storyId: string) => {
    event({
      action: 'bookmark_story',
      category: 'Reading',
      label: storyId,
    });
  },
};

/**
 * Community events
 */
export const trackCommunity = {
  viewPost: (postId: string) => {
    event({
      action: 'view_community_post',
      category: 'Community',
      label: postId,
    });
  },

  createPost: (postId: string) => {
    event({
      action: 'create_community_post',
      category: 'Community',
      label: postId,
    });
  },

  comment: (postId: string) => {
    event({
      action: 'comment_on_post',
      category: 'Community',
      label: postId,
    });
  },

  like: (postId: string) => {
    event({
      action: 'like_post',
      category: 'Community',
      label: postId,
    });
  },
};

/**
 * Search and discovery events
 */
export const trackSearch = {
  search: (query: string, resultCount?: number) => {
    event({
      action: 'search',
      category: 'Search',
      label: query,
      value: resultCount,
    });
  },

  filterByGenre: (genre: string) => {
    event({
      action: 'filter_by_genre',
      category: 'Discovery',
      label: genre,
    });
  },
};

/**
 * Error tracking
 */
export const trackError = {
  apiError: (endpoint: string, errorMessage: string) => {
    event({
      action: 'api_error',
      category: 'Error',
      label: `${endpoint}: ${errorMessage}`,
    });
  },

  clientError: (errorMessage: string) => {
    event({
      action: 'client_error',
      category: 'Error',
      label: errorMessage,
    });
  },
};

/**
 * Performance tracking
 */
export const trackPerformance = {
  contentLoad: (pageName: string, loadTime: number) => {
    event({
      action: 'content_load_time',
      category: 'Performance',
      label: pageName,
      value: Math.round(loadTime),
    });
  },
};

/**
 * Conversion events
 */
export const trackConversion = {
  completeOnboarding: () => {
    event({
      action: 'complete_onboarding',
      category: 'Conversion',
    });
  },

  firstStoryCreated: () => {
    event({
      action: 'first_story_created',
      category: 'Conversion',
    });
  },

  firstStoryPublished: () => {
    event({
      action: 'first_story_published',
      category: 'Conversion',
    });
  },
};
