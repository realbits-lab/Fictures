import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const writerFile = '.auth/writer.json';
const readerFile = '.auth/reader.json';
const managerFile = '.auth/manager.json';

// Helper to check if auth file exists and has valid session
function hasValidAuth(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    const authData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Check if cookies exist and session token is present
    if (!authData.cookies || authData.cookies.length === 0) {
      return false;
    }

    const sessionToken = authData.cookies.find(
      (cookie: any) => cookie.name === 'authjs.session-token'
    );

    if (!sessionToken) {
      return false;
    }

    // Check if session token is not expired
    if (sessionToken.expires !== -1 && sessionToken.expires < Date.now() / 1000) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Helper to perform login
async function login(page: any, email: string, password: string, expectedUrl: string) {
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');

  // Fill email field
  await page.fill('input[type="email"], input[name="email"]', email);

  // Fill password field
  await page.fill('input[type="password"], input[name="password"]', password);

  // Click sign in button
  await page.click('button:has-text("Sign in with Email"), button:has-text("Sign in")');
  await page.waitForLoadState('networkidle');

  // Wait for redirect after successful login
  await page.waitForTimeout(2000);

  // Verify we're logged in by checking URL
  await expect(page).toHaveURL(new RegExp(expectedUrl));
}

setup('authenticate as writer', async ({ page }) => {
  // Skip if valid auth already exists
  if (hasValidAuth(writerFile)) {
    console.log('Writer authentication already valid, skipping...');
    return;
  }

  const authData = JSON.parse(fs.readFileSync(writerFile, 'utf-8'));
  await login(page, authData.email, authData.password, 'studio|stories');

  // Save the authentication state
  await page.context().storageState({ path: writerFile });

  // Update the auth file to preserve API key data
  const newAuthData = JSON.parse(fs.readFileSync(writerFile, 'utf-8'));
  const mergedAuthData = {
    ...authData,
    ...newAuthData,
  };
  fs.writeFileSync(writerFile, JSON.stringify(mergedAuthData, null, 2));
});

setup('authenticate as reader', async ({ page }) => {
  // Skip if valid auth already exists
  if (hasValidAuth(readerFile)) {
    console.log('Reader authentication already valid, skipping...');
    return;
  }

  const authData = JSON.parse(fs.readFileSync(readerFile, 'utf-8'));
  await login(page, authData.email, authData.password, 'novels|stories');

  // Save the authentication state
  await page.context().storageState({ path: readerFile });

  // Update the auth file to preserve API key data
  const newAuthData = JSON.parse(fs.readFileSync(readerFile, 'utf-8'));
  const mergedAuthData = {
    ...authData,
    ...newAuthData,
  };
  fs.writeFileSync(readerFile, JSON.stringify(mergedAuthData, null, 2));
});

setup('authenticate as manager', async ({ page }) => {
  // Skip if valid auth already exists
  if (hasValidAuth(managerFile)) {
    console.log('Manager authentication already valid, skipping...');
    return;
  }

  const authData = JSON.parse(fs.readFileSync(managerFile, 'utf-8'));
  await login(page, authData.email, authData.password, 'studio|stories');

  // Save the authentication state
  await page.context().storageState({ path: managerFile });

  // Update the auth file to preserve API key data
  const newAuthData = JSON.parse(fs.readFileSync(managerFile, 'utf-8'));
  const mergedAuthData = {
    ...authData,
    ...newAuthData,
  };
  fs.writeFileSync(managerFile, JSON.stringify(mergedAuthData, null, 2));
});
