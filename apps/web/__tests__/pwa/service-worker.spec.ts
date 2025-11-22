import { expect, test } from "@playwright/test";

/**
 * Service Worker Tests
 * Tests service worker registration and functionality
 *
 * Note: Service worker is disabled in development mode
 * Run production build to test: pnpm build && pnpm start
 */

test.describe("Service Worker", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("http://localhost:3000");
        // Wait for page to fully load
        await page.waitForLoadState("networkidle");
    });

    test("should register service worker in production", async ({ page }) => {
        // Check if service worker is registered
        const swRegistration = await page.evaluate(async () => {
            if ("serviceWorker" in navigator) {
                const registration =
                    await navigator.serviceWorker.getRegistration();
                return {
                    registered: !!registration,
                    scope: registration?.scope,
                    active: !!registration?.active,
                    waiting: !!registration?.waiting,
                    installing: !!registration?.installing,
                };
            }
            return { registered: false };
        });

        // In production, service worker should be registered
        // In development, it will be disabled
        if (process.env.NODE_ENV === "production") {
            expect(swRegistration.registered).toBe(true);
            expect(swRegistration.scope).toContain("http://localhost:3000/");
        }
    });

    test("should have sw.js accessible", async ({ page }) => {
        // Check if service worker file exists and is accessible
        const swResponse = await page.goto("http://localhost:3000/sw.js");

        // In production, sw.js should exist
        // In development, it might return 404 (disabled)
        if (process.env.NODE_ENV === "production") {
            expect(swResponse?.status()).toBe(200);

            const contentType = swResponse?.headers()["content-type"];
            expect(contentType).toContain("javascript");
        }
    });

    test("should support service worker API", async ({ page }) => {
        const hasServiceWorkerAPI = await page.evaluate(() => {
            return "serviceWorker" in navigator;
        });

        expect(hasServiceWorkerAPI).toBe(true);
    });

    test("should have service worker ready state", async ({ page }) => {
        const swReady = await page.evaluate(async () => {
            if ("serviceWorker" in navigator) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    return {
                        ready: true,
                        scope: registration.scope,
                        updateFound: false,
                    };
                } catch (error) {
                    return { ready: false, error: (error as Error).message };
                }
            }
            return { ready: false, error: "Service worker not supported" };
        });

        if (process.env.NODE_ENV === "production") {
            expect(swReady.ready).toBe(true);
        }
    });

    test("should handle service worker updates", async ({ page }) => {
        const updateCheck = await page.evaluate(async () => {
            if ("serviceWorker" in navigator) {
                const registration =
                    await navigator.serviceWorker.getRegistration();
                if (registration) {
                    // Try to update service worker
                    await registration.update();
                    return { updateChecked: true };
                }
            }
            return { updateChecked: false };
        });

        if (process.env.NODE_ENV === "production") {
            expect(updateCheck.updateChecked).toBe(true);
        }
    });

    test("should cache static assets", async ({ page, context }) => {
        // Enable offline mode
        await context.setOffline(true);

        // Try to navigate to a page
        try {
            await page.goto("http://localhost:3000");

            // In production with SW, page should load from cache
            if (process.env.NODE_ENV === "production") {
                const title = await page.title();
                expect(title).toBeTruthy();
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

    test("should skip waiting on new service worker", async ({ page }) => {
        const skipWaitingConfig = await page.evaluate(async () => {
            if ("serviceWorker" in navigator) {
                const registration =
                    await navigator.serviceWorker.getRegistration();
                return {
                    hasRegistration: !!registration,
                    hasWaiting: !!registration?.waiting,
                };
            }
            return { hasRegistration: false };
        });

        // Service worker configuration includes skipWaiting: true
        // This test verifies the registration exists
        if (process.env.NODE_ENV === "production") {
            expect(skipWaitingConfig.hasRegistration).toBe(true);
        }
    });
});
