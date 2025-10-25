import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3000';
const AUTH_STATE_PATH = path.join(__dirname, '..', '.auth', 'user.json');
const LOG_DIR = path.join(__dirname, '..', 'logs');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logFile = path.join(LOG_DIR, `perf-test-${Date.now()}.json`);

async function measurePageLoad(page, url, iteration) {
  const metrics = {
    url,
    iteration,
    timestamp: new Date().toISOString(),
    timings: {},
    serverTiming: null,
    cacheStatus: null,
  };

  const startTime = Date.now();

  const response = await page.goto(url, {
    waitUntil: 'networkidle',
  });

  const loadTime = Date.now() - startTime;
  metrics.timings.totalLoad = loadTime;

  const headers = response.headers();
  metrics.serverTiming = headers['x-server-timing'] || null;
  metrics.cacheStatus = headers['x-server-cache'] || headers['x-cache-status'] || null;

  const performanceMetrics = await page.evaluate(() => {
    const perfData = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
      loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
      responseTime: perfData.responseEnd - perfData.requestStart,
      domInteractive: perfData.domInteractive - perfData.fetchStart,
    };
  });

  metrics.timings = { ...metrics.timings, ...performanceMetrics };

  return metrics;
}

async function measureApiCall(page, url, iteration) {
  const metrics = {
    url,
    iteration,
    timestamp: new Date().toISOString(),
    requestTime: 0,
    responseSize: 0,
    serverTiming: null,
    cacheStatus: null,
    status: 0,
  };

  const startTime = Date.now();

  const response = await page.request.get(url);

  metrics.requestTime = Date.now() - startTime;
  metrics.status = response.status();

  const headers = response.headers();
  metrics.serverTiming = headers['x-server-timing'] || null;
  metrics.cacheStatus = headers['x-server-cache'] || headers['x-cache-status'] || null;

  const body = await response.text();
  metrics.responseSize = body.length;

  return metrics;
}

async function clearBrowserCache(page) {
  console.log('🧹 Clearing browser cache...');

  try {
    await page.goto(`${BASE_URL}/stories`);

    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.log('Could not clear localStorage/sessionStorage');
      }
    });

    const context = page.context();
    await context.clearCookies();

    await page.evaluate(() => {
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
    });

    console.log('✅ Browser cache cleared');
  } catch (error) {
    console.log('⚠️  Partial cache clear (some operations may have failed)');
  }
}

async function runPerformanceTests() {
  console.log('🚀 Starting Server Cache Performance Tests\n');

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    storageState: AUTH_STATE_PATH,
  });

  const page = await context.newPage();

  const results = {
    testRun: new Date().toISOString(),
    baseUrl: BASE_URL,
    tests: [],
  };

  console.log('📊 Test 1: Stories List Page Performance\n');
  await clearBrowserCache(page);

  for (let i = 1; i <= 3; i++) {
    console.log(`  Iteration ${i}/3: Loading /stories...`);
    const metrics = await measurePageLoad(page, `${BASE_URL}/stories`, i);
    console.log(`    Load Time: ${metrics.timings.totalLoad}ms`);
    console.log(`    Server Timing: ${metrics.serverTiming || 'N/A'}`);
    console.log(`    Cache Status: ${metrics.cacheStatus || 'N/A'}\n`);

    results.tests.push({
      testName: 'Stories List Page',
      type: 'page-load',
      ...metrics,
    });

    if (i < 3) await page.waitForTimeout(500);
  }

  console.log('📊 Test 2: Story Structure API Performance\n');

  const storyResponse = await page.request.get(`${BASE_URL}/api/stories/published`);
  const stories = await storyResponse.json();

  if (stories.length > 0) {
    const testStoryId = stories[0].id;
    const structureUrl = `${BASE_URL}/api/stories/${testStoryId}/structure`;

    console.log(`  Testing with story ID: ${testStoryId}\n`);

    for (let i = 1; i <= 5; i++) {
      console.log(`  Iteration ${i}/5: Fetching structure...`);
      const metrics = await measureApiCall(page, structureUrl, i);
      console.log(`    Request Time: ${metrics.requestTime}ms`);
      console.log(`    Server Timing: ${metrics.serverTiming || 'N/A'}`);
      console.log(`    Cache Status: ${metrics.cacheStatus || 'N/A'}`);
      console.log(`    Response Size: ${metrics.responseSize} bytes\n`);

      results.tests.push({
        testName: 'Story Structure API',
        type: 'api-call',
        ...metrics,
      });

      if (i < 5) await page.waitForTimeout(200);
    }
  }

  console.log('📊 Test 3: Chapter API Performance\n');

  if (stories.length > 0) {
    const testStoryId = stories[0].id;
    const chaptersResponse = await page.request.get(`${BASE_URL}/api/stories/${testStoryId}/chapters`);
    const chapters = await chaptersResponse.json();

    if (chapters && chapters.length > 0) {
      const testChapterId = chapters[0].id;
      const chapterUrl = `${BASE_URL}/api/chapters/${testChapterId}`;

      console.log(`  Testing with chapter ID: ${testChapterId}\n`);

      for (let i = 1; i <= 5; i++) {
        console.log(`  Iteration ${i}/5: Fetching chapter...`);
        const metrics = await measureApiCall(page, chapterUrl, i);
        console.log(`    Request Time: ${metrics.requestTime}ms`);
        console.log(`    Server Timing: ${metrics.serverTiming || 'N/A'}`);
        console.log(`    Cache Status: ${metrics.cacheStatus || 'N/A'}\n`);

        results.tests.push({
          testName: 'Chapter API',
          type: 'api-call',
          ...metrics,
        });

        if (i < 5) await page.waitForTimeout(200);
      }
    }
  }

  console.log('📊 Test 4: Cold vs Warm Cache Comparison\n');

  await page.request.delete(`${BASE_URL}/api/cache/clear`).catch(() => {
    console.log('  ⚠️  Cache clear endpoint not available, skipping...');
  });

  await clearBrowserCache(page);
  console.log('  Testing cold cache (first load)...');

  if (stories.length > 0) {
    const testStoryId = stories[0].id;
    const structureUrl = `${BASE_URL}/api/stories/${testStoryId}/structure`;

    const coldMetrics = await measureApiCall(page, structureUrl, 1);
    console.log(`    Cold Cache: ${coldMetrics.requestTime}ms`);

    await page.waitForTimeout(500);

    const warmMetrics = await measureApiCall(page, structureUrl, 2);
    console.log(`    Warm Cache: ${warmMetrics.requestTime}ms`);

    const improvement = ((coldMetrics.requestTime - warmMetrics.requestTime) / coldMetrics.requestTime * 100).toFixed(2);
    console.log(`    Improvement: ${improvement}%\n`);

    results.coldVsWarm = {
      cold: coldMetrics,
      warm: warmMetrics,
      improvementPercentage: parseFloat(improvement),
    };
  }

  await browser.close();

  fs.writeFileSync(logFile, JSON.stringify(results, null, 2));
  console.log(`\n✅ Performance test complete!`);
  console.log(`📁 Results saved to: ${logFile}\n`);

  printSummary(results);
}

