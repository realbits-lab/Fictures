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
  - **Analysis**: read
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
  - **Analysis**: read
  - **Community**: read
  - **Settings**: read
- **Features**: Read-only access for viewing content and analysis
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
  - **Analysis**: read
  - **AI**: use
  - **Community**: read, write
  - **Settings**: read
- **Features**: Read and write access for creating and editing stories, chapters, and community content
- **Restrictions**: Cannot delete or publish stories

**Note**: All credentials are stored securely in `.auth/user.json` which is gitignored and should never be committed.

## File Structure

The `.auth/user.json` file contains minimal authentication data. All other user information (userId, name, role, scopes, etc.) is retrieved from the database when needed.

**Simplified Structure (Only Essential Credentials):**

```json
{
  "profiles": {
    "manager": {
      "email": "manager@fictures.xyz",
      "password": "[SECURE_PASSWORD_HERE]",
      "apiKey": "fic_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    },
    "reader": {
      "email": "reader@fictures.xyz",
      "password": "[SECURE_PASSWORD_HERE]",
      "apiKey": "fic_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    },
    "writer": {
      "email": "writer@fictures.xyz",
      "password": "[SECURE_PASSWORD_HERE]",
      "apiKey": "fic_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    }
  }
}
```

**Design Philosophy:**
- **Store only credentials**: email, password (plain text for testing), apiKey
- **Retrieve everything else from database**: userId, name, role, scopes, etc.
- **Single source of truth**: Database is authoritative for user metadata
- **Simplified auth file**: Easier to manage and less prone to sync issues

## Initial Setup

### Create All Authentication Users

**Quick Setup (Recommended):**

```bash
dotenv --file .env.local run node scripts/setup-auth-users.mjs
```

This script uses **Drizzle ORM query builder** to:
1. Create three user accounts (manager, writer, reader) in the database
2. Generate secure random passwords (24 characters with special chars)
3. Hash passwords with PBKDF2 (100,000 iterations, SHA-256)
4. Create API keys for each user with role-specific scopes
5. Hash API keys with SHA-256 for secure storage
6. Write simplified `.auth/user.json` with only essential credentials
7. Display all credentials in the console output

**Technical Details:**
- Uses Drizzle ORM's type-safe query builder API
- Inline schema definitions (no TypeScript imports needed)
- Automatic snake_case ↔ camelCase conversion
- Idempotent: Safe to run multiple times (updates existing users)

**Output Example:**
```
═══════════════════════════════════════════════════════════
🔑 USER CREDENTIALS
═══════════════════════════════════════════════════════════

MANAGER (manager@fictures.xyz):
  Password: Xy9$mK2pL@7qR4vN8wB5tH1j
  API Key:  fic_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

WRITER (writer@fictures.xyz):
  Password: Qw3@nM5pB@2rT8vL9xK4yJ7zD1f
  API Key:  fic_p1q2r3s4t5u6v7w8x9y0z1a2b3c4d5e6

READER (reader@fictures.xyz):
  Password: Lm6$pR9vW@3tN7kD2xB8yH5jM1q
  API Key:  fic_f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6

═══════════════════════════════════════════════════════════
```

**Important Notes:**
- 🔑 **Save credentials immediately** - Passwords shown only during setup
- 📁 `.auth/user.json` is gitignored and never committed
- 🧪 Passwords stored as **plain text** in auth file (testing/development only)
- 🔒 Passwords **hashed with PBKDF2** in database (production-ready)
- 🔐 API keys **hashed with SHA-256** in database
- ♻️ **Idempotent script** - Safe to re-run to regenerate credentials

## Helper Scripts

### Verify Authentication Setup

**Check that all users were created correctly:**

```bash
dotenv --file .env.local run node scripts/verify-auth-setup.mjs
```

This script uses **Drizzle ORM query builder** to:
- Query all three authentication users from database
- Display user metadata (ID, email, name, username, role)
- Show password status (PBKDF2 hashed)
- List API keys with scopes for each user
- Verify database consistency

