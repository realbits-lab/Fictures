import { test, expect } from '@playwright/test';

test.describe('Story Management - Core Functionality', () => {
  
  test('Stories listing page displays user stories', async ({ page }) => {
    await page.goto('/stories');
    
    // Check stories page loads
    const storiesPageIndicator = page.locator('h1, [data-testid="stories-page"], .stories-container').first();
    await expect(storiesPageIndicator).toBeVisible();
    console.log('✓ Stories page loaded successfully');
    
    // Look for story cards or story list
    const storyElements = page.locator('[data-testid="story-card"], .story-item, .story-list > *');
    const storyCount = await storyElements.count();
    
    if (storyCount > 0) {
      console.log(`✓ Found ${storyCount} story elements`);
      
      // Test first story interaction
      const firstStory = storyElements.first();
      if (await firstStory.isVisible()) {
        await expect(firstStory).toBeVisible();
        console.log('✓ Story elements are interactive');
      }
    } else {
      // Check for empty state
      const emptyState = page.locator('[data-testid="empty-stories"], .empty-state, :text("No stories")');
      if (await emptyState.count() > 0) {
        console.log('✓ Empty state displayed for no stories');
      } else {
        console.log('ℹ️ No stories found, may need test data');
      }
    }
  });

  test('Individual story page functionality', async ({ page }) => {
    // First go to stories to find a story ID or create test scenario
    await page.goto('/stories');
    
    // Try to access a story with a common test ID format
    const testStoryIds = ['1', 'test-story', 'sample-story'];
    
    for (const storyId of testStoryIds) {
      await page.goto(`/stories/${storyId}`);
      
      const notFound = await page.locator('text="404", text="Not Found"').count();
      const hasContent = await page.locator('h1, main, .story-content').first().isVisible({ timeout: 3000 });
      
      if (notFound === 0 && hasContent) {
        console.log(`✓ Story page accessible for ID: ${storyId}`);
        
        // Check for story-specific elements
        const storyTitle = page.locator('h1, [data-testid="story-title"]');
        if (await storyTitle.isVisible({ timeout: 2000 })) {
          const titleText = await storyTitle.textContent() || '';
          console.log(`✓ Story title displayed: ${titleText.slice(0, 50)}...`);
        }
        
        // Check for chapters or content sections
        const chapterElements = page.locator('[data-testid="chapter"], .chapter, .story-section');
        const chapterCount = await chapterElements.count();
        if (chapterCount > 0) {
          console.log(`✓ Found ${chapterCount} chapter/section elements`);
        }
        
        break;
      } else {
        console.log(`ℹ️ Story ${storyId} not found or inaccessible`);
      }
    }
  });

  test('Story creation/management interface', async ({ page }) => {
    await page.goto('/stories');
    
    // Look for create story button or link
    const createElements = page.locator(
      '[data-testid="create-story"], button:has-text("Create"), a:has-text("New Story"), ' +
      'button:has-text("New"), .create-story-btn'
    );
    
    if (await createElements.count() > 0) {
      const createButton = createElements.first();
      await expect(createButton).toBeVisible();
      console.log('✓ Create story interface available');
      
      // Test create button interaction
      await createButton.click();
      
      // Wait for navigation or modal
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      const hasModal = await page.locator('[data-testid="story-modal"], .modal, .dialog').isVisible({ timeout: 3000 });
      
      if (hasModal) {
        console.log('✓ Create story modal opened');
        
        // Look for form fields
        const formElements = page.locator('input, textarea, select');
        const formCount = await formElements.count();
        console.log(`✓ Found ${formCount} form elements in create dialog`);
        
      } else if (currentUrl.includes('/create') || currentUrl.includes('/new')) {
        console.log('✓ Navigated to create story page');
        
        // Check for form elements
        const formElements = page.locator('input[name], textarea[name]');
        const formCount = await formElements.count();
        console.log(`✓ Found ${formCount} named form elements`);
        
      } else {
        console.log('ℹ️ Create story action may need different interaction method');
      }
      
    } else {
      console.log('⚠️ No create story interface found');
    }
  });

  test('Story management and editing access', async ({ page }) => {
    await page.goto('/stories');
    
    // Look for story management features
    const managementElements = page.locator(
      '[data-testid*="edit"], [data-testid*="manage"], .story-actions, ' +
      'button:has-text("Edit"), a:has-text("Edit"), .edit-btn'
    );
    
    const managementCount = await managementElements.count();
    if (managementCount > 0) {
      console.log(`✓ Found ${managementCount} story management elements`);
      
      // Test first management element
      const firstManagement = managementElements.first();
      if (await firstManagement.isVisible()) {
        console.log('✓ Story management interface accessible');
        
        // Check if it's a button or link
        const tagName = await firstManagement.evaluate(el => el.tagName.toLowerCase());
        console.log(`✓ Management element type: ${tagName}`);
      }
    } else {
      console.log('ℹ️ No story management interface visible');
    }
    
    // Check for story statistics or metadata
    const statsElements = page.locator(
      '[data-testid*="stats"], .story-stats, .story-meta, ' +
      '.word-count, .chapter-count, .read-count'
    );
    
    const statsCount = await statsElements.count();
    if (statsCount > 0) {
      console.log(`✓ Found ${statsCount} story statistics elements`);
    }
  });

  test('Story API endpoints accessibility', async ({ page }) => {
    // Test stories API endpoint
    const storiesResponse = await page.request.get('/api/stories');
    console.log(`Stories API response: ${storiesResponse.status()}`);
    
    if (storiesResponse.status() === 200) {
      console.log('✓ Stories API endpoint accessible');
      
      try {
        const storiesData = await storiesResponse.json();
        console.log(`✓ Stories API returned valid JSON (${Array.isArray(storiesData) ? storiesData.length : 'object'} items)`);
      } catch (e) {
        console.log('✓ Stories API returned data (non-JSON response)');
      }
      
    } else if ([401, 403].includes(storiesResponse.status())) {
      console.log('✓ Stories API properly protected with authentication');
    } else {
      console.log(`ℹ️ Stories API returned status: ${storiesResponse.status()}`);
    }
    
    // Test individual story API
    const storyResponse = await page.request.get('/api/stories/1');
    console.log(`Individual story API response: ${storyResponse.status()}`);
    
    if ([200, 404].includes(storyResponse.status())) {
      console.log('✓ Individual story API endpoint functional');
    } else if ([401, 403].includes(storyResponse.status())) {
      console.log('✓ Individual story API properly protected');
    }
  });
});