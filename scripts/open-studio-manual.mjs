import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[CLIENT]') || text.includes('Processing') || text.includes('parts') || text.includes('chapters')) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  // Navigate to login
  console.log('\n=== Please log in with writer@fictures.xyz ===');
  console.log('Password: (use the one you know or use Google OAuth)\n');
  await page.goto('http://localhost:3000/login');

  // Wait for user to log in (check for URL change away from login)
  console.log('⏳ Waiting for login (up to 2 minutes)...\n');
  try {
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 120000 });
  } catch (e) {
    console.log('❌ Login timeout. Please try again.');
    await browser.close();
    return;
  }

  console.log('✅ Logged in! Navigating to studio page...\n');

  // Navigate to studio page
  await page.goto('http://localhost:3000/studio/edit/story/kfiNwbdYD2BAnC7IAyjps');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('\n📊 Page loaded!');
  console.log('\n=== Check left sidebar for tree structure ===');
  console.log('Expected: Story → Parts → Chapters → Scenes');
  console.log('\n⏸️  Browser will stay open for 60 seconds. Inspect the sidebar.\n');

  // Count elements after page load
  const parts = await page.locator('text=/Part|Act/i').count();
  const chapters = await page.locator('text=/Chapter/i').count();
  const scenes = await page.locator('text=/Scene/i').count();

  console.log(`\nElements found:`);
  console.log(`  Parts: ${parts}`);
  console.log(`  Chapters: ${chapters}`);
  console.log(`  Scenes: ${scenes}\n`);

  if (parts === 0 && chapters === 0 && scenes === 0) {
    console.log('⚠️  NO TREE ELEMENTS FOUND!');
    console.log('This confirms the sidebar tree is not rendering.\n');
  }

  // Keep open for inspection
  await page.waitForTimeout(60000);

  await browser.close();
})();
