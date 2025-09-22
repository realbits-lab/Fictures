import { chromium } from 'playwright';
import fs from 'fs';

async function testStoryCreation() {
  console.log('Starting story creation test with manager credentials...');

  // Load authentication data
  const authData = JSON.parse(fs.readFileSync('.auth/user.json', 'utf-8'));
  const credentials = authData.managerCredentials;

  // Launch browser
  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login');

    // Check if there's a credential login option (not just Google)
    // First try to find email/password form
    const emailInput = await page.locator('input[name="email"], input[type="email"]').count();

    if (emailInput === 0) {
      // If no email input, click on any "Sign in with credentials" or similar button
      const credentialButtons = await page.locator('button:has-text("credential"), button:has-text("email"), button:has-text("password")').count();
      if (credentialButtons > 0) {
        await page.locator('button:has-text("credential"), button:has-text("email"), button:has-text("password")').first().click();
        await page.waitForTimeout(500);
      }
    }

    // Now try to login with credentials
    console.log('Attempting login with manager credentials...');

    // Fill email
    await page.fill('input[name="email"], input[type="email"]', credentials.email);

    // Fill password
    await page.fill('input[name="password"], input[type="password"]', credentials.password);

    // Take screenshot before login
    await page.screenshot({
      path: 'logs/login-form-filled.png'
    });
    console.log('Login form screenshot saved');

    // Submit login form
    await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').click();

    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    console.log('Login successful, navigating to story creation...');

    // Navigate to new story page
    await page.goto('http://localhost:3000/stories/new');
    await page.waitForLoadState('networkidle');

    // Check if we're on the story creation page
    const url = page.url();
    console.log('Current URL:', url);

    if (url.includes('/login')) {
      throw new Error('Still on login page - authentication failed');
    }

    // Fill in the story creation form
    console.log('Filling story creation form...');

    // Title
    await page.fill('input[name="title"]', 'Test Story - Automated Creation');

    // Description
    await page.fill('textarea[name="description"]', 'This is an automated test story created with Playwright to verify the story creation functionality.');

    // Genre selection (if exists)
    const genreSelect = await page.locator('select[name="genre"]').count();
    if (genreSelect > 0) {
      await page.selectOption('select[name="genre"]', 'fantasy');
    }

    // Language (if exists)
    const langSelect = await page.locator('select[name="language"]').count();
    if (langSelect > 0) {
      await page.selectOption('select[name="language"]', 'en');
    }

    // Visibility (if exists)
    const visibilitySelect = await page.locator('select[name="visibility"]').count();
    if (visibilitySelect > 0) {
      await page.selectOption('select[name="visibility"]', 'private');
    }

    // Take a screenshot before submission
    await page.screenshot({
      path: 'logs/story-form-filled.png',
      fullPage: true
    });
    console.log('Story form screenshot saved');

    // Submit the form
    console.log('Submitting story creation form...');
    await page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').click();

    // Wait for navigation after submission
    await page.waitForURL('**/stories/**', { timeout: 10000 });

    // Get the new story URL
    const newStoryUrl = page.url();
    console.log('✅ Story created successfully!');
    console.log('New story URL:', newStoryUrl);

    // Take a screenshot of the created story
    await page.screenshot({
      path: 'logs/story-created.png',
      fullPage: true
    });
    console.log('Created story screenshot saved');

    // Extract story ID from URL
    const storyIdMatch = newStoryUrl.match(/\/stories\/([a-z0-9-]+)/);
    if (storyIdMatch) {
      console.log('Story ID:', storyIdMatch[1]);
      return storyIdMatch[1];
    }

  } catch (error) {
    console.error('❌ Error during story creation:', error.message);

    // Take error screenshot
    await page.screenshot({
      path: 'logs/error-screenshot.png',
      fullPage: true
    });
    console.log('Error screenshot saved');

    // Log page content for debugging
    const pageContent = await page.content();
    fs.writeFileSync('logs/error-page.html', pageContent);
    console.log('Error page HTML saved');

    throw error;
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the test
testStoryCreation()
  .then((storyId) => {
    console.log('\n✅ Test completed successfully!');
    if (storyId) {
      console.log(`Created story with ID: ${storyId}`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });