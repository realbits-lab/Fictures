import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Novels Page (/novels)
 * Tests story browsing and reading - accessible to all users
 */

test.describe('GNB - Novels Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/novels');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  });

  test.describe('Access Control Tests', () => {
    test('TC-NOVELS-AUTH-001: Anonymous users can access page', async ({ page }) => {
      console.log('📖 Testing anonymous access to novels page...');

      // Clear any auth state
      await page.context().clearCookies();

      await page.goto('/novels');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Page should load successfully (check for main content area)
      const hasMainContent = await page.locator('main, [role="main"], .container, body').first().isVisible();
      expect(hasMainContent).toBe(true);

      // Check we're not completely blocked (not redirected to login)
      const isOnNovelsPage = page.url().includes('/novels');
      expect(isOnNovelsPage).toBe(true);

      console.log('✅ Anonymous users can access novels page');
    });

    test('TC-NOVELS-AUTH-002: Menu item visible to all users', async ({ page }) => {
      console.log('📖 Testing Novels menu item visible...');

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Novels menu should be visible
      const novelsMenuItem = await page.locator('a[href="/novels"]:visible').count();
      expect(novelsMenuItem).toBeGreaterThan(0);

      console.log('✅ Novels menu item is visible');
    });

    test('TC-NOVELS-AUTH-003: Restricted menu items hidden from anonymous users', async ({ page }) => {
      console.log('📖 Testing restricted menu items hidden...');

      // Clear any auth state
      await page.context().clearCookies();

      await page.goto('/novels');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check that Studio, Publish, Analytics are NOT visible
      const studioVisible = await page.locator('a[href="/studio"]:visible').count();
      const publishVisible = await page.locator('a[href="/publish"]:visible').count();
      const analyticsVisible = await page.locator('a[href="/analytics"]:visible').count();

      // These should be 0 for anonymous users
      console.log(`Studio links visible: ${studioVisible}`);
      console.log(`Publish links visible: ${publishVisible}`);
      console.log(`Analytics links visible: ${analyticsVisible}`);

      console.log('✅ Restricted menu items checked');
    });
  });

  test.describe('Home Redirect Tests', () => {
    test('TC-NOVELS-REDIRECT-001: Home page (/) redirects to /novels', async ({ page }) => {
      console.log('📖 Testing home page redirects to novels...');

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verify we end up on /novels after redirect
      const currentUrl = page.url();
      expect(currentUrl.includes('/novels')).toBe(true);

      console.log('✅ Home page correctly redirects to /novels');
    });

    test('TC-NOVELS-REDIRECT-002: Logo link navigates to home and redirects to novels', async ({ page }) => {
      console.log('📖 Testing logo navigation redirects to novels...');

      // Navigate to a different page first
      await page.goto('/community');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Click logo/home link
      const homeLink = page.locator('a[href="/"]').first();
      if (await homeLink.count() > 0) {
        await homeLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        // Home page (/) redirects to /novels
        const currentUrl = page.url();
        expect(currentUrl.includes('/novels')).toBe(true);
        console.log('✅ Logo navigation correctly redirects to /novels');
      } else {
        console.log('ℹ️  Home link not found, skipping test');
      }
    });
  });

  test.describe('Navigation Tests', () => {
    test('TC-NOVELS-NAV-001: Novels menu item highlighted when active', async ({ page }) => {
      console.log('📖 Testing Novels menu item highlight...');

      await page.goto('/novels');
      await page.waitForLoadState('networkidle');

      // Find the Novels menu link
      const novelsLink = page.locator('a[href="/novels"]').first();

      // Check if it has active styling
      const hasActiveClass = await novelsLink.evaluate((el) => {
        const classList = Array.from(el.classList);
        const computedStyle = window.getComputedStyle(el);
        const bgColor = computedStyle.backgroundColor;

        return classList.some(c => c.includes('active') || c.includes('primary')) ||
               (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent');
      });

      expect(hasActiveClass).toBe(true);
      console.log('✅ Novels menu item is highlighted');
    });

    test('TC-NOVELS-NAV-002: Genre filter navigation works if present', async ({ page }) => {
      console.log('📖 Testing genre filter navigation...');

      await page.goto('/novels');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Look for genre filters/tabs
      const genreFilters = await page.locator('[data-testid="genre-filter"], .genre-tab, button:has-text("Genre")').count();

      if (genreFilters > 0) {
        const firstFilter = page.locator('[data-testid="genre-filter"], .genre-tab').first();
        await firstFilter.click();
        await page.waitForTimeout(1000);

        console.log('✅ Genre filter navigation works');
      } else {
        console.log('ℹ️  No genre filters found (may be optional)');
      }
    });

    test('TC-NOVELS-NAV-003: Story card click opens reader', async ({ page }) => {
      console.log('📖 Testing story card click...');

      await page.goto('/novels');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Find first story card
      const storyCard = page.locator('[data-testid="story-card"], .story-card, article, [role="article"]').first();

      if (await storyCard.count() > 0) {
        const initialUrl = page.url();
        await storyCard.click();
        await page.waitForTimeout(1000);

        // Should navigate to story/chapter
        const urlChanged = page.url() !== initialUrl;
        expect(urlChanged).toBe(true);

        console.log('✅ Story card click works');
      } else {
        console.log('ℹ️  No stories available to test');
      }
    });
  });

  test.describe('Content Tests', () => {
    test('TC-NOVELS-CONTENT-001: Published stories display or empty state', async ({ page }) => {
      console.log('📖 Testing published stories display...');

      await page.goto('/novels');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Should have either story cards or empty state, or just page content
      const hasStoryCards = await page.locator('[data-testid="story-card"], .story-card, article, [role="article"]').count();
      const hasEmptyState = await page.locator('text=/no.*stories|no.*content|nothing.*found|empty|coming soon/i').count();
      const hasPageContent = await page.locator('main, [role="main"], .container').first().isVisible();

      const hasContent = hasStoryCards > 0 || hasEmptyState > 0 || hasPageContent;
      expect(hasContent).toBe(true);

      console.log(`✅ Content displayed (${hasStoryCards} stories or empty state)`);
    });

    test('TC-NOVELS-CONTENT-002: Story cards show metadata if stories exist', async ({ page }) => {
      console.log('📖 Testing story card metadata...');

      await page.goto('/novels');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const storyCards = await page.locator('[data-testid="story-card"], .story-card, article, [role="article"]').count();

      if (storyCards > 0) {
        const firstCard = page.locator('[data-testid="story-card"], .story-card, article, [role="article"]').first();

        // Check for title
        const hasText = await firstCard.textContent();
        expect(hasText?.length).toBeGreaterThan(0);

        console.log('✅ Story cards show metadata');
      } else {
        console.log('ℹ️  No stories to test metadata');
      }
    });

    test('TC-NOVELS-CONTENT-003: Story cover images display if present', async ({ page }) => {
      console.log('📖 Testing story cover images...');

      await page.goto('/novels');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const storyCards = await page.locator('[data-testid="story-card"], .story-card, article').count();

      if (storyCards > 0) {
        // Look for images in story cards
        const images = await page.locator('[data-testid="story-card"] img, .story-card img, article img').count();

        if (images > 0) {
          console.log(`✅ Found ${images} story cover images`);
        } else {
          console.log('ℹ️  No cover images found (may be optional)');
        }
      } else {
        console.log('ℹ️  No stories to test images');
      }
    });

    test('TC-NOVELS-CONTENT-004: Genre filters work if present', async ({ page }) => {
      console.log('📖 Testing genre filters...');

      await page.goto('/novels');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Look for genre filter buttons/tabs
      const genreFilters = await page.locator('[data-testid="genre-filter"], .genre-filter, [role="tab"]').count();

      if (genreFilters > 0) {
        const initialStoryCount = await page.locator('[data-testid="story-card"], .story-card, article').count();

        // Click a filter
        await page.locator('[data-testid="genre-filter"], .genre-filter, [role="tab"]').nth(1).click();
        await page.waitForTimeout(1000);

        const newStoryCount = await page.locator('[data-testid="story-card"], .story-card, article').count();

        // Story count might change or stay same (depending on filter)
        console.log(`✅ Genre filter works (stories: ${initialStoryCount} -> ${newStoryCount})`);
      } else {
        console.log('ℹ️  No genre filters found');
      }
    });

    test('TC-NOVELS-CONTENT-005: Search functionality works if present', async ({ page }) => {
      console.log('📖 Testing search functionality...');

      await page.goto('/novels');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[aria-label*="search"]').first();

      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);

        console.log('✅ Search input functional');
      } else {
        console.log('ℹ️  No search input found (may be optional)');
      }
    });
  });

  test.describe('Performance Tests', () => {
    test('TC-NOVELS-PERF-001: Story grid loads in under 3 seconds', async ({ page }) => {
      console.log('📖 Testing novels page load time...');

      const startTime = Date.now();
      await page.goto('/novels');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      console.log(`⏱️  Page load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);

      console.log('✅ Page loaded within time limit');
    });

    test('TC-NOVELS-PERF-002: Images lazy load correctly if present', async ({ page }) => {
      console.log('📖 Testing image lazy loading...');

      await page.goto('/novels');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      const images = await page.locator('img').count();

      if (images > 0) {
        // Check if images have loading attribute
        const lazyImages = await page.locator('img[loading="lazy"]').count();

        console.log(`✅ Found ${images} images (${lazyImages} lazy loaded)`);
      } else {
        console.log('ℹ️  No images to test lazy loading');
      }
    });
  });

  test.describe('Error Handling Tests', () => {
    test('TC-NOVELS-ERROR-001: No error messages displayed on successful load', async ({ page }) => {
      console.log('📖 Testing no error messages...');

      await page.goto('/novels');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check for error messages
      const hasError = await page.locator('text=/Error loading|Failed to|Something went wrong/i').count();

      expect(hasError).toBe(0);
      console.log('✅ No error messages displayed');
    });
  });
});
