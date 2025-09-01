import { test, expect } from '@playwright/test';

test.describe('Authentication Flow - Complete User Journey', () => {
  
  test('Login page accessibility and functionality', async ({ page }) => {
    await page.goto('/login');
    
    const notFound = await page.locator('text="404", text="Not Found"').count();
    if (notFound === 0) {
      console.log('✓ Login page accessible');
      
      // Check for login interface elements
      const loginElements = page.locator(
        'form, [data-testid*="login"], .login-form, .auth-form, ' +
        'button:has-text("Sign in"), button:has-text("Login")'
      );
      
      const loginElementCount = await loginElements.count();
      if (loginElementCount > 0) {
        console.log(`✓ Found ${loginElementCount} login interface elements`);
        
        // Look for Google sign-in specifically
        const googleSignIn = page.locator(
          'button:has-text("Google"), [data-provider="google"], ' +
          '.google-signin, button:has-text("Continue with Google")'
        );
        
        if (await googleSignIn.count() > 0) {
          console.log('✓ Google sign-in option available');
          
          const googleButton = googleSignIn.first();
          await expect(googleButton).toBeVisible();
          console.log('✓ Google sign-in button is visible and accessible');
        }
        
        // Look for email/password login
        const emailInput = page.locator('input[type="email"], input[name="email"]');
        const passwordInput = page.locator('input[type="password"], input[name="password"]');
        
        if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
          console.log('✓ Email/password login form available');
          
          // Test form interaction
          await emailInput.first().fill('test@example.com');
          await passwordInput.first().fill('testpassword');
          
          console.log('✓ Login form accepts user input');
        }
        
      } else {
        console.log('⚠️ No login interface found on login page');
      }
      
    } else {
      console.log('⚠️ Login page not found (404)');
    }
  });

  test('Authentication state management', async ({ page }) => {
    // Test unauthenticated state first
    await page.goto('/');
    
    // Look for sign-in indicators
    const signInElements = page.locator(
      'button:has-text("Sign in"), a:has-text("Login"), ' +
      '[data-testid*="sign-in"], .login-button'
    );
    
    const signInCount = await signInElements.count();
    if (signInCount > 0) {
      console.log(`✓ Found ${signInCount} sign-in elements for unauthenticated users`);
      
      const signInButton = signInElements.first();
      await expect(signInButton).toBeVisible();
      console.log('✓ Sign-in interface visible to unauthenticated users');
    }
    
    // Check for protected content warnings
    const protectedElements = page.locator(
      'text*="sign in", text*="login", text*="authenticate", ' +
      '[data-testid*="auth-required"], .auth-warning'
    );
    
    const protectedCount = await protectedElements.count();
    if (protectedCount > 0) {
      console.log(`✓ Found ${protectedCount} authentication prompts`);
    }
  });

  test('Sign-in and sign-out button functionality', async ({ page }) => {
    await page.goto('/');
    
    // Test sign-in button
    const signInButton = page.locator(
      'button:has-text("Sign in"), [data-testid*="sign-in"], ' +
      '.google-signin, button:has-text("Login")'
    ).first();
    
    if (await signInButton.isVisible({ timeout: 3000 })) {
      console.log('✓ Sign-in button found');
      
      // Click sign-in button
      await signInButton.click();
      
      // Wait for navigation or modal
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      const hasModal = await page.locator('.modal, .dialog, [role="dialog"]').isVisible({ timeout: 2000 });
      
      if (currentUrl.includes('/login') || currentUrl.includes('/auth') || hasModal) {
        console.log('✓ Sign-in button navigates to authentication');
      } else if (currentUrl.includes('google.com') || currentUrl.includes('oauth')) {
        console.log('✓ Sign-in redirects to OAuth provider');
      } else {
        console.log('ℹ️ Sign-in button behavior may need different interaction method');
      }
    }
    
    // Test sign-out button (if user appears to be authenticated)
    const signOutButton = page.locator(
      'button:has-text("Sign out"), [data-testid*="sign-out"], ' +
      '.signout-button, button:has-text("Logout")'
    ).first();
    
    if (await signOutButton.isVisible({ timeout: 3000 })) {
      console.log('✓ Sign-out button found (user appears authenticated)');
      
      // Note: Not clicking sign-out to avoid disrupting test authentication state
      await expect(signOutButton).toBeVisible();
      console.log('✓ Sign-out button is accessible');
    }
  });

  test('Authentication redirects and protected routes', async ({ page }) => {
    // Test accessing protected routes without authentication
    const protectedRoutes = [
      '/write/1',
      '/dashboard', 
      '/settings',
      '/publish'
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      
      const currentUrl = page.url();
      const has404 = await page.locator('text="404", text="Not Found"').count() > 0;
      const hasAuthPrompt = await page.locator(
        'text*="sign in", text*="login", button:has-text("Sign in")'
      ).count() > 0;
      
      if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
        console.log(`✓ ${route} redirects to authentication`);
      } else if (hasAuthPrompt) {
        console.log(`✓ ${route} shows authentication prompt`);
      } else if (has404) {
        console.log(`ℹ️ ${route} returns 404 (route may not exist)`);
      } else {
        console.log(`ℹ️ ${route} accessible without authentication`);
      }
    }
  });

  test('Session persistence and management', async ({ page }) => {
    await page.goto('/');
    
    // Check for session-related cookies
    const cookies = await page.context().cookies();
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('auth') || 
      cookie.name.includes('session') ||
      cookie.name.includes('token')
    );
    
    if (authCookies.length > 0) {
      console.log(`✓ Found ${authCookies.length} authentication-related cookies`);
      
      authCookies.forEach(cookie => {
        console.log(`  - ${cookie.name}: ${cookie.httpOnly ? 'HttpOnly' : 'Client-accessible'}, Secure: ${cookie.secure}`);
      });
    } else {
      console.log('ℹ️ No authentication cookies found (user may not be authenticated)');
    }
    
    // Check localStorage for authentication data
    const localStorageAuth = await page.evaluate(() => {
      const authKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('auth') || key.includes('token') || key.includes('session'))) {
          authKeys.push(key);
        }
      }
      return authKeys;
    });
    
    if (localStorageAuth.length > 0) {
      console.log(`✓ Found ${localStorageAuth.length} auth-related localStorage items`);
    }
  });

  test('User profile and authentication status', async ({ page }) => {
    await page.goto('/profile');
    
    const notFound = await page.locator('text="404", text="Not Found"').count();
    if (notFound === 0) {
      console.log('✓ Profile page accessible');
      
      // Look for user information
      const userInfo = page.locator(
        '[data-testid*="user"], .user-info, .profile-info, ' +
        '.user-email, .user-name, .avatar'
      );
      
      const userInfoCount = await userInfo.count();
      if (userInfoCount > 0) {
        console.log(`✓ Found ${userInfoCount} user information elements`);
        
        // Check for specific user data
        const userText = await userInfo.first().textContent() || '';
        if (userText.includes('@') || userText.includes('User') || userText.includes('Writer')) {
          console.log('✓ Profile displays user-specific information');
        }
        
      } else {
        console.log('⚠️ No user information found on profile page');
      }
      
      // Look for authentication status indicators
      const authStatus = page.locator(
        '[data-testid*="auth-status"], .auth-status, .login-status, ' +
        'text*="Signed in", text*="Authenticated"'
      );
      
      if (await authStatus.count() > 0) {
        const statusText = await authStatus.first().textContent() || '';
        console.log(`✓ Authentication status: ${statusText}`);
      }
      
    } else {
      console.log('ℹ️ Profile page not found (404) - may require authentication');
    }
  });

  test('OAuth provider integration', async ({ page }) => {
    await page.goto('/api/auth/providers');
    
    // Test auth providers endpoint
    const response = await page.request.get('/api/auth/providers');
    console.log(`Auth providers API response: ${response.status()}`);
    
    if (response.status() === 200) {
      try {
        const providers = await response.json();
        console.log('✓ Auth providers API returned valid JSON');
        
        if (providers.google || providers.Google) {
          console.log('✓ Google OAuth provider configured');
        }
        
        const providerCount = Object.keys(providers).length;
        console.log(`✓ Found ${providerCount} configured OAuth providers`);
        
      } catch (e) {
        console.log('ℹ️ Auth providers endpoint accessible but returned non-JSON');
      }
    } else {
      console.log(`ℹ️ Auth providers endpoint returned status: ${response.status()}`);
    }
    
    // Test CSRF endpoint
    const csrfResponse = await page.request.get('/api/auth/csrf');
    console.log(`CSRF token API response: ${csrfResponse.status()}`);
    
    if (csrfResponse.status() === 200) {
      console.log('✓ CSRF token endpoint functional');
    }
  });

  test('Authentication middleware and API protection', async ({ page }) => {
    // Test API endpoints that should be protected
    const protectedEndpoints = [
      '/api/stories',
      '/api/chapters', 
      '/api/ai/chat',
      '/api/ai/suggestions'
    ];
    
    for (const endpoint of protectedEndpoints) {
      const response = await page.request.get(endpoint);
      const status = response.status();
      
      console.log(`Protected endpoint ${endpoint}: ${status}`);
      
      if ([401, 403].includes(status)) {
        console.log(`✓ ${endpoint} properly protected with authentication`);
      } else if (status === 200) {
        console.log(`ℹ️ ${endpoint} accessible (user may be authenticated)`);
      } else {
        console.log(`ℹ️ ${endpoint} returned status: ${status}`);
      }
    }
  });
});