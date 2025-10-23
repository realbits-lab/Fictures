import { chromium } from '@playwright/test';

async function verifyLoadingUI() {
  console.log('Starting browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000/reading...');

  // Start navigation but don't wait for it to complete
  const navigationPromise = page.goto('http://localhost:3000/reading', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  // Quickly check for loading indicators
  await page.waitForTimeout(500);

  const hasLoadingIndicators = await page.evaluate(() => {
    const spinners = document.querySelectorAll('.animate-spin');
    const shimmers = document.querySelectorAll('.animate-shimmer');
    const pulses = document.querySelectorAll('.animate-pulse');

    return {
      hasSpinner: spinners.length > 0,
      hasShimmer: shimmers.length > 0,
      hasPulse: pulses.length > 0,
      total: spinners.length + shimmers.length + pulses.length
    };
  });

  console.log('\n=== LOADING UI CHECK ===');
  console.log(`Spinner animation: ${hasLoadingIndicators.hasSpinner ? '✅' : '❌'}`);
  console.log(`Shimmer animation: ${hasLoadingIndicators.hasShimmer ? '✅' : '❌'}`);
  console.log(`Pulse animation: ${hasLoadingIndicators.hasPulse ? '✅' : '❌'}`);
  console.log(`Total loading elements: ${hasLoadingIndicators.total}`);

  await navigationPromise;

  // Wait for images to fully load
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Check final state
  const finalState = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return {
      totalImages: images.length,
      loadedImages: images.filter(img => img.complete && img.naturalWidth > 0).length,
      brokenImages: images.filter(img => img.complete && img.naturalWidth === 0).length
    };
  });

  console.log('\n=== FINAL STATE ===');
  console.log(`Total images: ${finalState.totalImages}`);
  console.log(`Loaded images: ${finalState.loadedImages}`);
  console.log(`Broken images: ${finalState.brokenImages}`);

  if (finalState.brokenImages === 0) {
    console.log('\n✅ SUCCESS: All images loaded or have placeholders!');
  }

  // Take screenshot
  await page.screenshot({ path: 'logs/loading-ui-final.png', fullPage: true });
  console.log('\n📸 Screenshot saved to logs/loading-ui-final.png');

  console.log('\nBrowser will stay open for 20 seconds...');
  await page.waitForTimeout(20000);

  await browser.close();
  console.log('Verification complete!');
}

verifyLoadingUI().catch(console.error);
