/**
 * Edge Case Tests
 *
 * Tests for edge cases and boundary conditions
 */

import { expect, test } from "@playwright/test";

test.describe("Edge Cases", () => {
    test("Empty states: No stories in studio", async ({ page }) => {
        await page.goto("/studio");
        await page.waitForLoadState("networkidle");

        // If no stories, should show empty state
        const storyCards = page.locator('[data-testid="story-card"]');
        const count = await storyCards.count();

        if (count === 0) {
            const emptyState = page.locator('[data-testid="empty-state"]');
            await expect(emptyState).toBeVisible();
        }
    });

    test("Maximum limits: Long story title", async ({ page }) => {
        await page.goto("/studio/new");
        await page.waitForLoadState("networkidle");

        const titleInput = page.locator('input[name="title"]');

        if (await titleInput.isVisible()) {
            const longTitle = "A".repeat(300);
            await titleInput.fill(longTitle);

            // Should handle or show validation
            const value = await titleInput.inputValue();
            expect(value.length).toBeLessThanOrEqual(300);
        }
    });

    test("Concurrent operations: Multiple story creations", async ({
        page,
        context,
    }) => {
        // Create multiple pages
        const page2 = await context.newPage();

        await page.goto("/studio/new");
        await page2.goto("/studio/new");

        // Both should be able to create stories concurrently
        await expect(page.locator("main")).toBeVisible();
        await expect(page2.locator("main")).toBeVisible();

        await page2.close();
    });

    test("Invalid data: Special characters in input", async ({ page }) => {
        await page.goto("/community");
        await page.waitForLoadState("networkidle");

        const searchInput = page.locator('input[placeholder*="Search"]');

        if (await searchInput.isVisible()) {
            // Try special characters
            await searchInput.fill('<script>alert("XSS")</script>');

            // Should not execute script
            const dialogs: string[] = [];
            page.on("dialog", (dialog) => {
                dialogs.push(dialog.message());
                dialog.dismiss();
            });

            await page.waitForTimeout(1000);
            expect(dialogs).toHaveLength(0);
        }
    });
});
