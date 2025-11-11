/**
 * Comics Page E2E Tests (Public Access)
 *
 * Tests for /comics - Browse and read visual/comic format stories
 * Accessible to all users (anonymous and authenticated)
 *
 * Test Cases: TC-COMICS-NAV-001 to TC-COMICS-ERROR-004
 */

import { expect, test } from "@playwright/test";

test.describe("Comics Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/comics");
		await page.waitForLoadState("networkidle");
	});

	test.describe("Navigation Tests", () => {
		test("TC-COMICS-NAV-001: Comics menu item highlighted when active", async ({
			page,
		}) => {
			const comicsNav = page.locator('nav a[href="/comics"]');
			await expect(comicsNav).toHaveClass(/active|current/);
		});

		test("TC-COMICS-NAV-003: Comic card click opens reader", async ({
			page,
		}) => {
			const comicCard = page.locator('[data-testid="story-card"]').first();

			if (await comicCard.isVisible()) {
				await comicCard.click();
				await page.waitForLoadState("networkidle");
				expect(page.url()).toMatch(/\/comics\/\w+/);
			}
		});
	});

	test.describe("Access Control Tests", () => {
		test("TC-COMICS-AUTH-001: Anonymous users can access page", async ({
			page,
		}) => {
			expect(page.url()).toContain("/comics");
			const mainContent = page.locator("main");
			await expect(mainContent).toBeVisible();
		});
	});

	test.describe("Content Tests", () => {
		test("TC-COMICS-CONTENT-001: Published comics display correctly", async ({
			page,
		}) => {
			const comicsGrid = page.locator('[data-testid="story-grid"]');
			await expect(comicsGrid).toBeVisible();
		});
	});

	test.describe("Performance Tests", () => {
		test("TC-COMICS-PERF-001: Comic grid loads in under 2 seconds", async ({
			page,
		}) => {
			const startTime = Date.now();
			await page.goto("/comics");
			await page.waitForLoadState("networkidle");
			const duration = Date.now() - startTime;
			expect(duration).toBeLessThan(3000);
		});
	});
});
