# Test Suite Installation Guide

## Prerequisites

### 1. Install Dependencies

Make sure you have all required dependencies installed:

```bash
# Install pnpm dependencies
pnpm install

# Install Playwright browsers
npx playwright install --with-deps
```

### 2. Install Accessibility Testing Dependency

For accessibility tests (`a11y.spec.ts`), install axe-core:

```bash
pnpm add -D @axe-core/playwright
```

### 3. Setup Environment Variables

Ensure your `.env.local` file contains all required environment variables:

```bash
# Authentication
AUTH_SECRET=***
GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***

# AI Integration
GOOGLE_GENERATIVE_AI_API_KEY=***
AI_GATEWAY_API_KEY=***

# Database & Storage
DATABASE_URL=***
DATABASE_URL_UNPOOLED=***
BLOB_READ_WRITE_TOKEN=***
REDIS_URL=***
```

### 4. Setup Test Users

Create authentication users for testing:

```bash
# Create test users (manager, writer, reader)
dotenv --file .env.local run node scripts/setup-auth-users.mjs

# Verify authentication setup
dotenv --file .env.local run node scripts/verify-auth-setup.mjs
```

This will create `.auth/user.json` with three test user profiles:
- `manager@fictures.xyz` (admin:all scope)
- `writer@fictures.xyz` (stories:write scope)
- `reader@fictures.xyz` (stories:read scope)

### 5. Setup Test Data (Optional)

Create test stories and community posts:

```bash
# Generate minimal test story (fastest - 5-10 min)
dotenv --file .env.local run node scripts/generate-minimal-story.mjs

# Or use test data setup script
dotenv --file .env.local run npx playwright test tests/setup/test-data.setup.ts
```

## Verification

### 1. Verify Playwright Installation

```bash
npx playwright --version
```

Expected output: `Version 1.40.x` or later

### 2. Verify Test Users

```bash
cat .auth/user.json | grep email
```

Expected output:
```
"email": "manager@fictures.xyz"
"email": "writer@fictures.xyz"
"email": "reader@fictures.xyz"
```

### 3. Run Setup Tests

```bash
# Run authentication setup
dotenv --file .env.local run npx playwright test tests/setup/auth.setup.ts

# Verify storage state files created
ls -la .auth/
```

Expected files:
- `.auth/manager.json`
- `.auth/writer.json`
- `.auth/reader.json`
- `.auth/user.json`

### 4. Run Smoke Tests

```bash
# Start development server
rm -rf .next && dotenv --file .env.local run pnpm dev > logs/dev-server.log 2>&1 &

# Run home page tests (should be fast)
dotenv --file .env.local run npx playwright test tests/e2e/home.spec.ts
```

## Common Issues

### Issue: "Authentication file not found"

**Solution**:
```bash
dotenv --file .env.local run node scripts/setup-auth-users.mjs
```

### Issue: "Port 3000 already in use"

**Solution**:
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or specify port range
pkill -f "next dev"
```

### Issue: "Database connection failed"

**Solution**:
- Verify `DATABASE_URL` in `.env.local`
- Run database migrations: `pnpm db:migrate`
- Check Neon PostgreSQL is accessible

### Issue: "Playwright browsers not installed"

**Solution**:
```bash
npx playwright install --with-deps
```

### Issue: "Tests timing out"

**Solution**:
- Increase timeout in `playwright.config.ts`:
  ```typescript
  timeout: 240000, // 4 minutes
  ```
- Or set per test:
  ```typescript
  test.setTimeout(120000); // 2 minutes
  ```

## Running Tests

After successful installation:

```bash
# Run all tests
dotenv --file .env.local run npx playwright test

# Run specific suite
dotenv --file .env.local run npx playwright test tests/e2e/

# Run with UI (headed mode)
dotenv --file .env.local run npx playwright test --headed

# Run in debug mode
dotenv --file .env.local run npx playwright test --debug
```

## Directory Structure

```
apps/web/
├── tests/
│   ├── helpers/              # ✅ Created
│   ├── setup/                # ✅ Created
│   ├── e2e/                  # ✅ Created
│   ├── api/                  # ✅ Created
│   ├── cross-cutting/        # ✅ Created
│   ├── errors/               # ✅ Created
│   ├── README.md             # ✅ Created
│   └── INSTALLATION.md       # ✅ Created (this file)
├── playwright.config.ts      # ✅ Already exists
└── .auth/
    ├── user.json             # Created by setup-auth-users.mjs
    ├── manager.json          # Created by auth.setup.ts
    ├── writer.json           # Created by auth.setup.ts
    └── reader.json           # Created by auth.setup.ts
```

## Test Files Created

### Helper Files (2)
- ✅ `helpers/auth.ts` - Authentication utilities
- ✅ `helpers/test-data.ts` - Test data management

### Setup Files (2)
- ✅ `setup/auth.setup.ts` - Authentication state setup
- ✅ `setup/test-data.setup.ts` - Test data preparation

### E2E Tests (11)
- ✅ `e2e/home.spec.ts`
- ✅ `e2e/studio.writer.spec.ts`
- ✅ `e2e/studio.reader.spec.ts`
- ✅ `e2e/studio-agent.writer.spec.ts`
- ✅ `e2e/novels.e2e.spec.ts`
- ✅ `e2e/comics.e2e.spec.ts`
- ✅ `e2e/community.e2e.spec.ts`
- ✅ `e2e/publish.writer.spec.ts`
- ✅ `e2e/analysis.writer.spec.ts`
- ✅ `e2e/settings.authenticated.spec.ts`

### API Tests (8)
- ✅ `api/auth.api.spec.ts`
- ✅ `api/story.api.spec.ts`
- ✅ `api/generation.api.spec.ts`
- ✅ `api/community.api.spec.ts`
- ✅ `api/analysis.api.spec.ts`
- ✅ `api/publish.api.spec.ts`
- ✅ `api/image.api.spec.ts`
- ✅ `api/user.api.spec.ts`

### Cross-Cutting Tests (4)
- ✅ `cross-cutting/mobile.mobile.spec.ts`
- ✅ `cross-cutting/theme.spec.ts`
- ✅ `cross-cutting/a11y.spec.ts`
- ✅ `cross-cutting/performance.spec.ts`

### Error Handling Tests (2)
- ✅ `errors/network-errors.spec.ts`
- ✅ `errors/edge-cases.spec.ts`

### Documentation (2)
- ✅ `README.md` - Comprehensive test guide
- ✅ `INSTALLATION.md` - This installation guide

**Total Files Created**: 31

## Next Steps

1. ✅ Install dependencies (including `@axe-core/playwright`)
2. ✅ Setup environment variables in `.env.local`
3. ✅ Create test users with `setup-auth-users.mjs`
4. ✅ Run authentication setup tests
5. ✅ Start development server
6. ✅ Run smoke tests
7. ✅ Run full test suite
8. ✅ Review test report

## Documentation References

- **Test Specification**: `/docs/test/test-specification.md`
- **Test Development Guide**: `/docs/test/test-development.md`
- **Test README**: `tests/README.md`
- **Project CLAUDE.md**: `/CLAUDE.md`

---

**Installation Status**: ✅ Complete
**Last Updated**: 2025-11-05
