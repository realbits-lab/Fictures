import { chromium } from '@playwright/test';

// Read credentials from .auth/user.json
import fs from 'fs';
const authData = JSON.parse(fs.readFileSync('.auth/user.json', 'utf-8'));
const writerProfile = authData.profiles.writer;

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    // Print structure-related logs
    if (text.includes('Processing') || text.includes('parts') || text.includes('chapters') || text.includes('[CLIENT]')) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  console.log('=== Logging in with writer@fictures.xyz ===\n');

  // Navigate to login page
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');

  // Fill in email
  await page.fill('input[type="email"]', writerProfile.email);

  // Note: We need the password - check if it's stored somewhere
  console.log(`Email filled: ${writerProfile.email}`);
  console.log('\n⚠️  Password needed - please provide writer@fictures.xyz password');
  console.log('Or use Google OAuth by clicking the Google button\n');

  // For now, let's try to use the session cookies from .auth/user.json
  await context.addCookies(writerProfile.cookies);

  // Try to navigate directly to studio page
  console.log('=== Navigating to studio page with cookies ===\n');
  await page.goto('http://localhost:3000/studio/edit/story/kfiNwbdYD2BAnC7IAyjps');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const url = page.url();
  console.log(`\nCurrent URL: ${url}`);

  if (url.includes('/login')) {
    console.log('❌ Still on login page - session cookies expired');
    console.log('\n💡 Solution: Use one of these methods:');
    console.log('  1. Run: node scripts/capture-writer-auth.mjs');
    console.log('  2. Or manually log in and capture session');
    await browser.close();
    return;
  }

  console.log('✅ Successfully authenticated!\n');

  // Check for tree structure
  console.log('=== Checking sidebar tree structure ===\n');

  const parts = await page.locator('text=/Part|Act/i').count();
  const chapters = await page.locator('text=/Chapter/i').count();
  const scenes = await page.locator('text=/Scene/i').count();

  console.log(`Parts found: ${parts}`);
  console.log(`Chapters found: ${chapters}`);
  console.log(`Scenes found: ${scenes}`);

  // Get all structure logs
  const structureLogs = logs.filter(log =>
    log.includes('parts') ||
    log.includes('chapters') ||
    log.includes('Processing') ||
    log.includes('[CLIENT]')
  );

  console.log(`\n=== Structure Logs (${structureLogs.length}) ===`);
  structureLogs.forEach(log => console.log(log));

  // Keep browser open for inspection
  console.log('\n⏸️  Browser staying open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);

  await browser.close();
})();
