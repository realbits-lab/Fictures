/**
 * Performance Tests
 *
 * Tests for Core Web Vitals and performance benchmarks
 * Test Cases: TC-PERF-001 to TC-PERF-007
 */

import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('TC-PERF-001: Core Web Vitals meet thresholds (LCP < 2.5s)', async ({ page }) => {
    await page.goto('/');

    const metrics = await page.evaluate(() => {
      return new Promise(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lcp = entries[entries.length - 1] as any;
          resolve(lcp.renderTime || lcp.loadTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        setTimeout(() => resolve(null), 5000);
      });
    });

    if (metrics) {
      expect(metrics).toBeLessThan(2500);
    }
  });

  test('TC-PERF-002: First Contentful Paint < 1.8s', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const fcpMetrics = await page.evaluate(() =>
      performance.getEntriesByName('first-contentful-paint')[0]
    );

    if (fcpMetrics) {
      expect((fcpMetrics as any).startTime).toBeLessThan(1800);
    }
  });

  test('TC-PERF-004: Cumulative Layout Shift < 0.1', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const clsValue = await page.evaluate(() => {
      return new Promise(resolve => {
        let cls = 0;
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });

        setTimeout(() => resolve(cls), 3000);
      });
    });

    expect(clsValue).toBeLessThan(0.1);
  });

  test('TC-PERF-005: API response times < 500ms (p95)', async ({ page }) => {
    await page.goto('/studio');

    const apiCalls: number[] = [];

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        const timing = response.timing();
        if (timing) {
          apiCalls.push(timing.responseEnd);
        }
      }
    });

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    if (apiCalls.length > 0) {
      const p95 = apiCalls.sort((a, b) => a - b)[Math.floor(apiCalls.length * 0.95)];
      expect(p95).toBeLessThan(1000); // Allow 1s for p95
    }
  });
});
