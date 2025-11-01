---
title: "Authentication Profiles"
---

# Authentication Profiles

This document describes the authentication system for testing with multiple user accounts, including password hashing algorithms and verification methods.

## Password Verification Algorithm

### Overview

The application uses **PBKDF2 (Password-Based Key Derivation Function 2)** with the Web Crypto API for password hashing and verification. This approach provides strong security while being compatible with Edge Runtime environments.

**Implementation Location**: `src/lib/auth/password.ts`

### Algorithm Details

- **Hashing Function**: PBKDF2
- **Hash Algorithm**: SHA-256
- **Iterations**: 100,000
- **Salt Length**: 16 bytes (randomly generated per password)
- **Derived Key Length**: 256 bits (32 bytes)
- **Output Format**: Base64-encoded string containing salt + derived key

### How Password Hashing Works

**Hashing Process** (`hashPassword` function):
1. Generate random 16-byte salt using `crypto.getRandomValues()`
2. Derive 256-bit key using PBKDF2 with 100,000 iterations and SHA-256
3. Combine salt (first 16 bytes) + derived key (remaining 32 bytes)
4. Encode combined array as Base64 string
5. Return Base64 string for storage in database

**Verification Process** (`verifyPassword` function):
1. Decode Base64 hash from database
2. Extract salt (first 16 bytes) and stored hash (remaining bytes)
3. Derive new key using provided password, extracted salt, and same parameters
4. Compare derived key with stored hash byte-by-byte
5. Return `true` if all bytes match, `false` otherwise

### Important Notes

- **NEVER use bcrypt** for password hashing in this project - it's incompatible with PBKDF2
- Always use the functions in `src/lib/auth/password.ts` for password operations
- Password hashes start with Base64 characters, NOT `$2b$` (bcrypt format)
- The Web Crypto API ensures compatibility with Edge Runtime and serverless environments

### Example Password Hash Format

```
Base64 encoded: 8bvPT4m72pRgc5sppAsG... (salt + derived key)
Length: ~60-70 characters
Character set: A-Za-z0-9+/=
```

### Resetting User Passwords

Use the correct script for resetting passwords:

**Correct Script** (uses PBKDF2):
```bash
dotenv --file .env.local run node scripts/reset-reader-password-pbkdf2.mjs "new-password"
```

**Deprecated Script** (uses bcrypt - DO NOT USE):
```bash
# DO NOT USE - Incompatible with the application
node scripts/reset-reader-password.mjs
```

### Verifying Password Hashes

To check if a user's password is correctly hashed:

```bash
# Check user exists and has password
dotenv --file .env.local run node scripts/check-reader-user.mjs

# Verify specific password
dotenv --file .env.local run node scripts/verify-reader-password.mjs
```

### Troubleshooting Password Issues

**Login fails with correct password:**
1. Check password hash format in database
2. If hash starts with `$2b$`, it's bcrypt (incorrect)
3. Reset password using `reset-reader-password-pbkdf2.mjs`
4. Verify with `verify-reader-password.mjs`

**CredentialsSignin error:**
- User not found in database
- User has no password set (OAuth-only account)
- Password hash uses incompatible algorithm
- Check server logs for `[AUTH]` debug messages

## Available Profiles

### Manager Profile
- **Email**: Stored in `.auth/user.json` under `profiles.manager.email`
- **Role**: manager
- **User ID**: Stored in `.auth/user.json` under `profiles.manager.userId`
- **API Key ID**: Stored in `.auth/user.json` under `profiles.manager.apiKeyId`
- **Scopes** (14 total):
  - **Stories**: read, write, delete, publish
  - **Chapters**: read, write, delete
  - **Analytics**: read
  - **AI**: use
  - **Community**: read, write
  - **Settings**: read, write
  - **Admin**: all (wildcard permission)
- **Features**: Full administrative access to all resources and features

**Note**: All credentials are stored securely in `.auth/user.json` which is gitignored and should never be committed.

### Reader Profile
- **Email**: Stored in `.auth/user.json` under `profiles.reader.email`
- **Password**: Stored in `.auth/user.json` under `profiles.reader.password`
- **Role**: reader
- **User ID**: Stored in `.auth/user.json` under `profiles.reader.userId`
- **API Key ID**: Stored in `.auth/user.json` under `profiles.reader.apiKeyId`
- **Scopes** (5 total - Read-only):
  - **Stories**: read
  - **Chapters**: read
  - **Analytics**: read
  - **Community**: read
  - **Settings**: read