function printSummary(results) {
  console.log('\n===== PERFORMANCE SUMMARY =====\n');

  const groupedTests = results.tests.reduce((acc, test) => {
    if (!acc[test.testName]) {
      acc[test.testName] = [];
    }
    acc[test.testName].push(test);
    return acc;
  }, {});

  Object.entries(groupedTests).forEach(([testName, tests]) => {
    console.log(`${testName}:`);

    if (tests[0].type === 'page-load') {
      const avgLoad = tests.reduce((sum, t) => sum + t.timings.totalLoad, 0) / tests.length;
      const minLoad = Math.min(...tests.map(t => t.timings.totalLoad));
      const maxLoad = Math.max(...tests.map(t => t.timings.totalLoad));

      console.log(`  Avg Load Time: ${avgLoad.toFixed(2)}ms`);
      console.log(`  Min Load Time: ${minLoad}ms`);
      console.log(`  Max Load Time: ${maxLoad}ms`);
    } else {
      const avgTime = tests.reduce((sum, t) => sum + t.requestTime, 0) / tests.length;
      const minTime = Math.min(...tests.map(t => t.requestTime));
      const maxTime = Math.max(...tests.map(t => t.requestTime));

      console.log(`  Avg Request Time: ${avgTime.toFixed(2)}ms`);
      console.log(`  Min Request Time: ${minTime}ms`);
      console.log(`  Max Request Time: ${maxTime}ms`);

      const firstReq = tests[0].requestTime;
      const laterReqs = tests.slice(1);
      const avgLater = laterReqs.reduce((sum, t) => sum + t.requestTime, 0) / laterReqs.length;

      if (laterReqs.length > 0) {
        const improvement = ((firstReq - avgLater) / firstReq * 100).toFixed(2);
        console.log(`  First Request: ${firstReq}ms`);
        console.log(`  Avg Cached Requests: ${avgLater.toFixed(2)}ms`);
        console.log(`  Cache Improvement: ${improvement}%`);
      }
    }

    console.log('');
  });

  if (results.coldVsWarm) {
    console.log('Cold vs Warm Cache:');
    console.log(`  Cold: ${results.coldVsWarm.cold.requestTime}ms`);
    console.log(`  Warm: ${results.coldVsWarm.warm.requestTime}ms`);
    console.log(`  Improvement: ${results.coldVsWarm.improvementPercentage}%\n`);
  }

  console.log('================================\n');
}

runPerformanceTests().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