**Example Output:**
```
🔍 Verifying authentication setup...

✅ Found 3 users:

MANAGER - manager@fictures.xyz
  User ID:  usr_YcGAsYj_dpG_8vkh
  Name:     Fictures Manager
  Username: manager
  Password: ✓ Set (PBKDF2 hashed)
  Created:  11/4/2025, 2:08:03 PM
  API Keys: 1 active
    - manager API Key (fic_00fZ...)
      Scopes: stories:read, stories:write, stories:delete, stories:publish,
              chapters:read, chapters:write, chapters:delete, analysis:read,
              ai:use, community:read, community:write, settings:read,
              settings:write, admin:all

WRITER - writer@fictures.xyz
  User ID:  usr_n4aadDs58JkSk4rL
  Name:     Writer User
  Username: writer
  Password: ✓ Set (PBKDF2 hashed)
  Created:  11/4/2025, 2:08:04 PM
  API Keys: 1 active
    - writer API Key (fic_Z1yZ...)
      Scopes: stories:read, stories:write, chapters:read, chapters:write,
              analysis:read, ai:use, community:read, community:write,
              settings:read

READER - reader@fictures.xyz
  User ID:  usr_YQ8hcacxu85qyQOJ
  Name:     Reader User
  Username: reader
  Password: ✓ Set (PBKDF2 hashed)
  Created:  11/4/2025, 2:08:04 PM
  API Keys: 1 active
    - reader API Key (fic_8NtE...)
      Scopes: stories:read, chapters:read, analysis:read,
              community:read, settings:read

✅ Authentication setup verified!
```

**Use Cases:**
- ✅ Verify users created successfully after running setup script
- 🔍 Debug authentication issues
- 📊 Audit user accounts and permissions
- 🔐 Confirm password hashing is working correctly

## Using with Playwright

### Authentication Approach: Email/Password Login

Playwright tests use **direct email/password authentication** via the `/login` page instead of cookies or storage state.

### Reusable Login Helper Function

Create a reusable login helper function in your Playwright test files:

```javascript
/**
 * Login helper function for Playwright tests
 * @param {Page} page - Playwright page object
 * @param {string} email - User email address
 * @param {string} password - User password (from .auth/user.json)
 */
async function login(page, email, password) {
  // Navigate to login page
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');

  // Fill email field
  await page.fill('input[type="email"], input[name="email"]', email);

  // Fill password field
  await page.fill('input[type="password"], input[name="password"]', password);

  // Click sign in button
  await page.click('button:has-text("Sign in with Email")');
  await page.waitForLoadState('networkidle');

  // Wait for redirect after successful login
  await page.waitForTimeout(2000);
}
```

### Using in Playwright Tests

**Option 1: Direct credentials (for quick tests)**

```javascript
import { test, expect } from '@playwright/test';

test('writer can create stories', async ({ page }) => {
  // Login with writer credentials
  await login(page, 'writer@fictures.xyz', 'PASSWORD_FROM_AUTH_FILE');

  // Navigate to story creation
  await page.goto('http://localhost:3000/studio/new');

  // Test runs with authenticated session
  // ... your test code ...
});
```

**Option 2: Load credentials from .auth/user.json (recommended)**

```javascript
import { test, expect } from '@playwright/test';
import fs from 'fs';

// Load authentication profiles at test file level
const authData = JSON.parse(fs.readFileSync('.auth/user.json', 'utf-8'));

test('writer can create stories', async ({ page }) => {
  // Get writer credentials
  const writer = authData.profiles.writer;

  // Login with writer
  await login(page, writer.email, writer.password);

  // Navigate to story creation
  await page.goto('http://localhost:3000/studio/new');

  // Test runs with authenticated session
  // ... your test code ...
});
```

### Testing with Different User Roles

Each test can authenticate as a different user by using different credentials:

