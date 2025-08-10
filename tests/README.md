# Playwright Testing with Google OAuth

This project uses the **Storage State Pattern** for testing Google OAuth authentication with Playwright.

## How it Works

1. **Manual Authentication Setup**: Authentication state is created manually and saved for test reuse
2. **State Reuse**: Subsequent tests use the saved authentication state without re-authenticating
3. **Automatic Fallback**: If real Google OAuth fails, a mock authentication state is created for testing

## Setup

1. **Configure Test Credentials**:
   ```bash
   cp .env.test.example .env.test
   ```
   
   Edit `.env.test` and add your test account password:
   ```env
   GOOGLE_TEST_PASSWORD=your_test_password_here
   GOOGLE_TEST_EMAIL=thothy.test@gmail.com
   ```

2. **Add Test Account to Permitted Users**:
   The `thothy.test@gmail.com` account must be in your permitted users list:
   ```bash
   curl -X POST http://localhost:3000/api/test-permissions \
     -H "Content-Type: application/json" \
     -d '{"email":"thothy.test@gmail.com"}'
   ```

## Running Tests

### Setup Authentication (First Time)
```bash
# Run manual authentication setup
npx playwright test --project=manual-setup --headed
```

### Run Authenticated Tests
```bash
# Run only authenticated tests
npx playwright test --project=authenticated

# Run specific authenticated test
npx playwright test tests/auth/authenticated-user.test.ts
```

### Run All Tests
```bash
# Runs setup first, then all tests
npx playwright test
```

## Project Structure

```
tests/
├── auth/
│   └── authenticated-user.test.ts  # Tests that require authentication
├── e2e/
│   └── *.test.ts              # End-to-end tests
└── routes/
    └── *.test.ts              # Route tests

playwright/.auth/
└── user.json                 # Saved authentication state (gitignored)
```

## How the Storage State Works

### 1. Manual Authentication Setup
- Uses manual setup project for creating authentication state
- Saves cookies and session data to `playwright/.auth/user.json`
- Requires manual intervention for Google OAuth

### 2. Test Execution
- Tests in the `authenticated` project automatically load the saved state
- Each test starts with user already logged in
- No need to repeat OAuth flow for each test

### 3. State Management
- Auth state is saved locally and gitignored for security
- State is validated before each test run
- Automatically re-authenticates if state becomes invalid

## Benefits

- ✅ **Fast Test Execution**: No repeated OAuth flows
- ✅ **Reliable Testing**: Consistent authentication state
- ✅ **Security**: Credentials stored in environment files
- ✅ **Fallback Support**: Mock auth when Google OAuth unavailable
- ✅ **CI/CD Ready**: Works in automated environments

## Troubleshooting

### Authentication Fails
1. Check your `.env.test` file has correct credentials
2. Ensure `thothy.test@gmail.com` is in permitted users
3. Delete `playwright/.auth/user.json` to force re-authentication
4. Check Google account doesn't have 2FA enabled for test account

### Tests Still Redirect to Login
1. Verify auth state file exists: `ls -la playwright/.auth/`
2. Check auth state is loaded in test project configuration
3. Ensure test account has proper permissions in database

### CI/CD Issues
1. Use service accounts or dedicated test credentials
2. Consider using mock auth for CI environments
3. Ensure all environment variables are properly set

## Security Notes

- Never commit `.env.test` or auth state files
- Use dedicated test accounts, not production accounts  
- Rotate test credentials regularly
- Consider IP restrictions for test accounts