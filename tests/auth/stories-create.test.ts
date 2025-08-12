import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/user.json' });

test('should access stories/create page with authentication', async ({ page }) => {
  console.log('🧪 Testing stories/create page...');
  
  // Navigate to stories/create
  await page.goto('/stories/create');
  console.log(`📍 Current URL: ${page.url()}`);
  
  // Should not redirect to login since we're authenticated
  expect(page.url()).not.toContain('/login');
  
  // Should load the chat interface for story creation
  await expect(page).toHaveURL(/stories\/create/);
  
  // Should have the main chat interface elements
  const chatContainer = page.locator('[data-testid="chat"], .chat-container, textarea[placeholder*="message"], textarea[placeholder*="Message"]').first();
  await expect(chatContainer).toBeVisible({ timeout: 10000 });
  
  console.log('✅ Stories/create page loaded successfully with chat interface');
});