```javascript
import { test, expect } from '@playwright/test';
import fs from 'fs';

const authData = JSON.parse(fs.readFileSync('.auth/user.json', 'utf-8'));

test.describe('User Role Tests', () => {
  test('manager can delete stories', async ({ page }) => {
    const manager = authData.profiles.manager;
    await login(page, manager.email, manager.password);

    // Test manager-only features
    await page.goto('http://localhost:3000/studio');
    // ... test delete functionality ...
  });

  test('writer can edit stories', async ({ page }) => {
    const writer = authData.profiles.writer;
    await login(page, writer.email, writer.password);

    // Test writer features
    await page.goto('http://localhost:3000/studio/new');
    // ... test story creation/editing ...
  });

  test('reader can only view stories', async ({ page }) => {
    const reader = authData.profiles.reader;
    await login(page, reader.email, reader.password);

    // Test reader features (read-only)
    await page.goto('http://localhost:3000/novels');
    // ... test read-only access ...
  });
});
```

### Complete Example Test File

```javascript
// tests/story-creation.spec.ts
import { test, expect } from '@playwright/test';
import fs from 'fs';

// Load authentication profiles
const authData = JSON.parse(fs.readFileSync('.auth/user.json', 'utf-8'));

// Login helper function
async function login(page, email, password) {
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button:has-text("Sign in with Email")');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

test.describe('Story Creation', () => {
  test('writer can create a new story', async ({ page }) => {
    // Login as writer
    const writer = authData.profiles.writer;
    await login(page, writer.email, writer.password);

    // Navigate to story creation
    await page.goto('http://localhost:3000/studio/new');

    // Fill in story details
    await page.fill('input[name="title"]', 'Test Story');
    await page.fill('textarea[name="description"]', 'Test description');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify story was created
    await expect(page).toHaveURL(/\/studio\/edit\/.+/);
  });

  test('reader cannot access story creation', async ({ page }) => {
    // Login as reader
    const reader = authData.profiles.reader;
    await login(page, reader.email, reader.password);

    // Try to access story creation
    await page.goto('http://localhost:3000/studio/new');

    // Should be redirected or see access denied
    // ... verify read-only access ...
  });
});
```

### Benefits of Email/Password Login Approach

- ✅ **Simple and direct** - No need to manage cookies or storage state files
- ✅ **Fresh authentication** - Each test gets a new session
- ✅ **Easy role switching** - Just use different credentials
- ✅ **No external dependencies** - Works with just `.auth/user.json`
- ✅ **Matches real user flow** - Tests actual login process
- ✅ **No session expiration issues** - New session for each test

## Security Notes

- **DO NOT commit credentials to public repositories**
- The `.auth/` directory should be included in `.gitignore`
- API keys are rotated regularly and can be regenerated
- Passwords are hashed in the database using **PBKDF2 with SHA-256** (100,000 iterations)
- Session cookies have expiration times and need periodic refresh
- Never store raw passwords in database or code
- Password hashes should be Base64 encoded (PBKDF2), not bcrypt format

## Creating New Profiles

To add a new user profile manually:

1. **Create the user and API key in the database**
   ```bash
   # Edit scripts/setup-auth-users.mjs and add your new user config
   # Then run:
   dotenv --file .env.local run node scripts/setup-auth-users.mjs
   ```

2. **Or manually add to `.auth/user.json`** (simplified structure)
   ```json
   {
     "profiles": {
       "manager": { "email": "...", "password": "...", "apiKey": "..." },
       "writer": { "email": "...", "password": "...", "apiKey": "..." },
       "reader": { "email": "...", "password": "...", "apiKey": "..." },
       "new-profile": {
         "email": "newuser@fictures.xyz",
         "password": "your-secure-password",
         "apiKey": "fic_your-api-key"
       }
     }
   }
   ```

   **Note**: User metadata (name, role, scopes) is stored in the database, not in the auth file.

## Available Scripts

The following authentication-related scripts are available in `/scripts/` directory:

