import { test, expect } from '@playwright/test';

test('Test scroll isolation page', async ({ page }) => {
  console.log('🔍 Testing scroll isolation on /test-scroll-isolation page...\n');

  // Navigate to test page
  await page.goto('http://localhost:3000/test-scroll-isolation');
  console.log(`✅ Navigated to test-scroll-isolation page\n`);

  // Wait for the page to load
  await page.waitForSelector('text=Left Panel', { timeout: 10000 });
  await page.waitForTimeout(1000);
  console.log('✅ Page loaded\n');

  // Get the page scroll position
  const getPageScroll = async () => {
    return await page.evaluate(() => ({
      scrollY: window.scrollY,
      scrollX: window.scrollX
    }));
  };

  const initialPageScroll = await getPageScroll();
  console.log(`📊 Initial page scroll:`, initialPageScroll);

  // Test 1: Check overscroll-behavior-y on all scrollable areas
  console.log('\n🧪 Test 1: Checking CSS overscroll-behavior-y property...\n');

  const scrollableElements = await page.locator('.overflow-y-auto').all();
  console.log(`Found ${scrollableElements.length} scrollable elements\n`);

  let allHaveContain = true;
  for (let i = 0; i < scrollableElements.length; i++) {
    const overscroll = await scrollableElements[i].evaluate((el) =>
      window.getComputedStyle(el).overscrollBehaviorY
    );
    const text = await scrollableElements[i].textContent();
    const preview = text?.substring(0, 50).replace(/\n/g, ' ') || '';
    console.log(`Element ${i + 1}: overscroll-behavior-y = ${overscroll} (${preview}...)`);

    if (overscroll !== 'contain') {
      allHaveContain = false;
    }
  }

  if (allHaveContain) {
    console.log('\n✅ All scrollable elements have overscroll-behavior-y: contain\n');
  } else {
    throw new Error('Some scrollable elements are missing overscroll-behavior-y: contain');
  }

  // Test 2: Test left panel scrolling
  console.log('🧪 Test 2: Test left panel scrolling...\n');

  const leftPanel = page.locator('.overflow-y-auto').filter({ hasText: 'Left Panel' }).first();

  if (await leftPanel.count() > 0) {
    console.log('Found left panel\n');

    // Hover over left panel
    await leftPanel.hover();
    await page.waitForTimeout(200);

    // Try to scroll with mouse wheel
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(500);

    const afterScroll = await getPageScroll();
    console.log(`Page scroll after wheel in left panel:`, afterScroll);

    if (afterScroll.scrollY === initialPageScroll.scrollY) {
      console.log('✅ Page did NOT scroll when scrolling left panel!\n');
    } else {
      throw new Error(`Page scrolled! Expected ${initialPageScroll.scrollY}, got ${afterScroll.scrollY}`);
    }
  } else {
    throw new Error('Left panel not found');
  }

  // Test 3: Test middle panel scrolling
  console.log('🧪 Test 3: Test middle panel scrolling...\n');

  const middlePanel = page.locator('.overflow-y-auto').filter({ hasText: 'Middle Panel' }).first();

  if (await middlePanel.count() > 0) {
    console.log('Found middle panel\n');

    await middlePanel.hover();
    await page.waitForTimeout(200);

    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(500);

    const afterScroll = await getPageScroll();
    console.log(`Page scroll after wheel in middle panel:`, afterScroll);

    if (afterScroll.scrollY === initialPageScroll.scrollY) {
      console.log('✅ Page did NOT scroll when scrolling middle panel!\n');
    } else {
      throw new Error(`Page scrolled! Expected ${initialPageScroll.scrollY}, got ${afterScroll.scrollY}`);
    }
  } else {
    throw new Error('Middle panel not found');
  }

  // Test 4: Test right panel scrolling
  console.log('🧪 Test 4: Test right panel scrolling...\n');

  const rightPanel = page.locator('.overflow-y-auto').filter({ hasText: 'Right Panel' }).first();

  if (await rightPanel.count() > 0) {
    console.log('Found right panel\n');

    await rightPanel.hover();
    await page.waitForTimeout(200);

    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(500);

    const afterScroll = await getPageScroll();
    console.log(`Page scroll after wheel in right panel:`, afterScroll);

    if (afterScroll.scrollY === initialPageScroll.scrollY) {
      console.log('✅ Page did NOT scroll when scrolling right panel!\n');
    } else {
      throw new Error(`Page scrolled! Expected ${initialPageScroll.scrollY}, got ${afterScroll.scrollY}`);
    }
  } else {
    throw new Error('Right panel not found');
  }

  // Test 5: Verify scroll indicator shows 0
  console.log('🧪 Test 5: Verify scroll indicator...\n');

  const scrollIndicator = await page.locator('#scroll-value').textContent();
  console.log(`Scroll indicator value: ${scrollIndicator}\n`);

  if (scrollIndicator === '0') {
    console.log('✅ Scroll indicator confirms page scroll is 0!\n');
  } else {
    throw new Error(`Scroll indicator shows ${scrollIndicator}, expected 0`);
  }

  console.log('🎉 ALL SCROLL ISOLATION TESTS PASSED!\n');
  console.log('✅ All scrollable areas have overscroll-behavior-y: contain');
  console.log('✅ Page does not scroll when any panel scrolls');
  console.log('✅ Scroll indicator confirms 0px page scroll');
});
