import { test, expect, Page } from '@playwright/test';

/**
 * Cache Performance E2E Test
 *
 * Tests all three caching layers in real browser environment:
 * 1. SWR Memory Cache (30 minutes)
 * 2. localStorage Cache (1 hour)
 * 3. Redis Cache (10 minutes server-side)
 */

const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  timeout: 60000, // 60 seconds
};

test.describe('Cache Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test page
    await page.goto(`${TEST_CONFIG.baseUrl}/test/cache-performance`);
    await page.waitForLoadState('networkidle');
  });

  test('should load test page and display test stories', async ({ page }) => {
    // Check page loaded
    await expect(page.locator('h1')).toContainText('Cache Performance Test');

    // Wait for stories to load
    await page.waitForSelector('[role="button"]', { timeout: 10000 });

    // Check that test stories are displayed
    const stories = await page.locator('[role="button"]').count();
    expect(stories).toBeGreaterThan(0);

    console.log(`✅ Found ${stories} test stories`);
  });

  test('should measure cold cache load time', async ({ page }) => {
    console.log('\n🧊 Testing Cold Cache Load...\n');

    // Clear all caches first
    await page.click('button:has-text("Clear All Caches")');
    await page.waitForTimeout(1000);

    // Measure cold load
    const coldLoadTime = await measureLoadTime(page, 'cold');

    console.log(`⏱️  Cold Load Time: ${coldLoadTime.toFixed(2)}ms`);

    // Cold load should be slower (database query)
    expect(coldLoadTime).toBeGreaterThan(100);
    expect(coldLoadTime).toBeLessThan(5000);
  });

  test('should measure warm cache load time', async ({ page }) => {
    console.log('\n🔥 Testing Warm Cache Load...\n');

    // First load to warm cache
    await page.click('button:has-text("Run Full Cache Test")');
    await page.waitForSelector('text=✅ Test Complete!', { timeout: 30000 });

    // Wait for cache to settle
    await page.waitForTimeout(2000);

    // Clear page and reload to test localStorage
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Measure warm load (should hit localStorage or SWR)
    const warmLoadTime = await measureLoadTime(page, 'warm');

    console.log(`⏱️  Warm Load Time: ${warmLoadTime.toFixed(2)}ms`);

    // Warm load should be much faster
    expect(warmLoadTime).toBeLessThan(100);
  });

  test('should run full cache test and display results', async ({ page }) => {
    console.log('\n🏃 Running Full Cache Test...\n');

    // Click run test button
    await page.click('button:has-text("Run Full Cache Test")');

    // Wait for test to complete
    await page.waitForSelector('text=✅ Test Complete!', { timeout: 60000 });

    // Check that results table is displayed
    const table = await page.locator('table').count();
    expect(table).toBeGreaterThan(0);

    // Check for all three test phases
    await expect(page.locator('td:has-text("Cold Load")')).toBeVisible();
    await expect(page.locator('td:has-text("Warm Load")')).toBeVisible();
    await expect(page.locator('td:has-text("After Update")')).toBeVisible();

    // Extract performance metrics
    const metrics = await extractPerformanceMetrics(page);

    console.log('\n📊 Performance Metrics:');
    console.log(`   Cold Load: ${metrics.coldLoad}ms`);
    console.log(`   Warm Load: ${metrics.warmLoad}ms`);
    console.log(`   After Update: ${metrics.afterUpdate}ms`);

    // Verify performance improvements
    expect(metrics.warmLoad).toBeLessThan(metrics.coldLoad);

    // Calculate speedup
    const speedup = metrics.coldLoad / metrics.warmLoad;
    console.log(`   Cache Speedup: ${speedup.toFixed(2)}x faster`);

    // Verify minimum speedup (should be at least 2x faster)
    expect(speedup).toBeGreaterThan(2);
  });

  test('should test cache invalidation on data update', async ({ page }) => {
    console.log('\n🔄 Testing Cache Invalidation...\n');

    // Run full test
    await page.click('button:has-text("Run Full Cache Test")');
    await page.waitForSelector('text=✅ Test Complete!', { timeout: 60000 });

    // Extract metrics
    const metrics = await extractPerformanceMetrics(page);

    console.log('\n📊 Cache Invalidation Results:');
    console.log(`   Warm Load (before update): ${metrics.warmLoad}ms`);
    console.log(`   After Update: ${metrics.afterUpdate}ms`);

    // After update should be slower than warm load (cache invalidated)
    // But faster than cold load (still has some optimizations)
    expect(metrics.afterUpdate).toBeGreaterThan(metrics.warmLoad);
    expect(metrics.afterUpdate).toBeLessThan(metrics.coldLoad * 2);
  });

  test('should verify cache configuration display', async ({ page }) => {
    console.log('\n⚙️ Verifying Cache Configuration...\n');

    // Check Layer 1: SWR Memory
    await expect(page.locator('text=Layer 1: SWR Memory')).toBeVisible();
    await expect(page.locator('text=TTL: 30 minutes')).toBeVisible();

    // Check Layer 2: localStorage
    await expect(page.locator('text=Layer 2: localStorage')).toBeVisible();
    await expect(page.locator('text=TTL: 1 hour')).toBeVisible();

    // Check Layer 3: Redis
    await expect(page.locator('text=Layer 3: Redis')).toBeVisible();
    await expect(page.locator('text=TTL: 10 minutes')).toBeVisible();

    console.log('✅ All cache layers configured correctly');
  });

  test('should measure localStorage cache performance', async ({ page }) => {
    console.log('\n💾 Testing localStorage Cache...\n');

    // Run initial test to populate cache
    await page.click('button:has-text("Run Full Cache Test")');
    await page.waitForSelector('text=✅ Test Complete!', { timeout: 60000 });

    // Reload page to clear SWR memory cache
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Click first story to trigger localStorage fetch
    await page.locator('[role="button"]').first().click();
    await page.waitForTimeout(500);

    // Measure localStorage performance
    const startTime = Date.now();

    // The data should load from localStorage (very fast)
    await page.waitForSelector('text=Cache Test Story', { timeout: 5000 });

    const loadTime = Date.now() - startTime;

    console.log(`⏱️  localStorage Load Time: ${loadTime}ms`);

    // localStorage should be very fast (< 50ms)
    expect(loadTime).toBeLessThan(50);
  });
});

