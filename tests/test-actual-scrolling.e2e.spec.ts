import { test, expect } from '@playwright/test';
import fs from 'fs';

/**
 * Test actual scrolling behavior - verify independent scrolling
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

test('Verify independent panel scrolling with mouse wheel', async ({ page }) => {
  test.setTimeout(120000);

  console.log('🔍 Starting actual scrolling test...');

  await login(page);

  // Navigate to studio
  await page.goto('/studio');
  await page.waitForLoadState('domcontentloaded');

  console.log('📍 On studio page');

  // Find and click first story
  const storyCard = page.locator('div.cursor-pointer.rounded-lg.shadow-sm').first();

  // Wait for story cards to be visible (instead of networkidle)
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

  // Wait for page to stabilize
  await page.waitForTimeout(2000);

  // Click on first scene in left sidebar to load content into middle panel
  console.log('🖱️  Clicking on first scene to load content...');
  const firstScene = page.locator('div.cursor-pointer').filter({ hasText: /scene/i }).first();

  // If no scene found, try clicking on first chapter
  const sceneCount = await firstScene.count();
  if (sceneCount > 0) {
    await firstScene.click();
    console.log('✅ Clicked on scene');
  } else {
    console.log('⚠️  No scene found, trying first chapter...');
    const firstChapter = page.locator('div.cursor-pointer').filter({ hasText: /chapter/i }).first();
    const chapterCount = await firstChapter.count();
    if (chapterCount > 0) {
      await firstChapter.click();
      console.log('✅ Clicked on chapter');
    }
  }

  await page.waitForTimeout(2000);

  // Find the three main panels
  const leftPanel = page.locator('div.flex-1.min-h-0.pr-2.overflow-y-auto').first();
  const middlePanel = page.locator('div.flex-1.min-h-0.px-2.overflow-y-auto').first();
  const rightPanel = page.locator('div.flex-1.min-h-0.pl-2.overflow-y-auto').first();

  // Verify panels exist
  await expect(leftPanel).toBeVisible();
  await expect(middlePanel).toBeVisible();
  await expect(rightPanel).toBeVisible();

  console.log('✅ All three panels are visible');

  // Get initial scroll positions of all panels
  async function getScrollPositions() {
    const left = await leftPanel.evaluate(el => el.scrollTop);
    const middle = await middlePanel.evaluate(el => el.scrollTop);
    const right = await rightPanel.evaluate(el => el.scrollTop);
    return { left, middle, right };
  }

  const initialPositions = await getScrollPositions();
  console.log('📊 Initial scroll positions:', initialPositions);

  // Test 1: Scroll left panel
  console.log('\n🧪 Test 1: Scrolling LEFT panel...');
  const leftBox = await leftPanel.boundingBox();
  if (leftBox) {
    // Move mouse to center of left panel
    await page.mouse.move(leftBox.x + leftBox.width / 2, leftBox.y + leftBox.height / 2);

    // Scroll down with mouse wheel (positive deltaY scrolls down)
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(500);

    const afterLeftScroll = await getScrollPositions();
    console.log('📊 After left scroll:', afterLeftScroll);

    // Verify: left panel scrolled, others didn't
    console.log(`   Left panel scrolled: ${afterLeftScroll.left > initialPositions.left ? '✅ YES' : '❌ NO'}`);
    console.log(`   Middle panel moved: ${afterLeftScroll.middle !== initialPositions.middle ? '❌ YES (BAD!)' : '✅ NO (GOOD!)'}`);
    console.log(`   Right panel moved: ${afterLeftScroll.right !== initialPositions.right ? '❌ YES (BAD!)' : '✅ NO (GOOD!)'}`);

    expect(afterLeftScroll.left).toBeGreaterThan(initialPositions.left);
    expect(afterLeftScroll.middle).toBe(initialPositions.middle);
    expect(afterLeftScroll.right).toBe(initialPositions.right);
  }

  // Reset scroll
  await leftPanel.evaluate(el => el.scrollTop = 0);
  await page.waitForTimeout(300);

  // Test 2: Scroll middle panel
  console.log('\n🧪 Test 2: Scrolling MIDDLE panel...');
  const middleBox = await middlePanel.boundingBox();
  if (middleBox) {
    // Move mouse to center of middle panel
    await page.mouse.move(middleBox.x + middleBox.width / 2, middleBox.y + middleBox.height / 2);

    // Scroll down
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(500);

    const afterMiddleScroll = await getScrollPositions();
    console.log('📊 After middle scroll:', afterMiddleScroll);

    console.log(`   Left panel moved: ${afterMiddleScroll.left !== 0 ? '❌ YES (BAD!)' : '✅ NO (GOOD!)'}`);
    console.log(`   Middle panel scrolled: ${afterMiddleScroll.middle > 0 ? '✅ YES' : '❌ NO'}`);
    console.log(`   Right panel moved: ${afterMiddleScroll.right !== initialPositions.right ? '❌ YES (BAD!)' : '✅ NO (GOOD!)'}`);

    expect(afterMiddleScroll.left).toBe(0);
    expect(afterMiddleScroll.middle).toBeGreaterThan(0);
    expect(afterMiddleScroll.right).toBe(initialPositions.right);
  }

  // Reset scroll
  await middlePanel.evaluate(el => el.scrollTop = 0);
  await page.waitForTimeout(300);

  // Test 3: Scroll right panel
  console.log('\n🧪 Test 3: Scrolling RIGHT panel...');
  const rightBox = await rightPanel.boundingBox();
  if (rightBox) {
    // Move mouse to center of right panel
    await page.mouse.move(rightBox.x + rightBox.width / 2, rightBox.y + rightBox.height / 2);

    // Scroll down
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(500);

    const afterRightScroll = await getScrollPositions();
    console.log('📊 After right scroll:', afterRightScroll);

    console.log(`   Left panel moved: ${afterRightScroll.left !== 0 ? '❌ YES (BAD!)' : '✅ NO (GOOD!)'}`);
    console.log(`   Middle panel moved: ${afterRightScroll.middle !== 0 ? '❌ YES (BAD!)' : '✅ NO (GOOD!)'}`);
    console.log(`   Right panel scrolled: ${afterRightScroll.right > initialPositions.right ? '✅ YES' : '❌ NO'}`);

    expect(afterRightScroll.left).toBe(0);
    expect(afterRightScroll.middle).toBe(0);
    expect(afterRightScroll.right).toBeGreaterThan(initialPositions.right);
  }

  console.log('\n✅ All independent scrolling tests passed!');
  console.log('🎉 Each panel scrolls independently without affecting others');
});
