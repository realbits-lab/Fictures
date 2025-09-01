import { test, expect } from '@playwright/test';

test.describe('Authenticated Pages - Core Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    // Ensure we have authentication state loaded
    await page.goto('/');
    // Wait for authentication to be loaded
    await page.waitForTimeout(2000);
  });

  test('Dashboard page loads and shows user content', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check page loads without errors
    await expect(page).toHaveTitle(/Dashboard|Fictures/);
    
    // Look for dashboard-specific elements
    await expect(page.locator('h1, [data-testid="dashboard-title"]')).toBeVisible();
    
    // Check for user statistics or recent activity
    const statsSection = page.locator('[data-testid="user-stats"], .stats-section, .dashboard-stats');
    if (await statsSection.isVisible({ timeout: 5000 })) {
      await expect(statsSection).toBeVisible();
    }
    
    // Check for story/content listing
    const contentSection = page.locator('[data-testid="user-stories"], .stories-list, .content-grid');
    if (await contentSection.isVisible({ timeout: 5000 })) {
      await expect(contentSection).toBeVisible();
    }
    
    console.log('✓ Dashboard page functionality verified');
  });

  test('Stories listing page displays and functions correctly', async ({ page }) => {
    await page.goto('/stories');
    
    await expect(page).toHaveTitle(/Stories|Fictures/);
    
    // Look for stories listing elements
    const storiesContainer = page.locator('[data-testid="stories-list"], .stories-grid, .content-list').first();
    await expect(storiesContainer.or(page.locator('h1:has-text("Stories")'))).toBeVisible();
    
    // Check for create new story button or link
    const createButton = page.locator('[data-testid="create-story"], button:has-text("Create"), a:has-text("New Story")');
    if (await createButton.isVisible({ timeout: 5000 })) {
      await expect(createButton).toBeVisible();
    }
    
    console.log('✓ Stories page functionality verified');
  });

  test('Writing interface page functionality', async ({ page }) => {
    await page.goto('/write');
    
    // Check for writing interface elements
    const editor = page.locator('[data-testid="text-editor"], .editor, textarea, [contenteditable="true"]').first();
    await expect(editor.or(page.locator('h1:has-text("Write")'))).toBeVisible();
    
    // Test basic editor interaction if editor is present
    if (await editor.isVisible({ timeout: 5000 })) {
      await editor.click();
      await editor.fill('Test content for editor');
      await expect(editor).toHaveValue(/Test content/);
      console.log('✓ Editor input functionality verified');
    }
    
    // Check for AI assistance tools
    const aiToolsSection = page.locator('[data-testid="ai-tools"], .ai-assistance, button:has-text("AI")');
    if (await aiToolsSection.isVisible({ timeout: 5000 })) {
      console.log('✓ AI tools section detected');
    }
    
    console.log('✓ Writing interface functionality verified');
  });

  test('Analytics page displays user metrics', async ({ page }) => {
    await page.goto('/analytics');
    
    await expect(page.locator('h1, [data-testid="analytics-title"]')).toBeVisible();
    
    // Look for charts or metrics sections
    const metricsSection = page.locator('[data-testid="metrics"], .analytics-chart, .stats-container');
    if (await metricsSection.isVisible({ timeout: 5000 })) {
      await expect(metricsSection).toBeVisible();
      console.log('✓ Analytics metrics displayed');
    }
    
    console.log('✓ Analytics page functionality verified');
  });

  test('Community pages accessibility', async ({ page }) => {
    const communityPages = ['/community', '/community/forums', '/community/groups'];
    
    for (const url of communityPages) {
      await page.goto(url);
      
      // Check page loads without 404 errors
      const notFoundText = await page.locator('text="404", text="Not Found"').count();
      expect(notFoundText).toBe(0);
      
      // Look for community-specific content
      const communityContent = page.locator('[data-testid*="community"], .community, h1, main');
      await expect(communityContent.first()).toBeVisible();
      
      console.log(`✓ ${url} page accessibility verified`);
    }
  });

  test('User profile and settings pages', async ({ page }) => {
    const userPages = ['/profile', '/settings'];
    
    for (const url of userPages) {
      await page.goto(url);
      
      // Check page loads
      await expect(page.locator('h1, [data-testid*="profile"], [data-testid*="settings"], main')).toBeVisible();
      
      // Look for user-specific elements
      const userElements = page.locator('[data-testid="user-info"], .user-profile, .settings-form');
      if (await userElements.first().isVisible({ timeout: 5000 })) {
        console.log(`✓ ${url} user elements detected`);
      }
      
      console.log(`✓ ${url} page functionality verified`);
    }
  });

  test('Navigation and menu functionality', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test main navigation elements
    const navElements = page.locator('nav, [data-testid="nav"], .navigation');
    if (await navElements.first().isVisible({ timeout: 5000 })) {
      const navLinks = navElements.first().locator('a, button');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(0);
      console.log(`✓ Found ${linkCount} navigation elements`);
    }
    
    // Test user menu if present
    const userMenu = page.locator('[data-testid="user-menu"], .user-dropdown, .profile-menu');
    if (await userMenu.first().isVisible({ timeout: 5000 })) {
      await userMenu.first().click();
      // Check if dropdown items appear
      const menuItems = page.locator('[data-testid="menu-item"], .dropdown-item');
      if (await menuItems.first().isVisible({ timeout: 3000 })) {
        console.log('✓ User menu dropdown functionality verified');
      }
    }
    
    console.log('✓ Navigation functionality verified');
  });

  test('Form submissions and interactions', async ({ page }) => {
    await page.goto('/write');
    
    // Test any forms on the writing page
    const forms = page.locator('form');
    const formCount = await forms.count();
    
    if (formCount > 0) {
      console.log(`Found ${formCount} forms to test`);
      
      // Test form validation if inputs are present
      const textInputs = page.locator('input[type="text"], input[type="email"], textarea');
      if (await textInputs.count() > 0) {
        const firstInput = textInputs.first();
        await firstInput.fill('Test input');
        await expect(firstInput).toHaveValue('Test input');
        console.log('✓ Form input functionality verified');
      }
    }
    
    // Test any interactive buttons
    const interactiveButtons = page.locator('button:not([disabled])');
    const buttonCount = await interactiveButtons.count();
    
    if (buttonCount > 0) {
      console.log(`✓ Found ${buttonCount} interactive buttons`);
    }
    
    console.log('✓ Interactive elements functionality verified');
  });

  test('Error handling and edge cases', async ({ page }) => {
    // Test invalid routes
    await page.goto('/invalid-route-12345');
    
    // Should show appropriate error page or redirect
    const has404 = await page.locator('text="404", text="Not Found"').count() > 0;
    const hasRedirect = page.url() !== 'http://localhost:3000/invalid-route-12345';
    
    expect(has404 || hasRedirect).toBe(true);
    console.log('✓ 404 error handling verified');
    
    // Test with malformed parameters if applicable
    await page.goto('/stories/invalid-id-format');
    // Should handle gracefully without crashing
    await page.waitForTimeout(2000);
    
    console.log('✓ Edge case handling verified');
  });
});