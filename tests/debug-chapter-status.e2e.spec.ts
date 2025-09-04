import { test, expect } from '@playwright/test';

test.describe('Debug Chapter Status and Visibility', () => {

  test('Debug: Check actual chapter statuses and filtering logic', async ({ page }) => {
    console.log('🕵️ Debugging chapter status visibility...');

    // Navigate to the working story
    await page.goto('http://localhost:3000/read/78YZmbHM-Kp766Qp06XKa');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if chapter reader loaded
    const chapterReader = await page.locator('[data-testid="chapter-reader"]').count();
    console.log(`Chapter reader found: ${chapterReader > 0}`);

    if (chapterReader > 0) {
      // Get all chapter buttons and their details
      const chapterButtons = page.locator('.w-80 button');
      const chapterCount = await chapterButtons.count();
      console.log(`\n📊 Found ${chapterCount} chapters in sidebar`);

      // Extract detailed information about each chapter
      for (let i = 0; i < chapterCount; i++) {
        const chapterButton = chapterButtons.nth(i);
        const statusIcon = chapterButton.locator('span').first();
        const statusIconText = await statusIcon.textContent();
        const fullChapterText = await chapterButton.textContent();
        
        // Parse chapter number and title from the text
        const chapterMatch = fullChapterText?.match(/Ch (\d+): (.+?)(\d+ words)?$/);
        const chapterNum = chapterMatch ? chapterMatch[1] : 'unknown';
        const chapterTitle = chapterMatch ? chapterMatch[2].trim() : fullChapterText?.substring(0, 30);
        
        console.log(`\n📖 Chapter ${chapterNum}: "${chapterTitle}"`);
        console.log(`   Status Icon: "${statusIconText}" (${getStatusMeaning(statusIconText || '')})`);
        console.log(`   Full Text: ${fullChapterText?.substring(0, 80)}...`);
        
        // Document what we expect vs what we see
        if (statusIconText === '🚀') {
          console.log('   ✅ Published - should be visible to all users');
        } else {
          console.log(`   ⚠️  Non-published (${statusIconText}) - should only be visible to owner!`);
        }
      }

      // Try to access the page source to see if we can find debugging info
      const pageSource = await page.content();
      const hasOwnershipInfo = pageSource.includes('isOwner') || pageSource.includes('userId');
      console.log(`\n🔍 Page contains ownership debug info: ${hasOwnershipInfo}`);

      // Check if user is logged in
      const signInButton = await page.locator('text=/sign in|login/i').count();
      const userLoggedIn = signInButton === 0;
      console.log(`👤 User appears logged in: ${userLoggedIn}`);

      // Add debugging JavaScript to the page
      const debugInfo = await page.evaluate(() => {
        // Try to access any global variables or React dev tools info
        const possibleOwnership = {
          hasReactDevTools: typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined',
          windowKeys: Object.keys(window).filter(k => k.includes('react') || k.includes('next')).slice(0, 5),
          hasSessionStorage: typeof window.sessionStorage !== 'undefined',
          hasLocalStorage: typeof window.localStorage !== 'undefined'
        };
        return possibleOwnership;
      });
      
      console.log('\n🛠️  Debug environment:', debugInfo);

    } else {
      console.log('❌ No chapter reader found');
    }

    // Take detailed screenshots
    await page.screenshot({ 
      path: 'test-results/debug-chapter-status-full.png',
      fullPage: true 
    });
  });

  test('Debug: Compare logged in vs logged out access', async ({ page }) => {
    console.log('🔐 Testing access patterns...');

    const storyId = '78YZmbHM-Kp766Qp06XKa';
    
    // First test - not logged in
    console.log('\n--- Testing as non-authenticated user ---');
    await page.goto(`http://localhost:3000/read/${storyId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const loggedOutChapters = await page.locator('.w-80 button').count();
    const loggedOutStatuses = [];
    
    for (let i = 0; i < Math.min(loggedOutChapters, 5); i++) {
      const button = page.locator('.w-80 button').nth(i);
      const icon = await button.locator('span').first().textContent();
      loggedOutStatuses.push(icon);
    }
    
    console.log(`Non-auth user sees ${loggedOutChapters} chapters with statuses: [${loggedOutStatuses.join(', ')}]`);

    // Check if redirected to login
    const currentUrl = page.url();
    const redirectedToLogin = currentUrl.includes('/login');
    console.log(`Redirected to login: ${redirectedToLogin}`);

    if (redirectedToLogin) {
      console.log('🔐 Authentication required - cannot test non-owner access');
    }
  });

  function getStatusMeaning(icon: string): string {
    switch (icon) {
      case '🚀': return 'Published';
      case '✅': return 'Completed';
      case '🔄': return 'In Progress';
      case '📝': return 'Draft';
      default: return 'Unknown';
    }
  }
});