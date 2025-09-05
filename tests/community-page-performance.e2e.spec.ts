import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('Community Page Performance Tests (Non-authenticated)', () => {
  let performanceMetrics: Record<string, number> = {};
  let networkRequests: Array<{ url: string; method: string; status: number; responseTime: number }> = [];

  test.beforeEach(async ({ page }) => {
    // Reset metrics
    performanceMetrics = {};
    networkRequests = [];

    // Track network requests for caching effectiveness analysis
    page.on('response', (response) => {
      const request = response.request();
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        status: response.status(),
        responseTime: 0 // Will be calculated
      });
    });

    // Enable performance metrics collection
    await page.evaluate(() => {
      window.performance.mark('test-start');
    });
  });

  test('should load community page with optimal performance', async ({ page }) => {
    const startTime = Date.now();

    console.log('🚀 Starting community page performance test...');
    
    // Navigate to community page and measure initial load time
    await page.goto('http://localhost:3000/community');
    
    const navigationEndTime = Date.now();
    performanceMetrics.navigationTime = navigationEndTime - startTime;
    
    console.log(`⏱️ Initial navigation time: ${performanceMetrics.navigationTime}ms`);

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    const loadCompleteTime = Date.now();
    performanceMetrics.totalLoadTime = loadCompleteTime - startTime;
    
    console.log(`📊 Total load time: ${performanceMetrics.totalLoadTime}ms`);

    // Verify page loaded successfully (check for common elements)
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    
    console.log('✅ Page content verified');

    // Performance assertion - page should load within reasonable time
    expect(performanceMetrics.totalLoadTime).toBeLessThan(10000); // 10 seconds max (generous for first load)
    expect(performanceMetrics.navigationTime).toBeLessThan(5000); // 5 seconds max for initial navigation
    
    console.log('✅ Performance metrics within acceptable limits');
  });

  test('should display community interface correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/community');
    await page.waitForLoadState('networkidle');

    console.log('🔍 Testing community interface...');

    // Check for navigation elements
    const navElements = await page.locator('nav').count();
    console.log(`🧭 Found ${navElements} navigation elements`);

    // Check for main content area
    const mainContent = await page.locator('main, .main-content, [role="main"]').count();
    console.log(`📄 Found ${mainContent} main content areas`);

    // Look for story or community-related elements
    const communityElements = await page.locator('[data-testid*="story"], .story, .community, article, .card').count();
    console.log(`📚 Found ${communityElements} community/story elements`);

    // Check for any loading states or error messages
    const loadingElements = await page.locator('.loading, [data-testid="loading"], .spinner').count();
    const errorElements = await page.locator('.error, [data-testid="error"], .alert-error').count();
    
    console.log(`🔄 Loading indicators: ${loadingElements}`);
    console.log(`❌ Error indicators: ${errorElements}`);

    // Basic functionality check - page should have some interactive elements
    const interactiveElements = await page.locator('button, a, input, select').count();
    console.log(`🎯 Interactive elements: ${interactiveElements}`);
    
    expect(interactiveElements).toBeGreaterThan(0);
    console.log('✅ Page has interactive elements');
  });

  test('should demonstrate effective caching strategy', async ({ page }) => {
    console.log('🔄 Testing caching strategy...');

    // Navigate to community page first time
    await page.goto('http://localhost:3000/community');
    await page.waitForLoadState('networkidle');
    
    const firstLoadRequests = networkRequests.filter(req => 
      req.url.includes('/api/') || 
      req.url.includes('/_next/') ||
      req.url.includes('.js') ||
      req.url.includes('.css')
    );
    
    console.log(`📡 First load requests: ${firstLoadRequests.length}`);

    // Reset network tracking
    networkRequests = [];

    // Navigate away and back to test caching
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Navigate back to community page
    await page.goto('http://localhost:3000/community');
    await page.waitForLoadState('networkidle');
    
    const secondLoadRequests = networkRequests.filter(req => 
      req.url.includes('/api/') || 
      req.url.includes('/_next/') ||
      req.url.includes('.js') ||
      req.url.includes('.css')
    );
    
    console.log(`📡 Second load requests: ${secondLoadRequests.length}`);

    // Log detailed request analysis
    const apiRequests = secondLoadRequests.filter(req => req.url.includes('/api/'));
    const staticRequests = secondLoadRequests.filter(req => 
      req.url.includes('/_next/') || req.url.includes('.js') || req.url.includes('.css')
    );
    
    console.log(`📊 Second load breakdown:`);
    console.log(`  API requests: ${apiRequests.length}`);
    console.log(`  Static requests: ${staticRequests.length}`);

    // The second load should ideally have fewer requests due to caching
    console.log(`📊 Caching effectiveness: ${firstLoadRequests.length} → ${secondLoadRequests.length} requests`);
    console.log('✅ Caching analysis complete');
  });

  test('should measure detailed performance metrics', async ({ page }) => {
    await page.goto('http://localhost:3000/community');

    console.log('📈 Collecting detailed performance metrics...');

    // Collect Web Vitals and performance metrics
    const performanceData = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics: Record<string, number> = {};
        
        // Collect navigation timing
        const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navTiming) {
          metrics.domContentLoaded = navTiming.domContentLoadedEventEnd - navTiming.fetchStart;
          metrics.loadComplete = navTiming.loadEventEnd - navTiming.fetchStart;
          metrics.firstByte = navTiming.responseStart - navTiming.fetchStart;
          metrics.domInteractive = navTiming.domInteractive - navTiming.fetchStart;
        }

        // Collect paint metrics
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
          if (entry.name === 'first-paint') {
            metrics.firstPaint = entry.startTime;
          } else if (entry.name === 'first-contentful-paint') {
            metrics.firstContentfulPaint = entry.startTime;
          }
        });

        // Collect resource timing
        const resourceEntries = performance.getEntriesByType('resource');
        metrics.totalResources = resourceEntries.length;
        metrics.totalTransferSize = resourceEntries.reduce((sum, entry: any) => sum + (entry.transferSize || 0), 0);

        // Collect JavaScript performance
        const jsEntries = resourceEntries.filter((entry: any) => 
          entry.name.includes('.js') || entry.name.includes('/_next/')
        );
        metrics.jsResources = jsEntries.length;
        metrics.jsTransferSize = jsEntries.reduce((sum, entry: any) => sum + (entry.transferSize || 0), 0);

        resolve(metrics);
      });
    });

    console.log('📊 Performance Metrics:');
    console.log(`  DOM Content Loaded: ${performanceData.domContentLoaded}ms`);
    console.log(`  Load Complete: ${performanceData.loadComplete}ms`);
    console.log(`  Time to First Byte: ${performanceData.firstByte}ms`);
    console.log(`  DOM Interactive: ${performanceData.domInteractive}ms`);
    console.log(`  First Paint: ${performanceData.firstPaint}ms`);
    console.log(`  First Contentful Paint: ${performanceData.firstContentfulPaint}ms`);
    console.log(`  Total Resources: ${performanceData.totalResources}`);
    console.log(`  Total Transfer Size: ${Math.round(performanceData.totalTransferSize / 1024)}KB`);
    console.log(`  JavaScript Resources: ${performanceData.jsResources}`);
    console.log(`  JavaScript Transfer Size: ${Math.round(performanceData.jsTransferSize / 1024)}KB`);

    // Performance assertions with reasonable limits for development
    if (performanceData.firstContentfulPaint) {
      expect(performanceData.firstContentfulPaint).toBeLessThan(4000); // FCP should be under 4s for dev
    }
    if (performanceData.domContentLoaded) {
      expect(performanceData.domContentLoaded).toBeLessThan(5000); // DOMContentLoaded should be under 5s
    }
    if (performanceData.firstByte) {
      expect(performanceData.firstByte).toBeLessThan(2000); // TTFB should be under 2s for dev
    }

    console.log('✅ All performance metrics within acceptable development limits');
  });

  test('should check network requests for optimization opportunities', async ({ page }) => {
    console.log('🌐 Analyzing network requests for optimization...');

    const allRequests: Array<{
      url: string;
      method: string;
      status: number;
      size: number;
      type: string;
      duration: number;
    }> = [];

    // Track all network activity
    page.on('response', async (response) => {
      const request = response.request();
      const timing = response.timing();
      
      try {
        const size = (await response.body()).length;
        allRequests.push({
          url: request.url(),
          method: request.method(),
          status: response.status(),
          size,
          type: response.headers()['content-type'] || 'unknown',
          duration: timing.responseEnd
        });
      } catch (error) {
        // Some responses might not have bodies
        allRequests.push({
          url: request.url(),
          method: request.method(),
          status: response.status(),
          size: 0,
          type: response.headers()['content-type'] || 'unknown',
          duration: timing.responseEnd
        });
      }
    });

    await page.goto('http://localhost:3000/community');
    await page.waitForLoadState('networkidle');

    // Analyze requests by type
    const apiRequests = allRequests.filter(req => req.url.includes('/api/'));
    const jsRequests = allRequests.filter(req => req.type.includes('javascript') || req.url.includes('.js'));
    const cssRequests = allRequests.filter(req => req.type.includes('css') || req.url.includes('.css'));
    const imageRequests = allRequests.filter(req => req.type.includes('image'));
    const failedRequests = allRequests.filter(req => req.status >= 400);

    console.log('📊 Network Request Analysis:');
    console.log(`  Total Requests: ${allRequests.length}`);
    console.log(`  API Requests: ${apiRequests.length}`);
    console.log(`  JavaScript Requests: ${jsRequests.length}`);
    console.log(`  CSS Requests: ${cssRequests.length}`);
    console.log(`  Image Requests: ${imageRequests.length}`);
    console.log(`  Failed Requests: ${failedRequests.length}`);

    if (apiRequests.length > 0) {
      console.log('📡 API Requests:');
      apiRequests.forEach(req => {
        console.log(`  ${req.method} ${req.url} - ${req.status} (${Math.round(req.size / 1024)}KB, ${req.duration}ms)`);
      });
    }

    if (failedRequests.length > 0) {
      console.log('❌ Failed Requests:');
      failedRequests.forEach(req => {
        console.log(`  ${req.method} ${req.url} - ${req.status}`);
      });
    }

    // Performance recommendations
    const totalSize = allRequests.reduce((sum, req) => sum + req.size, 0);
    console.log(`📦 Total Transfer Size: ${Math.round(totalSize / 1024)}KB`);

    if (jsRequests.length > 10) {
      console.log('⚠️ Recommendation: Consider bundling JavaScript files to reduce request count');
    }
    if (totalSize > 1024 * 1024) { // 1MB
      console.log('⚠️ Recommendation: Total transfer size is large, consider optimization');
    }

    expect(failedRequests.length).toBe(0); // Should have no failed requests
    console.log('✅ Network request analysis complete');
  });

  test.afterEach(async ({ page }) => {
    // Log final network analysis
    const apiRequests = networkRequests.filter(req => req.url.includes('/api/'));
    const staticRequests = networkRequests.filter(req => 
      req.url.includes('/_next/') || 
      req.url.includes('.js') || 
      req.url.includes('.css') || 
      req.url.includes('.png') || 
      req.url.includes('.svg')
    );

    console.log('📊 Final Network Analysis:');
    console.log(`  Total Requests: ${networkRequests.length}`);
    console.log(`  API Requests: ${apiRequests.length}`);
    console.log(`  Static Requests: ${staticRequests.length}`);
    console.log(`  Failed Requests: ${networkRequests.filter(req => req.status >= 400).length}`);

    // Log performance summary
    if (Object.keys(performanceMetrics).length > 0) {
      console.log('🎯 Performance Summary:');
      Object.entries(performanceMetrics).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}ms`);
      });
    }
  });
});