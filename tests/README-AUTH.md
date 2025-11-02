---
title: Playwright Multi-Account Authentication Guide
---

# Playwright Multi-Account Authentication System

This guide explains how to use the multi-account authentication system for Playwright tests in the Fictures project.

## Overview

The project uses **separate authentication files for each user role**:
- **Writer** (`.auth/writer.json`) - Can create and edit stories
- **Reader** (`.auth/reader.json`) - Can only read stories
- **Manager** (`.auth/manager.json`) - Has admin access to all features

Each auth file contains:
- User credentials (email, password)
- API key and scopes
- Session cookies
- User profile data

## File Structure

```
.auth/
├── .gitkeep              # Keeps directory in git
├── writer.json           # Writer account auth data (gitignored)
├── reader.json           # Reader account auth data (gitignored)
└── manager.json          # Manager account auth data (gitignored)

tests/
├── auth.setup.ts         # Authentication setup for all roles
├── helpers/
│   └── auth-helper.ts    # Helper utilities for reading auth data
├── studio-writer.spec.ts # Tests using writer authentication
├── studio-reader.spec.ts # Tests using reader authentication
└── studio-manager.spec.ts # Tests using manager authentication
```

## Authentication Setup

The `tests/auth.setup.ts` file automatically:
1. Checks if valid authentication already exists
2. Logs in with credentials from each auth file
3. Saves session cookies and tokens
4. Preserves API key data in the auth files

### Running Setup

```bash
# Run authentication setup for all roles
dotenv --file .env.local run npx playwright test --project=setup

# Or let it run automatically when running tests
dotenv --file .env.local run npx playwright test
```

## Playwright Configuration

In `playwright.config.ts`, we have separate projects for each role:

```typescript
projects: [
  {
    name: 'setup',
    testMatch: /.*\.setup\.ts/,
  },
  {
    name: 'writer-tests',
    use: { storageState: '.auth/writer.json' },
    dependencies: ['setup'],
    testMatch: /.*\.writer\.spec\.ts/,
  },
  {
    name: 'reader-tests',
    use: { storageState: '.auth/reader.json' },
    dependencies: ['setup'],
    testMatch: /.*\.reader\.spec\.ts/,
  },
  {
    name: 'manager-tests',
    use: { storageState: '.auth/manager.json' },
    dependencies: ['setup'],
    testMatch: /.*\.manager\.spec\.ts/,
  },
]
```

## Writing Tests

### 1. Test File Naming Convention

Name your test files based on the role they should use:
- `*.writer.spec.ts` - Uses writer authentication
- `*.reader.spec.ts` - Uses reader authentication
- `*.manager.spec.ts` - Uses manager authentication

### 2. Using Authentication in Tests

**Example: Writer Test**
```typescript
import { test, expect } from '@playwright/test';
import { getAuthData, getApiKey } from './helpers/auth-helper';

test('writer can create story', async ({ page }) => {
  // Authentication is already loaded via storageState
  await page.goto('http://localhost:3000/studio/new');

  // Test your feature
  await expect(page).toHaveURL(/.*studio\/new.*/);
});
```

**Example: API Test with API Key**
```typescript
import { test, expect } from '@playwright/test';
import { getAuthHeader } from './helpers/auth-helper';

test('API request with writer API key', async ({ request }) => {
  const authHeader = getAuthHeader('writer');

  const response = await request.post('http://localhost:3000/api/stories', {
    headers: authHeader,
    data: { title: 'Test Story' }
  });

  expect(response.ok()).toBeTruthy();
});
```

### 3. Helper Utilities

The `tests/helpers/auth-helper.ts` provides utilities:

```typescript
// Get full auth data
const authData = getAuthData('writer');

// Get API key
const apiKey = getApiKey('writer');

// Get user credentials
const { email, password } = getCredentials('writer');

// Get user ID
const userId = getUserId('writer');

// Check scopes
const canWrite = hasScope('writer', 'stories:write');

// Get auth header for API requests
const headers = getAuthHeader('writer');
```

## Account Details

### Writer Account
- **Email**: `writer@fictures.xyz`
- **Role**: `writer`
- **Scopes**:
  - `stories:read`, `stories:write`
  - `chapters:read`, `chapters:write`
  - `analytics:read`
  - `ai:use`
  - `community:read`, `community:write`
  - `settings:read`

### Reader Account
- **Email**: `reader@fictures.xyz`
- **Role**: `reader`
- **Scopes**:
  - `stories:read`
  - `chapters:read`
  - `analytics:read`
  - `community:read`
  - `settings:read`

### Manager Account
- **Email**: `manager@fictures.xyz`
- **Role**: `manager`
- **Scopes**:
  - All writer scopes, plus:
  - `stories:delete`, `stories:publish`
  - `chapters:delete`
  - `settings:write`
  - `admin:all`

## Running Tests

```bash
# Run all tests (all roles)
dotenv --file .env.local run npx playwright test

# Run only writer tests
dotenv --file .env.local run npx playwright test --project=writer-tests

# Run only reader tests
dotenv --file .env.local run npx playwright test --project=reader-tests

# Run only manager tests
dotenv --file .env.local run npx playwright test --project=manager-tests

# Run specific test file
dotenv --file .env.local run npx playwright test tests/studio-writer.spec.ts

# Run in headed mode for debugging
dotenv --file .env.local run npx playwright test --headed
```

## Refreshing Authentication

If authentication expires or needs to be refreshed:

```bash
# Delete all auth files and re-run setup
rm .auth/*.json
dotenv --file .env.local run npx playwright test --project=setup

# Or delete specific role auth
rm .auth/writer.json
dotenv --file .env.local run npx playwright test --project=setup
```

## Security Best Practices

1. **Never commit auth files** - They contain sensitive data
   - Auth files are in `.gitignore`
   - Only `.auth/.gitkeep` is tracked

2. **Rotate API keys regularly** - Update auth files when keys change

3. **Use environment variables for passwords** - Consider moving passwords to `.env.local`

4. **Limit scope access** - Each role only has necessary scopes

## Troubleshooting

### Authentication Fails
- Check if auth files exist in `.auth/` directory
- Verify credentials are correct in auth files
- Re-run setup: `npx playwright test --project=setup`

### Session Expired
- Delete auth file: `rm .auth/writer.json`
- Re-run setup to get fresh session

### API Key Invalid
- Update API key in auth file
- Regenerate API key from settings page
- Re-run auth setup

### Tests Can't Access Features
- Verify the correct test file naming (`.writer.spec.ts`, etc.)
- Check user role scopes in auth file
- Ensure user has necessary permissions in database

## Migration from Single `user.json`

If you have an old `user.json` file, the new system uses:
- `.auth/writer.json` - Primary test account (replaces default profile)
- `.auth/reader.json` - Read-only test account
- `.auth/manager.json` - Admin test account

All API keys and credentials are preserved in the new files.
