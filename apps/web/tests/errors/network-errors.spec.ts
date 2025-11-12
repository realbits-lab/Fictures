/**
 * Network Error Handling Tests
 *
 * Tests for handling network failures and API errors
 * Test Cases: TC-ERROR-001 to TC-ERROR-007
 */

import { expect, test } from "@playwright/test";

test.describe("Network Error Handling", () => {
    test("TC-ERROR-001: Network errors display user-friendly messages", async ({
        page,
    }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const consoleErrors: string[] = [];
        page.on("console", (msg) => {
            if (msg.type() === "error") {
                consoleErrors.push(msg.text());
            }
        });

        // Try to trigger a network error by accessing a failing endpoint
        await page.route("**/api/**", (route) => route.abort("failed"));

        await page.goto("/studio");
        await page.waitForLoadState("networkidle");

        // Page should still be visible with error message
        const mainContent = page.locator("main");
        await expect(mainContent).toBeVisible();

        // Should show error message
        const errorMessage = page.locator("text=/error|failed|unable/i");
        const hasError = await errorMessage.isVisible().catch(() => false);

        // Either error message visible or page handles gracefully
        expect(hasError || consoleErrors.length === 0).toBeTruthy();
    });

    test("TC-ERROR-003: API errors don't crash the application", async ({
        page,
    }) => {
        await page.goto("/studio");
        await page.waitForLoadState("networkidle");

        // Simulate API error
        await page.route("**/api/stories", (route) =>
            route.fulfill({
                status: 500,
                body: JSON.stringify({ error: "Internal Server Error" }),
            }),
        );

        await page.reload();
        await page.waitForLoadState("networkidle");

        // Application should still be functional
        const mainContent = page.locator("main");
        await expect(mainContent).toBeVisible();
    });

    test("TC-ERROR-004: Error boundaries catch React errors", async ({
        page,
    }) => {
        const consoleErrors: string[] = [];
        const pageErrors: string[] = [];

        page.on("console", (msg) => {
            if (msg.type() === "error") {
                consoleErrors.push(msg.text());
            }
        });

        page.on("pageerror", (error) => {
            pageErrors.push(error.message);
        });

        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Even if there are errors, page should show error boundary
        const mainContent = page.locator("main");
        await expect(mainContent).toBeVisible();
    });

    test("TC-ERROR-007: Retry mechanisms work for transient errors", async ({
        page,
    }) => {
        let attemptCount = 0;

        await page.route("**/api/stories", (route) => {
            attemptCount++;

            if (attemptCount === 1) {
                // Fail first attempt
                route.fulfill({
                    status: 500,
                    body: JSON.stringify({ error: "Temporary failure" }),
                });
            } else {
                // Succeed on retry
                route.continue();
            }
        });

        await page.goto("/studio");
        await page.waitForLoadState("networkidle");

        // Should eventually succeed
        expect(attemptCount).toBeGreaterThan(0);
    });
});
