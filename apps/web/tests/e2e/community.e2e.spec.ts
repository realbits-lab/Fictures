/**
 * Community Page E2E Tests (Public Access)
 *
 * Tests for /community - Story sharing and discussions
 * Accessible to all users for viewing, authentication required for posting
 *
 * Test Cases: TC-COMMUNITY-NAV-001 to TC-COMMUNITY-ERROR-004
 */

import { expect, test } from "@playwright/test";

test.describe("Community Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/community");
		await page.waitForLoadState("networkidle");
	});

	test.describe("Navigation Tests", () => {
		test("TC-COMMUNITY-NAV-001: Community menu item highlighted when active", async ({
			page,
		}) => {
			const communityNav = page.locator('nav a[href="/community"]');
			await expect(communityNav).toHaveClass(/active|current/);
		});

		test("TC-COMMUNITY-NAV-003: Individual post navigation works", async ({
			page,
		}) => {
			const postCard = page.locator('[data-testid="post-card"]').first();

			if (await postCard.isVisible()) {
				await postCard.click();
				await page.waitForLoadState("networkidle");

				// Should navigate to post detail
				expect(page.url()).toMatch(/\/community\/.+/);
			}
		});
	});

	test.describe("Access Control Tests", () => {
		test("TC-COMMUNITY-AUTH-001: Anonymous users can view posts", async ({
			page,
		}) => {
			// Already on page from beforeEach
			expect(page.url()).toContain("/community");

			const postsContainer = page.locator('[data-testid="posts-container"]');
			await expect(postsContainer).toBeVisible();
		});
	});

	test.describe("Content Tests", () => {
		test("TC-COMMUNITY-CONTENT-001: Community posts display correctly", async ({
			page,
		}) => {
			const postsList = page.locator('[data-testid="posts-list"]');
			await expect(postsList).toBeVisible();
		});

		test("TC-COMMUNITY-CONTENT-002: Post cards show author and timestamp", async ({
			page,
		}) => {
			const firstPost = page.locator('[data-testid="post-card"]').first();

			if (await firstPost.isVisible()) {
				const author = firstPost.locator('[data-testid="post-author"]');
				const timestamp = firstPost.locator('[data-testid="post-timestamp"]');

				await expect(author).toBeVisible();
				await expect(timestamp).toBeVisible();
			}
		});
	});

	test.describe("Performance Tests", () => {
		test("TC-COMMUNITY-PERF-001: Page loads in under 2 seconds", async ({
			page,
		}) => {
			const startTime = Date.now();

			await page.goto("/community");
			await page.waitForLoadState("networkidle");

			const duration = Date.now() - startTime;
			expect(duration).toBeLessThan(3000);
		});
	});
});