### Primary Scripts (Drizzle ORM Query Builder)

- **`setup-auth-users.mjs`** ⭐ - **Main setup script** - Creates all three users with passwords and API keys
  - Uses Drizzle ORM query builder for type-safe database operations
  - Generates secure passwords and API keys
  - Idempotent: Safe to run multiple times
  - Outputs credentials to console and `.auth/user.json`

- **`verify-auth-setup.mjs`** - Verification script - Checks all users were created correctly
  - Uses Drizzle ORM query builder for database queries
  - Displays user metadata, password status, and API key scopes
  - Useful for debugging authentication issues

### Drizzle ORM Implementation Details

Both scripts use modern Drizzle ORM patterns:
- **Type-safe query builder API** instead of raw SQL
- **Inline schema definitions** (no TypeScript imports needed)
- **Automatic snake_case conversion** via `casing: 'snake_case'`
- **Type-safe operators** like `eq()`, `inArray()` for WHERE clauses
- **Fluent API**: `.select()`, `.from()`, `.where()`, `.insert()`, `.update()`, `.delete()`

**Example Query Patterns:**

```javascript
import { drizzle } from 'drizzle-orm/postgres-js';
import { pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { eq, inArray } from 'drizzle-orm';

// Define schema inline
const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
  role: userRoleEnum('role').notNull()
});

// Initialize Drizzle with snake_case mapping
const db = drizzle(client, {
  schema: { users },
  casing: 'snake_case'
});

// SELECT with WHERE
const user = await db
  .select({ id: users.id })
  .from(users)
  .where(eq(users.email, 'user@example.com'))
  .limit(1);

// UPDATE with WHERE
await db
  .update(users)
  .set({ name: 'New Name', role: 'manager' })
  .where(eq(users.id, userId));

// INSERT
await db.insert(users).values({
  id: 'usr_123',
  email: 'new@example.com',
  name: 'New User',
  role: 'reader'
});

// DELETE with WHERE
await db.delete(apiKeys).where(eq(apiKeys.userId, userId));

// SELECT with IN operator
const userList = await db
  .select()
  .from(users)
  .where(inArray(users.email, ['email1@example.com', 'email2@example.com']))
  .orderBy(users.role);
```

**Benefits:**
- ✅ No TypeScript compilation needed (runs as `.mjs`)
- ✅ Type-safe at runtime through Drizzle's query builder
- ✅ Automatic field name conversion (camelCase ↔ snake_case)
- ✅ IntelliSense support for table columns and operators
- ✅ Consistent with application codebase patterns

## Testing Workflow

### 1. Initial Setup - Create Users

```bash
# Create all three authentication users
dotenv --file .env.local run node scripts/setup-auth-users.mjs

# Verify setup was successful
dotenv --file .env.local run node scripts/verify-auth-setup.mjs
```

### 2. Manual Testing in Browser

```bash
# Start development server
dotenv --file .env.local run pnpm dev > logs/dev-server.log 2>&1 &

# Navigate to http://localhost:3000/login
# Use credentials from .auth/user.json for any profile:
# - manager@fictures.xyz with password from auth file
# - writer@fictures.xyz with password from auth file
# - reader@fictures.xyz with password from auth file
```

### 3. Running Playwright Tests

For Playwright tests, you'll need to capture authentication state first:

```bash
# Start dev server if not running
dotenv --file .env.local run pnpm dev > logs/dev-server.log 2>&1 &

# Capture authentication for writer profile (or any profile you need)
dotenv --file .env.local run node scripts/capture-writer-auth.mjs

# Run Playwright tests with authenticated state
dotenv --file .env.local run npx playwright test
```

### 4. API Testing with API Keys

