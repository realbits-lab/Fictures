import { test, expect } from '@playwright/test';

test('Test overscroll-behavior prevents page scroll', async ({ page }) => {
  console.log('🔍 Testing overscroll-behavior on chat scrolling page...\n');

  // Navigate to test page
  await page.goto('http://localhost:3000/test-chat-scrolling');
  console.log('✅ On test chat scrolling page\n');

  // Wait for panels to be visible
  await page.waitForSelector('text=Left Sidebar', { timeout: 5000 });
  await page.waitForSelector('textarea[placeholder="Type your message..."]', { timeout: 5000 });
  console.log('✅ Page loaded\n');

  // Get the page scroll position initially
  const getPageScroll = async () => {
    return await page.evaluate(() => ({
      scrollY: window.scrollY,
      scrollX: window.scrollX
    }));
  };

  // Get initial page scroll
  const initialPageScroll = await getPageScroll();
  console.log(`📊 Initial page scroll:`, initialPageScroll);

  // Test 1: Verify overscroll-behavior-y is set on scrollable divs
  console.log('\n🧪 Test 1: Checking CSS overscroll-behavior-y property...\n');

  const leftPanel = page.locator('div.overflow-y-auto').filter({ hasText: 'Left Sidebar' }).first();
  const middlePanel = page.locator('div.overflow-y-auto').filter({ hasText: 'Middle Content' }).first();
  const rightMessagesArea = page.locator('div.overflow-y-auto').filter({ hasText: 'SCROLL THIS AREA ONLY' }).first();

  const leftOverscroll = await leftPanel.evaluate((el) =>
    window.getComputedStyle(el).overscrollBehaviorY
  );
  const middleOverscroll = await middlePanel.evaluate((el) =>
    window.getComputedStyle(el).overscrollBehaviorY
  );
  const rightOverscroll = await rightMessagesArea.evaluate((el) =>
    window.getComputedStyle(el).overscrollBehaviorY
  );

  console.log(`Left panel overscroll-behavior-y: ${leftOverscroll}`);
  console.log(`Middle panel overscroll-behavior-y: ${middleOverscroll}`);
  console.log(`Right messages area overscroll-behavior-y: ${rightOverscroll}`);

  if (leftOverscroll === 'contain' && middleOverscroll === 'contain' && rightOverscroll === 'contain') {
    console.log('✅ All panels have overscroll-behavior-y: contain\n');
  } else {
    throw new Error(`CSS property not set correctly. Left: ${leftOverscroll}, Middle: ${middleOverscroll}, Right: ${rightOverscroll}`);
  }

  // Test 2: Scroll right panel to bottom and verify page doesn't scroll
  console.log('🧪 Test 2: Scroll right panel to bottom and check page scroll...\n');

  // Scroll right messages area to bottom
  await rightMessagesArea.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await page.waitForTimeout(500);

  // Try to scroll down more (which would trigger page scroll without overscroll-behavior)
  await rightMessagesArea.hover();
  await page.mouse.wheel(0, 1000); // Scroll down
  await page.waitForTimeout(500);

  const afterScrollDown = await getPageScroll();
  console.log(`Page scroll after wheel down in right panel:`, afterScrollDown);

  if (afterScrollDown.scrollY === initialPageScroll.scrollY) {
    console.log('✅ Page did NOT scroll when scrolling right panel!\n');
  } else {
    throw new Error(`Page scrolled! Expected ${initialPageScroll.scrollY}, got ${afterScrollDown.scrollY}`);
  }

  // Test 3: Scroll right panel to top and verify page doesn't scroll
  console.log('🧪 Test 3: Scroll right panel to top and check page scroll...\n');

  // Scroll right messages area to top
  await rightMessagesArea.evaluate((el) => {
    el.scrollTop = 0;
  });
  await page.waitForTimeout(500);

  // Try to scroll up more (which would trigger page scroll without overscroll-behavior)
  await rightMessagesArea.hover();
  await page.mouse.wheel(0, -1000); // Scroll up
  await page.waitForTimeout(500);

  const afterScrollUp = await getPageScroll();
  console.log(`Page scroll after wheel up in right panel:`, afterScrollUp);

  if (afterScrollUp.scrollY === initialPageScroll.scrollY) {
    console.log('✅ Page did NOT scroll when scrolling right panel!\n');
  } else {
    throw new Error(`Page scrolled! Expected ${initialPageScroll.scrollY}, got ${afterScrollUp.scrollY}`);
  }

  console.log('🎉 ALL OVERSCROLL-BEHAVIOR TESTS PASSED!\n');
  console.log('✅ overscroll-behavior-y: contain is properly set');
  console.log('✅ Page does not scroll when panels reach scroll boundaries');
});
