import { test, expect } from '@playwright/test';

test.use({
  storageState: '.auth/writer-playwright.json'
});

test('Chat quick action buttons should fill input box', async ({ page }) => {
  console.log('🧪 Testing chat quick action buttons in story editor\n');

  // Navigate to story editor page (using a known story ID from writer@fictures.xyz)
  // First, let's get a story ID from the stories page
  await page.goto('http://localhost:3000/studio');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('✅ Navigated to studio page\n');

  // Find the story card by clicking on the story title
  const storyTitle = page.locator('text=Shadows of the Mountain');
  const titleCount = await storyTitle.count();
  console.log(`📊 Found ${titleCount} story titles\n`);

  if (titleCount === 0) {
    throw new Error('No story found. Please create a story first using the studio/new page.');
  }

  // Click on the story title to navigate to the editor
  console.log(`📖 Clicking on story: "Shadows of the Mountain"\n`);
  await storyTitle.first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // Wait for editor to fully load
  console.log('✅ Navigated to story editor page\n');

  // Find the chat input textarea
  const chatInput = page.locator('textarea[placeholder*="Ask me to help"]');
  await expect(chatInput).toBeVisible();
  console.log('✅ Chat input found\n');

  // Test 1: Click "Show story details" button
  console.log('🧪 Test 1: Clicking "Show story details" button...\n');

  const showDetailsButton = page.locator('button:has-text("Show story details")');
  await expect(showDetailsButton).toBeVisible();

  // Click the button
  await showDetailsButton.click();

  // Wait for the input value to change
  await expect(chatInput).toHaveValue('Show me the details of this story', { timeout: 5000 });

  const inputValue1 = await chatInput.inputValue();
  console.log(`📝 Input value after clicking: "${inputValue1}"\n`);
  console.log('✅ Test 1 PASSED: Input correctly filled with "Show me the details of this story"\n');

  // Clear the input
  await chatInput.clear();
  await page.waitForTimeout(300);

  // Test 2: Click "List all characters" button
  console.log('🧪 Test 2: Clicking "List all characters" button...\n');

  const listCharactersButton = page.locator('button:has-text("List all characters")');
  await expect(listCharactersButton).toBeVisible();

  // Click the button
  await listCharactersButton.click();

  // Wait for the input value to change
  await expect(chatInput).toHaveValue('List all characters in this story', { timeout: 5000 });

  const inputValue2 = await chatInput.inputValue();
  console.log(`📝 Input value after clicking: "${inputValue2}"\n`);
  console.log('✅ Test 2 PASSED: Input correctly filled with "List all characters in this story"\n');

  // Test 3: Verify input is NOT auto-submitted
  console.log('🧪 Test 3: Verifying input is NOT auto-submitted...\n');

  // Wait a bit to see if any message appears
  await page.waitForTimeout(1000);

  // Check that no user message was sent
  const userMessages = page.locator('div:has-text("List all characters in this story")').filter({ hasNot: page.locator('button') });
  const messageCount = await userMessages.count();

  console.log(`📊 User messages found: ${messageCount}\n`);

  // Should be 0 because we only filled the input, didn't submit
  expect(messageCount).toBe(0);
  console.log('✅ Test 3 PASSED: Input was NOT auto-submitted\n');

  console.log('✅ All tests PASSED!\n');
});
