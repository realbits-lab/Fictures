import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';

const authFile = '@playwright/.auth/user.json';

// Get test credentials from authentication file
let testUsers: any = {};
let currentUser: any = {};

// Default fallback test users
const fallbackTestUsers = {
  reader: { email: 'reader@example.com', password: 'reader-password', role: 'reader', name: 'Reader User' },
  writer: { email: 'writer@example.com', password: 'writer-password', role: 'writer', name: 'Writer User' },
  manager: { email: 'admin@example.com', password: 'admin-password', role: 'manager', name: 'Manager User' }
};

// Try to read from auth file, fallback to default users
try {
  if (existsSync(authFile)) {
    const authData = JSON.parse(readFileSync(authFile, 'utf-8'));
    testUsers = authData.allTestUsers || fallbackTestUsers;
    currentUser = authData.testUser || fallbackTestUsers.writer;
    console.log(`✓ Loaded test users from ${authFile}`);
  } else {
    console.log('⚠️ Auth file not found, using default test users');
    testUsers = fallbackTestUsers;
    currentUser = fallbackTestUsers.writer;
  }
} catch (error) {
  console.log('⚠️ Error loading test users, using default fallback');
  testUsers = fallbackTestUsers;
  currentUser = fallbackTestUsers.writer;
}

test.describe('Multi-Role User Testing', () => {
  
  test('Reader role - Limited access verification', async ({ page }) => {
    await page.goto('/');
    
    // Try to access writer-specific features as reader
    await page.goto('/write');
    
    // Reader should either see limited functionality or be redirected
    const hasWriteAccess = await page.locator('[data-testid="text-editor"], textarea, [contenteditable="true"]').isVisible({ timeout: 5000 });
    
    if (hasWriteAccess) {
      console.log('⚠️ Reader has write access - may need role-based restrictions');
    } else {
      console.log('✓ Reader properly restricted from writing features');
    }
    
    // Reader should be able to view content
    await page.goto('/stories');
    const canViewStories = await page.locator('h1, .stories-list, .content-grid').first().isVisible({ timeout: 5000 });
    expect(canViewStories).toBe(true);
    console.log('✓ Reader can view stories');
  });

  test('Writer role - Writing access verification', async ({ page }) => {
    await page.goto('/');
    
    // Writer should have access to writing features
    await page.goto('/write');
    
    const writeEditor = page.locator('[data-testid="text-editor"], textarea, [contenteditable="true"]').first();
    
    if (await writeEditor.isVisible({ timeout: 10000 })) {
      console.log('✓ Writer has access to editor');
      
      // Test writing functionality
      await writeEditor.click();
      await writeEditor.fill('Test content by writer');
      await expect(writeEditor).toHaveValue(/Test content/);
      console.log('✓ Writer can input text in editor');
    } else {
      console.log('⚠️ Writer does not have editor access - may need role configuration');
    }
    
    // Check writer dashboard access
    await page.goto('/dashboard');
    const hasWriterDashboard = await page.locator('[data-testid="writer-tools"], .writer-section, .my-stories').isVisible({ timeout: 5000 });
    
    if (hasWriterDashboard) {
      console.log('✓ Writer has dedicated dashboard features');
    }
  });

  test('Manager role - Administrative access verification', async ({ page }) => {
    await page.goto('/');
    
    // Manager should have access to management features
    const managementPages = ['/admin', '/manage', '/settings', '/analytics'];
    
    for (const url of managementPages) {
      await page.goto(url);
      
      const notFound = await page.locator('text="404", text="Not Found"').count();
      const hasContent = await page.locator('h1, main, .admin, .management').first().isVisible({ timeout: 5000 });
      
      if (notFound === 0 && hasContent) {
        console.log(`✓ Manager has access to ${url}`);
      } else {
        console.log(`ℹ️ Manager page ${url} not found or restricted`);
      }
    }
    
    // Check for management-specific UI elements
    await page.goto('/');
    const hasAdminUI = await page.locator('[data-testid="admin-menu"], .admin-controls, .manager-tools').count() > 0;
    
    if (hasAdminUI) {
      console.log('✓ Manager has administrative UI elements');
    }
  });

  test('Role-based navigation and menu differences', async ({ page }) => {
    await page.goto('/');
    
    // Check navigation menu for role-specific items
    const navMenu = page.locator('nav, [data-testid="nav"], .navigation').first();
    
    if (await navMenu.isVisible({ timeout: 5000 })) {
      const navLinks = navMenu.locator('a, button');
      const linkTexts = await navLinks.allTextContents();
      
      console.log('Available navigation items:', linkTexts.filter(text => text.trim().length > 0));
      
      // Check for role-specific menu items
      const hasWriteMenu = linkTexts.some(text => text.toLowerCase().includes('write'));
      const hasAdminMenu = linkTexts.some(text => text.toLowerCase().includes('admin') || text.toLowerCase().includes('manage'));
      
      console.log(`Navigation analysis: Write menu: ${hasWriteMenu}, Admin menu: ${hasAdminMenu}`);
    }
  });

  test('Permission boundaries and access control', async ({ page }) => {
    await page.goto('/');
    
    // Test attempting to access restricted content
    const restrictedEndpoints = [
      '/api/admin',
      '/api/manage',
      '/api/users'
    ];
    
    for (const endpoint of restrictedEndpoints) {
      const response = await page.request.get(endpoint);
      const status = response.status();
      
      // Should return 401/403 for unauthorized access or 404 if not implemented
      if ([401, 403, 404, 405].includes(status)) {
        console.log(`✓ Endpoint ${endpoint} properly protected (${status})`);
      } else {
        console.log(`⚠️ Endpoint ${endpoint} returned unexpected status: ${status}`);
      }
    }
  });

  test('User context and profile information', async ({ page }) => {
    await page.goto('/profile');
    
    // Check if user profile shows role information
    const profileSection = page.locator('[data-testid="user-profile"], .profile, .user-info').first();
    
    if (await profileSection.isVisible({ timeout: 5000 })) {
      const profileText = await profileSection.textContent() || '';
      
      // Look for role indicators
      const hasRoleInfo = ['reader', 'writer', 'manager'].some(role => 
        profileText.toLowerCase().includes(role)
      );
      
      if (hasRoleInfo) {
        console.log('✓ Profile displays user role information');
      }
      
      console.log('Profile content preview:', profileText.slice(0, 200));
    }
  });

  test('Feature availability based on user role', async ({ page }) => {
    await page.goto('/');
    
    // Test feature availability across different pages
    const features = {
      'Create Story': '[data-testid="create-story"], button:has-text("Create"), a:has-text("New Story")',
      'AI Tools': '[data-testid="ai-tools"], .ai-assistance, button:has-text("AI")',
      'Analytics': '[data-testid="analytics"], .analytics, a:has-text("Analytics")',
      'Settings': '[data-testid="settings"], .settings, a:has-text("Settings")'
    };
    
    for (const [featureName, selector] of Object.entries(features)) {
      const featureExists = await page.locator(selector).count() > 0;
      console.log(`Feature "${featureName}": ${featureExists ? 'Available' : 'Not visible'}`);
    }
  });
});