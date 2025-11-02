import { chromium } from '@playwright/test';
import fs from 'fs';

// Read writer credentials
const writerAuth = JSON.parse(fs.readFileSync('.auth/writer.json', 'utf-8'));

(async () => {
  const browser = await chromium.launch({ headless: false });

  // Create context with writer cookies
  const context = await browser.newContext();
  await context.addCookies(writerAuth.cookies);

  const page = await context.newPage();

  // Collect console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    // Print structure-related logs
    if (text.includes('[CLIENT]') || text.includes('Processing') || text.includes('parts') || text.includes('chapters') || text.includes('tree')) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  console.log('=== Using writer@fictures.xyz authentication ===\n');

  // Try to navigate directly to studio page with cookies
  console.log('Navigating to studio page...');
  await page.goto('http://localhost:3000/studio/edit/story/kfiNwbdYD2BAnC7IAyjps');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const url = page.url();
  console.log(`\nCurrent URL: ${url}`);

  if (url.includes('/login')) {
    console.log('\n❌ Redirected to login - session expired. Logging in...\n');

    // Login programmatically
    await page.fill('input[type="email"]', writerAuth.email);
    await page.fill('input[type="password"]', writerAuth.password);
    await page.click('button:has-text("Sign in with Email")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to studio page again
    await page.goto('http://localhost:3000/studio/edit/story/kfiNwbdYD2BAnC7IAyjps');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  }

  console.log('✅ On studio page!\n');

  // Check for tree structure
  console.log('=== Checking sidebar tree structure ===\n');

  const parts = await page.locator('text=/Part|Act/i').count();
  const chapters = await page.locator('text=/Chapter/i').count();
  const scenes = await page.locator('text=/Scene/i').count();

  console.log(`Tree elements found:`);
  console.log(`  Parts: ${parts}`);
  console.log(`  Chapters: ${chapters}`);
  console.log(`  Scenes: ${scenes}`);

  if (parts === 0 && chapters === 0 && scenes === 0) {
    console.log('\n❌ NO TREE ELEMENTS FOUND - This is the bug!\n');

    // Check what's in the left sidebar
    const leftPanelText = await page.locator('.overflow-y-auto').first().textContent();
    console.log('Left sidebar content (first 500 chars):');
    console.log(leftPanelText?.substring(0, 500));
    console.log('\n');
  }

  // Get all structure-related console logs
  const structureLogs = logs.filter(log =>
    log.includes('[CLIENT]') ||
    log.includes('parts') ||
    log.includes('chapters') ||
    log.includes('Processing') ||
    log.includes('tree')
  );

  console.log(`\n=== Browser Console Logs (${structureLogs.length} structure-related) ===`);
  structureLogs.forEach(log => console.log(log));

  // Take screenshot
  await page.screenshot({ path: 'logs/sidebar-issue.png', fullPage: true });
  console.log('\n📸 Screenshot saved to: logs/sidebar-issue.png');

  // Keep browser open for manual inspection
  console.log('\n⏸️  Browser staying open for 30 seconds for inspection...');
  await page.waitForTimeout(30000);

  await browser.close();
})();
