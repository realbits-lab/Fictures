/**
 * Test mobile scene title visibility in second GNB
 * Verifies that scene title is visible on both mobile and desktop
 */

import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

async function testSceneTitleVisibility() {
  console.log('📱 Testing Scene Title Visibility in Second GNB\n');

  const browser = await chromium.launch({ headless: false });

  try {
    // Test 1: Mobile viewport
    console.log('1️⃣  Testing MOBILE viewport (iPhone SE)...');
    const mobileContext = await browser.newContext({
      storageState: '.auth/user.json',
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    });

    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${BASE_URL}/reading`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(2000);

    // Find and click first story
    const storyCards = mobilePage.locator('div.cursor-pointer').filter({
      hasText: /genre|public/i
    });

    if (await storyCards.count() === 0) {
      console.log('⚠️  No stories found');
      await browser.close();
      return;
    }

    const firstStory = storyCards.first();
    const storyTitle = await firstStory.locator('h3').textContent();
    console.log(`   ✓ Opening story: "${storyTitle}"`);

    await firstStory.click();
    await mobilePage.waitForSelector('[data-testid="chapter-reader"]', { timeout: 30000 });
    await mobilePage.waitForTimeout(2000);

    // Check if scene title is visible in second GNB (mobile)
    const mobileSceneTitle = mobilePage.locator('.text-sm.text-gray-600').filter({
      hasText: /🎬/
    });

    const mobileCount = await mobileSceneTitle.count();
    const mobileVisible = mobileCount > 0 && await mobileSceneTitle.first().isVisible();

    if (mobileVisible) {
      const titleText = await mobileSceneTitle.first().textContent();
      console.log(`   ✅ MOBILE: Scene title visible in GNB: "${titleText}"`);
    } else {
      console.log(`   ❌ MOBILE: Scene title NOT visible in GNB`);
    }

    // Check that no time/timestamp is displayed
    const timePattern = /\d+:\d+|\d+\s*(min|minute|hour|second|time)/i;
    const allText = await mobilePage.locator('.text-sm.text-gray-600').allTextContents();
    const hasTime = allText.some(text => timePattern.test(text));

    if (hasTime) {
      console.log(`   ⚠️  MOBILE: Found time-related text (should not show): ${allText.filter(t => timePattern.test(t))}`);
    } else {
      console.log(`   ✅ MOBILE: No scene time displayed`);
    }

    await mobilePage.screenshot({ path: 'logs/mobile-scene-title-gnb.png' });
    console.log(`   📸 Screenshot: logs/mobile-scene-title-gnb.png\n`);

    await mobileContext.close();

    // Test 2: Desktop viewport
    console.log('2️⃣  Testing DESKTOP viewport...');
    const desktopContext = await browser.newContext({
      storageState: '.auth/user.json',
      viewport: { width: 1920, height: 1080 },
    });

    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(`${BASE_URL}/reading`, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(2000);

    const desktopStoryCards = desktopPage.locator('div.cursor-pointer').filter({
      hasText: /genre|public/i
    });

    await desktopStoryCards.first().click();
    await desktopPage.waitForSelector('[data-testid="chapter-reader"]', { timeout: 30000 });
    await desktopPage.waitForTimeout(2000);

    // Check if scene title is visible in second GNB (desktop)
    const desktopSceneTitle = desktopPage.locator('.text-sm.text-gray-600').filter({
      hasText: /🎬/
    });

    const desktopCount = await desktopSceneTitle.count();
    const desktopVisible = desktopCount > 0 && await desktopSceneTitle.first().isVisible();

    if (desktopVisible) {
      const titleText = await desktopSceneTitle.first().textContent();
      console.log(`   ✅ DESKTOP: Scene title visible in GNB: "${titleText}"`);
    } else {
      console.log(`   ❌ DESKTOP: Scene title NOT visible in GNB`);
    }

    // Check that no time/timestamp is displayed
    const desktopAllText = await desktopPage.locator('.text-sm.text-gray-600').allTextContents();
    const desktopHasTime = desktopAllText.some(text => timePattern.test(text));

    if (desktopHasTime) {
      console.log(`   ⚠️  DESKTOP: Found time-related text (should not show): ${desktopAllText.filter(t => timePattern.test(t))}`);
    } else {
      console.log(`   ✅ DESKTOP: No scene time displayed`);
    }

    await desktopPage.screenshot({ path: 'logs/desktop-scene-title-gnb.png' });
    console.log(`   📸 Screenshot: logs/desktop-scene-title-gnb.png\n`);

    await desktopContext.close();

    // Summary
    console.log('📊 Test Summary:');
    console.log('─────────────────────────────────────');
    console.log(`${mobileVisible ? '✅' : '❌'} Mobile: Scene title in GNB`);
    console.log(`${desktopVisible ? '✅' : '❌'} Desktop: Scene title in GNB`);
    console.log(`${!hasTime ? '✅' : '⚠️ '} Mobile: No time displayed`);
    console.log(`${!desktopHasTime ? '✅' : '⚠️ '} Desktop: No time displayed`);
    console.log('─────────────────────────────────────\n');

    if (mobileVisible && desktopVisible && !hasTime && !desktopHasTime) {
      console.log('🎉 SUCCESS: All requirements met!');
    } else {
      console.log('⚠️  Some requirements not met. Check details above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testSceneTitleVisibility().catch(console.error);
