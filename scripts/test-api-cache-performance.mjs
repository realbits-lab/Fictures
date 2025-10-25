import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3000';
const LOG_DIR = path.join(__dirname, '..', 'logs');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logFile = path.join(LOG_DIR, `api-perf-test-${Date.now()}.json`);

async function measureApiCall(url, iteration, description) {
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      headers: {
        'Cookie': 'test=1'
      }
    });

    const requestTime = Date.now() - startTime;

    const body = await response.text();
    const serverTiming = response.headers.get('x-server-timing');
    const cacheStatus = response.headers.get('x-server-cache') || response.headers.get('x-cache-status');

    return {
      url,
      description,
      iteration,
      success: response.ok,
      status: response.status,
      requestTime,
      responseSize: body.length,
      serverTiming,
      cacheStatus,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      url,
      description,
      iteration,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function runApiPerformanceTests() {
  console.log('🚀 Starting API Cache Performance Tests\n');

  const results = {
    testRun: new Date().toISOString(),
    baseUrl: BASE_URL,
    tests: []
  };

  console.log('📊 Test 1: Published Stories API\n');

  for (let i = 1; i <= 5; i++) {
    console.log(`  Iteration ${i}/5: Fetching published stories...`);
    const metrics = await measureApiCall(
      `${BASE_URL}/api/stories/published`,
      i,
      'Published Stories API'
    );

    if (metrics.success) {
      console.log(`    ✅ ${metrics.requestTime}ms | Server: ${metrics.serverTiming || 'N/A'} | Cache: ${metrics.cacheStatus || 'N/A'}`);
    } else {
      console.log(`    ❌ Failed: ${metrics.error || 'HTTP ' + metrics.status}`);
    }

    results.tests.push(metrics);

    if (i < 5) await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n📊 Test 2: Testing with Actual Story (if available)\n');

  const storiesResponse = await fetch(`${BASE_URL}/api/stories/published`);
  if (storiesResponse.ok) {
    const stories = await storiesResponse.json();

    if (stories.length > 0) {
      const testStoryId = stories[0].id;
      console.log(`  Using story ID: ${testStoryId}\n`);

      console.log('  2a. Story Details API:\n');
      for (let i = 1; i <= 5; i++) {
        console.log(`    Iteration ${i}/5: Fetching story...`);
        const metrics = await measureApiCall(
          `${BASE_URL}/api/stories/${testStoryId}`,
          i,
          'Story Details API'
        );

        if (metrics.success) {
          console.log(`      ✅ ${metrics.requestTime}ms | Server: ${metrics.serverTiming || 'N/A'} | Cache: ${metrics.cacheStatus || 'N/A'}`);
        } else {
          console.log(`      ❌ Failed: ${metrics.error || 'HTTP ' + metrics.status}`);
        }

        results.tests.push(metrics);

        if (i < 5) await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log('\n  2b. Story Structure API:\n');
      for (let i = 1; i <= 5; i++) {
        console.log(`    Iteration ${i}/5: Fetching structure...`);
        const metrics = await measureApiCall(
          `${BASE_URL}/api/stories/${testStoryId}/structure`,
          i,
          'Story Structure API'
        );

        if (metrics.success) {
          console.log(`      ✅ ${metrics.requestTime}ms | Server: ${metrics.serverTiming || 'N/A'} | Cache: ${metrics.cacheStatus || 'N/A'}`);
        } else {
          console.log(`      ❌ Failed: ${metrics.error || 'HTTP ' + metrics.status}`);
        }

        results.tests.push(metrics);

        if (i < 5) await new Promise(resolve => setTimeout(resolve, 200));
      }
    } else {
      console.log('  ⚠️  No published stories found - skipping story-specific tests\n');
    }
  }

  fs.writeFileSync(logFile, JSON.stringify(results, null, 2));
  console.log(`\n✅ API performance test complete!`);
  console.log(`📁 Results saved to: ${logFile}\n`);

  printSummary(results);
}

function printSummary(results) {
  console.log('\n===== API PERFORMANCE SUMMARY =====\n');

  const groupedTests = results.tests.reduce((acc, test) => {
    if (!acc[test.description]) {
      acc[test.description] = [];
    }
    if (test.success) {
      acc[test.description].push(test);
    }
    return acc;
  }, {});

  Object.entries(groupedTests).forEach(([description, tests]) => {
    if (tests.length === 0) return;

    console.log(`${description}:`);

    const times = tests.map(t => t.requestTime);
    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    console.log(`  Iterations: ${tests.length}`);
    console.log(`  Avg Request Time: ${avgTime.toFixed(2)}ms`);
    console.log(`  Min Request Time: ${minTime}ms`);
    console.log(`  Max Request Time: ${maxTime}ms`);

    if (tests.length >= 2) {
      const firstReq = tests[0].requestTime;
      const laterReqs = tests.slice(1);
      const avgLater = laterReqs.reduce((sum, t) => sum + t.requestTime, 0) / laterReqs.length;
      const improvement = ((firstReq - avgLater) / firstReq * 100);

      console.log(`  First Request: ${firstReq}ms`);
      console.log(`  Avg Cached Requests: ${avgLater.toFixed(2)}ms`);
      console.log(`  Cache Performance: ${improvement > 0 ? '+' : ''}${improvement.toFixed(2)}% ${improvement > 0 ? 'faster' : 'slower'}`);
    }

    const hasCacheStatus = tests.some(t => t.cacheStatus);
    if (hasCacheStatus) {
      console.log(`  Cache Status: ${tests[0].cacheStatus || 'N/A'}`);
    }

    console.log('');
  });

  console.log('===================================\n');
}

runApiPerformanceTests().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
