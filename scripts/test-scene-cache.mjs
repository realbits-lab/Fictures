/**
 * Test Scene Caching: Verify Redis caching for scene content
 */

const BASE_URL = 'http://localhost:3000';
const TEST_SCENE_ID = 'FaaJzaFPyx5bUSh7Fqjb4'; // First scene from Jupiter's Maw

async function measureApiCall(url, requestNum) {
  const start = Date.now();
  const response = await fetch(url);
  const duration = Date.now() - start;

  const serverTiming = response.headers.get('X-Server-Timing');
  const cacheEnabled = response.headers.get('X-Server-Cache');

  const totalMatch = serverTiming?.match(/total;dur=(\d+)/);
  const dbMatch = serverTiming?.match(/db;dur=(\d+)/);

  const serverTotal = totalMatch ? parseInt(totalMatch[1]) : null;
  const serverDb = dbMatch ? parseInt(dbMatch[1]) : null;

  const data = await response.json();
  const sceneTitle = data.scene?.title || 'Unknown';

  return {
    requestNum,
    duration,
    serverTotal,
    serverDb,
    cacheEnabled: cacheEnabled === 'ENABLED',
    sceneTitle,
    status: response.status,
  };
}

async function testSceneCaching() {
  console.log('🎬 Testing Scene Content Caching\n');
  console.log('='.repeat(60));

  const results = [];

  // Test 1: Cold request (first access)
  console.log('\n📊 Test: Scene Content Caching (Cold → Warm)\n');
  console.log(`Testing scene: ${TEST_SCENE_ID}`);
  console.log('-'.repeat(60));

  console.log('\n🥶 COLD REQUEST (First Access)...');
  const coldResult = await measureApiCall(`${BASE_URL}/api/scenes/${TEST_SCENE_ID}`, 1);
  results.push(coldResult);

  console.log(`  Scene: "${coldResult.sceneTitle}"`);
  console.log(`  ⏱️  Total Time: ${coldResult.duration}ms`);
  console.log(`  📊 Server Time: ${coldResult.serverDb}ms`);
  console.log(`  💾 Cache: ${coldResult.cacheEnabled ? 'ENABLED' : 'DISABLED'}`);
  console.log(`  ${coldResult.serverDb > 100 ? '❄️  CACHE MISS' : '✅ CACHE HIT'}`);

  // Test 2-5: Warm requests (cached)
  console.log('\n🔥 WARM REQUESTS (Should hit cache)...\n');

  for (let i = 2; i <= 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests

    const warmResult = await measureApiCall(`${BASE_URL}/api/scenes/${TEST_SCENE_ID}`, i);
    results.push(warmResult);

    console.log(`  Request ${i}:`);
    console.log(`    ⏱️  Total Time: ${warmResult.duration}ms`);
    console.log(`    📊 Server Time: ${warmResult.serverDb}ms`);
    console.log(`    ${warmResult.serverDb < 100 ? '✅ CACHE HIT' : '❄️  CACHE MISS'}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SCENE CACHING PERFORMANCE SUMMARY');
  console.log('='.repeat(60));

  const coldRequest = results[0];
  const warmRequests = results.slice(1);
  const avgWarmTime = warmRequests.reduce((sum, r) => sum + r.duration, 0) / warmRequests.length;
  const avgWarmDbTime = warmRequests.reduce((sum, r) => sum + r.serverDb, 0) / warmRequests.length;

  const improvement = ((coldRequest.duration - avgWarmTime) / coldRequest.duration * 100).toFixed(2);

  console.log(`\nScene: "${coldRequest.sceneTitle}"`);
  console.log(`Scene ID: ${TEST_SCENE_ID}`);
  console.log('\nPerformance:');
  console.log(`  🥶 Cold Request: ${coldRequest.duration}ms`);
  console.log(`  🔥 Avg Warm Requests: ${avgWarmTime.toFixed(0)}ms`);
  console.log(`  📊 Avg Server Time (Warm): ${avgWarmDbTime.toFixed(0)}ms`);
  console.log(`  🚀 Improvement: ${improvement}%`);
  console.log(`  💾 Cache Status: ${coldRequest.cacheEnabled ? 'ENABLED' : 'DISABLED'}`);

  console.log('\nCache Efficiency:');
  const cacheHits = warmRequests.filter(r => r.serverDb < 100).length;
  const hitRate = (cacheHits / warmRequests.length * 100).toFixed(0);
  console.log(`  ✅ Cache Hit Rate: ${hitRate}% (${cacheHits}/${warmRequests.length})`);

  if (improvement > 90) {
    console.log('\n✅ EXCELLENT: Scene caching is working optimally!');
  } else if (improvement > 70) {
    console.log('\n⚠️  GOOD: Scene caching is working but could be improved');
  } else {
    console.log('\n❌ POOR: Scene caching may not be working correctly');
  }

  console.log('\n💡 Check server logs for detailed cache behavior:');
  console.log('   grep -E "\\[Cache\\]|\\[RedisCache\\].*scene" logs/dev-server-scene-cache.log');

  console.log('\n' + '='.repeat(60));
  console.log('✅ Scene cache test complete!');
}

// Run the test
testSceneCaching().catch(console.error);
