import { test, expect } from '@playwright/test';
import path from 'path';

// Use stored Playwright authentication state
test.use({
  storageState: '.auth/playwright-user.json'
});

test.describe('HNS Story Generation', () => {
  test('should successfully generate a story using HNS', async ({ page }) => {
    // Navigate to the stories page
    await page.goto('http://localhost:3000/stories');

    // Wait for the page to load
    await expect(page).toHaveTitle(/Fictures/);

    // Click on "New Story" button
    await page.click('text=New Story');

    // Wait for the story creation form to appear
    await expect(page).toHaveURL(/\/stories\/new/);

    // Fill in the story prompt
    const storyPrompt = 'A mysterious librarian discovers that books in her ancient library are portals to different worlds, and she must save them from being destroyed by a digital transformation project.';
    await page.fill('textarea[placeholder*="Describe your story idea"]', storyPrompt);

    // Select language (default is English)
    await page.selectOption('select#language', 'English');

    // Click the generate button
    await page.click('button:text("Generate Story")');

    // Wait for generation to start (looking for progress indicator)
    await expect(page.locator('text=HNS Generation')).toBeVisible({ timeout: 10000 });

    // Wait for the complete generation (this might take a while)
    // We'll wait for the completion or error message
    const result = await Promise.race([
      page.waitForSelector('text=Story generation completed successfully!', { timeout: 180000 }),
      page.waitForSelector('text=Failed to generate story', { timeout: 180000 })
    ]);

    // Check if generation was successful
    const isSuccess = await page.locator('text=Story generation completed successfully!').isVisible();
    expect(isSuccess).toBeTruthy();

    // Verify that we're redirected to the stories page
    await page.waitForURL(/\/stories/, { timeout: 10000 });

    // Verify the new story appears in the list
    await expect(page.locator('text=Generated Story')).toBeVisible({ timeout: 10000 });
  });

  test('should display progress updates during generation', async ({ page }) => {
    // Navigate to new story page
    await page.goto('http://localhost:3000/stories/new');

    // Fill in a simple prompt
    await page.fill('textarea[placeholder*="Describe your story idea"]', 'A short test story about a hero.');

    // Start generation
    await page.click('button:text("Generate Story")');

    // Check that progress steps are visible
    const progressSteps = [
      'HNS Generation',
      'Story Foundation',
      'Three-Act Structure',
      'Characters',
      'Settings',
      'Chapters & Scenes',
      'Visual Generation',
      'Database'
    ];

    for (const step of progressSteps.slice(0, 3)) { // Check first 3 steps
      await expect(page.locator(`text=${step}`)).toBeVisible({ timeout: 30000 });
    }
  });

  test('should show YAML data in sidebar during generation', async ({ page }) => {
    // Navigate to new story page
    await page.goto('http://localhost:3000/stories/new');

    // Fill in a prompt
    await page.fill('textarea[placeholder*="Describe your story idea"]', 'A detective story in a futuristic city.');

    // Start generation
    await page.click('button:text("Generate Story")');

    // Wait for HNS generation to complete
    await page.waitForSelector('text=HNS Generation', { timeout: 10000 });

    // Check if YAML data sidebar is populated (it should update as generation progresses)
    // Wait a bit for the data to appear
    await page.waitForTimeout(5000);

    // Check if the sidebar contains JSON/YAML data
    const yamlSidebar = page.locator('.lg\\:col-span-1'); // Sidebar column
    const sidebarText = await yamlSidebar.textContent();

    // Should contain some structure data
    expect(sidebarText).toContain('story');
  });

  test('should handle generation errors gracefully', async ({ page }) => {
    // Navigate to new story page
    await page.goto('http://localhost:3000/stories/new');

    // Submit without entering a prompt
    await page.click('button:text("Generate Story")');

    // Should not start generation (button should be disabled or no action)
    const isGenerating = await page.locator('text=Generating Story...').isVisible();
    expect(isGenerating).toBeFalsy();

    // Enter empty prompt (just spaces)
    await page.fill('textarea[placeholder*="Describe your story idea"]', '   ');

    // Button should still be disabled or not trigger generation
    const generateButton = page.locator('button:text("Generate Story")');
    const isDisabled = await generateButton.isDisabled();
    expect(isDisabled).toBeTruthy();
  });
});

test.describe('HNS Story Viewing', () => {
  test('should display HNS structure correctly', async ({ page }) => {
    // First create a story
    await page.goto('http://localhost:3000/stories/new');

    const testPrompt = 'A young scientist discovers time travel but each jump erases someone from existence.';
    await page.fill('textarea[placeholder*="Describe your story idea"]', testPrompt);
    await page.click('button:text("Generate Story")');

    // Wait for completion
    await page.waitForSelector('text=Story generation completed successfully!', { timeout: 180000 });

    // Wait for redirect
    await page.waitForURL(/\/stories/, { timeout: 10000 });

    // Click on the newly created story
    await page.click('text=Generated Story');

    // Should navigate to story detail page
    await expect(page).toHaveURL(/\/stories\/[^\/]+$/);

    // Check for HNS elements
    await expect(page.locator('text=Act 1: Setup')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Act 2: Confrontation')).toBeVisible();
    await expect(page.locator('text=Act 3: Resolution')).toBeVisible();
  });
});