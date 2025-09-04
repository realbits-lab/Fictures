import { test, expect } from '@playwright/test';

test.describe('Verify Migration Success', () => {
  test('Writer view now shows scenes for previously problematic chapters', async ({ page }) => {
    console.log('🔍 Testing writer view after migration...');
    
    // Navigate to /write page and test a migrated chapter
    await page.goto('/write/odCvt_y4zTjW6fshWCEOm'); // "The Debugger's Challenge"
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Check if we now have scenes (should no longer show "No scenes planned")
    const sceneElements = await page.locator('[data-testid*="scene-"]').count();
    console.log(`📝 Found ${sceneElements} scenes in writer view`);
    
    // Check if "No scenes planned" text is gone
    const noScenesText = await page.locator('text="No scenes planned"').count();
    console.log(`❌ "No scenes planned" messages: ${noScenesText}`);
    
    expect(sceneElements).toBeGreaterThan(0);
    expect(noScenesText).toBe(0);
  });

  test('Reader view still works with migrated content', async ({ page }) => {
    console.log('🔍 Testing reader view after migration...');
    
    // Navigate to a story with migrated chapters
    await page.goto('/read/78YZmbHM-Kp766Qp06XKa');
    
    // Wait for reader to load
    await page.waitForTimeout(3000);
    
    // Find "The Debugger's Challenge" chapter and click it
    const chapterButton = page.locator('button:has-text("The Debugger\'s Challenge")');
    await expect(chapterButton).toBeVisible();
    await chapterButton.click();
    
    await page.waitForTimeout(2000);
    
    // Check that content is still displayed
    const articleContent = await page.locator('article').textContent();
    console.log(`📖 Reader content length: ${articleContent?.length || 0} characters`);
    
    expect(articleContent).toBeTruthy();
    expect(articleContent!.length).toBeGreaterThan(1000); // Should have substantial content
    
    // Check for scene titles (new structure)
    const sceneTitles = await page.locator('h3').count();
    console.log(`🎬 Found ${sceneTitles} scene titles in reader view`);
    
    expect(sceneTitles).toBeGreaterThan(0); // Should have scene titles now
  });
});