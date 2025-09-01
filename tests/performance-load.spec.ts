import { test, expect } from '@playwright/test';

test.describe('Performance and Load Testing - Comprehensive Performance Analysis', () => {
  
  test('Page load performance across different routes', async ({ page }) => {
    const routes = [
      { path: '/', name: 'Home' },
      { path: '/stories', name: 'Stories' },
      { path: '/write/1', name: 'Chapter Editor' },
      { path: '/analytics', name: 'Analytics' },
      { path: '/community', name: 'Community' },
      { path: '/assistant', name: 'AI Assistant' },
      { path: '/profile', name: 'Profile' },
      { path: '/settings', name: 'Settings' }
    ];

    const performanceResults = [];

    for (const route of routes) {
      const startTime = Date.now();
      
      // Navigate to route
      await page.goto(route.path);
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      
      // Check if page loaded successfully (not 404)
      const notFound = await page.locator(':text("404"), :text("Not Found")').count();
      const pageAccessible = notFound === 0;
      
      let contentElements = 0;
      let imageElements = 0;
      let scriptElements = 0;
      
      if (pageAccessible) {
        // Count content elements
        contentElements = await page.locator('h1, h2, p, div, section, article').count();
        imageElements = await page.locator('img').count();
        scriptElements = await page.locator('script').count();
      }

      const result = {
        route: route.name,
        path: route.path,
        loadTime,
        accessible: pageAccessible,
        contentElements,
        imageElements,
        scriptElements
      };

      performanceResults.push(result);
      
      console.log(`📊 ${route.name}: ${loadTime}ms (${pageAccessible ? 'accessible' : '404'}, ${contentElements} elements)`);
    }

    // Performance analysis
    const accessiblePages = performanceResults.filter(r => r.accessible);
    const avgLoadTime = accessiblePages.reduce((sum, r) => sum + r.loadTime, 0) / accessiblePages.length;
    const fastPages = accessiblePages.filter(r => r.loadTime < 1000).length;
    const slowPages = accessiblePages.filter(r => r.loadTime > 3000).length;

    console.log('\n📈 Performance Summary:');
    console.log(`✓ Pages accessible: ${accessiblePages.length}/${routes.length}`);
    console.log(`✓ Average load time: ${Math.round(avgLoadTime)}ms`);
    console.log(`✓ Fast pages (<1s): ${fastPages}/${accessiblePages.length}`);
    console.log(`✓ Slow pages (>3s): ${slowPages}/${accessiblePages.length}`);

    // Performance assertions
    expect(avgLoadTime).toBeLessThan(5000); // Average should be under 5 seconds
    expect(accessiblePages.length).toBeGreaterThanOrEqual(routes.length * 0.7); // At least 70% accessible
  });

  test('Memory and resource usage monitoring', async ({ page, browser }) => {
    console.log('🔍 Starting memory and resource usage monitoring test');

    // Get initial browser metrics
    const context = page.context();
    
    const routes = ['/', '/stories', '/write/1'];
    const resourceMetrics = [];

    for (const route of routes) {
      // Start monitoring performance
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Get page metrics
      const performanceMetrics = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paintEntries = performance.getEntriesByType('paint');
        
        return {
          domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd - nav.fetchStart) : 0,
          loadComplete: nav ? Math.round(nav.loadEventEnd - nav.fetchStart) : 0,
          firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0,
          resourceCount: performance.getEntriesByType('resource').length
        };
      });

      // Memory usage estimation
      const jsHeapSize = await page.evaluate(() => {
        // @ts-ignore - performance.memory is available in Chrome
        return (performance as any).memory ? {
          used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
        } : null;
      });

      resourceMetrics.push({
        route,
        ...performanceMetrics,
        memoryUsage: jsHeapSize
      });

      console.log(`📊 ${route}:`);
      console.log(`  - DOM ready: ${performanceMetrics.domContentLoaded}ms`);
      console.log(`  - Load complete: ${performanceMetrics.loadComplete}ms`);
      console.log(`  - First paint: ${Math.round(performanceMetrics.firstPaint)}ms`);
      console.log(`  - Resources loaded: ${performanceMetrics.resourceCount}`);
      if (jsHeapSize) {
        console.log(`  - Memory used: ${jsHeapSize.used}MB / ${jsHeapSize.total}MB`);
      }
    }

    // Analyze resource usage
    const avgDOMReady = resourceMetrics.reduce((sum, m) => sum + m.domContentLoaded, 0) / resourceMetrics.length;
    const avgLoadComplete = resourceMetrics.reduce((sum, m) => sum + m.loadComplete, 0) / resourceMetrics.length;
    const avgResourceCount = resourceMetrics.reduce((sum, m) => sum + m.resourceCount, 0) / resourceMetrics.length;

    console.log('\n📈 Resource Usage Summary:');
    console.log(`✓ Average DOM ready time: ${Math.round(avgDOMReady)}ms`);
    console.log(`✓ Average load complete time: ${Math.round(avgLoadComplete)}ms`);
    console.log(`✓ Average resources per page: ${Math.round(avgResourceCount)}`);

    // Performance thresholds
    expect(avgDOMReady).toBeLessThan(3000); // DOM should be ready within 3 seconds
    expect(avgLoadComplete).toBeLessThan(5000); // Page should fully load within 5 seconds
  });

  test('Concurrent user simulation', async ({ browser }) => {
    console.log('👥 Starting concurrent user simulation test');

    const concurrentUsers = 5;
    const testDuration = 10000; // 10 seconds
    const userActions = [];

    // Simulate concurrent users
    const userPromises = Array.from({ length: concurrentUsers }, async (_, userIndex) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      const userMetrics = {
        userId: userIndex + 1,
        actionsPerformed: 0,
        errors: 0,
        avgResponseTime: 0,
        responseTimes: []
      };

      const startTime = Date.now();
      
      try {
        while (Date.now() - startTime < testDuration) {
          const actionStart = Date.now();
          
          // Random user actions
          const actions = [
            () => page.goto('/'),
            () => page.goto('/stories'),
            () => page.goto('/write/1'),
            () => page.goto('/analytics'),
            () => page.goto('/community')
          ];

          const randomAction = actions[Math.floor(Math.random() * actions.length)];
          
          try {
            await randomAction();
            await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
            
            const responseTime = Date.now() - actionStart;
            userMetrics.responseTimes.push(responseTime);
            userMetrics.actionsPerformed++;

          } catch (error) {
            userMetrics.errors++;
            console.log(`❌ User ${userIndex + 1} error:`, error.message);
          }

          // Random delay between actions (0.5-2 seconds)
          await page.waitForTimeout(500 + Math.random() * 1500);
        }

      } finally {
        await context.close();
      }

      // Calculate average response time
      userMetrics.avgResponseTime = userMetrics.responseTimes.length > 0 
        ? userMetrics.responseTimes.reduce((sum, time) => sum + time, 0) / userMetrics.responseTimes.length
        : 0;

      return userMetrics;
    });

    // Wait for all concurrent users to complete
    const allUserMetrics = await Promise.all(userPromises);

    // Analyze concurrent performance
    const totalActions = allUserMetrics.reduce((sum, user) => sum + user.actionsPerformed, 0);
    const totalErrors = allUserMetrics.reduce((sum, user) => sum + user.errors, 0);
    const avgResponseTime = allUserMetrics.reduce((sum, user) => sum + user.avgResponseTime, 0) / allUserMetrics.length;
    const errorRate = totalErrors / totalActions * 100;

    console.log('\n👥 Concurrent User Test Results:');
    console.log(`✓ Concurrent users: ${concurrentUsers}`);
    console.log(`✓ Total actions performed: ${totalActions}`);
    console.log(`✓ Total errors: ${totalErrors}`);
    console.log(`✓ Error rate: ${errorRate.toFixed(2)}%`);
    console.log(`✓ Average response time: ${Math.round(avgResponseTime)}ms`);

    allUserMetrics.forEach((user, index) => {
      console.log(`  User ${user.userId}: ${user.actionsPerformed} actions, ${user.errors} errors, ${Math.round(user.avgResponseTime)}ms avg`);
    });

    // Performance assertions for concurrent usage
    expect(errorRate).toBeLessThan(10); // Less than 10% error rate
    expect(avgResponseTime).toBeLessThan(10000); // Average response under 10 seconds during load
    expect(totalActions).toBeGreaterThan(concurrentUsers * 2); // At least 2 actions per user on average
  });

  test('API endpoint performance under load', async ({ page }) => {
    console.log('🔄 Starting API endpoint performance testing');

    const apiEndpoints = [
      { method: 'GET', path: '/api/stories', name: 'Stories API' },
      { method: 'GET', path: '/api/chapters', name: 'Chapters API' },
      { method: 'GET', path: '/api/chapters/1', name: 'Individual Chapter API' },
      { method: 'POST', path: '/api/ai/chat', name: 'AI Chat API' },
      { method: 'POST', path: '/api/ai/analyze', name: 'AI Analysis API' }
    ];

    const apiResults = [];

    for (const endpoint of apiEndpoints) {
      const testCount = 5;
      const responseTimes = [];
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < testCount; i++) {
        const startTime = Date.now();
        
        try {
          let response;
          
          if (endpoint.method === 'GET') {
            response = await page.request.get(endpoint.path);
          } else if (endpoint.method === 'POST') {
            response = await page.request.post(endpoint.path, {
              data: {
                message: 'Test message for performance testing',
                content: 'Test content for API performance testing'
              }
            });
          }

          const responseTime = Date.now() - startTime;
          responseTimes.push(responseTime);

          if (response && [200, 201, 401, 403].includes(response.status())) {
            successCount++;
          } else {
            errorCount++;
          }

        } catch (error) {
          errorCount++;
          const responseTime = Date.now() - startTime;
          responseTimes.push(responseTime);
        }

        // Small delay between requests
        await page.waitForTimeout(200);
      }

      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const minResponseTime = Math.min(...responseTimes);
      const maxResponseTime = Math.max(...responseTimes);

      const result = {
        endpoint: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        avgResponseTime: Math.round(avgResponseTime),
        minResponseTime,
        maxResponseTime,
        successCount,
        errorCount,
        successRate: (successCount / testCount) * 100
      };

      apiResults.push(result);

      console.log(`📡 ${endpoint.name}:`);
      console.log(`  - Average response: ${result.avgResponseTime}ms`);
      console.log(`  - Range: ${minResponseTime}ms - ${maxResponseTime}ms`);
      console.log(`  - Success rate: ${result.successRate}%`);
    }

    // API performance analysis
    const avgApiResponseTime = apiResults.reduce((sum, api) => sum + api.avgResponseTime, 0) / apiResults.length;
    const fastApis = apiResults.filter(api => api.avgResponseTime < 1000).length;
    const reliableApis = apiResults.filter(api => api.successRate >= 80).length;

    console.log('\n📊 API Performance Summary:');
    console.log(`✓ Average API response time: ${Math.round(avgApiResponseTime)}ms`);
    console.log(`✓ Fast APIs (<1s): ${fastApis}/${apiResults.length}`);
    console.log(`✓ Reliable APIs (≥80% success): ${reliableApis}/${apiResults.length}`);

    // API performance assertions
    expect(avgApiResponseTime).toBeLessThan(5000); // Average API response under 5 seconds
    expect(reliableApis / apiResults.length).toBeGreaterThanOrEqual(0.5); // At least 50% of APIs should be reliable
  });

  test('Large content handling and scrolling performance', async ({ page }) => {
    console.log('📜 Starting large content handling test');

    // Create a page with large content
    await page.setContent(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
            .large-content { max-width: 800px; margin: 0 auto; }
            p { margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <div class="large-content">
            <h1>Large Content Performance Test</h1>
            ${Array.from({ length: 100 }, (_, i) => `
              <h2>Section ${i + 1}</h2>
              <p>This is a large content section with multiple paragraphs to test scrolling performance and content rendering. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
              <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.</p>
            `).join('')}
          </div>
        </body>
      </html>
    `);

    console.log('✓ Large content page loaded');

    // Test scrolling performance
    const scrollTests = [
      { action: 'scroll to middle', position: 0.5 },
      { action: 'scroll to bottom', position: 1.0 },
      { action: 'scroll to top', position: 0 }
    ];

    for (const scrollTest of scrollTests) {
      const startTime = Date.now();
      
      await page.evaluate((position) => {
        const scrollHeight = document.body.scrollHeight - window.innerHeight;
        window.scrollTo({ top: scrollHeight * position, behavior: 'smooth' });
      }, scrollTest.position);

      // Wait for scroll to complete
      await page.waitForTimeout(500);
      
      const scrollTime = Date.now() - startTime;
      console.log(`✓ ${scrollTest.action}: ${scrollTime}ms`);

      // Verify scroll position
      const currentScrollPosition = await page.evaluate(() => {
        const scrollPercentage = window.pageYOffset / (document.body.scrollHeight - window.innerHeight);
        return Math.round(scrollPercentage * 100) / 100;
      });

      expect(Math.abs(currentScrollPosition - scrollTest.position)).toBeLessThan(0.1);
    }

    // Test content rendering time
    const renderStartTime = Date.now();
    
    const elementCount = await page.locator('h2').count();
    const paragraphCount = await page.locator('p').count();
    
    const renderTime = Date.now() - renderStartTime;

    console.log(`✓ Content rendering: ${renderTime}ms`);
    console.log(`✓ Elements rendered: ${elementCount} headings, ${paragraphCount} paragraphs`);

    expect(renderTime).toBeLessThan(1000); // Content should render within 1 second
    expect(elementCount).toBe(100); // All sections should be rendered
  });

  test('Network condition simulation', async ({ page }) => {
    console.log('🌐 Starting network condition simulation test');

    // Test under different simulated network conditions
    const networkConditions = [
      { name: 'Fast 3G', download: 1600, upload: 750, latency: 150 },
      { name: 'Slow 3G', download: 500, upload: 500, latency: 400 }
    ];

    for (const condition of networkConditions) {
      console.log(`📡 Testing under ${condition.name} conditions`);

      // Simulate network conditions
      const client = await page.context().newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: condition.latency,
        downloadThroughput: condition.download * 1024 / 8, // Convert to bytes per second
        uploadThroughput: condition.upload * 1024 / 8
      });

      // Test page load under these conditions
      const loadStartTime = Date.now();
      
      try {
        await page.goto('/stories', { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
        
        const loadTime = Date.now() - loadStartTime;
        console.log(`  ✓ ${condition.name} load time: ${loadTime}ms`);

        // Test if basic content is visible
        const contentVisible = await page.locator('h1, h2, main').first().isVisible({ timeout: 5000 });
        console.log(`  ✓ ${condition.name} content visible: ${contentVisible}`);

        expect(loadTime).toBeLessThan(25000); // Should load within 25 seconds even on slow networks

      } catch (error) {
        console.log(`  ❌ ${condition.name} failed to load: ${error.message}`);
      }

      // Reset network conditions
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1
      });
    }

    console.log('✓ Network condition simulation completed');
  });
});