```bash
# API keys are stored in .auth/user.json
# Example using curl:

# Get manager API key from .auth/user.json
MANAGER_API_KEY=$(cat .auth/user.json | jq -r '.profiles.manager.apiKey')

# Test API endpoint with API key
curl -H "Authorization: Bearer $MANAGER_API_KEY" \
     http://localhost:3000/api/stories

# Or use writer/reader API keys
WRITER_API_KEY=$(cat .auth/user.json | jq -r '.profiles.writer.apiKey')
READER_API_KEY=$(cat .auth/user.json | jq -r '.profiles.reader.apiKey')
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

### Analysis Scope
- `analysis:read` - View analysis and statistics (All roles)

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

### Session Expired or Login Fails

If authentication fails with "session expired" or incorrect credentials:

1. **Regenerate credentials:**
   ```bash
   # Re-run setup to generate new passwords and API keys
   dotenv --file .env.local run node scripts/setup-auth-users.mjs

   # This will display new credentials in console
   # Update your tests/scripts with new passwords from output
   ```

2. **Check credentials in auth file:**
   ```bash
   # View current credentials
   cat .auth/user.json

   # Verify user exists in database
   dotenv --file .env.local run node scripts/verify-auth-setup.mjs
   ```

### Invalid API Key

If API requests fail with "invalid API key":

1. **Regenerate API keys:**
   ```bash
   # Re-run setup to regenerate all API keys
   dotenv --file .env.local run node scripts/setup-auth-users.mjs

   # New API keys will be displayed in console
   # and written to .auth/user.json
   ```

2. **Verify API key in database:**
   ```bash
   # Check that API keys are properly stored
   dotenv --file .env.local run node scripts/verify-auth-setup.mjs
   ```

### Password Hash Issues

If login fails despite correct password:

1. **Check password hash format:**
   ```bash
   # Verify password is PBKDF2 hashed (not bcrypt)
   dotenv --file .env.local run node scripts/verify-auth-setup.mjs

   # Look for: "Password: ✓ Set (PBKDF2 hashed)"
   # If hash starts with $2b$, it's bcrypt (wrong!)
   ```

2. **Regenerate with correct hashing:**
   ```bash
   # Re-run setup to regenerate PBKDF2 hashes
   dotenv --file .env.local run node scripts/setup-auth-users.mjs
   ```

### Database Connection Issues

If scripts fail with database errors:

1. **Check environment variables:**
   ```bash
   # Verify DATABASE_URL is set
   echo $DATABASE_URL

   # Or check .env.local file
   grep DATABASE_URL .env.local
   ```

2. **Test database connection:**
   ```bash
   # Try running verify script
   dotenv --file .env.local run node scripts/verify-auth-setup.mjs
   ```

## Quick Reference

**Setup Commands:**
```bash
# Create all users (run once, or to regenerate credentials)
dotenv --file .env.local run node scripts/setup-auth-users.mjs

# Verify users were created correctly
dotenv --file .env.local run node scripts/verify-auth-setup.mjs
```

**File Locations:**
- **Auth file**: `.auth/user.json` (gitignored)
- **Setup script**: `scripts/setup-auth-users.mjs` (Drizzle query builder)
- **Verify script**: `scripts/verify-auth-setup.mjs` (Drizzle query builder)
- **Documentation**: `docs/auth/authentication-profiles.md` (this file)

**User Accounts:**
- `manager@fictures.xyz` - Full admin access (14 scopes)
- `writer@fictures.xyz` - Read/write access (9 scopes)
- `reader@fictures.xyz` - Read-only access (5 scopes)

**Auth File Structure:**
```json
{
  "profiles": {
    "manager": { "email": "...", "password": "...", "apiKey": "..." },
    "writer": { "email": "...", "password": "...", "apiKey": "..." },
    "reader": { "email": "...", "password": "...", "apiKey": "..." }
  }
}
```

**Security Notes:**
- ✅ Passwords hashed with **PBKDF2** (100k iterations, SHA-256) in database
- ✅ API keys hashed with **SHA-256** in database
- ⚠️ Plain text passwords in `.auth/user.json` (testing/development only)
- 🔒 `.auth/` directory is gitignored (never commit credentials)
