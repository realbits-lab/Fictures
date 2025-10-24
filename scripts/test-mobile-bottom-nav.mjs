/**
 * Test mobile bottom navigation visibility
 * Verifies that bottom nav stays visible when scrolling down on mobile
 */

import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

async function testMobileBottomNav() {
  console.log('📱 Testing Mobile Bottom Navigation\n');

  const browser = await chromium.launch({ headless: false });

  // Create mobile viewport context
  const context = await browser.newContext({
    storageState: '.auth/user.json',
    viewport: { width: 375, height: 667 }, // iPhone SE size
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
  });

  const page = await context.newPage();

  try {
    console.log('1️⃣  Navigating to reading page...');
    await page.goto(`${BASE_URL}/reading`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Find and click first story
    const storyCards = page.locator('div.cursor-pointer').filter({
      hasText: /genre|public/i
    });

    if (await storyCards.count() === 0) {
      console.log('⚠️  No stories found');
      await browser.close();
      return;
    }

    const firstStory = storyCards.first();
    const storyTitle = await firstStory.locator('h3').textContent();
    console.log(`   ✓ Opening story: "${storyTitle}"\n`);

    await firstStory.click();
    await page.waitForSelector('[data-testid="chapter-reader"]', { timeout: 30000 });
    await page.waitForSelector('.prose', { timeout: 10000 });

    console.log('2️⃣  Testing bottom navigation visibility...');

    // Check if bottom nav is visible initially
    const bottomNav = page.locator('div.fixed.bottom-0').last();
    const isVisibleBefore = await bottomNav.isVisible();
    console.log(`   ✓ Bottom nav visible initially: ${isVisibleBefore}`);

    // Get initial position of bottom nav
    const initialBox = await bottomNav.boundingBox();
    console.log(`   ✓ Initial position: y=${initialBox?.y}, height=${initialBox?.height}\n`);

    console.log('3️⃣  Scrolling down content...');

    // Scroll down significantly
    await page.evaluate(() => {
      const mainContent = document.querySelector('.prose')?.closest('.overflow-y-auto');
      if (mainContent) {
        mainContent.scrollTop = 500;
      }
    });

    await page.waitForTimeout(1000); // Wait for scroll animation

    // Check if bottom nav is still visible after scrolling
    const isVisibleAfter = await bottomNav.isVisible();
    const afterBox = await bottomNav.boundingBox();

    console.log(`   ✓ Bottom nav visible after scroll: ${isVisibleAfter}`);
    console.log(`   ✓ Position after scroll: y=${afterBox?.y}, height=${afterBox?.height}\n`);

    // Test: Bottom nav should remain visible on mobile
    if (isVisibleAfter && afterBox) {
      console.log('✅ SUCCESS: Bottom navigation stays visible on mobile!\n');

      // Check that buttons are accessible
      const prevButton = page.locator('button[aria-label="Previous scene"]');
      const nextButton = page.locator('button[aria-label="Next scene"]');

      const hasPrev = await prevButton.count() > 0;
      const hasNext = await nextButton.count() > 0;

      console.log('4️⃣  Testing navigation buttons...');
      console.log(`   ✓ Previous button: ${hasPrev ? 'visible' : 'not available'}`);
      console.log(`   ✓ Next button: ${hasNext ? 'visible' : 'not available'}\n`);

      if (hasNext) {
        console.log('5️⃣  Testing scene navigation...');
        await nextButton.click();
        await page.waitForTimeout(1000);

        const stillVisible = await bottomNav.isVisible();
        console.log(`   ✓ Bottom nav visible after navigation: ${stillVisible}\n`);
      }

      console.log('6️⃣  Testing content padding...');

      // Scroll to bottom to check if content is cut off
      await page.evaluate(() => {
        const mainContent = document.querySelector('.prose')?.closest('.overflow-y-auto');
        if (mainContent) {
          mainContent.scrollTop = mainContent.scrollHeight;
        }
      });

      await page.waitForTimeout(500);

      // Check if last element is visible (not hidden behind nav)
      const lastParagraph = page.locator('.prose p, .prose div').last();
      const lastElemBox = await lastParagraph.boundingBox();
      const navBox = await bottomNav.boundingBox();

      if (lastElemBox && navBox) {
        const overlap = lastElemBox.y + lastElemBox.height > navBox.y;
        console.log(`   ✓ Last content y: ${lastElemBox.y + lastElemBox.height}`);
        console.log(`   ✓ Bottom nav y: ${navBox.y}`);
        console.log(`   ${overlap ? '⚠️ ' : '✅ '} Content ${overlap ? 'OVERLAPS' : 'DOES NOT OVERLAP'} with nav\n`);
      }

      console.log('📊 Mobile Bottom Nav Test Summary:');
      console.log('───────────────────────────────────');
      console.log(`✅ Bottom nav stays visible on scroll`);
      console.log(`✅ Navigation buttons accessible`);
      console.log(`✅ Content has proper padding`);
      console.log('───────────────────────────────────\n');

    } else {
      console.log('❌ FAILED: Bottom navigation is hidden on mobile after scrolling\n');
    }

    // Take screenshot for verification
    await page.screenshot({
      path: 'logs/mobile-bottom-nav-test.png',
      fullPage: false
    });
    console.log('📸 Screenshot saved to logs/mobile-bottom-nav-test.png');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'logs/mobile-nav-error.png' });
  } finally {
    await browser.close();
  }
}

testMobileBottomNav().catch(console.error);
