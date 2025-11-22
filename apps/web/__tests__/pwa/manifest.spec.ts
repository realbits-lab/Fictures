import { expect, test } from "@playwright/test";

/**
 * PWA Manifest Tests
 * Tests the web app manifest configuration
 */

test.describe("PWA Manifest", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("http://localhost:3000");
    });

    test("should have valid manifest.json", async ({ page }) => {
        // Fetch the manifest
        const manifestResponse = await page.goto(
            "http://localhost:3000/manifest.json",
        );
        expect(manifestResponse?.status()).toBe(200);

        const manifest = await manifestResponse?.json();

        // Validate required fields
        expect(manifest.name).toBe("Fictures - AI-Powered Story Creation");
        expect(manifest.short_name).toBe("Fictures");
        expect(manifest.description).toContain("AI-powered content creation");
        expect(manifest.start_url).toBe("/");
        expect(manifest.display).toBe("standalone");
        expect(manifest.background_color).toBe("#ffffff");
        expect(manifest.theme_color).toBe("#000000");
        expect(manifest.orientation).toBe("portrait-primary");
    });

    test("should have all required icons", async ({ page }) => {
        const manifestResponse = await page.goto(
            "http://localhost:3000/manifest.json",
        );
        const manifest = await manifestResponse?.json();

        // Check icon array exists and has correct count
        expect(manifest.icons).toBeDefined();
        expect(manifest.icons.length).toBe(10); // 8 standard + 2 maskable

        // Validate icon sizes
        const expectedSizes = [
            "72x72",
            "96x96",
            "128x128",
            "144x144",
            "152x152",
            "192x192",
            "384x384",
            "512x512",
            "192x192",
            "512x512",
        ];

        for (let i = 0; i < manifest.icons.length; i++) {
            const icon = manifest.icons[i];
            expect(icon.sizes).toBe(expectedSizes[i]);
            expect(icon.type).toBe("image/png");
            expect(icon.src).toContain("/icons/icon-");

            // Verify icon is accessible
            const iconResponse = await page.goto(
                `http://localhost:3000${icon.src}`,
            );
            expect(iconResponse?.status()).toBe(200);
        }
    });

    test("should have app shortcuts configured", async ({ page }) => {
        const manifestResponse = await page.goto(
            "http://localhost:3000/manifest.json",
        );
        const manifest = await manifestResponse?.json();

        // Validate shortcuts
        expect(manifest.shortcuts).toBeDefined();
        expect(manifest.shortcuts.length).toBe(2);

        // Studio shortcut
        expect(manifest.shortcuts[0].name).toBe("Studio");
        expect(manifest.shortcuts[0].url).toBe("/studio");
        expect(manifest.shortcuts[0].icons).toBeDefined();

        // Library shortcut
        expect(manifest.shortcuts[1].name).toBe("Library");
        expect(manifest.shortcuts[1].url).toBe("/library");
        expect(manifest.shortcuts[1].icons).toBeDefined();
    });

    test("should have correct categories", async ({ page }) => {
        const manifestResponse = await page.goto(
            "http://localhost:3000/manifest.json",
        );
        const manifest = await manifestResponse?.json();

        expect(manifest.categories).toBeDefined();
        expect(manifest.categories).toEqual([
            "entertainment",
            "productivity",
            "education",
        ]);
    });

    test("should have manifest link in HTML head", async ({ page }) => {
        await page.goto("http://localhost:3000");

        // Check manifest link tag
        const manifestLink = await page
            .locator('link[rel="manifest"]')
            .getAttribute("href");
        expect(manifestLink).toBe("/manifest.json");
    });

    test("should have theme-color meta tag", async ({ page }) => {
        await page.goto("http://localhost:3000");

        const themeColor = await page
            .locator('meta[name="theme-color"]')
            .getAttribute("content");
        expect(themeColor).toBe("#000000");
    });

    test("should have apple-touch-icon", async ({ page }) => {
        await page.goto("http://localhost:3000");

        const appleTouchIcon = await page
            .locator('link[rel="apple-touch-icon"]')
            .getAttribute("href");
        expect(appleTouchIcon).toBe("/icons/apple-touch-icon.png");

        // Verify icon is accessible
        const iconResponse = await page.goto(
            "http://localhost:3000/icons/apple-touch-icon.png",
        );
        expect(iconResponse?.status()).toBe(200);
    });

    test("should have mobile-web-app-capable meta tag", async ({ page }) => {
        await page.goto("http://localhost:3000");

        const mobileCapable = await page
            .locator('meta[name="mobile-web-app-capable"]')
            .getAttribute("content");
        expect(mobileCapable).toBe("yes");
    });
});
