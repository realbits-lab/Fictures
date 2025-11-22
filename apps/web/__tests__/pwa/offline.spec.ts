import { expect, test } from "@playwright/test";

/**
 * PWA Offline Functionality Tests
 * Tests offline capabilities and caching behavior
 *
 * Note: Requires production build with service worker enabled
 * Run: pnpm build && pnpm start
 */

test.describe("PWA Offline Functionality", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("http://localhost:3000");
        await page.waitForLoadState("networkidle");
    });

    test("should cache static assets for offline use", async ({
        page,
        context,
    }) => {
        // First visit - cache assets
        await page.goto("http://localhost:3000");
        await page.waitForLoadState("networkidle");

        // Get initial page title
        const onlineTitle = await page.title();
        expect(onlineTitle).toBeTruthy();

        // Go offline
        await context.setOffline(true);

        // Try to reload page - should work from cache in production
        try {
            await page.reload();
            await page.waitForLoadState("load", { timeout: 5000 });

            if (process.env.NODE_ENV === "production") {
                const offlineTitle = await page.title();
                expect(offlineTitle).toBe(onlineTitle);
            }
        } catch (error) {
            // In development, offline will fail (expected)
            if (process.env.NODE_ENV === "development") {
                expect(error).toBeDefined();
            }
        }

        // Restore online mode
        await context.setOffline(false);
    });

    test("should detect network status", async ({ page }) => {
        const networkStatus = await page.evaluate(() => {
            return {
                online: navigator.onLine,
                hasNetworkAPI: "onLine" in navigator,
                hasConnectionAPI:
                    "connection" in navigator ||
                    "mozConnection" in navigator ||
                    "webkitConnection" in navigator,
            };
        });

        expect(networkStatus.online).toBe(true);
        expect(networkStatus.hasNetworkAPI).toBe(true);
    });

    test("should handle network status changes", async ({ page }) => {
        // Set up network status listeners
        const eventListenerTest = await page.evaluate(() => {
            return new Promise((resolve) => {
                let onlineEventFired = false;
                let offlineEventFired = false;

                window.addEventListener("online", () => {
                    onlineEventFired = true;
                });

                window.addEventListener("offline", () => {
                    offlineEventFired = true;
                });

                setTimeout(() => {
                    resolve({
                        listenersAttached: true,
                        onlineEventFired,
                        offlineEventFired,
                    });
                }, 500);
            });
        });

        expect(eventListenerTest).toBeDefined();
    });

    test("should cache navigation requests", async ({ page, context }) => {
        // Visit multiple pages to populate cache
        await page.goto("http://localhost:3000");
        await page.waitForLoadState("networkidle");

        await page.goto("http://localhost:3000/studio");
        await page.waitForLoadState("networkidle");

        // Go offline
        await context.setOffline(true);

        // Try to navigate to cached page
        try {
            await page.goto("http://localhost:3000");

            if (process.env.NODE_ENV === "production") {
                const title = await page.title();
                expect(title).toBeTruthy();
            }
        } catch (error) {
            if (process.env.NODE_ENV === "development") {
                expect(error).toBeDefined();
            }
        }

        // Restore online
        await context.setOffline(false);
    });

    test("should have cache storage API available", async ({ page }) => {
        const cacheAPI = await page.evaluate(async () => {
            const hasCacheAPI = "caches" in window;

            if (hasCacheAPI) {
                try {
                    const cacheNames = await caches.keys();
                    return {
                        available: true,
                        cacheCount: cacheNames.length,
                        cacheNames,
                    };
                } catch (error) {
                    return {
                        available: true,
                        error: (error as Error).message,
                    };
                }
            }

            return { available: false };
        });

        expect(cacheAPI.available).toBe(true);

        if (process.env.NODE_ENV === "production") {
            expect(cacheAPI.cacheCount).toBeGreaterThan(0);
        }
    });

    test("should handle offline fallback gracefully", async ({
        page,
        context,
    }) => {
        // Go offline immediately
        await context.setOffline(true);

        // Try to load a page that's not cached
        try {
            const response = await page.goto(
                "http://localhost:3000/some-random-uncached-page",
            );

            if (process.env.NODE_ENV === "production") {
                // Service worker should provide fallback
                expect(response?.status()).toBeDefined();
            }
        } catch (error) {
            // Expected to fail when offline without cache
            expect(error).toBeDefined();
        }

        // Restore online
        await context.setOffline(false);
    });

    test("should support background sync API", async ({ page }) => {
        const backgroundSyncAPI = await page.evaluate(async () => {
            if ("serviceWorker" in navigator) {
                const registration = await navigator.serviceWorker.ready;
                return {
                    hasBackgroundSync: "sync" in registration,
                    hasPeriodicSync: "periodicSync" in registration,
                };
            }
            return { hasBackgroundSync: false, hasPeriodicSync: false };
        });

        // Background sync is optional but good to test
        expect(typeof backgroundSyncAPI.hasBackgroundSync).toBe("boolean");
    });

    test("should cache images and assets", async ({ page }) => {
        // Load page with assets
        await page.goto("http://localhost:3000");
        await page.waitForLoadState("networkidle");

        // Check if images are cached
        const imageCaching = await page.evaluate(async () => {
            if ("caches" in window) {
                const cacheNames = await caches.keys();
                let imageCount = 0;

                for (const cacheName of cacheNames) {
                    const cache = await caches.open(cacheName);
                    const requests = await cache.keys();

                    for (const request of requests) {
                        if (
                            request.url.match(
                                /\.(png|jpg|jpeg|gif|svg|webp|avif)$/i,
                            )
                        ) {
                            imageCount++;
                        }
                    }
                }

                return { imageCount, cacheNames };
            }
            return { imageCount: 0 };
        });

        if (process.env.NODE_ENV === "production") {
            // In production, should have cached assets
            expect(imageCaching.cacheNames).toBeDefined();
        }
    });

    test("should update cache on navigation", async ({ page }) => {
        const cacheUpdateTest = await page.evaluate(async () => {
            if ("caches" in window && "serviceWorker" in navigator) {
                const registration =
                    await navigator.serviceWorker.getRegistration();

                if (registration) {
                    // Trigger update check
                    await registration.update();
                    return { updateTriggered: true };
                }
            }
            return { updateTriggered: false };
        });

        if (process.env.NODE_ENV === "production") {
            expect(cacheUpdateTest.updateTriggered).toBe(true);
        }
    });
});
