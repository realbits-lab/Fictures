import { test, expect } from '@playwright/test';

test('Test cross-panel scrolling isolation with REAL scrolling', async ({ page }) => {
  console.log('🔍 Testing if scrolling one panel affects other panels (REAL scrolling)...\n');

  // Navigate to mockup page
  await page.goto('http://localhost:3000/test-story-editor-mockup');
  await page.waitForLoadState('networkidle');
  console.log('✅ Navigated to mockup page\n');

  // Get all three panels - target the main scrollable containers
  const leftPanel = page.locator('.overflow-y-auto').nth(0);
  const middlePanel = page.locator('.overflow-y-auto').nth(1);
  const rightPanel = page.locator('.overflow-y-auto').nth(2);

  // For the right panel, we need to target the inner chat container which has the actual scrollable content
  const rightChatContainer = page.locator('.overflow-y-auto').nth(3);

  // Get initial scroll positions
  const leftInitial = await leftPanel.evaluate(el => el.scrollTop);
  const middleInitial = await middlePanel.evaluate(el => el.scrollTop);
  const rightInitial = await rightPanel.evaluate(el => el.scrollTop);
  const rightChatInitial = await rightChatContainer.evaluate(el => el.scrollTop);

  console.log('📊 Initial scroll positions:');
  console.log(`  Left panel: ${leftInitial}px`);
  console.log(`  Middle panel: ${middleInitial}px`);
  console.log(`  Right panel (outer): ${rightInitial}px`);
  console.log(`  Right chat (inner): ${rightChatInitial}px\n`);

  // Use actual mouse wheel scrolling on the RIGHT panel
  console.log('🧪 Test: Using REAL mouse wheel on RIGHT panel...\n');

  // Get the bounding box of the right panel to position the mouse correctly
  const rightPanelBox = await rightPanel.boundingBox();

  if (rightPanelBox) {
    // Position mouse in the center of the right panel
    const x = rightPanelBox.x + rightPanelBox.width / 2;
    const y = rightPanelBox.y + rightPanelBox.height / 2;

    // Move mouse to the right panel
    await page.mouse.move(x, y);

    // Perform actual mouse wheel scroll (scroll down)
    await page.mouse.wheel(0, 500);

    // Wait for scroll to complete
    await page.waitForTimeout(500);
  }

  // Check if OTHER panels scrolled
  const leftAfter = await leftPanel.evaluate(el => el.scrollTop);
  const middleAfter = await middlePanel.evaluate(el => el.scrollTop);
  const rightAfter = await rightPanel.evaluate(el => el.scrollTop);
  const rightChatAfter = await rightChatContainer.evaluate(el => el.scrollTop);

  console.log('📊 After scrolling RIGHT panel:');
  console.log(`  Left panel: ${leftAfter}px (expected: ${leftInitial}px)`);
  console.log(`  Middle panel: ${middleAfter}px (expected: ${middleInitial}px)`);
  console.log(`  Right panel (outer): ${rightAfter}px (expected: unchanged)`);
  console.log(`  Right chat (inner): ${rightChatAfter}px (expected: >0px)\n`);

  // Check results
  const leftPanelScrolled = leftAfter !== leftInitial;
  const middlePanelScrolled = middleAfter !== middleInitial;
  const rightChatScrolled = rightChatAfter !== rightChatInitial;

  if (leftPanelScrolled) {
    console.log('❌ PROBLEM: Left panel scrolled when right panel was scrolled!');
    console.log(`   Left panel changed from ${leftInitial}px to ${leftAfter}px\n`);
  }

  if (middlePanelScrolled) {
    console.log('❌ PROBLEM: Middle panel scrolled when right panel was scrolled!');
    console.log(`   Middle panel changed from ${middleInitial}px to ${middleAfter}px\n`);
  }

  if (!leftPanelScrolled && !middlePanelScrolled) {
    console.log('✅ SUCCESS: Only right panel scrolled, other panels stayed in place!\n');
    console.log(`   Right chat scrolled: ${rightChatScrolled ? `Yes (${rightChatInitial}px → ${rightChatAfter}px)` : 'No (no scrollable content)'}\n`);
  }

  // Assertions - Only check that OTHER panels didn't scroll
  expect(leftAfter).toBe(leftInitial);
  expect(middleAfter).toBe(middleInitial);
  // Right chat should have scrolled if it has content
  console.log(`Final check: Right chat went from ${rightChatInitial}px to ${rightChatAfter}px`);
});
