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

const logFile = path.join(LOG_DIR, `redis-cache-test-${Date.now()}.json`);

async function measureApiCall(url, description, iteration = 1) {
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

    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (e) {
      parsedBody = null;
    }

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
      itemsCount: parsedBody?.stories?.length || parsedBody?.chapters?.length || parsedBody?.scenes?.length || 0,
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

async function clearServerCache() {
  console.log('🧹 Clearing server-side Redis cache...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/cache/clear`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('✅ Server cache cleared successfully\n');
      return true;
    } else {
      console.log(`⚠️  Cache clear returned status ${response.status} (may require authentication)\n`);
      return false;
    }
  } catch (error) {
    console.log(`⚠️  Could not clear cache: ${error.message}\n`);
    return false;
  }
}

async function runRedisComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Redis Cache Test\n');
  console.log('Testing with REDIS_URL configured\n');
  console.log('='.repeat(60) + '\n');

  const results = {
    testRun: new Date().toISOString(),
    baseUrl: BASE_URL,
    redisEnabled: true,
    tests: []
  };

  // Test 1: Published Stories API with Cache Clear
  console.log('📊 Test 1: Published Stories API (Cache Clear + Multiple Requests)\n');

  await clearServerCache();
  await new Promise(resolve => setTimeout(resolve, 500));

  for (let i = 1; i <= 5; i++) {
    const label = i === 1 ? 'COLD (First Request)' : `WARM (Request ${i})`;
    console.log(`  ${label}...`);

    const metrics = await measureApiCall(
      `${BASE_URL}/api/stories/published`,
      'Published Stories API',
      i
    );

    if (metrics.success) {
      console.log(`    ✅ Time: ${metrics.requestTime}ms`);
      console.log(`    📊 Server Timing: ${metrics.serverTiming || 'N/A'}`);
      console.log(`    💾 Cache: ${metrics.cacheStatus || 'N/A'}`);
      console.log(`    📚 Stories: ${metrics.itemsCount}\n`);
    } else {
      console.log(`    ❌ Failed: ${metrics.error || 'HTTP ' + metrics.status}\n`);
    }

    results.tests.push(metrics);

    if (i < 5) await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Test 2: Story Structure API
  console.log('\n📊 Test 2: Story Structure API (Cold vs Warm)\n');

  const storiesResponse = await fetch(`${BASE_URL}/api/stories/published`);
  if (storiesResponse.ok) {
    const storiesData = await storiesResponse.json();
    const stories = storiesData.stories || [];

    if (stories.length > 0) {
      const testStoryId = stories[0].id;
      console.log(`  Using story: "${stories[0].title}" (ID: ${testStoryId})\n`);

      // Clear cache before testing
      await clearServerCache();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Cold request
      console.log('  🥶 COLD REQUEST (Cache cleared)...');
      const coldMetrics = await measureApiCall(
        `${BASE_URL}/api/stories/${testStoryId}/structure`,
        'Story Structure API - Cold',
        1
      );

      if (coldMetrics.success) {
        console.log(`    ✅ Time: ${coldMetrics.requestTime}ms`);
        console.log(`    📊 Server Timing: ${coldMetrics.serverTiming || 'N/A'}`);
        console.log(`    💾 Cache: ${coldMetrics.cacheStatus || 'N/A'}`);
        console.log(`    📦 Response Size: ${coldMetrics.responseSize} bytes\n`);
      }

      results.tests.push(coldMetrics);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 500));

      // Warm requests
      for (let i = 1; i <= 3; i++) {
        console.log(`  🔥 WARM REQUEST ${i}...`);
        const warmMetrics = await measureApiCall(
          `${BASE_URL}/api/stories/${testStoryId}/structure`,
          'Story Structure API - Warm',
          i + 1
        );

        if (warmMetrics.success) {
          console.log(`    ✅ Time: ${warmMetrics.requestTime}ms`);
          console.log(`    📊 Server Timing: ${warmMetrics.serverTiming || 'N/A'}`);
          console.log(`    💾 Cache: ${warmMetrics.cacheStatus || 'N/A'}\n`);
        }

        results.tests.push(warmMetrics);

        if (i < 3) await new Promise(resolve => setTimeout(resolve, 200));
      }
    } else {
      console.log('  ⚠️  No published stories found - skipping structure test\n');
    }
  }

  // Test 3: Chapter and Scene Content
  console.log('\n📊 Test 3: Chapter & Scene Content (Cold vs Warm)\n');

  const storiesResponse2 = await fetch(`${BASE_URL}/api/stories/published`);
  if (storiesResponse2.ok) {
    const storiesData = await storiesResponse2.json();
    const stories = storiesData.stories || [];

    if (stories.length > 0) {
      const testStoryId = stories[0].id;

      // Get story structure to find chapters
      const structureResponse = await fetch(`${BASE_URL}/api/stories/${testStoryId}/structure`);
      if (structureResponse.ok) {
        const structureData = await structureResponse.json();
        const allChapters = [
          ...(structureData.parts || []).flatMap(p => p.chapters || []),
          ...(structureData.chapters || [])
        ];

        if (allChapters.length > 0) {
          const testChapter = allChapters[0];
          console.log(`  Using chapter: "${testChapter.title}" (ID: ${testChapter.id})\n`);

          // Clear cache
          await clearServerCache();
          await new Promise(resolve => setTimeout(resolve, 500));

          // Test chapter endpoint
          console.log('  📖 Chapter Endpoint:');

          console.log('    🥶 COLD REQUEST...');
          const coldChapterMetrics = await measureApiCall(
            `${BASE_URL}/api/chapters/${testChapter.id}`,
            'Chapter API - Cold',
            1
          );

          if (coldChapterMetrics.success) {
            console.log(`      ✅ Time: ${coldChapterMetrics.requestTime}ms`);
            console.log(`      📊 Server: ${coldChapterMetrics.serverTiming || 'N/A'}`);
            console.log(`      💾 Cache: ${coldChapterMetrics.cacheStatus || 'N/A'}\n`);
          }

          results.tests.push(coldChapterMetrics);

          await new Promise(resolve => setTimeout(resolve, 300));

          console.log('    🔥 WARM REQUEST...');
          const warmChapterMetrics = await measureApiCall(
            `${BASE_URL}/api/chapters/${testChapter.id}`,
            'Chapter API - Warm',
            2
          );

          if (warmChapterMetrics.success) {
            console.log(`      ✅ Time: ${warmChapterMetrics.requestTime}ms`);
            console.log(`      📊 Server: ${warmChapterMetrics.serverTiming || 'N/A'}`);
            console.log(`      💾 Cache: ${warmChapterMetrics.cacheStatus || 'N/A'}\n`);
          }

          results.tests.push(warmChapterMetrics);

          // Test scenes if available
          if (testChapter.scenes && testChapter.scenes.length > 0) {
            const testScene = testChapter.scenes[0];
            console.log(`  🎬 Scene Endpoint (Scene: "${testScene.title}"):\n`);

            // Clear cache
            await clearServerCache();
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log('    🥶 COLD REQUEST...');
            const coldSceneMetrics = await measureApiCall(
              `${BASE_URL}/api/scenes/${testScene.id}`,
              'Scene API - Cold',
              1
            );

            if (coldSceneMetrics.success) {
              console.log(`      ✅ Time: ${coldSceneMetrics.requestTime}ms`);
              console.log(`      📊 Server: ${coldSceneMetrics.serverTiming || 'N/A'}`);
              console.log(`      💾 Cache: ${coldSceneMetrics.cacheStatus || 'N/A'}\n`);
            }

            results.tests.push(coldSceneMetrics);

            await new Promise(resolve => setTimeout(resolve, 300));

            console.log('    🔥 WARM REQUEST...');
            const warmSceneMetrics = await measureApiCall(
              `${BASE_URL}/api/scenes/${testScene.id}`,
              'Scene API - Warm',
              2
            );

            if (warmSceneMetrics.success) {
              console.log(`      ✅ Time: ${warmSceneMetrics.requestTime}ms`);
              console.log(`      📊 Server: ${warmSceneMetrics.serverTiming || 'N/A'}`);
              console.log(`      💾 Cache: ${warmSceneMetrics.cacheStatus || 'N/A'}\n`);
            }

            results.tests.push(warmSceneMetrics);
          }
        } else {
          console.log('  ⚠️  No chapters found in story\n');
        }
      }
    }
  }

  // Save results
  fs.writeFileSync(logFile, JSON.stringify(results, null, 2));
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Comprehensive test complete!`);
  console.log(`📁 Results saved to: ${logFile}\n`);

  printSummary(results);
}

function printSummary(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 PERFORMANCE SUMMARY');
  console.log('='.repeat(60) + '\n');

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
    console.log(`  ${'─'.repeat(50)}`);

    const times = tests.map(t => t.requestTime);
    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    console.log(`  📈 Requests: ${tests.length}`);
    console.log(`  ⏱️  Avg Time: ${avgTime.toFixed(2)}ms`);
    console.log(`  ⚡ Min Time: ${minTime}ms`);
    console.log(`  🐌 Max Time: ${maxTime}ms`);

    if (tests.length >= 2) {
      const firstReq = tests[0];
      const laterReqs = tests.slice(1);
      const avgLater = laterReqs.reduce((sum, t) => sum + t.requestTime, 0) / laterReqs.length;
      const improvement = ((firstReq.requestTime - avgLater) / firstReq.requestTime * 100);

      console.log(`\n  📊 First Request: ${firstReq.requestTime}ms (${firstReq.iteration === 1 ? 'COLD' : 'WARM'})`);
      console.log(`  📊 Avg Cached: ${avgLater.toFixed(2)}ms`);
      console.log(`  🚀 Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(2)}%`);
    }

    const hasCacheStatus = tests.some(t => t.cacheStatus);
    if (hasCacheStatus) {
      console.log(`  💾 Cache: ${tests[0].cacheStatus || 'N/A'}`);
    }

    if (tests[0].itemsCount > 0) {
      console.log(`  📚 Items: ${tests[0].itemsCount}`);
    }

    console.log('');
  });

  console.log('='.repeat(60) + '\n');
}

runRedisComprehensiveTest().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
