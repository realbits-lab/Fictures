import { chromium } from '@playwright/test';

async function testMetricHelpIcons() {
  console.log('🧪 Testing metric help icons on /community page...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to community page
    console.log('📍 Navigating to /community...');
    await page.goto('http://localhost:3000/community');
    await page.waitForLoadState('domcontentloaded');
    console.log('✅ Page loaded');

    // Wait for metrics to load
    await page.waitForTimeout(3000);

    // Take initial screenshot
    console.log('\n📸 Taking initial screenshot...');
    await page.screenshot({ path: 'logs/community-before-click.png', fullPage: false });
    console.log('✅ Screenshot saved');

    // Look for help icon buttons
    console.log('\n🔍 Looking for help icon buttons...');
    const helpButtons = await page.locator('button svg').count();
    console.log(`📊 Found ${helpButtons} SVG elements in buttons`);

    // Try clicking on a help button
    const firstHelpButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    const buttonExists = await firstHelpButton.count();
    console.log(`🎯 First help button exists: ${buttonExists > 0 ? 'Yes' : 'No'}`);

    if (buttonExists > 0) {
      console.log('\n🖱️  Clicking help icon...');
      await firstHelpButton.click();
      await page.waitForTimeout(1000);

      // Take screenshot after click
      console.log('📸 Taking screenshot after click...');
      await page.screenshot({ path: 'logs/community-after-click.png', fullPage: false });
      console.log('✅ Screenshot saved to logs/community-after-click.png');

      // Check if popover is visible
      const popoverVisible = await page.locator('[class*="animate-in"]').isVisible();
      console.log(`✅ Popover visible: ${popoverVisible ? 'Yes ✓' : 'No ✗'}`);
    }

    console.log('\n✅ Test completed! Check screenshots in logs/ directory');
    console.log('   - logs/community-before-click.png');
    console.log('   - logs/community-after-click.png');

    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser will stay open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'logs/community-error.png' });
  } finally {
    await browser.close();
    console.log('\n👋 Browser closed');
  }
}

testMetricHelpIcons();
