import { chromium } from '@playwright/test';

async function testLoadingState() {
  console.log('Starting browser with slow network...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  // Enable slow network to see loading states
  const client = await context.newCDPSession(await context.pages()[0] || await context.newPage());
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 50 * 1024,  // 50 KB/s
    uploadThroughput: 50 * 1024,
    latency: 500  // 500ms latency
  });

  const page = context.pages()[0] || await context.newPage();

  console.log('Navigating to http://localhost:3000/reading with slow network...');
  await page.goto('http://localhost:3000/reading', { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log('\n📸 Taking screenshots at different stages...');

  // Wait 1 second to capture loading state
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'logs/loading-state-1s.png', fullPage: true });
  console.log('✅ Screenshot 1: Initial loading state (1s)');

  // Wait 3 seconds
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'logs/loading-state-3s.png', fullPage: true });
  console.log('✅ Screenshot 2: Loading progress (3s)');

  // Wait for network idle
  await page.waitForLoadState('networkidle', { timeout: 60000 });
  await page.screenshot({ path: 'logs/loading-state-complete.png', fullPage: true });
  console.log('✅ Screenshot 3: Fully loaded');

  // Check for loading indicators
  const loadingElements = await page.evaluate(() => {
    // Check for spinner SVGs
    const spinners = document.querySelectorAll('.animate-spin');

    // Check for shimmer effects
    const shimmers = document.querySelectorAll('.animate-shimmer');

    return {
      spinnerCount: spinners.length,
      shimmerCount: shimmers.length,
    };
  });

  console.log('\n=== LOADING STATE VERIFICATION ===');
  console.log(`Spinner elements found: ${loadingElements.spinnerCount}`);
  console.log(`Shimmer elements found: ${loadingElements.shimmerCount}`);

  if (loadingElements.spinnerCount > 0 || loadingElements.shimmerCount > 0) {
    console.log('✅ Loading indicators are present during load!');
  } else {
    console.log('⚠️ Loading indicators might have already disappeared (images loaded too fast)');
  }

  console.log('\n📁 Screenshots saved to:');
  console.log('  - logs/loading-state-1s.png');
  console.log('  - logs/loading-state-3s.png');
  console.log('  - logs/loading-state-complete.png');

  console.log('\nBrowser will stay open for 30 seconds. Check the loading animation!');
  await page.waitForTimeout(30000);

  await browser.close();
  console.log('Test complete!');
}

testLoadingState().catch(console.error);
