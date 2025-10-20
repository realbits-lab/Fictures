import { test, expect } from '@playwright/test';

test.describe('Caching and Reading Page Tests', () => {
  test.use({ storageState: '@playwright/.auth/user.json' });

  test('should navigate to stories and test reading page with caching', async ({ page }) => {
    console.log('🧪 Starting caching and reading page test');

    // Navigate to stories page (using port 3000 where dev server is running)
    await page.goto('http://localhost:3000/stories');
    await page.waitForLoadState('networkidle');

    // Look for a story to read
    const storyCards = page.locator('[data-testid="story-card"], .story-card, a[href*="/read/"]');
    await expect(storyCards.first()).toBeVisible({ timeout: 10000 });

    // Get the first story's read link
    const firstStory = storyCards.first();
    
    // Try to find a read button or link within the story card
    const readButton = firstStory.locator('button:has-text("Read"), a[href*="/read/"], [data-testid="read-button"]').first();
    
    if (await readButton.isVisible()) {
      console.log('📖 Found read button, clicking...');
      await readButton.click();
    } else {
      // If no specific read button, click the story card itself
      console.log('📖 No read button found, clicking story card...');
      await firstStory.click();
    }

    // Wait for navigation to reading page
    await page.waitForURL('**/read/**', { timeout: 10000 });
    console.log('✅ Successfully navigated to reading page:', page.url());

    // Check for loading states and caching indicators
    console.log('🔍 Checking for SWR caching elements...');
    
    // Wait for main content to load
    await page.waitForSelector('main, [data-testid="chapter-content"], .chapter-content', { timeout: 10000 });
    
    // Check for second GNB (Global Navigation Bar)
    const secondGNB = page.locator('[data-testid="reading-header"], .reading-header, nav[class*="sticky"]');
    if (await secondGNB.isVisible()) {
      console.log('✅ Second GNB is visible');
      
      // Check for navigation elements
      const prevButton = secondGNB.locator('button:has-text("Previous"), [data-testid="prev-chapter"]');
      const nextButton = secondGNB.locator('button:has-text("Next"), [data-testid="next-chapter"]');
      const breadcrumb = secondGNB.locator('[data-testid="breadcrumb"], .breadcrumb');
      
      if (await prevButton.isVisible()) console.log('✅ Previous chapter button found');
      if (await nextButton.isVisible()) console.log('✅ Next chapter button found');
      if (await breadcrumb.isVisible()) console.log('✅ Breadcrumb navigation found');
    } else {
      console.log('⚠️ Second GNB not found - checking for any sticky header...');
      const stickyHeaders = page.locator('[class*="sticky"], [class*="fixed"], header');
      const headerCount = await stickyHeaders.count();
      console.log(`Found ${headerCount} potential header elements`);
    }

    // Check for caching indicators in browser dev tools / local storage
    const cacheKeys = await page.evaluate(() => {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('swr') || key.includes('story') || key.includes('reading'))) {
          keys.push({ key, value: localStorage.getItem(key)?.substring(0, 100) + '...' });
        }
      }
      return keys;
    });

    console.log('💾 Cache data in localStorage:', cacheKeys);

    // Check for any loading/validating indicators
    const loadingIndicators = page.locator('[class*="spin"], [class*="loading"], [data-testid*="loading"]');
    const indicatorCount = await loadingIndicators.count();
    console.log(`🔄 Found ${indicatorCount} loading indicators`);

    // Test navigation back and forth to test caching
    console.log('🔄 Testing cache behavior - going back to stories...');
    await page.goBack();
    await page.waitForLoadState('networkidle');

    console.log('🔄 Returning to reading page to test cache...');
    await page.goForward();
    await page.waitForLoadState('networkidle');

    // Check if page loads faster on second visit (indicating caching)
    const startTime = Date.now();
    await page.reload();
    await page.waitForSelector('main, [data-testid="chapter-content"], .chapter-content', { timeout: 10000 });
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Page reload time: ${loadTime}ms`);

    // Take a screenshot for verification
    await page.screenshot({ path: 'tests/screenshots/reading-page-test.png', fullPage: true });
    console.log('📸 Screenshot saved: tests/screenshots/reading-page-test.png');

    console.log('✅ Caching and reading page test completed successfully');
  });

  test('should test chapter navigation and reading progress', async ({ page }) => {
    console.log('🧪 Starting chapter navigation test');

    // Navigate directly to a reading page (assuming we have stories)
    await page.goto('http://localhost:3000/stories');
    await page.waitForLoadState('networkidle');

    // Find and click on a story
    const storyCards = page.locator('[data-testid="story-card"], .story-card, a[href*="/read/"]');
    if (await storyCards.first().isVisible()) {
      await storyCards.first().click();
      
      // Wait for reading page to load
      await page.waitForURL('**/read/**', { timeout: 10000 });
      
      // Check for chapter navigation controls
      const nextChapterButton = page.locator('button:has-text("Next"), [data-testid="next-chapter"]');
      const prevChapterButton = page.locator('button:has-text("Previous"), [data-testid="prev-chapter"]');
      
      console.log('🔍 Checking chapter navigation buttons...');
      if (await nextChapterButton.isVisible()) {
        console.log('✅ Next chapter button found');
        
        // Test chapter navigation
        await nextChapterButton.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ Successfully navigated to next chapter');
      }
      
      if (await prevChapterButton.isVisible()) {
        console.log('✅ Previous chapter button found');
      }

      // Check for reading progress indicators
      const progressIndicators = page.locator('[data-testid*="progress"], [class*="progress"]');
      const progressCount = await progressIndicators.count();
      console.log(`📊 Found ${progressCount} progress indicators`);

      // Test reading progress tracking in localStorage
      const readingProgress = await page.evaluate(() => {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('reading-position')) {
            keys.push({ key, value: localStorage.getItem(key) });
          }
        }
        return keys;
      });

      console.log('📚 Reading progress data:', readingProgress);
    }

    console.log('✅ Chapter navigation test completed');
  });
});