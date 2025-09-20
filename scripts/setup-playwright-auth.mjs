#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the manager credentials from .auth/user.json
const authData = JSON.parse(await fs.readFile(path.join(__dirname, '..', '.auth', 'user.json'), 'utf8'));
const { managerCredentials } = authData;

async function setupAuthentication() {
  console.log('🔐 Setting up Playwright authentication with manager account...');
  console.log(`   Email: ${managerCredentials.email}`);

  const browser = await chromium.launch({
    headless: true // Run in headless mode
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to login page
    await page.goto('http://localhost:3000/login');

    // Since the app uses Google OAuth, we need to check if there's a way to use credentials
    // First, let's check what's available on the login page
    const pageContent = await page.content();

    if (pageContent.includes('Continue with Google')) {
      console.log('⚠️  Login page only has Google OAuth.');
      console.log('   Creating a development session using manager credentials...');

      // For development, we'll need to create a proper session
      // This would typically require backend support for credentials login
      // For now, let's check if there's an API endpoint for credentials login

      const loginResponse = await page.evaluate(async (credentials) => {
        try {
          const response = await fetch('/api/auth/callback/credentials', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              email: credentials.email,
              password: credentials.password,
              csrfToken: '', // Would need to get this from the page
            }),
          });
          return {
            status: response.status,
            ok: response.ok,
            url: response.url
          };
        } catch (error) {
          return { error: error.message };
        }
      }, managerCredentials);

      if (loginResponse.ok) {
        console.log('✅ Successfully authenticated via API');

        // Save the authentication state
        const storageState = await context.storageState();
        await fs.writeFile(
          path.join(__dirname, '..', '.auth', 'playwright-user.json'),
          JSON.stringify(storageState, null, 2)
        );

        console.log('✅ Authentication state saved to .auth/playwright-user.json');
      } else {
        console.log('⚠️  Credentials login not available. Manual setup required.');
        console.log('   You may need to:');
        console.log('   1. Add credentials provider to your NextAuth config');
        console.log('   2. Or manually authenticate and save the session');
      }
    }

  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the setup
setupAuthentication().catch(console.error);