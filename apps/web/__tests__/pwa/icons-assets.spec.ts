import { expect, test } from "@playwright/test";

/**
 * PWA Icons and Assets Tests
 * Tests icon availability and asset loading
 */

test.describe("PWA Icons and Assets", () => {
    const iconSizes = [
        "72x72",
        "96x96",
        "128x128",
        "144x144",
        "152x152",
        "192x192",
        "384x384",
        "512x512",
    ];

    test.beforeEach(async ({ page }) => {
        await page.goto("http://localhost:3000");
    });

    test("should have all standard icons accessible", async ({ page }) => {
        for (const size of iconSizes) {
            const iconUrl = `http://localhost:3000/icons/icon-${size}.png`;
            const response = await page.goto(iconUrl);

            expect(response?.status()).toBe(200);

            const contentType = response?.headers()["content-type"];
            expect(contentType).toContain("image/png");

            // Verify image has actual content
            const buffer = await response?.body();
            expect(buffer?.length).toBeGreaterThan(0);
        }
    });

    test("should have maskable icons", async ({ page }) => {
        const maskableSizes = ["192x192", "512x512"];

        for (const size of maskableSizes) {
            const iconUrl = `http://localhost:3000/icons/icon-${size}-maskable.png`;
            const response = await page.goto(iconUrl);

            expect(response?.status()).toBe(200);
            expect(response?.headers()["content-type"]).toContain("image/png");
        }
    });

    test("should have apple-touch-icon", async ({ page }) => {
        const response = await page.goto(
            "http://localhost:3000/icons/apple-touch-icon.png",
        );

        expect(response?.status()).toBe(200);
        expect(response?.headers()["content-type"]).toContain("image/png");

        // Verify reasonable file size (should be > 1KB for a proper icon)
        const buffer = await response?.body();
        expect(buffer?.length).toBeGreaterThan(1000);
    });

    test("should have favicon.ico", async ({ page }) => {
        const response = await page.goto("http://localhost:3000/favicon.ico");

        expect(response?.status()).toBe(200);

        // Favicon can be various types
        const contentType = response?.headers()["content-type"];
        expect(contentType).toBeDefined();
    });

    test("should load icons with correct dimensions", async ({ page }) => {
        // Test a few key icon sizes
        const testSizes = [
            { size: "192x192", width: 192, height: 192 },
            { size: "512x512", width: 512, height: 512 },
        ];

        for (const { size, width, height } of testSizes) {
            const iconUrl = `/icons/icon-${size}.png`;

            await page.goto("http://localhost:3000");

            const dimensions = await page.evaluate(async (url) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        resolve({ width: img.width, height: img.height });
                    };
                    img.onerror = () => {
                        resolve({ width: 0, height: 0 });
                    };
                    img.src = url;
                });
            }, iconUrl);

            expect(dimensions).toEqual({ width, height });
        }
    });

    test("should have proper icon file sizes", async ({ page }) => {
        // Icons should increase in file size with dimensions
        const iconData: Array<{ size: string; bytes: number }> = [];

        for (const size of iconSizes) {
            const response = await page.goto(
                `http://localhost:3000/icons/icon-${size}.png`,
            );
            const buffer = await response?.body();

            if (buffer) {
                iconData.push({ size, bytes: buffer.length });
            }
        }

        // Verify we got data for all icons
        expect(iconData.length).toBe(iconSizes.length);

        // Larger icons should generally have larger file sizes
        const size192 = iconData.find((d) => d.size === "192x192");
        const size72 = iconData.find((d) => d.size === "72x72");

        if (size192 && size72) {
            expect(size192.bytes).toBeGreaterThan(size72.bytes);
        }
    });

    test("should have manifest referencing all icons", async ({ page }) => {
        const manifestResponse = await page.goto(
            "http://localhost:3000/manifest.json",
        );
        const manifest = await manifestResponse?.json();

        // Verify all icons in manifest are accessible
        for (const icon of manifest.icons) {
            const iconResponse = await page.goto(
                `http://localhost:3000${icon.src}`,
            );
            expect(iconResponse?.status()).toBe(200);
        }
    });

    test("should have proper icon MIME types", async ({ page }) => {
        const manifestResponse = await page.goto(
            "http://localhost:3000/manifest.json",
        );
        const manifest = await manifestResponse?.json();

        for (const icon of manifest.icons) {
            expect(icon.type).toBe("image/png");
            expect(icon.sizes).toMatch(/^\d+x\d+$/);
        }
    });

    test("should support both any and maskable icon purposes", async ({
        page,
    }) => {
        const manifestResponse = await page.goto(
            "http://localhost:3000/manifest.json",
        );
        const manifest = await manifestResponse?.json();

        const purposes = manifest.icons.map(
            (icon: { purpose: string }) => icon.purpose,
        );

        expect(purposes).toContain("any");
        expect(purposes).toContain("maskable");
    });

    test("should have icons optimized for mobile devices", async ({ page }) => {
        const manifestResponse = await page.goto(
            "http://localhost:3000/manifest.json",
        );
        const manifest = await manifestResponse?.json();

        // Check for common mobile icon sizes
        const mobileSizes = ["144x144", "152x152", "192x192"];
        const availableSizes = manifest.icons.map(
            (icon: { sizes: string }) => icon.sizes,
        );

        for (const size of mobileSizes) {
            expect(availableSizes).toContain(size);
        }
    });

    test("should have high-resolution icons for modern displays", async ({
        page,
    }) => {
        const manifestResponse = await page.goto(
            "http://localhost:3000/manifest.json",
        );
        const manifest = await manifestResponse?.json();

        // Check for high-resolution icons (384x384, 512x512)
        const highResSizes = ["384x384", "512x512"];
        const availableSizes = manifest.icons.map(
            (icon: { sizes: string }) => icon.sizes,
        );

        for (const size of highResSizes) {
            expect(availableSizes).toContain(size);
        }
    });

    test("should have icons cached after first load", async ({ page }) => {
        // Load the page
        await page.goto("http://localhost:3000");
        await page.waitForLoadState("networkidle");

        // Check cache storage for icons
        const cachedIcons = await page.evaluate(async () => {
            if ("caches" in window) {
                const cacheNames = await caches.keys();
                const iconUrls: string[] = [];

                for (const cacheName of cacheNames) {
                    const cache = await caches.open(cacheName);
                    const requests = await cache.keys();

                    for (const request of requests) {
                        if (request.url.includes("/icons/")) {
                            iconUrls.push(request.url);
                        }
                    }
                }

                return { iconUrls, count: iconUrls.length };
            }
            return { iconUrls: [], count: 0 };
        });

        // In production, icons should be cached
        if (process.env.NODE_ENV === "production") {
            expect(cachedIcons.count).toBeGreaterThan(0);
        }
    });

    test("should have shortcut icons accessible", async ({ page }) => {
        const manifestResponse = await page.goto(
            "http://localhost:3000/manifest.json",
        );
        const manifest = await manifestResponse?.json();

        for (const shortcut of manifest.shortcuts) {
            for (const icon of shortcut.icons) {
                const iconResponse = await page.goto(
                    `http://localhost:3000${icon.src}`,
                );
                expect(iconResponse?.status()).toBe(200);
            }
        }
    });
});
