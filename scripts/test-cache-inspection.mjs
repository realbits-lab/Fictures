#!/usr/bin/env node

/**
 * Cache Inspection Test Script
 *
 * This script helps diagnose cache issues by:
 * 1. Inspecting localStorage for SWR cache entries
 * 2. Checking cache validity and expiration
 * 3. Testing cache key consistency
 */

import { chromium } from '@playwright/test';

const TEST_URL = 'http://localhost:3000';
const AUTH_STATE = '.auth/user.json';

async function inspectCache() {
  console.log('🔍 Cache Inspection Test Starting...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: AUTH_STATE,
  });
  const page = await context.newPage();

  // Enable console logging
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (text.includes('[Cache') || text.includes('[CacheManager')) {
      console.log(`  ${type}: ${text}`);
    }
  });

  try {
    console.log('📋 Step 1: Inspecting initial localStorage state...\n');

    // Navigate to home first
    await page.goto(TEST_URL);
    await page.waitForTimeout(1000);

    // Inspect localStorage
    const initialCache = await page.evaluate(() => {
      const cache = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('swr-cache-')) {
          const value = localStorage.getItem(key);
          cache[key] = value ? `${value.substring(0, 100)}... (${value.length} chars)` : null;
        }
      }
      return cache;
    });

    console.log('📦 Initial localStorage SWR cache entries:');
    Object.keys(initialCache).forEach((key) => {
      console.log(`  - ${key}`);
    });
    console.log('');

    // Test 1: Visit a story and check cache
    console.log('📖 Step 2: Visiting a story scene...\n');

    await page.goto(`${TEST_URL}/reading`);
    await page.waitForTimeout(2000);

    // Click on first story
    const firstStory = await page.locator('article').first();
    await firstStory.click();
    await page.waitForTimeout(2000);

    // Get the chapter URL
    const chapterUrl = page.url();
    console.log(`📍 Current URL: ${chapterUrl}\n`);

    // Wait for scene to load
    await page.waitForTimeout(3000);

    // Check localStorage after visit
    const afterVisitCache = await page.evaluate(() => {
      const cache = {};
      const details = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('swr-cache-')) {
          const value = localStorage.getItem(key);

          if (key.includes('-timestamp')) {
            const timestamp = parseInt(value || '0');
            const age = Date.now() - timestamp;
            details.push({
              key,
              timestamp: new Date(timestamp).toISOString(),
              age: `${Math.round(age / 1000)}s ago`,
            });
          } else if (key.includes('-version')) {
            details.push({
              key,
              version: value,
            });
          } else {
            cache[key] = {
              size: value ? value.length : 0,
              preview: value ? value.substring(0, 100) : null,
            };
          }
        }
      }

      return { cache, details };
    });

    console.log('💾 localStorage after first visit:');
    console.log(`  Cache entries: ${Object.keys(afterVisitCache.cache).length}`);
    Object.entries(afterVisitCache.cache).forEach(([key, data]) => {
      console.log(`  - ${key}: ${(data.size / 1024).toFixed(2)} KB`);
    });
    console.log('');

    console.log('⏰ Cache timestamps:');
    afterVisitCache.details
      .filter((d) => d.timestamp)
      .forEach((d) => {
        console.log(`  - ${d.key}: ${d.timestamp} (${d.age})`);
      });
    console.log('');

    console.log('🔖 Cache versions:');
    afterVisitCache.details
      .filter((d) => d.version)
      .forEach((d) => {
        console.log(`  - ${d.key}: ${d.version}`);
      });
    console.log('');

    // Test 2: Navigate away and back
    console.log('🔄 Step 3: Navigating away and returning...\n');

    await page.goto(`${TEST_URL}/reading`);
    await page.waitForTimeout(1000);

    console.log('✅ Navigated to /reading\n');

    // Navigate back to the same chapter
    console.log('🔙 Returning to chapter...\n');
    await page.goto(chapterUrl);
    await page.waitForTimeout(3000);

    // Check if cache was used
    const cacheHitLogs = [];
    const cacheMissLogs = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Cache HIT')) {
        cacheHitLogs.push(text);
      } else if (text.includes('Cache MISS')) {
        cacheMissLogs.push(text);
      }
    });

    await page.waitForTimeout(2000);

    console.log('📊 Cache behavior on return visit:');
    if (cacheHitLogs.length > 0) {
      console.log(`  ✅ Cache HITS: ${cacheHitLogs.length}`);
      cacheHitLogs.forEach((log) => console.log(`    - ${log}`));
    }
    if (cacheMissLogs.length > 0) {
      console.log(`  ❌ Cache MISSES: ${cacheMissLogs.length}`);
      cacheMissLogs.forEach((log) => console.log(`    - ${log}`));
    }
    console.log('');

    // Test 3: Check localStorage keys consistency
    console.log('🔑 Step 4: Checking cache key consistency...\n');

    const keyAnalysis = await page.evaluate(() => {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('swr-cache-')) {
          keys.push(key);
        }
      }

      // Group keys by base name
      const groups = {};
      keys.forEach((key) => {
        const baseName = key.replace('swr-cache-', '').replace(/-timestamp$/, '').replace(/-version$/, '');
        if (!groups[baseName]) {
          groups[baseName] = [];
        }
        groups[baseName].push(key);
      });

      return { totalKeys: keys.length, groups };
    });

    console.log(`📋 Total SWR cache keys: ${keyAnalysis.totalKeys}`);
    console.log('📦 Grouped by cache entry:');
    Object.entries(keyAnalysis.groups).forEach(([baseName, keys]) => {
      console.log(`\n  ${baseName}:`);
      keys.forEach((key) => console.log(`    - ${key}`));

      // Check if all required keys exist
      const hasData = keys.some((k) => !k.includes('-timestamp') && !k.includes('-version'));
      const hasTimestamp = keys.some((k) => k.includes('-timestamp'));
      const hasVersion = keys.some((k) => k.includes('-version'));

      console.log(`    Status: ${hasData ? '✅' : '❌'} data, ${hasTimestamp ? '✅' : '❌'} timestamp, ${hasVersion ? '✅' : '❌'} version`);
    });
    console.log('');

    console.log('✅ Cache inspection complete!\n');

  } catch (error) {
    console.error('❌ Error during cache inspection:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
inspectCache().catch(console.error);
