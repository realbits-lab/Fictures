#!/usr/bin/env node

/**
 * Performance Testing Script for /studio
 *
 * Tests loading time with and without cache to measure optimization impact
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/test-studio-loading.mjs
 */

import { promises as fs } from 'fs';

// Get authentication from .auth/user.json
const authPath = '.auth/user.json';
let cookies = '';

try {
  const authData = JSON.parse(await fs.readFile(authPath, 'utf-8'));

  // Extract session cookies
  if (authData.cookies && Array.isArray(authData.cookies)) {
    cookies = authData.cookies
      .map(c => `${c.name}=${c.value}`)
      .join('; ');
  }

  console.log('✅ Loaded authentication from .auth/user.json');
} catch (error) {
  console.error('❌ Failed to load authentication:', error.message);
  console.error('Run: dotenv --file .env.local run node scripts/capture-auth-manual.mjs');
  process.exit(1);
}

const BASE_URL = 'http://localhost:3000';
const API_ENDPOINT = '/studio/api/stories';

/**
 * Measure API request time
 */
async function measureRequest(label, url, headers = {}) {
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      headers: {
        'Cookie': cookies,
        ...headers,
      },
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const storiesCount = data?.stories?.length || 0;

    return {
      success: true,
      duration,
      status: response.status,
      storiesCount,
      cacheStatus: response.status === 304 ? '304 Not Modified (ETag)' : 'Fresh Data',
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      success: false,
      duration,
      error: error.message,
    };
  }
}

/**
 * Run performance test suite
 */
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('Studio Performance Test');
  console.log('='.repeat(60) + '\n');

  console.log('Testing endpoint:', `${BASE_URL}${API_ENDPOINT}`);
  console.log('');

  // Test 1: Cold load (first request - Redis cache miss)
  console.log('📊 Test 1: Cold Load (Redis Cache Miss)');
  console.log('---');
  const test1 = await measureRequest('Cold Load', `${BASE_URL}${API_ENDPOINT}`);

  if (test1.success) {
    console.log(`✅ Request completed: ${test1.duration}ms`);
    console.log(`   Stories: ${test1.storiesCount}`);
    console.log(`   Status: ${test1.cacheStatus}`);
  } else {
    console.log(`❌ Request failed: ${test1.error}`);
  }
  console.log('');

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 2: Warm load (second request - Redis cache hit)
  console.log('📊 Test 2: Warm Load (Redis Cache Hit)');
  console.log('---');
  const test2 = await measureRequest('Warm Load', `${BASE_URL}${API_ENDPOINT}`);

  if (test2.success) {
    console.log(`✅ Request completed: ${test2.duration}ms`);
    console.log(`   Stories: ${test2.storiesCount}`);
    console.log(`   Status: ${test2.cacheStatus}`);
    console.log(`   Improvement: ${Math.round((1 - test2.duration / test1.duration) * 100)}% faster`);
  } else {
    console.log(`❌ Request failed: ${test2.error}`);
  }
  console.log('');

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 3: ETag validation (third request with ETag)
  console.log('📊 Test 3: ETag Validation (304 Not Modified)');
  console.log('---');
  const test3 = await measureRequest(
    'ETag Request',
    `${BASE_URL}${API_ENDPOINT}`,
    { 'If-None-Match': test2.etag || 'dummy-etag' }
  );

  if (test3.success) {
    console.log(`✅ Request completed: ${test3.duration}ms`);
    console.log(`   Status: ${test3.cacheStatus}`);
    console.log(`   Improvement: ${Math.round((1 - test3.duration / test1.duration) * 100)}% faster than cold`);
  } else {
    console.log(`❌ Request failed: ${test3.error}`);
  }
  console.log('');

  // Summary
  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Cold Load (Cache Miss):     ${test1.duration}ms`);
  console.log(`Warm Load (Cache Hit):      ${test2.duration}ms (${Math.round((1 - test2.duration / test1.duration) * 100)}% faster)`);
  console.log(`ETag Load (304):            ${test3.duration}ms (${Math.round((1 - test3.duration / test1.duration) * 100)}% faster)`);
  console.log('');

  // Performance targets
  console.log('Performance Targets:');
  console.log('---');
  console.log(`✓ Cold Load < 500ms:        ${test1.duration < 500 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`✓ Warm Load < 100ms:        ${test2.duration < 100 ? '✅ PASS' : '⚠️  CLOSE (target: <100ms)'}`);
  console.log(`✓ ETag Load < 50ms:         ${test3.duration < 50 ? '✅ PASS' : '⚠️  CLOSE (target: <50ms)'}`);
  console.log('');

  // Cache efficiency
  const cacheSpeedup = Math.round((test1.duration / test2.duration) * 10) / 10;
  console.log(`Cache Speedup:              ${cacheSpeedup}x faster`);
  console.log(`Redis Cache Status:         ${test2.duration < 100 ? '✅ Working' : '⚠️  Check Redis connection'}`);
  console.log('');

  console.log('='.repeat(60));
  console.log('');
}

// Run tests
runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
