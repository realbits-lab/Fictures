/**
 * Test Story Card Click Loading Flow
 *
 * This script tests the complete loading flow when clicking a story card:
 * 1. Navigate to /writing page
 * 2. Click on a story card (Jupiter's Maw)
 * 3. Measure time to load scene content
 * 4. Analyze console logs and network requests
 */

const BASE_URL = 'http://localhost:3000';
const TEST_STORY_ID = 'PoAQD-N76wSTiCxwQQCuQ'; // Jupiter's Maw

async function testStoryCardLoading() {
  console.log('\n📊 Testing Story Card Click Loading Flow\n');
  console.log('='.repeat(80));

  // Test 1: Direct navigation to story editor (simulating card click)
  console.log('\n🎯 TEST 1: Direct Navigation to Story Editor\n');
  console.log(`Navigating to: ${BASE_URL}/writing/edit/story/${TEST_STORY_ID}`);
  console.log('-'.repeat(80));

  const navigationStart = Date.now();

  try {
    const response = await fetch(`${BASE_URL}/writing/edit/story/${TEST_STORY_ID}`, {
      headers: {
        'Cookie': 'authjs.session-token=test', // This won't work but we can test the API
      }
    });

    const navigationDuration = Date.now() - navigationStart;
    console.log(`\n✅ Navigation Response: ${response.status} ${response.statusText}`);
    console.log(`⏱️  Total Navigation Time: ${navigationDuration}ms`);

    // Check server timing headers
    const serverTiming = response.headers.get('X-Server-Timing');
    if (serverTiming) {
      console.log(`\n📊 Server Timing: ${serverTiming}`);
    }

  } catch (error) {
    console.log(`❌ Navigation failed: ${error.message}`);
  }

  // Test 2: API endpoint performance for scene data
  console.log('\n\n🎯 TEST 2: Scene API Endpoint Performance\n');
  console.log('-'.repeat(80));

  const TEST_SCENE_ID = 'FaaJzaFPyx5bUSh7Fqjb4'; // First scene from Jupiter's Maw

  console.log(`Testing scene endpoint: /api/scenes/${TEST_SCENE_ID}`);

  // Cold request
  console.log('\n🥶 COLD REQUEST (Cache Miss):');
  const coldStart = Date.now();
  const coldResponse = await fetch(`${BASE_URL}/api/scenes/${TEST_SCENE_ID}`);
  const coldDuration = Date.now() - coldStart;
  const coldData = await coldResponse.json();

  console.log(`  Status: ${coldResponse.status}`);
  console.log(`  ⏱️  Response Time: ${coldDuration}ms`);

  const coldServerTiming = coldResponse.headers.get('X-Server-Timing');
  if (coldServerTiming) {
    console.log(`  📊 Server Timing: ${coldServerTiming}`);
  }

  // Warm request
  console.log('\n🔥 WARM REQUEST (Cache Hit):');
  await new Promise(resolve => setTimeout(resolve, 100));

  const warmStart = Date.now();
  const warmResponse = await fetch(`${BASE_URL}/api/scenes/${TEST_SCENE_ID}`);
  const warmDuration = Date.now() - warmStart;

  console.log(`  Status: ${warmResponse.status}`);
  console.log(`  ⏱️  Response Time: ${warmDuration}ms`);

  const warmServerTiming = warmResponse.headers.get('X-Server-Timing');
  if (warmServerTiming) {
    console.log(`  📊 Server Timing: ${warmServerTiming}`);
  }

  const improvement = ((coldDuration - warmDuration) / coldDuration * 100).toFixed(2);
  console.log(`\n  🚀 Cache Improvement: ${improvement}%`);

  // Test 3: Multiple scene requests (simulating scene navigation)
  console.log('\n\n🎯 TEST 3: Multiple Scene Requests (Simulating Navigation)\n');
  console.log('-'.repeat(80));

  // Get all scenes from the story structure
  console.log('Fetching story structure...');
  const storyResponse = await fetch(`${BASE_URL}/api/stories/${TEST_STORY_ID}/structure`);
  const storyData = await storyResponse.json();

  if (storyData.story && storyData.story.parts) {
    const allScenes = [];
    storyData.story.parts.forEach(part => {
      part.chapters?.forEach(chapter => {
        chapter.scenes?.forEach(scene => {
          allScenes.push({
            id: scene.id,
            title: scene.title,
            chapterId: chapter.id,
            chapterTitle: chapter.title
          });
        });
      });
    });

    console.log(`\nFound ${allScenes.length} scenes in the story`);
    console.log('\nTesting first 3 scenes:');

    for (let i = 0; i < Math.min(3, allScenes.length); i++) {
      const scene = allScenes[i];
      console.log(`\n  Scene ${i + 1}: "${scene.title}" (${scene.chapterTitle})`);

      const sceneStart = Date.now();
      const sceneResponse = await fetch(`${BASE_URL}/api/scenes/${scene.id}`);
      const sceneDuration = Date.now() - sceneStart;

      const sceneTiming = sceneResponse.headers.get('X-Server-Timing');
      const dbTime = sceneTiming?.match(/db;dur=(\d+)/)?.[1] || 'N/A';

      console.log(`    ⏱️  Response Time: ${sceneDuration}ms (DB: ${dbTime}ms)`);
      console.log(`    ${dbTime === 'N/A' || parseInt(dbTime) > 100 ? '❄️  CACHE MISS' : '✅ CACHE HIT'}`);

      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 LOADING FLOW SUMMARY');
  console.log('='.repeat(80));

  console.log('\n🔍 Key Findings:');
  console.log(`  1. Scene API Cold Request: ${coldDuration}ms`);
  console.log(`  2. Scene API Warm Request: ${warmDuration}ms`);
  console.log(`  3. Cache Improvement: ${improvement}%`);

  console.log('\n💡 Expected User Experience:');
  console.log('  - Story Card Click → SSR Page Load → Scene Data Fetch');
  console.log('  - SSR loads story structure with all scenes (server-side)');
  console.log('  - Client components (SceneDisplay) make additional API calls');
  console.log('  - These additional API calls should hit Redis cache (~30-70ms)');

  console.log('\n⚠️  Potential Bottlenecks:');
  console.log('  1. SSR page load (getStoryWithStructure) - may be slow on first load');
  console.log('  2. SceneDisplay makes 3 separate SWR API calls:');
  console.log('     - /writing/api/stories/{id}/scenes/{sceneId}');
  console.log('     - /writing/api/stories/{id}/characters');
  console.log('     - /writing/api/stories/{id}/settings');
  console.log('  3. Scene content may not be prefetched/cached');

  console.log('\n💡 Optimization Opportunities:');
  console.log('  1. Pass scene data as props from SSR (avoid client-side API calls)');
  console.log('  2. Implement hover prefetching on story cards');
  console.log('  3. Prefetch first scene on story page load');
  console.log('  4. Combine API calls (scene + characters + settings in one request)');

  console.log('\n📝 Next Steps:');
  console.log('  - Check server logs: logs/dev-server-loading-test.log');
  console.log('  - Look for console logs with [SSR], [CLIENT], [Cache] prefixes');
  console.log('  - Identify slowest operation in the loading chain');

  console.log('\n' + '='.repeat(80));
  console.log('✅ Test complete!\n');
}

// Run the test
testStoryCardLoading().catch(console.error);
