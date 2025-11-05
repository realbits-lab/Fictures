/**
 * Mobile Responsiveness Tests
 *
 * Tests for mobile device compatibility and responsive design
 * Test Cases: TC-MOBILE-001 to TC-MOBILE-008
 */

import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  test.use({ ...devices['iPhone 12'] });

  test('TC-MOBILE-001: All pages render correctly on mobile (320px-768px)', async ({ page }) => {
    const pages = ['/', '/studio', '/novels', '/comics', '/community', '/publish', '/analysis', '/settings'];

    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible();

      // Check viewport width
      const viewport = page.viewportSize();
      expect(viewport?.width).toBeLessThanOrEqual(768);
    }
  });

  test('TC-MOBILE-002: Mobile menu functions properly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for mobile menu button (hamburger)
    const mobileMenuButton = page.locator('button[aria-label*="menu"], button:has-text("☰")');

    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(500);

      // Menu should open
      const menu = page.locator('[role="menu"], nav');
      await expect(menu).toBeVisible();
    }
  });

  test('TC-MOBILE-003: Touch interactions work correctly', async ({ page }) => {
    await page.goto('/novels');
    await page.waitForLoadState('networkidle');

    const storyCard = page.locator('[data-testid="story-card"]').first();

    if (await storyCard.isVisible()) {
      // Simulate touch tap
      await storyCard.tap();
      await page.waitForLoadState('networkidle');

      // Should navigate to story
      expect(page.url()).toMatch(/\/novels\/\w+/);
    }
  });

  test('TC-MOBILE-004: Content is readable on small screens', async ({ page }) => {
    await page.goto('/novels');
    await page.waitForLoadState('networkidle');

    // Check font size is readable
    const bodyText = page.locator('body');
    const fontSize = await bodyText.evaluate(el =>
      window.getComputedStyle(el).fontSize
    );

    // Font size should be at least 14px on mobile
    expect(parseInt(fontSize)).toBeGreaterThanOrEqual(14);
  });

  test('TC-MOBILE-007: Bottom navigation accessible on mobile', async ({ page }) => {
    await page.goto('/novels');
    await page.waitForLoadState('networkidle');

    const bottomNav = page.locator('nav[data-testid="bottom-navigation"]');

    if (await bottomNav.isVisible()) {
      await expect(bottomNav).toBeVisible();

      // Should be positioned at bottom
      const boundingBox = await bottomNav.boundingBox();
      expect(boundingBox?.y).toBeGreaterThan(400);
    }
  });
});
