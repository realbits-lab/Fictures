import { chromium } from '@playwright/test';

async function testFullCardClick() {
  console.log('🧪 Testing full metric card clickability...\n');

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
    await page.waitForTimeout(2000);
    console.log('✅ Page loaded');

    // Test 1: Click on the number
    console.log('\n🎯 Test 1: Clicking on metric NUMBER...');
    const firstNumber = page.locator('.text-2xl.font-bold').first();
    await firstNumber.click();
    await page.waitForTimeout(500);
    let popoverVisible = await page.locator('[class*="animate-in"]').isVisible();
    console.log(`   ${popoverVisible ? '✅' : '❌'} Popover visible after clicking number`);
    await page.screenshot({ path: 'logs/click-on-number.png' });

    // Close popover
    await page.locator('body').click({ position: { x: 0, y: 0 } });
    await page.waitForTimeout(500);

    // Test 2: Click on the label
    console.log('\n🎯 Test 2: Clicking on metric LABEL...');
    const firstLabel = page.locator('text=Active Today').first();
    await firstLabel.click();
    await page.waitForTimeout(500);
    popoverVisible = await page.locator('[class*="animate-in"]').isVisible();
    console.log(`   ${popoverVisible ? '✅' : '❌'} Popover visible after clicking label`);
    await page.screenshot({ path: 'logs/click-on-label.png' });

    // Close popover
    await page.locator('body').click({ position: { x: 0, y: 0 } });
    await page.waitForTimeout(500);

    // Test 3: Click on the help icon
    console.log('\n🎯 Test 3: Clicking on help ICON...');
    const helpIcon = page.locator('svg').filter({ hasText: '' }).first();
    await helpIcon.click();
    await page.waitForTimeout(500);
    popoverVisible = await page.locator('[class*="animate-in"]').isVisible();
    console.log(`   ${popoverVisible ? '✅' : '❌'} Popover visible after clicking icon`);
    await page.screenshot({ path: 'logs/click-on-icon.png' });

    console.log('\n✅ All tests completed!');
    console.log('\n📸 Screenshots saved:');
    console.log('   - logs/click-on-number.png');
    console.log('   - logs/click-on-label.png');
    console.log('   - logs/click-on-icon.png');

    // Keep browser open for inspection
    console.log('\n⏸️  Browser will stay open for 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'logs/test-error.png' });
  } finally {
    await browser.close();
    console.log('\n👋 Browser closed');
  }
}

testFullCardClick();
