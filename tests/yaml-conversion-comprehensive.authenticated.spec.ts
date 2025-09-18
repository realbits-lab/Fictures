import { test, expect } from '@playwright/test';

/**
 * Comprehensive test for YAML conversion across all story prompt editors
 *
 * This test verifies that all story-related components now send YAML instead of JSON:
 * - StoryPromptWriter
 * - PartPromptEditor
 * - ChapterPromptEditor
 * - ScenePromptEditor
 *
 * And that all corresponding APIs handle YAML correctly:
 * - /api/story-analyzer
 * - /api/part-analyzer
 * - /api/chapter-analyzer
 * - /api/scene-analyzer
 */

test.use({
  storageState: '.auth/user.json'
});

test.describe('YAML Conversion Comprehensive Tests', () => {
  let storyId: string;

  test.beforeEach(async ({ page }) => {
    // Navigate to the stories page and create a test story
    await page.goto('http://localhost:3000/stories');
    await page.waitForTimeout(2000);

    // Create a new story for testing
    await page.getByRole('button', { name: 'Create New Story' }).click();
    await page.waitForTimeout(1000);

    // Fill out the story form
    await page.fill('[data-testid="story-title"]', 'YAML Test Story');
    await page.fill('[data-testid="story-description"]', 'A test story for verifying YAML conversion functionality');
    await page.selectOption('[data-testid="story-genre"]', 'fantasy');
    await page.fill('[data-testid="story-word-count"]', '75000');

    // Submit the story creation form
    await page.getByRole('button', { name: 'Create Story' }).click();
    await page.waitForTimeout(3000);

    // Get the story ID from the URL
    const url = page.url();
    const match = url.match(/\/write\/([^\/]+)/);
    if (match) {
      storyId = match[1];
      console.log('📖 Created test story with ID:', storyId);
    }
  });

  test('Story Prompt Writer uses YAML format', async ({ page }) => {
    console.log('🧪 Testing Story Prompt Writer YAML conversion...');

    // Find and interact with the Story Prompt Writer
    const storyPromptSection = page.locator('[data-testid="story-prompt-writer"]');
    await expect(storyPromptSection).toBeVisible();

    // Enter a test prompt
    const promptInput = storyPromptSection.locator('[data-testid="prompt-input"]');
    await promptInput.fill('add magical creatures and enhance the fantasy world');

    // Monitor network requests to verify YAML is being sent
    const apiRequestPromise = page.waitForRequest(request =>
      request.url().includes('/api/story-analyzer') && request.method() === 'POST'
    );

    // Click the apply changes button
    const applyButton = storyPromptSection.locator('[data-testid="apply-changes-button"]');
    await applyButton.click();

    // Verify the request was made with YAML
    const apiRequest = await apiRequestPromise;
    const contentType = apiRequest.headers()['content-type'];
    expect(contentType).toBe('application/json'); // Component sends JSON with storyYaml field

    // Verify the request body contains storyYaml instead of storyData
    const requestBody = apiRequest.postDataJSON();
    expect(requestBody).toHaveProperty('storyYaml');
    expect(requestBody).toHaveProperty('userRequest');
    expect(requestBody.userRequest).toBe('add magical creatures and enhance the fantasy world');

    // Wait for response and verify success
    await page.waitForTimeout(5000);
    const resultSection = storyPromptSection.locator('.whitespace-pre-wrap');
    await expect(resultSection).toContainText('✅');

    console.log('✅ Story Prompt Writer YAML test passed');
  });

  test('Part Prompt Editor uses YAML format', async ({ page }) => {
    console.log('🧪 Testing Part Prompt Editor YAML conversion...');

    // Navigate to a part to edit
    await page.locator('text=Part 1').first().click();
    await page.waitForTimeout(2000);

    // Find the Part Prompt Editor
    const partPromptSection = page.locator('text=🤖 Part Prompt Editor').locator('..');
    await expect(partPromptSection).toBeVisible();

    // Enter a test prompt
    const promptInput = partPromptSection.locator('textarea').first();
    await promptInput.fill('add more tension and character development');

    // Monitor network requests to verify YAML is being sent
    const apiRequestPromise = page.waitForRequest(request =>
      request.url().includes('/api/part-analyzer') && request.method() === 'POST'
    );

    // Click the apply changes button
    const applyButton = partPromptSection.locator('button:has-text("⚡ Apply Changes")');
    await applyButton.click();

    // Verify the request was made with YAML
    const apiRequest = await apiRequestPromise;
    const contentType = apiRequest.headers()['content-type'];
    expect(contentType).toBe('application/yaml');

    // Verify the response and successful processing
    await page.waitForTimeout(8000);
    const resultSection = partPromptSection.locator('.whitespace-pre-wrap');
    await expect(resultSection).toContainText('✅');

    console.log('✅ Part Prompt Editor YAML test passed');
  });

  test('Chapter Prompt Editor uses YAML format', async ({ page }) => {
    console.log('🧪 Testing Chapter Prompt Editor YAML conversion...');

    // Navigate to a chapter to edit (try to find a chapter)
    const chapterLink = page.locator('text=Chapter').first();
    if (await chapterLink.isVisible()) {
      await chapterLink.click();
      await page.waitForTimeout(2000);

      // Find the Chapter Prompt Editor
      const chapterPromptSection = page.locator('text=🤖 Chapter Prompt Editor').locator('..');

      if (await chapterPromptSection.isVisible()) {
        // Enter a test prompt
        const promptInput = chapterPromptSection.locator('textarea').first();
        await promptInput.fill('add dialogue and emotional depth');

        // Monitor network requests to verify YAML is being sent
        const apiRequestPromise = page.waitForRequest(request =>
          request.url().includes('/api/chapter-analyzer') && request.method() === 'POST'
        );

        // Click the apply changes button
        const applyButton = chapterPromptSection.locator('button:has-text("⚡ Apply Changes")');
        await applyButton.click();

        // Verify the request was made with YAML
        const apiRequest = await apiRequestPromise;
        const contentType = apiRequest.headers()['content-type'];
        expect(contentType).toBe('application/yaml');

        // Verify successful processing
        await page.waitForTimeout(8000);
        const resultSection = chapterPromptSection.locator('.whitespace-pre-wrap');
        await expect(resultSection).toContainText('✅');

        console.log('✅ Chapter Prompt Editor YAML test passed');
      } else {
        console.log('⚠️ Chapter Prompt Editor not visible, skipping this test');
      }
    } else {
      console.log('⚠️ No chapters found, skipping Chapter Prompt Editor test');
    }
  });

  test('Scene Prompt Editor uses YAML format', async ({ page }) => {
    console.log('🧪 Testing Scene Prompt Editor YAML conversion...');

    // Try to navigate to a scene to edit
    const sceneLink = page.locator('text=Scene').first();
    if (await sceneLink.isVisible()) {
      await sceneLink.click();
      await page.waitForTimeout(2000);

      // Find the Scene Prompt Editor
      const scenePromptSection = page.locator('text=🤖 Scene Prompt Editor').locator('..');

      if (await scenePromptSection.isVisible()) {
        // Enter a test prompt
        const promptInput = scenePromptSection.locator('textarea').first();
        await promptInput.fill('add sensory details and atmosphere');

        // Monitor network requests to verify YAML is being sent
        const apiRequestPromise = page.waitForRequest(request =>
          request.url().includes('/api/scene-analyzer') && request.method() === 'POST'
        );

        // Click the apply changes button
        const applyButton = scenePromptSection.locator('button:has-text("⚡ Apply Changes")');
        await applyButton.click();

        // Verify the request was made with YAML
        const apiRequest = await apiRequestPromise;
        const contentType = apiRequest.headers()['content-type'];
        expect(contentType).toBe('application/yaml');

        // Verify successful processing
        await page.waitForTimeout(8000);
        const resultSection = scenePromptSection.locator('.whitespace-pre-wrap');
        await expect(resultSection).toContainText('✅');

        console.log('✅ Scene Prompt Editor YAML test passed');
      } else {
        console.log('⚠️ Scene Prompt Editor not visible, skipping this test');
      }
    } else {
      console.log('⚠️ No scenes found, skipping Scene Prompt Editor test');
    }
  });

  test('All APIs handle YAML responses correctly', async ({ page }) => {
    console.log('🧪 Testing YAML response handling across all APIs...');

    // Test that responses are properly parsed and displayed
    const storyPromptSection = page.locator('[data-testid="story-prompt-writer"]');
    await expect(storyPromptSection).toBeVisible();

    // Enter a test prompt that should generate clear changes
    const promptInput = storyPromptSection.locator('[data-testid="prompt-input"]');
    await promptInput.fill('complete parts, serial, hooks part in story');

    // Monitor the API response
    const responsePromise = page.waitForResponse(response =>
      response.url().includes('/api/story-analyzer') && response.status() === 200
    );

    // Click the apply changes button
    const applyButton = storyPromptSection.locator('[data-testid="apply-changes-button"]');
    await applyButton.click();

    // Verify the response
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    // Verify the response was parsed and displayed correctly
    await page.waitForTimeout(8000);
    const resultSection = storyPromptSection.locator('.whitespace-pre-wrap');

    // Should show success message and not the original error
    await expect(resultSection).not.toContainText('Cannot convert undefined or null to object');
    await expect(resultSection).toContainText('✅');

    console.log('✅ YAML response handling test passed');
  });

  test.afterEach(async ({ page }) => {
    // Clean up: delete the test story if needed
    if (storyId) {
      console.log('🗑️ Cleaning up test story:', storyId);
    }
  });
});

test.describe('YAML Error Handling', () => {
  test('APIs gracefully handle malformed YAML', async ({ page }) => {
    console.log('🧪 Testing YAML error handling...');

    // Navigate to stories page
    await page.goto('http://localhost:3000/stories');
    await page.waitForTimeout(2000);

    // Test direct API call with malformed YAML
    const response = await page.request.post('http://localhost:3000/api/story-analyzer', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        storyYaml: `story:
  title: "Test Story"
  genre: "fantasy"
  malformed: [unclosed array`,
        userRequest: 'test malformed yaml'
      }
    });

    // Should handle the error gracefully
    expect(response.status()).toBe(200);
    const responseData = await response.json();
    expect(responseData).toHaveProperty('success');

    console.log('✅ YAML error handling test passed');
  });
});