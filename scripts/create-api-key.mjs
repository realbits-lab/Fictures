#!/usr/bin/env node

/**
 * Create an API key using Playwright with saved authentication
 *
 * This script:
 * 1. Loads authentication from .auth/user.json
 * 2. Navigates to API keys settings
 * 3. Creates a new API key
 * 4. Saves it to .auth/user.json
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const AUTH_FILE = path.join(__dirname, '..', '.auth', 'user.json');

async function createApiKey() {
  console.log('🚀 Creating API key using saved authentication...\n');

  // Check if auth file exists
  if (!fs.existsSync(AUTH_FILE)) {
    throw new Error(`Authentication file not found: ${AUTH_FILE}\nPlease run: dotenv --file .env.local run node scripts/capture-auth-manual.mjs`);
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: AUTH_FILE,
  });

  const page = await context.newPage();

  try {
    console.log('📄 Navigating to API Keys settings...');
    await page.goto(`${BASE_URL}/settings/api-keys`, { waitUntil: 'networkidle' });

    // Wait a bit for page to load
    await page.waitForTimeout(2000);

    console.log('🔍 Looking for create API key button...');

    // Try different possible button texts/selectors
    const createButtonSelectors = [
      'button:has-text("Create API Key")',
      'button:has-text("New API Key")',
      'button:has-text("Generate Key")',
      'button:has-text("Add Key")',
      '[data-testid="create-api-key"]',
      'button[aria-label*="Create"]',
    ];

    let createButton = null;
    for (const selector of createButtonSelectors) {
      try {
        createButton = await page.locator(selector).first();
        if (await createButton.isVisible({ timeout: 1000 })) {
          console.log(`✅ Found button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!createButton || !await createButton.isVisible()) {
      console.log('📸 Taking screenshot for debugging...');
      await page.screenshot({ path: 'logs/api-keys-page.png', fullPage: true });
      throw new Error('Could not find Create API Key button. Screenshot saved to logs/api-keys-page.png');
    }

    console.log('👆 Clicking create button...');
    await createButton.click();
    await page.waitForTimeout(1000);

    // Fill in the form
    console.log('📝 Filling in API key details...');

    // Name field
    const nameInput = await page.locator('input[name="name"], input[placeholder*="name" i], input[aria-label*="name" i]').first();
    await nameInput.fill('Development API Key');

    // Select scopes (stories:read and stories:write)
    console.log('✅ Selecting scopes...');

    // Look for checkboxes or multi-select for scopes
    const scopeSelectors = [
      'input[type="checkbox"][value*="stories:read"]',
      'label:has-text("stories:read") input',
      '[data-scope="stories:read"]',
    ];

    for (const selector of scopeSelectors) {
      try {
        const checkbox = await page.locator(selector).first();
        if (await checkbox.isVisible({ timeout: 1000 })) {
          await checkbox.check();
          console.log('   ✓ stories:read');
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    const writeSelectors = [
      'input[type="checkbox"][value*="stories:write"]',
      'label:has-text("stories:write") input',
      '[data-scope="stories:write"]',
    ];

    for (const selector of writeSelectors) {
      try {
        const checkbox = await page.locator(selector).first();
        if (await checkbox.isVisible({ timeout: 1000 })) {
          await checkbox.check();
          console.log('   ✓ stories:write');
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    // Submit the form
    console.log('🚀 Creating API key...');
    const submitButton = await page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Generate")').first();
    await submitButton.click();

    // Wait for the API key to be displayed
    await page.waitForTimeout(2000);

    // Try to find and copy the API key
    console.log('🔑 Looking for API key...');

    const apiKeySelectors = [
      'code:has-text("fic_")',
      'pre:has-text("fic_")',
      'input[value^="fic_"]',
      '[data-testid="api-key-value"]',
      '.api-key-value',
    ];

    let apiKey = null;
    for (const selector of apiKeySelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          apiKey = await element.textContent() || await element.inputValue();
          if (apiKey && apiKey.startsWith('fic_')) {
            console.log(`✅ Found API key: ${apiKey.substring(0, 20)}...`);
            break;
          }
        }
      } catch (e) {
        // Continue
      }
    }

    if (!apiKey) {
      console.log('⚠️  Could not automatically extract API key.');
      console.log('📸 Taking screenshot...');
      await page.screenshot({ path: 'logs/api-key-created.png', fullPage: true });
      console.log('Please copy the API key from the screenshot: logs/api-key-created.png');

      // Wait for user to see the key
      await page.waitForTimeout(10000);
    } else {
      // Save API key to .auth/user.json
      console.log('\n💾 Saving API key to .auth/user.json...');

      let authData = {};
      if (fs.existsSync(AUTH_FILE)) {
        authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
      }

      authData.apiKey = apiKey;
      authData.apiKeyCreatedAt = new Date().toISOString();

      fs.writeFileSync(AUTH_FILE, JSON.stringify(authData, null, 2));
      console.log('✅ API key saved to .auth/user.json');

      // Also add to .env.local
      console.log('\n💾 Adding to .env.local...');
      const envPath = path.join(__dirname, '..', '.env.local');
      let envContent = '';

      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
      }

      // Remove existing TEST_API_KEY if present
      envContent = envContent.split('\n').filter(line => !line.startsWith('TEST_API_KEY=')).join('\n');

      // Add new key
      if (envContent && !envContent.endsWith('\n')) {
        envContent += '\n';
      }
      envContent += `\n# API Key for testing (generated ${new Date().toISOString()})\n`;
      envContent += `TEST_API_KEY=${apiKey}\n`;

      fs.writeFileSync(envPath, envContent);
      console.log('✅ API key added to .env.local as TEST_API_KEY');

      console.log('\n' + '='.repeat(80));
      console.log('✅ API Key Created Successfully!');
      console.log('='.repeat(80));
      console.log(`\n🔑 API Key: ${apiKey}\n`);
      console.log('📝 Saved to:');
      console.log(`   - .auth/user.json (apiKey field)`);
      console.log(`   - .env.local (TEST_API_KEY variable)`);
      console.log('\n🎯 You can now use this key for API calls:');
      console.log(`   dotenv --file .env.local run node scripts/generate-story-with-sse.mjs`);
      console.log('='.repeat(80));
    }

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'logs/error-screenshot.png', fullPage: true });
    console.log('Error screenshot saved to logs/error-screenshot.png');
    throw error;
  } finally {
    await browser.close();
  }
}

async function main() {
  try {
    await createApiKey();
  } catch (error) {
    console.error('\n❌ Failed to create API key:', error.message);
    process.exit(1);
  }
}

main();
