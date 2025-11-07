# Testing Guide

**Comprehensive Playwright E2E testing for Fictures**

## Quick Start

```bash
# Start dev server (required)
dotenv --file .env.local run pnpm dev

# Run all tests
pnpm test

# Run in UI mode (interactive)
npx playwright test --ui

# Run with browser visible
npx playwright test --headed
```

## Test Coverage

We have **200+ test cases** across:

- **E2E Tests** - Full user workflows (writing, reading, community)
- **API Tests** - All REST endpoints
- **Mobile Tests** - Responsive design and touch interactions
- **Accessibility Tests** - WCAG 2.1 Level AA compliance
- **Performance Tests** - Core Web Vitals

## Test Projects

- **`e2e`** - General end-to-end tests
- **`authenticated`** - Tests requiring login
- **`api`** - API endpoint tests
- **`mobile`** - Mobile-specific tests
- **`setup`** - Authentication setup

## Authentication for Tests

We use three test user roles:

1. **Manager** (`manager@fictures.xyz`) - Admin access
2. **Writer** (`writer@fictures.xyz`) - Story creation/editing
3. **Reader** (`reader@fictures.xyz`) - Read-only access

### Setup Test Users

```bash
# Create test users
dotenv --file .env.local run node scripts/setup-auth-users.mjs

# Verify setup
dotenv --file .env.local run node scripts/verify-auth-setup.mjs
```

## Running Specific Tests

```bash
# Test specific file
npx playwright test tests/gnb-reading.e2e.spec.ts

# Test specific suite
npx playwright test --grep "anonymous"

# Run writer tests only
npx playwright test --project=authenticated
```

## Debugging

```bash
# Debug mode with inspector
npx playwright test --debug

# Show browser during test
npx playwright test --headed

# Generate trace
npx playwright test --trace on
npx playwright show-report
```

## Writing New Tests

Follow the naming convention:
- `*.e2e.spec.ts` - End-to-end tests
- `*.authenticated.spec.ts` - Tests requiring auth
- `*.api.spec.ts` - API tests
- `*.mobile.spec.ts` - Mobile tests

Example structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/your-page');
    await page.waitForLoadState('networkidle');
  });

  test('TC-FEATURE-001: Test description', async ({ page }) => {
    // Test implementation
    const element = page.locator('[data-testid="element"]');
    await expect(element).toBeVisible();
  });
});
```

## CI/CD

Tests run automatically in CI with:
- Headless mode
- 2 automatic retries on failure
- HTML report generation

## Complete Testing Documentation

For the full testing guide with all details, see:

**[apps/web/tests/README.md](../apps/web/tests/README.md)**

This includes:
- Complete test structure
- Test data management
- Helper functions
- Performance benchmarks
- Best practices
- Detailed examples

---

**Happy testing!** 🧪
