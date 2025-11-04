"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface EventTrackerProps {
  eventType: string;
  storyId?: string;
  chapterId?: string;
  sceneId?: string;
  postId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * EventTracker Component
 *
 * Client-side component for tracking analytics events.
 * Simply render this component to track an event on mount.
 *
 * @example
 * ```tsx
 * // Track story view
 * <EventTracker
 *   eventType="story_view"
 *   storyId={story.id}
 *   metadata={{ referrer: 'community' }}
 * />
 * ```
 */
export function EventTracker({
  eventType,
  storyId,
  chapterId,
  sceneId,
  postId,
  metadata = {},
}: EventTrackerProps) {
  const { data: session } = useSession();

  useEffect(() => {
    // Get or create session ID (browser session)
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }

    // Detect device type
    const deviceType = /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop';

    // Track event
    fetch('/analysis/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        storyId,
        chapterId,
        sceneId,
        postId,
        metadata: {
          ...metadata,
          sessionId,
          deviceType,
          screenWidth: window.innerWidth,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        },
      }),
    }).catch((error) => {
      // Silent failure - analytics should not break user experience
      console.error('Failed to track event:', error);
    });
  }, [eventType, storyId, chapterId, sceneId, postId, session, metadata]);

  // This component doesn't render anything
  return null;
}
