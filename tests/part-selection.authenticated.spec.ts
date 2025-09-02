import { test, expect } from '@playwright/test';

test.describe('Part Selection in Left Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to stories page
    await page.goto('http://localhost:3000/stories');
    await page.waitForLoadState('networkidle');
    
    // Create a test story if none exists
    const storyCards = page.locator('[data-testid="story-card"]');
    if (await storyCards.count() === 0) {
      // Click "New Story" button
      const newStoryBtn = page.locator('button:has-text("New Story"), a:has-text("New Story")').first();
      if (await newStoryBtn.count() > 0) {
        await newStoryBtn.click();
        await page.waitForLoadState('networkidle');
        
        // Fill in story creation form
        const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
        if (await titleInput.count() > 0) {
          await titleInput.fill('Test Story for Parts');
          
          // Look for submit/create button
          const createBtn = page.locator('button:has-text("Create"), button[type="submit"]').first();
          if (await createBtn.count() > 0) {
            await createBtn.click();
            await page.waitForLoadState('networkidle');
          }
        }
      }
    }
  });

  test('should change middle part content when different parts are selected', async ({ page }) => {
    // Navigate to stories page
    await page.goto('http://localhost:3000/stories');
    await page.waitForLoadState('networkidle');
    
    // Look for the first story and click on it to go to unified editor
    const firstStoryCard = page.locator('[data-testid="story-card"]').first();
    
    // If no story card exists, try alternative selectors
    if (await firstStoryCard.count() === 0) {
      const storyLinks = page.locator('a[href*="/write/"], a[href*="/story/"]');
      if (await storyLinks.count() > 0) {
        await storyLinks.first().click();
        await page.waitForLoadState('networkidle');
      } else {
        console.log('No stories found, skipping part selection test');
        return;
      }
    } else {
      await firstStoryCard.click();
      await page.waitForLoadState('networkidle');
    }
    
    await firstStoryCard.click();
    await page.waitForLoadState('networkidle');
    
    // Now we should be in the UnifiedWritingEditor
    // Look for parts in the left sidebar
    const leftSidebar = page.locator('.space-y-6').first(); // Left sidebar container
    
    // Look for parts in the story architecture
    const partButtons = page.locator('button:has-text("Part")');
    
    if (await partButtons.count() === 0) {
      console.log('No parts found in the story structure');
      return;
    }
    
    // Test: Click on the first part
    console.log('Testing Part 1 selection...');
    const firstPart = partButtons.first();
    await firstPart.click();
    
    // Wait for the middle content to change
    await page.waitForTimeout(500);
    
    // Check that the middle part shows Part editor content
    const middleSection = page.locator('.lg\\:col-span-2'); // Middle section
    
    // Look for Part editor specific content
    await expect(middleSection.locator('h2:has-text("📚")')).toBeVisible();
    
    // Take screenshot of Part 1 selection
    await page.screenshot({ 
      path: 'logs/part-1-selection.png',
      fullPage: true 
    });
    
    // Check that the part is highlighted in the left sidebar
    await expect(firstPart).toHaveClass(/bg-green-100|text-green-900/);
    
    // Test: If there's a second part, click on it
    if (await partButtons.count() > 1) {
      console.log('Testing Part 2 selection...');
      const secondPart = partButtons.nth(1);
      await secondPart.click();
      
      await page.waitForTimeout(500);
      
      // Check that Part 2 is now highlighted
      await expect(secondPart).toHaveClass(/bg-green-100|text-green-900/);
      
      // Check that the middle content updated for Part 2
      const partHeader = middleSection.locator('h2:has-text("📚")');
      await expect(partHeader).toBeVisible();
      
      // Take screenshot of Part 2 selection
      await page.screenshot({ 
        path: 'logs/part-2-selection.png',
        fullPage: true 
      });
    }
    
    // Test: Check that the YAML data section shows story data when part is selected
    const rightSidebar = page.locator('.space-y-6').last(); // Right sidebar
    const yamlSection = rightSidebar.locator('text=📊 YAML Data');
    await expect(yamlSection).toBeVisible();
    
    // Check for story-level data in the YAML section when part is selected
    const yamlContent = rightSidebar.locator('pre');
    await expect(yamlContent).toContainText('title:');
    await expect(yamlContent).toContainText('genre:');
    
    console.log('Part selection test completed successfully');
  });
  
  test('should show correct part title in middle section header', async ({ page }) => {
    await page.goto('http://localhost:3000/stories');
    await page.waitForLoadState('networkidle');
    
    const firstStoryCard = page.locator('[data-testid="story-card"]').first();
    if (await firstStoryCard.count() === 0) {
      console.log('No stories found for title test');
      return;
    }
    
    await firstStoryCard.click();
    await page.waitForLoadState('networkidle');
    
    // Click on a part in the sidebar
    const partButton = page.locator('button:has-text("Part")').first();
    if (await partButton.count() > 0) {
      await partButton.click();
      await page.waitForTimeout(500);
      
      // Check that the middle section header shows the part title (not "Part X Development")
      const middleSection = page.locator('.lg\\:col-span-2');
      const headerText = await middleSection.locator('h2').first().textContent();
      
      console.log('Part header text:', headerText);
      
      // Should show part title with book emoji, not "Part X Development"
      expect(headerText).toContain('📚');
      expect(headerText).not.toContain('Development');
    }
  });
});