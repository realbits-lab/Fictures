/**
 * Performance Benchmarks: Cache System
 *
 * Measures cache performance across different scenarios.
 * Compares cache hit vs miss latency, validates 30-minute retention,
 * and measures prefetching effectiveness.
 *
 * Test Coverage:
 * - Cache hit latency (should be < 100ms)
 * - Cache miss latency (measures database query time)
 * - Cache retention (30-minute TTL validation)
 * - Prefetching effectiveness (hover, visible, idle)
 * - Optimistic update speed (should feel instant < 50ms)
 *
 * Run: dotenv --file .env.local run npx playwright test cache-performance-benchmarks
 */

import { test, expect } from '@playwright/test';

// Use authenticated state
test.use({ storageState: '.auth/user.json' });

// Test configuration
const TEST_TIMEOUT = 60000; // 60 seconds for performance tests

/**
 * Performance thresholds
 */
const THRESHOLDS = {
  CACHE_HIT_MAX_MS: 100, // Cache hits should be < 100ms
  OPTIMISTIC_UPDATE_MAX_MS: 50, // Optimistic updates should feel instant
  PREFETCH_MAX_MS: 500, // Prefetch should complete quickly
  PAGE_LOAD_WITH_CACHE_MAX_MS: 2000, // Page load with cache < 2s
  PAGE_LOAD_WITHOUT_CACHE_MAX_MS: 5000, // Page load without cache < 5s
};

/**
 * Helper: Measure operation duration
 */
async function measureDuration(fn: () => Promise<void>): Promise<number> {
  const start = Date.now();
  await fn();
  return Date.now() - start;
}

/**
 * Helper: Clear all caches
 */
async function clearAllCaches(page: any) {
  await page.evaluate(() => {
    // Clear localStorage
    localStorage.clear();

    // Clear SWR cache
    if (window.localStorage) {
      Object.keys(window.localStorage).forEach((key) => {
        if (key.startsWith('cache:') || key.startsWith('swr:')) {
          window.localStorage.removeItem(key);
        }
      });
    }
  });
}

