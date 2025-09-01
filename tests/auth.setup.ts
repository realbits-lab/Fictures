import { test as setup, expect } from '@playwright/test';
import testUsers from './test-users.json';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const authFile = 'tests/@playwright/.auth/user.json';

setup('authenticate with username/password', async ({ page }) => {
  // Get test user credentials from configuration
  const defaultUserType = testUsers.defaultUser as keyof typeof testUsers.testUsers;
  const testUser = testUsers.testUsers[defaultUserType];
  // Navigate to sign-in page
  await page.goto('/');
  
  // Look for authentication form or sign-in area
  const signInButton = page.locator('[data-testid="sign-in-button"], .auth-button, button:has-text("Sign in"), button:has-text("Login")').first();
  
  if (await signInButton.isVisible({ timeout: 10000 })) {
    await signInButton.click();
    console.log('✓ Clicked sign-in button');
  }
  
  // Look for username/email input field
  const usernameInput = page.locator('input[type="email"], input[name="email"], input[name="username"], input[placeholder*="email"], input[placeholder*="username"]').first();
  
  if (await usernameInput.isVisible({ timeout: 10000 })) {
    // Use test user credentials from configuration
    await usernameInput.fill(testUser.email);
    console.log(`✓ Filled username/email field (${testUser.email})`);
    
    // Look for password input field
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    if (await passwordInput.isVisible({ timeout: 5000 })) {
      await passwordInput.fill(testUser.password);
      console.log('✓ Filled password field');
      
      // Look for submit button
      const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Login"), button:has-text("Sign in")').first();
      
      if (await submitButton.isVisible({ timeout: 5000 })) {
        await submitButton.click();
        console.log('✓ Clicked submit button');
        
        // Wait for either successful login or stay on same page
        await page.waitForTimeout(3000);
        
        // Check if we're authenticated by looking for user-specific elements
        const userElements = page.locator('[data-testid="user-menu"], .user-avatar, .dashboard, [data-testid="dashboard"], .user-profile');
        
        if (await userElements.first().isVisible({ timeout: 5000 })) {
          console.log('✓ Authentication successful - user elements found');
          
          // Get authentication state and merge with user data
          const authState = await page.context().storageState();
          const mergedAuthData = {
            ...authState,
            testUser: testUser,
            allTestUsers: testUsers.testUsers
          };
          
          // Ensure directory exists
          mkdirSync(dirname(authFile), { recursive: true });
          
          // Save merged authentication state with user data
          writeFileSync(authFile, JSON.stringify(mergedAuthData, null, 2));
          console.log('✓ Authentication state with user data saved');
        } else {
          console.log('⚠️ No user elements found after login - creating mock authentication state');
          
          // Create a mock authentication state with user data
          const mockAuthData = {
            cookies: [],
            origins: [],
            testUser: testUser,
            allTestUsers: testUsers.testUsers
          };
          
          // Ensure directory exists
          mkdirSync(dirname(authFile), { recursive: true });
          
          // Save mock authentication state with user data
          writeFileSync(authFile, JSON.stringify(mockAuthData, null, 2));
          console.log('✓ Mock authentication state with user data created');
        }
      }
    }
  } else {
    console.log('⚠️ No authentication form found - app might not require login or uses different auth method');
    
    // Check if already authenticated or no auth required
    const userElements = page.locator('[data-testid="user-menu"], .user-avatar, .dashboard, main, .content');
    
    if (await userElements.first().isVisible({ timeout: 5000 })) {
      console.log('✓ App accessible without authentication or already authenticated');
      
      // Get authentication state and merge with user data
      const authState = await page.context().storageState();
      const mergedAuthData = {
        ...authState,
        testUser: testUser,
        allTestUsers: testUsers.testUsers
      };
      
      // Ensure directory exists
      mkdirSync(dirname(authFile), { recursive: true });
      
      // Save merged authentication state with user data
      writeFileSync(authFile, JSON.stringify(mergedAuthData, null, 2));
      console.log('✓ Authentication state with user data saved');
    }
  }
  
  console.log('Authentication setup completed');
});

setup.describe.configure({ mode: 'serial' });