- **Features**: Read-only access for viewing content and analytics
- **Restrictions**: Cannot write, delete, or publish any content

### Writer Profile
- **Email**: Stored in `.auth/user.json` under `profiles.writer.email`
- **Password**: Stored in `.auth/user.json` under `profiles.writer.password`
- **Role**: writer
- **User ID**: Stored in `.auth/user.json` under `profiles.writer.userId`
- **API Key ID**: Stored in `.auth/user.json` under `profiles.writer.apiKeyId`
- **Scopes** (9 total - Read/Write only):
  - **Stories**: read, write
  - **Chapters**: read, write
  - **Analytics**: read
  - **AI**: use
  - **Community**: read, write
  - **Settings**: read
- **Features**: Read and write access for creating and editing stories, chapters, and community content
- **Restrictions**: Cannot delete or publish stories

**Note**: All credentials are stored securely in `.auth/user.json` which is gitignored and should never be committed.

## File Structure

The `.auth/user.json` file contains authentication data structured as follows:

```json
{
  "profiles": {
    "manager": {
      "userId": "usr_XXXXXXXXXXXXX",
      "email": "manager@fictures.xyz",
      "name": "Fictures Manager",
      "role": "manager",
      "apiKey": "fic_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "apiKeyId": "XXXXXXXXXXXXXXXXXXXXX",
      "apiKeyScopes": ["stories:read", "stories:write"],
      "cookies": [...],
      "origins": [...]
    },
    "reader": {
      "userId": "usr_XXXXXXXXXXXXX",
      "email": "reader@fictures.xyz",
      "password": "[SECURE_PASSWORD_HERE]",
      "name": "Reader User",
      "username": "reader",
      "role": "reader",
      "apiKey": "fic_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "apiKeyId": "XXXXXXXXXXXXXXXXXXXXX",
      "apiKeyScopes": ["stories:read", "stories:write"],
      "cookies": [],
      "origins": []
    },
    "writer": {
      "userId": "usr_XXXXXXXXXXXXX",
      "email": "writer@fictures.xyz",
      "password": "[SECURE_PASSWORD_HERE]",
      "name": "Writer User",
      "username": "writer",
      "role": "writer",
      "apiKey": "fic_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "apiKeyId": "XXXXXXXXXXXXXXXXXXXXX",
      "apiKeyScopes": ["stories:read", "stories:write", "stories:delete"],
      "cookies": [],
      "origins": []
    }
  },
  "defaultProfile": "manager"
}
```

## Helper Scripts

### Get Current Profile

```bash
node scripts/get-auth-profile.mjs
```

Shows the currently active authentication profile with full details including:
- User ID, email, name, and role
- API key information
- Available profiles list

**Example Output:**
```
=== Current Authentication Profile ===

Active Profile: manager
Email: manager@fictures.xyz
Name: Fictures Manager
Role: manager
User ID: [FROM .auth/user.json]
API Key: [FROM .auth/user.json]
API Key ID: [FROM .auth/user.json]
API Scopes: stories:read, stories:write

Available Profiles: manager, reader, writer
```

### Switch Profile

```bash
# Switch to manager
node scripts/switch-auth-profile.mjs manager

# Switch to reader
node scripts/switch-auth-profile.mjs reader

# Switch to writer
node scripts/switch-auth-profile.mjs writer
```

Changes the default authentication profile for testing. The script will:
1. Update the `defaultProfile` field in `.auth/user.json`
2. Display the switched profile's details
3. Show credentials if available (password for reader profile)

**Example Output:**
```
✓ Switched to profile: reader

Profile Details:
  Email: reader@fictures.xyz
  Name: Reader User
  Role: reader
  User ID: [FROM .auth/user.json]
  Password: [FROM .auth/user.json]
  API Key: [FROM .auth/user.json]
  API Scopes: stories:read, stories:write
```

## Using with Playwright

### Quick Start: Capturing Fresh Authentication

Before running Playwright tests, you need to capture fresh authentication data and convert it to Playwright format:

