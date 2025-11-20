import { createClient, type RedisClientType } from "redis";

interface CacheConfig {
    defaultTTL: number;
    enableLogging: boolean;
}

interface CacheMetrics {
    hits: number;
    misses: number;
    errors: number;
    avgGetTime: number;
    avgSetTime: number;
}

class RedisCache {
    private client: RedisClientType | null = null;
    private isConnected: boolean = false;
    private config: CacheConfig;
    private metrics: CacheMetrics = {
        hits: 0,
        misses: 0,
        errors: 0,
        avgGetTime: 0,
        avgSetTime: 0,
    };
    private memoryCache: Map<string, { value: string; expiresAt: number }> =
        new Map();

    constructor(config: Partial<CacheConfig> = {}) {
        this.config = {
            defaultTTL: config.defaultTTL || 300,
            enableLogging:
                config.enableLogging !== undefined
                    ? config.enableLogging
                    : true,
        };
    }

    async connect(): Promise<void> {
        if (this.isConnected) return;

        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
            console.warn(
                "[RedisCache] REDIS_URL not configured, using in-memory cache fallback",
            );
            return;
        }

        try {
            const startTime = Date.now();
            this.client = createClient({ url: redisUrl });

            this.client.on("error", (err) => {
                console.error("[RedisCache] Redis Client Error:", err);
                this.metrics.errors++;
            });

            await this.client.connect();
            this.isConnected = true;

            const connectTime = Date.now() - startTime;
            if (this.config.enableLogging) {
                console.log(
                    `[RedisCache] Connected to Redis in ${connectTime}ms`,
                );
            }
        } catch (error) {
            console.error("[RedisCache] Failed to connect to Redis:", error);
            this.isConnected = false;
            this.client = null;
        }
    }

    async get<T>(key: string): Promise<T | null> {
        const startTime = Date.now();

        try {
            let value: string | null = null;

            if (this.isConnected && this.client) {
                value = await this.client.get(key);
            } else {
                const cached = this.memoryCache.get(key);
                if (cached && cached.expiresAt > Date.now()) {
                    value = cached.value;
                } else if (cached) {
                    this.memoryCache.delete(key);
                }
            }

            const getTime = Date.now() - startTime;
            this.updateAvgTime("get", getTime);

            if (value) {
                this.metrics.hits++;
                if (this.config.enableLogging) {
                    console.log(`[RedisCache] HIT: ${key} (${getTime}ms)`);
                }
                try {
                    return JSON.parse(value) as T;
                } catch (parseError) {
                    // Corrupted cache data - delete it and return null
                    console.error(
                        `[RedisCache] Corrupted data for key ${key}, deleting:`,
                        parseError,
                    );
                    this.metrics.errors++;
                    // Asynchronously delete the corrupted key
                    this.del(key).catch((err: unknown) =>
                        console.error(
                            `[RedisCache] Failed to delete corrupted key ${key}:`,
                            err,
                        ),
                    );
                    return null;
                }
            } else {
                this.metrics.misses++;
                if (this.config.enableLogging) {
                    console.log(`[RedisCache] MISS: ${key} (${getTime}ms)`);
                }
                return null;
            }
        } catch (error) {
            this.metrics.errors++;
            console.error(`[RedisCache] Error getting key ${key}:`, error);
            return null;
        }
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        const startTime = Date.now();
        const expirationSeconds = ttl || this.config.defaultTTL;

        try {
            const serialized = JSON.stringify(value);

            if (this.isConnected && this.client) {
                await this.client.setEx(key, expirationSeconds, serialized);
            } else {
                this.memoryCache.set(key, {
                    value: serialized,
                    expiresAt: Date.now() + expirationSeconds * 1000,
                });

                if (this.memoryCache.size > 1000) {
                    const firstKey = this.memoryCache.keys().next().value;
                    if (firstKey) {
                        this.memoryCache.delete(firstKey);
                    }
                }
            }

            const setTime = Date.now() - startTime;
            this.updateAvgTime("set", setTime);

            if (this.config.enableLogging) {
                console.log(
                    `[RedisCache] SET: ${key} (TTL: ${expirationSeconds}s, ${setTime}ms)`,
                );
            }
        } catch (error) {
            this.metrics.errors++;
            console.error(`[RedisCache] Error setting key ${key}:`, error);
        }
    }

    async del(key: string): Promise<void> {
        try {
            if (this.isConnected && this.client) {
                await this.client.del(key);
            } else {
                this.memoryCache.delete(key);
            }

            if (this.config.enableLogging) {
                console.log(`[RedisCache] DEL: ${key}`);
            }
        } catch (error) {
            this.metrics.errors++;
            console.error(`[RedisCache] Error deleting key ${key}:`, error);
        }
    }

    async delPattern(pattern: string): Promise<void> {
        try {
            if (this.isConnected && this.client) {
                const keys = await this.client.keys(pattern);
                if (keys.length > 0) {
                    await this.client.del(keys);
                }

                if (this.config.enableLogging) {
                    console.log(
                        `[RedisCache] DEL_PATTERN: ${pattern} (${keys.length} keys)`,
                    );
                }
            } else {
                const regex = new RegExp(pattern.replace("*", ".*"));
                for (const key of this.memoryCache.keys()) {
                    if (regex.test(key)) {
                        this.memoryCache.delete(key);
                    }
                }
            }
        } catch (error) {
            this.metrics.errors++;
            console.error(
                `[RedisCache] Error deleting pattern ${pattern}:`,
                error,
            );
        }
    }

    async clear(): Promise<void> {
        try {
            if (this.isConnected && this.client) {
                await this.client.flushDb();
            } else {
                this.memoryCache.clear();
            }

            if (this.config.enableLogging) {
                console.log("[RedisCache] Cache cleared");
            }
        } catch (error) {
            this.metrics.errors++;
            console.error("[RedisCache] Error clearing cache:", error);
        }
    }

    getMetrics(): CacheMetrics {
        const total = this.metrics.hits + this.metrics.misses;
        return {
            ...this.metrics,
            hitRate: total > 0 ? (this.metrics.hits / total) * 100 : 0,
        } as CacheMetrics & { hitRate: number };
    }

    resetMetrics(): void {
        this.metrics = {
            hits: 0,
            misses: 0,
            errors: 0,
            avgGetTime: 0,
            avgSetTime: 0,
        };
    }

    private updateAvgTime(operation: "get" | "set", time: number): void {
        const key = operation === "get" ? "avgGetTime" : "avgSetTime";
        const count =
            operation === "get"
                ? this.metrics.hits + this.metrics.misses
                : this.metrics.hits + this.metrics.misses;

        if (count === 0) {
            this.metrics[key] = time;
        } else {
            this.metrics[key] =
                (this.metrics[key] * (count - 1) + time) / count;
        }
    }

    async disconnect(): Promise<void> {
        if (this.client && this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
            this.client = null;

            if (this.config.enableLogging) {
                console.log("[RedisCache] Disconnected from Redis");
            }
        }
    }
}

let cacheInstance: RedisCache | null = null;

export function getCache(): RedisCache {
    if (!cacheInstance) {
        cacheInstance = new RedisCache({
            defaultTTL: 300,
            enableLogging: process.env.NODE_ENV === "development",
        });
        cacheInstance.connect().catch((err) => {
            console.error("[RedisCache] Failed to connect:", err);
        });
    }
    return cacheInstance;
}

export async function withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
): Promise<T> {
    const cache = getCache();
    const cached = await cache.get<T>(key);

    if (cached !== null) {
        return cached;
    }

    const data = await fetcher();
    await cache.set(key, data, ttl);
    return data;
}

export async function invalidateCache(keys: string | string[]): Promise<void> {
    const cache = getCache();
    const keyArray = Array.isArray(keys) ? keys : [keys];

    for (const key of keyArray) {
        if (key.includes("*")) {
            await cache.delPattern(key);
        } else {
            await cache.del(key);
        }
    }
}

export { RedisCache };
export type { CacheConfig, CacheMetrics };
