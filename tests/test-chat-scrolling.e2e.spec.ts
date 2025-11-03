import { test, expect } from '@playwright/test';

test('Test chat panel independent scrolling', async ({ page }) => {
  console.log('🔍 Testing chat panel scrolling...\n');

  // Navigate to test page
  await page.goto('http://localhost:3000/test-chat-scrolling');
  console.log('✅ On test chat scrolling page\n');

  // Wait for panels to be visible
  await page.waitForSelector('text=Left Sidebar', { timeout: 5000 });
  await page.waitForSelector('text=Middle Content', { timeout: 5000 });
  await page.waitForSelector('textarea[placeholder="Type your message..."]', { timeout: 5000 });
  console.log('✅ All three panels visible\n');

  // Get the three scrollable containers
  const leftPanel = page.locator('div.overflow-y-auto').filter({ hasText: 'Left Sidebar' }).first();
  const middlePanel = page.locator('div.overflow-y-auto').filter({ hasText: 'Middle Content' }).first();
  const rightMessagesArea = page.locator('div.overflow-y-auto').filter({ hasText: 'SCROLL THIS AREA ONLY' }).first();

  // Helper to get scroll positions
  async function getScrollPositions() {
    const left = await leftPanel.evaluate((el) => el.scrollTop);
    const middle = await middlePanel.evaluate((el) => el.scrollTop);
    const right = await rightMessagesArea.evaluate((el) => el.scrollTop);
    return { left, middle, right };
  }

  // Initial positions should be 0
  const initial = await getScrollPositions();
  console.log(`📊 Initial scroll positions:`, initial);
  expect(initial.left).toBe(0);
  expect(initial.middle).toBe(0);
  expect(initial.right).toBe(0);
  console.log('✅ All panels start at top\n');

  // Test 1: Scroll ONLY the right panel messages area
  console.log('🧪 Test 1: Scrolling right panel messages area...\n');
  await rightMessagesArea.evaluate((el) => {
    el.scrollTop = 500;
  });
  await page.waitForTimeout(200);

  const afterRightScroll = await getScrollPositions();
  console.log(`After right scroll:`, afterRightScroll);

  if (afterRightScroll.right === 500 && afterRightScroll.left === 0 && afterRightScroll.middle === 0) {
    console.log('✅ RIGHT messages area scrolled independently!\n');
  } else {
    console.log('❌ RIGHT messages area scroll failed');
    throw new Error(`Right: expected 500, got ${afterRightScroll.right}. Other panels should stay at 0.`);
  }

  // Reset
  await rightMessagesArea.evaluate((el) => { el.scrollTop = 0; });
  await page.waitForTimeout(200);

  // Test 2: Verify input box stays visible
  console.log('🧪 Test 2: Verifying input box stays visible...\n');

  // Scroll messages to bottom
  await rightMessagesArea.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await page.waitForTimeout(200);

  // Check if input is still visible
  const inputVisible = await page.locator('textarea[placeholder="Type your message..."]').isVisible();
  if (inputVisible) {
    console.log('✅ Input box remains visible at bottom!\n');
  } else {
    throw new Error('Input box is not visible after scrolling messages');
  }

  // Test 3: Verify left and middle panels still scroll independently
  console.log('🧪 Test 3: Verifying left panel scrolls independently...\n');
  await leftPanel.evaluate((el) => { el.scrollTop = 300; });
  await page.waitForTimeout(200);

  const afterLeftScroll = await getScrollPositions();
  console.log(`After left scroll:`, afterLeftScroll);

  if (afterLeftScroll.left === 300 && afterLeftScroll.middle === 0) {
    console.log('✅ LEFT panel scrolled independently!\n');
  } else {
    throw new Error(`Left: expected 300, got ${afterLeftScroll.left}`);
  }

  console.log('🎉 ALL CHAT SCROLLING TESTS PASSED!\n');
  console.log('✅ Messages area scrolls independently');
  console.log('✅ Input box stays fixed and visible');
  console.log('✅ All panels scroll independently');
});
