/**
 * Generate Story via UI
 *
 * Uses stored authentication from .auth/user.json to:
 * 1. Navigate to /studio/new
 * 2. Fill in story generation form
 * 3. Submit and monitor generation progress
 * 4. Capture console logs for debugging
 */

import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateStory() {
  console.log('🚀 Starting story generation via UI...\n');

  // Launch browser with stored authentication
  const browser = await chromium.launch({
    headless: false, // Show browser for visibility
  });

  const context = await browser.newContext({
    storageState: path.join(__dirname, '..', '.auth', 'user.json'),
  });

  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    // Filter for our generation API logs
    if (text.includes('[API]') || text.includes('━━━')) {
      console.log(`[BROWSER CONSOLE ${type.toUpperCase()}]`, text);
    }
  });

  // Capture network errors
  page.on('requestfailed', request => {
    console.error(`❌ Request failed: ${request.url()}`);
    console.error(`   Failure: ${request.failure()?.errorText || 'Unknown error'}`);
  });

  try {
    console.log('📍 Step 1: Navigating to /studio/new...');
    await page.goto('http://localhost:3000/studio/new', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    console.log('✅ Page loaded\n');

    // Wait for the form to be visible
    console.log('📍 Step 2: Waiting for story generation form...');
    await page.waitForSelector('form', { timeout: 10000 });
    console.log('✅ Form found\n');

    // Take a screenshot to see the form
    await page.screenshot({ path: 'logs/story-form-before.png', fullPage: true });
    console.log('📸 Screenshot saved: logs/story-form-before.png\n');

    console.log('📍 Step 3: Filling in story details...');

    // Fill in story prompt/title
    const promptField = await page.locator('textarea, input[type="text"]').first();
    await promptField.fill('A mysterious detective solves a complex murder case in a futuristic city.');
    console.log('✅ Story prompt filled');

    // Select genre (if dropdown exists)
    try {
      const genreSelect = await page.locator('select[name*="genre"], select:has-text("Genre")').first();
      if (await genreSelect.isVisible({ timeout: 2000 })) {
        await genreSelect.selectOption('mystery');
        console.log('✅ Genre selected: Mystery');
      }
    } catch (e) {
      console.log('ℹ️  Genre dropdown not found, skipping');
    }

    // Select tone (if dropdown exists)
    try {
      const toneSelect = await page.locator('select[name*="tone"], select:has-text("Tone")').first();
      if (await toneSelect.isVisible({ timeout: 2000 })) {
        await toneSelect.selectOption('dark');
        console.log('✅ Tone selected: Dark');
      }
    } catch (e) {
      console.log('ℹ️  Tone dropdown not found, skipping');
    }

    // Fill in numeric fields (if they exist)
    const numericFields = [
      { name: 'character', value: '3', label: 'Character Count' },
      { name: 'setting', value: '2', label: 'Setting Count' },
      { name: 'parts', value: '1', label: 'Parts Count' },
      { name: 'chapter', value: '3', label: 'Chapters per Part' },
      { name: 'scene', value: '6', label: 'Scenes per Chapter' },
    ];

    for (const field of numericFields) {
      try {
        const input = await page.locator(`input[name*="${field.name}"], input[type="number"]`).first();
        if (await input.isVisible({ timeout: 2000 })) {
          await input.fill(field.value);
          console.log(`✅ ${field.label}: ${field.value}`);
        }
      } catch (e) {
        console.log(`ℹ️  ${field.label} field not found, using defaults`);
      }
    }

    console.log('\n📍 Step 4: Taking screenshot before submission...');
    await page.screenshot({ path: 'logs/story-form-filled.png', fullPage: true });
    console.log('📸 Screenshot saved: logs/story-form-filled.png\n');

    console.log('📍 Step 5: Submitting form...');

    // Find and click the submit button
    const submitButton = await page.locator('button[type="submit"], button:has-text("Generate")').first();
    await submitButton.click();
    console.log('✅ Form submitted\n');

    console.log('📍 Step 6: Monitoring generation progress...');
    console.log('⏳ This may take 5-25 minutes depending on story complexity');
    console.log('💡 Watch the browser console logs above for detailed progress\n');

    // Wait for generation to start (look for loading indicators)
    try {
      await page.waitForSelector('[data-loading="true"], .loading, .spinner', { timeout: 5000 });
      console.log('✅ Generation started - monitoring console logs...\n');
    } catch (e) {
      console.log('ℹ️  No loading indicator found, generation may have started\n');
    }

    // Keep the browser open and monitor for 30 minutes
    console.log('🔍 Monitoring generation (browser will stay open)...');
    console.log('   Press Ctrl+C to stop monitoring\n');

    // Wait for completion or timeout
    await page.waitForTimeout(30 * 60 * 1000); // 30 minutes

  } catch (error) {
    console.error('\n❌ Error during story generation:');
    console.error(error);

    // Take error screenshot
    await page.screenshot({ path: 'logs/story-generation-error.png', fullPage: true });
    console.log('📸 Error screenshot saved: logs/story-generation-error.png');
  } finally {
    console.log('\n📍 Cleaning up...');
    await browser.close();
    console.log('✅ Browser closed');
  }
}

// Run the script
generateStory().catch(console.error);
