import { test, expect, type Page, type Request, type Response } from '@playwright/test';

interface PerformanceMetrics {
  navigationStart: number;
  loadEventEnd: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  totalLoadTime: number;
}

interface NetworkMetrics {
  totalRequests: number;
  apiRequests: Request[];
  totalTransferSize: number;
  averageResponseTime: number;
  slowestRequest: { url: string; time: number };
}

test.describe('/browse Page Performance Tests', () => {
  let performanceMetrics: PerformanceMetrics;
  let networkMetrics: NetworkMetrics;
  let apiRequests: Request[] = [];
  let apiResponses: Map<string, Response> = new Map();
  
  test.beforeEach(async ({ page }) => {
    // Reset metrics for each test
    apiRequests = [];
    apiResponses = new Map();
    
    // Set up network monitoring
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        apiRequests.push(request);
        console.log(`API Request: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        apiResponses.set(response.url(), response);
        console.log(`API Response: ${response.status()} ${response.url()}`);
      }
    });
  });

  test('should load /browse page with optimized performance', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to the browse page
    await page.goto('http://localhost:3000/browse');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for stories to be displayed
    await expect(page.locator('[data-testid="story-card"], .story-card, [class*="story"]')).toBeVisible({ timeout: 10000 });
    
    // Get performance metrics from the browser
    performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        navigationStart: navigation.navigationStart,
        loadEventEnd: navigation.loadEventEnd,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        firstContentfulPaint: 0, // Will be populated separately
        largestContentfulPaint: 0, // Will be populated separately
        totalLoadTime: navigation.loadEventEnd - navigation.navigationStart
      };
    });
    
    // Get paint metrics
    const paintMetrics = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      const lcp = performance.getEntriesByType('largest-contentful-paint')[0];
      
      return {
        firstContentfulPaint: fcp?.startTime || 0,
        largestContentfulPaint: lcp?.startTime || 0
      };
    });
    
    performanceMetrics.firstContentfulPaint = paintMetrics.firstContentfulPaint;
    performanceMetrics.largestContentfulPaint = paintMetrics.largestContentfulPaint;
    
    const endTime = Date.now();
    const clientSideLoadTime = endTime - startTime;
    
    // Calculate network metrics
    let totalTransferSize = 0;
    let totalResponseTime = 0;
    let slowestRequest = { url: '', time: 0 };
    
    for (const request of apiRequests) {
      const response = apiResponses.get(request.url());
      if (response) {
        const responseTime = await response.finished().then(() => Date.now()).catch(() => Date.now()) - startTime;
        totalResponseTime += responseTime;
        
        if (responseTime > slowestRequest.time) {
          slowestRequest = { url: request.url(), time: responseTime };
        }
        
        // Try to get response size
        try {
          const responseHeaders = await response.allHeaders();
          const contentLength = responseHeaders['content-length'];
          if (contentLength) {
            totalTransferSize += parseInt(contentLength);
          }
        } catch (error) {
          console.log('Could not get response size:', error);
        }
      }
    }
    
    networkMetrics = {
      totalRequests: apiRequests.length,
      apiRequests: apiRequests,
      totalTransferSize,
      averageResponseTime: apiRequests.length > 0 ? totalResponseTime / apiRequests.length : 0,
      slowestRequest
    };
    
    // Log performance results
    console.log('\n=== BROWSE PAGE PERFORMANCE ANALYSIS ===');
    console.log(`Client-side load time: ${clientSideLoadTime}ms`);
    console.log(`DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`First Contentful Paint: ${performanceMetrics.firstContentfulPaint}ms`);
    console.log(`Largest Contentful Paint: ${performanceMetrics.largestContentfulPaint}ms`);
    console.log(`Total browser load time: ${performanceMetrics.totalLoadTime}ms`);
    
    console.log('\n=== NETWORK ANALYSIS ===');
    console.log(`Total API requests: ${networkMetrics.totalRequests}`);
    console.log(`Average response time: ${networkMetrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`Slowest request: ${slowestRequest.url} (${slowestRequest.time}ms)`);
    console.log(`Total transfer size: ${totalTransferSize} bytes`);
    
    console.log('\n=== API ENDPOINTS CALLED ===');
    const uniqueEndpoints = [...new Set(apiRequests.map(req => req.url()))];
    uniqueEndpoints.forEach(url => {
      console.log(`- ${url}`);
    });
    
    // Performance assertions
    expect(performanceMetrics.domContentLoaded).toBeLessThan(5000); // DOM should load within 5 seconds
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(3000); // FCP should be under 3 seconds
    expect(networkMetrics.totalRequests).toBeLessThanOrEqual(5); // Should have optimized API calls (<=5 requests)
    expect(clientSideLoadTime).toBeLessThan(10000); // Total client-side load time under 10 seconds
  });

  test('should verify optimized database queries (<=3 API calls)', async ({ page }) => {
    // Navigate to browse page
    await page.goto('http://localhost:3000/browse');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="story-card"], .story-card, [class*="story"]')).toBeVisible({ timeout: 10000 });
    
    // Filter API requests to exclude static assets and focus on data fetching
    const dataApiRequests = apiRequests.filter(req => {
      const url = req.url();
      return url.includes('/api/') && 
             !url.includes('/_next/') && 
             !url.includes('/static/') &&
             (url.includes('stories') || url.includes('browse') || url.includes('published'));
    });
    
    console.log('\n=== DATABASE QUERY OPTIMIZATION ANALYSIS ===');
    console.log(`Total data API requests: ${dataApiRequests.length}`);
    console.log('Data API endpoints called:');
    dataApiRequests.forEach(req => {
      console.log(`- ${req.method()} ${req.url()}`);
    });
    
    // The optimization should reduce queries from 31+ to just 3
    expect(dataApiRequests.length).toBeLessThanOrEqual(3);
  });

  test('should verify story content displays correctly and shows all 6 stories', async ({ page }) => {
    console.log('\n=== BROWSE STORIES VERIFICATION TEST ===');
    
    // Navigate to browse page
    await page.goto('http://localhost:3000/browse');
    console.log('Navigated to http://localhost:3000/browse');
    
    // Wait for stories to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give extra time for all stories to render
    
    // Try multiple selectors to find story elements
    const possibleSelectors = [
      '[data-testid="story-card"]',
      '.story-card',
      '[class*="story"]',
      'article',
      '.card',
      '[data-story-id]',
      '.grid > div',
      '.flex.flex-col'
    ];
    
    let storyElements;
    let storyCount = 0;
    
    for (const selector of possibleSelectors) {
      storyElements = page.locator(selector);
      storyCount = await storyElements.count();
      console.log(`Selector "${selector}" found ${storyCount} elements`);
      
      if (storyCount > 0) {
        // Check if these look like story cards by examining their content
        for (let i = 0; i < Math.min(storyCount, 3); i++) {
          const element = storyElements.nth(i);
          const hasText = await element.innerText().catch(() => '');
          console.log(`Element ${i} with selector "${selector}" has text: ${hasText.substring(0, 100)}...`);
        }
        
        if (storyCount >= 6) {
          console.log(`Found ${storyCount} stories with selector: ${selector}`);
          break;
        }
      }
    }
    
    // Check if we can find specific story titles in the page content
    const expectedStories = [
      'The Last Guardian',
      'Mirrors of Reality', 
      'The Digital Awakening',
      'Echoes of Tomorrow',
      'Digital Nexus: The Code Between Worlds',
      'Debugging Realities'
    ];
    
    const foundStories = [];
    for (const storyTitle of expectedStories) {
      const isVisible = await page.locator(`text="${storyTitle}"`).isVisible().catch(() => false);
      if (isVisible) {
        foundStories.push(storyTitle);
        console.log(`✓ Found story: ${storyTitle}`);
      } else {
        console.log(`✗ Missing story: ${storyTitle}`);
      }
    }
    
    console.log(`\n=== VERIFICATION RESULTS ===`);
    console.log(`Expected stories: 6`);
    console.log(`Stories found by title: ${foundStories.length}`);
    console.log(`Stories found by element count: ${storyCount}`);
    console.log(`Found stories: ${foundStories.join(', ')}`);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'browse-page-verification.png', fullPage: true });
    console.log('Screenshot saved as browse-page-verification.png');
    
    // Verify all 6 stories are present
    expect(foundStories.length).toBeGreaterThanOrEqual(6);
    expect(foundStories).toEqual(expect.arrayContaining(expectedStories));
    
    console.log('✅ All 6 stories are correctly displayed on the browse page');
  });

  test('should check SWR caching effectiveness', async ({ page }) => {
    // First visit to populate cache
    await page.goto('http://localhost:3000/browse');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="story-card"], .story-card, [class*="story"]').first()).toBeVisible({ timeout: 10000 });
    
    const firstVisitRequests = apiRequests.length;
    console.log(`First visit API requests: ${firstVisitRequests}`);
    
    // Clear requests array for second visit
    apiRequests = [];
    apiResponses = new Map();
    
    // Second visit to test caching
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="story-card"], .story-card, [class*="story"]').first()).toBeVisible({ timeout: 10000 });
    
    const secondVisitRequests = apiRequests.length;
    console.log(`Second visit API requests: ${secondVisitRequests}`);
    
    console.log('\n=== SWR CACHING ANALYSIS ===');
    console.log(`First visit requests: ${firstVisitRequests}`);
    console.log(`Second visit requests: ${secondVisitRequests}`);
    console.log(`Cache effectiveness: ${secondVisitRequests <= firstVisitRequests ? 'EFFECTIVE' : 'INEFFECTIVE'}`);
    
    // SWR should reduce requests on subsequent visits
    expect(secondVisitRequests).toBeLessThanOrEqual(firstVisitRequests);
  });

  test('should measure API response times', async ({ page }) => {
    const responseTimings: { url: string; duration: number }[] = [];
    
    // Monitor response timing
    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const request = response.request();
        const timing = response.request().timing();
        if (timing) {
          responseTimings.push({
            url: response.url(),
            duration: timing.responseEnd - timing.requestStart
          });
        }
      }
    });
    
    await page.goto('http://localhost:3000/browse');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="story-card"], .story-card, [class*="story"]').first()).toBeVisible({ timeout: 10000 });
    
    console.log('\n=== API RESPONSE TIME ANALYSIS ===');
    responseTimings.forEach(timing => {
      console.log(`${timing.url}: ${timing.duration.toFixed(2)}ms`);
    });
    
    if (responseTimings.length > 0) {
      const avgResponseTime = responseTimings.reduce((sum, t) => sum + t.duration, 0) / responseTimings.length;
      const maxResponseTime = Math.max(...responseTimings.map(t => t.duration));
      
      console.log(`Average response time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`Maximum response time: ${maxResponseTime.toFixed(2)}ms`);
      
      // API responses should be reasonably fast
      expect(avgResponseTime).toBeLessThan(2000); // Average under 2 seconds
      expect(maxResponseTime).toBeLessThan(10000); // No single request over 10 seconds
    }
  });
});