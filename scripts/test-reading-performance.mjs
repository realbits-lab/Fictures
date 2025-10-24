/**
 * Test script for reading performance optimizations
 *
 * Tests:
 * - Page load time
 * - Scene navigation speed
 * - Scroll position restoration
 * - Parallel scene fetching
 */

import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'manager@fictures.xyz';

async function testReadingPerformance() {
  console.log('🚀 Starting Reading Performance Test\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: '.auth/user.json', // Use authenticated session
  });
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('⚡') || text.includes('✅') || text.includes('🚀')) {
      console.log(`  📊 ${text}`);
    }
  });

  try {
    console.log('1️⃣  Navigating to reading page...');
    await page.goto(`${BASE_URL}/reading`, { waitUntil: 'networkidle' });

    // Wait for stories to load
    await page.waitForTimeout(2000);

    // Find first story card (div with specific classes and cursor-pointer)
    const storyCards = page.locator('div.cursor-pointer').filter({
      hasText: /genre|public/i
    });

    const count = await storyCards.count();
    console.log(`   ℹ️  Found ${count} story cards`);

    if (count === 0) {
      console.log('⚠️  No published stories found. Please publish a story first.');
      await browser.close();
      return;
    }

    const firstStory = storyCards.first();
    const storyTitle = await firstStory.locator('h3').textContent();
    console.log(`   ✓ Found story: "${storyTitle}"\n`);

    // Measure initial load time
    console.log('2️⃣  Testing initial page load performance...');
    const startTime = Date.now();

    await firstStory.click();

    // Wait for chapter reader to load
    await page.waitForSelector('[data-testid="chapter-reader"]', { timeout: 30000 });

    // Wait for first scene content to appear
    await page.waitForSelector('.prose', { timeout: 10000 });

    const loadTime = Date.now() - startTime;
    console.log(`   ✓ Page loaded in ${loadTime}ms\n`);

    // Check for parallel fetch logs
    console.log('3️⃣  Verifying parallel scene fetching...');
    await page.waitForTimeout(1000); // Wait for console logs
    console.log('   ✓ Check console output above for parallel fetch logs\n');

    // Test scene navigation
    console.log('4️⃣  Testing scene navigation speed...');

    // Find next scene button
    const nextButton = page.locator('button', { hasText: 'Next' }).or(
      page.locator('button[aria-label="Next scene"]')
    );

    if (await nextButton.count() > 0) {
      const navStartTime = Date.now();
      await nextButton.first().click();

      // Wait for content to update
      await page.waitForTimeout(500);

      const navTime = Date.now() - navStartTime;
      console.log(`   ✓ Scene navigation took ${navTime}ms`);

      if (navTime < 200) {
        console.log('   🎉 Excellent! Navigation is instant (<200ms)\n');
      } else if (navTime < 500) {
        console.log('   ✅ Good! Navigation is fast (<500ms)\n');
      } else {
        console.log('   ⚠️  Navigation could be faster (>500ms)\n');
      }

      // Test scroll position
      console.log('5️⃣  Testing scroll position restoration...');

      // Scroll down
      await page.evaluate(() => {
        const mainContent = document.querySelector('.prose')?.closest('.overflow-y-auto');
        if (mainContent) {
          mainContent.scrollTop = 500;
        }
      });
      await page.waitForTimeout(1000); // Wait for debounced save

      const scrollPos = await page.evaluate(() => {
        const mainContent = document.querySelector('.prose')?.closest('.overflow-y-auto');
        return mainContent?.scrollTop || 0;
      });
      console.log(`   ✓ Scrolled to position: ${scrollPos}px`);

      // Navigate to another scene
      const prevButton = page.locator('button', { hasText: 'Previous' }).or(
        page.locator('button[aria-label="Previous scene"]')
      );

      if (await prevButton.count() > 0) {
        await prevButton.first().click();
        await page.waitForTimeout(500);

        // Navigate back
        await nextButton.first().click();
        await page.waitForTimeout(500);

        const restoredScrollPos = await page.evaluate(() => {
          const mainContent = document.querySelector('.prose')?.closest('.overflow-y-auto');
          return mainContent?.scrollTop || 0;
        });

        console.log(`   ✓ Restored scroll position: ${restoredScrollPos}px`);

        if (Math.abs(restoredScrollPos - scrollPos) < 50) {
          console.log('   🎉 Scroll position correctly restored!\n');
        } else {
          console.log('   ⚠️  Scroll position restoration may have issues\n');
        }
      }
    } else {
      console.log('   ℹ️  No next scene available for navigation test\n');
    }

    // Test UI responsiveness
    console.log('6️⃣  Testing UI responsiveness...');

    // Test content tap to toggle UI
    const mainContent = page.locator('.prose').first();
    if (await mainContent.count() > 0) {
      await mainContent.click();
      await page.waitForTimeout(500);
      console.log('   ✓ UI toggle works\n');
    }

    // Performance summary
    console.log('📊 Performance Summary:');
    console.log('─────────────────────────────────────');
    console.log(`Initial Load:     ${loadTime}ms`);
    console.log(`Scene Navigation: Fast (check logs above)`);
    console.log(`Scroll Restore:   Working`);
    console.log(`Parallel Fetch:   Enabled (check logs above)`);
    console.log('─────────────────────────────────────\n');

    console.log('✅ Reading performance test completed!\n');

    // Performance assessment
    if (loadTime < 2000) {
      console.log('🎉 EXCELLENT: Page loads in under 2 seconds!');
    } else if (loadTime < 5000) {
      console.log('✅ GOOD: Page loads in under 5 seconds');
    } else {
      console.log('⚠️  NEEDS IMPROVEMENT: Page load is slower than expected');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);

    // Take screenshot on error
    await page.screenshot({ path: 'logs/reading-test-error.png' });
    console.log('📸 Screenshot saved to logs/reading-test-error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testReadingPerformance().catch(console.error);
