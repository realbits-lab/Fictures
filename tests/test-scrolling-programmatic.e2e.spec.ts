import { test, expect } from '@playwright/test';
import fs from 'fs';

/**
 * Test independent scrolling by programmatically setting scrollTop
 * This verifies the CSS allows scrolling even if mouse wheel doesn't work
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

  await page.waitForURL(/\/(novels|studio|comics|community)/, { timeout: 10000 });
  await page.waitForTimeout(2000);

  console.log('Login completed');
}

test('Test CSS allows scrolling with programmatic scroll', async ({ page }) => {
  test.setTimeout(120000);

  console.log('🔍 Testing if CSS allows programmatic scrolling...');

  await login(page);

  await page.goto('http://localhost:3000/studio/edit/story/qMH4sJmFTlB6KmdR0C6Uu');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  console.log('✅ On story editor page');

  // Click on first scene
  const clickableItems = page.locator('.cursor-pointer').filter({ has: page.locator('text=/scene|chapter|whispers|shadows|captain/i') });
  const itemCount = await clickableItems.count();
  if (itemCount > 0) {
    await clickableItems.first().click();
    await page.waitForTimeout(2000);
  }

  const leftPanel = page.locator('div.flex-1.min-h-0.pr-2.overflow-y-auto').first();
  const middlePanel = page.locator('div.flex-1.min-h-0.px-2.overflow-y-auto').first();
  const rightPanel = page.locator('div.flex-1.min-h-0.pl-2.overflow-y-auto').first();

  await expect(leftPanel).toBeVisible();
  await expect(middlePanel).toBeVisible();
  await expect(rightPanel).toBeVisible();

  console.log('✅ All three panels visible');

  // Inject tall content
  console.log('\n📝 Injecting tall test content...');

  await leftPanel.evaluate((el) => {
    const testDiv = document.createElement('div');
    testDiv.id = 'test-left';
    testDiv.style.cssText = 'height: 5000px; background: linear-gradient(red, blue); opacity: 0.3;';
    el.appendChild(testDiv);
  });

  await middlePanel.evaluate((el) => {
    const testDiv = document.createElement('div');
    testDiv.id = 'test-middle';
    testDiv.style.cssText = 'height: 5000px; background: linear-gradient(green, yellow); opacity: 0.3;';
    el.appendChild(testDiv);
  });

  await rightPanel.evaluate((el) => {
    const testDiv = document.createElement('div');
    testDiv.id = 'test-right';
    testDiv.style.cssText = 'height: 5000px; background: linear-gradient(purple, orange); opacity: 0.3;';
    el.appendChild(testDiv);
  });

  await page.waitForTimeout(1000);
  console.log('✅ Test content injected');

  // Test 1: Programmatically scroll left panel
  console.log('\n🧪 Test 1: Programmatically scrolling LEFT panel...');

  await leftPanel.evaluate(el => { el.scrollTop = 500; });
  await page.waitForTimeout(300);

  const afterLeft = await leftPanel.evaluate(el => el.scrollTop);
  const afterMiddle1 = await middlePanel.evaluate(el => el.scrollTop);
  const afterRight1 = await rightPanel.evaluate(el => el.scrollTop);

  console.log(`Left panel scrollTop: ${afterLeft}`);
  console.log(`Middle panel scrollTop: ${afterMiddle1}`);
  console.log(`Right panel scrollTop: ${afterRight1}`);

  if (afterLeft === 500) {
    console.log('✅ LEFT panel CSS allows scrolling!');
    expect(afterLeft).toBe(500);
    expect(afterMiddle1).toBe(0);
    expect(afterRight1).toBe(0);
    console.log('✅ Other panels stayed at 0 - INDEPENDENT!');
  } else {
    console.log(`❌ LEFT panel scrollTop is ${afterLeft}, expected 500`);
    throw new Error('Left panel CSS does not allow scrolling');
  }

  // Reset
  await leftPanel.evaluate(el => { el.scrollTop = 0; });
  await middlePanel.evaluate(el => { el.scrollTop = 0; });
  await rightPanel.evaluate(el => { el.scrollTop = 0; });
  await page.waitForTimeout(300);

  // Test 2: Programmatically scroll middle panel
  console.log('\n🧪 Test 2: Programmatically scrolling MIDDLE panel...');

  await middlePanel.evaluate(el => { el.scrollTop = 500; });
  await page.waitForTimeout(300);

  const afterLeft2 = await leftPanel.evaluate(el => el.scrollTop);
  const afterMiddle2 = await middlePanel.evaluate(el => el.scrollTop);
  const afterRight2 = await rightPanel.evaluate(el => el.scrollTop);

  console.log(`Left panel scrollTop: ${afterLeft2}`);
  console.log(`Middle panel scrollTop: ${afterMiddle2}`);
  console.log(`Right panel scrollTop: ${afterRight2}`);

  if (afterMiddle2 === 500) {
    console.log('✅ MIDDLE panel CSS allows scrolling!');
    expect(afterLeft2).toBe(0);
    expect(afterMiddle2).toBe(500);
    expect(afterRight2).toBe(0);
    console.log('✅ Other panels stayed at 0 - INDEPENDENT!');
  } else {
    console.log(`❌ MIDDLE panel scrollTop is ${afterMiddle2}, expected 500`);
    throw new Error('Middle panel CSS does not allow scrolling');
  }

  // Reset
  await leftPanel.evaluate(el => { el.scrollTop = 0; });
  await middlePanel.evaluate(el => { el.scrollTop = 0; });
  await rightPanel.evaluate(el => { el.scrollTop = 0; });
  await page.waitForTimeout(300);

  // Test 3: Programmatically scroll right panel
  console.log('\n🧪 Test 3: Programmatically scrolling RIGHT panel...');

  await rightPanel.evaluate(el => { el.scrollTop = 500; });
  await page.waitForTimeout(300);

  const afterLeft3 = await leftPanel.evaluate(el => el.scrollTop);
  const afterMiddle3 = await middlePanel.evaluate(el => el.scrollTop);
  const afterRight3 = await rightPanel.evaluate(el => el.scrollTop);

  console.log(`Left panel scrollTop: ${afterLeft3}`);
  console.log(`Middle panel scrollTop: ${afterMiddle3}`);
  console.log(`Right panel scrollTop: ${afterRight3}`);

  if (afterRight3 === 500) {
    console.log('✅ RIGHT panel CSS allows scrolling!');
    expect(afterLeft3).toBe(0);
    expect(afterMiddle3).toBe(0);
    expect(afterRight3).toBe(500);
    console.log('✅ Other panels stayed at 0 - INDEPENDENT!');
  } else {
    console.log(`❌ RIGHT panel scrollTop is ${afterRight3}, expected 500`);
    throw new Error('Right panel CSS does not allow scrolling');
  }

  console.log('\n🎉 ALL CSS SCROLLING TESTS PASSED!');
  console.log('✅ CSS configuration is correct - panels can scroll independently');
  console.log('⚠️  Note: Mouse wheel scrolling in real browser should work with this CSS');
});
