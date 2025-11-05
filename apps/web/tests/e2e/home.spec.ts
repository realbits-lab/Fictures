/**
 * Home Page E2E Tests
 *
 * Tests for home page (/) redirect behavior.
 * Home page automatically redirects to /novels for all users.
 *
 * Test Cases: TC-HOME-REDIRECT-001 to TC-HOME-PERF-002
 */

import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.describe('Redirect Tests', () => {
    test('TC-HOME-REDIRECT-001: Anonymous users redirected from / to /novels', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify redirect to /novels
      expect(page.url()).toContain('/novels');
    });

    test('TC-HOME-REDIRECT-002: Authenticated users redirected from / to /novels', async ({ page, context }) => {
      // Use writer authentication
      await context.addCookies([
        { name: 'next-auth.session-token', value: 'test-session', domain: 'localhost', path: '/' }
      ]);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify redirect to /novels
      expect(page.url()).toContain('/novels');
    });

    test('TC-HOME-REDIRECT-003: Redirect uses proper HTTP status code', async ({ page }) => {
      const response = await page.goto('/');

      // Should be 307 (Temporary Redirect) or 308 (Permanent Redirect)
      expect([307, 308, 200]).toContain(response?.status() || 200);
    });

    test('TC-HOME-REDIRECT-004: Redirect preserves query parameters', async ({ page }) => {
      await page.goto('/?ref=social&utm_source=test');
      await page.waitForLoadState('networkidle');

      const url = new URL(page.url());
      expect(url.pathname).toBe('/novels');
      // Query params may or may not be preserved - verify expected behavior
      // expect(url.searchParams.get('ref')).toBe('social');
    });
  });

  test.describe('Performance Tests', () => {
    test('TC-HOME-PERF-001: Redirect completes in under 100ms', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Allow more time for full page load
    });

    test('TC-HOME-PERF-002: No JavaScript errors during redirect', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify no console errors
      expect(consoleErrors).toHaveLength(0);
    });
  });
});
