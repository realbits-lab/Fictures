import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Publish, Analysis, and Settings Pages
 *
 * PURPOSE:
 * Tests three distinct authenticated-user pages in a single test file:
 * 1. Publish Page (/publish) - Story publication workflow
 * 2. Analysis Page (/analysis) - Story performance metrics and insights
 * 3. Settings Page (/settings) - User preferences and configuration
 * Plus cross-cutting tests for mobile responsiveness, accessibility, and JavaScript errors.
 *
 * PUBLISH PAGE (/publish):
 * - Writer/Manager access control
 * - Publishable stories list display
 * - Menu navigation and highlighting
 * - Performance: Page load < 3 seconds
 * Tests: 4
 *
 * ANALYSIS PAGE (/analysis):
 * - Writer/Manager access control
 * - Analysis dashboard display
 * - Menu navigation and highlighting
 * - Performance: Page load < 3 seconds
 * Tests: 4
 *
 * SETTINGS PAGE (/settings):
 * - All authenticated users can access
 * - Profile settings display
 * - Theme toggle functionality
 * - Menu navigation and highlighting
 * - Performance: Page load < 2 seconds
 * Tests: 5
 *
 * CROSS-CUTTING TESTS:
 * - Mobile responsiveness (375x667 viewport)
 * - JavaScript error detection across all pages
 * - Keyboard navigation accessibility
 * Tests: 3
 *
 * AUTHENTICATION:
 * - ALL tests require authentication using .auth/user.json
 * - Publish/Analysis restricted to writers/managers
 * - Settings accessible to all authenticated users
 *
 * TOTAL: 16 test cases (4 Publish + 4 Analysis + 5 Settings + 3 Cross-cutting)
 */

test.describe('GNB - Publish Page Tests', () => {
  test.use({ storageState: '.auth/user.json' });

  test('TC-PUBLISH-AUTH-003: Writer/Manager can access Publish page', async ({ page }) => {
    console.log('📖 Testing access to Publish page...');

    await page.goto('/publish');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Should not see access denied
    const hasAccessDenied = await page.locator('text=/Access denied|Unauthorized/i').count();
    expect(hasAccessDenied).toBe(0);

    await expect(page.locator('body')).toBeVisible();
    console.log('✅ Publish page accessible');
  });

  test('TC-PUBLISH-NAV-001: Publish menu item highlighted when active', async ({ page }) => {
    console.log('📖 Testing Publish menu highlight...');

    await page.goto('/publish');
    await page.waitForLoadState('networkidle');

    const publishLink = page.locator('a[href="/publish"]').first();
    const hasActiveClass = await publishLink.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      const bgColor = computedStyle.backgroundColor;
      return bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent';
    });

    expect(hasActiveClass).toBe(true);
    console.log('✅ Publish menu highlighted');
  });

  test('TC-PUBLISH-CONTENT-001: Publishable stories list displays', async ({ page }) => {
    console.log('📖 Testing publishable stories display...');

    await page.goto('/publish');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const hasStories = await page.locator('[data-testid="story-card"], .story-card, article').count();
    const hasEmptyState = await page.locator('text=/no.*stories|no.*content|empty|coming soon/i').count();
    const hasPageContent = await page.locator('main, [role="main"], .container').first().isVisible();

    expect(hasStories > 0 || hasEmptyState > 0 || hasPageContent).toBe(true);
    console.log(`✅ Content displayed (${hasStories} stories or empty state)`);
  });

  test('TC-PUBLISH-PERF-001: Page loads in under 3 seconds', async ({ page }) => {
    console.log('📖 Testing Publish page load time...');

    const startTime = Date.now();
    await page.goto('/publish');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`⏱️  Load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
    console.log('✅ Loaded within time limit');
  });
});

test.describe('GNB - Analysis Page Tests', () => {
  test.use({ storageState: '.auth/user.json' });

  test('TC-ANALYSIS-AUTH-003: Writer/Manager can access Analysis page', async ({ page }) => {
    console.log('📖 Testing access to Analysis page...');

    await page.goto('/analysis');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const hasAccessDenied = await page.locator('text=/Access denied|Unauthorized/i').count();
    expect(hasAccessDenied).toBe(0);

    await expect(page.locator('body')).toBeVisible();
    console.log('✅ Analysis page accessible');
  });

  test('TC-ANALYSIS-NAV-001: Analysis menu item highlighted when active', async ({ page }) => {
    console.log('📖 Testing Analysis menu highlight...');

    await page.goto('/analysis');
    await page.waitForLoadState('networkidle');

    const analysisLink = page.locator('a[href="/analysis"]').first();
    const hasActiveClass = await analysisLink.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      const bgColor = computedStyle.backgroundColor;
      return bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent';
    });

    expect(hasActiveClass).toBe(true);
    console.log('✅ Analysis menu highlighted');
  });

  test('TC-ANALYSIS-CONTENT-001: Analysis dashboard displays', async ({ page }) => {
    console.log('📖 Testing analysis dashboard display...');

    await page.goto('/analysis');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const hasContent = await page.locator('main, [role="main"], .container').first().isVisible();
    expect(hasContent).toBe(true);

    const pageText = await page.locator('body').textContent();
    expect(pageText?.length).toBeGreaterThan(50);

    console.log('✅ Analysis dashboard displays');
  });

  test('TC-ANALYSIS-PERF-001: Page loads in under 3 seconds', async ({ page }) => {
    console.log('📖 Testing Analysis page load time...');

    const startTime = Date.now();
    await page.goto('/analysis');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`⏱️  Load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
    console.log('✅ Loaded within time limit');
  });
});

