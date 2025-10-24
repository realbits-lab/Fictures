#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const authStatePath = '.auth/user.json';
const storyId = 'jHDY4hevsSqT5Nn4C4ANS';

async function testSceneStatusButton() {
  console.log('🧪 Testing scene status button display...');

  let browser;
  let context;
  let page;

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: true,
      devtools: false
    });

    // Check if auth state exists
    if (!fs.existsSync(authStatePath)) {
      console.log('❌ Authentication state file not found:', authStatePath);
      return;
    }

    // Create context with authentication state
    context = await browser.newContext({
      storageState: authStatePath
    });

    page = await context.newPage();

    // Navigate to the story page
    const storyUrl = `http://localhost:3000/write/story/${storyId}`;
    console.log(`📍 Navigating to: ${storyUrl}`);

    await page.goto(storyUrl, { waitUntil: 'networkidle' });

    // Wait for the page to load
    await page.waitForTimeout(3000);

    // Take a screenshot for debugging
    await page.screenshot({
      path: 'logs/scene-status-manual-test.png',
      fullPage: true
    });

    console.log('📸 Screenshot saved to logs/scene-status-manual-test.png');

    // Check current URL to see if redirected
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    if (currentUrl.includes('/login')) {
      console.log('❌ Redirected to login - authentication failed');
      return;
    }

    // Look for scene elements
    const sceneElements = await page.locator('[data-testid*="scene"], .scene-item, [class*="scene"], text=/scene/i').count();
    console.log(`🔍 Found ${sceneElements} potential scene elements`);

    // Look for any "Completed" buttons or status indicators
    const completedButtons = await page.locator('text="Completed"').count();
    const statusButtons = await page.locator('button:has-text("Completed"), [data-testid*="status"], .status-button').count();

    console.log(`🔍 Found ${completedButtons} "Completed" buttons`);
    console.log(`🔍 Found ${statusButtons} status buttons`);

    // Try to click on scenes and look for status buttons
    const sceneCards = page.locator('[data-testid^="scene-"], .scene-card');
    const sceneCardCount = await sceneCards.count();

    if (sceneCardCount > 0) {
      console.log(`🎬 Found ${sceneCardCount} scene cards, testing first one...`);

      // Click on the first scene
      await sceneCards.first().click();
      await page.waitForTimeout(1000);

      // Take another screenshot after clicking
      await page.screenshot({
        path: 'logs/scene-status-after-click.png'
      });

      // Check for status buttons again after clicking
      const postClickCompleted = await page.locator('text="Completed"').count();
      const postClickStatus = await page.locator('button:has-text("Completed"), [data-testid*="status"], .status-button').count();

      console.log(`🔍 After clicking scene - Completed buttons: ${postClickCompleted}`);
      console.log(`🔍 After clicking scene - Status buttons: ${postClickStatus}`);

      if (postClickCompleted > 0 || postClickStatus > 0) {
        console.log('❌ ISSUE FOUND: Scene status button is being displayed when it should not be');

        // Get the actual text content for debugging
        const completedTexts = await page.locator('text="Completed"').allTextContents();
        console.log('📝 Completed button texts:', completedTexts);

        return false;
      } else {
        console.log('✅ GOOD: No scene status buttons found after clicking scene');
        return true;
      }
    } else {
      console.log('⚠️ No scene cards found on the page');

      // Try a more generic approach - look for any clickable scene elements
      const anyScenes = page.locator('text=/scene/i').first();
      const anySceneExists = await anyScenes.count() > 0;

      if (anySceneExists) {
        console.log('🎬 Found scene text, clicking...');
        await anyScenes.click();
        await page.waitForTimeout(1000);

        const anyCompleted = await page.locator('text="Completed"').count();
        if (anyCompleted > 0) {
          console.log('❌ ISSUE FOUND: Scene status button found after clicking scene text');
          return false;
        }
      }

      console.log('✅ No status issues found (no scenes to test)');
      return true;
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
    return false;
  } finally {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  }
}

// Run the test
if (process.argv[1] === new URL(import.meta.url).pathname) {
  testSceneStatusButton()
    .then(success => {
      if (success) {
        console.log('✅ Scene status button test passed');
        process.exit(0);
      } else {
        console.log('❌ Scene status button test failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test crashed:', error);
      process.exit(1);
    });
}