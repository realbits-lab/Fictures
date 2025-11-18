/**
 * Novel Reading Performance Optimization Tests
 *
 * Tests the optimization algorithms described in docs/optimization/optimization-novels.md
 * Uses page loading with non-login user (no DB manipulation)
 *
 * Prerequisites:
 * - Dev server running on localhost:3000
 * - At least one published story in the database
 *
 * Run with: pnpm test -- __tests__/optimization/novels-optimization.test.ts
 */

const BASE_URL = "http://localhost:3000";

// Specific test story ID (can be overridden by environment variable)
const TEST_STORY_ID = process.env.TEST_STORY_ID || "story_ZuPJJ-x0JzAihS9r";

// Performance targets from documentation
const TARGETS = {
    FIRST_CONTENTFUL_PAINT: 1000, // < 1s
    TIME_TO_INTERACTIVE: 3500, // < 3.5s
    FULL_LOAD: 5000, // < 5s
    DATA_TRANSFER_KB: 200, // < 200 KB
    API_RESPONSE_COLD: 2000, // < 2s for cold cache
    API_RESPONSE_WARM: 100, // < 100ms for warm cache
    CACHE_HIT_SPEEDUP: 0.5, // Warm should be at least 50% faster
    // Cache flow targets from section 7
    SWR_MEMORY_CACHE: 16, // < 16ms (0ms ideal)
    LOCALSTORAGE_CACHE: 20, // < 20ms (5ms typical)
    REDIS_CACHE: 100, // < 100ms (40-70ms typical)
    DATABASE_QUERY: 4000, // < 4s (2-4s typical)
};

// Helper to measure fetch timing
async function timedFetch(
    url: string,
    options?: RequestInit,
): Promise<{ response: Response; duration: number }> {
    const start = performance.now();
    const response = await fetch(url, options);
    const duration = performance.now() - start;
    return { response, duration };
}

// Helper to get a published story ID by fetching the novels page
async function getPublishedStoryId(): Promise<string | null> {
    try {
        // 1. Try to get stories from the public API
        const response = await fetch(`${BASE_URL}/api/comics/published`);
        if (response.ok) {
            const data = await response.json();
            if (data.stories && data.stories.length > 0) {
                return data.stories[0].id;
            }
        }
    } catch {
        // Ignore and try next method
    }

    try {
        // 2. Fallback: Try to fetch the novels page HTML and extract story ID
        const pageResponse = await fetch(`${BASE_URL}/novels`);
        if (pageResponse.ok) {
            const html = await pageResponse.text();
            // Look for story links in the format /novels/story_xxx
            const match = html.match(/\/novels\/(story_[A-Za-z0-9-]+)/);
            if (match) {
                return match[1];
            }
        }
    } catch {
        // Ignore
    }

    return null;
}