/**
 * Helper: Measure load time for a specific cache state
 */
async function measureLoadTime(page: Page, cacheState: 'cold' | 'warm'): Promise<number> {
  // Start performance measurement
  const startTime = Date.now();

  // Click first test story
  await page.locator('[role="button"]').first().click();

  // Wait for story data to load (look for story title)
  await page.waitForSelector('text=Cache Test Story', { timeout: 10000 });

  const endTime = Date.now();
  return endTime - startTime;
}

/**
 * Helper: Extract performance metrics from results table
 */
async function extractPerformanceMetrics(page: Page) {
  const coldLoadCell = page.locator('tr:has-text("Cold Load") td').nth(1);
  const warmLoadCell = page.locator('tr:has-text("Warm Load") td').nth(1);
  const afterUpdateCell = page.locator('tr:has-text("After Update") td').nth(1);

  const coldLoadText = await coldLoadCell.textContent();
  const warmLoadText = await warmLoadCell.textContent();
  const afterUpdateText = await afterUpdateCell.textContent();

  return {
    coldLoad: parseFloat(coldLoadText || '0'),
    warmLoad: parseFloat(warmLoadText || '0'),
    afterUpdate: parseFloat(afterUpdateText || '0'),
  };
}

/**
 * Helper: Clear browser cache and storage
 */
async function clearBrowserCache(page: Page) {
  // Clear localStorage
  await page.evaluate(() => {
    localStorage.clear();
  });

  // Clear session storage
  await page.evaluate(() => {
    sessionStorage.clear();
  });

  console.log('✅ Cleared browser storage');
}
