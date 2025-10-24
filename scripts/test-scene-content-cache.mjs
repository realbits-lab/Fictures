#!/usr/bin/env node

/**
 * Test Scene Content Cache
 *
 * This script tests the ACTUAL scene content caching by clicking on scenes
 * and checking if useChapterScenes hook properly caches and retrieves data.
 */

import { chromium } from '@playwright/test';

const TEST_URL = 'http://localhost:3000';
const AUTH_STATE = '.auth/user.json';

async function testSceneContentCache() {
  console.log('🔍 Scene Content Cache Test Starting...\n');

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

    // Show scene cache-related logs
    if (
      text.includes('scenes') ||
      text.includes('Scenes') ||
      text.includes('SCENES') ||
      text.includes('Cache') ||
      text.includes('cache')
    ) {
      console.log(`  [${type}] ${text}`);
    }
  });

  try {
    console.log('📋 Step 1: Clear cache and navigate to story list...\n');

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

    const storyUrl = page.url();
    console.log(`✅ Navigated to: ${storyUrl}\n`);

    // Step 4: Wait for scene buttons to load
    console.log('⏳ Step 4: Waiting for scene buttons to load...\n');

    // Wait for scene buttons with 🎬 emoji to appear
    await page.waitForSelector('button:has-text("🎬")', { timeout: 10000 });
    const sceneButtonCount = await page.locator('button:has-text("🎬")').count();
    console.log(`✅ Found ${sceneButtonCount} scene buttons\n`);

    if (sceneButtonCount === 0) {
      console.error('❌ No scene buttons found!');
      return;
    }

    // Step 5: Click on first scene (CRITICAL - this triggers useChapterScenes hook!)
    console.log('🎬 Step 5: Click on first scene (triggers useChapterScenes)...\n');

    // Clear recent logs tracking
    const beforeFirstClickTimestamp = Date.now();

    // Click first scene button
    await page.locator('button:has-text("🎬")').first().click();
    await page.waitForTimeout(3000);

    // Count scene cache logs on first click
    const firstClickSceneLogs = allLogs.filter(log =>
      log.timestamp >= beforeFirstClickTimestamp &&
      (
        log.text.includes('useChapterScenes') ||
        log.text.includes('SWR Fetcher START') ||
        log.text.includes('Chapter scenes') ||
        log.text.includes('/writing/api/chapters/') &&
        log.text.includes('/scenes')
      )
    );

    const firstClickMiss = allLogs.filter(log =>
      log.timestamp >= beforeFirstClickTimestamp &&
      (log.text.includes('Cache MISS') || log.text.includes('❌ Cache MISS'))
    );

    const firstClickHit = allLogs.filter(log =>
      log.timestamp >= beforeFirstClickTimestamp &&
      (log.text.includes('Cache HIT') || log.text.includes('✅ Cache HIT'))
    );

    console.log('📊 First scene click logs:');
    console.log(`  Scene-related logs: ${firstClickSceneLogs.length}`);
    console.log(`  Cache MISS: ${firstClickMiss.length} ${firstClickMiss.length > 0 ? '(Expected - first load)' : ''}`);
    console.log(`  Cache HIT: ${firstClickHit.length}`);
    console.log('');

    if (firstClickSceneLogs.length > 0) {
      console.log('📝 Scene logs from first click:');
      firstClickSceneLogs.slice(0, 5).forEach(log => {
        console.log(`  ${log.text.substring(0, 120)}`);
      });
      console.log('');
    }

    // Step 6: Check localStorage for scene cache
    console.log('💾 Step 6: Check localStorage for scene cache...\n');

    const sceneCacheKeys = await page.evaluate(() => {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('chapters') && key.includes('scenes')) {
          const value = localStorage.getItem(key);
          keys.push({
            key,
            size: value ? value.length : 0,
            hasData: !!value
          });
        }
      }
      return keys;
    });

    console.log('📦 Scene cache keys in localStorage:');
    if (sceneCacheKeys.length === 0) {
      console.log('  ❌ NO SCENE CACHE KEYS FOUND!');
      console.log('  This means scene content is NOT being cached to localStorage');
    } else {
      sceneCacheKeys.forEach(entry => {
        console.log(`  ✅ ${entry.key}: ${(entry.size / 1024).toFixed(2)} KB`);
      });
    }
    console.log('');

    // Step 7: Navigate away
    console.log('🔄 Step 7: Navigate away to story list...\n');
    await page.goto(`${TEST_URL}/reading`);
    await page.waitForTimeout(2000);

    // Step 8: Return to same story
    console.log('🔙 Step 8: Return to same story...\n');
    await page.goto(storyUrl);
    await page.waitForTimeout(2000);

    // Wait for scene buttons
    await page.waitForSelector('button:has-text("🎬")', { timeout: 10000 });

    // Step 9: Click SAME scene again (CRITICAL TEST - should HIT cache!)
    console.log('🎯 Step 9: Click same scene again (should HIT cache!)...\n');

    const beforeSecondClickTimestamp = Date.now();

    // Click first scene button again
    await page.locator('button:has-text("🎬")').first().click();
    await page.waitForTimeout(3000);

    // Count scene cache logs on second click
    const secondClickSceneLogs = allLogs.filter(log =>
      log.timestamp >= beforeSecondClickTimestamp &&
      (
        log.text.includes('useChapterScenes') ||
        log.text.includes('SWR Fetcher START') ||
        log.text.includes('Chapter scenes') ||
        log.text.includes('/writing/api/chapters/') &&
        log.text.includes('/scenes')
      )
    );

    const secondClickMiss = allLogs.filter(log =>
      log.timestamp >= beforeSecondClickTimestamp &&
      (log.text.includes('Cache MISS') || log.text.includes('❌ Cache MISS'))
    );

    const secondClickHit = allLogs.filter(log =>
      log.timestamp >= beforeSecondClickTimestamp &&
      (log.text.includes('Cache HIT') || log.text.includes('✅ Cache HIT'))
    );

    console.log('📊 Second scene click logs (same scene):');
    console.log(`  Scene-related logs: ${secondClickSceneLogs.length}`);
    console.log(`  Cache MISS: ${secondClickMiss.length} ${secondClickMiss.length > 0 ? '❌ PROBLEM!' : '✅'}`);
    console.log(`  Cache HIT: ${secondClickHit.length} ${secondClickHit.length > 0 ? '✅' : '❌ PROBLEM!'}`);
    console.log('');

    if (secondClickSceneLogs.length > 0) {
      console.log('📝 Scene logs from second click:');
      secondClickSceneLogs.slice(0, 5).forEach(log => {
        console.log(`  ${log.text.substring(0, 120)}`);
      });
      console.log('');
    }

    // Final verdict
    console.log('🎯 FINAL VERDICT:\n');

    if (sceneCacheKeys.length === 0) {
      console.log('❌ CRITICAL ISSUE:');
      console.log('  - Scene content is NOT being cached to localStorage');
      console.log('  - This explains why user sees Cache MISS logs');
      console.log('');
      console.log('🔧 Possible causes:');
      console.log('  1. useChapterScenes hook not calling setCachedData');
      console.log('  2. usePersistedSWR not working for scene endpoints');
      console.log('  3. Scene cache keys have different format than expected');
      console.log('');
    } else if (secondClickMiss.length > 0) {
      console.log('❌ BUG CONFIRMED:');
      console.log('  - Scene content IS cached to localStorage ✅');
      console.log('  - But Cache MISS logs still appear on second visit ❌');
      console.log('');
      console.log('🔧 Possible causes:');
      console.log('  1. useChapterScenes not checking localStorage before fetching');
      console.log('  2. Cache key mismatch between save and load');
      console.log('  3. TTL expired too quickly');
      console.log('  4. SWR dedupingInterval not working');
      console.log('');
    } else if (secondClickHit.length > 0 && secondClickMiss.length === 0) {
      console.log('✅ CACHE WORKING CORRECTLY:');
      console.log('  - Scene content cached to localStorage ✅');
      console.log('  - Cache HIT on second visit ✅');
      console.log('  - No Cache MISS logs ✅');
      console.log('');
    } else {
      console.log('⚠️  INCONCLUSIVE:');
      console.log(`  - Cache MISS logs: ${secondClickMiss.length}`);
      console.log(`  - Cache HIT logs: ${secondClickHit.length}`);
      console.log('  - Need more investigation');
      console.log('');
    }

    // Show cache MISS logs if found
    if (secondClickMiss.length > 0) {
      console.log('⚠️  Found Cache MISS logs on second visit:');
      secondClickMiss.forEach(log => {
        console.log(`  ${log.text}`);
      });
      console.log('');
    }

    // Show cache HIT logs if found
    if (secondClickHit.length > 0) {
      console.log('✅ Found Cache HIT logs on second visit:');
      secondClickHit.forEach(log => {
        console.log(`  ${log.text}`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testSceneContentCache().catch(console.error);
