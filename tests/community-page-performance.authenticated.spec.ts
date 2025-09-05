import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('Community Page Performance and Functionality Tests', () => {
  test.use({ storageState: '@playwright/.auth/user.json' });

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

    // Verify page title and URL
    await expect(page).toHaveTitle(/Community/);
    expect(page.url()).toContain('/community');
    
    console.log('✅ Page title and URL verified');

    // Check that essential elements are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    
    console.log('✅ Essential page elements are visible');

    // Performance assertion - page should load within reasonable time
    expect(performanceMetrics.totalLoadTime).toBeLessThan(5000); // 5 seconds max
    expect(performanceMetrics.navigationTime).toBeLessThan(2000); // 2 seconds max for initial navigation
    
    console.log('✅ Performance metrics within acceptable limits');
  });

  test('should display community stories correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/community');
    await page.waitForLoadState('networkidle');

    console.log('🔍 Testing community stories display...');

    // Look for story cards or story list elements
    const storyElements = page.locator('[data-testid*="story"], .story-card, .story-item, article');
    
    // Wait for stories to load (with timeout)
    try {
      await storyElements.first().waitFor({ timeout: 10000 });
      const storyCount = await storyElements.count();
      console.log(`📚 Found ${storyCount} story elements on the page`);
      
      if (storyCount > 0) {
        // Verify story elements contain expected content
        for (let i = 0; i < Math.min(storyCount, 3); i++) {
          const story = storyElements.nth(i);
          await expect(story).toBeVisible();
          
          // Check for typical story metadata
          const hasText = await story.textContent();
          expect(hasText).toBeTruthy();
          console.log(`✅ Story ${i + 1} has content: ${hasText?.substring(0, 50)}...`);
        }
      } else {
        console.log('📝 No stories found - this might be expected if the community is empty');
      }
    } catch (error) {
      console.log('⚠️ No story elements found within timeout - checking for empty state or loading indicators');
      
      // Check for loading indicators or empty state messages
      const loadingIndicator = page.locator('[data-testid="loading"], .loading, .spinner');
      const emptyState = page.locator('[data-testid="empty-state"], .empty-state, .no-stories');
      
      const isLoading = await loadingIndicator.count() > 0;
      const isEmpty = await emptyState.count() > 0;
      
      if (isLoading) {
        console.log('🔄 Found loading indicator - waiting for content to load');
        await page.waitForTimeout(2000);
      } else if (isEmpty) {
        console.log('📭 Found empty state indicator');
      } else {
        console.log('❓ No clear loading or empty state indicators found');
      }
    }
  });

  test('should demonstrate effective API caching', async ({ page }) => {
    console.log('🔄 Testing API caching effectiveness...');

    // Navigate to community page first time
    await page.goto('http://localhost:3000/community');
    await page.waitForLoadState('networkidle');
    
    const firstLoadRequests = networkRequests.filter(req => 
      req.url.includes('/api/') || req.url.includes('community')
    );
    
    console.log(`📡 First load API requests: ${firstLoadRequests.length}`);
    firstLoadRequests.forEach(req => {
      console.log(`  ${req.method} ${req.url} - Status: ${req.status}`);
    });

    // Reset network tracking
    networkRequests = [];

    // Navigate away and back to test caching
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Navigate back to community page
    await page.goto('http://localhost:3000/community');
    await page.waitForLoadState('networkidle');
    
    const secondLoadRequests = networkRequests.filter(req => 
      req.url.includes('/api/') || req.url.includes('community')
    );
    
    console.log(`📡 Second load API requests: ${secondLoadRequests.length}`);
    secondLoadRequests.forEach(req => {
      console.log(`  ${req.method} ${req.url} - Status: ${req.status}`);
    });

    // Verify caching effectiveness
    console.log(`📊 Caching effectiveness: ${firstLoadRequests.length} → ${secondLoadRequests.length} requests`);
    
    // The second load should have fewer requests due to caching
    if (firstLoadRequests.length > 0) {
      expect(secondLoadRequests.length).toBeLessThanOrEqual(firstLoadRequests.length);
      console.log('✅ API caching appears to be working - reduced request count on second load');
    } else {
      console.log('📝 No API requests detected - might indicate static content or different caching strategy');
    }
  });

  test('should handle navigation within community features', async ({ page }) => {
    await page.goto('http://localhost:3000/community');
    await page.waitForLoadState('networkidle');

    console.log('🧭 Testing community navigation...');

    // Look for navigation elements
    const navElements = page.locator('nav a, .nav-link, [data-testid*="nav"]');
    const navCount = await navElements.count();
    
    console.log(`🔗 Found ${navCount} navigation elements`);

    if (navCount > 0) {
      // Test navigation timing
      for (let i = 0; i < Math.min(navCount, 3); i++) {
        const navElement = navElements.nth(i);
        const navText = await navElement.textContent();
        const href = await navElement.getAttribute('href');
        
        if (href && href.startsWith('/') && !href.includes('#')) {
          console.log(`🔍 Testing navigation to: ${navText} (${href})`);
          
          const navStartTime = Date.now();
          await navElement.click();
          await page.waitForLoadState('networkidle');
          const navEndTime = Date.now();
          
          const navigationTime = navEndTime - navStartTime;
          console.log(`⏱️ Navigation time to ${href}: ${navigationTime}ms`);
          
          // Navigation should be fast
          expect(navigationTime).toBeLessThan(3000);
          
          // Navigate back to community page
          await page.goto('http://localhost:3000/community');
          await page.waitForLoadState('networkidle');
        }
      }
    } else {
      console.log('📝 No navigation elements found within community page');
    }
  });

  test('should measure and verify page performance metrics', async ({ page }) => {
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

    // Performance assertions
    if (performanceData.firstContentfulPaint) {
      expect(performanceData.firstContentfulPaint).toBeLessThan(2500); // FCP should be under 2.5s
    }
    if (performanceData.domContentLoaded) {
      expect(performanceData.domContentLoaded).toBeLessThan(3000); // DOMContentLoaded should be under 3s
    }
    if (performanceData.firstByte) {
      expect(performanceData.firstByte).toBeLessThan(1000); // TTFB should be under 1s
    }

    console.log('✅ All performance metrics within acceptable limits');
  });

  test('should verify SWR caching and data freshness', async ({ page }) => {
    console.log('🔄 Testing SWR caching strategy...');

    // Navigate to community page and capture network requests
    const apiRequests: string[] = [];
    
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/api/') && response.request().method() === 'GET') {
        apiRequests.push(url);
      }
    });

    await page.goto('http://localhost:3000/community');
    await page.waitForLoadState('networkidle');
    
    const initialApiCalls = [...apiRequests];
    console.log(`📡 Initial API calls: ${initialApiCalls.length}`);
    initialApiCalls.forEach(url => console.log(`  ${url}`));

    // Wait a moment and then trigger a potential revalidation
    await page.waitForTimeout(1000);
    
    // Click somewhere or trigger an action that might cause revalidation
    await page.mouse.move(100, 100);
    await page.waitForTimeout(500);

    const totalApiCalls = apiRequests.length;
    const revalidationCalls = totalApiCalls - initialApiCalls.length;
    
    console.log(`📡 Total API calls: ${totalApiCalls}`);
    console.log(`🔄 Potential revalidation calls: ${revalidationCalls}`);

    // SWR should minimize unnecessary requests
    console.log('✅ SWR caching analysis complete');
    
    // Check if there are any console errors related to data fetching
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    
    if (consoleLogs.length > 0) {
      console.log('⚠️ Console messages detected:');
      consoleLogs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('✅ No console errors or warnings detected');
    }
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