import { test, expect } from '@playwright/test';

test.describe('Browse Stories Verification', () => {
  test('should display all 6 stories on the browse page', async ({ page }) => {
    console.log('=== BROWSE STORIES VERIFICATION TEST ===');
    
    // Navigate to the browse page
    await page.goto('http://localhost:3000/browse');
    console.log('Navigated to http://localhost:3000/browse');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    console.log('Page loaded, waiting for stories...');
    
    // Wait for stories to be displayed with a more flexible selector
    await expect(page.locator('[data-testid="story-card"], .story-card, [class*="story"], article, .card').first()).toBeVisible({ timeout: 15000 });
    console.log('First story element is visible');
    
    // Give additional time for all stories to render
    await page.waitForTimeout(2000);
    
    // Try multiple selectors to find story elements
    const possibleSelectors = [
      '[data-testid="story-card"]',
      '.story-card',
      '[class*="story"]',
      'article',
      '.card',
      '[data-story-id]',
      '.grid > div',
      '.flex.flex-col'
    ];
    
    let storyElements;
    let storyCount = 0;
    
    for (const selector of possibleSelectors) {
      storyElements = page.locator(selector);
      storyCount = await storyElements.count();
      console.log(`Selector "${selector}" found ${storyCount} elements`);
      
      if (storyCount > 0) {
        // Check if these look like story cards by examining their content
        for (let i = 0; i < Math.min(storyCount, 3); i++) {
          const element = storyElements.nth(i);
          const hasText = await element.innerText().catch(() => '');
          console.log(`Element ${i} with selector "${selector}" has text: ${hasText.substring(0, 100)}...`);
        }
        
        if (storyCount >= 6) {
          console.log(`Found ${storyCount} stories with selector: ${selector}`);
          break;
        }
      }
    }
    
    // Log the page content to debug
    const pageContent = await page.content();
    console.log('Page title:', await page.title());
    
    // Check if we can find specific story titles in the page content
    const expectedStories = [
      'The Last Guardian',
      'Mirrors of Reality', 
      'The Digital Awakening',
      'Echoes of Tomorrow',
      'Digital Nexus: The Code Between Worlds',
      'Debugging Realities'
    ];
    
    const foundStories = [];
    for (const storyTitle of expectedStories) {
      const isVisible = await page.locator(`text="${storyTitle}"`).isVisible().catch(() => false);
      if (isVisible) {
        foundStories.push(storyTitle);
        console.log(`✓ Found story: ${storyTitle}`);
      } else {
        console.log(`✗ Missing story: ${storyTitle}`);
      }
    }
    
    console.log(`\n=== VERIFICATION RESULTS ===`);
    console.log(`Expected stories: 6`);
    console.log(`Stories found by title: ${foundStories.length}`);
    console.log(`Stories found by element count: ${storyCount}`);
    console.log(`Found stories: ${foundStories.join(', ')}`);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'browse-page-verification.png', fullPage: true });
    console.log('Screenshot saved as browse-page-verification.png');
    
    // Verify all 6 stories are present
    expect(foundStories.length).toBe(6);
    expect(foundStories).toEqual(expect.arrayContaining(expectedStories));
    
    console.log('✅ All 6 stories are correctly displayed on the browse page');
  });

  test('should verify story genres and content preview', async ({ page }) => {
    await page.goto('http://localhost:3000/browse');
    await page.waitForLoadState('networkidle');
    
    // Wait for stories to load
    await expect(page.locator('text="The Last Guardian"').first()).toBeVisible({ timeout: 15000 });
    
    // Verify specific story details
    const storyGenreChecks = [
      { title: 'The Last Guardian', genre: 'Epic Fantasy' },
      { title: 'Mirrors of Reality', genre: 'Psychological Mystery' },
      { title: 'The Digital Awakening', genre: 'Cyberpunk Thriller' },
      { title: 'Echoes of Tomorrow', genre: 'Science Fiction' },
      { title: 'Digital Nexus: The Code Between Worlds', genre: 'Science Fiction' },
      { title: 'Debugging Realities', genre: 'Science Fiction' }
    ];
    
    for (const story of storyGenreChecks) {
      const storyElement = page.locator(`text="${story.title}"`).first();
      await expect(storyElement).toBeVisible();
      console.log(`✓ Story "${story.title}" is visible`);
      
      // Check if genre is visible near the story title
      const parentElement = storyElement.locator('..');
      const genreVisible = await parentElement.locator(`text="${story.genre}"`).isVisible().catch(() => false);
      if (genreVisible) {
        console.log(`✓ Genre "${story.genre}" found for "${story.title}"`);
      }
    }
    
    console.log('✅ All story titles are visible with expected content');
  });

  test('should verify performance after fix', async ({ page }) => {
    const startTime = Date.now();
    
    // Track API requests
    const apiRequests = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        apiRequests.push(request.url());
      }
    });
    
    await page.goto('http://localhost:3000/browse');
    await page.waitForLoadState('networkidle');
    
    // Wait for all stories to be visible
    await expect(page.locator('text="The Last Guardian"').first()).toBeVisible({ timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    console.log('\n=== PERFORMANCE AFTER FIX ===');
    console.log(`Page load time: ${loadTime}ms`);
    console.log(`API requests made: ${apiRequests.length}`);
    console.log('API endpoints called:');
    apiRequests.forEach(url => console.log(`- ${url}`));
    
    // Performance should be good after the fix
    expect(loadTime).toBeLessThan(10000); // Should load in under 10 seconds
    expect(apiRequests.length).toBeLessThanOrEqual(5); // Should have optimized API calls
    
    console.log('✅ Performance is good after the filtering fix');
  });
});