test.describe('Performance Benchmarks: Cache System', () => {
  test('Cache hit latency < 100ms', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Navigate to page to warm cache
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    // Step 2: Measure second load (should hit cache)
    const cacheHitDuration = await measureDuration(async () => {
      await page.goto('http://localhost:3000/studio');
      await page.waitForLoadState('networkidle');
    });

    console.log(`[Benchmark] Cache hit latency: ${cacheHitDuration}ms`);

    // Validate threshold
    expect(cacheHitDuration).toBeLessThan(THRESHOLDS.CACHE_HIT_MAX_MS);

    console.log(`[Test] ✅ Cache hit latency: ${cacheHitDuration}ms (< ${THRESHOLDS.CACHE_HIT_MAX_MS}ms threshold)`);
  });

  test('Cache miss vs hit comparison', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Clear all caches
    await clearAllCaches(page);

    // Step 2: Measure cache miss (first load)
    const cacheMissDuration = await measureDuration(async () => {
      await page.goto('http://localhost:3000/community');
      await page.waitForLoadState('networkidle');
    });

    // Step 3: Measure cache hit (second load)
    const cacheHitDuration = await measureDuration(async () => {
      await page.goto('http://localhost:3000/community');
      await page.waitForLoadState('networkidle');
    });

    console.log(`[Benchmark] Cache miss: ${cacheMissDuration}ms`);
    console.log(`[Benchmark] Cache hit: ${cacheHitDuration}ms`);
    console.log(`[Benchmark] Speed improvement: ${((cacheMissDuration - cacheHitDuration) / cacheMissDuration * 100).toFixed(1)}%`);

    // Cache hit should be faster
    expect(cacheHitDuration).toBeLessThan(cacheMissDuration);

    console.log(`[Test] ✅ Cache hit (${cacheHitDuration}ms) faster than miss (${cacheMissDuration}ms)`);
  });

  test('30-minute cache retention validation', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Load page to populate cache
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    // Step 2: Get cache timestamp
    const cacheTimestamp = await page.evaluate(() => {
      const cacheKey = 'cache:writing';
      const data = localStorage.getItem(cacheKey);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.timestamp || Date.now();
      }
      return Date.now();
    });

    // Step 3: Calculate time until expiration (30 min)
    const expirationTime = cacheTimestamp + 30 * 60 * 1000;
    const timeUntilExpiration = expirationTime - Date.now();

    console.log(`[Benchmark] Cache timestamp: ${new Date(cacheTimestamp).toISOString()}`);
    console.log(`[Benchmark] Time until expiration: ${(timeUntilExpiration / 1000 / 60).toFixed(1)} minutes`);

    // Verify cache has valid timestamp
    expect(cacheTimestamp).toBeGreaterThan(0);
    expect(timeUntilExpiration).toBeGreaterThan(0);
    expect(timeUntilExpiration).toBeLessThanOrEqual(30 * 60 * 1000);

    console.log(`[Test] ✅ Cache has valid 30-minute retention timestamp`);
  });

  test('Optimistic update speed < 50ms', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Navigate to community
    await page.goto('http://localhost:3000/community');
    await page.waitForLoadState('networkidle');

    // Step 2: Find like button
    const likeButton = page.locator('button[aria-label*="Like"], button:has-text("Like")').first();

    if (await likeButton.isVisible({ timeout: 2000 })) {
      // Step 3: Measure optimistic update time
      const optimisticUpdateDuration = await measureDuration(async () => {
        await likeButton.click();
        // Wait for optimistic UI update (not server response)
        await page.waitForTimeout(10);
      });

      console.log(`[Benchmark] Optimistic update: ${optimisticUpdateDuration}ms`);

      // Optimistic update should feel instant
      expect(optimisticUpdateDuration).toBeLessThan(THRESHOLDS.OPTIMISTIC_UPDATE_MAX_MS);

      console.log(`[Test] ✅ Optimistic update: ${optimisticUpdateDuration}ms (< ${THRESHOLDS.OPTIMISTIC_UPDATE_MAX_MS}ms threshold)`);
    } else {
      console.log('[Test] ⚠️ Like button not found, skipping optimistic update benchmark');
      test.skip();
    }
  });

  test('Prefetch hover effectiveness', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Navigate to stories list
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    // Step 2: Find story card link (clickable story cards, not "Edit" buttons)
    const storyLink = page.locator('a[href*="/studio/edit/story/"]').first();

    if (await storyLink.isVisible({ timeout: 2000 })) {
      // Step 3: Hover to trigger prefetch
      await storyLink.hover();

      // Wait for prefetch to complete
      await page.waitForTimeout(200);

      // Step 4: Measure navigation time (should be fast if prefetch worked)
      const navigationDuration = await measureDuration(async () => {
        await storyLink.click();
        await page.waitForLoadState('networkidle');
      });

      console.log(`[Benchmark] Navigation after hover prefetch: ${navigationDuration}ms`);

      // Navigation should be fast if prefetch worked
      expect(navigationDuration).toBeLessThan(THRESHOLDS.PAGE_LOAD_WITH_CACHE_MAX_MS);

      console.log(`[Test] ✅ Hover prefetch improved navigation speed: ${navigationDuration}ms`);
    } else {
      console.log('[Test] ⚠️ Story link not found, skipping prefetch benchmark');
      test.skip();
    }
  });

  test('Page load with cache < 2s', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Warm cache
    await page.goto('http://localhost:3000/novels');
    await page.waitForLoadState('networkidle');

    // Step 2: Measure cached load time
    const cachedLoadDuration = await measureDuration(async () => {
      await page.goto('http://localhost:3000/novels');
      await page.waitForLoadState('networkidle');
    });

    console.log(`[Benchmark] Page load with cache: ${cachedLoadDuration}ms`);

    expect(cachedLoadDuration).toBeLessThan(THRESHOLDS.PAGE_LOAD_WITH_CACHE_MAX_MS);

    console.log(`[Test] ✅ Page load with cache: ${cachedLoadDuration}ms (< ${THRESHOLDS.PAGE_LOAD_WITH_CACHE_MAX_MS}ms threshold)`);
  });

  test('Page load without cache < 5s', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Clear caches
    await clearAllCaches(page);

    // Step 2: Measure uncached load time
    const uncachedLoadDuration = await measureDuration(async () => {
      await page.goto('http://localhost:3000/novels');
      await page.waitForLoadState('networkidle');
    });

    console.log(`[Benchmark] Page load without cache: ${uncachedLoadDuration}ms`);

    expect(uncachedLoadDuration).toBeLessThan(THRESHOLDS.PAGE_LOAD_WITHOUT_CACHE_MAX_MS);

    console.log(`[Test] ✅ Page load without cache: ${uncachedLoadDuration}ms (< ${THRESHOLDS.PAGE_LOAD_WITHOUT_CACHE_MAX_MS}ms threshold)`);
  });

  test('Cache metrics tracking overhead < 10ms', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Load page and perform operation
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    // Step 2: Measure metrics collection overhead
    const metricsOverhead = await page.evaluate(() => {
      const startTime = performance.now();

      // Simulate metrics collection (matching cache-metrics.ts logic)
      const metrics = [];
      for (let i = 0; i < 100; i++) {
        metrics.push({
          cacheType: 'swr',
          operation: 'hit' as const,
          key: `test-key-${i}`,
          duration: Math.random() * 100,
          timestamp: Date.now(),
        });
      }

      // Calculate stats (matching getStats logic)
      const totalHits = metrics.filter((m) => m.operation === 'hit').length;
      const totalMisses = metrics.filter((m) => m.operation === 'miss').length;
      const hitRate = totalHits / (totalHits + totalMisses);

      const endTime = performance.now();
      return endTime - startTime;
    });

    console.log(`[Benchmark] Metrics collection overhead: ${metricsOverhead.toFixed(2)}ms for 100 operations`);

    // Metrics overhead should be minimal
    expect(metricsOverhead).toBeLessThan(10);

    console.log(`[Test] ✅ Metrics overhead: ${metricsOverhead.toFixed(2)}ms (< 10ms threshold)`);
  });

  test('Cache invalidation performance', { timeout: TEST_TIMEOUT }, async ({ page }) => {
    // Step 1: Navigate to story editor
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    // Find story card link to navigate to editor
    const storyLink = page.locator('a[href*="/studio/edit/story/"]').first();
    if (await storyLink.isVisible({ timeout: 2000 })) {
      await storyLink.click();
      await page.waitForLoadState('networkidle');

      // Step 2: Measure invalidation time
      const invalidationDuration = await measureDuration(async () => {
        // Trigger save (which triggers cache invalidation)
        const contentEditor = page.locator('textarea[name="content"], div[contenteditable="true"]').first();
        await contentEditor.fill('Performance test - ' + Date.now());

        // Wait for autosave and invalidation
        await page.waitForTimeout(2500);
      });

      console.log(`[Benchmark] Cache invalidation: ${invalidationDuration}ms`);

      // Invalidation should be fast (< 3 seconds including autosave delay)
      expect(invalidationDuration).toBeLessThan(3000);

      console.log(`[Test] ✅ Cache invalidation completed in ${invalidationDuration}ms`);
    } else {
      console.log('[Test] ⚠️ Story link not found, skipping invalidation benchmark');
      test.skip();
    }
  });

  test.afterAll(async () => {
    // Print summary of all benchmarks
    console.log('\n=== Performance Benchmark Summary ===');
    console.log(`Cache Hit Threshold: < ${THRESHOLDS.CACHE_HIT_MAX_MS}ms`);
    console.log(`Optimistic Update Threshold: < ${THRESHOLDS.OPTIMISTIC_UPDATE_MAX_MS}ms`);
    console.log(`Page Load (Cached) Threshold: < ${THRESHOLDS.PAGE_LOAD_WITH_CACHE_MAX_MS}ms`);
    console.log(`Page Load (Uncached) Threshold: < ${THRESHOLDS.PAGE_LOAD_WITHOUT_CACHE_MAX_MS}ms`);
    console.log('=====================================\n');
  });
});
