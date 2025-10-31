#!/usr/bin/env node

/**
 * Capture Writer Authentication
 *
 * This script logs in as writer@fictures.xyz and captures the session cookies
 * to .auth/user.json for use in other scripts.
 *
 * Prerequisites:
 * - Development server must be running on port 3000
 * - Writer account must exist with credentials from .auth/user.json
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/capture-writer-auth.mjs
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_FILE = path.join(__dirname, '../.auth/user.json');
const BASE_URL = 'http://localhost:3000';

async function loadAuthFile() {
  try {
    const content = await fs.readFile(AUTH_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Failed to load .auth/user.json:', error.message);
    process.exit(1);
  }
}

async function saveAuthFile(authData) {
  try {
    await fs.writeFile(AUTH_FILE, JSON.stringify(authData, null, 2), 'utf-8');
    console.log('✅ Saved updated authentication to .auth/user.json');
  } catch (error) {
    console.error('❌ Failed to save .auth/user.json:', error.message);
    process.exit(1);
  }
}

async function captureWriterAuth() {
  console.log('\n' + '='.repeat(70));
  console.log('🔐 CAPTURE WRITER AUTHENTICATION');
  console.log('='.repeat(70) + '\n');

  // Load existing auth data
  console.log('📖 Loading .auth/user.json...');
  const authData = await loadAuthFile();

  if (!authData.profiles?.writer) {
    console.error('❌ Writer profile not found in .auth/user.json');
    process.exit(1);
  }

  const writer = authData.profiles.writer;
  console.log(`✓ Found writer profile: ${writer.email}\n`);

  // Check if writer has credentials
  if (!writer.email || !writer.password) {
    console.error('❌ Writer profile missing email or password');
    process.exit(1);
  }

  console.log('🌐 Starting browser...');
  const browser = await chromium.launch({
    headless: false, // Show browser for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    // Navigate to login page
    console.log(`📍 Navigating to ${BASE_URL}/login...\n`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForTimeout(1000);

    console.log('🔑 Entering credentials...');
    console.log(`   Email: ${writer.email}`);
    console.log(`   Password: ${writer.password.replace(/./g, '*')}\n`);

    // Look for Google Sign In button or email/password form
    const googleButton = await page.locator('button:has-text("Sign in with Google")').first();

    if (await googleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('🔵 Google OAuth detected');
      console.log('⚠️  Manual intervention required:');
      console.log('   1. Click "Sign in with Google"');
      console.log(`   2. Log in with ${writer.email}`);
      console.log('   3. Complete authentication');
      console.log('   4. Wait for redirect to home page\n');
      console.log('⏳ Waiting for manual login (timeout: 120 seconds)...\n');

      // Wait for navigation to home page (successful login)
      await page.waitForURL(url =>
        url.pathname === '/' ||
        url.pathname.startsWith('/studio') ||
        url.pathname.startsWith('/novels') ||
        url.pathname.startsWith('/comics'), {
        timeout: 120000,
      });
    } else {
      // Try standard email/password form
      console.log('📧 Email/Password form detected');

      const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();
      const submitButton = await page.locator('button[type="submit"]').first();

      await emailInput.fill(writer.email);
      await passwordInput.fill(writer.password);
      await submitButton.click();

      console.log('⏳ Waiting for login to complete...\n');
      await page.waitForURL(url =>
        url.pathname === '/' ||
        url.pathname.startsWith('/studio') ||
        url.pathname.startsWith('/novels') ||
        url.pathname.startsWith('/comics'), {
        timeout: 30000,
      });
    }

    console.log('✅ Login successful!\n');

    // Wait a bit for all cookies to be set
    await page.waitForTimeout(2000);

    // Capture cookies
    console.log('🍪 Capturing session cookies...');
    const cookies = await context.cookies();

    console.log(`   Found ${cookies.length} cookies\n`);

    // Filter relevant cookies
    const relevantCookies = cookies.filter(c =>
      c.name.includes('authjs') ||
      c.name.includes('session') ||
      c.name.includes('next-auth')
    );

    console.log('📝 Relevant cookies:');
    relevantCookies.forEach(cookie => {
      const value = cookie.value.substring(0, 50);
      console.log(`   - ${cookie.name}: ${value}${cookie.value.length > 50 ? '...' : ''}`);
    });
    console.log('');

    // Capture localStorage
    console.log('💾 Capturing localStorage...');
    const localStorage = await page.evaluate(() => {
      const items = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          items.push({
            name: key,
            value: window.localStorage.getItem(key) || '',
          });
        }
      }
      return items;
    });

    console.log(`   Found ${localStorage.length} localStorage items\n`);

    // Update writer profile
    authData.profiles.writer.cookies = relevantCookies;
    authData.profiles.writer.origins = [
      {
        origin: BASE_URL,
        localStorage: localStorage,
      },
    ];

    // Save updated auth data
    await saveAuthFile(authData);

    console.log('\n' + '='.repeat(70));
    console.log('✅ AUTHENTICATION CAPTURED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('\n📊 Summary:');
    console.log(`   Profile: writer (${writer.email})`);
    console.log(`   Cookies: ${relevantCookies.length}`);
    console.log(`   localStorage: ${localStorage.length} items`);
    console.log(`   Saved to: ${AUTH_FILE}\n`);

    console.log('✨ You can now use writer authentication in other scripts!\n');

  } catch (error) {
    console.error('\n❌ Error during authentication capture:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Main execution
captureWriterAuth()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
