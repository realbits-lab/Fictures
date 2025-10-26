import { chromium } from '@playwright/test';

async function testCommunityStoryPerformance() {
  const storyId = '3JpLdcXb5hQK7zy5g3QIj';
  const url = `http://localhost:3000/community/story/${storyId}`;

  console.log(`🧪 Testing performance for ${url}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console logs from the page
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[useCommunityStory]') ||
        text.includes('[useCommunityPosts]') ||
        text.includes('[StoryCommunityPage]')) {
      console.log(`  📄 ${text}`);
    }
  });

  // Monitor network requests
  const apiRequests = [];
  page.on('request', request => {
    if (request.url().includes('/api/community')) {
      const startTime = Date.now();
      apiRequests.push({
        url: request.url(),
        startTime,
        method: request.method()
      });
      console.log(`  🌐 REQUEST: ${request.method()} ${request.url().replace('http://localhost:3000', '')}`);
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/community')) {
      const request = apiRequests.find(r => r.url === response.url());
      if (request) {
        const duration = Date.now() - request.startTime;
        const status = response.status();
        const cacheHeader = response.headers()['x-server-cache'];
        const timing = response.headers()['x-server-timing'];

        console.log(`  ✅ RESPONSE: ${response.url().replace('http://localhost:3000', '')}`);
        console.log(`     Status: ${status}, Duration: ${duration}ms`);
        if (cacheHeader) console.log(`     Cache: ${cacheHeader}`);
        if (timing) console.log(`     Server Timing: ${timing}`);

        // Try to get response body size
        try {
          const body = await response.text();
          console.log(`     Body size: ${(body.length / 1024).toFixed(2)} KB`);
        } catch (e) {
          // Ignore if body already consumed
        }
      }
    }
  });

  try {
    console.log('⏱️  Starting navigation...\n');
    const navigationStart = Date.now();

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    const domContentLoaded = Date.now() - navigationStart;
    console.log(`\n📊 DOM Content Loaded: ${domContentLoaded}ms`);

    // Wait for page to fully load
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    const networkIdle = Date.now() - navigationStart;
    console.log(`📊 Network Idle: ${networkIdle}ms`);

    // Take screenshot
    await page.screenshot({ path: 'logs/community-story-loaded.png', fullPage: false });
    console.log(`\n📸 Screenshot saved: logs/community-story-loaded.png`);

    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
        domComplete: navigation.domComplete - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      };
    });

    console.log('\n📈 Performance Metrics:');
    console.log(`   DOM Interactive: ${performanceMetrics.domInteractive.toFixed(2)}ms`);
    console.log(`   DOM Complete: ${performanceMetrics.domComplete.toFixed(2)}ms`);
    console.log(`   Load Complete: ${performanceMetrics.loadComplete.toFixed(2)}ms`);

    // Summary
    console.log('\n📋 Summary:');
    console.log(`   Total API Requests: ${apiRequests.length}`);
    if (networkIdle > 5000) {
      console.log(`   ⚠️  SLOW LOAD: ${networkIdle}ms (threshold: 5000ms)`);
    } else {
      console.log(`   ✅ FAST LOAD: ${networkIdle}ms`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'logs/community-story-error.png' });
  } finally {
    await browser.close();
    console.log('\n👋 Test complete');
  }
}

testCommunityStoryPerformance();
