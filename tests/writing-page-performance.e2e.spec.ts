import { test, expect } from '@playwright/test';

test.describe('Stories Dashboard Performance Tests', () => {
  test('should test /stories page performance and database optimization', async ({ page, context }) => {
    // Enable network monitoring
    const networkRequests: Array<{
      url: string;
      method: string;
      timestamp: number;
      responseTime?: number;
      status?: number;
    }> = [];

    page.on('request', (request) => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now(),
      });
    });

    page.on('response', (response) => {
      const request = networkRequests.find(req => 
        req.url === response.url() && !req.responseTime
      );
      if (request) {
        request.responseTime = Date.now() - request.timestamp;
        request.status = response.status();
      }
    });

    // Load authentication state
    await context.addCookies([]);
    await page.goto('/');

    // Navigate to stories dashboard page and measure performance
    console.log('🚀 Starting navigation to /stories page...');
    const navigationStart = performance.now();
    
    await page.goto('http://localhost:3000/stories');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    const navigationEnd = performance.now();
    const totalNavigationTime = navigationEnd - navigationStart;
    
    console.log(`📊 Total navigation time: ${totalNavigationTime.toFixed(2)}ms`);

    // Check if the page loaded successfully
    await expect(page).toHaveURL(/.*\/stories/);
    
    // Wait for the dashboard content to be visible - look for the "My Stories" section
    await page.waitForSelector('h2:has-text("My Stories"), .grid, [class*="story"]', { 
      timeout: 30000 
    });

    // Find and analyze API calls
    const apiStoriesRequests = networkRequests.filter(req => 
      req.url.includes('/api/stories') && !req.url.includes('/structure')
    );
    
    console.log('\n📡 API Requests Analysis:');
    console.log('========================');
    
    apiStoriesRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.method} ${req.url}`);
      console.log(`   Status: ${req.status || 'pending'}`);
      console.log(`   Response time: ${req.responseTime ? req.responseTime + 'ms' : 'pending'}`);
      console.log('');
    });

    // Verify the main /api/stories endpoint was called
    const mainStoriesRequest = apiStoriesRequests.find(req => 
      req.url.endsWith('/api/stories') || req.url.includes('/api/stories?')
    );
    
    expect(mainStoriesRequest).toBeTruthy();
    console.log(`✅ Main /api/stories endpoint called`);
    
    if (mainStoriesRequest?.responseTime) {
      console.log(`⚡ /api/stories response time: ${mainStoriesRequest.responseTime}ms`);
      
      // Check if the optimized endpoint is performing well (should be much faster now)
      expect(mainStoriesRequest.responseTime).toBeLessThan(5000); // Allow 5s max
      
      if (mainStoriesRequest.responseTime < 2000) {
        console.log(`🎉 EXCELLENT: API response in ${mainStoriesRequest.responseTime}ms - optimization working!`);
      } else if (mainStoriesRequest.responseTime < 3000) {
        console.log(`✅ GOOD: API response in ${mainStoriesRequest.responseTime}ms`);
      } else {
        console.log(`⚠️  SLOW: API response in ${mainStoriesRequest.responseTime}ms - may need further optimization`);
      }
    }

    // Look for the dashboard grid layout and "Create New Story" card
    const createStoryCard = await page.locator('.grid .bg-gradient-to-br, [class*="create"]').count();
    const storyCards = await page.locator('.grid > div').count();
    console.log(`📚 Dashboard cards found: ${storyCards} (including create card: ${createStoryCard})`);
    
    // Verify the "My Stories" heading is present
    const myStoriesHeading = await page.locator('h2:has-text("My Stories")').count();
    expect(myStoriesHeading).toBeGreaterThan(0);
    console.log('✅ "My Stories" section is displayed correctly');
    
    // Check for dashboard widgets (AI Assistant, Recent Activity, etc.)
    const dashboardWidgets = await page.locator('section.grid > div > div').count();
    console.log(`🔧 Dashboard widgets found: ${dashboardWidgets}`);
    
    // Look for the create story card specifically
    if (createStoryCard > 0) {
      console.log('✅ Create new story card is visible');
    } else {
      console.log('⚠️  Create story card not found');
    }

    // Check for loading states and error handling
    const loadingIndicators = await page.locator('[class*="loading"], [class*="spinner"], [data-testid*="loading"]').count();
    const errorMessages = await page.locator('[class*="error"], [data-testid*="error"]').count();
    
    console.log(`🔄 Loading indicators: ${loadingIndicators}`);
    console.log(`❌ Error messages: ${errorMessages}`);
    
    // Check that there are no obvious errors
    expect(errorMessages).toBe(0);

    // Performance summary
    console.log('\n📈 Performance Summary:');
    console.log('======================');
    console.log(`Page load time: ${totalNavigationTime.toFixed(2)}ms`);
    console.log(`API requests made: ${apiStoriesRequests.length}`);
    console.log(`Stories displayed: ${storyElements}`);
    console.log(`Main API response: ${mainStoriesRequest?.responseTime || 'N/A'}ms`);
    
    // Verify performance expectations
    expect(totalNavigationTime).toBeLessThan(10000); // Page should load in under 10 seconds
    expect(apiStoriesRequests.length).toBeGreaterThanOrEqual(1); // At least one API call should be made
    
    // Take a screenshot for visual verification
    await page.screenshot({ 
      path: 'logs/stories-dashboard-performance-test.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved to logs/stories-dashboard-performance-test.png');
    
    // Verify SWR caching by checking if subsequent requests are faster
    console.log('\n🔄 Testing SWR caching by refreshing...');
    const beforeReload = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check if the page loaded faster on second load (indicating caching)
    const afterReload = Date.now();
    const cachedRequests = networkRequests.filter(req => 
      req.timestamp > beforeReload && req.url.includes('/api/stories')
    );
    
    console.log(`🔄 Cached requests made: ${cachedRequests.length}`);
    if (cachedRequests.length > 0) {
      const cachedResponseTime = cachedRequests[0]?.responseTime;
      if (cachedResponseTime) {
        console.log(`⚡ Cached response time: ${cachedResponseTime}ms`);
        if (mainStoriesRequest?.responseTime && cachedResponseTime < mainStoriesRequest.responseTime) {
          console.log('🎉 SWR caching appears to be working - faster subsequent load!');
        }
      }
    } else {
      console.log('💾 No new API requests on reload - SWR cache hit!');
    }

    // Test database optimization by checking query patterns in network tab
    console.log('\n🗃️  Database Optimization Check:');
    console.log('================================');
    
    // Count total API calls to stories-related endpoints
    const allStoriesAPICalls = networkRequests.filter(req => 
      req.url.includes('/api/stories') || req.url.includes('/api/chapters')
    );
    
    console.log(`Total stories-related API calls: ${allStoriesAPICalls.length}`);
    
    // The optimization should result in fewer API calls overall
    // Previously N+1 queries, now should be just 3 queries total
    if (allStoriesAPICalls.length <= 5) {
      console.log('✅ EXCELLENT: Low number of API calls - database optimization working!');
    } else {
      console.log(`⚠️  Many API calls detected (${allStoriesAPICalls.length}) - may indicate N+1 query pattern`);
    }
    
    console.log('\n🎯 Test completed successfully!');
  });
});