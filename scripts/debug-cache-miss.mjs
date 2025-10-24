#!/usr/bin/env node

/**
 * Debug Cache MISS Issue
 *
 * This script tests the complete cache flow to find why "Cache MISS" logs appear
 * even after content has been cached.
 */

import { chromium } from '@playwright/test';

const TEST_URL = 'http://localhost:3000';
const AUTH_STATE = '.auth/user.json';

async function debugCacheMiss() {
  console.log('🔍 Cache MISS Debugging Session Starting...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: AUTH_STATE,
  });
  const page = await context.newPage();

  // Track ALL console messages
  const allLogs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    allLogs.push({ type, text, timestamp: Date.now() });

    // Show cache-related logs
    if (text.includes('Cache') || text.includes('cache') || text.includes('MISS') || text.includes('HIT')) {
      console.log(`  [${type}] ${text}`);
    }
  });

  try {
    console.log('📋 Step 1: Clear all cache and start fresh...\n');

    await page.goto(TEST_URL);
    await page.waitForTimeout(1000);

    // Clear localStorage completely
    await page.evaluate(() => {
      localStorage.clear();
      console.log('[TEST] ✅ localStorage cleared');
    });

    console.log('✅ Cache cleared\n');

    // Step 2: Navigate to story list
    console.log('📖 Step 2: Load story list...\n');
    await page.goto(`${TEST_URL}/reading`);
    await page.waitForTimeout(3000);

    // Check localStorage after story list load
    const storyListCache = await page.evaluate(() => {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('swr-cache-')) {
          const value = localStorage.getItem(key);
          keys.push({
            key,
            size: value ? value.length : 0,
            preview: value ? value.substring(0, 50) : null
          });
        }
      }
      return keys;
    });

    console.log('💾 Story list - localStorage after load:');
    storyListCache.forEach(entry => {
      console.log(`  - ${entry.key}: ${(entry.size / 1024).toFixed(2)} KB`);
    });
    console.log('');

    // Step 3: Click on first story
    console.log('🎬 Step 3: Click on first story...\n');

    const storyCardCount = await page.locator('div.cursor-pointer.hover\\:scale-\\[1\\.02\\]').count();
    console.log(`Found ${storyCardCount} story cards\n`);

    if (storyCardCount === 0) {
      console.error('❌ No story cards found!');
      return;
    }

    // Click first story
    await page.locator('div.cursor-pointer.hover\\:scale-\\[1\\.02\\]').first().click();
    await page.waitForURL(/\/reading\/[a-zA-Z0-9_-]+/, { timeout: 5000 });
    await page.waitForTimeout(3000);

    const storyUrl = page.url();
    console.log(`✅ Navigated to: ${storyUrl}\n`);

    // Check localStorage after scene load
    const sceneCache = await page.evaluate(() => {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('swr-cache-')) {
          const value = localStorage.getItem(key);
          keys.push({
            key,
            size: value ? value.length : 0,
            hasData: !!value,
            timestamp: localStorage.getItem(key + '-timestamp'),
            version: localStorage.getItem(key + '-version')
          });
        }
      }
      return keys;
    });

    console.log('💾 Scene - localStorage after first load:');
    sceneCache.forEach(entry => {
      if (!entry.key.includes('-timestamp') && !entry.key.includes('-version')) {
        console.log(`  - ${entry.key}:`);
        console.log(`    Size: ${(entry.size / 1024).toFixed(2)} KB`);
        console.log(`    Timestamp: ${entry.timestamp ? new Date(parseInt(entry.timestamp)).toISOString() : 'none'}`);
        console.log(`    Version: ${entry.version || 'none'}`);
      }
    });
    console.log('');

    // Count cache MISS and HIT logs on first load
    const firstLoadMiss = allLogs.filter(log =>
      (log.text.includes('Cache MISS') || log.text.includes('❌ Cache MISS')) &&
      log.timestamp > Date.now() - 5000
    );
    const firstLoadHit = allLogs.filter(log =>
      (log.text.includes('Cache HIT') || log.text.includes('✅ Cache HIT')) &&
      log.timestamp > Date.now() - 5000
    );

    console.log('📊 First load cache logs:');
    console.log(`  Cache MISS: ${firstLoadMiss.length}`);
    console.log(`  Cache HIT: ${firstLoadHit.length}`);
    console.log('');

    // Step 4: Navigate away
    console.log('🔄 Step 4: Navigate away to story list...\n');
    await page.goto(`${TEST_URL}/reading`);
    await page.waitForTimeout(2000);

    // Step 5: Return to same scene
    console.log('🔙 Step 5: Return to same scene (CRITICAL TEST)...\n');

    // Clear recent logs tracking
    const beforeReturnTimestamp = Date.now();

    await page.goto(storyUrl);
    await page.waitForTimeout(3000);

    // Check cache logs on return
    const returnMiss = allLogs.filter(log =>
      (log.text.includes('Cache MISS') || log.text.includes('❌ Cache MISS')) &&
      log.timestamp >= beforeReturnTimestamp
    );
    const returnHit = allLogs.filter(log =>
      (log.text.includes('Cache HIT') || log.text.includes('✅ Cache HIT')) &&
      log.timestamp >= beforeReturnTimestamp
    );

    console.log('📊 Return visit cache logs:');
    console.log(`  Cache MISS: ${returnMiss.length} ${returnMiss.length > 0 ? '❌ PROBLEM!' : '✅'}`);
    console.log(`  Cache HIT: ${returnHit.length} ${returnHit.length > 0 ? '✅' : '❌ PROBLEM!'}`);
    console.log('');

    if (returnMiss.length > 0) {
      console.log('⚠️  Found Cache MISS logs on return visit:');
      returnMiss.forEach(log => {
        console.log(`  ${log.text}`);
      });
      console.log('');
    }

    if (returnHit.length > 0) {
      console.log('✅ Found Cache HIT logs on return visit:');
      returnHit.forEach(log => {
        console.log(`  ${log.text}`);
      });
      console.log('');
    }

    // Step 6: Detailed localStorage inspection
    console.log('🔍 Step 6: Detailed localStorage inspection...\n');

    const detailedCache = await page.evaluate(() => {
      const analysis = [];

      // Find all scene-related cache entries
      const sceneKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('scenes') && key.startsWith('swr-cache-')) {
          sceneKeys.push(key);
        }
      }

      // Analyze each scene cache
      const baseKeys = new Set();
      sceneKeys.forEach(key => {
        const baseKey = key.replace('-timestamp', '').replace('-version', '');
        baseKeys.add(baseKey);
      });

      baseKeys.forEach(baseKey => {
        const data = localStorage.getItem(baseKey);
        const timestamp = localStorage.getItem(baseKey + '-timestamp');
        const version = localStorage.getItem(baseKey + '-version');

        const age = timestamp ? Date.now() - parseInt(timestamp) : null;
        const ttl = 5 * 60 * 1000; // 5 minutes
        const isExpired = age ? age > ttl : true;

        analysis.push({
          key: baseKey,
          hasData: !!data,
          dataSize: data ? data.length : 0,
          hasTimestamp: !!timestamp,
          timestamp: timestamp ? new Date(parseInt(timestamp)).toISOString() : null,
          ageSeconds: age ? Math.round(age / 1000) : null,
          hasVersion: !!version,
          version: version,
          ttlSeconds: Math.round(ttl / 1000),
          isExpired,
          shouldHit: !!data && !isExpired
        });
      });

      return analysis;
    });

    console.log('📦 Scene cache analysis:');
    detailedCache.forEach(entry => {
      console.log(`\n  ${entry.key}:`);
      console.log(`    Has data: ${entry.hasData ? '✅' : '❌'}`);
      console.log(`    Data size: ${(entry.dataSize / 1024).toFixed(2)} KB`);
      console.log(`    Has timestamp: ${entry.hasTimestamp ? '✅' : '❌'}`);
      console.log(`    Timestamp: ${entry.timestamp || 'none'}`);
      console.log(`    Age: ${entry.ageSeconds !== null ? entry.ageSeconds + 's' : 'unknown'}`);
      console.log(`    Has version: ${entry.hasVersion ? '✅' : '❌'}`);
      console.log(`    Version: ${entry.version || 'none'}`);
      console.log(`    TTL: ${entry.ttlSeconds}s`);
      console.log(`    Is expired: ${entry.isExpired ? '❌ YES' : '✅ NO'}`);
      console.log(`    Should HIT cache: ${entry.shouldHit ? '✅ YES' : '❌ NO'}`);
    });
    console.log('');

    // Step 7: Check CacheManager behavior
    console.log('🔍 Step 7: Testing CacheManager.getCachedData()...\n');

    const cacheManagerTest = await page.evaluate(() => {
      // Find a scene cache key
      let sceneKey = null;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('scenes') && key.startsWith('swr-cache-') && !key.includes('-timestamp') && !key.includes('-version')) {
          sceneKey = key.replace('swr-cache-', '');
          break;
        }
      }

      if (!sceneKey) {
        return { error: 'No scene cache key found' };
      }

      // Manually test getCachedData logic
      const dataKey = `swr-cache-${sceneKey}`;
      const timestampKey = `swr-cache-${sceneKey}-timestamp`;
      const versionKey = `swr-cache-${sceneKey}-version`;

      const data = localStorage.getItem(dataKey);
      const timestamp = localStorage.getItem(timestampKey);
      const version = localStorage.getItem(versionKey);

      const config = {
        ttl: 5 * 60 * 1000,
        version: '1.1.0'
      };

      // Step through the logic
      const steps = [];

      // Step 1: Check if data exists
      if (!data) {
        steps.push('❌ No data found - would return undefined');
        return { sceneKey, steps, shouldHit: false };
      }
      steps.push('✅ Data exists');

      // Step 2: Check TTL
      if (config.ttl && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        const isExpired = age > config.ttl;
        steps.push(`TTL check: age=${Math.round(age/1000)}s, ttl=${Math.round(config.ttl/1000)}s, expired=${isExpired}`);

        if (isExpired) {
          steps.push('❌ Data expired - would clear and return undefined');
          return { sceneKey, steps, shouldHit: false };
        }
        steps.push('✅ Data not expired');
      }

      // Step 3: Check version
      if (config.version && version && version !== config.version) {
        steps.push(`❌ Version mismatch: cached=${version}, expected=${config.version} - would clear and return undefined`);
        return { sceneKey, steps, shouldHit: false };
      }
      steps.push(`✅ Version match: ${version}`);

      steps.push('✅ Should return cached data - CACHE HIT expected!');
      return { sceneKey, steps, shouldHit: true };
    });

    console.log('CacheManager logic test:');
    console.log(`  Testing key: ${cacheManagerTest.sceneKey || 'none'}`);
    if (cacheManagerTest.steps) {
      cacheManagerTest.steps.forEach(step => {
        console.log(`  ${step}`);
      });
    }
    console.log(`  Final result: ${cacheManagerTest.shouldHit ? '✅ SHOULD HIT' : '❌ SHOULD MISS'}`);
    console.log('');

    // Final verdict
    console.log('🎯 FINAL VERDICT:\n');

    if (returnMiss.length > 0 && cacheManagerTest.shouldHit) {
      console.log('❌ BUG CONFIRMED:');
      console.log('  - localStorage has valid cached data ✅');
      console.log('  - CacheManager logic says it should HIT ✅');
      console.log('  - But "Cache MISS" logs are appearing ❌');
      console.log('');
      console.log('🔧 Possible causes:');
      console.log('  1. CacheManager.getCachedData() not being called');
      console.log('  2. Cache key mismatch between save and load');
      console.log('  3. Multiple cache checks happening (some hitting, some missing)');
      console.log('  4. Prefetch hook still checking wrong cache layer');
      console.log('');
    } else if (returnMiss.length === 0 && returnHit.length > 0) {
      console.log('✅ CACHE WORKING CORRECTLY:');
      console.log('  - Cache HIT logs appearing ✅');
      console.log('  - No Cache MISS logs ✅');
      console.log('  - localStorage data valid ✅');
      console.log('');
    } else {
      console.log('⚠️  INCONCLUSIVE:');
      console.log(`  - Cache MISS logs: ${returnMiss.length}`);
      console.log(`  - Cache HIT logs: ${returnHit.length}`);
      console.log('  - Need more investigation');
      console.log('');
    }

    // Save detailed logs to file
    const logSummary = {
      firstLoadMiss: firstLoadMiss.length,
      firstLoadHit: firstLoadHit.length,
      returnMiss: returnMiss.length,
      returnHit: returnHit.length,
      cacheManagerTest,
      detailedCache,
      allLogs: allLogs.filter(log =>
        log.text.includes('Cache') || log.text.includes('MISS') || log.text.includes('HIT')
      )
    };

    console.log('💾 Saving detailed logs to logs/cache-debug.json...');
    await page.evaluate((logs) => {
      console.log('[DEBUG_SUMMARY]', JSON.stringify(logs));
    }, logSummary);

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await browser.close();
  }
}

// Run the debug session
debugCacheMiss().catch(console.error);