**Step 1: Capture Writer Authentication**
```bash
# Capture fresh authentication for writer@fictures.xyz
dotenv --file .env.local run node scripts/capture-writer-auth.mjs
```

This script will:
1. Open a browser window
2. Navigate to `/login` page
3. Automatically fill in writer@fictures.xyz credentials
4. Wait for successful login redirect (to `/`, `/studio`, `/novels`, or `/comics`)
5. Capture session cookies and localStorage
6. Save to `.auth/user.json` under `profiles.writer`

**Step 2: Create Playwright-Compatible Auth File**
```bash
# Convert writer profile to Playwright storage state format
node scripts/create-playwright-auth.mjs
```

This script will:
1. Read `.auth/user.json`
2. Extract writer profile data (cookies and origins)
3. Create `.auth/writer-playwright.json` in Playwright's `storageState` format

**Step 3: Use in Playwright Tests**
```javascript
import { test } from '@playwright/test';

// Use writer authentication
test.use({ storageState: '.auth/writer-playwright.json' });

test('authenticated writer can create stories', async ({ page }) => {
  await page.goto('http://localhost:3000/studio/new');
  // Test runs with writer@fictures.xyz authentication
});
```

### Playwright Storage State Format

The `.auth/writer-playwright.json` file created by `create-playwright-auth.mjs` follows Playwright's standard format:

```json
{
  "cookies": [
    {
      "name": "authjs.csrf-token",
      "value": "...",
      "domain": "localhost",
      "path": "/",
      "expires": -1,
      "httpOnly": true,
      "secure": false,
      "sameSite": "Lax"
    },
    {
      "name": "authjs.session-token",
      "value": "...",
      "domain": "localhost",
      "path": "/",
      "expires": 1763547081.986371,
      "httpOnly": true,
      "secure": false,
      "sameSite": "Lax"
    }
  ],
  "origins": [
    {
      "origin": "http://localhost:3000",
      "localStorage": [
        {
          "name": "swr-cache-/api/stories",
          "value": "..."
        }
      ]
    }
  ]
}
```

### Manual Profile Loading (Advanced)

The profile structure is also compatible with dynamic profile loading:

```javascript
const { test } = require('@playwright/test');
const fs = require('fs');

// Load authentication profiles
const authData = JSON.parse(fs.readFileSync('.auth/user.json', 'utf-8'));
const profile = authData.profiles[authData.defaultProfile];

// Use the profile's authentication state
test.use({
  storageState: {
    cookies: profile.cookies,
    origins: profile.origins
  }
});

test('authenticated user can access stories', async ({ page }) => {
  await page.goto('http://localhost:3000/stories');
  // Test runs with the default profile's authentication
});
```

### Testing with Different Profiles

You can test different user roles by switching profiles:

```javascript
// Test as manager
const managerProfile = authData.profiles.manager;
test.use({
  storageState: {
    cookies: managerProfile.cookies,
    origins: managerProfile.origins
  }
});

// Test as reader
const readerProfile = authData.profiles.reader;
test.use({
  storageState: {
    cookies: readerProfile.cookies,
    origins: readerProfile.origins
  }
});
```

## Security Notes

- **DO NOT commit credentials to public repositories**
- The `.auth/` directory should be included in `.gitignore`
- API keys are rotated regularly and can be regenerated
- Passwords are hashed in the database using **PBKDF2 with SHA-256** (100,000 iterations)
- Session cookies have expiration times and need periodic refresh
- Never store raw passwords in database or code
- Password hashes should be Base64 encoded (PBKDF2), not bcrypt format

## Creating New Profiles

To add a new user profile:

1. **Create the user in the database**
   ```bash
   dotenv --file .env.local run node scripts/create-user.mjs
   ```

2. **Generate an API key for the user**
   ```bash
   dotenv --file .env.local run node scripts/create-api-key.mjs
   ```

3. **Add the profile to `.auth/user.json`**
   ```json
   {
     "profiles": {
       "existing-profile": { ... },
       "new-profile": {
         "userId": "usr_...",
         "email": "newuser@fictures.xyz",
         "name": "New User",
         "role": "reader",
         "apiKey": "fic_...",
         "apiKeyId": "...",
         "apiKeyScopes": ["stories:read", "stories:write"],
         "cookies": [],
         "origins": []
       }
     },
     "defaultProfile": "manager"
   }
   ```

