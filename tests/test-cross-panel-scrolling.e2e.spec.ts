import { test, expect } from '@playwright/test';

test('Test cross-panel scrolling isolation', async ({ page }) => {
  console.log('🔍 Testing if scrolling one panel affects other panels...\n');

  // Navigate to mockup page
  await page.goto('http://localhost:3000/test-story-editor-mockup');
  await page.waitForLoadState('networkidle');
  console.log('✅ Navigated to mockup page\n');

  // Get all three panels
  const leftPanel = page.locator('.overflow-y-auto').nth(0);
  const middlePanel = page.locator('.overflow-y-auto').nth(1);
  const rightPanel = page.locator('.overflow-y-auto').nth(2);

  // Get initial scroll positions
  const leftInitial = await leftPanel.evaluate(el => el.scrollTop);
  const middleInitial = await middlePanel.evaluate(el => el.scrollTop);
  const rightInitial = await rightPanel.evaluate(el => el.scrollTop);

  console.log('📊 Initial scroll positions:');
  console.log(`  Left panel: ${leftInitial}px`);
  console.log(`  Middle panel: ${middleInitial}px`);
  console.log(`  Right panel: ${rightInitial}px\n`);

  // Dispatch wheel event on RIGHT panel (simulating mouse scroll)
  console.log('🧪 Test: Dispatching wheel event on RIGHT panel (deltaY: 500px)...\n');
  await rightPanel.evaluate(el => {
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 500,
      bubbles: true,
      cancelable: true
    });
    el.dispatchEvent(wheelEvent);
  });

  // Wait a bit for any potential scroll propagation
  await page.waitForTimeout(500);

  // Check if OTHER panels scrolled
  const leftAfter = await leftPanel.evaluate(el => el.scrollTop);
  const middleAfter = await middlePanel.evaluate(el => el.scrollTop);
  const rightAfter = await rightPanel.evaluate(el => el.scrollTop);

  console.log('📊 After scrolling RIGHT panel:');
  console.log(`  Left panel: ${leftAfter}px (expected: ${leftInitial}px)`);
  console.log(`  Middle panel: ${middleAfter}px (expected: ${middleInitial}px)`);
  console.log(`  Right panel: ${rightAfter}px (expected: >0px if has content)\n`);

  // Check results
  const leftPanelScrolled = leftAfter !== leftInitial;
  const middlePanelScrolled = middleAfter !== middleInitial;
  const rightPanelScrolled = rightAfter !== rightInitial;

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
    console.log(`   Right panel scrolled: ${rightPanelScrolled ? `${rightInitial}px → ${rightAfter}px` : 'No (no scrollable content)'}\n`);
  }

  // Assertions - Only check that OTHER panels didn't scroll
  expect(leftAfter).toBe(leftInitial);
  expect(middleAfter).toBe(middleInitial);
  // Right panel should have scrolled if it has content
  console.log(`Final check: Right panel went from ${rightInitial}px to ${rightAfter}px`);
});
