#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the manager credentials
const authData = JSON.parse(await fs.readFile(path.join(__dirname, '..', '.auth', 'user.json'), 'utf8'));
const { managerCredentials } = authData;

async function loginWithCredentials() {
  console.log('🔐 Setting up authentication with credentials provider...');
  console.log(`   Email: ${managerCredentials.email}`);

  const browser = await chromium.launch({
    headless: false // Show browser for debugging
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // First, get a CSRF token
    await page.goto('http://localhost:3000/api/auth/csrf');
    const csrfResponse = await page.evaluate(() => document.body.textContent);
    const { csrfToken } = JSON.parse(csrfResponse);
    console.log('✅ Got CSRF token');

    // Now attempt to sign in via credentials
    const signInResponse = await page.evaluate(async ({ email, password, csrfToken }) => {
      const formData = new URLSearchParams();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('csrfToken', csrfToken);
      formData.append('callbackUrl', 'http://localhost:3000/stories');
      formData.append('json', 'true');

      const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        credentials: 'include'
      });

      return {
        ok: response.ok,
        status: response.status,
        url: response.url,
        text: await response.text()
      };
    }, { email: managerCredentials.email, password: managerCredentials.password, csrfToken });

    console.log('Sign in response:', signInResponse);

    if (signInResponse.ok || signInResponse.url.includes('/stories')) {
      console.log('✅ Successfully signed in');

      // Navigate to the protected page to ensure cookies are set
      await page.goto('http://localhost:3000/stories');

      // Wait a moment for any redirects
      await page.waitForTimeout(2000);

      // Check if we're on the stories page or redirected to login
      const currentUrl = page.url();
      if (currentUrl.includes('/stories')) {
        console.log('✅ Successfully accessed protected route');
      } else if (currentUrl.includes('/login')) {
        console.log('⚠️  Was redirected to login page');
      }

      // Save the storage state
      const storageState = await context.storageState();
      await fs.writeFile(
        path.join(__dirname, '..', '.auth', 'playwright-user.json'),
        JSON.stringify(storageState, null, 2)
      );

      console.log('✅ Authentication state saved');
    } else {
      console.log('❌ Sign in failed');
      console.log('Response:', signInResponse);
    }

  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
  } finally {
    // Keep browser open for 5 seconds to see the result
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

loginWithCredentials().catch(console.error);