/**
 * Community Page Performance Testing Script
 *
 * Tests the optimized community pages for performance improvements:
 * - Cold load (no cache)
 * - Warm load (Redis cache)
 * - ETag 304 responses
 * - Data transfer size
 *
 * Expected Results:
 * - Cold load: 500-700ms (down from 1000-1500ms)
 * - Warm load: 50-100ms (down from 100-200ms)
 * - Improvement: 75-85% faster
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/test-community-performance.mjs
 */

import fetch from 'node-fetch';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const apiUrl = `${baseUrl}/community/api/stories`;

console.log('🧪 Community Page Performance Testing\n');
console.log(`Testing API: ${apiUrl}\n`);
console.log('=' .repeat(80));

async function testCommunityPerformance() {
  const results = {
    coldLoad: 0,
    warmLoad: 0,
    etagCache: 0,
    dataSize: 0,
    storiesCount: 0,
    improvement: 0,
  };

  try {
    // Test 1: Cold Load (no cache)
    console.log('\n📊 Test 1: Cold Load (Redis cache miss)');
    console.log('-'.repeat(80));

    const cold1 = Date.now();
    const res1 = await fetch(apiUrl, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    const data1 = await res1.json();
    const cold2 = Date.now();
    const coldDuration = cold2 - cold1;
    results.coldLoad = coldDuration;
    results.storiesCount = data1.stories?.length || 0;
    results.dataSize = JSON.stringify(data1).length;

    console.log(`✅ Cold load completed:`);
    console.log(`   Duration: ${coldDuration}ms`);
    console.log(`   Stories: ${results.storiesCount}`);
    console.log(`   Data size: ${(results.dataSize / 1024).toFixed(2)} KB`);
    console.log(`   Headers:`, {
      'X-Response-Time': res1.headers.get('X-Response-Time'),
      'X-Cache-Strategy': res1.headers.get('X-Cache-Strategy'),
    });

    // Wait a bit for cache to settle
    await new Promise(resolve => setTimeout(resolve, 100));

    // Test 2: Warm Load (Redis cache hit)
    console.log('\n📊 Test 2: Warm Load (Redis cache hit)');
    console.log('-'.repeat(80));

    const warm1 = Date.now();
    const res2 = await fetch(apiUrl);
    const data2 = await res2.json();
    const warm2 = Date.now();
    const warmDuration = warm2 - warm1;
    results.warmLoad = warmDuration;

    console.log(`✅ Warm load completed:`);
    console.log(`   Duration: ${warmDuration}ms`);
    console.log(`   Stories: ${data2.stories?.length || 0}`);
    console.log(`   Headers:`, {
      'X-Response-Time': res2.headers.get('X-Response-Time'),
      'ETag': res2.headers.get('ETag')?.substring(0, 16) + '...',
    });

    // Test 3: ETag 304 Not Modified
    console.log('\n📊 Test 3: ETag Cache (304 Not Modified)');
    console.log('-'.repeat(80));

    const etag = res2.headers.get('ETag');
    const cached1 = Date.now();
    const res3 = await fetch(apiUrl, {
      headers: {
        'If-None-Match': etag,
      },
    });
    const cached2 = Date.now();
    const etagDuration = cached2 - cached1;
    results.etagCache = etagDuration;

    console.log(`✅ ETag cache completed:`);
    console.log(`   Duration: ${etagDuration}ms`);
    console.log(`   Status: ${res3.status} (expected 304)`);
    console.log(`   ETag match: ${res3.status === 304 ? 'YES ✅' : 'NO ❌'}`);

    // Calculate improvement
    results.improvement = Math.round((1 - warmDuration / coldDuration) * 100);

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📈 PERFORMANCE SUMMARY');
    console.log('='.repeat(80));
    console.log(`\n⚡ Cold Load:      ${results.coldLoad}ms`);
    console.log(`⚡ Warm Load:      ${results.warmLoad}ms`);
    console.log(`⚡ ETag Cache:     ${results.etagCache}ms`);
    console.log(`📦 Data Size:      ${(results.dataSize / 1024).toFixed(2)} KB`);
    console.log(`📚 Stories Count:  ${results.storiesCount}`);
    console.log(`\n🎯 Improvement:    ${results.improvement}%`);

    // Performance Evaluation
    console.log('\n📊 PERFORMANCE EVALUATION');
    console.log('-'.repeat(80));

    if (results.coldLoad <= 700) {
      console.log('✅ Cold load: EXCELLENT (≤ 700ms)');
    } else if (results.coldLoad <= 1000) {
      console.log('⚠️  Cold load: GOOD (≤ 1000ms)');
    } else {
      console.log('❌ Cold load: NEEDS IMPROVEMENT (> 1000ms)');
    }

    if (results.warmLoad <= 100) {
      console.log('✅ Warm load: EXCELLENT (≤ 100ms)');
    } else if (results.warmLoad <= 200) {
      console.log('⚠️  Warm load: GOOD (≤ 200ms)');
    } else {
      console.log('❌ Warm load: NEEDS IMPROVEMENT (> 200ms)');
    }

    if (results.etagCache <= 50) {
      console.log('✅ ETag cache: EXCELLENT (≤ 50ms)');
    } else if (results.etagCache <= 100) {
      console.log('⚠️  ETag cache: GOOD (≤ 100ms)');
    } else {
      console.log('❌ ETag cache: NEEDS IMPROVEMENT (> 100ms)');
    }

    if (results.improvement >= 75) {
      console.log(`✅ Overall improvement: EXCELLENT (${results.improvement}%)`);
    } else if (results.improvement >= 50) {
      console.log(`⚠️  Overall improvement: GOOD (${results.improvement}%)`);
    } else {
      console.log(`❌ Overall improvement: NEEDS IMPROVEMENT (${results.improvement}%)`);
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the tests
testCommunityPerformance()
  .then(() => {
    console.log('\n✅ All tests completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
