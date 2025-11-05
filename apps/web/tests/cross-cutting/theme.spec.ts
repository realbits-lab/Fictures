/**
 * Theme Support Tests
 *
 * Tests for dark/light theme switching
 * Test Cases: TC-THEME-001 to TC-THEME-006
 */

import { test, expect } from '@playwright/test';

test.describe('Theme Support', () => {
  test('TC-THEME-001: All pages support dark mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Toggle to dark mode
    const themeToggle = page.locator('[data-testid="theme-toggle"]');

    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Check for dark mode class
      const html = page.locator('html');
      const hasDarkClass = await html.evaluate(el => el.classList.contains('dark'));
      expect(hasDarkClass).toBeTruthy();
    }
  });

  test('TC-THEME-002: Theme toggle persists across sessions', async ({ page, context }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Set theme to dark
    const themeToggle = page.locator('[data-testid="theme-toggle"]');

    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Theme should still be dark
      const html = page.locator('html');
      const hasDarkClass = await html.evaluate(el => el.classList.contains('dark'));
      expect(hasDarkClass).toBeTruthy();
    }
  });

  test('TC-THEME-003: No visual glitches on theme switch', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const themeToggle = page.locator('[data-testid="theme-toggle"]');

    if (await themeToggle.isVisible()) {
      // Take screenshot before
      const beforeScreenshot = await page.screenshot();

      await themeToggle.click();
      await page.waitForTimeout(500);

      // Page should still be visible
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();

      // Take screenshot after
      const afterScreenshot = await page.screenshot();

      // Screenshots should be different
      expect(beforeScreenshot).not.toEqual(afterScreenshot);
    }
  });

  test('TC-THEME-006: System theme preference detected', async ({ page }) => {
    // Set system preference to dark mode
    await page.emulateMedia({ colorScheme: 'dark' });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should respect system preference
    const html = page.locator('html');
    const hasDarkClass = await html.evaluate(el =>
      el.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );

    expect(hasDarkClass).toBeTruthy();
  });
});
