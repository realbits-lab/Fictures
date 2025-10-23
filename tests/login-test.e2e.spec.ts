import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';

test.describe('Login functionality test', () => {
  test('should attempt login with reader credentials from .auth/user.json', async ({ page }) => {
    // Load authentication data from .auth/user.json
    const authData = JSON.parse(readFileSync(resolve(process.cwd(), '.auth/user.json'), 'utf-8'));
    const readerProfile = authData.profiles?.reader;

    if (!readerProfile) {
      throw new Error('Reader profile not found in .auth/user.json');
    }

    if (!readerProfile.password) {
      throw new Error('Reader profile does not have a password in .auth/user.json');
    }

    // Capture console messages and errors
    const consoleMessages: string[] = [];
    const pageErrors: string[] = [];
    const networkFailures: string[] = [];

    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);
      console.log('Browser console:', text);
    });

    page.on('pageerror', err => {
      pageErrors.push(err.message);
      console.log('Page error:', err.message);
    });

    page.on('requestfailed', request => {
      networkFailures.push(`${request.url()} - ${request.failure()?.errorText}`);
      console.log('Request failed:', request.url(), request.failure()?.errorText);
    });

    // Navigate to the application
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot of the initial page
    await page.screenshot({ path: 'logs/login-test-initial.png' });

    // Look for login/sign-in button or link
    const loginButton = page.locator('button:has-text("Sign in"), a:has-text("Sign in"), button:has-text("Login"), a:has-text("Login")').first();

    if (await loginButton.isVisible()) {
      console.log('Found login button, clicking...');
      await loginButton.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'logs/login-test-after-click.png' });
    }

    // Check if we're on the auth page or if there's a login form
    console.log('Current URL:', page.url());

    // Look for email input field
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();

    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Found email input field');
      await emailInput.fill(readerProfile.email);

      // Look for password input field
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

      if (await passwordInput.isVisible()) {
        console.log('Found password input field');
        await passwordInput.fill(readerProfile.password);

        // Take screenshot before submitting
        await page.screenshot({ path: 'logs/login-test-before-submit.png' });

        // Look for submit button
        const submitButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first();

        if (await submitButton.isVisible()) {
          console.log('Found submit button, clicking...');
          await submitButton.click();

          // Wait for navigation or response
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);

          // Take screenshot after submission
          await page.screenshot({ path: 'logs/login-test-after-submit.png' });

          console.log('Final URL:', page.url());

          // Check for error messages
          const errorMessage = await page.locator('[role="alert"], .error, .text-red-500, .text-red-600').first().textContent().catch(() => null);
          if (errorMessage) {
            console.log('Error message found:', errorMessage);
          }

          // Check if login was successful by looking for user-specific elements
          const isLoggedIn = await page.locator('[data-testid="user-menu"], button:has-text("Log out"), a:has-text("Profile")').first().isVisible({ timeout: 5000 }).catch(() => false);

          if (isLoggedIn) {
            console.log('Login appears successful');
            expect(isLoggedIn).toBe(true);
          } else {
            console.log('Login appears to have failed');

            // Get page content for debugging
            const pageContent = await page.content();
            console.log('Page HTML length:', pageContent.length);

            // Log any captured errors
            if (consoleMessages.length > 0) {
              console.log('\nBrowser console messages:', consoleMessages.join('\n'));
            }
            if (pageErrors.length > 0) {
              console.log('\nPage errors:', pageErrors.join('\n'));
            }
            if (networkFailures.length > 0) {
              console.log('\nNetwork failures:', networkFailures.join('\n'));
            }

            expect(isLoggedIn).toBe(true);
          }
        } else {
          console.log('Submit button not found');
          await page.screenshot({ path: 'logs/login-test-no-submit-button.png' });
          throw new Error('Submit button not found');
        }
      } else {
        console.log('Password input not found');
        await page.screenshot({ path: 'logs/login-test-no-password-input.png' });
        throw new Error('Password input not found');
      }
    } else {
      console.log('Email input not found. Checking authentication method...');

      // Check if it's using OAuth (Google Sign-In)
      const googleSignIn = page.locator('button:has-text("Google"), a:has-text("Google"), [data-provider="google"]').first();

      if (await googleSignIn.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('Found Google Sign-In button - this application uses OAuth, not email/password authentication');
        await page.screenshot({ path: 'logs/login-test-oauth-detected.png' });
        throw new Error('Application uses Google OAuth, not email/password authentication. The provided credentials cannot be used with OAuth.');
      } else {
        console.log('No email input or OAuth button found');
        await page.screenshot({ path: 'logs/login-test-no-login-form.png' });
        throw new Error('Could not find login form or OAuth buttons');
      }
    }
  });
});
