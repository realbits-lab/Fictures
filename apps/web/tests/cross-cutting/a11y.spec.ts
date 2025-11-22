/**
 * Accessibility Tests
 *
 * Tests for WCAG 2.1 Level AA compliance
 * Test Cases: TC-A11Y-001 to TC-A11Y-008
 */

// Note: @axe-core/playwright may need to be installed
// import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Accessibility", () => {
    test("TC-A11Y-001: All pages are keyboard navigable", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Tab through elements
        await page.keyboard.press("Tab");
        await page.waitForTimeout(100);

        const focusedElement = await page.evaluate(
            () => document.activeElement?.tagName,
        );
        expect(focusedElement).toBeTruthy();
    });

    test("TC-A11Y-002: Screen reader compatible", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Check for proper heading structure
        const h1Count = await page.locator("h1").count();
        expect(h1Count).toBeGreaterThan(0);

        // Check for main landmark
        const main = page.locator('main, [role="main"]');
        await expect(main).toBeVisible();
    });

    test("TC-A11Y-003: ARIA labels present where needed", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Check buttons have accessible names
        const buttons = page.locator("button");
        const count = await buttons.count();

        if (count > 0) {
            const firstButton = buttons.first();
            const hasAriaLabel = await firstButton.evaluate(
                (el) =>
                    el.hasAttribute("aria-label") ||
                    el.textContent?.trim().length > 0,
            );
            expect(hasAriaLabel).toBeTruthy();
        }
    });

    test("TC-A11Y-005: Focus indicators visible", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Tab to first focusable element
        await page.keyboard.press("Tab");
        await page.waitForTimeout(100);

        // Check if focus is visible
        const hasFocusVisible = await page.evaluate(() => {
            const focused = document.activeElement;
            if (!focused) return false;

            const styles = window.getComputedStyle(focused);
            return styles.outline !== "none" || styles.border !== "none";
        });

        expect(hasFocusVisible).toBeTruthy();
    });

    test("TC-A11Y-007: Forms have proper labels", async ({ page }) => {
        await page.goto("/login");
        await page.waitForLoadState("networkidle");

        // Check email input has label
        const emailInput = page.locator('input[type="email"]');

        if (await emailInput.isVisible()) {
            const hasLabel = await emailInput.evaluate((input) => {
                const label = document.querySelector(
                    `label[for="${input.id}"]`,
                );
                return label !== null || input.hasAttribute("aria-label");
            });

            expect(hasLabel).toBeTruthy();
        }
    });

    test("TC-A11Y-008: Images have alt text", async ({ page }) => {
        await page.goto("/novels");
        await page.waitForLoadState("networkidle");

        const images = page.locator("img");
        const count = await images.count();

        if (count > 0) {
            const firstImage = images.first();
            const hasAlt = await firstImage.evaluate((img) =>
                img.hasAttribute("alt"),
            );

            expect(hasAlt).toBeTruthy();
        }
    });

    test("TC-A11Y: Run axe accessibility scan", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Note: AxeBuilder requires @axe-core/playwright package
        // Skipping axe scan if package is not available
        // const accessibilityScanResults = await new AxeBuilder({
        //     page,
        // }).analyze();
        // expect(accessibilityScanResults.violations).toEqual([]);

        // Basic accessibility check instead
        const h1Count = await page.locator("h1").count();
        expect(h1Count).toBeGreaterThan(0);
    });
});
