# Fictures Test Suite

Comprehensive end-to-end and API tests for the Fictures platform using Playwright.

## 📁 Test Structure

```
tests/
├── helpers/              # Reusable helper functions
│   ├── auth.ts          # Authentication utilities
│   └── test-data.ts     # Test data creation and management
├── setup/               # Test setup and preparation
│   ├── auth.setup.ts    # Authentication state setup
│   └── test-data.setup.ts  # Test data preparation
├── e2e/                 # End-to-end page tests
│   ├── home.spec.ts
│   ├── studio.writer.spec.ts
│   ├── studio.reader.spec.ts
│   ├── studio-agent.writer.spec.ts
│   ├── novels.e2e.spec.ts
│   ├── comics.e2e.spec.ts
│   ├── community.e2e.spec.ts
│   ├── publish.writer.spec.ts
│   ├── analysis.writer.spec.ts
│   └── settings.authenticated.spec.ts
├── api/                 # API endpoint tests
│   ├── auth.api.spec.ts
│   ├── story.api.spec.ts
│   ├── generation.api.spec.ts
│   ├── community.api.spec.ts
│   ├── analysis.api.spec.ts
│   ├── publish.api.spec.ts
│   ├── image.api.spec.ts
│   └── user.api.spec.ts
├── cross-cutting/       # Cross-cutting concern tests
│   ├── mobile.mobile.spec.ts
│   ├── theme.spec.ts
│   ├── a11y.spec.ts
│   └── performance.spec.ts
└── errors/              # Error handling tests
    ├── network-errors.spec.ts
    └── edge-cases.spec.ts
```

## 🚀 Running Tests

### Prerequisites

1. **Setup Test Users**:
   ```bash
   dotenv --file .env.local run node scripts/setup-auth-users.mjs
   dotenv --file .env.local run node scripts/verify-auth-setup.mjs
   ```

2. **Start Development Server**:
   ```bash
   rm -rf .next && dotenv --file .env.local run pnpm dev > logs/dev-server.log 2>&1 &
   ```

### Run All Tests

```bash
# Run all tests in headed mode
dotenv --file .env.local run npx playwright test --headed

# Run all tests headless (CI mode)
dotenv --file .env.local run npx playwright test
```

### Run Specific Test Suites

```bash
# Run E2E tests only
dotenv --file .env.local run npx playwright test tests/e2e/

# Run API tests only
dotenv --file .env.local run npx playwright test tests/api/

# Run mobile tests only
dotenv --file .env.local run npx playwright test tests/cross-cutting/mobile.mobile.spec.ts --project=mobile

# Run specific test file
dotenv --file .env.local run npx playwright test tests/e2e/studio.writer.spec.ts
```

### Run Tests by Role

```bash
# Run writer tests
dotenv --file .env.local run npx playwright test --project=writer-tests

# Run reader tests
dotenv --file .env.local run npx playwright test --project=reader-tests

# Run manager tests
dotenv --file .env.local run npx playwright test --project=manager-tests
```

### Debug Mode

```bash
# Run tests in debug mode
dotenv --file .env.local run npx playwright test --debug

# Run specific test in debug mode
dotenv --file .env.local run npx playwright test tests/e2e/studio.writer.spec.ts --debug
```

### Generate Test Report

```bash
# Run tests and generate HTML report
dotenv --file .env.local run npx playwright test

# Show report
npx playwright show-report
```

## 📋 Test Documentation

For complete test specifications and development guide, see:

- **Test Specification**: `/docs/test/test-specification.md`
  - What to test: Test cases, requirements, success criteria
  - Test categories: Navigation, Access Control, Content, Functionality, Performance, Error Handling

- **Test Development**: `/docs/test/test-development.md`
  - How to test: Execution plans, automation setup, data preparation
  - Test phases: Setup, Authentication, Navigation, Core Functionality, API, Performance, Error Handling

## 🔑 Authentication

### Test User Profiles

The test suite uses three user roles stored in `.auth/user.json`:

1. **Manager** (`manager@fictures.xyz`):
   - Role: manager
   - Scope: admin:all
   - Access: Full access to all features

2. **Writer** (`writer@fictures.xyz`):
   - Role: writer
   - Scope: stories:write
   - Access: Story creation, editing, publishing

3. **Reader** (`reader@fictures.xyz`):
   - Role: reader
   - Scope: stories:read
   - Access: Read-only access

### Authentication Helper Usage

```typescript
import { loginAs } from '../helpers/auth';

test('test with writer authentication', async ({ page }) => {
  const profile = await loginAs(page, 'writer');
  // Now authenticated as writer
  await page.goto('/studio');
  // ... test code
});
```

## 📊 Test Data Management

### Creating Test Data

```typescript
import { createTestStory, createTestPost, createTestChapter } from '../helpers/test-data';

test('test with story data', async ({ request }) => {
  const story = await createTestStory(request, 'writer', {
    title: 'Test Story',
    genre: 'fantasy',
    status: 'draft',
  });

  // Use story in test
  expect(story.id).toBeTruthy();

  // Cleanup
  await deleteTestStory(request, story.id, 'writer');
});
```

