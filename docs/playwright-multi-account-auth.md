# Playwright Multi-Account Authentication System

## Summary

Implemented a **multi-account authentication system** for Playwright tests with separate auth files for each user role (writer, reader, manager), preserving API keys and credentials.

## What Changed

### 1. Separate Authentication Files
Created three role-specific auth files in `.auth/` directory:
- **`.auth/writer.json`** - Writer account with story editing permissions
- **`.auth/reader.json`** - Reader account with read-only access
- **`.auth/manager.json`** - Manager account with admin permissions

Each file contains:
- User credentials (email, password)
- API key and scopes
- Session cookies and tokens
- User profile data

### 2. Playwright Configuration
Updated `playwright.config.ts` with role-specific test projects:
- `writer-tests` - Uses `.auth/writer.json`, matches `*.writer.spec.ts`
- `reader-tests` - Uses `.auth/reader.json`, matches `*.reader.spec.ts`
- `manager-tests` - Uses `.auth/manager.json`, matches `*.manager.spec.ts`

### 3. Authentication Setup
Created `tests/auth.setup.ts`:
- Automatically authenticates all three roles
- Preserves existing API key data
- Skips re-authentication if valid session exists
- Runs before test projects via dependencies

### 4. Helper Utilities
Created `tests/helpers/auth-helper.ts` with utilities:
- `getAuthData(role)` - Get full auth data
- `getApiKey(role)` - Get API key
- `getCredentials(role)` - Get email/password
- `getUserId(role)` - Get user ID
- `hasScope(role, scope)` - Check if role has scope
- `getAuthHeader(role)` - Get Authorization header for API requests

### 5. Example Tests
Created example test files:
- `tests/studio-writer.spec.ts` - Writer-specific tests
- `tests/studio-reader.spec.ts` - Reader-specific tests
- `tests/studio-manager.spec.ts` - Manager-specific tests

### 6. Security
Updated `.gitignore`:
- Added explicit rules for `.auth/*.json` files
- Added `.auth/.gitkeep` to maintain directory structure
- Added security comments about sensitive data

## File Structure

```
.auth/
├── .gitkeep              # Keeps directory in git
├── writer.json           # Writer auth (gitignored)
├── reader.json           # Reader auth (gitignored)
└── manager.json          # Manager auth (gitignored)

tests/
├── auth.setup.ts         # Authentication setup
├── helpers/
│   └── auth-helper.ts    # Auth utilities
├── studio-writer.spec.ts # Writer tests
├── studio-reader.spec.ts # Reader tests
├── studio-manager.spec.ts # Manager tests
└── README-AUTH.md        # Complete documentation
```

## Usage

### Running Tests

```bash
# Run all tests (all roles)
dotenv --file .env.local run npx playwright test

# Run specific role tests
dotenv --file .env.local run npx playwright test --project=writer-tests
dotenv --file .env.local run npx playwright test --project=reader-tests
dotenv --file .env.local run npx playwright test --project=manager-tests
```

### Writing Tests

Name test files by role:
- `my-feature.writer.spec.ts` - Uses writer authentication
- `my-feature.reader.spec.ts` - Uses reader authentication
- `my-feature.manager.spec.ts` - Uses manager authentication

Use helper utilities in tests:
```typescript
import { getAuthData, getApiKey, getAuthHeader } from './helpers/auth-helper';

test('example test', async ({ page, request }) => {
  // Get auth data
  const authData = getAuthData('writer');

  // Make API request with auth
  const response = await request.get('/api/stories', {
    headers: getAuthHeader('writer')
  });
});
```

## Benefits

1. **Role-Based Testing** - Each test uses appropriate permissions
2. **API Key Access** - Tests can make authenticated API requests
3. **Security** - Credentials never committed to repository
4. **Flexibility** - Easy to add new roles or update credentials
5. **Performance** - Authentication reused across tests
6. **Best Practices** - Follows Playwright's recommended patterns

## Account Scopes

### Writer
- `stories:read`, `stories:write`
- `chapters:read`, `chapters:write`
- `analytics:read`
- `ai:use`
- `community:read`, `community:write`
- `settings:read`

### Reader
- `stories:read`
- `chapters:read`
- `analytics:read`
- `community:read`
- `settings:read`

### Manager
- All writer scopes, plus:
- `stories:delete`, `stories:publish`
- `chapters:delete`
- `settings:write`
- `admin:all`

## Migration Notes

The old single `user.json` file has been split into three role-specific files. All API keys and credentials have been preserved.

## Documentation

See `tests/README-AUTH.md` for complete documentation including:
- Detailed usage examples
- Troubleshooting guide
- Security best practices
- Helper utility reference

## References

Based on Playwright best practices:
- [Playwright Authentication Guide](https://playwright.dev/docs/auth)
- [Multiple User Roles Pattern](https://www.neovasolutions.com/2024/11/14/handling-authentication-for-multiple-user-logins-in-playwright/)
- [Storage State Documentation](https://playwright.dev/docs/api/class-browsercontext#browser-context-storage-state)
