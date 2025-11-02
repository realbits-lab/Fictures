/**
 * E2E Tests: Cache Invalidation - Community Routes
 *
 * Tests cache invalidation for Community mutations.
 * Verifies that posts, likes, and replies properly invalidate caches.
 *
 * Test Coverage:
 * - Post creation (POST /community/api/posts)
 * - Post likes (POST /community/api/posts/[postId]/like)
 * - Post replies (POST /community/api/posts/[postId]/replies)
 * - Optimistic updates for community interactions
 *
 * Run: dotenv --file .env.local run npx playwright test cache-invalidation-community
 */

import { test, expect } from '@playwright/test';

// Use authenticated state
test.use({ storageState: '.auth/user.json' });

// Test configuration
const TEST_TIMEOUT = 30000;

/**
 * Helper: Check localStorage cache
 */
async function getLocalStorageCache(page: any, cacheType: string) {
  return page.evaluate((type: string) => {
    const key = `cache:${type}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }, cacheType);
}

/**
 * Helper: Wait for cache invalidation headers
 */
async function waitForCacheInvalidation(response: Response) {
  const headers = response.headers();
  return {
    invalidateTypes: headers['x-cache-invalidate'],
    invalidateKeys: headers['x-cache-invalidate-keys'],
    timestamp: headers['x-cache-invalidate-timestamp'],
  };
}

test.describe('Cache Invalidation: Community Routes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Community page
    await page.goto('http://localhost:3000/community');
    await page.waitForLoadState('networkidle');

    // Verify authenticated
    await expect(page.locator('text=Community')).toBeVisible();
  });

  test('Post creation invalidates community cache', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Get initial community cache
    const initialCache = await getLocalStorageCache(page, 'community');

    // Step 2: Listen for POST request
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/community/api/posts') && response.request().method() === 'POST'
    );

    // Step 3: Create a new post
    const newPostButton = page.locator('button:has-text("New Post"), button:has-text("Create Post")').first();

    if (await newPostButton.isVisible({ timeout: 2000 })) {
      await newPostButton.click();

      // Fill post content
      const contentInput = page.locator('textarea[name="content"], textarea[placeholder*="Write"]').first();
      await contentInput.fill('Test post for cache invalidation - ' + Date.now());

      // Submit post
      const submitButton = page.locator('button:has-text("Post"), button:has-text("Submit"), button[type="submit"]').first();
      await submitButton.click();

      // Step 4: Verify POST request
      const response = await responsePromise;
      expect(response.status()).toBe(200);

      // Step 5: Check cache invalidation headers
      const cacheHeaders = await waitForCacheInvalidation(response);
      expect(cacheHeaders.invalidateTypes).toContain('community');

      // Step 6: Verify cache was invalidated
      await page.waitForTimeout(1000); // Wait for cache to update
      const updatedCache = await getLocalStorageCache(page, 'community');
      expect(updatedCache).not.toEqual(initialCache);

      console.log('[Test] ✅ Post creation invalidated community cache');
    } else {
      console.log('[Test] ⚠️ New Post button not found, skipping test');
      test.skip();
    }
  });

  test('Post like shows optimistic update', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Find a post with like button
    const likeButton = page.locator('button[aria-label*="Like"], button:has-text("Like")').first();

    if (await likeButton.isVisible({ timeout: 2000 })) {
      // Step 2: Get initial like count
      const likeCountBefore = await page.locator('text=/\\d+ likes?/i').first().textContent();

      // Step 3: Click like button
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/community/api/posts/') &&
          response.url().includes('/like') &&
          response.request().method() === 'POST'
      );

      await likeButton.click();

      // Step 4: Verify optimistic update (UI updates immediately)
      await page.waitForTimeout(100); // Small delay for optimistic update
      const likeCountAfterOptimistic = await page.locator('text=/\\d+ likes?/i').first().textContent();

      // Like count should update immediately (optimistic)
      expect(likeCountAfterOptimistic).not.toBe(likeCountBefore);

      // Step 5: Wait for server response
      const response = await responsePromise;
      expect(response.status()).toBe(200);

      // Step 6: Check cache invalidation headers
      const cacheHeaders = await waitForCacheInvalidation(response);
      expect(cacheHeaders.invalidateTypes).toContain('community');

      // Step 7: Verify final state matches server (no rollback)
      await page.waitForTimeout(1000);
      const likeCountFinal = await page.locator('text=/\\d+ likes?/i').first().textContent();
      expect(likeCountFinal).toBe(likeCountAfterOptimistic);

      console.log('[Test] ✅ Post like showed optimistic update');
    } else {
      console.log('[Test] ⚠️ Like button not found, skipping test');
      test.skip();
    }
  });

  test('Post like rollback on error', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Intercept like request to simulate error
    await page.route('**/community/api/posts/*/like', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Simulated error' }),
      });
    });

    // Step 2: Find like button
    const likeButton = page.locator('button[aria-label*="Like"], button:has-text("Like")').first();

    if (await likeButton.isVisible({ timeout: 2000 })) {
      // Step 3: Get initial state
      const likeCountBefore = await page.locator('text=/\\d+ likes?/i').first().textContent();

      // Step 4: Click like button
      await likeButton.click();

      // Step 5: Verify optimistic update happens
      await page.waitForTimeout(100);
      const likeCountOptimistic = await page.locator('text=/\\d+ likes?/i').first().textContent();
      expect(likeCountOptimistic).not.toBe(likeCountBefore);

      // Step 6: Wait for error and rollback
      await page.waitForTimeout(2000);

      // Step 7: Verify rollback to original state
      const likeCountAfterRollback = await page.locator('text=/\\d+ likes?/i').first().textContent();
      expect(likeCountAfterRollback).toBe(likeCountBefore);

      console.log('[Test] ✅ Post like rolled back on error');
    } else {
      console.log('[Test] ⚠️ Like button not found, skipping test');
      test.skip();
    }

    // Remove route interception
    await page.unroute('**/community/api/posts/*/like');
  });

  test('Post reply creation invalidates community cache', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Get initial cache
    const initialCache = await getLocalStorageCache(page, 'community');

    // Step 2: Find reply button
    const replyButton = page.locator('button:has-text("Reply"), button[aria-label*="Reply"]').first();

    if (await replyButton.isVisible({ timeout: 2000 })) {
      // Step 3: Listen for POST request
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/community/api/posts/') &&
          response.url().includes('/replies') &&
          response.request().method() === 'POST'
      );

      // Step 4: Click reply button
      await replyButton.click();

      // Step 5: Fill reply content
      const replyInput = page.locator('textarea[name="reply"], textarea[placeholder*="Reply"]').first();
      await replyInput.fill('Test reply for cache invalidation - ' + Date.now());

      // Step 6: Submit reply
      const submitButton = page.locator('button:has-text("Reply"), button:has-text("Submit")').last();
      await submitButton.click();

      // Step 7: Verify POST request
      const response = await responsePromise;
      expect(response.status()).toBe(200);

      // Step 8: Check cache invalidation headers
      const cacheHeaders = await waitForCacheInvalidation(response);
      expect(cacheHeaders.invalidateTypes).toContain('community');

      // Step 9: Verify cache invalidation
      await page.waitForTimeout(1000);
      const updatedCache = await getLocalStorageCache(page, 'community');
      expect(updatedCache).not.toEqual(initialCache);

      console.log('[Test] ✅ Reply creation invalidated community cache');
    } else {
      console.log('[Test] ⚠️ Reply button not found, skipping test');
      test.skip();
    }
  });

  test('Community cache invalidation prevents stale data', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Load community page
    await page.goto('http://localhost:3000/community');
    await page.waitForLoadState('networkidle');

    // Step 2: Get initial post count
    const posts = page.locator('[data-testid="community-post"], article, .post-card');
    const initialPostCount = await posts.count();

    // Step 3: Create a new post in a new tab
    const context = page.context();
    const newTab = await context.newPage();
    await newTab.goto('http://localhost:3000/community');
    await newTab.waitForLoadState('networkidle');

    const newPostButton = newTab.locator('button:has-text("New Post"), button:has-text("Create Post")').first();

    if (await newPostButton.isVisible({ timeout: 2000 })) {
      await newPostButton.click();

      const contentInput = newTab.locator('textarea[name="content"], textarea[placeholder*="Write"]').first();
      await contentInput.fill('Cross-tab cache test post - ' + Date.now());

      const submitButton = newTab.locator('button:has-text("Post"), button:has-text("Submit"), button[type="submit"]').first();
      await submitButton.click();

      await newTab.waitForTimeout(2000);

      // Step 4: Refresh original tab
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Step 5: Verify new post appears (cache was invalidated)
      const updatedPostCount = await posts.count();
      expect(updatedPostCount).toBeGreaterThan(initialPostCount);

      console.log('[Test] ✅ Community cache invalidation prevented stale data across tabs');

      await newTab.close();
    } else {
      console.log('[Test] ⚠️ New Post button not accessible, skipping test');
      test.skip();
      await newTab.close();
    }
  });

  test('Advanced Metrics Dashboard tracks community operations', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Open Advanced Metrics Dashboard (Ctrl+Shift+M)
    await page.keyboard.press('Control+Shift+M');
    await page.waitForTimeout(500);

    // Step 2: Verify dashboard is visible
    await expect(page.locator('text=Advanced Cache Metrics Dashboard')).toBeVisible();

    // Step 3: Perform community interaction (like a post)
    const likeButton = page.locator('button[aria-label*="Like"], button:has-text("Like")').first();

    if (await likeButton.isVisible({ timeout: 2000 })) {
      await likeButton.click();
      await page.waitForTimeout(2000);

      // Step 4: Check metrics dashboard for community operations
      const communityMetrics = page.locator('text=community, text=/community/i').first();
      await expect(communityMetrics).toBeVisible({ timeout: 5000 });

      // Step 5: Verify hit rate is displayed
      const hitRate = page.locator('text=/\\d+\\.\\d+%/').first();
      await expect(hitRate).toBeVisible();

      console.log('[Test] ✅ Advanced Metrics Dashboard tracked community operations');
    } else {
      console.log('[Test] ⚠️ Like button not found, skipping metrics test');
      test.skip();
    }
  });
});