4. **Set `defaultProfile` to the new profile name if needed**
   ```bash
   node scripts/switch-auth-profile.mjs new-profile
   ```

## Example Scripts

The following scripts are available in `/scripts/` directory:

- **`create-reader-user.mjs`** - Creates the reader@fictures.xyz user account
- **`create-reader-api-key.mjs`** - Generates an API key for the reader account
- **`create-writer-user.mjs`** - Creates the writer@fictures.xyz user account with API key
- **`check-writer-user.mjs`** - Verifies writer account exists and shows details
- **`get-manager-account.mjs`** - Fetches manager account information from database
- **`switch-auth-profile.mjs`** - Profile switcher utility
- **`get-auth-profile.mjs`** - Current profile viewer and information display

## Testing Workflow

### 1. Running Tests with Manager Profile

```bash
# Switch to manager profile
node scripts/switch-auth-profile.mjs manager

# Run Playwright tests
dotenv --file .env.local run npx playwright test --headless
```

### 2. Running Tests with Reader Profile

```bash
# Switch to reader profile
node scripts/switch-auth-profile.mjs reader

# Run Playwright tests
dotenv --file .env.local run npx playwright test --headless
```

### 3. Running Tests with Writer Profile

```bash
# Switch to writer profile
node scripts/switch-auth-profile.mjs writer

# Run Playwright tests
dotenv --file .env.local run npx playwright test --headless
```

### 4. Manual Testing with Browser

```bash
# Start development server
dotenv --file .env.local run pnpm dev > logs/dev-server.log 2>&1 &

# Switch to desired profile
node scripts/switch-auth-profile.mjs reader

# Capture authentication manually
dotenv --file .env.local run node scripts/capture-auth-manual.mjs

# Test automatic login
dotenv --file .env.local run node scripts/test-auto-login.mjs
```

## API Key Scopes

Current API key scopes available:

### Story Scopes
- `stories:read` - Read story data
- `stories:write` - Create and update stories
- `stories:delete` - Delete stories (Manager only)
- `stories:publish` - Publish and unpublish stories (Manager only)

### Chapter Scopes
- `chapters:read` - Read chapters and scenes
- `chapters:write` - Create and edit chapters and scenes
- `chapters:delete` - Delete chapters and scenes (Manager only)

### Analytics Scope
- `analytics:read` - View analytics and statistics (All roles)

### AI Scope
- `ai:use` - Use AI writing assistance features (Manager, Writer)

### Community Scopes
- `community:read` - Read community posts and discussions (All roles)
- `community:write` - Create community posts and replies (Manager, Writer)

### Settings Scopes
- `settings:read` - Read user settings and preferences (All roles)
- `settings:write` - Modify user settings and preferences (Manager only)

### Admin Scope
- `admin:all` - Full administrative access to all resources (Manager only)

## RBAC (Role-Based Access Control) Summary

### Manager Role
- **Total Scopes**: 14
- **Access Level**: Full administrative access
- **Can**: Read, write, delete, publish all content; use all features; manage settings
- **Includes**: `admin:all` wildcard permission

### Writer Role
- **Total Scopes**: 9
- **Access Level**: Read/Write access only
- **Can**: Read and write stories/chapters; use AI; participate in community
- **Cannot**: Delete or publish stories; modify settings

### Reader Role
- **Total Scopes**: 5
- **Access Level**: Read-only access
- **Can**: View stories, chapters, analytics, and community content
- **Cannot**: Write, delete, publish, or modify any content

## Troubleshooting

### Session Expired

If authentication fails with "session expired":

1. Recapture authentication state:
   ```bash
   dotenv --file .env.local run node scripts/capture-auth-manual.mjs
   ```

2. Update the profile's cookies and origins in `.auth/user.json`

### Invalid API Key

If API requests fail with "invalid API key":

1. Generate a new API key:
   ```bash
   dotenv --file .env.local run node scripts/create-api-key.mjs
   ```

2. Update the profile's `apiKey` and `apiKeyId` in `.auth/user.json`

### Profile Not Found

If switching profiles fails:

1. Check available profiles:
   ```bash
   node scripts/get-auth-profile.mjs
   ```

2. Verify the profile name matches exactly (case-sensitive)
