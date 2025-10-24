import { chromium } from '@playwright/test';

async function testLandingPerformance() {
  console.log('Testing landing page performance...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Starting performance measurement...');
    
    // Measure time to navigate and see content
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    const navigationTime = Date.now() - startTime;
    console.log(`✓ Page loaded in: ${navigationTime}ms`);
    
    // Check if Start Reading Today is immediately visible (no loading skeleton)
    const headerVisible = await page.locator('h1:has-text("Start Reading Today")').isVisible();
    console.log(`✓ Header immediately visible: ${headerVisible}`);
    
    // Check if story card is immediately visible
    const storyVisible = await page.locator('text=Jupiter').isVisible();
    console.log(`✓ Story immediately visible: ${storyVisible}`);
    
    // Check if there's NO loading skeleton
    const hasLoadingSkeleton = await page.locator('.animate-pulse').count();
    console.log(`✓ Loading skeleton present: ${hasLoadingSkeleton > 0 ? 'YES (BAD)' : 'NO (GOOD!)'}`);
    
    // Take screenshot
    await page.screenshot({ path: 'logs/landing-page-performance.png', fullPage: true });
    
    console.log('\n=== PERFORMANCE RESULTS ===');
    console.log(`Total load time: ${navigationTime}ms`);
    console.log(`No loading delay: ${!hasLoadingSkeleton ? '✓ YES' : '✗ NO'}`);
    console.log(`Content immediately visible: ${headerVisible && storyVisible ? '✓ YES' : '✗ NO'}`);
    
    if (!hasLoadingSkeleton && navigationTime < 2000) {
      console.log('\n✓✓✓ EXCELLENT PERFORMANCE! ✓✓✓');
      console.log('Featured story loads instantly with no skeleton!');
    }
    
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testLandingPerformance();
