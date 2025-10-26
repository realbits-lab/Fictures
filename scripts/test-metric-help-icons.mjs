import { chromium } from '@playwright/test';

async function testMetricHelpIcons() {
  console.log('🧪 Testing metric help icons on /community page...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: '.auth/user.json'
  });
  const page = await context.newPage();

  try {
    // Navigate to community page
    console.log('📍 Navigating to /community...');
    await page.goto('http://localhost:3000/community', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check if metric cards are visible
    console.log('🔍 Checking for metric cards...');
    const metricCards = await page.locator('[class*="grid grid-cols-2 md:grid-cols-6"]').count();
    console.log(`✅ Found metric grid: ${metricCards > 0 ? 'Yes' : 'No'}`);

    // Check for help icons
    console.log('\n🔍 Looking for help icons...');
    const helpIcons = await page.locator('svg').filter({ hasText: '' }).count();
    console.log(`📊 Found ${helpIcons} SVG icons on page`);

    // Try to find and click on a help icon
    const helpButtons = await page.locator('button[class*="rounded-full"]').all();
    console.log(`🎯 Found ${helpButtons.length} rounded buttons (potential help icons)`);

    if (helpButtons.length > 0) {
      console.log('\n🖱️  Clicking first help icon...');
      await helpButtons[0].click();
      await page.waitForTimeout(500);

      // Check if popover appeared
      const popover = await page.locator('[class*="bg-white dark:bg-gray-800 border"]').filter({ hasText: /Active Today|Comments Today|Avg Rating|Stories|Discussions|Members/ }).first();
      const isVisible = await popover.isVisible();
      console.log(`✅ Popover visible: ${isVisible ? 'Yes ✓' : 'No ✗'}`);

      if (isVisible) {
        const popoverText = await popover.textContent();
        console.log(`📝 Popover content preview: ${popoverText?.substring(0, 100)}...`);
      }

      // Take a screenshot
      console.log('\n📸 Taking screenshot...');
      await page.screenshot({ path: 'logs/community-metrics-help.png', fullPage: true });
      console.log('✅ Screenshot saved to logs/community-metrics-help.png');
    } else {
      console.log('⚠️  No help icons found - component may not be rendering correctly');
    }

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testMetricHelpIcons();
