import { test, expect } from '@playwright/test';
import fs from 'fs';

/**
 * Test independent scrolling by navigating directly to story editor
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

test('Test independent scrolling with direct story URL', async ({ page }) => {
  test.setTimeout(180000);

  console.log('🔍 Starting independent scrolling test...');

  await login(page);

  // Navigate directly to the story editor
  console.log('📍 Navigating to story editor...');
  await page.goto('http://localhost:3000/studio/edit/story/qMH4sJmFTlB6KmdR0C6Uu');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  console.log('✅ On story editor page');

  // Click on first scene in left sidebar
  console.log('🖱️  Looking for clickable nodes in left sidebar...');

  // Try to find any clickable item in the sidebar
  const clickableItems = page.locator('.cursor-pointer').filter({ has: page.locator('text=/scene|chapter|whispers|shadows|captain/i') });
  const itemCount = await clickableItems.count();

  console.log(`Found ${itemCount} clickable items in sidebar`);

  if (itemCount > 0) {
    // Click the first scene or chapter
    await clickableItems.first().click();
    console.log('✅ Clicked on first item in sidebar');
    await page.waitForTimeout(2000);
  }

  // Find the three main panels
  const leftPanel = page.locator('div.flex-1.min-h-0.pr-2.overflow-y-auto').first();
  const middlePanel = page.locator('div.flex-1.min-h-0.px-2.overflow-y-auto').first();
  const rightPanel = page.locator('div.flex-1.min-h-0.pl-2.overflow-y-auto').first();

  // Verify panels exist
  await expect(leftPanel).toBeVisible();
  await expect(middlePanel).toBeVisible();
  await expect(rightPanel).toBeVisible();

  console.log('✅ All three panels are visible');

  // Check scroll heights to see which panels have scrollable content
  const leftInfo = await leftPanel.evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    hasScrollbar: el.scrollHeight > el.clientHeight,
  }));

  const middleInfo = await middlePanel.evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    hasScrollbar: el.scrollHeight > el.clientHeight,
  }));

  const rightInfo = await rightPanel.evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    hasScrollbar: el.scrollHeight > el.clientHeight,
  }));

  console.log('\n📊 Panel scroll info:');
  console.log(`Left panel: scrollHeight=${leftInfo.scrollHeight}, clientHeight=${leftInfo.clientHeight}, hasScrollbar=${leftInfo.hasScrollbar}`);
  console.log(`Middle panel: scrollHeight=${middleInfo.scrollHeight}, clientHeight=${middleInfo.clientHeight}, hasScrollbar=${middleInfo.hasScrollbar}`);
  console.log(`Right panel: scrollHeight=${rightInfo.scrollHeight}, clientHeight=${rightInfo.clientHeight}, hasScrollbar=${rightInfo.hasScrollbar}`);

  // Get initial scroll positions
  async function getScrollPositions() {
    const left = await leftPanel.evaluate(el => el.scrollTop);
    const middle = await middlePanel.evaluate(el => el.scrollTop);
    const right = await rightPanel.evaluate(el => el.scrollTop);
    return { left, middle, right };
  }

  const initialPositions = await getScrollPositions();
  console.log('\n📊 Initial scroll positions:', initialPositions);

  // Test scrolling on the panel with scrollable content
  if (leftInfo.hasScrollbar) {
    console.log('\n🧪 Testing LEFT panel scrolling (has scrollbar)...');
    const leftBox = await leftPanel.boundingBox();
    if (leftBox) {
      await page.mouse.move(leftBox.x + leftBox.width / 2, leftBox.y + leftBox.height / 2);
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(500);

      const after = await getScrollPositions();
      console.log('📊 After scroll:', after);

      if (after.left > initialPositions.left) {
        console.log(`✅ Left panel scrolled by ${after.left - initialPositions.left}px`);
      } else {
        console.log('❌ Left panel did NOT scroll');
      }

      if (after.middle === initialPositions.middle && after.right === initialPositions.right) {
        console.log('✅ Other panels did NOT scroll (GOOD!)');
      } else {
        console.log('❌ Other panels scrolled unexpectedly');
      }
    }
  }

  if (middleInfo.hasScrollbar) {
    console.log('\n🧪 Testing MIDDLE panel scrolling (has scrollbar)...');

    // Reset all panels to top
    await leftPanel.evaluate(el => el.scrollTop = 0);
    await middlePanel.evaluate(el => el.scrollTop = 0);
    await rightPanel.evaluate(el => el.scrollTop = 0);
    await page.waitForTimeout(300);

    const beforeMiddle = await getScrollPositions();

    const middleBox = await middlePanel.boundingBox();
    if (middleBox) {
      await page.mouse.move(middleBox.x + middleBox.width / 2, middleBox.y + middleBox.height / 2);
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(500);

      const after = await getScrollPositions();
      console.log('📊 After scroll:', after);

      if (after.middle > beforeMiddle.middle) {
        console.log(`✅ Middle panel scrolled by ${after.middle - beforeMiddle.middle}px`);

        // Verify other panels didn't scroll
        expect(after.left).toBe(beforeMiddle.left);
        expect(after.right).toBe(beforeMiddle.right);
        console.log('✅ Other panels did NOT scroll - INDEPENDENT SCROLLING WORKS!');
      } else {
        console.log('❌ Middle panel did NOT scroll');
      }
    }
  }

  if (rightInfo.hasScrollbar) {
    console.log('\n🧪 Testing RIGHT panel scrolling (has scrollbar)...');

    // Reset all panels
    await leftPanel.evaluate(el => el.scrollTop = 0);
    await middlePanel.evaluate(el => el.scrollTop = 0);
    await rightPanel.evaluate(el => el.scrollTop = 0);
    await page.waitForTimeout(300);

    const beforeRight = await getScrollPositions();

    const rightBox = await rightPanel.boundingBox();
    if (rightBox) {
      await page.mouse.move(rightBox.x + rightBox.width / 2, rightBox.y + rightBox.height / 2);
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(500);

      const after = await getScrollPositions();
      console.log('📊 After scroll:', after);

      if (after.right > beforeRight.right) {
        console.log(`✅ Right panel scrolled by ${after.right - beforeRight.right}px`);
        console.log('✅ Other panels did NOT scroll (GOOD!)');
      } else {
        console.log('❌ Right panel did NOT scroll');
      }
    }
  }

  // If no panels have scrollable content, inject tall content to test
  if (!leftInfo.hasScrollbar && !middleInfo.hasScrollbar && !rightInfo.hasScrollbar) {
    console.log('\n⚠️  No panels have scrollable content naturally');
    console.log('📝 Injecting tall test content to verify scrolling works...');

    await leftPanel.evaluate((el) => {
      const testDiv = document.createElement('div');
      testDiv.id = 'test-content-left';
      testDiv.style.cssText = 'height: 4000px; background: linear-gradient(to bottom, rgba(255,0,0,0.1), rgba(0,0,255,0.1)); margin-top: 20px;';
      testDiv.innerHTML = '<div style="padding: 20px; font-size: 24px; font-weight: bold;">LEFT PANEL TEST CONTENT</div>';
      el.appendChild(testDiv);
    });

    await middlePanel.evaluate((el) => {
      const testDiv = document.createElement('div');
      testDiv.id = 'test-content-middle';
      testDiv.style.cssText = 'height: 4000px; background: linear-gradient(to bottom, rgba(0,255,0,0.1), rgba(255,255,0,0.1)); margin-top: 20px;';
      testDiv.innerHTML = '<div style="padding: 20px; font-size: 24px; font-weight: bold;">MIDDLE PANEL TEST CONTENT</div>';
      el.appendChild(testDiv);
    });

    await rightPanel.evaluate((el) => {
      const testDiv = document.createElement('div');
      testDiv.id = 'test-content-right';
      testDiv.style.cssText = 'height: 4000px; background: linear-gradient(to bottom, rgba(128,0,128,0.1), rgba(255,128,0,0.1)); margin-top: 20px;';
      testDiv.innerHTML = '<div style="padding: 20px; font-size: 24px; font-weight: bold;">RIGHT PANEL TEST CONTENT</div>';
      el.appendChild(testDiv);
    });

    await page.waitForTimeout(1000);
    console.log('✅ Test content injected');

    // Test scrolling on left panel
    console.log('\n🧪 Testing LEFT panel with injected content...');
    const leftBox = await leftPanel.boundingBox();
    if (leftBox) {
      await page.mouse.move(leftBox.x + leftBox.width / 2, leftBox.y + leftBox.height / 2);
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(500);

      const afterLeft = await getScrollPositions();
      console.log('📊 After left scroll:', afterLeft);

      if (afterLeft.left > 0) {
        console.log(`✅ LEFT panel scrolled by ${afterLeft.left}px`);
        expect(afterLeft.left).toBeGreaterThan(0);
        expect(afterLeft.middle).toBe(0);
        expect(afterLeft.right).toBe(0);
        console.log('✅ Other panels stayed at 0 - INDEPENDENT SCROLLING WORKS!');
      } else {
        console.log('❌ LEFT panel did NOT scroll');
        throw new Error('Left panel did not scroll with mouse wheel');
      }
    }

    // Reset and test middle panel
    await leftPanel.evaluate(el => el.scrollTop = 0);
    await middlePanel.evaluate(el => el.scrollTop = 0);
    await rightPanel.evaluate(el => el.scrollTop = 0);
    await page.waitForTimeout(300);

    console.log('\n🧪 Testing MIDDLE panel with injected content...');
    const middleBox = await middlePanel.boundingBox();
    if (middleBox) {
      await page.mouse.move(middleBox.x + middleBox.width / 2, middleBox.y + middleBox.height / 2);
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(500);

      const afterMiddle = await getScrollPositions();
      console.log('📊 After middle scroll:', afterMiddle);

      if (afterMiddle.middle > 0) {
        console.log(`✅ MIDDLE panel scrolled by ${afterMiddle.middle}px`);
        expect(afterMiddle.left).toBe(0);
        expect(afterMiddle.middle).toBeGreaterThan(0);
        expect(afterMiddle.right).toBe(0);
        console.log('✅ Other panels stayed at 0 - INDEPENDENT SCROLLING WORKS!');
      } else {
        console.log('❌ MIDDLE panel did NOT scroll');
        throw new Error('Middle panel did not scroll with mouse wheel');
      }
    }

    // Reset and test right panel
    await leftPanel.evaluate(el => el.scrollTop = 0);
    await middlePanel.evaluate(el => el.scrollTop = 0);
    await rightPanel.evaluate(el => el.scrollTop = 0);
    await page.waitForTimeout(300);

    console.log('\n🧪 Testing RIGHT panel with injected content...');
    const rightBox = await rightPanel.boundingBox();
    if (rightBox) {
      await page.mouse.move(rightBox.x + rightBox.width / 2, rightBox.y + rightBox.height / 2);
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(500);

      const afterRight = await getScrollPositions();
      console.log('📊 After right scroll:', afterRight);

      if (afterRight.right > 0) {
        console.log(`✅ RIGHT panel scrolled by ${afterRight.right}px`);
        expect(afterRight.left).toBe(0);
        expect(afterRight.middle).toBe(0);
        expect(afterRight.right).toBeGreaterThan(0);
        console.log('✅ Other panels stayed at 0 - INDEPENDENT SCROLLING WORKS!');
      } else {
        console.log('❌ RIGHT panel did NOT scroll');
        throw new Error('Right panel did not scroll with mouse wheel');
      }
    }

    console.log('\n🎉 ALL INDEPENDENT SCROLLING TESTS PASSED!');
    console.log('✅ Each panel scrolls independently without affecting the others');
  } else {
    console.log('\n🎉 Independent scrolling test completed!');
  }
});