### Cleanup

```typescript
import { cleanupTestStories, cleanupTestPosts } from '../helpers/test-data';

test.afterAll(async ({ request }) => {
  // Clean up all test data
  await cleanupTestStories(request, 'manager');
  await cleanupTestPosts(request, 'manager');
});
```

## 🎯 Test Coverage

### E2E Tests

- **Home Page**: Redirect behavior
- **Studio**: Story management, creation, editing
- **Studio Agent**: AI writing assistant
- **Novels**: Story browsing, reading, interactions
- **Comics**: Comic browsing, webtoon reader
- **Community**: Posts, comments, social features
- **Publish**: Publishing workflow, scheduling
- **Analysis**: Analytics, metrics, insights
- **Settings**: User preferences, account management

### API Tests

- **Authentication**: Login, logout, session management
- **Story**: CRUD operations, access control
- **Generation**: AI story generation, image generation
- **Community**: Posts, comments, likes
- **Analysis**: Analytics data, event tracking
- **Publish**: Scene publishing, scheduling
- **Image**: Upload, retrieval, deletion
- **User**: Profile management, preferences

### Cross-Cutting Tests

- **Mobile**: Responsive design, touch interactions
- **Theme**: Dark/light mode switching
- **Accessibility**: WCAG 2.1 Level AA compliance, screen reader support
- **Performance**: Core Web Vitals, load times, API response times

### Error Handling Tests

- **Network Errors**: API failures, timeouts, retry mechanisms
- **Edge Cases**: Empty states, maximum limits, concurrent operations, XSS prevention

## 📈 Test Metrics

### Success Criteria

- ✅ 100% pass rate for critical path tests
- ✅ Page load times under threshold (< 2-3 seconds)
- ✅ API response times < 500ms (p95)
- ✅ Core Web Vitals meet Google standards
- ✅ WCAG 2.1 Level AA compliance
- ✅ No unauthorized access to restricted pages

### Performance Benchmarks

| Page | Target Load Time | Status |
|------|-----------------|--------|
| Home | < 100ms | ✅ |
| Studio | < 2s | ✅ |
| Novels | < 2s | ✅ |
| Comics | < 2s | ✅ |
| Community | < 2s | ✅ |
| Publish | < 2s | ✅ |
| Analysis | < 3s | ✅ |
| Settings | < 2s | ✅ |

## 🔧 Configuration

Test configuration is defined in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 240000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    { name: 'writer-tests', testMatch: /.*\.writer\.spec\.ts/ },
    { name: 'reader-tests', testMatch: /.*\.reader\.spec\.ts/ },
    { name: 'manager-tests', testMatch: /.*\.manager\.spec\.ts/ },
    { name: 'e2e', testMatch: /.*\.e2e\.spec\.ts/ },
    { name: 'api', testMatch: /.*\.api\.spec\.ts/ },
    { name: 'mobile', testMatch: /.*\.mobile\.spec\.ts/ },
  ],
});
```

## 🐛 Debugging

### View Test Traces

```bash
# Run tests with trace enabled
dotenv --file .env.local run npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots: `test-results/screenshots/`
- Videos: `test-results/videos/`
- Traces: `test-results/traces/`

### Console Logs

```bash
# View logs during test run
dotenv --file .env.local run npx playwright test --headed

# Save logs to file
dotenv --file .env.local run npx playwright test > logs/playwright.log 2>&1
```

## 📝 Writing New Tests

### Test Template

```typescript
/**
 * Feature Name Tests
 *
 * Description of what these tests cover
 * Test Cases: TC-XXX-001 to TC-XXX-999
 */

import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await loginAs(page, 'writer');
    await page.goto('/path');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Test Category', () => {
    test('TC-XXX-001: Test description', async ({ page }) => {
      // Test implementation
      const element = page.locator('[data-testid="element"]');
      await expect(element).toBeVisible();
    });
  });
});
```

### Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Wait for network idle** before assertions
3. **Use role-based authentication** via helper functions
4. **Clean up test data** after test completion
5. **Document test cases** with TC-XXX-XXX format
6. **Group related tests** in describe blocks
7. **Use meaningful test names** that describe behavior
8. **Verify both success and failure cases**

## 🔗 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Test Specification](/docs/test/test-specification.md)
- [Test Development Guide](/docs/test/test-development.md)
- [Project CLAUDE.md](/CLAUDE.md)

## 📞 Support

For issues or questions about tests:
1. Check test documentation in `/docs/test/`
2. Review existing test patterns in test files
3. Report issues with test failures including:
   - Test name and file
   - Error message and stack trace
   - Screenshots/videos from test-results/
   - Environment details (Node version, OS, etc.)

---

**Last Updated**: 2025-11-05
**Test Framework**: Playwright
**Total Test Files**: 31
**Total Test Cases**: 200+
