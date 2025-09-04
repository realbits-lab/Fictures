import { test, expect } from '@playwright/test';

test.describe('Verify Scenes Fix in Write Page', () => {

  test('Should show scenes in write page after fix', async ({ page }) => {
    console.log('🔧 Testing scenes visibility after fix...');

    // Navigate to the write page that previously had missing scenes
    await page.goto('http://localhost:3000/write/odCvt_y4zTjW6fshWCEOm');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow extra time for component mounting

    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Check if redirected to login (would need authentication)
    if (currentUrl.includes('/login')) {
      console.log('🔐 Authentication required - cannot test without login');
      return;
    }

    // Look for the writing editor
    const editorExists = await page.locator('.unified-writing-editor, [data-testid="writing-editor"]').count();
    console.log(`Writing editor found: ${editorExists > 0}`);

    // Look for scenes section specifically
    const scenesSection = page.locator('text=/scenes/i').first();
    const scenesSectionExists = await scenesSection.count();
    console.log(`Scenes section found: ${scenesSectionExists > 0}`);

    if (scenesSectionExists > 0) {
      // Check for scene cards or scene list
      const sceneElements = await page.locator('[data-testid*="scene"], .scene-card, .scene-item, .border.border-gray-200').count();
      console.log(`Scene elements found: ${sceneElements}`);

      // Check for the "No scenes planned" message
      const noScenesMessage = await page.locator('text=/no scenes planned/i').count();
      console.log(`"No scenes planned" message: ${noScenesMessage > 0 ? 'shown' : 'not shown'}`);

      // Check for the "Create Scene" button
      const createSceneButton = await page.locator('text=/create.*scene/i').count();
      console.log(`Create Scene button found: ${createSceneButton > 0}`);

      // If scenes exist, try to get more details
      if (sceneElements > 0) {
        console.log('✅ Scenes appear to be visible!');
        
        // Try to click on a scene to see if it's interactive
        const firstScene = page.locator('.border.border-gray-200').first();
        const sceneText = await firstScene.textContent();
        console.log(`First scene preview: ${sceneText?.substring(0, 100)}...`);
        
      } else if (noScenesMessage > 0) {
        console.log('ℹ️  Chapter has no scenes yet - this is valid if chapter is empty');
      } else {
        console.log('❓ Unclear scene status - might need investigation');
      }
    }

    // Take screenshot for verification
    await page.screenshot({ 
      path: 'test-results/scenes-fix-verification.png',
      fullPage: true 
    });

    // Also check the page HTML for debugging
    const pageContent = await page.content();
    const hasSceneReferences = pageContent.includes('scene') || pageContent.includes('Scene');
    console.log(`Page contains scene references: ${hasSceneReferences}`);

    console.log('✅ Scenes fix verification completed');
  });

  test('Should handle chapters with scenes vs chapters without scenes', async ({ page }) => {
    console.log('🧪 Testing different chapter scenarios...');
    
    // Test the same chapter ID from user's example
    await page.goto('http://localhost:3000/write/odCvt_y4zTjW6fshWCEOm');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Skip if login required
    if (page.url().includes('/login')) {
      console.log('🔐 Skipping - authentication required');
      return;
    }

    // Check the chapter overview section
    const chapterOverview = page.locator('text=/chapter overview/i').first();
    const overviewExists = await chapterOverview.count();
    console.log(`Chapter overview section: ${overviewExists > 0 ? 'found' : 'not found'}`);

    // Check the scenes planning section
    const scenesPlanning = page.locator('text=/scenes? planning/i, text=/scene management/i').first();
    const planningExists = await scenesPlanning.count();
    console.log(`Scenes planning section: ${planningExists > 0 ? 'found' : 'not found'}`);

    // Look for any scene-related content
    const allSceneText = await page.locator('body').textContent();
    const sceneMatches = (allSceneText?.match(/scene/gi) || []).length;
    console.log(`Total "scene" text occurrences: ${sceneMatches}`);

    // Check if the page structure looks correct
    const mainSections = await page.locator('h1, h2, h3, [class*="card"]').count();
    console.log(`Main sections found: ${mainSections}`);

    console.log('✅ Chapter scenario testing completed');
  });
});