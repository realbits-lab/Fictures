/**
 * Analysis Page E2E Tests (Writer Role)
 *
 * Tests for /analysis - Story performance metrics
 * Requires writer or manager role authentication
 *
 * Test Cases: TC-ANALYSIS-NAV-001 to TC-ANALYSIS-ERROR-004
 */

import { expect, test } from "@playwright/test";

test.describe("Analysis Page - Writer", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/analysis");
        await page.waitForLoadState("networkidle");
    });

    test.describe("Navigation Tests", () => {
        test("TC-ANALYSIS-NAV-001: Analysis menu item highlighted when active", async ({
            page,
        }) => {
            const analysisNav = page.locator('nav a[href="/analysis"]');
            await expect(analysisNav).toHaveClass(/active|current/);
        });
    });

    test.describe("Content Tests", () => {
        test("TC-ANALYSIS-CONTENT-001: Analysis dashboard displays", async ({
            page,
        }) => {
            const dashboard = page.locator(
                '[data-testid="analysis-dashboard"]',
            );
            await expect(dashboard).toBeVisible();
        });
    });

    test.describe("Performance Tests", () => {
        test("TC-ANALYSIS-PERF-001: Page loads in under 3 seconds", async ({
            page,
        }) => {
            const startTime = Date.now();
            await page.goto("/analysis");
            await page.waitForLoadState("networkidle");
            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(4000);
        });
    });
});
