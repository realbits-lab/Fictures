/**
 * Test Cache Efficiency: Verify ONE cache per content (not per user)
 *
 * This test simulates multiple users accessing the same content
 * to verify that we're using a shared cache instead of per-user caches.
 */

const BASE_URL = 'http://localhost:3000';

// Simulate different users (including non-authenticated)
const SIMULATED_USERS = [
  { name: 'User 1 (authenticated)', sessionCookie: 'session1' },
  { name: 'User 2 (authenticated)', sessionCookie: 'session2' },
  { name: 'User 3 (authenticated)', sessionCookie: 'session3' },
  { name: 'Guest (non-authenticated)', sessionCookie: null },
];

const TEST_STORY_ID = 'PoAQD-N76wSTiCxwQQCuQ';

async function measureApiCall(url, headers = {}) {
  const start = Date.now();
  const response = await fetch(url, { headers });
  const duration = Date.now() - start;

  const serverTiming = response.headers.get('X-Server-Timing');
  const [totalMatch, dbMatch] = serverTiming?.match(/total;dur=(\d+),db;dur=(\d+)/) || [];

  return {
    duration,
    serverTotal: totalMatch ? parseInt(totalMatch.split('=')[1]) : null,
    serverDb: dbMatch ? parseInt(dbMatch.split('=')[1]) : null,
    status: response.status,
  };
}

async function testCacheEfficiency() {
  console.log('🔍 Testing Cache Efficiency: ONE Cache Per Content\n');
  console.log('=' .repeat(60));

  // Test 1: Multiple users accessing same story
  console.log('\n📊 Test 1: Multiple Users Accessing Same Story');
  console.log('-'.repeat(60));

  for (const user of SIMULATED_USERS) {
    const headers = user.sessionCookie
      ? { 'Cookie': `next-auth.session-token=${user.sessionCookie}` }
      : {};

    const result = await measureApiCall(
      `${BASE_URL}/api/stories/${TEST_STORY_ID}`,
      headers
    );

    console.log(`${user.name}:`);
    console.log(`  ⏱️  Response Time: ${result.duration}ms`);
    console.log(`  📊 Server Time: ${result.serverDb}ms`);
    console.log(`  ${result.serverDb < 100 ? '✅ CACHE HIT' : '❌ CACHE MISS'}`);
  }

  // Test 2: Multiple users accessing same story structure
  console.log('\n📊 Test 2: Multiple Users Accessing Same Story Structure');
  console.log('-'.repeat(60));

  for (const user of SIMULATED_USERS) {
    const headers = user.sessionCookie
      ? { 'Cookie': `next-auth.session-token=${user.sessionCookie}` }
      : {};

    const result = await measureApiCall(
      `${BASE_URL}/api/stories/${TEST_STORY_ID}/structure`,
      headers
    );

    console.log(`${user.name}:`);
    console.log(`  ⏱️  Response Time: ${result.duration}ms`);
    console.log(`  📊 Server Time: ${result.serverDb}ms`);
    console.log(`  ${result.serverDb < 100 ? '✅ CACHE HIT' : '❌ CACHE MISS'}`);
  }

  // Test 3: Published stories list
  console.log('\n📊 Test 3: Multiple Users Accessing Published Stories List');
  console.log('-'.repeat(60));

  for (const user of SIMULATED_USERS) {
    const headers = user.sessionCookie
      ? { 'Cookie': `next-auth.session-token=${user.sessionCookie}` }
      : {};

    const result = await measureApiCall(
      `${BASE_URL}/api/stories/published`,
      headers
    );

    console.log(`${user.name}:`);
    console.log(`  ⏱️  Response Time: ${result.duration}ms`);
    console.log(`  📊 Server Time: ${result.serverDb}ms`);
    console.log(`  ${result.serverDb < 100 ? '✅ CACHE HIT' : '❌ CACHE MISS'}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Cache Efficiency Test Complete!\n');
  console.log('Expected Results:');
  console.log('  • First user may see CACHE MISS (cold cache)');
  console.log('  • All subsequent users should see CACHE HIT');
  console.log('  • Guest users should also get CACHE HIT from shared cache');
  console.log('  • Server should log: "[Cache] HIT public story" for all hits');
  console.log('\n💡 Check server logs to verify ONE cache entry per content');
}

// Run the test
testCacheEfficiency().catch(console.error);
