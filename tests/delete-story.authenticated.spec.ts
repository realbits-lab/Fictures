import { test, expect } from '@playwright/test';

test.describe('Delete Story Feature Tests', () => {
  test.use({ storageState: '.auth/user.json' });

  test('should display and test delete story button', async ({ page }) => {
    console.log('🧪 Starting delete story test');

    // Navigate to the story writing page
    const storyId = 'Fi9gm6jANplB5yIVLe2Mp';
    await page.goto(`http://localhost:3000/write/story/${storyId}`);
    await page.waitForLoadState('networkidle');

    console.log('✅ Navigated to story page:', page.url());

    // Wait for the page to fully load
    await page.waitForSelector('[class*="col-span"]', { timeout: 10000 });

    // Take screenshot of initial state
    await page.screenshot({ path: 'tests/screenshots/delete-story-initial.png', fullPage: true });
    console.log('📸 Initial screenshot saved');

    // Look for the delete button in the right sidebar
    const deleteButton = page.locator('button:has-text("Delete Story")');

    // Check if delete button is visible
    const isDeleteButtonVisible = await deleteButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isDeleteButtonVisible) {
      console.log('❌ Delete button not found - checking page content');
      const pageContent = await page.content();
      console.log('Page title:', await page.title());
      console.log('Delete button search result:', await page.locator('button').allTextContents());

      await page.screenshot({ path: 'tests/screenshots/delete-story-no-button.png', fullPage: true });
      throw new Error('Delete Story button not found on the page');
    }

    console.log('✅ Delete button found');

    // Check if button is enabled
    const isEnabled = await deleteButton.isEnabled();
    console.log(`🔘 Delete button enabled: ${isEnabled}`);

    if (!isEnabled) {
      console.log('⚠️  Delete button is disabled');
      await page.screenshot({ path: 'tests/screenshots/delete-story-disabled.png', fullPage: true });
      throw new Error('Delete Story button is disabled');
    }

    // Set up dialog handlers BEFORE clicking the button
    let confirmDialogSeen = false;
    let promptDialogSeen = false;

    page.on('dialog', async (dialog) => {
      console.log('📋 Dialog appeared:', dialog.type(), dialog.message());

      if (dialog.type() === 'confirm' && !confirmDialogSeen) {
        console.log('🔘 Accepting first confirmation...');
        confirmDialogSeen = true;
        await dialog.accept();
      } else if (dialog.type() === 'prompt' && !promptDialogSeen) {
        console.log('⌨️  Typing DELETE in prompt...');
        promptDialogSeen = true;
        await dialog.accept('DELETE');
      } else {
        console.log('⚠️  Unexpected dialog - dismissing');
        await dialog.dismiss();
      }
    });

    // Click the delete button
    console.log('🖱️  Clicking delete button...');
    await deleteButton.click();

    // Wait for navigation to /stories page
    console.log('⏳ Waiting for deletion and navigation...');
    await page.waitForURL('**/stories', { timeout: 10000 });

    // Check if we were redirected to /stories
    console.log('📍 Current URL after deletion:', page.url());

    if (page.url().includes('/stories')) {
      console.log('✅ Successfully redirected to stories page');
    } else if (page.url().includes('/write/story')) {
      console.log('❌ Still on story page - deletion may have failed');
      await page.screenshot({ path: 'tests/screenshots/delete-story-failed.png', fullPage: true });

      // Check for error messages
      const errorElements = page.locator('[class*="error"], [class*="alert"]');
      const errorCount = await errorElements.count();
      if (errorCount > 0) {
        console.log('🔴 Error messages found:', await errorElements.allTextContents());
      }

      throw new Error('Story was not deleted - still on story page');
    }

    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/delete-story-success.png', fullPage: true });
    console.log('📸 Final screenshot saved');

    console.log('✅ Delete story test completed successfully');
  });

  test('should handle delete story cancellation', async ({ page }) => {
    console.log('🧪 Starting delete story cancellation test');

    // Navigate to the story writing page
    const storyId = 'story_test_1758642206635';
    await page.goto(`http://localhost:3000/write/story/${storyId}`);
    await page.waitForLoadState('networkidle');

    // Look for the delete button
    const deleteButton = page.locator('button:has-text("Delete Story")');
    await expect(deleteButton).toBeVisible({ timeout: 10000 });

    // Click the delete button
    console.log('🖱️  Clicking delete button...');
    await deleteButton.click();

    // Cancel the first confirmation dialog
    page.once('dialog', async (dialog) => {
      console.log('📋 Cancelling first confirmation...');
      await dialog.dismiss();
    });

    // Wait a bit
    await page.waitForTimeout(1000);

    // Verify we're still on the story page
    expect(page.url()).toContain('/write/story');
    console.log('✅ Story deletion cancelled successfully - still on story page');
  });
});
