import { test, expect } from '@playwright/test';

test('Test scroll side effect after scrolling right panel', async ({ page }) => {
  console.log('🔍 Testing side effect: After scrolling right panel, does moving mouse to middle cause scroll?\n');

  await page.goto('http://localhost:3000/test-story-editor-mockup');
  await page.waitForLoadState('networkidle');
  console.log('✅ Navigated to mockup page\n');

  const leftPanel = page.locator('.overflow-y-auto').nth(0);
  const middlePanel = page.locator('.overflow-y-auto').nth(1);
  const rightChatContainer = page.locator('.overflow-y-auto').nth(2);

  // Get initial scroll positions
  const leftInitial = await leftPanel.evaluate(el => el.scrollTop);
  const middleInitial = await middlePanel.evaluate(el => el.scrollTop);
  const rightChatInitial = await rightChatContainer.evaluate(el => el.scrollTop);

  console.log('📊 Initial scroll positions:');
  console.log(`  Left panel: ${leftInitial}px`);
  console.log(`  Middle panel: ${middleInitial}px`);
  console.log(`  Right chat: ${rightChatInitial}px\n`);

  // Step 1: Scroll right panel to bottom
  console.log('🧪 Step 1: Scrolling right panel to bottom...\n');
  const rightChatBox = await rightChatContainer.boundingBox();

  if (rightChatBox) {
    const x = rightChatBox.x + rightChatBox.width / 2;
    const y = rightChatBox.y + rightChatBox.height / 2;

    // Move mouse to right panel
    await page.mouse.move(x, y);
    await page.waitForTimeout(100);

    // Scroll to bottom (multiple wheel events)
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(500);
  }

  const rightChatAfterScroll = await rightChatContainer.evaluate(el => el.scrollTop);
  console.log(`📊 Right chat after scrolling: ${rightChatAfterScroll}px\n`);

  // Get scroll positions after scrolling right panel
  const leftAfterRightScroll = await leftPanel.evaluate(el => el.scrollTop);
  const middleAfterRightScroll = await middlePanel.evaluate(el => el.scrollTop);

  console.log('📊 Other panels after scrolling right:');
  console.log(`  Left panel: ${leftAfterRightScroll}px`);
  console.log(`  Middle panel: ${middleAfterRightScroll}px\n`);

  // Step 2: Move mouse to middle panel
  console.log('🧪 Step 2: Moving mouse to middle panel...\n');
  const middleBox = await middlePanel.boundingBox();

  if (middleBox) {
    const x = middleBox.x + middleBox.width / 2;
    const y = middleBox.y + middleBox.height / 2;

    await page.mouse.move(x, y);
    await page.waitForTimeout(500);
  }

  // Get scroll positions after moving mouse
  const leftAfterMouseMove = await leftPanel.evaluate(el => el.scrollTop);
  const middleAfterMouseMove = await middlePanel.evaluate(el => el.scrollTop);
  const pageScrollAfterMouseMove = await page.evaluate(() => window.scrollY);

  console.log('📊 After moving mouse to middle panel:');
  console.log(`  Left panel: ${leftAfterMouseMove}px (was ${leftAfterRightScroll}px)`);
  console.log(`  Middle panel: ${middleAfterMouseMove}px (was ${middleAfterRightScroll}px)`);
  console.log(`  Page scroll: ${pageScrollAfterMouseMove}px\n`);

  // Check if any unwanted scrolling occurred
  const leftScrolled = leftAfterMouseMove !== leftAfterRightScroll;
  const middleScrolled = middleAfterMouseMove !== middleAfterRightScroll;
  const pageScrolled = pageScrollAfterMouseMove > 0;

  if (leftScrolled || middleScrolled || pageScrolled) {
    console.log('❌ SIDE EFFECT DETECTED:');
    if (leftScrolled) console.log(`   - Left panel scrolled by ${leftAfterMouseMove - leftAfterRightScroll}px`);
    if (middleScrolled) console.log(`   - Middle panel scrolled by ${middleAfterMouseMove - middleAfterRightScroll}px`);
    if (pageScrolled) console.log(`   - Page scrolled by ${pageScrollAfterMouseMove}px`);
    console.log('');
  } else {
    console.log('✅ NO SIDE EFFECT: Panels stayed in place after mouse move\n');
  }

  // Also test with scrolling to TOP instead of bottom
  console.log('🧪 Step 3: Testing with scrolling to TOP...\n');

  // Reset right panel scroll to middle first
  await rightChatContainer.evaluate(el => el.scrollTop = el.scrollHeight / 2);

  if (rightChatBox) {
    const x = rightChatBox.x + rightChatBox.width / 2;
    const y = rightChatBox.y + rightChatBox.height / 2;

    await page.mouse.move(x, y);
    await page.waitForTimeout(100);

    // Scroll to top (negative wheel events)
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, -500);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(500);
  }

  const rightChatAfterTopScroll = await rightChatContainer.evaluate(el => el.scrollTop);
  console.log(`📊 Right chat after scrolling to top: ${rightChatAfterTopScroll}px\n`);

  const leftBeforeMouseMove2 = await leftPanel.evaluate(el => el.scrollTop);
  const middleBeforeMouseMove2 = await middlePanel.evaluate(el => el.scrollTop);

  // Move mouse to middle again
  if (middleBox) {
    const x = middleBox.x + middleBox.width / 2;
    const y = middleBox.y + middleBox.height / 2;

    await page.mouse.move(x, y);
    await page.waitForTimeout(500);
  }

  const leftAfterMouseMove2 = await leftPanel.evaluate(el => el.scrollTop);
  const middleAfterMouseMove2 = await middlePanel.evaluate(el => el.scrollTop);
  const pageScrollAfterMouseMove2 = await page.evaluate(() => window.scrollY);

  console.log('📊 After moving mouse to middle (after top scroll):');
  console.log(`  Left panel: ${leftAfterMouseMove2}px (was ${leftBeforeMouseMove2}px)`);
  console.log(`  Middle panel: ${middleAfterMouseMove2}px (was ${middleBeforeMouseMove2}px)`);
  console.log(`  Page scroll: ${pageScrollAfterMouseMove2}px\n`);

  const leftScrolled2 = leftAfterMouseMove2 !== leftBeforeMouseMove2;
  const middleScrolled2 = middleAfterMouseMove2 !== middleBeforeMouseMove2;
  const pageScrolled2 = pageScrollAfterMouseMove2 > 0;

  if (leftScrolled2 || middleScrolled2 || pageScrolled2) {
    console.log('❌ SIDE EFFECT DETECTED (after top scroll):');
    if (leftScrolled2) console.log(`   - Left panel scrolled by ${leftAfterMouseMove2 - leftBeforeMouseMove2}px`);
    if (middleScrolled2) console.log(`   - Middle panel scrolled by ${middleAfterMouseMove2 - middleBeforeMouseMove2}px`);
    if (pageScrolled2) console.log(`   - Page scrolled by ${pageScrollAfterMouseMove2}px`);
    console.log('');
  } else {
    console.log('✅ NO SIDE EFFECT: Panels stayed in place after mouse move (top scroll)\n');
  }

  // Final assertion
  expect(leftScrolled || middleScrolled || pageScrolled || leftScrolled2 || middleScrolled2 || pageScrolled2).toBe(false);
});
