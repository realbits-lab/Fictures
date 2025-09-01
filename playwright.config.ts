import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 240000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'authenticated',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: '@playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /.*\.authenticated\.spec\.ts/,
    },
    {
      name: 'e2e',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.e2e\.spec\.ts/,
    },
    {
      name: 'api',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.api\.spec\.ts/,
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 12'] },
      testMatch: /.*\.mobile\.spec\.ts/,
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});