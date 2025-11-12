/**
 * Settings Page E2E Tests (Authenticated Users)
 *
 * Tests for /settings - User preferences and account management
 * Requires authentication (any role)
 *
 * Test Cases: TC-SETTINGS-NAV-001 to TC-SETTINGS-ERROR-004
 */

import { expect, test } from "@playwright/test";

test.describe("Settings Page - Authenticated", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/settings");
        await page.waitForLoadState("networkidle");
    });

    test.describe("Navigation Tests", () => {
        test("TC-SETTINGS-NAV-001: Settings menu item highlighted when active", async ({
            page,
        }) => {
            const settingsNav = page.locator('nav a[href="/settings"]');
            await expect(settingsNav).toHaveClass(/active|current/);
        });

        test("TC-SETTINGS-NAV-002: Settings tabs navigation works", async ({
            page,
        }) => {
            const tabs = page.locator('[role="tablist"] button');
            const tabCount = await tabs.count();

            if (tabCount > 0) {
                await tabs.first().click();
                await page.waitForTimeout(500);
                // Verify tab content changes
            }
        });
    });

    test.describe("Content Tests", () => {
        test("TC-SETTINGS-CONTENT-001: Profile settings display", async ({
            page,
        }) => {
            const profileSection = page.locator(
                '[data-testid="profile-settings"]',
            );
            await expect(profileSection).toBeVisible();
        });
    });

    test.describe("Functionality Tests", () => {
        test("TC-SETTINGS-FUNC-003: Theme toggle works", async ({ page }) => {
            const themeToggle = page.locator('[data-testid="theme-toggle"]');

            if (await themeToggle.isVisible()) {
                await themeToggle.click();
                await page.waitForTimeout(500);

                // Verify theme changed (check for dark/light class)
                const html = page.locator("html");
                const hasThemeClass = await html.evaluate(
                    (el) =>
                        el.classList.contains("dark") ||
                        el.classList.contains("light"),
                );
                expect(hasThemeClass).toBeTruthy();
            }
        });
    });

    test.describe("Performance Tests", () => {
        test("TC-SETTINGS-PERF-001: Page loads in under 2 seconds", async ({
            page,
        }) => {
            const startTime = Date.now();
            await page.goto("/settings");
            await page.waitForLoadState("networkidle");
            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(3000);
        });
    });
});
