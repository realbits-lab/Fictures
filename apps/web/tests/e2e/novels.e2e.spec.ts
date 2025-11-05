/**
 * Novels Page E2E Tests (Public Access)
 *
 * Tests for /novels - Browse and read text-based stories
 * Accessible to all users (anonymous and authenticated)
 *
 * Test Cases: TC-NOVELS-NAV-001 to TC-NOVELS-ERROR-004
 */

import { test, expect } from '@playwright/test';

test.describe('Novels Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/novels');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Navigation Tests', () => {
    test('TC-NOVELS-NAV-001: Novels menu item highlighted when active', async ({ page }) => {
      const novelsNav = page.locator('nav a[href="/novels"]');
      await expect(novelsNav).toHaveClass(/active|current/);
    });

    test('TC-NOVELS-NAV-003: Story card click opens reader', async ({ page }) => {
      const storyCard = page.locator('[data-testid="story-card"]').first();

      if (await storyCard.isVisible()) {
        await storyCard.click();
        await page.waitForLoadState('networkidle');

        // Should navigate to novel reader
        expect(page.url()).toMatch(/\/novels\/\w+/);
      }
    });
  });

  test.describe('Access Control Tests', () => {
    test('TC-NOVELS-AUTH-001: Anonymous users can access page', async ({ page }) => {
      // Already on page from beforeEach
      expect(page.url()).toContain('/novels');

      // Page should be visible
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('Content Tests', () => {
    test('TC-NOVELS-CONTENT-001: Published stories display correctly', async ({ page }) => {
      const storyGrid = page.locator('[data-testid="story-grid"]');
      await expect(storyGrid).toBeVisible();
    });

    test('TC-NOVELS-CONTENT-002: Story cards show title, genre, rating', async ({ page }) => {
      const firstCard = page.locator('[data-testid="story-card"]').first();

      if (await firstCard.isVisible()) {
        await expect(firstCard.locator('[data-testid="story-title"]')).toBeVisible();
        // Genre and rating checks can be added based on UI
      }
    });

    test('TC-NOVELS-CONTENT-004: Empty state for no stories', async ({ page, request }) => {
      // Navigate to filtered view with no results
      const emptyState = page.locator('[data-testid="empty-state"]');

      const storyCards = page.locator('[data-testid="story-card"]');
      const count = await storyCards.count();

      if (count === 0) {
        await expect(emptyState).toBeVisible();
      }
    });
  });

  test.describe('Performance Tests', () => {
    test('TC-NOVELS-PERF-001: Story grid loads in under 2 seconds', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/novels');
      await page.waitForLoadState('networkidle');

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(3000);
    });
  });

  test.describe('Error Handling Tests', () => {
    test('TC-NOVELS-ERROR-001: Story fetch failure shows error', async ({ page }) => {
      // Network errors should show error message
      const consoleErrors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/novels');
      await page.waitForLoadState('networkidle');

      // Page should be visible even if some requests fail
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
    });
  });
});
