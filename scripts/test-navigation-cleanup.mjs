/**
 * Test that redundant in-content navigation was removed
 * Verifies only sticky bottom navigation exists
 */

import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

async function testNavigationCleanup() {
  console.log('🧹 Testing Navigation Cleanup\n');

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

    console.log('2️⃣  Checking for navigation elements...');

    // Check for sticky bottom navigation (should exist)
    const bottomNav = page.locator('div.fixed.bottom-0').last();
    const hasBottomNav = await bottomNav.isVisible();

    if (hasBottomNav) {
      console.log('   ✅ Sticky bottom navigation: FOUND');

      // Check components
      const prevButton = page.locator('button[aria-label="Previous scene"]');
      const nextButton = page.locator('button[aria-label="Next scene"]');
      const sceneCounter = page.locator('.text-xs.text-gray-600.dark\\:text-gray-400.font-medium').filter({
        hasText: /\d+ \/ \d+/
      });

      const hasPrev = await prevButton.count() > 0;
      const hasNext = await nextButton.count() > 0;
      const hasCounter = await sceneCounter.count() > 0;

      console.log(`   ✅ Previous button: ${hasPrev ? 'FOUND' : 'NOT FOUND'}`);
      console.log(`   ✅ Next button: ${hasNext ? 'FOUND' : 'NOT FOUND'}`);
      console.log(`   ✅ Scene counter: ${hasCounter ? 'FOUND' : 'NOT FOUND'}`);

      if (hasCounter) {
        const counterText = await sceneCounter.first().textContent();
        console.log(`   ✅ Counter shows: "${counterText}"`);
      }
    } else {
      console.log('   ❌ Sticky bottom navigation: NOT FOUND');
    }

    console.log();

    // Check for in-content navigation (should NOT exist)
    console.log('3️⃣  Checking for redundant in-content navigation...');

    // Look for navigation buttons within the article/content area
    const articleNav = page.locator('article').locator('div.mt-12.pt-6.border-t').locator('button');
    const articleNavCount = await articleNav.count();

    if (articleNavCount > 0) {
      console.log(`   ❌ Found ${articleNavCount} navigation buttons in content area`);
      console.log('   ⚠️  Redundant navigation still exists!');

      // Get button text for debugging
      const buttonTexts = await articleNav.allTextContents();
      console.log(`   Button texts: ${buttonTexts.join(', ')}`);
    } else {
      console.log('   ✅ No redundant navigation buttons in content area');
    }

    // Check for scene counter text in content (e.g., "Scene 1 of 5")
    const inContentCounter = page.locator('.prose').locator('text=/Scene \\d+ of \\d+/');
    const hasInContentCounter = await inContentCounter.count() > 0;

    if (hasInContentCounter) {
      console.log('   ❌ Found scene counter in content area');
      console.log('   ⚠️  Redundant counter still exists!');
    } else {
      console.log('   ✅ No redundant scene counter in content area');
    }

    console.log();

    // Scroll to check if navigation appears at bottom of content
    console.log('4️⃣  Scrolling to bottom of content...');

    await page.evaluate(() => {
      const mainContent = document.querySelector('.prose')?.closest('.overflow-y-auto');
      if (mainContent) {
        mainContent.scrollTop = mainContent.scrollHeight;
      }
    });
    await page.waitForTimeout(1000);

    // Check again for in-content navigation after scrolling
    const articleNavAfterScroll = page.locator('article').locator('div.mt-12.pt-6.border-t').locator('button');
    const articleNavAfterScrollCount = await articleNavAfterScroll.count();

    if (articleNavAfterScrollCount > 0) {
      console.log(`   ❌ Found ${articleNavAfterScrollCount} navigation buttons at bottom`);
    } else {
      console.log('   ✅ No navigation buttons at bottom of content');
    }

    // Verify sticky nav is still visible
    const bottomNavStillVisible = await bottomNav.isVisible();
    console.log(`   ✅ Sticky bottom nav still visible: ${bottomNavStillVisible}`);

    console.log();

    // Summary
    console.log('📊 Test Summary:');
    console.log('─────────────────────────────────────');
    console.log(`Sticky Bottom Navigation: ${hasBottomNav ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`In-Content Navigation: ${articleNavCount === 0 ? '✅ REMOVED' : '❌ STILL EXISTS'}`);
    console.log(`In-Content Counter: ${!hasInContentCounter ? '✅ REMOVED' : '❌ STILL EXISTS'}`);
    console.log('─────────────────────────────────────\n');

    if (hasBottomNav && articleNavCount === 0 && !hasInContentCounter) {
      console.log('🎉 SUCCESS: Navigation cleaned up correctly!');
      console.log('   • Sticky bottom navigation: Present');
      console.log('   • Redundant in-content navigation: Removed');
      console.log('   • Clean reading experience maintained\n');
    } else {
      console.log('⚠️  ISSUES DETECTED:');
      if (!hasBottomNav) console.log('   • Sticky bottom navigation missing');
      if (articleNavCount > 0) console.log('   • Redundant navigation still present');
      if (hasInContentCounter) console.log('   • Redundant counter still present');
      console.log();
    }

    // Take screenshot
    await page.screenshot({
      path: 'logs/navigation-cleanup-test.png',
      fullPage: false
    });
    console.log('📸 Screenshot saved to logs/navigation-cleanup-test.png');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'logs/navigation-cleanup-error.png' });
  } finally {
    await browser.close();
  }
}

testNavigationCleanup().catch(console.error);
