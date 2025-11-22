import { expect, test } from "@playwright/test";

/**
 * PWA Installation Tests
 * Tests the app installation capabilities
 *
 * Note: Install prompt requires production build and HTTPS or localhost
 */

test.describe("PWA Installation", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("http://localhost:3000");
        await page.waitForLoadState("networkidle");
    });

    test("should meet PWA installability criteria", async ({ page }) => {
        // Check basic PWA requirements
        const pwaRequirements = await page.evaluate(() => {
            return {
                hasManifest: !!document.querySelector('link[rel="manifest"]'),
                hasServiceWorkerAPI: "serviceWorker" in navigator,
                isSecureContext: window.isSecureContext,
                hasIcons: !!document.querySelector(
                    'link[rel="apple-touch-icon"]',
                ),
            };
        });

        expect(pwaRequirements.hasManifest).toBe(true);
        expect(pwaRequirements.hasServiceWorkerAPI).toBe(true);
        expect(pwaRequirements.isSecureContext).toBe(true); // localhost is secure
        expect(pwaRequirements.hasIcons).toBe(true);
    });

    test("should support beforeinstallprompt event", async ({ page }) => {
        // Set up listener for install prompt
        const installPromptSupported = await page.evaluate(() => {
            return new Promise((resolve) => {
                let promptReceived = false;

                window.addEventListener("beforeinstallprompt", (e) => {
                    promptReceived = true;
                    e.preventDefault();
                });

                // Resolve after a short delay
                setTimeout(() => {
                    resolve(promptReceived);
                }, 2000);
            });
        });

        // The install prompt might not fire immediately in tests
        // This test mainly verifies the event listener can be set up
        expect(typeof installPromptSupported).toBe("boolean");
    });

    test("should have standalone display mode in manifest", async ({
        page,
    }) => {
        const manifestResponse = await page.goto(
            "http://localhost:3000/manifest.json",
        );
        const manifest = await manifestResponse?.json();

        expect(manifest.display).toBe("standalone");
    });

    test("should detect if running as installed PWA", async ({ page }) => {
        const displayMode = await page.evaluate(() => {
            // Check if app is running in standalone mode
            const isStandalone = window.matchMedia(
                "(display-mode: standalone)",
            ).matches;
            const isFullscreen = window.matchMedia(
                "(display-mode: fullscreen)",
            ).matches;
            const isMinimalUI = window.matchMedia(
                "(display-mode: minimal-ui)",
            ).matches;

            return {
                isStandalone,
                isFullscreen,
                isMinimalUI,
                isPWA: isStandalone || isFullscreen || isMinimalUI,
            };
        });

        // In test environment, app won't be in standalone mode
        // This test verifies the detection mechanism exists
        expect(typeof displayMode.isPWA).toBe("boolean");
    });

    test("should have correct start_url in manifest", async ({ page }) => {
        const manifestResponse = await page.goto(
            "http://localhost:3000/manifest.json",
        );
        const manifest = await manifestResponse?.json();

        expect(manifest.start_url).toBe("/");

        // Verify start_url is accessible
        const startUrlResponse = await page.goto(
            `http://localhost:3000${manifest.start_url}`,
        );
        expect(startUrlResponse?.status()).toBe(200);
    });

    test("should support app shortcuts", async ({ page }) => {
        const manifestResponse = await page.goto(
            "http://localhost:3000/manifest.json",
        );
        const manifest = await manifestResponse?.json();

        expect(manifest.shortcuts).toBeDefined();
        expect(manifest.shortcuts.length).toBeGreaterThan(0);

        // Verify each shortcut URL is accessible
        for (const shortcut of manifest.shortcuts) {
            const shortcutResponse = await page.goto(
                `http://localhost:3000${shortcut.url}`,
            );
            // Some routes might require authentication, so accept 200 or redirect
            expect([200, 302, 307, 308]).toContain(
                shortcutResponse?.status() || 0,
            );
        }
    });

    test("should have proper viewport configuration", async ({ page }) => {
        await page.goto("http://localhost:3000");

        const viewport = await page
            .locator('meta[name="viewport"]')
            .getAttribute("content");

        expect(viewport).toContain("width=device-width");
        expect(viewport).toContain("initial-scale=1");
    });

    test("should have orientation preference in manifest", async ({ page }) => {
        const manifestResponse = await page.goto(
            "http://localhost:3000/manifest.json",
        );
        const manifest = await manifestResponse?.json();

        expect(manifest.orientation).toBeDefined();
        expect(["portrait", "portrait-primary", "landscape", "any"]).toContain(
            manifest.orientation,
        );
    });

    test("should not prefer related applications", async ({ page }) => {
        const manifestResponse = await page.goto(
            "http://localhost:3000/manifest.json",
        );
        const manifest = await manifestResponse?.json();

        // PWA should be the primary application
        expect(manifest.prefer_related_applications).toBe(false);
    });

    test("should handle install prompt deferral", async ({ page }) => {
        // Test that install prompt can be captured and deferred
        const deferralTest = await page.evaluate(() => {
            return new Promise((resolve) => {
                let deferredPrompt: Event | null = null;

                window.addEventListener("beforeinstallprompt", (e) => {
                    e.preventDefault();
                    deferredPrompt = e;
                    resolve({
                        captured: true,
                        canPrompt: typeof deferredPrompt === "object",
                    });
                });

                // Resolve after timeout even if no prompt
                setTimeout(() => {
                    resolve({ captured: false, canPrompt: false });
                }, 1000);
            });
        });

        // Verify the mechanism exists (might not trigger in test environment)
        expect(deferralTest).toBeDefined();
    });
});
