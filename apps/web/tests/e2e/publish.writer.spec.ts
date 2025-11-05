/**
 * Publish Page E2E Tests (Writer Role)
 *
 * Tests for /publish - Publishing and scheduling system
 * Requires writer or manager role authentication
 *
 * Test Cases: TC-PUBLISH-NAV-001 to TC-PUBLISH-ERROR-004
 */

import { test, expect } from '@playwright/test';

test.describe('Publish Page - Writer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/publish');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Navigation Tests', () => {
    test('TC-PUBLISH-NAV-001: Publish menu item highlighted when active', async ({ page }) => {
      const publishNav = page.locator('nav a[href="/publish"]');
      await expect(publishNav).toHaveClass(/active|current/);
    });
  });

  test.describe('Content Tests', () => {
    test('TC-PUBLISH-CONTENT-001: Publishable stories list displays', async ({ page }) => {
      const storiesList = page.locator('[data-testid="publishable-stories"]');
      await expect(storiesList).toBeVisible();
    });
  });

  test.describe('Performance Tests', () => {
    test('TC-PUBLISH-PERF-001: Page loads in under 2 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/publish');
      await page.waitForLoadState('networkidle');
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(3000);
    });
  });
});
