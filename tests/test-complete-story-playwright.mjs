#!/usr/bin/env node

/**
 * Test "complete story data" functionality using Playwright with authentication
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function testCompleteStoryData() {
  console.log('🧪 Testing "complete story data" functionality with Playwright...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Create context with stored authentication
    const context = await browser.newContext({
      storageState: '.auth/user.json'
    });

    const page = await context.newPage();

    // Navigate to the writing page
    console.log('📍 Navigating to writing page...');
    await page.goto('http://localhost:3000/write/yxa_EBv-EfyyRC3rEMQR6', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for page to load completely
    await page.waitForTimeout(3000);

    console.log('📋 Page title:', await page.title());
    console.log('🔗 Current URL:', page.url());

    // Check if we're authenticated and on the right page
    if (page.url().includes('/login')) {
      throw new Error('Authentication failed - redirected to login page');
    }

    // Look for Story Prompt Writer component
    console.log('🔍 Looking for Story Prompt Writer...');

    // Wait for the Story Prompt Writer to be visible
    await page.waitForSelector('[data-testid="story-prompt-writer"], .story-prompt-writer, h3:has-text("Story Prompt Writer")', {
      timeout: 10000
    });

    console.log('✅ Story Prompt Writer found!');

    // Find the input field for the story prompt
    const inputSelector = 'textarea[placeholder*="prompt"], textarea[placeholder*="request"], input[placeholder*="prompt"], input[placeholder*="request"]';
    await page.waitForSelector(inputSelector, { timeout: 5000 });

    console.log('📝 Found input field, typing "complete story data"...');

    // Clear any existing text and type our test prompt
    await page.fill(inputSelector, '');
    await page.type(inputSelector, 'complete story data');

    // Look for submit button
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Send"), button:has-text("Generate"), button[type="submit"]').first();

    console.log('🔄 Submitting request...');
    await submitButton.click();

    // Wait for response with a longer timeout since GPT-5 takes time
    console.log('⏳ Waiting for AI response (this may take 2-4 minutes with GPT-5 high reasoning)...');

    // Monitor for changes in the YAML display or response area
    let responseReceived = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes total

    while (!responseReceived && attempts < maxAttempts) {
      await page.waitForTimeout(5000); // Wait 5 seconds between checks
      attempts++;

      // Check for YAML content or response indicators
      const yamlContent = await page.textContent('body');

      if (yamlContent.includes('parts:') || yamlContent.includes('serial:') || yamlContent.includes('hooks:')) {
        responseReceived = true;
        console.log('✅ Response received!');
        break;
      }

      if (attempts % 6 === 0) { // Log every 30 seconds
        console.log(`⏳ Still waiting... (${attempts * 5}s elapsed)`);
      }
    }

    if (!responseReceived) {
      throw new Error('No response received within timeout period');
    }

    // Capture the current page content for analysis
    const pageContent = await page.content();

    // Look for YAML sections in the page
    const yamlSections = await page.locator('code, pre, .yaml-display, [class*="yaml"]').allTextContents();

    console.log('📊 Analyzing results...');

    // Check for specific empty fields that should be completed
    const checks = {
      parts: false,
      serial: false,
      hooks: false,
      setting: false,
      themes: false,
      chars: false
    };

    let foundYaml = '';
    for (const section of yamlSections) {
      if (section.includes('story:') || section.includes('parts:') || section.includes('serial:')) {
        foundYaml = section;
        break;
      }
    }

    if (!foundYaml) {
      // Try to find YAML content in the general page content
      const bodyText = await page.textContent('body');
      foundYaml = bodyText;
    }

    console.log('📋 YAML Analysis Results:');

    // Check each required field
    if (foundYaml.includes('parts:') && !foundYaml.includes('parts: []')) {
      checks.parts = true;
      console.log('  ✅ Parts: Completed');
    } else {
      console.log('  ❌ Parts: Empty or missing');
    }

    if (foundYaml.includes('serial:') && (foundYaml.includes('schedule:') || foundYaml.includes('duration:'))) {
      checks.serial = true;
      console.log('  ✅ Serial: Completed');
    } else {
      console.log('  ❌ Serial: Empty or missing');
    }

    if (foundYaml.includes('hooks:') && (foundYaml.includes('overarching:') || foundYaml.includes('mysteries:'))) {
      checks.hooks = true;
      console.log('  ✅ Hooks: Completed');
    } else {
      console.log('  ❌ Hooks: Empty or missing');
    }

    if (foundYaml.includes('setting:') && (foundYaml.includes('primary:') || foundYaml.includes('secondary:'))) {
      checks.setting = true;
      console.log('  ✅ Setting: Completed');
    } else {
      console.log('  ❌ Setting: Empty or missing');
    }

    if (foundYaml.includes('themes:') && !foundYaml.includes('themes: []')) {
      checks.themes = true;
      console.log('  ✅ Themes: Completed');
    } else {
      console.log('  ❌ Themes: Empty or missing');
    }

    if (foundYaml.includes('chars:') && !foundYaml.includes('chars: {}')) {
      checks.chars = true;
      console.log('  ✅ Characters: Completed');
    } else {
      console.log('  ❌ Characters: Empty or missing');
    }

    // Calculate completion score
    const completedFields = Object.values(checks).filter(Boolean).length;
    const totalFields = Object.keys(checks).length;
    const completionScore = Math.round((completedFields / totalFields) * 100);

    console.log(`\n📈 Completion Score: ${completionScore}% (${completedFields}/${totalFields} fields completed)`);

    // Save results for analysis
    const results = {
      timestamp: new Date().toISOString(),
      completionScore,
      checks,
      foundYaml: foundYaml.substring(0, 2000), // First 2000 chars for analysis
      url: page.url(),
      success: completionScore >= 80
    };

    fs.writeFileSync('logs/playwright-story-test-results.json', JSON.stringify(results, null, 2));
    console.log('💾 Results saved to logs/playwright-story-test-results.json');

    return results;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
testCompleteStoryData()
  .then(results => {
    if (results.success) {
      console.log('\n🎉 Test completed successfully!');
      process.exit(0);
    } else {
      console.log('\n💥 Test failed - needs system prompt improvements');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });