#!/usr/bin/env node

/**
 * Verify Scene Cache Fix
 *
 * Tests that the cache version mismatch bug is fixed by:
 * 1. Clearing cache
 * 2. Visiting a scene page (should MISS and cache)
 * 3. Navigating away
 * 4. Returning to same scene (should HIT cache)
 * 5. Verifying cache HIT logs appear
 * 6. Measuring performance improvement
 */

import { chromium } from '@playwright/test';

const TEST_URL = 'http://localhost:3000';
const AUTH_STATE = '.auth/user.json';

async function verifySceneCacheFix() {
  console.log('🔍 Scene Cache Fix Verification Starting...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: AUTH_STATE,
  });
  const page = await context.newPage();

  // Collect console logs
  const logs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    logs.push({ type, text, timestamp: Date.now() });

    if (text.includes('[CacheManager]') || text.includes('[Cache]')) {
      console.log(`  ${type}: ${text}`);
    }
  });

  try {
    // Step 1: Clear cache completely
    console.log('🗑️  Step 1: Clearing all cache from localStorage...\n');

    await page.goto(TEST_URL);
    await page.waitForTimeout(1000);

    const clearedKeys = await page.evaluate(() => {
      const keysToRemove = [];
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('swr-cache-')) {
          keysToRemove.push(key);
          localStorage.removeItem(key);
        }
      }
      return keysToRemove;
    });

    console.log(`✅ Cleared ${clearedKeys.length} cache entries\n`);
    clearedKeys.forEach(key => console.log(`  - ${key}`));
    console.log('');

    // Step 2: Visit /reading to get list of stories
    console.log('📖 Step 2: Navigating to /reading to find a story...\n');

    await page.goto(`${TEST_URL}/reading`);
    await page.waitForTimeout(3000);

    // Count story cards on page
    const storyCardCount = await page.locator('div.cursor-pointer.hover\\:scale-\\[1\\.02\\]').count();
    console.log(`✅ Found ${storyCardCount} story cards on /reading page\n`);

    if (storyCardCount === 0) {
      console.error('❌ No stories found on /reading page');
      return;
    }

    // Step 3: First visit to scene page (should MISS and cache)
    console.log('🎬 Step 3: Clicking on first story card (first visit, should MISS and cache)...\n');

    const firstVisitStart = Date.now();
    logs.length = 0; // Clear previous logs

    // Click on the first story card
    await page.locator('div.cursor-pointer.hover\\:scale-\\[1\\.02\\]').first().click();

    // Wait for navigation
    await page.waitForURL(/\/reading\/[a-zA-Z0-9_-]+/, { timeout: 5000 });
    await page.waitForTimeout(3000);

    const sceneUrl = page.url();
    console.log(`✅ Navigated to story: ${sceneUrl}\n`);

    const firstVisitEnd = Date.now();
    const firstVisitDuration = firstVisitEnd - firstVisitStart;

    // Analyze first visit logs
    const firstVisitCacheMiss = logs.filter(log =>
      log.text.includes('Cache MISS') || log.text.includes('❌ Cache MISS')
    );
    const firstVisitCacheSave = logs.filter(log =>
      log.text.includes('💾 Saved fresh data') || log.text.includes('setCachedData')
    );

    console.log('📊 First visit results:');
    console.log(`  Duration: ${firstVisitDuration}ms`);
    console.log(`  Cache MISS logs: ${firstVisitCacheMiss.length}`);
    console.log(`  Cache save logs: ${firstVisitCacheSave.length}`);

    if (firstVisitCacheMiss.length > 0) {
      console.log(`  ✅ Expected cache MISS on first visit`);
    } else {
      console.log(`  ⚠️  No cache MISS detected on first visit`);
    }

    if (firstVisitCacheSave.length > 0) {
      console.log(`  ✅ Cache was saved after first visit`);
    } else {
      console.log(`  ❌ Cache was NOT saved after first visit`);
    }
    console.log('');

    // Verify cache was saved to localStorage
    const cacheAfterFirstVisit = await page.evaluate(() => {
      const cacheKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('swr-cache-')) {
          const value = localStorage.getItem(key);
          cacheKeys.push({
            key,
            size: value ? value.length : 0,
          });
        }
      }
      return cacheKeys;
    });

    console.log('💾 localStorage after first visit:');
    console.log(`  Cache entries: ${cacheAfterFirstVisit.length}`);
    cacheAfterFirstVisit.forEach(entry => {
      console.log(`  - ${entry.key}: ${(entry.size / 1024).toFixed(2)} KB`);
    });
    console.log('');

    // Step 4: Navigate away
    console.log('🔄 Step 4: Navigating away from scene...\n');

    await page.goto(`${TEST_URL}/reading`);
    await page.waitForTimeout(1000);

    console.log('✅ Navigated to /reading\n');

    // Step 5: Return to same scene (should HIT cache)
    console.log('🔙 Step 5: Returning to same scene (should HIT cache)...\n');

    const secondVisitStart = Date.now();
    logs.length = 0; // Clear previous logs

    await page.goto(sceneUrl);
    await page.waitForTimeout(3000);

    const secondVisitEnd = Date.now();
    const secondVisitDuration = secondVisitEnd - secondVisitStart;

    // Analyze second visit logs
    const secondVisitCacheHit = logs.filter(log =>
      log.text.includes('Cache HIT') || log.text.includes('✅ Cache HIT')
    );
    const secondVisitCacheMiss = logs.filter(log =>
      log.text.includes('Cache MISS') || log.text.includes('❌ Cache MISS')
    );
    const secondVisitVersionMismatch = logs.filter(log =>
      log.text.includes('Version mismatch') || log.text.includes('⚠️ Version mismatch')
    );

    console.log('📊 Second visit results:');
    console.log(`  Duration: ${secondVisitDuration}ms`);
    console.log(`  Cache HIT logs: ${secondVisitCacheHit.length}`);
    console.log(`  Cache MISS logs: ${secondVisitCacheMiss.length}`);
    console.log(`  Version mismatch logs: ${secondVisitVersionMismatch.length}`);
    console.log('');

    // Performance comparison
    console.log('⚡ Performance comparison:');
    console.log(`  First visit (API fetch): ${firstVisitDuration}ms`);
    console.log(`  Second visit (cache): ${secondVisitDuration}ms`);

    if (secondVisitDuration < firstVisitDuration) {
      const improvement = ((firstVisitDuration - secondVisitDuration) / firstVisitDuration * 100).toFixed(1);
      const speedup = (firstVisitDuration / secondVisitDuration).toFixed(1);
      console.log(`  Improvement: ${improvement}% faster (${speedup}x speedup)`);
    }
    console.log('');

    // Final verification
    console.log('🎯 Final Verification:\n');

    const results = {
      cacheWasSaved: cacheAfterFirstVisit.length > 0,
      cacheHitOnSecondVisit: secondVisitCacheHit.length > 0,
      noCacheMissOnSecondVisit: secondVisitCacheMiss.length === 0,
      noVersionMismatchBug: secondVisitVersionMismatch.length === 0,
      performanceImprovement: secondVisitDuration < firstVisitDuration,
      significantSpeedup: secondVisitDuration < firstVisitDuration * 0.5, // At least 2x faster
    };

    Object.entries(results).forEach(([check, passed]) => {
      const icon = passed ? '✅' : '❌';
      const label = check.replace(/([A-Z])/g, ' $1').toLowerCase();
      console.log(`  ${icon} ${label}`);
    });
    console.log('');

    const allPassed = Object.values(results).every(v => v === true);

    if (allPassed) {
      console.log('🎉 SUCCESS! Cache fix is working correctly!\n');
      console.log('Summary:');
      console.log('  - Cache data is stored after first visit');
      console.log('  - Cache HIT occurs on second visit');
      console.log('  - No cache MISS on second visit');
      console.log('  - No version mismatch bug');
      console.log(`  - Performance improved by ${((firstVisitDuration - secondVisitDuration) / firstVisitDuration * 100).toFixed(1)}%`);
      console.log('');
    } else {
      console.log('⚠️  Some checks failed. Cache may not be working as expected.\n');

      if (!results.cacheWasSaved) {
        console.log('❌ Cache was not saved after first visit');
      }
      if (!results.cacheHitOnSecondVisit) {
        console.log('❌ Cache HIT did not occur on second visit');
      }
      if (!results.noCacheMissOnSecondVisit) {
        console.log('❌ Cache MISS still occurring on second visit (BUG NOT FIXED)');
      }
      if (!results.noVersionMismatchBug) {
        console.log('❌ Version mismatch bug still present');
        secondVisitVersionMismatch.forEach(log => {
          console.log(`  ${log.text}`);
        });
      }
      if (!results.performanceImprovement) {
        console.log('❌ No performance improvement observed');
      }
      console.log('');
    }

    // Show relevant logs
    if (secondVisitVersionMismatch.length > 0) {
      console.log('⚠️  Version mismatch logs on second visit:');
      secondVisitVersionMismatch.forEach(log => {
        console.log(`  ${log.text}`);
      });
      console.log('');
    }

    if (secondVisitCacheHit.length > 0) {
      console.log('✅ Cache HIT logs on second visit:');
      secondVisitCacheHit.slice(0, 3).forEach(log => {
        console.log(`  ${log.text}`);
      });
      if (secondVisitCacheHit.length > 3) {
        console.log(`  ... and ${secondVisitCacheHit.length - 3} more cache HIT logs`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await browser.close();
  }
}

// Run the verification
verifySceneCacheFix().catch(console.error);
