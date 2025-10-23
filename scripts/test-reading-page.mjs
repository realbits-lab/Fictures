import { chromium } from '@playwright/test';
import fs from 'fs';

async function testReadingPage() {
  console.log('Starting browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  // Load reader authentication if available
  const authPath = '.auth/user.json';
  if (fs.existsSync(authPath)) {
    const authData = JSON.parse(fs.readFileSync(authPath, 'utf-8'));

    // Set cookies for reader profile
    if (authData.profiles && authData.profiles.reader && authData.profiles.reader.cookies) {
      const readerCookies = authData.profiles.reader.cookies;
      if (readerCookies.length > 0) {
        await context.addCookies(readerCookies);
        console.log('Loaded reader cookies');
      }
    }
  }

  const page = await context.newPage();

  // Listen for console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const entry = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    };
    consoleMessages.push(entry);
    const msgType = msg.type().toUpperCase();
    console.log(`[${msgType}] ${msg.text()}`);
  });

  // Listen for page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
    console.error('Page error:', error.message);
  });

  // Listen for failed requests
  const failedRequests = [];
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()
    });
    console.error('Request failed:', request.url(), request.failure());
  });

  console.log('Navigating to http://localhost:3000/reading...');
  try {
    await page.goto('http://localhost:3000/reading', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Page loaded successfully');

    // Wait a bit to capture any delayed errors
    await page.waitForTimeout(3000);

    // Get page title and URL
    const title = await page.title();
    const url = page.url();
    console.log(`\nPage Title: ${title}`);
    console.log(`Final URL: ${url}`);

    // Summary
    console.log('\n=== ERROR SUMMARY ===');
    const errorCount = consoleMessages.filter(m => m.type === 'error').length;
    const warningCount = consoleMessages.filter(m => m.type === 'warning').length;
    console.log(`Console errors: ${errorCount}`);
    console.log(`Console warnings: ${warningCount}`);
    console.log(`Page errors: ${pageErrors.length}`);
    console.log(`Failed requests: ${failedRequests.length}`);

    if (errorCount > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      consoleMessages.filter(m => m.type === 'error').forEach((msg, idx) => {
        console.log(`\n${idx + 1}. ${msg.text}`);
        if (msg.location && msg.location.url) {
          console.log(`   Location: ${msg.location.url}:${msg.location.lineNumber}`);
        }
      });
    }

    if (pageErrors.length > 0) {
      console.log('\n=== PAGE ERRORS ===');
      pageErrors.forEach((error, idx) => {
        console.log(`\n${idx + 1}. ${error.message}`);
        if (error.stack) console.log(error.stack);
      });
    }

    if (failedRequests.length > 0) {
      console.log('\n=== FAILED REQUESTS ===');
      failedRequests.forEach((req, idx) => {
        console.log(`\n${idx + 1}. ${req.url}`);
        const errorText = req.failure?.errorText || 'Unknown';
        console.log(`   Failure: ${errorText}`);
      });
    }

  } catch (error) {
    console.error('Error during navigation:', error.message);
  }

  // Keep browser open for manual inspection
  console.log('\nBrowser will stay open for 60 seconds. Press Ctrl+C to close earlier.');
  await page.waitForTimeout(60000);

  await browser.close();
}

testReadingPage().catch(console.error);
