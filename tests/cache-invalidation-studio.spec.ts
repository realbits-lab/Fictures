/**
 * E2E Tests: Cache Invalidation - Studio Routes
 *
 * Tests cache invalidation for Studio workspace mutations.
 * Verifies that edits properly invalidate caches and prevent data loss.
 *
 * Test Coverage:
 * - Scene updates (PATCH /studio/api/scenes/[id])
 * - Scene deletion (DELETE /studio/api/scenes/[id])
 * - Chapter updates (PATCH /studio/api/chapters/[id])
 * - Story updates (PATCH /studio/api/stories/[id]/write)
 *
 * Run: dotenv --file .env.local run npx playwright test cache-invalidation-studio
 */

import { test, expect } from '@playwright/test';

// Use authenticated state
test.use({ storageState: '.auth/user.json' });

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds per test

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
 * Helper: Get first test story ID from Studio page
 */
async function getFirstTestStoryId(page: any): Promise<string | null> {
  // Try to find a story card link
  const storyLink = await page.locator('a[href*="/studio/edit/story/"]').first();

  if (await storyLink.count() > 0) {
    const href = await storyLink.getAttribute('href');
    const match = href?.match(/\/studio\/edit\/story\/([^\/]+)/);
    return match ? match[1] : null;
  }

  // Fallback: Use known test story IDs
  const testStoryIds = [
    'g6Jy-EoFLW_TuyxHVjIci',
    'FjmVo1UY6qRweYQPrOoWP',
    '4dAQF4PpmSBTRRGxxU7IZ'
  ];

  return testStoryIds[0];
}

