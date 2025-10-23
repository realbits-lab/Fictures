import { chromium } from '@playwright/test';
import fs from 'fs';

const TEST_URL = 'http://localhost:3000/community/story/_y60HW1nK38viNWtMoSrx';
const LOG_FILE = 'logs/delete-post-test.log';

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(LOG_FILE, logMessage);
}

async function testDeletePost() {
  fs.writeFileSync(LOG_FILE, '');
  log('Starting delete post test...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: '.auth/user.json'
  });

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      log(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    log(`[PAGE ERROR] ${error.message}`);
  });

  try {
    log(`Navigating to ${TEST_URL}...`);
    await page.goto(TEST_URL);

    log('Waiting for page to load...');
    await page.waitForSelector('text=Community Discussions', { timeout: 10000 });

    log('Looking for Create Post button...');
    const createButton = await page.getByRole('button', { name: /Create Post/i });

    if (await createButton.isVisible()) {
      log('Clicking Create Post button...');
      await createButton.click();

      await page.waitForSelector('text=Create New Post', { timeout: 5000 });
      log('Create post form opened!');

      log('Filling in the post form...');
      await page.getByLabel('Post Title').fill('Test Post to Delete');
      await page.locator('textarea#content').fill('This post will be deleted to test the delete functionality.');

      log('Submitting the post...');
      await page.getByRole('button', { name: /Create Post/i, exact: false }).last().click();

      log('Waiting for success toast...');
      await page.waitForSelector('text=Post created successfully', { timeout: 10000 });

      log('Success! Post was created.');
      await page.waitForTimeout(2000);

      log('Checking if post appears in the list...');
      const postTitle = await page.getByText('Test Post to Delete');
      if (await postTitle.isVisible()) {
        log('✓ Post appears in the list!');

        log('Looking for delete button...');
        const deleteButton = await page.getByRole('button', { name: /Delete/i }).first();

        if (await deleteButton.isVisible()) {
          log('✓ Delete button is visible!');

          log('Clicking delete button...');
          await deleteButton.click();

          log('Waiting for confirmation...');
          await page.waitForSelector('text=Are you sure?', { timeout: 3000 });
          log('✓ Confirmation dialog appeared!');

          log('Clicking Yes, Delete button...');
          const confirmButton = await page.getByRole('button', { name: /Yes, Delete/i });
          await confirmButton.click();

          log('Waiting for success toast...');
          await page.waitForSelector('text=Post deleted successfully', { timeout: 10000 });
          log('✓ Delete success toast appeared!');

          await page.waitForTimeout(2000);

          log('Checking if post was removed from list...');
          const deletedPost = await page.getByText('Test Post to Delete');
          if (!(await deletedPost.isVisible())) {
            log('✓ Post was successfully removed from the list!');
            log('✓✓✓ ALL TESTS PASSED! ✓✓✓');
          } else {
            log('✗ Post is still visible after deletion');
          }
        } else {
          log('✗ Delete button not visible');
        }
      } else {
        log('✗ Post not visible in the list');
      }
    } else {
      log('Create Post button not visible - user might not be signed in');
    }

    log('\nTest completed. Keeping browser open for inspection...');
    await page.waitForTimeout(5000);

  } catch (error) {
    log(`Test failed: ${error.message}`);
  } finally {
    await browser.close();
    log('Browser closed.');
  }
}

testDeletePost();
