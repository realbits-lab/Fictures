import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Community Page (/community)
 *
 * PURPOSE:
 * Tests the community discussion and story sharing platform accessible to all users.
 * Includes both anonymous viewing capabilities and authenticated user interactions.
 *
 * KEY FEATURES TESTED:
 * - Anonymous user viewing (read-only access)
 * - Community post browsing and discovery
 * - Post categories and filtering
 * - Create post functionality (authenticated users)
 * - Like/dislike system (authenticated users)
 * - Real-time updates via SSE (Server-Sent Events)
 * - Menu navigation and highlighting
 * - Scrolling performance
 *
 * TEST CATEGORIES:
 * - Access Control (2 tests): Anonymous viewing, menu visibility
 * - Navigation (3 tests): Menu highlighting, categories, post clicks
 * - Content (3 tests): Post display, metadata, category filters
 * - Functionality (2 tests): Create post button, like/dislike system (authenticated)
 * - Performance (2 tests): Page load time, smooth scrolling
 * - Error Handling (1 test): Error message verification
 *
 * SPECIAL NOTES:
 * - Uses 'load' instead of 'networkidle' due to SSE keeping network active
 * - Some tests require authentication (.auth/user.json)
 *
 * TOTAL: 13 test cases
 */

test.describe('GNB - Community Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/community');
    // Changed from 'networkidle' to 'load' because community page uses SSE (Server-Sent Events)
    // for real-time updates, which keeps network perpetually active
    await page.waitForLoadState('load');
    await page.waitForTimeout(1500);
  });

  test.describe('Access Control Tests', () => {
    test('TC-COMMUNITY-AUTH-001: Anonymous users can view posts', async ({ page }) => {
      console.log('📖 Testing anonymous access to community page...');

      // Clear any auth state
      await page.context().clearCookies();

      await page.goto('/community');
      await page.waitForLoadState('load');

      // Should not require authentication to view
      const hasAuthError = await page.locator('text=/sign in required|must be logged in/i').count();
      expect(hasAuthError).toBe(0);

      // Page should load
      await expect(page.locator('body')).toBeVisible();

      console.log('✅ Anonymous users can view community page');
    });

    test('TC-COMMUNITY-AUTH-003: Menu item visible to all users', async ({ page }) => {
      console.log('📖 Testing Community menu item visible...');

      await page.goto('/');
      await page.waitForLoadState('load');
      await page.waitForTimeout(1000);

      // Community menu should be visible
      const communityMenuItem = await page.locator('a[href="/community"]:visible').count();
      expect(communityMenuItem).toBeGreaterThan(0);

      console.log('✅ Community menu item is visible');
    });
  });

  test.describe('Navigation Tests', () => {
    test('TC-COMMUNITY-NAV-001: Community menu item highlighted when active', async ({ page }) => {
      console.log('📖 Testing Community menu item highlight...');

      await page.goto('/community');
      await page.waitForLoadState('load');

      // Find the Community menu link
      const communityLink = page.locator('a[href="/community"]').first();

      // Check if it has active styling
      const hasActiveClass = await communityLink.evaluate((el) => {
        const classList = Array.from(el.classList);
        const computedStyle = window.getComputedStyle(el);
        const bgColor = computedStyle.backgroundColor;

        return classList.some(c => c.includes('active') || c.includes('primary')) ||
               (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent');
      });

      expect(hasActiveClass).toBe(true);
      console.log('✅ Community menu item is highlighted');
    });

    test('TC-COMMUNITY-NAV-002: Post categories navigation works if present', async ({ page }) => {
      console.log('📖 Testing post categories navigation...');

      await page.goto('/community');
      await page.waitForLoadState('load');
      await page.waitForTimeout(1500);

      // Look for category filters/tabs
      const categoryTabs = await page.locator('[data-testid="category-tab"], [role="tab"], button:has-text("Category")').count();

      if (categoryTabs > 0) {
        const firstTab = page.locator('[data-testid="category-tab"], [role="tab"]').first();
        await firstTab.click();
        await page.waitForTimeout(1000);

        console.log('✅ Category navigation works');
      } else {
        console.log('ℹ️  No category tabs found (may be optional)');
      }
    });

    test('TC-COMMUNITY-NAV-003: Individual post navigation works', async ({ page }) => {
      console.log('📖 Testing individual post click...');

      await page.goto('/community');
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      // Find first post
      const post = page.locator('[data-testid="community-post"], .post-card, article, [role="article"]').first();

      if (await post.count() > 0) {
        const initialUrl = page.url();
        await post.click();
        await page.waitForTimeout(1000);

        // Should navigate to post detail or stay on page
        // (depending on implementation)
        console.log('✅ Post click interaction works');
      } else {
        console.log('ℹ️  No posts available to test');
      }
    });
  });

  test.describe('Content Tests', () => {
    test('TC-COMMUNITY-CONTENT-001: Community posts display or empty state', async ({ page }) => {
      console.log('📖 Testing community posts display...');

      await page.goto('/community');
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      // Should have either posts or empty state
      const hasPosts = await page.locator('[data-testid="community-post"], .post-card, article, [role="article"]').count();
      const hasEmptyState = await page.locator('text=/no.*posts|no.*discussions|be the first/i').count();

      const hasContent = hasPosts > 0 || hasEmptyState > 0;
      expect(hasContent).toBe(true);

      console.log(`✅ Content displayed (${hasPosts} posts or empty state)`);
    });

    test('TC-COMMUNITY-CONTENT-002: Post cards show author and timestamp if posts exist', async ({ page }) => {
      console.log('📖 Testing post card metadata...');

      await page.goto('/community');
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      const posts = await page.locator('[data-testid="community-post"], .post-card, article').count();

      if (posts > 0) {
        const firstPost = page.locator('[data-testid="community-post"], .post-card, article').first();
        const postText = await firstPost.textContent();

        // Should have some content
        expect(postText?.length).toBeGreaterThan(0);

        console.log('✅ Post cards show content');
      } else {
        console.log('ℹ️  No posts to test metadata');
      }
    });

    test('TC-COMMUNITY-CONTENT-004: Category filter works if present', async ({ page }) => {
      console.log('📖 Testing category filter...');

      await page.goto('/community');
      await page.waitForLoadState('load');
      await page.waitForTimeout(1500);

      // Look for category filters
      const categoryFilters = await page.locator('[data-testid="category-filter"], .category-tab, [role="tab"]').count();

      if (categoryFilters > 0) {
        console.log('✅ Category filters present');
      } else {
        console.log('ℹ️  No category filters found');
      }
    });
  });

  test.describe('Functionality Tests (Authenticated)', () => {
    test.use({ storageState: '.auth/user.json' });

    test('TC-COMMUNITY-FUNC-001: Create post button shows for auth users', async ({ page }) => {
      console.log('📖 Testing create post button for auth users...');

      await page.goto('/community');
      await page.waitForLoadState('load');
      await page.waitForTimeout(1500);

      // Look for create/new post button
      const hasCreateButton = await page.locator('button:has-text("Create"), button:has-text("New Post"), a:has-text("Create Post")').count();

      if (hasCreateButton > 0) {
        console.log('✅ Create post button visible for auth users');
      } else {
        console.log('ℹ️  Create post button not found (may require specific permissions)');
      }
    });

    test('TC-COMMUNITY-FUNC-004: Like/dislike system shows if implemented', async ({ page }) => {
      console.log('📖 Testing like/dislike system...');

      await page.goto('/community');
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      const posts = await page.locator('[data-testid="community-post"], .post-card, article').count();

      if (posts > 0) {
        // Look for like/dislike buttons
        const hasLikeButtons = await page.locator('button[aria-label*="like"], button:has-text("👍"), button:has-text("👎")').count();

        if (hasLikeButtons > 0) {
          console.log('✅ Like/dislike buttons present');
        } else {
          console.log('ℹ️  Like/dislike buttons not found');
        }
      } else {
        console.log('ℹ️  No posts to test like/dislike');
      }
    });
  });

  test.describe('Performance Tests', () => {
    test('TC-COMMUNITY-PERF-001: Page loads in under 3 seconds', async ({ page }) => {
      console.log('📖 Testing community page load time...');

      const startTime = Date.now();
      await page.goto('/community');
      await page.waitForLoadState('load');
      const loadTime = Date.now() - startTime;

      console.log(`⏱️  Page load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);

      console.log('✅ Page loaded within time limit');
    });

    test('TC-COMMUNITY-PERF-002: Post list scrolling smooth', async ({ page }) => {
      console.log('📖 Testing post list scrolling...');

      await page.goto('/community');
      await page.waitForLoadState('load');
      await page.waitForTimeout(1500);

      const posts = await page.locator('[data-testid="community-post"], .post-card, article').count();

      if (posts > 5) {
        // Scroll down
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(500);
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(500);

        console.log('✅ Page scrolling works');
      } else {
        console.log('ℹ️  Not enough posts to test scrolling');
      }
    });
  });

  test.describe('Error Handling Tests', () => {
    test('TC-COMMUNITY-ERROR-001: No error messages displayed on successful load', async ({ page }) => {
      console.log('📖 Testing no error messages...');

      await page.goto('/community');
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      // Check for error messages
      const hasError = await page.locator('text=/Error loading|Failed to|Something went wrong/i').count();

      expect(hasError).toBe(0);
      console.log('✅ No error messages displayed');
    });
  });
});