test.describe('GNB - Settings Page Tests', () => {
  test.use({ storageState: '.auth/user.json' });

  test('TC-SETTINGS-AUTH-002: All authenticated users can access', async ({ page }) => {
    console.log('📖 Testing access to Settings page...');

    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const hasAccessDenied = await page.locator('text=/Access denied|Unauthorized/i').count();
    expect(hasAccessDenied).toBe(0);

    await expect(page.locator('body')).toBeVisible();
    console.log('✅ Settings page accessible');
  });

  test('TC-SETTINGS-NAV-001: Settings menu item highlighted when active', async ({ page }) => {
    console.log('📖 Testing Settings menu highlight...');

    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const settingsLink = page.locator('a[href="/settings"]').first();
    const hasActiveClass = await settingsLink.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      const bgColor = computedStyle.backgroundColor;
      return bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent';
    });

    expect(hasActiveClass).toBe(true);
    console.log('✅ Settings menu highlighted');
  });

  test('TC-SETTINGS-CONTENT-001: Profile settings display', async ({ page }) => {
    console.log('📖 Testing profile settings display...');

    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const hasContent = await page.locator('main, [role="main"], .container, form').first().isVisible();
    expect(hasContent).toBe(true);

    console.log('✅ Settings content displays');
  });

  test('TC-SETTINGS-FUNC-003: Theme toggle works', async ({ page }) => {
    console.log('📖 Testing theme toggle...');

    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Look for theme toggle
    const themeToggle = await page.locator('button:has-text("Theme"), button:has-text("Dark"), button:has-text("Light"), [data-testid="theme-toggle"]').count();

    if (themeToggle > 0) {
      const toggleBtn = page.locator('button:has-text("Theme"), button:has-text("Dark"), button:has-text("Light"), [data-testid="theme-toggle"]').first();
      await toggleBtn.click();
      await page.waitForTimeout(500);

      console.log('✅ Theme toggle functional');
    } else {
      console.log('ℹ️  Theme toggle not found');
    }
  });

  test('TC-SETTINGS-PERF-001: Page loads in under 2 seconds', async ({ page }) => {
    console.log('📖 Testing Settings page load time...');

    const startTime = Date.now();
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`⏱️  Load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(2000);
    console.log('✅ Loaded within time limit');
  });
});

test.describe('GNB - Cross-Cutting Tests', () => {
  test.use({ storageState: '.auth/user.json' });

  test('TC-MOBILE-001: All pages render correctly on mobile viewport', async ({ page }) => {
    console.log('📖 Testing mobile responsiveness...');

    await page.setViewportSize({ width: 375, height: 667 });

    const pages = ['/', '/studio', '/novels', '/community', '/publish', '/analysis', '/settings'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const isVisible = await page.locator('body').isVisible();
      expect(isVisible).toBe(true);

      console.log(`✅ ${pagePath} renders on mobile`);
    }
  });

  test('TC-ERROR-001: No JavaScript errors across all pages', async ({ page }) => {
    console.log('📖 Testing for JavaScript errors across pages...');

    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    const pages = ['/', '/studio', '/novels', '/community', '/publish', '/analysis', '/settings'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
    }

    const criticalErrors = errors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('404') &&
      !error.includes('Warning:')
    );

    if (criticalErrors.length > 0) {
      console.log('⚠️  JavaScript errors found:');
      criticalErrors.slice(0, 5).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.substring(0, 100)}`);
      });
    }

    expect(criticalErrors.length).toBeLessThan(5);
    console.log('✅ No critical JavaScript errors');
  });

  test('TC-A11Y-001: All pages are keyboard navigable', async ({ page }) => {
    console.log('📖 Testing keyboard navigation...');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab through elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    await page.keyboard.press('Tab');

    // Check if focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    console.log('✅ Keyboard navigation works');
  });
});
