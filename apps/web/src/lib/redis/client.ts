import { Redis } from "ioredis";

// Singleton Redis client for general operations
let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
    if (!redisClient) {
        if (!process.env.REDIS_URL) {
            throw new Error("REDIS_URL environment variable is not set");
        }

        redisClient = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: true,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });

        redisClient.on("error", (error) => {
            console.error("[Redis Client] Error:", error);
        });

        redisClient.on("connect", () => {
            console.log("[Redis Client] Connected");
        });
    }

    return redisClient;
}

// Publisher client (separate from subscriber per Redis best practices)
let redisPublisher: Redis | null = null;

export function getRedisPublisher(): Redis {
    if (!redisPublisher) {
        if (!process.env.REDIS_URL) {
            throw new Error("REDIS_URL environment variable is not set");
        }

        redisPublisher = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });

        redisPublisher.on("error", (error) => {
            console.error("[Redis Publisher] Error:", error);
        });

        redisPublisher.on("connect", () => {
            console.log("[Redis Publisher] Connected");
        });
    }

    return redisPublisher;
}

// Subscriber client (must be separate from publisher)
let redisSubscriber: Redis | null = null;

export function getRedisSubscriber(): Redis {
    if (!redisSubscriber) {
        if (!process.env.REDIS_URL) {
            throw new Error("REDIS_URL environment variable is not set");
        }

        redisSubscriber = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });

        redisSubscriber.on("error", (error) => {
            console.error("[Redis Subscriber] Error:", error);
        });

        redisSubscriber.on("connect", () => {
            console.log("[Redis Subscriber] Connected");
        });
    }

    return redisSubscriber;
}

// Channel names for pub/sub
export const CHANNELS = {
    STORY_PUBLISHED: "story:published",
    STORY_UPDATED: "story:updated",
    STORY_DELETED: "story:deleted",
    POST_CREATED: "post:created",
    POST_UPDATED: "post:updated",
    POST_DELETED: "post:deleted",
} as const;

// Type for channel names
export type ChannelName = (typeof CHANNELS)[keyof typeof CHANNELS];

// Event payload types
export interface StoryPublishedEvent {
    storyId: string;
    title: string;
    authorId: string;
    genre: string | null;
    timestamp: string;
}

export interface StoryUpdatedEvent {
    storyId: string;
    timestamp: string;
}

export interface StoryDeletedEvent {
    storyId: string;
    timestamp: string;
}

export interface PostCreatedEvent {
    postId: string;
    storyId: string;
    authorId: string;
    title: string;
    type: string;
    timestamp: string;
}

export interface PostUpdatedEvent {
    postId: string;
    storyId: string;
    timestamp: string;
}

export interface PostDeletedEvent {
    postId: string;
    storyId: string;
    timestamp: string;
}

// Helper function to publish events
export async function publishEvent<T>(
    channel: ChannelName,
    data: T,
): Promise<void> {
    try {
        const publisher = getRedisPublisher();
        const payload = JSON.stringify(data);
        await publisher.publish(channel, payload);
        console.log(`[Redis] Published event to ${channel}:`, data);
    } catch (error) {
        console.error(`[Redis] Failed to publish event to ${channel}:`, error);
        // Don't throw - we don't want to fail the request if Redis publish fails
    }
}

// Cleanup function for graceful shutdown
export async function closeRedisConnections(): Promise<void> {
    const promises: Promise<void>[] = [];

    if (redisClient) {
        promises.push(redisClient.quit().then(() => {}));
        redisClient = null;
    }

    if (redisPublisher) {
        promises.push(redisPublisher.quit().then(() => {}));
        redisPublisher = null;
    }

    if (redisSubscriber) {
        promises.push(redisSubscriber.quit().then(() => {}));
        redisSubscriber = null;
    }

    await Promise.all(promises);
    console.log("[Redis] All connections closed");
}
