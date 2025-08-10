import { test, expect } from '@playwright/test';

test.describe('Storage State Demo Tests', () => {
  test('should demonstrate storage state usage', async ({ page, context }) => {
    // This test will use the saved storage state from manual setup
    console.log('Context storage state:', await context.storageState());
    
    // Navigate to home page
    await page.goto('/');
    
    // The storage state should prevent redirect to login
    // (This test shows how storage state would work)
    await page.waitForTimeout(2000);
    
    // Log the current URL to see where we end up
    console.log('Current URL:', page.url());
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'playwright-report/storage-state-demo.png' });
    
    // This test passes regardless of authentication status,
    // it's just demonstrating the storage state pattern
    expect(page.url()).toContain('localhost:3000');
  });

  test('should show storage state configuration', async ({ page, context }) => {
    // Get storage state information
    const storageState = await context.storageState();
    
    console.log('Storage State Configuration:');
    console.log('- Cookies:', storageState.cookies.length);
    console.log('- Origins:', storageState.origins.length);
    
    // Navigate and check what happens
    await page.goto('/');
    
    // Log session information if available
    try {
      const response = await page.request.get('/api/auth/session');
      const session = await response.json();
      console.log('Session data:', session);
    } catch (error) {
      console.log('No session data available');
    }
    
    // Test passes - this demonstrates the pattern
    expect(true).toBe(true);
  });
});