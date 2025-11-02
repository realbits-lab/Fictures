import { chromium } from '@playwright/test';

console.log('\n=== Starting Auth Setup ===\n');
console.log('Opening browser...');
console.log('Please login manually and the script will save your session.\n');

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

await page.goto('http://localhost:3000/login');
console.log('Waiting 2 minutes for you to login...');
await page.waitForTimeout(120000);

await context.storageState({ path: '.auth/writer.json' });
await context.storageState({ path: '.auth/user.json' });
console.log('\n✅ Auth saved!');
await browser.close();
