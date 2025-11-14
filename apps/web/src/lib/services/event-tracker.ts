import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { analysisEvents } from "@/lib/schemas/drizzle";

interface TrackEventParams {
    eventType: string;
    userId?: string | null;
    storyId?: string;
    chapterId?: string;
    sceneId?: string;
    postId?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Track analytics event
 *
 * This function creates an analytics event record in the database.
 * It's designed to fail silently - analytics failures should never break user experience.
 *
 * @param params - Event tracking parameters
 * @returns Promise<void>
 *
 * @example
 * ```typescript
 * // Track story view
 * await trackEvent({
 *   eventType: 'story_view',
 *   userId: session?.user?.id,
 *   storyId: 'story_123',
 *   metadata: {
 *     referrer: 'community',
 *     deviceType: 'mobile',
 *   }
 * });
 * ```
 */
export async function trackEvent({
    eventType,
    userId,
    storyId,
    chapterId,
    sceneId,
    postId,
    metadata = {},
}: TrackEventParams): Promise<void> {
    try {
        // Get or create session ID from metadata
        const sessionId = (metadata.sessionId as string) || nanoid();

        await db.insert(analysisEvents).values({
            id: nanoid(),
            eventType: eventType as any,
            userId: userId || null,
            sessionId,
            storyId: storyId || null,
            chapterId: chapterId || null,
            sceneId: sceneId || null,
            postId: postId || null,
            metadata,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        });
    } catch (error) {
        // Log error but don't throw - analytics failures should not break user experience
        console.error("Failed to track event:", error);
    }
}

/**
 * Track multiple events in batch
 *
 * More efficient for tracking multiple events at once.
 *
 * @param events - Array of event tracking parameters
 * @returns Promise<void>
 */
export async function trackEventsBatch(
    events: TrackEventParams[],
): Promise<void> {
    try {
        const now = new Date().toISOString();

        const eventRecords = events.map((event) => ({
            id: nanoid(),
            eventType: event.eventType as any,
            userId: event.userId || null,
            sessionId: (event.metadata?.sessionId as string) || nanoid(),
            storyId: event.storyId || null,
            chapterId: event.chapterId || null,
            sceneId: event.sceneId || null,
            postId: event.postId || null,
            metadata: event.metadata || {},
            timestamp: now,
            createdAt: now,
        }));

        await db.insert(analysisEvents).values(eventRecords);
    } catch (error) {
        console.error("Failed to track events batch:", error);
    }
}
