/**
 * Test that scene title is removed from content area
 * Verifies it still appears in GNB but not in the reading content
 */

import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

async function testSceneTitleRemoval() {
  console.log('📝 Testing Scene Title Removal from Content Area\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: '.auth/user.json',
  });

  const page = await context.newPage();

  try {
    console.log('1️⃣  Opening reading page...');
    await page.goto(`${BASE_URL}/reading`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Find and open first story
    const storyCards = page.locator('div.cursor-pointer').filter({
      hasText: /genre|public/i
    });

    if (await storyCards.count() === 0) {
      console.log('⚠️  No stories found');
      await browser.close();
      return;
    }

    const storyTitle = await storyCards.first().locator('h3').textContent();
    console.log(`   ✓ Opening story: "${storyTitle}"`);

    await storyCards.first().click();
    await page.waitForSelector('[data-testid="chapter-reader"]', { timeout: 30000 });
    await page.waitForSelector('.prose', { timeout: 10000 });
    await page.waitForTimeout(1000);

    console.log('   ✓ Story opened\n');

    // Check for scene title in GNB (should exist)
    console.log('2️⃣  Checking scene title in GNB...');
    const gnbSceneTitle = page.locator('.text-sm.text-gray-600').filter({
      hasText: /🎬/
    });

    const hasGnbTitle = await gnbSceneTitle.count() > 0;

    if (hasGnbTitle) {
      const gnbTitleText = await gnbSceneTitle.first().textContent();
      console.log(`   ✅ Scene title in GNB: "${gnbTitleText}"`);
    } else {
      console.log('   ❌ Scene title NOT found in GNB');
    }

    console.log();

    // Check for scene title in content area (should NOT exist)
    console.log('3️⃣  Checking for scene title in content area...');

    // Look for header with scene title inside article
    const articleHeaders = page.locator('article header h1');
    const articleHeaderCount = await articleHeaders.count();

    if (articleHeaderCount > 0) {
      const headerTexts = await articleHeaders.allTextContents();
      console.log(`   ❌ Found ${articleHeaderCount} h1 headers in content`);
      console.log(`   Header texts: ${headerTexts.join(', ')}`);
      console.log('   ⚠️  Scene title still in content area!');
    } else {
      console.log('   ✅ No h1 headers in content area (title removed)');
    }

    // Check for any large heading text that might be scene title
    const largeHeadings = page.locator('article h1, article h2.text-3xl');
    const largeHeadingCount = await largeHeadings.count();

    if (largeHeadingCount > 0) {
      console.log(`   ⚠️  Found ${largeHeadingCount} large headings in content`);
    } else {
      console.log('   ✅ No large headings in content (clean)');
    }

    console.log();

    // Check for header element with border
    console.log('4️⃣  Checking for header element with border...');
    const headerWithBorder = page.locator('article header.border-b');
    const hasHeaderWithBorder = await headerWithBorder.count() > 0;

    if (hasHeaderWithBorder) {
      console.log('   ❌ Header with border still exists');
    } else {
      console.log('   ✅ No header with border (removed)');
    }

    console.log();

    // Verify content starts immediately
    console.log('5️⃣  Checking content structure...');

    // Check if prose div is immediate child (no header in between)
    const articleProseDiv = page.locator('article > div.prose');
    const hasDirectProseChild = await articleProseDiv.count() > 0;

    if (hasDirectProseChild) {
      console.log('   ✅ Content starts immediately (no header separator)');
    } else {
      console.log('   ⚠️  Content may have elements before it');
    }

    // Take screenshot
    await page.screenshot({
      path: 'logs/scene-title-removal-test.png',
      fullPage: false
    });
    console.log('   📸 Screenshot saved to logs/scene-title-removal-test.png');

    console.log();

    // Summary
    console.log('📊 Test Summary:');
    console.log('─────────────────────────────────────');
    console.log(`Scene title in GNB: ${hasGnbTitle ? '✅ PRESENT' : '❌ MISSING'}`);
    console.log(`Scene title in content: ${articleHeaderCount === 0 ? '✅ REMOVED' : '❌ STILL EXISTS'}`);
    console.log(`Header with border: ${!hasHeaderWithBorder ? '✅ REMOVED' : '❌ STILL EXISTS'}`);
    console.log(`Content starts immediately: ${hasDirectProseChild ? '✅ YES' : '⚠️  NO'}`);
    console.log('─────────────────────────────────────\n');

    if (hasGnbTitle && articleHeaderCount === 0 && !hasHeaderWithBorder) {
      console.log('🎉 SUCCESS: Scene title properly removed!');
      console.log('   ✅ Title visible in GNB');
      console.log('   ✅ Title removed from content area');
      console.log('   ✅ Clean reading experience');
      console.log('   ✅ Content starts immediately\n');
    } else {
      console.log('⚠️  ISSUES DETECTED:');
      if (!hasGnbTitle) console.log('   • Scene title missing from GNB');
      if (articleHeaderCount > 0) console.log('   • Scene title still in content');
      if (hasHeaderWithBorder) console.log('   • Header element still exists');
      console.log();
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'logs/scene-title-removal-error.png' });
  } finally {
    await browser.close();
  }
}

testSceneTitleRemoval().catch(console.error);