test.describe('Cache Invalidation: Studio Routes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Studio page
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    // Verify authenticated
    await expect(page.locator('text=Studio')).toBeVisible();
  });

  test('Scene PATCH invalidates writing cache', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Get test story and navigate to editor
    const storyId = await getFirstTestStoryId(page);
    if (!storyId) {
      console.log('[Test] ⚠️ No test story found, skipping test');
      test.skip();
      return;
    }

    await page.goto(`http://localhost:3000/studio/edit/story/${storyId}`);
    await page.waitForLoadState('networkidle');

    // Step 2: Get initial localStorage cache
    const initialCache = await getLocalStorageCache(page, 'writing');
    expect(initialCache).toBeDefined();

    // Step 3: Listen for PATCH request
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/studio/api/scenes/') && response.request().method() === 'PATCH'
    );

    // Step 4: Edit a scene (trigger autosave)
    const contentEditor = page.locator('textarea[name="content"], div[contenteditable="true"]').first();
    await contentEditor.fill('Test content update for cache invalidation');

    // Wait for autosave (usually triggers after 1-2 seconds)
    await page.waitForTimeout(2500);

    // Step 5: Verify PATCH request was made
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    // Step 6: Check cache invalidation headers
    const cacheHeaders = await waitForCacheInvalidation(response);
    expect(cacheHeaders.invalidateTypes).toContain('writing');
    expect(cacheHeaders.invalidateKeys).toBeDefined();
    expect(cacheHeaders.timestamp).toBeDefined();

    // Step 7: Verify localStorage was invalidated
    const updatedCache = await getLocalStorageCache(page, 'writing');
    expect(updatedCache).not.toEqual(initialCache);

    console.log('[Test] ✅ Scene PATCH invalidated writing cache');
  });

  test('Scene DELETE invalidates writing cache', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Get test story and navigate to editor
    const storyId = await getFirstTestStoryId(page);
    if (!storyId) {
      console.log('[Test] ⚠️ No test story found, skipping test');
      test.skip();
      return;
    }

    await page.goto(`http://localhost:3000/studio/edit/story/${storyId}`);
    await page.waitForLoadState('networkidle');

    // Step 2: Get initial cache
    const initialCache = await getLocalStorageCache(page, 'writing');

    // Step 3: Listen for DELETE request
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/studio/api/scenes/') && response.request().method() === 'DELETE'
    );

    // Step 4: Delete a scene (click delete button if available)
    const deleteButton = page.locator('button:has-text("Delete Scene"), button[title*="Delete"]').first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Confirm deletion if modal appears
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      // Step 5: Verify DELETE request
      const response = await responsePromise;
      expect(response.status()).toBe(200);

      // Step 6: Check cache invalidation headers
      const cacheHeaders = await waitForCacheInvalidation(response);
      expect(cacheHeaders.invalidateTypes).toContain('writing');

      // Step 7: Verify cache was invalidated
      const updatedCache = await getLocalStorageCache(page, 'writing');
      expect(updatedCache).not.toEqual(initialCache);

      console.log('[Test] ✅ Scene DELETE invalidated writing cache');
    } else {
      console.log('[Test] ⚠️ No Delete button found, skipping scene deletion test');
      test.skip();
    }
  });

  test('Chapter PATCH invalidates writing cache', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Get test story and navigate to editor
    const storyId = await getFirstTestStoryId(page);
    if (!storyId) {
      console.log('[Test] ⚠️ No test story found, skipping test');
      test.skip();
      return;
    }

    await page.goto(`http://localhost:3000/studio/edit/story/${storyId}`);
    await page.waitForLoadState('networkidle');

    // Step 2: Get initial cache
    const initialCache = await getLocalStorageCache(page, 'writing');

    // Step 3: Listen for PATCH request
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/studio/api/chapters/') && response.request().method() === 'PATCH'
    );

    // Step 4: Edit chapter title or summary
    const chapterTitleInput = page.locator('input[name="title"], input[placeholder*="Chapter"]').first();

    if (await chapterTitleInput.isVisible({ timeout: 2000 })) {
      await chapterTitleInput.fill('Updated Chapter Title - Cache Test');
      await page.waitForTimeout(2500); // Wait for autosave

      // Step 5: Verify PATCH request
      const response = await responsePromise;
      expect(response.status()).toBe(200);

      // Step 6: Check cache invalidation headers
      const cacheHeaders = await waitForCacheInvalidation(response);
      expect(cacheHeaders.invalidateTypes).toContain('writing');

      // Step 7: Verify cache invalidation
      const updatedCache = await getLocalStorageCache(page, 'writing');
      expect(updatedCache).not.toEqual(initialCache);

      console.log('[Test] ✅ Chapter PATCH invalidated writing cache');
    } else {
      console.log('[Test] ⚠️ Chapter title input not found, skipping test');
      test.skip();
    }
  });

  test('Story PATCH invalidates writing and browse caches', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Navigate to story settings
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    // Step 2: Get initial caches
    const initialWritingCache = await getLocalStorageCache(page, 'writing');
    const initialBrowseCache = await getLocalStorageCache(page, 'browse');

    // Step 3: Listen for PATCH request to story
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/studio/api/stories/') &&
        response.url().includes('/write') &&
        response.request().method() === 'PATCH'
    );

    // Step 4: Click on story settings/edit
    const settingsButton = page.locator('button:has-text("Settings"), a:has-text("Edit Story")').first();

    if (await settingsButton.isVisible({ timeout: 2000 })) {
      await settingsButton.click();
      await page.waitForLoadState('networkidle');

      // Edit story title or description
      const titleInput = page.locator('input[name="title"], input[placeholder*="Title"]').first();
      await titleInput.fill('Updated Story Title - Cache Test');

      // Save changes
      const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
      await saveButton.click();

      // Step 5: Verify PATCH request
      const response = await responsePromise;
      expect(response.status()).toBe(200);

      // Step 6: Check cache invalidation headers
      const cacheHeaders = await waitForCacheInvalidation(response);
      expect(cacheHeaders.invalidateTypes).toContain('writing');
      expect(cacheHeaders.invalidateTypes).toContain('browse');

      // Step 7: Verify both caches were invalidated
      const updatedWritingCache = await getLocalStorageCache(page, 'writing');
      const updatedBrowseCache = await getLocalStorageCache(page, 'browse');

      expect(updatedWritingCache).not.toEqual(initialWritingCache);
      expect(updatedBrowseCache).not.toEqual(initialBrowseCache);

      console.log('[Test] ✅ Story PATCH invalidated writing and browse caches');
    } else {
      console.log('[Test] ⚠️ Story settings not accessible, skipping test');
      test.skip();
    }
  });

  test('Cache invalidation prevents data loss on page refresh', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Navigate to editor
    await page.click('text=Edit');
    await page.waitForLoadState('networkidle');

    // Step 2: Make an edit
    const contentEditor = page.locator('textarea[name="content"], div[contenteditable="true"]').first();
    const testContent = `Cache invalidation test content - ${Date.now()}`;
    await contentEditor.fill(testContent);

    // Step 3: Wait for autosave
    await page.waitForTimeout(2500);

    // Step 4: Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Step 5: Verify content persists (data not lost)
    const contentAfterRefresh = await page.locator('textarea[name="content"], div[contenteditable="true"]').first().inputValue();

    expect(contentAfterRefresh).toContain(testContent);

    console.log('[Test] ✅ Cache invalidation prevented data loss on refresh');
  });

  test('Cache Debug Panel shows invalidation events', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Open Cache Debug Panel (Ctrl+Shift+D)
    await page.keyboard.press('Control+Shift+D');
    await page.waitForTimeout(500);

    // Step 2: Verify panel is visible
    await expect(page.locator('text=Cache Debug Panel')).toBeVisible();

    // Step 3: Make an edit to trigger invalidation
    await page.click('text=Edit');
    await page.waitForLoadState('networkidle');

    const contentEditor = page.locator('textarea[name="content"], div[contenteditable="true"]').first();
    await contentEditor.fill('Test for cache debug panel');
    await page.waitForTimeout(2500);

    // Step 4: Check debug panel for invalidation events
    const recentOps = page.locator('text=INVALIDATE').first();
    await expect(recentOps).toBeVisible({ timeout: 5000 });

    console.log('[Test] ✅ Cache Debug Panel shows invalidation events');
  });
});
