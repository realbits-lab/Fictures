import { test, expect } from '@playwright/test';

test.describe('Chapter Bugs - Simple E2E Tests', () => {
  
  test('Debug: Check story structure and chapter visibility', async ({ page }) => {
    console.log('🧪 Testing chapter visibility and story structure...');
    
    // Navigate to read page
    await page.goto('http://localhost:3000/read/story-1');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if page loaded successfully
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    
    // Look for chapter reader component
    const chapterReader = page.locator('[data-testid="chapter-reader"]');
    const readerExists = await chapterReader.count();
    console.log(`Chapter reader found: ${readerExists > 0}`);
    
    if (readerExists > 0) {
      // Get all chapter buttons in the sidebar
      const chapterButtons = page.locator('.w-80 button');
      const chapterCount = await chapterButtons.count();
      console.log(`Found ${chapterCount} chapters in sidebar`);
      
      // Check each chapter's details
      for (let i = 0; i < chapterCount; i++) {
        const chapterButton = chapterButtons.nth(i);
        const statusIcon = chapterButton.locator('span').first();
        const statusIconText = await statusIcon.textContent();
        const chapterText = await chapterButton.textContent();
        
        console.log(`Chapter ${i + 1}: ${chapterText?.substring(0, 50)}..., Status Icon: ${statusIconText}`);
        
        // Document if we find unpublished chapters (non-🚀 icons)
        if (statusIconText && statusIconText !== '🚀') {
          console.warn(`⚠️  Found potentially unpublished chapter: ${statusIconText}`);
        }
      }
      
      // Take a screenshot for debugging
      await page.screenshot({ 
        path: 'test-results/chapter-reader-debug.png',
        fullPage: true 
      });
      
    } else {
      console.error('❌ Chapter reader not found');
      
      // Check for error messages or login redirects
      const loginForm = await page.locator('form, [data-testid="login"]').count();
      const errorMessage = await page.locator('text=/error|not found|404/i').count();
      
      console.log(`Login form found: ${loginForm > 0}`);
      console.log(`Error message found: ${errorMessage > 0}`);
      
      // Take screenshot of current state
      await page.screenshot({ path: 'test-results/chapter-reader-not-found.png' });
    }
  });

  test('Debug: Check write page and scenes loading', async ({ page }) => {
    console.log('🧪 Testing write page and scenes...');
    
    // Navigate to write page with the chapter ID from user's example
    await page.goto('http://localhost:3000/write/odCvt_y4zTjW6fshWCEOm');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if page loaded successfully
    const pageTitle = await page.title();
    console.log(`Write page title: ${pageTitle}`);
    
    // Check if we're redirected to login
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('🔐 Redirected to login - authentication required');
      return;
    }
    
    // Look for the writing editor
    const editorSelectors = [
      '.unified-writing-editor',
      '[data-testid="writing-editor"]',
      '[data-testid="editor"]',
      '.writing-editor',
      '.editor-container'
    ];
    
    let editorFound = false;
    for (const selector of editorSelectors) {
      const editor = page.locator(selector);
      const count = await editor.count();
      if (count > 0) {
        console.log(`✅ Found editor with selector: ${selector}`);
        editorFound = true;
        break;
      }
    }
    
    if (!editorFound) {
      console.log('❌ No editor found with common selectors');
    }
    
    // Look for scene-related elements
    const sceneSelectors = [
      '[data-testid*="scene"]',
      '.scene',
      '[class*="scene"]',
      'text=/scene/i'
    ];
    
    for (const selector of sceneSelectors) {
      const scenes = page.locator(selector);
      const sceneCount = await scenes.count();
      console.log(`Scene elements with '${selector}': ${sceneCount}`);
    }
    
    // Check sidebar content for navigation
    const sidebar = page.locator('.w-80, .sidebar, [data-testid="sidebar"]');
    const sidebarCount = await sidebar.count();
    console.log(`Sidebars found: ${sidebarCount}`);
    
    if (sidebarCount > 0) {
      const sidebarText = await sidebar.first().textContent();
      console.log(`Sidebar content preview: ${sidebarText?.substring(0, 200)}`);
    }
    
    // Take screenshot for debugging
    await page.screenshot({ 
      path: 'test-results/write-page-debug.png',
      fullPage: true 
    });
    
    // Log any console errors from the page
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('🔥 Browser console error:', msg.text());
      }
    });
  });

  test('Debug: Check different story IDs and chapter availability', async ({ page }) => {
    console.log('🧪 Testing different story access patterns...');
    
    const storyIds = [
      'story-1',
      '78YZmbHM-Kp766Qp06XKa', // From the dev.log
    ];
    
    for (const storyId of storyIds) {
      console.log(`\n--- Testing story: ${storyId} ---`);
      
      await page.goto(`http://localhost:3000/read/${storyId}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const currentUrl = page.url();
      console.log(`Final URL: ${currentUrl}`);
      
      if (currentUrl.includes('/login')) {
        console.log('🔐 Requires authentication');
        continue;
      }
      
      if (currentUrl.includes('/404') || currentUrl.includes('not-found')) {
        console.log('❌ Story not found');
        continue;
      }
      
      // Check for chapter reader
      const chapterReader = await page.locator('[data-testid="chapter-reader"]').count();
      console.log(`Chapter reader present: ${chapterReader > 0}`);
      
      if (chapterReader > 0) {
        // Count chapters
        const chapters = await page.locator('.w-80 button').count();
        console.log(`Chapters visible: ${chapters}`);
        
        // Get story title
        const title = await page.locator('h1').first().textContent();
        console.log(`Story title: ${title}`);
      }
    }
  });
});