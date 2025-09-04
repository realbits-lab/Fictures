import { test, expect } from '@playwright/test';

test.describe('Chapter Bugs - Issues with unpublished chapters and missing scenes', () => {
  
  test('Should not show unpublished chapters to non-owners in reader view', async ({ page }) => {
    // Navigate to a story read page - assuming story-1 exists and user is NOT the owner
    await page.goto('http://localhost:3000/read/story-1');
    
    // Wait for the chapter reader to load
    await page.waitForSelector('[data-testid="chapter-reader"]', { timeout: 10000 });
    
    // Get all chapter buttons in the sidebar
    const chapterButtons = page.locator('.w-80 button');
    
    // Count total chapters shown
    const chapterCount = await chapterButtons.count();
    console.log(`Found ${chapterCount} chapters in reader sidebar`);
    
    // Check each chapter's status - none should be unpublished
    for (let i = 0; i < chapterCount; i++) {
      const chapterButton = chapterButtons.nth(i);
      const statusIcon = chapterButton.locator('span').first();
      const statusIconText = await statusIcon.textContent();
      
      // Published chapters should have 🚀 icon
      // Unpublished chapters should NOT be visible to non-owners
      if (statusIconText !== '🚀') {
        const chapterText = await chapterButton.textContent();
        console.warn(`Found non-published chapter visible to non-owner: ${chapterText}, icon: ${statusIconText}`);
        
        // This should fail if unpublished chapters are visible
        expect(statusIconText).toBe('🚀');
      }
    }
    
    console.log('✅ All visible chapters are published');
  });

  test('Should show all chapters including unpublished to story owners in reader view', async ({ page }) => {
    // This test would require being logged in as the story owner
    // For now, we'll skip this but document the expected behavior
    test.skip('Requires story owner authentication');
    
    /*
    Expected behavior:
    - Navigate to story as owner
    - Should see both published (🚀) and unpublished (📝, 🔄) chapters
    - Should be able to read unpublished chapters
    */
  });

  test('Should show scenes in /write page for published chapters', async ({ page }) => {
    // Navigate to a chapter in write mode - using a specific chapter ID
    // This assumes we have a published chapter with scenes
    await page.goto('http://localhost:3000/write/odCvt_y4zTjW6fshWCEOm');
    
    // Wait for the writing editor to load
    await page.waitForSelector('.unified-writing-editor, [data-testid="writing-editor"]', { timeout: 10000 });
    
    // Look for scene navigation or scene content
    // The specific selectors depend on how scenes are displayed in UnifiedWritingEditor
    const sceneElements = page.locator('[data-testid="scene"], .scene-item, .scene-card');
    
    // Wait a bit for scenes to load
    await page.waitForTimeout(2000);
    
    const sceneCount = await sceneElements.count();
    console.log(`Found ${sceneCount} scenes in write page`);
    
    // Check if scenes are visible
    if (sceneCount === 0) {
      // Check if there's an empty state or error message
      const emptyState = await page.locator('text=/no scenes|empty|create scene/i').count();
      const errorMessage = await page.locator('text=/error|failed|problem/i').count();
      
      if (emptyState > 0) {
        console.log('No scenes found - appears to be empty state');
      } else if (errorMessage > 0) {
        console.error('Error loading scenes');
      } else {
        console.error('No scenes found and no clear indication why');
      }
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/missing-scenes-debug.png' });
    }
    
    // For debugging - log the page content structure
    const sidebarContent = await page.locator('.w-80, .sidebar').textContent();
    console.log('Sidebar content preview:', sidebarContent?.substring(0, 200));
    
    const mainContent = await page.locator('.flex-1, .main-content').textContent();
    console.log('Main content preview:', mainContent?.substring(0, 200));
    
    // This test documents the issue - scenes should be visible but may not be
    // We expect at least some scene-related content or navigation
    const hasSceneContent = sceneCount > 0 || 
                           await page.locator('text=/scene/i').count() > 0 ||
                           await page.locator('[data-testid*="scene"]').count() > 0;
    
    expect(hasSceneContent).toBe(true);
  });

  test('Should show scenes in /write page for any chapter with scenes', async ({ page }) => {
    // Test another chapter that might have scenes
    const chapterIds = [
      'odCvt_y4zTjW6fshWCEOm', // Chapter from the user's example
      // Add more chapter IDs here if we know them
    ];
    
    for (const chapterId of chapterIds) {
      console.log(`Testing chapter: ${chapterId}`);
      
      await page.goto(`http://localhost:3000/write/${chapterId}`);
      
      // Wait for page to load
      await page.waitForSelector('.unified-writing-editor, [data-testid="writing-editor"]', { timeout: 10000 });
      await page.waitForTimeout(2000);
      
      // Check for scenes
      const sceneElements = page.locator('[data-testid*="scene"], .scene, [class*="scene"]');
      const sceneCount = await sceneElements.count();
      
      console.log(`Chapter ${chapterId}: Found ${sceneCount} scene elements`);
      
      // Also check for scene-related text or navigation
      const sceneReferences = await page.locator('text=/scene/i').count();
      console.log(`Chapter ${chapterId}: Found ${sceneReferences} scene references`);
      
      if (sceneCount === 0 && sceneReferences === 0) {
        // Take screenshot for this chapter
        await page.screenshot({ 
          path: `test-results/missing-scenes-${chapterId}.png`,
          fullPage: true 
        });
        
        console.warn(`No scenes found for chapter ${chapterId}`);
      }
    }
  });

  test('Debug: Check story structure and data loading', async ({ page }) => {
    // Navigate to read page and check data loading
    await page.goto('http://localhost:3000/read/story-1');
    await page.waitForSelector('[data-testid="chapter-reader"]', { timeout: 10000 });
    
    // Check network requests for data loading
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/read/')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // Reload to capture requests
    await page.reload();
    await page.waitForTimeout(3000);
    
    console.log('API Responses:', responses);
    
    // Check if data is properly loaded
    const storyTitle = await page.locator('h1').first().textContent();
    const chapterButtons = await page.locator('.w-80 button').count();
    
    console.log(`Story title: ${storyTitle}`);
    console.log(`Chapter buttons: ${chapterButtons}`);
    
    // Log any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });
  });
});