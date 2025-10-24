/**
 * Test scroll boundary behavior
 * Verifies that GNB doesn't flicker when scrolling at top/bottom boundaries
 */

import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

async function testScrollBoundary() {
  console.log('🔄 Testing Scroll Boundary Behavior\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: '.auth/user.json',
  });

  const page = await context.newPage();

  // Track UI visibility changes
  let uiToggleCount = 0;
  let lastToggleTime = Date.now();
  const toggleEvents = [];

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Immersive mode') || text.includes('Near top')) {
      const now = Date.now();
      const timeSinceLastToggle = now - lastToggleTime;
      uiToggleCount++;
      toggleEvents.push({
        message: text,
        timeSinceLastToggle,
        timestamp: now
      });
      lastToggleTime = now;
      console.log(`   📊 ${text} (${timeSinceLastToggle}ms since last toggle)`);
    }
  });

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

    await storyCards.first().click();
    await page.waitForSelector('[data-testid="chapter-reader"]', { timeout: 30000 });
    await page.waitForSelector('.prose', { timeout: 10000 });
    await page.waitForTimeout(1000);

    console.log('   ✓ Story opened\n');

    // Reset counters
    uiToggleCount = 0;
    toggleEvents.length = 0;
    lastToggleTime = Date.now();

    console.log('2️⃣  Testing scroll to bottom...');

    // Scroll down to middle first
    await page.evaluate(() => {
      const mainContent = document.querySelector('.prose')?.closest('.overflow-y-auto');
      if (mainContent) {
        mainContent.scrollTop = 300;
      }
    });
    await page.waitForTimeout(500);

    console.log('   ✓ Scrolled to middle\n');

    // Reset counters again
    uiToggleCount = 0;
    toggleEvents.length = 0;

    console.log('3️⃣  Scrolling to bottom boundary...');

    // Scroll to bottom
    await page.evaluate(() => {
      const mainContent = document.querySelector('.prose')?.closest('.overflow-y-auto');
      if (mainContent) {
        mainContent.scrollTop = mainContent.scrollHeight;
      }
    });
    await page.waitForTimeout(1000);

    const togglesAtBottom = uiToggleCount;
    console.log(`   ✓ Scrolled to bottom (${togglesAtBottom} UI toggles)\n`);

    console.log('4️⃣  Testing repeated scroll attempts at bottom...');

    // Reset counter for boundary test
    const boundaryStartCount = toggleEvents.length;

    // Try scrolling at bottom multiple times (simulating user trying to scroll further)
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        const mainContent = document.querySelector('.prose')?.closest('.overflow-y-auto');
        if (mainContent) {
          mainContent.scrollTop = mainContent.scrollHeight + 100; // Try to scroll beyond
        }
      });
      await page.waitForTimeout(300);
    }

    const boundaryToggles = toggleEvents.length - boundaryStartCount;
    console.log(`   ✓ Attempted 5 scroll actions at bottom (${boundaryToggles} UI toggles)\n`);

    console.log('5️⃣  Scrolling back to top...');

    // Reset counter for upward scroll test
    const upwardStartCount = toggleEvents.length;

    await page.evaluate(() => {
      const mainContent = document.querySelector('.prose')?.closest('.overflow-y-auto');
      if (mainContent) {
        mainContent.scrollTop = 0;
      }
    });
    await page.waitForTimeout(1000);

    const upwardToggles = toggleEvents.length - upwardStartCount;
    console.log(`   ✓ Scrolled to top (${upwardToggles} UI toggles)\n`);

    console.log('6️⃣  Testing repeated scroll attempts at top...');

    // Reset counter for top boundary test
    const topBoundaryStartCount = toggleEvents.length;

    // Try scrolling at top multiple times
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        const mainContent = document.querySelector('.prose')?.closest('.overflow-y-auto');
        if (mainContent) {
          mainContent.scrollTop = -100; // Try to scroll above top
        }
      });
      await page.waitForTimeout(300);
    }

    const topBoundaryToggles = toggleEvents.length - topBoundaryStartCount;
    console.log(`   ✓ Attempted 5 scroll actions at top (${topBoundaryToggles} UI toggles)\n`);

    // Check for rapid toggling (toggles within 300ms of each other)
    const rapidToggles = toggleEvents.filter(e => e.timeSinceLastToggle < 300).length;

    // Results
    console.log('📊 Test Results:');
    console.log('─────────────────────────────────────');
    console.log(`Total UI toggles: ${toggleEvents.length}`);
    console.log(`Toggles at bottom boundary: ${boundaryToggles}`);
    console.log(`Toggles at top boundary: ${topBoundaryToggles}`);
    console.log(`Rapid toggles (<300ms apart): ${rapidToggles}`);
    console.log('─────────────────────────────────────\n');

    // Evaluation
    const hasFlickering = boundaryToggles > 1 || topBoundaryToggles > 1 || rapidToggles > 2;

    if (!hasFlickering) {
      console.log('✅ SUCCESS: No flickering at boundaries!');
      console.log('   • Bottom boundary: No rapid UI toggling');
      console.log('   • Top boundary: No rapid UI toggling');
      console.log('   • Smooth transitions throughout\n');
    } else {
      console.log('⚠️  WARNING: Some flickering detected');
      console.log(`   • Bottom boundary toggles: ${boundaryToggles > 1 ? '⚠️  Multiple' : '✅ Single/None'}`);
      console.log(`   • Top boundary toggles: ${topBoundaryToggles > 1 ? '⚠️  Multiple' : '✅ Single/None'}`);
      console.log(`   • Rapid toggles: ${rapidToggles > 2 ? '⚠️  Excessive' : '✅ Normal'}\n`);
    }

    // Show toggle timeline
    if (toggleEvents.length > 0) {
      console.log('📅 Toggle Timeline:');
      toggleEvents.forEach((event, idx) => {
        console.log(`   ${idx + 1}. [+${event.timeSinceLastToggle}ms] ${event.message}`);
      });
      console.log();
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'logs/scroll-boundary-error.png' });
  } finally {
    await browser.close();
  }
}

testScrollBoundary().catch(console.error);