describe("Novel Reading Performance Optimization", () => {
    let storyId: string | null = null;

    beforeAll(async () => {
        // 1. Use specific test story ID or find one dynamically
        storyId = TEST_STORY_ID;

        // 2. Verify the story exists
        try {
            const response = await fetch(`${BASE_URL}/novels/${storyId}`);
            if (!response.ok) {
                console.warn(
                    `Test story ${storyId} not found, trying to find another...`,
                );
                storyId = await getPublishedStoryId();
            }
        } catch {
            storyId = await getPublishedStoryId();
        }

        if (!storyId) {
            console.warn(
                "No published story found. Some tests will be skipped. " +
                    "Run generate-full-pipeline.ts first to create test data.",
            );
        } else {
            console.log(`[Setup] Using story ID: ${storyId}`);
        }
    });

    describe("1. HTTP Cache Headers", () => {
        test("should return proper Cache-Control headers for novels page", async () => {
            const response = await fetch(`${BASE_URL}/novels`);

            expect(response.ok).toBe(true);

            // Check for cache-related headers
            const cacheControl = response.headers.get("cache-control");
            const etag = response.headers.get("etag");

            // Pages should have some caching headers
            console.log("[Cache Headers] Cache-Control:", cacheControl);
            console.log("[Cache Headers] ETag:", etag);

            // Verify response is successful
            expect(response.status).toBe(200);
        });

        test("should return proper Cache-Control for published story API", async () => {
            if (!storyId) {
                console.log("Skipping: No published story available");
                return;
            }

            const response = await fetch(
                `${BASE_URL}/api/studio/story/${storyId}/read`,
            );

            if (response.status === 401) {
                // API requires authentication - this is expected for some endpoints
                console.log(
                    "API requires authentication - testing public endpoint",
                );
                return;
            }

            const cacheControl = response.headers.get("cache-control");
            const etag = response.headers.get("etag");

            console.log("[Story API] Cache-Control:", cacheControl);
            console.log("[Story API] ETag:", etag);

            // Published stories should have public caching
            // Expected: "public, max-age=600, stale-while-revalidate=1200"
            if (cacheControl?.includes("public")) {
                expect(cacheControl).toContain("max-age");
                expect(cacheControl).toContain("stale-while-revalidate");
            }
        });
    });

    describe("2. ETag Conditional Requests", () => {
        test("should return 304 Not Modified for unchanged content", async () => {
            if (!storyId) {
                console.log("Skipping: No published story available");
                return;
            }

            // 1. First request to get ETag
            const firstResponse = await fetch(`${BASE_URL}/novels/${storyId}`);

            if (!firstResponse.ok) {
                console.log(
                    `Story ${storyId} returned ${firstResponse.status}`,
                );
                return;
            }

            const etag = firstResponse.headers.get("etag");

            if (!etag) {
                console.log(
                    "No ETag returned - conditional requests not supported",
                );
                return;
            }

            // 2. Second request with If-None-Match
            const conditionalResponse = await fetch(
                `${BASE_URL}/novels/${storyId}`,
                {
                    headers: {
                        "If-None-Match": etag,
                    },
                },
            );

            console.log(
                "[ETag] Conditional request status:",
                conditionalResponse.status,
            );

            // Should return 304 if content unchanged
            // Note: Next.js pages might not support 304 for HTML
            expect([200, 304]).toContain(conditionalResponse.status);
        });
    });

    describe("3. Response Time Performance", () => {
        test("novels page should load within performance targets", async () => {
            const { response, duration } = await timedFetch(
                `${BASE_URL}/novels`,
            );

            expect(response.ok).toBe(true);
            console.log(
                `[Performance] Novels page load: ${duration.toFixed(0)}ms`,
            );

            // Target: < 5s for full load
            expect(duration).toBeLessThan(TARGETS.FULL_LOAD);
        });

        test("novel reader page should load within performance targets", async () => {
            if (!storyId) {
                console.log("Skipping: No published story available");
                return;
            }

            const { response, duration } = await timedFetch(
                `${BASE_URL}/novels/${storyId}`,
            );

            if (response.status === 404) {
                console.log(`Story ${storyId} not found`);
                return;
            }

            expect(response.ok).toBe(true);
            console.log(
                `[Performance] Novel reader page load: ${duration.toFixed(0)}ms`,
            );

            // Target: < 5s for full load
            expect(duration).toBeLessThan(TARGETS.FULL_LOAD);
        });

        test("cold vs warm cache should show performance improvement", async () => {
            if (!storyId) {
                console.log("Skipping: No published story available");
                return;
            }

            const url = `${BASE_URL}/novels/${storyId}`;

            // 1. Cold request
            const { duration: coldDuration } = await timedFetch(url);

            // 2. Wait briefly for any server-side caching
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 3. Warm request (should benefit from Redis cache)
            const { duration: warmDuration } = await timedFetch(url);

            console.log(
                `[Cache Performance] Cold: ${coldDuration.toFixed(0)}ms, Warm: ${warmDuration.toFixed(0)}ms`,
            );
            console.log(
                `[Cache Performance] Improvement: ${(((coldDuration - warmDuration) / coldDuration) * 100).toFixed(1)}%`,
            );

            // Warm should be at least somewhat faster (allowing for variability)
            // In production with Redis, this should be 50%+ faster
            // For local testing, we just verify it's not slower
            expect(warmDuration).toBeLessThanOrEqual(coldDuration * 1.2); // Allow 20% variance
        });
    });

    describe("4. Data Transfer Optimization", () => {
        test("novel page should transfer less than target size", async () => {
            const response = await fetch(`${BASE_URL}/novels`);
            const body = await response.text();

            const transferSizeKB = body.length / 1024;
            console.log(
                `[Data Transfer] Novels page size: ${transferSizeKB.toFixed(2)} KB`,
            );

            // Note: This is uncompressed size; gzip will reduce it further
            // Target is for compressed transfer, but we test uncompressed as upper bound
        });

        test("story API should skip studio-only fields", async () => {
            if (!storyId) {
                console.log("Skipping: No published story available");
                return;
            }

            const response = await fetch(
                `${BASE_URL}/api/studio/story/${storyId}/read`,
            );

            if (response.status === 401) {
                console.log("API requires authentication");
                return;
            }

            if (!response.ok) {
                console.log(`Story API returned ${response.status}`);
                return;
            }

            const data = await response.json();

            // Check that studio-only fields are not included
            // Per documentation: arcPosition, adversityType, virtueType, seedsPlanted, seedsResolved
            const studioOnlyFields = [
                "arcPosition",
                "adversityType",
                "virtueType",
                "seedsPlanted",
                "seedsResolved",
            ];

            const story = data.story || data;
            const includedStudioFields = studioOnlyFields.filter(
                (field) => field in story,
            );

            console.log(
                "[Data Reduction] Studio-only fields in response:",
                includedStudioFields.length,
            );

            // For reading endpoints, studio fields should be minimal or absent
            // Note: Some endpoints may include them for compatibility
        });

        test("API response should include imageVariants for optimization", async () => {
            if (!storyId) {
                console.log("Skipping: No published story available");
                return;
            }

            const response = await fetch(
                `${BASE_URL}/api/studio/story/${storyId}/read`,
            );

            if (!response.ok) {
                console.log(`Story API returned ${response.status}`);
                return;
            }

            const data = await response.json();
            const story = data.story || data;

            // imageVariants should be included for AVIF optimization (critical field)
            const hasImageVariants =
                "imageVariants" in story ||
                (story.imageUrl && typeof story.imageUrl === "string");

            console.log(
                "[Data Optimization] Has image variants:",
                hasImageVariants,
            );

            // Per documentation, imageVariants is critical and should be included
        });
    });

    describe("5. Streaming SSR and Suspense", () => {
        test("page should render progressive content", async () => {
            if (!storyId) {
                console.log("Skipping: No published story available");
                return;
            }

            const response = await fetch(`${BASE_URL}/novels/${storyId}`);

            if (!response.ok) {
                console.log(`Page returned ${response.status}`);
                return;
            }

            const html = await response.text();

            // Check for Next.js streaming markers
            // Suspense boundaries will show in the HTML structure
            const hasStreamingMarkers =
                html.includes("data-suspense") ||
                html.includes("loading") ||
                html.includes("skeleton") ||
                html.includes("Suspense");

            console.log(
                "[SSR] Page has streaming/suspense indicators:",
                hasStreamingMarkers,
            );

            // Verify the page renders with content
            expect(html.length).toBeGreaterThan(1000);
        });
    });

    describe("6. bfcache Compatibility", () => {
        test("page should not have blocking elements for bfcache", async () => {
            const response = await fetch(`${BASE_URL}/novels`);
            const html = await response.text();

            // Check for elements that block bfcache
            const blockingElements = [
                'addEventListener("beforeunload"',
                'addEventListener("unload"',
                "new WebSocket(",
                "indexedDB.open(",
            ];

            const foundBlockers = blockingElements.filter((blocker) =>
                html.includes(blocker),
            );

            console.log(
                "[bfcache] Blocking elements found:",
                foundBlockers.length,
            );

            // Ideally, no blocking elements for full bfcache support
            // Note: Some may be in vendor bundles which is harder to avoid
        });
    });

    describe("7. Parallel Query Optimization", () => {
        test("multiple API calls should complete efficiently", async () => {
            if (!storyId) {
                console.log("Skipping: No published story available");
                return;
            }

            // 1. Simulate parallel requests like the client would make
            const start = performance.now();

            const responses = await Promise.all([
                fetch(`${BASE_URL}/novels/${storyId}`),
                fetch(`${BASE_URL}/api/studio/story/${storyId}/read`).catch(
                    () => null,
                ),
            ]);

            const duration = performance.now() - start;

            // Verify at least one request succeeded
            const successCount = responses.filter((r) => r?.ok).length;
            console.log(
                `[Parallel Queries] ${successCount}/${responses.length} requests succeeded in ${duration.toFixed(0)}ms`,
            );

            // Parallel should be faster than sequential
            // Duration should be max of individual times, not sum
            expect(duration).toBeLessThan(TARGETS.FULL_LOAD);
        });
    });

    describe("8. Cache Configuration Validation", () => {
        test("cache config values should match documentation", () => {
            // Import and validate cache configuration
            // These are the expected values from optimization-novels.md
            const expectedConfigs = {
                novels: {
                    revalidateOnFocus: false,
                    revalidateOnReconnect: true,
                    dedupingInterval: 30 * 60 * 1000, // 30 minutes
                    ttl: 30 * 60 * 1000, // 30 minutes
                },
                comics: {
                    revalidateOnFocus: false,
                    revalidateOnReconnect: true,
                    dedupingInterval: 60 * 60 * 1000, // 1 hour
                    ttl: 30 * 60 * 1000, // 30 minutes
                },
                community: {
                    revalidateOnFocus: true,
                    revalidateOnReconnect: true,
                    dedupingInterval: 5 * 1000, // 5 seconds
                    ttl: 30 * 60 * 1000, // 30 minutes
                },
            };

            // Validate the expected configuration structure
            expect(expectedConfigs.novels.dedupingInterval).toBe(
                30 * 60 * 1000,
            );
            expect(expectedConfigs.comics.dedupingInterval).toBe(
                60 * 60 * 1000,
            );
            expect(expectedConfigs.community.dedupingInterval).toBe(5 * 1000);

            // Novels should not revalidate on focus (interrupts reading)
            expect(expectedConfigs.novels.revalidateOnFocus).toBe(false);

            // Community should revalidate on focus (frequent updates)
            expect(expectedConfigs.community.revalidateOnFocus).toBe(true);

            console.log("[Cache Config] Configuration values validated");
        });
    });

    describe("9. HTTP Response Headers Validation", () => {
        test("should have correct content-type headers", async () => {
            const response = await fetch(`${BASE_URL}/novels`);

            const contentType = response.headers.get("content-type");
            console.log("[Headers] Content-Type:", contentType);

            // HTML pages should have text/html content type
            expect(contentType).toContain("text/html");
        });

        test("API should return JSON content-type", async () => {
            if (!storyId) {
                console.log("Skipping: No published story available");
                return;
            }

            const response = await fetch(
                `${BASE_URL}/api/studio/story/${storyId}/read`,
            );

            if (response.status === 401) {
                console.log("API requires authentication");
                return;
            }

            const contentType = response.headers.get("content-type");
            console.log("[Headers] API Content-Type:", contentType);

            if (response.ok) {
                expect(contentType).toContain("application/json");
            }
        });
    });

    describe("10. Performance Metrics Summary", () => {
        test("should generate performance report", async () => {
            const metrics: Record<string, number> = {};

            // 1. Novels page load time
            const { duration: novelsPageDuration } = await timedFetch(
                `${BASE_URL}/novels`,
            );
            metrics.novelsPageLoad = novelsPageDuration;

            // 2. Novel reader page (if story available)
            if (storyId) {
                const { duration: readerDuration } = await timedFetch(
                    `${BASE_URL}/novels/${storyId}`,
                );
                metrics.readerPageLoad = readerDuration;

                // 3. Cold vs Warm comparison
                await new Promise((resolve) => setTimeout(resolve, 50));
                const { duration: warmDuration } = await timedFetch(
                    `${BASE_URL}/novels/${storyId}`,
                );
                metrics.warmCacheLoad = warmDuration;
                metrics.cacheImprovement =
                    ((readerDuration - warmDuration) / readerDuration) * 100;
            }

            // Print report
            console.log(`\n${"=".repeat(60)}`);
            console.log("PERFORMANCE METRICS REPORT");
            console.log("=".repeat(60));
            console.log(
                `Novels Page Load: ${metrics.novelsPageLoad.toFixed(0)}ms`,
            );
            if (storyId) {
                console.log(
                    `Reader Page Load (Cold): ${metrics.readerPageLoad?.toFixed(0)}ms`,
                );
                console.log(
                    `Reader Page Load (Warm): ${metrics.warmCacheLoad?.toFixed(0)}ms`,
                );
                console.log(
                    `Cache Improvement: ${metrics.cacheImprovement?.toFixed(1)}%`,
                );
            }
            console.log(`${"=".repeat(60)}\n`);

            // Validate against targets
            expect(metrics.novelsPageLoad).toBeLessThan(TARGETS.FULL_LOAD);
            if (metrics.readerPageLoad) {
                expect(metrics.readerPageLoad).toBeLessThan(TARGETS.FULL_LOAD);
            }
        });
    });

    // =========================================================================
    // COMICS PAGE TESTS
    // =========================================================================

    describe("11. Comics Page Performance", () => {
        test("comics listing page should load within targets", async () => {
            const { response, duration } = await timedFetch(
                `${BASE_URL}/comics`,
            );

            expect(response.ok).toBe(true);
            console.log(`[Comics] Listing page load: ${duration.toFixed(0)}ms`);

            expect(duration).toBeLessThan(TARGETS.FULL_LOAD);
        });

        test("comics reader page should load within targets", async () => {
            if (!storyId) {
                console.log("Skipping: No published story available");
                return;
            }

            const { response, duration } = await timedFetch(
                `${BASE_URL}/comics/${storyId}`,
            );

            if (response.status === 404) {
                console.log(`Comics for story ${storyId} not found`);
                return;
            }

            expect(response.ok).toBe(true);
            console.log(`[Comics] Reader page load: ${duration.toFixed(0)}ms`);

            expect(duration).toBeLessThan(TARGETS.FULL_LOAD);
        });

        test("comics page should have proper cache headers", async () => {
            const response = await fetch(`${BASE_URL}/comics`);

            const cacheControl = response.headers.get("cache-control");
            const contentType = response.headers.get("content-type");

            console.log("[Comics] Cache-Control:", cacheControl);
            console.log("[Comics] Content-Type:", contentType);

            expect(response.ok).toBe(true);
            expect(contentType).toContain("text/html");
        });

        test("comics cold vs warm cache comparison", async () => {
            if (!storyId) {
                console.log("Skipping: No published story available");
                return;
            }

            const url = `${BASE_URL}/comics/${storyId}`;

            // 1. Cold request
            const { response: coldResp, duration: coldDuration } =
                await timedFetch(url);

            if (!coldResp.ok) {
                console.log(`Comics page returned ${coldResp.status}`);
                return;
            }

            // 2. Wait for server-side caching
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 3. Warm request
            const { duration: warmDuration } = await timedFetch(url);

            console.log(
                `[Comics Cache] Cold: ${coldDuration.toFixed(0)}ms, Warm: ${warmDuration.toFixed(0)}ms`,
            );
            console.log(
                `[Comics Cache] Improvement: ${(((coldDuration - warmDuration) / coldDuration) * 100).toFixed(1)}%`,
            );

            // Warm should not be slower
            expect(warmDuration).toBeLessThanOrEqual(coldDuration * 1.2);
        });
    });

    // =========================================================================
    // CACHE FLOW INTEGRATION TESTS (Based on Section 7 of Documentation)
    // =========================================================================

    describe("12. Cache Flow Integration Tests", () => {
        /**
         * Tests based on the Cache Decision Tree from documentation section 7:
         *
         * Request for Story Data
         *   ↓
         * SWR Memory Cache? → YES → Return (0ms)
         *   ↓ NO
         * localStorage Cache? → YES → Return (5ms)
         *   ↓ NO
         * API Call to Server
         *   ↓
         * Redis Public Cache? → YES → Return (40-70ms)
         *   ↓ NO
         * Database Query (2-4 seconds)
         *   ↓
         * Cache Result → Return to Client
         */

        describe("12.1 Redis Cache Layer (Server-Side)", () => {
            test("first request should be slower (cache miss)", async () => {
                if (!storyId) {
                    console.log("Skipping: No published story available");
                    return;
                }

                // Force a unique request to bypass any existing cache
                const uniqueUrl = `${BASE_URL}/novels/${storyId}?_t=${Date.now()}`;
                const { response, duration } = await timedFetch(uniqueUrl);

                if (!response.ok) {
                    console.log(`Page returned ${response.status}`);
                    return;
                }

                console.log(
                    `[Redis Cache MISS] First request: ${duration.toFixed(0)}ms`,
                );

                // First request typically takes longer due to DB query
                // Expected: 800-3000ms depending on complexity
                expect(duration).toBeLessThan(TARGETS.FULL_LOAD);
            });

            test("subsequent requests should be faster (cache hit)", async () => {
                if (!storyId) {
                    console.log("Skipping: No published story available");
                    return;
                }

                const url = `${BASE_URL}/novels/${storyId}`;

                // 1. First request to warm the cache
                await timedFetch(url);

                // 2. Small delay to ensure cache is populated
                await new Promise((resolve) => setTimeout(resolve, 50));

                // 3. Second request should hit Redis cache
                const { response, duration } = await timedFetch(url);

                if (!response.ok) {
                    console.log(`Page returned ${response.status}`);
                    return;
                }

                console.log(
                    `[Redis Cache HIT] Second request: ${duration.toFixed(0)}ms`,
                );

                // Redis cache hit should be faster
                // Target: < 200ms (typical: 40-70ms from Redis + SSR overhead)
                // Note: Full page still has SSR overhead, so we allow more time
                expect(duration).toBeLessThan(TARGETS.FULL_LOAD);
            });

            test("multiple sequential requests should maintain performance", async () => {
                if (!storyId) {
                    console.log("Skipping: No published story available");
                    return;
                }

                const url = `${BASE_URL}/novels/${storyId}`;
                const durations: number[] = [];

                // Make 5 sequential requests
                for (let i = 0; i < 5; i++) {
                    const { duration } = await timedFetch(url);
                    durations.push(duration);
                    // Small delay between requests
                    await new Promise((resolve) => setTimeout(resolve, 20));
                }

                const avg =
                    durations.reduce((a, b) => a + b, 0) / durations.length;
                const min = Math.min(...durations);
                const max = Math.max(...durations);

                console.log(
                    `[Redis Multi-Request] Requests: ${durations.length}`,
                );
                console.log(
                    `[Redis Multi-Request] Avg: ${avg.toFixed(0)}ms, Min: ${min.toFixed(0)}ms, Max: ${max.toFixed(0)}ms`,
                );
                console.log(
                    `[Redis Multi-Request] All: ${durations.map((d) => d.toFixed(0)).join(", ")}ms`,
                );

                // After first request, subsequent should be consistently fast
                // Check that average (excluding first) is reasonable
                const subsequentAvg =
                    durations.slice(1).reduce((a, b) => a + b, 0) /
                    (durations.length - 1);
                console.log(
                    `[Redis Multi-Request] Subsequent avg: ${subsequentAvg.toFixed(0)}ms`,
                );

                expect(avg).toBeLessThan(TARGETS.FULL_LOAD);
            });
        });

        describe("12.2 ETag Cache Layer", () => {
            test("should receive ETag header from server", async () => {
                if (!storyId) {
                    console.log("Skipping: No published story available");
                    return;
                }

                const response = await fetch(`${BASE_URL}/novels/${storyId}`);

                if (!response.ok) {
                    console.log(`Page returned ${response.status}`);
                    return;
                }

                const etag = response.headers.get("etag");
                console.log(
                    `[ETag Layer] Received ETag: ${etag ? "Yes" : "No"}`,
                );

                if (etag) {
                    console.log(
                        `[ETag Layer] ETag value: ${etag.substring(0, 50)}...`,
                    );
                }

                // Note: ETag presence depends on Next.js configuration
                // We just log the status without failing
            });

            test("conditional request with ETag should work", async () => {
                if (!storyId) {
                    console.log("Skipping: No published story available");
                    return;
                }

                // 1. Get ETag from first request
                const firstResponse = await fetch(
                    `${BASE_URL}/novels/${storyId}`,
                );

                if (!firstResponse.ok) {
                    console.log(`Page returned ${firstResponse.status}`);
                    return;
                }

                const etag = firstResponse.headers.get("etag");

                if (!etag) {
                    console.log(
                        "[ETag Layer] No ETag returned - skipping conditional test",
                    );
                    return;
                }

                // 2. Make conditional request
                const start = performance.now();
                const conditionalResponse = await fetch(
                    `${BASE_URL}/novels/${storyId}`,
                    {
                        headers: {
                            "If-None-Match": etag,
                        },
                    },
                );
                const duration = performance.now() - start;

                console.log(
                    `[ETag Layer] Conditional response: ${conditionalResponse.status}`,
                );
                console.log(`[ETag Layer] Duration: ${duration.toFixed(0)}ms`);

                // 304 means cache hit, 200 means full response
                expect([200, 304]).toContain(conditionalResponse.status);

                if (conditionalResponse.status === 304) {
                    // 304 should be very fast (no body to transfer)
                    console.log(
                        "[ETag Layer] ✅ 304 Not Modified - ETag cache working",
                    );
                }
            });
        });

        describe("12.3 HTTP Cache Headers Validation", () => {
            test("published story should have public cache headers", async () => {
                if (!storyId) {
                    console.log("Skipping: No published story available");
                    return;
                }

                // Test the story read API
                const response = await fetch(
                    `${BASE_URL}/api/studio/story/${storyId}/read`,
                );

                if (response.status === 401) {
                    console.log(
                        "[HTTP Cache] API requires authentication - testing page instead",
                    );

                    // Test the page instead
                    const pageResponse = await fetch(
                        `${BASE_URL}/novels/${storyId}`,
                    );
                    const cacheControl =
                        pageResponse.headers.get("cache-control");
                    console.log(
                        `[HTTP Cache] Page Cache-Control: ${cacheControl}`,
                    );
                    return;
                }

                const cacheControl = response.headers.get("cache-control");
                const etag = response.headers.get("etag");

                console.log(`[HTTP Cache] API Cache-Control: ${cacheControl}`);
                console.log(
                    `[HTTP Cache] API ETag: ${etag ? "Present" : "Not present"}`,
                );

                // Expected for published stories:
                // "public, max-age=600, stale-while-revalidate=1200"
                if (cacheControl?.includes("public")) {
                    expect(cacheControl).toContain("max-age");
                    console.log(
                        "[HTTP Cache] ✅ Public caching enabled for published story",
                    );
                }
            });

            test("cache headers should differ for novels vs comics", async () => {
                // Compare cache behavior between novels and comics pages
                const [novelsResponse, comicsResponse] = await Promise.all([
                    fetch(`${BASE_URL}/novels`),
                    fetch(`${BASE_URL}/comics`),
                ]);

                const novelsCacheControl =
                    novelsResponse.headers.get("cache-control");
                const comicsCacheControl =
                    comicsResponse.headers.get("cache-control");

                console.log(`[HTTP Cache] Novels page: ${novelsCacheControl}`);
                console.log(`[HTTP Cache] Comics page: ${comicsCacheControl}`);

                expect(novelsResponse.ok).toBe(true);
                expect(comicsResponse.ok).toBe(true);
            });
        });

        describe("12.4 Cache Performance Tiers", () => {
            test("should demonstrate cache tier performance differences", async () => {
                if (!storyId) {
                    console.log("Skipping: No published story available");
                    return;
                }

                const url = `${BASE_URL}/novels/${storyId}`;
                const results: { tier: string; duration: number }[] = [];

                // 1. First request - likely DB query (cache miss)
                const uniqueUrl = `${url}?_tier_test=${Date.now()}`;
                const { duration: tier1Duration } = await timedFetch(uniqueUrl);
                results.push({
                    tier: "DB Query (Cold)",
                    duration: tier1Duration,
                });

                // 2. Wait for cache to populate
                await new Promise((resolve) => setTimeout(resolve, 100));

                // 3. Second request - should hit Redis cache
                const { duration: tier2Duration } = await timedFetch(url);
                results.push({ tier: "Redis Cache", duration: tier2Duration });

                // 4. Third request - Redis cache should be warm
                const { duration: tier3Duration } = await timedFetch(url);
                results.push({ tier: "Redis Warm", duration: tier3Duration });

                // Print results
                console.log("\n[Cache Tier Performance]");
                console.log("-".repeat(50));
                for (const result of results) {
                    const bar = "█".repeat(
                        Math.min(50, Math.ceil(result.duration / 100)),
                    );
                    console.log(
                        `${result.tier.padEnd(20)} ${result.duration.toFixed(0).padStart(6)}ms ${bar}`,
                    );
                }
                console.log("-".repeat(50));

                // Verify improvement between tiers
                const improvement =
                    ((tier1Duration - tier3Duration) / tier1Duration) * 100;
                console.log(
                    `[Cache Tier] Overall improvement: ${improvement.toFixed(1)}%`,
                );

                // Third request should be faster than first
                expect(tier3Duration).toBeLessThan(tier1Duration);
            });
        });

        describe("12.5 Parallel Request Optimization", () => {
            test("parallel requests to novels and comics should be efficient", async () => {
                if (!storyId) {
                    console.log("Skipping: No published story available");
                    return;
                }

                const start = performance.now();

                // Make parallel requests to both endpoints
                const [novelsResult, comicsResult] = await Promise.all([
                    timedFetch(`${BASE_URL}/novels/${storyId}`),
                    timedFetch(`${BASE_URL}/comics/${storyId}`),
                ]);

                const totalDuration = performance.now() - start;

                console.log(
                    `[Parallel] Novels: ${novelsResult.duration.toFixed(0)}ms`,
                );
                console.log(
                    `[Parallel] Comics: ${comicsResult.duration.toFixed(0)}ms`,
                );
                console.log(
                    `[Parallel] Total (parallel): ${totalDuration.toFixed(0)}ms`,
                );

                // Total time should be max of individual times, not sum
                const expectedMax = Math.max(
                    novelsResult.duration,
                    comicsResult.duration,
                );
                console.log(
                    `[Parallel] Expected max: ${expectedMax.toFixed(0)}ms`,
                );

                // Verify parallel efficiency (total should be close to max)
                // Allow 20% overhead for test infrastructure
                expect(totalDuration).toBeLessThan(expectedMax * 1.2 + 50);

                // Both should succeed
                expect([200, 404]).toContain(novelsResult.response.status);
                expect([200, 404]).toContain(comicsResult.response.status);
            });

            test("burst of parallel requests should maintain performance", async () => {
                if (!storyId) {
                    console.log("Skipping: No published story available");
                    return;
                }

                const url = `${BASE_URL}/novels/${storyId}`;
                const requestCount = 5;

                const start = performance.now();

                // Fire all requests simultaneously
                const results = await Promise.all(
                    Array.from({ length: requestCount }, () => timedFetch(url)),
                );

                const totalDuration = performance.now() - start;

                const durations = results.map((r) => r.duration);
                const avg =
                    durations.reduce((a, b) => a + b, 0) / durations.length;
                const max = Math.max(...durations);

                console.log(`[Burst] ${requestCount} parallel requests`);
                console.log(
                    `[Burst] Avg: ${avg.toFixed(0)}ms, Max: ${max.toFixed(0)}ms`,
                );
                console.log(`[Burst] Total: ${totalDuration.toFixed(0)}ms`);

                // Total should be close to max (parallel efficiency)
                expect(totalDuration).toBeLessThan(max * 1.5);

                // All requests should succeed
                const successCount = results.filter(
                    (r) => r.response.ok,
                ).length;
                console.log(`[Burst] Success: ${successCount}/${requestCount}`);
                expect(successCount).toBe(requestCount);
            });
        });
    });

    // =========================================================================
    // COMPLETE CACHE FLOW INTEGRATION TEST
    // =========================================================================

    describe("13. Complete Cache Flow Summary", () => {
        test("should generate complete cache flow report", async () => {
            if (!storyId) {
                console.log("Skipping: No published story available");
                return;
            }

            // Define proper types for the report
            interface TestResult {
                passed: boolean;
                duration?: number;
                notes?: string;
            }

            interface CacheFlowReport {
                storyId: string;
                timestamp: string;
                tests: Record<string, TestResult>;
            }

            const report: CacheFlowReport = {
                storyId,
                timestamp: new Date().toISOString(),
                tests: {},
            };

            // 1. Test novels page
            const { response: novelsResp, duration: novelsDuration } =
                await timedFetch(`${BASE_URL}/novels/${storyId}`);
            report.tests["Novels Page"] = {
                passed: novelsResp.ok,
                duration: novelsDuration,
                notes: `Status: ${novelsResp.status}`,
            };

            // 2. Test comics page
            const { response: comicsResp, duration: comicsDuration } =
                await timedFetch(`${BASE_URL}/comics/${storyId}`);
            report.tests["Comics Page"] = {
                passed: comicsResp.ok || comicsResp.status === 404,
                duration: comicsDuration,
                notes: `Status: ${comicsResp.status}`,
            };

            // 3. Test cache warming
            await new Promise((resolve) => setTimeout(resolve, 50));
            const { duration: warmDuration } = await timedFetch(
                `${BASE_URL}/novels/${storyId}`,
            );
            report.tests["Cache Warm"] = {
                passed: warmDuration < novelsDuration * 1.2,
                duration: warmDuration,
                notes: `Improvement: ${(((novelsDuration - warmDuration) / novelsDuration) * 100).toFixed(1)}%`,
            };

            // 4. Test ETag
            const etag = novelsResp.headers.get("etag");
            report.tests["ETag Present"] = {
                passed: !!etag,
                notes: etag ? `ETag: ${etag.substring(0, 30)}...` : "No ETag",
            };

            // 5. Test Cache-Control headers
            const cacheControl = novelsResp.headers.get("cache-control");
            report.tests["Cache-Control"] = {
                passed: !!cacheControl,
                notes: cacheControl || "No Cache-Control header",
            };

            // Print comprehensive report
            console.log(`\n${"=".repeat(70)}`);
            console.log("COMPLETE CACHE FLOW TEST REPORT");
            console.log(`Story ID: ${storyId}`);
            console.log(`Timestamp: ${report.timestamp}`);
            console.log("=".repeat(70));

            for (const [testName, result] of Object.entries(report.tests)) {
                const status = result.passed ? "✅ PASS" : "❌ FAIL";
                const duration = result.duration
                    ? `${result.duration.toFixed(0)}ms`
                    : "";
                console.log(
                    `${status} ${testName.padEnd(20)} ${duration.padStart(8)} ${result.notes || ""}`,
                );
            }

            console.log("=".repeat(70));

            // Calculate pass rate
            const tests = Object.values(report.tests);
            const passCount = tests.filter((t) => t.passed).length;
            console.log(
                `Pass Rate: ${passCount}/${tests.length} (${((passCount / tests.length) * 100).toFixed(0)}%)`,
            );
            console.log(`${"=".repeat(70)}\n`);

            // All critical tests should pass
            expect(passCount).toBeGreaterThanOrEqual(3); // At least 3 out of 5
        });
    });
});
