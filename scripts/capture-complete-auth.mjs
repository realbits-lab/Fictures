#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

console.log('🔐 Complete Authentication Capture Tool');
console.log('====================================');

const AUTH_DIR = '.auth';
const AUTH_FILE = path.join(AUTH_DIR, 'user.json');

// Ensure auth directory exists
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

async function captureCompleteAuth() {
  let browser, context, page;

  try {
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({
      headless: false,
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    page = await context.newPage();

    console.log('🌐 Navigating to Fictures...');
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if already authenticated by looking for user button
    const userButton = await page.locator('button:has-text("전종환")').count();

    if (userButton > 0) {
      console.log('✅ User already authenticated! Capturing current state...');
    } else {
      console.log('❌ User not authenticated. Please ensure you are logged in first.');
      await browser.close();
      return;
    }

    // Get all cookies from the context
    console.log('🍪 Capturing all cookies...');
    const cookies = await context.cookies();

    // Get localStorage data
    console.log('💾 Capturing localStorage...');
    const localStorage = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        data[key] = window.localStorage.getItem(key);
      }
      return data;
    });

    // Get sessionStorage data
    console.log('💾 Capturing sessionStorage...');
    const sessionStorage = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        data[key] = window.sessionStorage.getItem(key);
      }
      return data;
    });

    // Prepare auth data
    const authData = {
      cookies: cookies,
      origins: [
        {
          origin: 'http://localhost:3000',
          localStorage: Object.entries(localStorage).map(([name, value]) => ({ name, value })),
          sessionStorage: Object.entries(sessionStorage).map(([name, value]) => ({ name, value }))
        }
      ]
    };

    // Save to file
    console.log('💾 Saving authentication data...');
    fs.writeFileSync(AUTH_FILE, JSON.stringify(authData, null, 2));

    console.log('✅ Complete authentication data saved to:', AUTH_FILE);
    console.log('📊 Captured authentication data contains:');
    console.log(`   - ${cookies.length} cookies`);
    console.log(`   - ${Object.keys(localStorage).length} localStorage items`);
    console.log(`   - ${Object.keys(sessionStorage).length} sessionStorage items`);

    // Show cookie details
    console.log('🍪 Cookie domains:', [...new Set(cookies.map(c => c.domain))].join(', '));
    console.log('🔐 Authentication cookies found:');
    cookies.forEach(cookie => {
      if (cookie.name.includes('auth') || cookie.name.includes('session') || cookie.name.includes('token')) {
        console.log(`   - ${cookie.name} (${cookie.domain})`);
      }
    });

    console.log('🎉 Complete authentication capture completed successfully!');
    console.log('💡 You can now use this for automated Playwright tests');

  } catch (error) {
    console.error('❌ Error capturing authentication:', error);
  } finally {
    if (browser) {
      console.log('👋 Closing browser...');
      await browser.close();
    }
  }
}

// Run the capture
captureCompleteAuth();