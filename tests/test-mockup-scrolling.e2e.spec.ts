import { test, expect } from '@playwright/test';

/**
 * Test scrolling on mockup page to verify fix before applying to real page
 */

test('Test mockup page independent scrolling', async ({ page }) => {
  test.setTimeout(60000);

  console.log('🔍 Testing mockup page scrolling...');

  // Navigate to mockup page
  await page.goto('http://localhost:3000/test-scrolling');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  console.log('✅ On mockup page');

  // Find the three panels by their background colors
  const leftPanel = page.locator('div.flex-1.min-h-0.pr-2.overflow-y-auto.bg-red-50').first();
  const middlePanel = page.locator('div.flex-1.min-h-0.px-2.overflow-y-auto.bg-green-50').first();
  const rightPanel = page.locator('div.flex-1.min-h-0.pl-2.overflow-y-auto.bg-blue-50').first();

  // Verify panels exist
  await expect(leftPanel).toBeVisible();
  await expect(middlePanel).toBeVisible();
  await expect(rightPanel).toBeVisible();

  console.log('✅ All three panels visible');

  // Function to get scroll positions
  async function getScrollPositions() {
    const left = await leftPanel.evaluate(el => el.scrollTop);
    const middle = await middlePanel.evaluate(el => el.scrollTop);
    const right = await rightPanel.evaluate(el => el.scrollTop);
    return { left, middle, right };
  }

  const initial = await getScrollPositions();
  console.log('\n📊 Initial scroll positions:', initial);

  // Test 1: Programmatically scroll LEFT panel
  console.log('\n🧪 Test 1: Programmatically scrolling LEFT panel...');
  await leftPanel.evaluate(el => { el.scrollTop = 500; });
  await page.waitForTimeout(300);

  const afterLeft = await getScrollPositions();
  console.log('After left scroll:', afterLeft);

  if (afterLeft.left === 500 && afterLeft.middle === 0 && afterLeft.right === 0) {
    console.log('✅ LEFT panel scrolled independently!');
    expect(afterLeft.left).toBe(500);
    expect(afterLeft.middle).toBe(0);
    expect(afterLeft.right).toBe(0);
  } else {
    console.log('❌ LEFT panel scroll failed');
    throw new Error(`Left panel: expected 500, got ${afterLeft.left}`);
  }

  // Reset
  await leftPanel.evaluate(el => { el.scrollTop = 0; });
  await middlePanel.evaluate(el => { el.scrollTop = 0; });
  await rightPanel.evaluate(el => { el.scrollTop = 0; });
  await page.waitForTimeout(300);

  // Test 2: Programmatically scroll MIDDLE panel
  console.log('\n🧪 Test 2: Programmatically scrolling MIDDLE panel...');
  await middlePanel.evaluate(el => { el.scrollTop = 500; });
  await page.waitForTimeout(300);

  const afterMiddle = await getScrollPositions();
  console.log('After middle scroll:', afterMiddle);

  if (afterMiddle.left === 0 && afterMiddle.middle === 500 && afterMiddle.right === 0) {
    console.log('✅ MIDDLE panel scrolled independently!');
    expect(afterMiddle.left).toBe(0);
    expect(afterMiddle.middle).toBe(500);
    expect(afterMiddle.right).toBe(0);
  } else {
    console.log('❌ MIDDLE panel scroll failed');
    throw new Error(`Middle panel: expected 500, got ${afterMiddle.middle}`);
  }

  // Reset
  await leftPanel.evaluate(el => { el.scrollTop = 0; });
  await middlePanel.evaluate(el => { el.scrollTop = 0; });
  await rightPanel.evaluate(el => { el.scrollTop = 0; });
  await page.waitForTimeout(300);

  // Test 3: Programmatically scroll RIGHT panel
  console.log('\n🧪 Test 3: Programmatically scrolling RIGHT panel...');
  await rightPanel.evaluate(el => { el.scrollTop = 500; });
  await page.waitForTimeout(300);

  const afterRight = await getScrollPositions();
  console.log('After right scroll:', afterRight);

  if (afterRight.left === 0 && afterRight.middle === 0 && afterRight.right === 500) {
    console.log('✅ RIGHT panel scrolled independently!');
    expect(afterRight.left).toBe(0);
    expect(afterRight.middle).toBe(0);
    expect(afterRight.right).toBe(500);
  } else {
    console.log('❌ RIGHT panel scroll failed');
    throw new Error(`Right panel: expected 500, got ${afterRight.right}`);
  }

  console.log('\n🎉 ALL MOCKUP TESTS PASSED!');
  console.log('✅ All panels can scroll independently');
  console.log('✅ Ready to apply this pattern to real page');
});
