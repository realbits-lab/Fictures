import { test, expect } from '@playwright/test';
import fs from 'fs';

/**
 * Manual test for scrolling functionality - runs in headed mode
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
  await page.waitForTimeout(2000);

  console.log('Login completed');
}

test('Manual scrolling test - check panels in headed mode', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes timeout

  console.log('🔍 Starting manual scrolling test...');

  await login(page);

  // Navigate to studio
  await page.goto('/studio');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('📍 On studio page');

  // Find and click first story (using actual card structure from StoryGrid)
  const storyCard = page.locator('div.cursor-pointer.rounded-lg.shadow-sm').first();
  const storyCount = await storyCard.count();

  console.log(`Found ${storyCount} stories`);

  if (storyCount > 0) {
    console.log('Clicking first story...');
    await storyCard.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('📍 On story editor page');

    // Check for panel content divs (the ones with overflow-y-auto)
    const panels = page.locator('div.overflow-y-auto');
    const panelCount = await panels.count();

    console.log(`Found ${panelCount} scrollable divs`);

    // Log panel overflow styles
    for (let i = 0; i < panelCount; i++) {
      const panel = panels.nth(i);
      const overflowY = await panel.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          overflowY: styles.overflowY,
          height: styles.height,
          maxHeight: styles.maxHeight,
          className: el.className,
        };
      });

      console.log(`Scrollable div ${i + 1} styles:`, overflowY);
    }

    // Wait for manual inspection
    console.log('\n⏸️  Pausing for 30 seconds for manual inspection...');
    console.log('📝 Check if you can scroll in each panel independently\n');

    await page.waitForTimeout(30000);

    console.log('✅ Manual test completed');
  } else {
    console.log('⚠️  No stories found');
  }
});
