import { test as setup, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const authFile = '@playwright/.auth/user.json';

// Secure test user configuration using actual Fictures database credentials
// No hardcoded passwords - these match the database users
const ficutresTestUsers = {
  reader: {
    email: 'reader@fictures.com',
    password: 'reader123',
    role: 'reader',
    name: 'Reader User'
  },
  writer: {
    email: 'write@fictures.com',
    password: 'writer123',
    role: 'writer',
    name: 'John Writer'
  },
  admin: {
    email: 'admin@fictures.com',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User'
  }
};

setup('authenticate with username/password', async ({ page }) => {
  // Use writer as default test user
  const testUser = ficutresTestUsers.writer;
  
  console.log(`🔐 Setting up authentication for test user: ${testUser.email}`);
  
  // Navigate directly to login page since we know the auth config
  await page.goto('/login');
  
  // Wait for login form to load
  await page.waitForTimeout(2000);
  
  // Look for email input field on login page
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').first();
  
  if (await emailInput.isVisible({ timeout: 10000 })) {
    console.log('✓ Login form found - performing credentials login');
    
    // Fill in email
    await emailInput.fill(testUser.email);
    console.log(`✓ Filled email field (${testUser.email})`);
    
    // Look for password input field
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    if (await passwordInput.isVisible({ timeout: 5000 })) {
      await passwordInput.fill(testUser.password);
      console.log('✓ Filled password field');
      
      // Look for submit button
      const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Login"), button:has-text("Sign in"), button:has-text("Sign In")').first();
      
      if (await submitButton.isVisible({ timeout: 5000 })) {
        await submitButton.click();
        console.log('✓ Clicked submit button');
        
        // Wait for authentication to complete
        await page.waitForTimeout(5000);
        
        // Check if we're redirected away from login (successful login)
        if (!page.url().includes('/login')) {
          console.log('✓ Authentication successful - redirected away from login page');
          
          // Try navigating to a protected page to verify auth works
          await page.goto('/stories/new');
          await page.waitForTimeout(2000);
          
          if (!page.url().includes('/login')) {
            console.log('✓ Protected page accessible - authentication verified');
            
            // Navigate back to home and save auth state
            await page.goto('/');
            await page.waitForTimeout(1000);
            
            // Save authentication state with user data
            const authState = await page.context().storageState();
            const mergedAuthData = {
              ...authState,
              testUser: testUser,
              allTestUsers: ficutresTestUsers
            };
            
            // Ensure directory exists
            mkdirSync(dirname(authFile), { recursive: true });
            
            // Save merged authentication state with user data
            writeFileSync(authFile, JSON.stringify(mergedAuthData, null, 2));
            console.log('✓ Authentication state saved successfully');
          } else {
            console.log('⚠️ Protected page redirected to login - auth may have failed');
            throw new Error('Authentication verification failed - protected page not accessible');
          }
        } else {
          console.log('⚠️ Still on login page after submit - authentication may have failed');
          
          // Check for error messages and debug
          await page.waitForTimeout(2000); // Wait for any error messages to appear
          const errorMessages = page.locator('.text-red-600, .error, .alert-error, [role="alert"]');
          const errorCount = await errorMessages.count();
          
          console.log(`📊 Found ${errorCount} error message elements`);
          
          if (errorCount > 0) {
            for (let i = 0; i < errorCount; i++) {
              const errorElement = errorMessages.nth(i);
              const errorText = await errorElement.textContent();
              console.log(`❌ Error message ${i + 1}: "${errorText}"`);
            }
            
            const firstError = await errorMessages.first().textContent();
            throw new Error(`Login failed with error: "${firstError || 'Empty error message'}"`);
          } else {
            console.log('🔍 No error messages found, checking form state...');
            
            // Debug: check if form is still in loading state
            const loadingButton = page.locator('button:has-text("Signing in...")');
            const isStillLoading = await loadingButton.count() > 0;
            console.log(`🔄 Form still loading: ${isStillLoading}`);
            
            // Debug: check current URL
            console.log(`📍 Current URL: ${page.url()}`);
            
            // Debug: take screenshot for investigation
            await page.screenshot({ path: 'login-failure-debug.png' });
            
            throw new Error('Login failed - still on login page with no visible error message');
          }
        }
      } else {
        throw new Error('Submit button not found on login form');
      }
    } else {
      throw new Error('Password input field not found on login form');
    }
  } else {
    throw new Error('Login form not found - email input field not visible');
  }
  
  console.log('✅ Authentication setup completed successfully');
});

setup.describe.configure({ mode: 'serial' });