/**
 * Test that bottom navigation bar stays visible during scrolling
 * Verifies it doesn't hide on both mobile and desktop
 */

import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

async function testBottomNavAlwaysVisible() {
  console.log('👁️  Testing Bottom Navigation Always Visible\n');

  const browser = await chromium.launch({ headless: false });

  try {
    // Test 1: Desktop viewport
    console.log('1️⃣  Testing DESKTOP viewport...');
    const desktopContext = await browser.newContext({
      storageState: '.auth/user.json',
      viewport: { width: 1920, height: 1080 },
    });

    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(`${BASE_URL}/reading`, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(2000);

    // Open first story
    const desktopStoryCards = desktopPage.locator('div.cursor-pointer').filter({
      hasText: /genre|public/i
    });

    if (await desktopStoryCards.count() === 0) {
      console.log('⚠️  No stories found');
      await browser.close();
      return;
    }

    const storyTitle = await desktopStoryCards.first().locator('h3').textContent();
    console.log(`   ✓ Opening story: "${storyTitle}"`);

    await desktopStoryCards.first().click();
    await desktopPage.waitForSelector('[data-testid="chapter-reader"]', { timeout: 30000 });
    await desktopPage.waitForSelector('.prose', { timeout: 10000 });
    await desktopPage.waitForTimeout(1000);

    // Check bottom nav initial visibility
    const desktopBottomNav = desktopPage.locator('div.fixed.bottom-0').last();
    const initialVisible = await desktopBottomNav.isVisible();
    console.log(`   ✓ Bottom nav initially visible: ${initialVisible}`);

    // Scroll down significantly
    console.log('   ✓ Scrolling down...');
    await desktopPage.evaluate(() => {
      const mainContent = document.querySelector('.prose')?.closest('.overflow-y-auto');
      if (mainContent) {
        mainContent.scrollTop = 500;
      }
    });
    await desktopPage.waitForTimeout(1000);

    // Check if still visible after scroll
    const afterScrollVisible = await desktopBottomNav.isVisible();
    const afterScrollBox = await desktopBottomNav.boundingBox();

    console.log(`   ✓ Bottom nav visible after scroll: ${afterScrollVisible}`);
    if (afterScrollBox) {
      console.log(`   ✓ Position: y=${afterScrollBox.y}, height=${afterScrollBox.height}`);
    }

    // Test buttons are clickable
    const nextButton = desktopPage.locator('button[aria-label="Next scene"]');
    const isClickable = await nextButton.isEnabled();
    console.log(`   ✓ Next button clickable: ${isClickable}`);

    await desktopPage.screenshot({ path: 'logs/desktop-bottom-nav-scroll.png' });
    console.log(`   📸 Screenshot: logs/desktop-bottom-nav-scroll.png\n`);

    await desktopContext.close();

    // Test 2: Mobile viewport
    console.log('2️⃣  Testing MOBILE viewport...');
    const mobileContext = await browser.newContext({
      storageState: '.auth/user.json',
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    });

    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${BASE_URL}/reading`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(2000);

    const mobileStoryCards = mobilePage.locator('div.cursor-pointer').filter({
      hasText: /genre|public/i
    });

    await mobileStoryCards.first().click();
    await mobilePage.waitForSelector('[data-testid="chapter-reader"]', { timeout: 30000 });
    await mobilePage.waitForSelector('.prose', { timeout: 10000 });
    await mobilePage.waitForTimeout(1000);

    // Check bottom nav initial visibility
    const mobileBottomNav = mobilePage.locator('div.fixed.bottom-0').last();
    const mobileInitialVisible = await mobileBottomNav.isVisible();
    console.log(`   ✓ Bottom nav initially visible: ${mobileInitialVisible}`);

    // Scroll down
    console.log('   ✓ Scrolling down...');
    await mobilePage.evaluate(() => {
      const mainContent = document.querySelector('.prose')?.closest('.overflow-y-auto');
      if (mainContent) {
        mainContent.scrollTop = 300;
      }
    });
    await mobilePage.waitForTimeout(1000);

    // Check if still visible after scroll
    const mobileAfterScrollVisible = await mobileBottomNav.isVisible();
    const mobileAfterScrollBox = await mobileBottomNav.boundingBox();

    console.log(`   ✓ Bottom nav visible after scroll: ${mobileAfterScrollVisible}`);
    if (mobileAfterScrollBox) {
      console.log(`   ✓ Position: y=${mobileAfterScrollBox.y}, height=${mobileAfterScrollBox.height}`);
    }

    await mobilePage.screenshot({ path: 'logs/mobile-bottom-nav-scroll.png' });
    console.log(`   📸 Screenshot: logs/mobile-bottom-nav-scroll.png\n`);

    await mobileContext.close();

    // Summary
    console.log('📊 Test Summary:');
    console.log('─────────────────────────────────────');
    console.log(`Desktop - Before scroll: ${initialVisible ? '✅ Visible' : '❌ Hidden'}`);
    console.log(`Desktop - After scroll:  ${afterScrollVisible ? '✅ Visible' : '❌ Hidden'}`);
    console.log(`Mobile - Before scroll:  ${mobileInitialVisible ? '✅ Visible' : '❌ Hidden'}`);
    console.log(`Mobile - After scroll:   ${mobileAfterScrollVisible ? '✅ Visible' : '❌ Hidden'}`);
    console.log('─────────────────────────────────────\n');

    const allVisible = initialVisible && afterScrollVisible && mobileInitialVisible && mobileAfterScrollVisible;

    if (allVisible) {
      console.log('🎉 SUCCESS: Bottom navigation always visible!');
      console.log('   ✅ Desktop: Stays visible during scroll');
      console.log('   ✅ Mobile: Stays visible during scroll');
      console.log('   ✅ Consistent behavior across all devices\n');
    } else {
      console.log('⚠️  WARNING: Bottom navigation hiding detected');
      if (!afterScrollVisible) console.log('   ❌ Desktop: Hides during scroll');
      if (!mobileAfterScrollVisible) console.log('   ❌ Mobile: Hides during scroll');
      console.log();
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testBottomNavAlwaysVisible().catch(console.error);
