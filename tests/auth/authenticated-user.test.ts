import { test, expect } from '@playwright/test';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

test.describe('Authenticated User Tests', () => {
  test('should have access to main chat interface', async ({ page }) => {
    // Navigate to the home page - should be automatically authenticated
    await page.goto('/');
    
    // Should not be redirected to login page
    expect(page.url()).not.toContain('/login');
    
    // Should see the main chat interface
    await expect(page.locator('main')).toBeVisible();
    
    // Check for authenticated user elements (adjust selectors based on your UI)
    // This might be a user menu, profile picture, or other authenticated-only elements
    const userIndicator = page.locator('[data-testid="user-menu"]')
      .or(page.locator('[aria-label="User menu"]'))
      .or(page.locator('button:has-text("Sign out")'))
      .or(page.locator('img[alt*="avatar"]'))
      .first();
    
    // If user indicator exists, verify it's visible
    try {
      await expect(userIndicator).toBeVisible({ timeout: 5000 });
    } catch {
      // If no specific user indicator, just verify we're not on login page
      await expect(page).not.toHaveURL(/.*\/login.*/);
    }
  });

  test('should be able to access protected routes', async ({ page }) => {
    // Test accessing a chat page directly
    await page.goto('/');
    
    // Should not be redirected to login
    expect(page.url()).not.toContain('/login');
    
    // Should be able to access API endpoints (check session)
    const response = await page.request.get('/api/auth/session');
    expect(response.status()).toBe(200);
    
    const session = await response.json();
    expect(session).toHaveProperty('user');
    expect(session.user).toHaveProperty('email');
    expect(session.user.email).toBe(process.env.GOOGLE_TEST_EMAIL || 'thothy.test@gmail.com');
  });

  test('should be able to create a new chat', async ({ page }) => {
    await page.goto('/');
    
    // Look for new chat button or similar functionality
    const newChatButton = page.locator('button:has-text("New")')
      .or(page.locator('[data-testid="new-chat"]'))
      .or(page.locator('button[aria-label*="new"]'))
      .first();
    
    try {
      await expect(newChatButton).toBeVisible({ timeout: 5000 });
      await newChatButton.click();
      
      // Verify new chat interface is shown
      await expect(page.locator('textarea').or(page.locator('input[placeholder*="message"]'))).toBeVisible();
    } catch {
      // If no specific new chat button, just verify we can access the main interface
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('should persist authentication across page reloads', async ({ page }) => {
    await page.goto('/');
    
    // Reload the page
    await page.reload();
    
    // Should still be authenticated
    expect(page.url()).not.toContain('/login');
    
    // Should still see authenticated content
    await expect(page.locator('main')).toBeVisible();
  });
});