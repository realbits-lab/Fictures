import { chromium } from '@playwright/test';

const TEST_URL = 'http://localhost:3000/community/story/_y60HW1nK38viNWtMoSrx';

async function testCommunityPost() {
  console.log('Starting community post test...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: '.auth/user.json'
  });

  const page = await context.newPage();

  try {
    console.log(`Navigating to ${TEST_URL}...`);
    await page.goto(TEST_URL);

    console.log('Waiting for page to load...');
    await page.waitForSelector('text=Community Discussions', { timeout: 10000 });

    console.log('Looking for Create Post button...');
    const createButton = await page.getByRole('button', { name: /Create Post/i });

    if (await createButton.isVisible()) {
      console.log('Clicking Create Post button...');
      await createButton.click();

      await page.waitForSelector('text=Create New Post', { timeout: 5000 });
      console.log('Create post form opened!');

      console.log('Filling in the post form...');
      await page.getByLabel('Post Title').fill('Test Post from Automation');
      await page.locator('textarea#content').fill('This is a test post to verify the community posting functionality works correctly.');

      console.log('Submitting the post...');
      await page.getByRole('button', { name: /Create Post/i, exact: false }).last().click();

      console.log('Waiting for success toast...');
      await page.waitForSelector('text=Post created successfully', { timeout: 10000 });

      console.log('Success! Post was created.');

      await page.waitForTimeout(2000);

      console.log('Checking if post appears in the list...');
      const postTitle = await page.getByText('Test Post from Automation');
      if (await postTitle.isVisible()) {
        console.log('✓ Post appears in the list!');
      } else {
        console.log('✗ Post not visible in the list');
      }
    } else {
      console.log('Create Post button not visible - user might not be signed in');
    }

    console.log('\nTest completed. Keeping browser open for inspection...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testCommunityPost();
