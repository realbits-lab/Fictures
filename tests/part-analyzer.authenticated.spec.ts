import { test, expect } from '@playwright/test';

test.describe('Part Analyzer Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the writing page with a specific chapter
    await page.goto('/write/lq0F1cgRH23Hi5Ef0oq66');

    // Wait for the page to load
    await page.waitForSelector('[data-testid="writing-interface"]', { timeout: 10000 });
  });

  test('should successfully add 2 chapters using Part Prompt Analyzer', async ({ page }) => {
    // Look for the Part Prompt Analyzer section
    const partAnalyzer = page.locator('text=Part Prompt Analyzer').first();
    await expect(partAnalyzer).toBeVisible({ timeout: 10000 });

    // Find the input field for the analyzer prompt
    const promptInput = page.locator('input[placeholder*="prompt"], textarea[placeholder*="prompt"], input[type="text"]').last();
    if (await promptInput.isVisible()) {
      await promptInput.fill('Add 2 chapters');
    } else {
      // Try alternative selectors
      const textArea = page.locator('textarea').last();
      await textArea.fill('Add 2 chapters');
    }

    // Find and click the analyze/process button
    const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Process"), button:has-text("Generate")').first();
    await expect(analyzeButton).toBeVisible();
    await analyzeButton.click();

    // Wait for the processing to complete (this might take a while due to AI processing)
    await page.waitForSelector('text=Processing', { state: 'hidden', timeout: 30000 });

    // Check for success indicators
    const successIndicators = [
      'chapters',
      'Chapter 1',
      'Chapter 2',
      'success',
      'added',
      'updated'
    ];

    let foundSuccess = false;
    for (const indicator of successIndicators) {
      const element = page.locator(`text=${indicator}`).first();
      if (await element.isVisible({ timeout: 5000 })) {
        foundSuccess = true;
        console.log(`Found success indicator: ${indicator}`);
        break;
      }
    }

    expect(foundSuccess).toBe(true);

    // Take a screenshot for verification
    await page.screenshot({ path: 'logs/part-analyzer-success.png', fullPage: true });
  });

  test('should handle part analyzer API errors gracefully', async ({ page }) => {
    // Look for the Part Prompt Analyzer section
    const partAnalyzer = page.locator('text=Part Prompt Analyzer').first();
    await expect(partAnalyzer).toBeVisible({ timeout: 10000 });

    // Try with an invalid prompt that might cause issues
    const promptInput = page.locator('input[placeholder*="prompt"], textarea[placeholder*="prompt"], input[type="text"]').last();
    if (await promptInput.isVisible()) {
      await promptInput.fill('invalid complex request with many contradictions and impossible requirements');
    } else {
      const textArea = page.locator('textarea').last();
      await textArea.fill('invalid complex request with many contradictions and impossible requirements');
    }

    // Find and click the analyze button
    const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Process"), button:has-text("Generate")').first();
    await analyzeButton.click();

    // Wait for processing to complete or error to appear
    await page.waitForTimeout(10000);

    // The system should either succeed or show a graceful error, not crash
    const errorMessages = page.locator('text=error, text=Error, text=failed, text=Failed');
    const successMessages = page.locator('text=success, text=Success, text=completed, text=Completed');

    // Either should be visible (error or success), indicating the system handled the request
    const hasResponse = await errorMessages.first().isVisible() || await successMessages.first().isVisible();
    expect(hasResponse).toBe(true);
  });
});