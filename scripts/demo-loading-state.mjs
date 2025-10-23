import { chromium } from '@playwright/test';

async function demoLoadingState() {
  console.log('🎬 Starting loading state demo...\n');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  // Create CDP session for network throttling
  const page = await context.newPage();
  const client = await context.newCDPSession(page);

  // Set extremely slow network to see loading state
  console.log('🐌 Setting slow network conditions (10 KB/s, 2000ms latency)...');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 10 * 1024,  // 10 KB/s - very slow
    uploadThroughput: 10 * 1024,
    latency: 2000  // 2 second latency
  });

  console.log('📍 Navigating to http://localhost:3000/reading...\n');
  console.log('👀 Watch for:');
  console.log('   - Gray skeleton with shimmer effect');
  console.log('   - Spinning loader icon in the center');
  console.log('   - Smooth fade-in when image loads\n');

  await page.goto('http://localhost:3000/reading', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  // Capture loading state
  console.log('📸 Capturing loading state (2 seconds)...');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'logs/demo-loading-active.png', fullPage: false });
  console.log('✅ Screenshot saved: logs/demo-loading-active.png');

  // Wait for images to load
  console.log('\n⏳ Waiting for images to load...');
  await page.waitForLoadState('networkidle', { timeout: 60000 });

  // Capture loaded state
  await page.screenshot({ path: 'logs/demo-loading-complete.png', fullPage: false });
  console.log('✅ Screenshot saved: logs/demo-loading-complete.png');

  // Check what we got
  const analysis = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const svgPlaceholders = document.querySelectorAll('svg[width="120"][height="120"]');

    return {
      totalImages: images.length,
      loadedImages: images.filter(img => img.complete && img.naturalWidth > 0).length,
      svgPlaceholders: svgPlaceholders.length
    };
  });

  console.log('\n=== DEMO RESULTS ===');
  console.log(`📊 Total images: ${analysis.totalImages}`);
  console.log(`✅ Loaded images: ${analysis.loadedImages}`);
  console.log(`🎨 SVG placeholders: ${analysis.svgPlaceholders}`);

  console.log('\n✨ Loading state demo complete!');
  console.log('🔍 Check the screenshots to see:');
  console.log('   1. Shimmer + spinner during load (demo-loading-active.png)');
  console.log('   2. Final loaded state (demo-loading-complete.png)');

  console.log('\n⏸️  Browser will stay open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);

  await browser.close();
}

demoLoadingState().catch(console.error);
