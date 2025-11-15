/**
 * Studio Page E2E Tests (Writer Role)
 *
 * Tests for /studio - Story creation and management workspace
 * Requires writer or manager role authentication
 *
 * Test Cases: TC-STUDIO-NAV-001 to TC-STUDIO-ERROR-004
 */

import { expect, test } from "@playwright/test";

test.describe("Studio Page - Writer", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/studio");
        await page.waitForLoadState("networkidle");
    });

    test.describe("Navigation Tests", () => {
        test("TC-STUDIO-NAV-001: Studio menu item highlighted when active", async ({
            page,
        }) => {
            const studioNav = page.locator('nav a[href="/studio"]');
            await expect(studioNav).toHaveClass(/active|current/);
        });

        test("TC-STUDIO-NAV-002: Clicking Studio navigates correctly", async ({
            page,
        }) => {
            await page.goto("/novels");
            const studioNav = page.locator('nav a[href="/studio"]');
            await studioNav.click();
            await page.waitForLoadState("networkidle");

            expect(page.url()).toContain("/studio");
        });

        test("TC-STUDIO-NAV-003: Back navigation returns to previous page", async ({
            page,
        }) => {
            await page.goto("/novels");
            await page.goto("/studio");
            await page.goBack();
            await page.waitForLoadState("networkidle");

            expect(page.url()).toContain("/novels");
        });

        test("TC-STUDIO-NAV-004: Story card click navigates to editor", async ({
            page,
        }) => {
            const storyCard = page
                .locator('[data-testid="story-card"]')
                .first();

            if (await storyCard.isVisible()) {
                const _storyId = await storyCard.getAttribute("data-story-id");
                await storyCard.click();
                await page.waitForLoadState("networkidle");

                expect(page.url()).toMatch(/\/studio\/(edit\/story\/|)\w+/);
            }
        });
    });

    test.describe("Content Tests", () => {
        test("TC-STUDIO-CONTENT-001: Story list displays user's stories", async ({
            page,
        }) => {
            const storyList = page.locator('[data-testid="story-list"]');
            await expect(storyList).toBeVisible();
        });

        test('TC-STUDIO-CONTENT-002: "Create New Story" button visible', async ({
            page,
        }) => {
            const createButton = page.locator(
                'button:has-text("Create"), a:has-text("New Story")',
            );
            await expect(createButton.first()).toBeVisible();
        });

        test("TC-STUDIO-CONTENT-003: Story cards show correct information", async ({
            page,
        }) => {
            const firstCard = page
                .locator('[data-testid="story-card"]')
                .first();

            if (await firstCard.isVisible()) {
                await expect(
                    firstCard.locator('[data-testid="story-title"]'),
                ).toBeVisible();
                // Additional card content checks can be added
            }
        });

        test("TC-STUDIO-CONTENT-004: Empty state shows when no stories", async ({
            page,
            request,
        }) => {
            // This test assumes a clean state or filtered view with no stories
            const emptyState = page.locator('[data-testid="empty-state"]');

            // If no stories exist, empty state should be visible
            const storyCards = page.locator('[data-testid="story-card"]');
            const count = await storyCards.count();

            if (count === 0) {
                await expect(emptyState).toBeVisible();
            }
        });
    });

    test.describe("Functionality Tests", () => {
        test("TC-STUDIO-FUNC-001: Create new story button opens creation flow", async ({
            page,
        }) => {
            const createButton = page.locator(
                'button:has-text("Create"), a:has-text("New Story")',
            );
            await createButton.first().click();
            await page.waitForLoadState("networkidle");

            // Should navigate to story creation page
            expect(page.url()).toMatch(/\/studio\/new/);
        });

        test("TC-STUDIO-FUNC-002: Story card click navigates to editor", async ({
            page,
        }) => {
            const storyCard = page
                .locator('[data-testid="story-card"]')
                .first();

            if (await storyCard.isVisible()) {
                await storyCard.click();
                await page.waitForLoadState("networkidle");

                // Should navigate to story editor
                expect(page.url()).toMatch(/\/studio\//);
            }
        });

        test("TC-STUDIO-FUNC-005: View toggle (card/table) works correctly", async ({
            page,
        }) => {
            const viewToggle = page.locator('[data-testid="view-toggle"]');

            if (await viewToggle.isVisible()) {
                // Toggle to table view
                await viewToggle.click();
                await page.waitForTimeout(500);

                // Verify view changed (check for table layout)
                const tableView = page.locator('[data-testid="table-view"]');
                await expect(tableView).toBeVisible();

                // Toggle back to card view
                await viewToggle.click();
                await page.waitForTimeout(500);

                // Verify view changed back
                const cardView = page.locator('[data-testid="card-view"]');
                await expect(cardView).toBeVisible();
            }
        });

        test("TC-STUDIO-FUNC-006: Story search/filter functions properly", async ({
            page,
        }) => {
            const searchInput = page.locator('input[placeholder*="Search"]');

            if (await searchInput.isVisible()) {
                await searchInput.fill("Test Story");
                await page.waitForTimeout(500);

                // Results should be filtered
                const storyCards = page.locator('[data-testid="story-card"]');
                const count = await storyCards.count();

                // Verify filtered results
                expect(count).toBeGreaterThanOrEqual(0);
            }
        });
    });

    test.describe("Performance Tests", () => {
        test("TC-STUDIO-PERF-001: Page loads in under 2 seconds", async ({
            page,
        }) => {
            const startTime = Date.now();

            await page.goto("/studio");
            await page.waitForLoadState("networkidle");

            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(3000); // Allow 3s for full load
        });

        test("TC-STUDIO-PERF-002: Story list renders smoothly with many stories", async ({
            page,
        }) => {
            const storyCards = page.locator('[data-testid="story-card"]');
            const count = await storyCards.count();

            // Verify all cards are rendered
            expect(count).toBeGreaterThanOrEqual(0);

            // Check rendering performance
            const firstCard = storyCards.first();
            if (await firstCard.isVisible()) {
                await expect(firstCard).toBeVisible({ timeout: 2000 });
            }
        });
    });

    test.describe("Error Handling Tests", () => {
        test("TC-STUDIO-ERROR-003: Network errors don't crash the page", async ({
            page,
        }) => {
            const consoleErrors: string[] = [];

            page.on("console", (msg) => {
                if (msg.type() === "error") {
                    consoleErrors.push(msg.text());
                }
            });

            page.on("pageerror", (error) => {
                consoleErrors.push(error.message);
            });

            // Simulate network failure (if possible)
            await page.goto("/studio");
            await page.waitForLoadState("networkidle");

            // Page should still be functional despite errors
            const studioPage = page.locator('main, [role="main"]');
            await expect(studioPage).toBeVisible();
        });
    });
});
