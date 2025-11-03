import { test, expect } from '@playwright/test';
import fs from 'fs';

/**
 * Verify panel scrolling configuration and test with artificial content
 */

async function login(page: any) {
  const authData = JSON.parse(fs.readFileSync('.auth/user.json', 'utf-8'));
  const email = authData.profiles.writer.email;
  const password = authData.profiles.writer.password;

  console.log(`Logging in as: ${email}`);

  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button:has-text("Sign in with Email")');
  await page.waitForLoadState('networkidle');

  // Wait for redirect after successful login
  await page.waitForURL(/\/(novels|studio|comics|community)/, { timeout: 10000 });
  await page.waitForTimeout(2000);

  console.log('Login completed');
}

test('Verify panel CSS configuration for scrolling', async ({ page }) => {
  test.setTimeout(120000);

  console.log('🔍 Starting panel CSS verification test...');

  await login(page);

  // Navigate to studio
  await page.goto('/studio');
  await page.waitForLoadState('domcontentloaded');

  console.log('📍 On studio page');

  // Find and click first story
  const storyCard = page.locator('div.cursor-pointer.rounded-lg.shadow-sm').first();
  await storyCard.waitFor({ state: 'visible', timeout: 30000 });
  const storyCount = await storyCard.count();

  console.log(`Found ${storyCount} stories`);

  if (storyCount === 0) {
    console.log('⚠️  No stories found');
    test.skip();
    return;
  }

  console.log('Clicking first story...');
  await storyCard.click();

  // Wait for editor page URL
  await page.waitForURL(/\/studio\/edit\/story\//, { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');

  console.log('📍 On story editor page');

  // Find the three main panels by their specific class combinations
  const leftPanel = page.locator('div.flex-1.min-h-0.pr-2.overflow-y-auto').first();
  const middlePanel = page.locator('div.flex-1.min-h-0.px-2.overflow-y-auto').first();
  const rightPanel = page.locator('div.flex-1.min-h-0.pl-2.overflow-y-auto').first();

  // Verify panels exist
  await expect(leftPanel).toBeVisible();
  await expect(middlePanel).toBeVisible();
  await expect(rightPanel).toBeVisible();

  console.log('✅ All three panels are visible');

  // Check computed styles for each panel
  const leftStyles = await leftPanel.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      overflowY: computed.overflowY,
      height: computed.height,
      minHeight: computed.minHeight,
      flex: computed.flex,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      hasScrollbar: el.scrollHeight > el.clientHeight,
    };
  });

  const middleStyles = await middlePanel.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      overflowY: computed.overflowY,
      height: computed.height,
      minHeight: computed.minHeight,
      flex: computed.flex,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      hasScrollbar: el.scrollHeight > el.clientHeight,
    };
  });

  const rightStyles = await rightPanel.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      overflowY: computed.overflowY,
      height: computed.height,
      minHeight: computed.minHeight,
      flex: computed.flex,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      hasScrollbar: el.scrollHeight > el.clientHeight,
    };
  });

  console.log('\n📊 Left Panel Styles:', leftStyles);
  console.log('📊 Middle Panel Styles:', middleStyles);
  console.log('📊 Right Panel Styles:', rightStyles);

  // Verify overflow-y is set to auto on all panels
  expect(leftStyles.overflowY).toBe('auto');
  expect(middleStyles.overflowY).toBe('auto');
  expect(rightStyles.overflowY).toBe('auto');

  console.log('\n✅ All panels have overflow-y: auto');

  // Now inject extra content into each panel to force scrolling
  console.log('\n🧪 Injecting test content to force scrollbars...');

  await leftPanel.evaluate((el) => {
    const testDiv = document.createElement('div');
    testDiv.id = 'test-scroll-content-left';
    testDiv.style.cssText = 'height: 3000px; background: linear-gradient(red, blue); opacity: 0.3;';
    el.appendChild(testDiv);
  });

  await middlePanel.evaluate((el) => {
    const testDiv = document.createElement('div');
    testDiv.id = 'test-scroll-content-middle';
    testDiv.style.cssText = 'height: 3000px; background: linear-gradient(green, yellow); opacity: 0.3;';
    el.appendChild(testDiv);
  });

  await rightPanel.evaluate((el) => {
    const testDiv = document.createElement('div');
    testDiv.id = 'test-scroll-content-right';
    testDiv.style.cssText = 'height: 3000px; background: linear-gradient(purple, orange); opacity: 0.3;';
    el.appendChild(testDiv);
  });

  await page.waitForTimeout(1000);

  // Check if scrollbars appeared
  const leftAfter = await leftPanel.evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    hasScrollbar: el.scrollHeight > el.clientHeight,
  }));

  const middleAfter = await middlePanel.evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    hasScrollbar: el.scrollHeight > el.clientHeight,
  }));

  const rightAfter = await rightPanel.evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    hasScrollbar: el.scrollHeight > el.clientHeight,
  }));

  console.log('\n📊 After injecting content:');
  console.log('Left panel:', leftAfter);
  console.log('Middle panel:', middleAfter);
  console.log('Right panel:', rightAfter);

  // Verify all panels now have scrollbars
  expect(leftAfter.hasScrollbar).toBe(true);
  expect(middleAfter.hasScrollbar).toBe(true);
  expect(rightAfter.hasScrollbar).toBe(true);

  console.log('\n✅ All panels now have scrollable content');

  // Now test actual scrolling with mouse wheel
  console.log('\n🧪 Testing mouse wheel scrolling on left panel...');

  const initialLeftScroll = await leftPanel.evaluate(el => el.scrollTop);
  const initialMiddleScroll = await middlePanel.evaluate(el => el.scrollTop);
  const initialRightScroll = await rightPanel.evaluate(el => el.scrollTop);

  console.log(`Initial scroll positions: left=${initialLeftScroll}, middle=${initialMiddleScroll}, right=${initialRightScroll}`);

  // Get left panel bounding box and scroll it
  const leftBox = await leftPanel.boundingBox();
  if (leftBox) {
    await page.mouse.move(leftBox.x + leftBox.width / 2, leftBox.y + leftBox.height / 2);
    await page.mouse.wheel(0, 500); // Scroll down 500px
    await page.waitForTimeout(500);

    const afterLeftScroll = await leftPanel.evaluate(el => el.scrollTop);
    const afterMiddleScroll = await middlePanel.evaluate(el => el.scrollTop);
    const afterRightScroll = await rightPanel.evaluate(el => el.scrollTop);

    console.log(`After left panel scroll: left=${afterLeftScroll}, middle=${afterMiddleScroll}, right=${afterRightScroll}`);

    if (afterLeftScroll > initialLeftScroll) {
      console.log('✅ LEFT panel scrolled successfully!');
      console.log(`   Scrolled by: ${afterLeftScroll - initialLeftScroll}px`);
    } else {
      console.log('❌ LEFT panel did NOT scroll');
    }

    if (afterMiddleScroll === initialMiddleScroll && afterRightScroll === initialRightScroll) {
      console.log('✅ Middle and right panels did NOT scroll (GOOD!)');
    } else {
      console.log('❌ Other panels scrolled unexpectedly (BAD!)');
    }

    // Verify independent scrolling
    expect(afterLeftScroll).toBeGreaterThan(initialLeftScroll);
    expect(afterMiddleScroll).toBe(initialMiddleScroll);
    expect(afterRightScroll).toBe(initialRightScroll);
  }

  console.log('\n🎉 Independent scrolling test PASSED!');
  console.log('Each panel scrolls independently without affecting others');
});
