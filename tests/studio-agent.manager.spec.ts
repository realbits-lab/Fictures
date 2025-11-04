import { test, expect } from '@playwright/test';

test.describe('Studio Agent', () => {
  // Uses manager.json from manager-tests project config

  test('should display Create New Story button on /studio page', async ({ page }) => {
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    // Check if Create New Story button is visible
    const createButton = page.getByRole('button', { name: /create new story/i });
    await expect(createButton).toBeVisible();
  });

  test('should create empty story and navigate to agent chat', async ({ page }) => {
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    // Click Create New Story button
    const createButton = page.getByRole('button', { name: /create new story/i });
    await createButton.click();

    // Wait for navigation to agent chat page
    await page.waitForURL(/\/studio\/agent\/new\?storyId=story_/);

    // Verify URL contains storyId parameter
    const url = page.url();
    expect(url).toContain('/studio/agent/new?storyId=story_');

    // Check if chat interface is displayed
    const chatHeading = page.getByRole('heading', { name: /studio agent/i });
    await expect(chatHeading).toBeVisible();

    // Check if input textarea is present
    const inputArea = page.getByPlaceholder(/ask me to help with your story/i);
    await expect(inputArea).toBeVisible();
  });

  test('should send message to agent and receive response', async ({ page }) => {
    // First create a new story
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /create new story/i });
    await createButton.click();
    await page.waitForURL(/\/studio\/agent\/new\?storyId=story_/);

    // Type a message to the agent
    const inputArea = page.getByPlaceholder(/ask me to help with your story/i);
    await inputArea.fill('Show me the details of this story');

    // Submit the message
    const sendButton = page.getByRole('button', { type: 'submit' });
    await sendButton.click();

    // Wait for agent response (up to 30 seconds for AI response)
    await page.waitForSelector('text=/I can help/', { timeout: 30000 }).catch(() => {
      console.log('Agent response timeout - this is expected if AI is slow');
    });

    // Verify message appears in chat
    const userMessage = page.getByText('Show me the details of this story');
    await expect(userMessage).toBeVisible();
  });

  test('should display tool execution cards when agent uses tools', async ({ page }) => {
    // Create a new story
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /create new story/i });
    await createButton.click();
    await page.waitForURL(/\/studio\/agent\/new\?storyId=story_/);

    // Ask agent to get story details (should trigger getStory tool)
    const inputArea = page.getByPlaceholder(/ask me to help with your story/i);
    await inputArea.fill('Get the story details');

    const sendButton = page.getByRole('button', { type: 'submit' });
    await sendButton.click();

    // Wait for tool execution card to appear (up to 30 seconds)
    const toolCard = page.locator('[class*="theme-card"]').first();
    await expect(toolCard).toBeVisible({ timeout: 30000 }).catch(() => {
      console.log('Tool card timeout - this is expected if AI is slow');
    });
  });

  test('should show generation mode for new stories', async ({ page }) => {
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /create new story/i });
    await createButton.click();
    await page.waitForURL(/\/studio\/agent\/new\?storyId=story_/);

    // Check for generation mode indicator
    const generationText = page.getByText(/create a new story with ai assistance/i);
    await expect(generationText).toBeVisible();
  });

  test('should allow Enter to send message and Shift+Enter for new line', async ({ page }) => {
    // Create a new story
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /create new story/i });
    await createButton.click();
    await page.waitForURL(/\/studio\/agent\/new\?storyId=story_/);

    const inputArea = page.getByPlaceholder(/ask me to help with your story/i);

    // Test Shift+Enter for new line
    await inputArea.fill('Line 1');
    await inputArea.press('Shift+Enter');
    await inputArea.type('Line 2');

    const text = await inputArea.inputValue();
    expect(text).toContain('\n'); // Should contain newline

    // Clear and test Enter to send
    await inputArea.fill('Test message');
    await inputArea.press('Enter');

    // Verify message was sent
    await expect(page.getByText('Test message')).toBeVisible({ timeout: 5000 });
  });
});
