# Test Development Guide

## Overview

This document provides the **implementation guidance** for executing tests defined in [test-specification.md](test-specification.md). It covers test automation setup, execution plans, data preparation, tools, and CI/CD integration.

For test requirements, test cases, and success criteria, see [test-specification.md](test-specification.md).

---

## Test Data Preparation

Before running tests, prepare mockup data for database and Vercel Blob storage using the provided scripts.

### Database Test Data

**Setup Authentication Users:**
```bash
# Create all test users (manager, writer, reader) with proper roles
dotenv --file .env.local run node scripts/setup-auth-users.mjs

# Verify authentication setup
dotenv --file .env.local run node scripts/verify-auth-setup.mjs
```

**User Profiles in `.auth/user.json`:**
- **manager@fictures.xyz**: Manager role (`admin:all` scope) - Full access
- **writer@fictures.xyz**: Writer role (`stories:write` scope) - Story creation/editing
- **reader@fictures.xyz**: Reader role (`stories:read` scope) - Read-only access

**API Keys for Each User:**
Each user profile includes an API key for testing API endpoints:
- **manager**: Full API access with `admin:all` scope
- **writer**: Story API access with `stories:write` scope
- **reader**: Read-only API access with `stories:read` scope

API keys are stored in `.auth/user.json` under each profile's `apiKey` field.

**Generate Test Stories:**
```bash
# Generate a minimal test story (1 part, 1 chapter, 3 scenes) - ~5-10 min
dotenv --file .env.local run node scripts/generate-minimal-story.mjs

# Generate multiple test stories for different scenarios
dotenv --file .env.local run node test-scripts/generate-test-stories.mjs
```

**Community Test Data:**
```bash
# Create test posts, comments, likes, and bookmarks
dotenv --file .env.local run node test-scripts/generate-community-data.mjs
```

**Analytics Test Data:**
```bash
# Generate test reading sessions, views, and engagement metrics
dotenv --file .env.local run node test-scripts/generate-analytics-data.mjs
```

### Vercel Blob Test Data

**Story Images:**
Test stories generated via `generate-minimal-story.mjs` automatically include:
- Story cover images (1344×768, 7:4 aspect ratio)
- Scene images (1344×768, 7:4 aspect ratio)
- Character portraits (1344×768, 7:4 aspect ratio)
- Setting visuals (1344×768, 7:4 aspect ratio)
- 4 optimized variants per image (AVIF, JPEG × mobile 1x/2x)

**Environment-Aware Storage:**
Images are stored with environment prefixes:
- Development: `develop/stories/{storyId}/...`
- Production: `main/stories/{storyId}/...`

**Manual Image Upload (Optional):**
```bash
# Upload test images directly to Vercel Blob
dotenv --file .env.local run node test-scripts/upload-test-images.mjs
```

### Cleanup Test Data

**Remove All Test Data:**
```bash
# Remove all stories (requires confirmation)
dotenv --file .env.local run node scripts/remove-all-stories.mjs --confirm

# Remove specific story
dotenv --file .env.local run node scripts/remove-story.mjs STORY_ID

# Dry run to preview deletion
dotenv --file .env.local run node scripts/remove-all-stories.mjs --dry-run
```

**What Gets Removed:**
- Database records (stories, parts, chapters, scenes, characters, settings)
- Vercel Blob images (all images with prefix `stories/{storyId}/`)
- Community data (posts, likes, replies, bookmarks)
- Analytics data (reading sessions, insights, events)

### Test Data Verification

**Verify Database:**
```bash
# Check user accounts and roles
dotenv --file .env.local run node scripts/verify-auth-setup.mjs

# Check story data
dotenv --file .env.local run pnpm db:studio
```

**Verify Blob Storage:**
```bash
# List all images in blob storage
dotenv --file .env.local run node test-scripts/list-blob-images.mjs

# Check image accessibility
dotenv --file .env.local run node test-scripts/verify-image-urls.mjs
```

---

## Test Execution Plan

### Phase 1: Environment Setup & Smoke Tests

**Objective:** Ensure test environment is ready and basic functionality works

**Duration:** 30 minutes

**Prerequisites:**
- Development server running on port 3000
- Database migrated with latest schema
- Test users created in `.auth/user.json`
- Blob storage accessible

**Execution Steps:**

1. **Setup Authentication State**
   ```bash
   dotenv --file .env.local run node scripts/setup-auth-users.mjs
   dotenv --file .env.local run node scripts/verify-auth-setup.mjs
   ```
   - Verify 3 test users created: manager, writer, reader
   - Confirm profiles stored in `.auth/user.json`

2. **Start Development Server**
   ```bash
   rm -rf .next && dotenv --file .env.local run pnpm dev > logs/dev-server.log 2>&1 &
   ```
   - Verify server running on http://localhost:3000
   - Check logs for errors

3. **Basic Smoke Tests**
   - **TC-HOME-NAV-002**: Home page loads without authentication
   - **TC-HOME-PERF-002**: No JavaScript errors on load
   - **TC-STUDIO-AUTH-001**: Anonymous users redirected to sign in
   - **TC-NOVELS-AUTH-001**: Anonymous users can access novels
   - **TC-COMMUNITY-AUTH-001**: Anonymous users can view posts

4. **Verify Test Data**
   ```bash
   dotenv --file .env.local run node scripts/verify-test-data.mjs
   ```
   - Confirm test stories exist
   - Verify test community posts
   - Check test analytics data

**Success Criteria:**
- All 5 smoke tests pass
- No console errors
- Test users authenticated successfully

---

### Phase 2: Authentication & Access Control Tests

**Objective:** Verify authentication flows and role-based access control

**Duration:** 1 hour

**Test Groups:**

1. **Login/Logout Tests**
   - **TC-API-AUTH-001**: Email/password login
   - **TC-API-AUTH-002**: Invalid credentials
   - **TC-API-AUTH-005**: OAuth login
   - **TC-API-AUTH-009**: Logout clears session

2. **Session Management**
   - **TC-API-AUTH-013**: Valid session returns user data
   - **TC-API-AUTH-014**: Expired session returns 401
   - **TC-API-AUTH-016**: Session refresh works

3. **Role-Based Access - Studio**
   - **TC-STUDIO-AUTH-001**: Anonymous → redirect
   - **TC-STUDIO-AUTH-002**: Reader → access denied
   - **TC-STUDIO-AUTH-003**: Writer → access granted
   - **TC-STUDIO-AUTH-004**: Manager → access granted

4. **Role-Based Access - Publish**
   - **TC-PUBLISH-AUTH-001**: Anonymous → redirect
   - **TC-PUBLISH-AUTH-002**: Reader → access denied
   - **TC-PUBLISH-AUTH-003**: Writer → access granted
   - **TC-PUBLISH-AUTH-004**: Manager → access granted

5. **Role-Based Access - Analysis**
   - **TC-ANALYSIS-AUTH-001**: Anonymous → redirect
   - **TC-ANALYSIS-AUTH-002**: Reader → access denied
   - **TC-ANALYSIS-AUTH-003**: Writer → access granted
   - **TC-ANALYSIS-AUTH-004**: Manager → access granted

6. **Public Access**
   - **TC-HOME-AUTH-001**: Home accessible to all
   - **TC-NOVELS-AUTH-001**: Novels accessible to all
   - **TC-COMICS-AUTH-001**: Comics accessible to all
   - **TC-COMMUNITY-AUTH-001**: Community viewable by all

**Execution Order:**
1. Run anonymous user tests first
2. Test reader role
3. Test writer role
4. Test manager role
5. Verify menu item visibility per role

**Success Criteria:**
- All access control tests pass
- No unauthorized access allowed
- Proper redirects for unauthenticated users

---

### Phase 3: Navigation Tests

**Objective:** Verify all navigation flows work correctly

**Duration:** 45 minutes

**Test Groups:**

1. **GNB Menu Navigation**
   - **TC-HOME-REDIRECT-001**: Home → redirects to /novels
   - **TC-STUDIO-NAV-002**: Studio menu → /studio
   - **TC-NOVELS-NAV-001**: Novels menu → /novels
   - **TC-COMICS-NAV-001**: Comics menu → /comics
   - **TC-COMMUNITY-NAV-001**: Community menu → /community
   - **TC-PUBLISH-NAV-001**: Publish menu → /publish
   - **TC-ANALYSIS-NAV-001**: Analysis menu → /analysis
   - **TC-SETTINGS-NAV-001**: Settings menu → /settings

2. **Active State Highlighting**
   - Verify active menu item highlighted on each page
   - Test all 8 menu items

3. **Mobile Menu**
   - **TC-MOBILE-002**: Mobile menu opens/closes
   - **TC-MOBILE-007**: Bottom navigation works
   - Verify mobile navigation on all pages

4. **Breadcrumb Navigation**
   - **TC-STUDIO-NAV-005**: Studio breadcrumbs
   - **TC-PUBLISH-NAV-005**: Publish breadcrumbs

5. **Internal Page Navigation**
   - **TC-STUDIO-NAV-004**: Story card → editor
   - **TC-NOVELS-NAV-003**: Story card → reader
   - **TC-COMICS-NAV-003**: Comic card → reader
   - **TC-COMMUNITY-NAV-003**: Post → detail view

6. **Back/Forward Navigation**
   - **TC-STUDIO-NAV-003**: Back button works
   - **TC-PUBLISH-NAV-004**: Back to story list
   - **TC-SETTINGS-NAV-003**: Back preserves state

**Success Criteria:**
- All navigation links work
- Active states correct
- No broken links
- Browser back/forward functional

---

### Phase 4: Core Functionality Tests

**Objective:** Verify main features and user interactions

**Duration:** 3 hours

**Test Groups:**

1. **Studio - Story Management** (30 min)
   - **TC-STUDIO-FUNC-001**: Create new story
   - **TC-STUDIO-FUNC-002**: Open story editor
   - **TC-STUDIO-FUNC-003**: Delete story (with confirmation)
   - **TC-STUDIO-FUNC-004**: Update story status
   - **TC-STUDIO-FUNC-005**: Toggle card/table view
   - **TC-STUDIO-FUNC-006**: Search stories
   - **TC-STUDIO-FUNC-007**: Sort stories
   - **TC-STUDIO-FUNC-008**: Bulk actions

2. **Novels - Reading Experience** (30 min)
   - **TC-NOVELS-FUNC-001**: Rate story
   - **TC-NOVELS-FUNC-002**: Track reading history
   - **TC-NOVELS-FUNC-003**: View chapter preview
   - **TC-NOVELS-FUNC-004**: Post/view comments
   - **TC-NOVELS-FUNC-005**: Save reading progress
   - **TC-NOVELS-FUNC-006**: Adjust font/theme

3. **Comics - Reading Experience** (30 min)
   - **TC-COMICS-FUNC-001**: Rate comic
   - **TC-COMICS-FUNC-002**: Track reading history
   - **TC-COMICS-FUNC-003**: Navigate panels
   - **TC-COMICS-FUNC-004**: Post/view comments
   - **TC-COMICS-FUNC-005**: Save reading progress

4. **Community - Social Features** (30 min)
   - **TC-COMMUNITY-FUNC-001**: Create post button (auth only)
   - **TC-COMMUNITY-FUNC-002**: Create new post
   - **TC-COMMUNITY-FUNC-003**: Comment on post
   - **TC-COMMUNITY-FUNC-004**: Like/dislike post
   - **TC-COMMUNITY-FUNC-005**: Edit/delete own post
   - **TC-COMMUNITY-FUNC-006**: Search posts
   - **TC-COMMUNITY-FUNC-007**: Reply to comments
   - **TC-COMMUNITY-FUNC-008**: Report post

5. **Publish - Publishing Workflow** (30 min)
   - **TC-PUBLISH-FUNC-001**: Select story for publishing
   - **TC-PUBLISH-FUNC-002**: Complete publish workflow
   - **TC-PUBLISH-FUNC-003**: Preview before publish
   - **TC-PUBLISH-FUNC-004**: Unpublish story
   - **TC-PUBLISH-FUNC-005**: Save publishing settings
   - **TC-PUBLISH-FUNC-006**: Schedule publish
   - **TC-PUBLISH-FUNC-007**: Publish to categories
   - **TC-PUBLISH-FUNC-008**: Validation prevents incomplete publish

6. **Analysis - Data Visualization** (30 min)
   - **TC-ANALYSIS-FUNC-001**: Filter by story
   - **TC-ANALYSIS-FUNC-002**: Select date range
   - **TC-ANALYSIS-FUNC-003**: Export data
   - **TC-ANALYSIS-FUNC-004**: Update charts with filters
   - **TC-ANALYSIS-FUNC-005**: Drill down metrics
   - **TC-ANALYSIS-FUNC-006**: Compare stories
   - **TC-ANALYSIS-FUNC-007**: Real-time updates
   - **TC-ANALYSIS-FUNC-008**: View metric tooltips

7. **Settings - User Preferences** (30 min)
   - **TC-SETTINGS-FUNC-001**: Update profile
   - **TC-SETTINGS-FUNC-002**: Change password
   - **TC-SETTINGS-FUNC-003**: Toggle theme
   - **TC-SETTINGS-FUNC-004**: Update notifications
   - **TC-SETTINGS-FUNC-005**: Account deletion
   - **TC-SETTINGS-FUNC-006**: Update email prefs
   - **TC-SETTINGS-FUNC-007**: Update privacy settings
   - **TC-SETTINGS-FUNC-008**: Upload avatar

**Success Criteria:**
- All core features functional
- Form validations work
- Data persistence correct
- User feedback appropriate

---

### Phase 5: API Tests

**Objective:** Verify all API endpoints work correctly

**Duration:** 2 hours

**Test Groups:**

1. **Authentication API** (20 min)
   - Run all TC-API-AUTH-001 through TC-API-AUTH-016
   - Test login, logout, session management
   - Verify rate limiting and CSRF protection

2. **Story API** (30 min)
   - Run all TC-API-STORY-001 through TC-API-STORY-035
   - Test CRUD operations
   - Verify access control
   - Test pagination and filtering

3. **Generation API** (30 min)
   - Run all TC-API-GEN-001 through TC-API-GEN-025
   - Test story generation flow
   - Verify SSE streaming
   - Test image generation and optimization

4. **Community API** (20 min)
   - Run all TC-API-COMM-001 through TC-API-COMM-023
   - Test post management
   - Verify like/unlike functionality

5. **Analysis API** (15 min)
   - Run all TC-API-ANALYSIS-001 through TC-API-ANALYSIS-014
   - Test analysis retrieval
   - Verify event recording

6. **Publish API** (15 min)
   - Run all TC-API-PUBLISH-001 through TC-API-PUBLISH-013
   - Test publish/unpublish
   - Verify scheduling

7. **Image API** (15 min)
   - Run all TC-API-IMAGE-001 through TC-API-IMAGE-012
   - Test image upload
   - Verify Blob storage integration

8. **User API** (15 min)
   - Run all TC-API-USER-001 through TC-API-USER-011
   - Test profile management
   - Verify privacy controls

**Tools:**
```bash
# Run API tests with Playwright
dotenv --file .env.local run npx playwright test tests/api/ --headed

# Or use dedicated API testing script
dotenv --file .env.local run node test-scripts/run-api-tests.mjs
```

**Success Criteria:**
- All API endpoints return correct status codes
- Response data matches schemas
- Error handling works properly
- Rate limiting effective

---

### Phase 6: Performance Tests

**Objective:** Verify performance meets thresholds

**Duration:** 1 hour

**Test Groups:**

1. **Page Load Performance** (20 min)
   - Run all TC-*-PERF-001 tests (page load < 2-3s)
   - Measure with Lighthouse
   - Test with network throttling (3G, 4G)

2. **Core Web Vitals** (20 min)
   - **TC-PERF-001**: LCP < 2.5s
   - **TC-PERF-002**: FCP < 1.8s
   - **TC-PERF-003**: TTI < 3.8s
   - **TC-PERF-004**: CLS < 0.1

3. **API Performance** (20 min)
   - **TC-PERF-005**: API response times < 500ms (p95)
   - Measure all major endpoints
   - Test under load (10 concurrent users)

4. **Database Performance** (20 min)
   - **TC-PERF-006**: N+1 queries prevented
   - Verify query optimization
   - Test with large datasets

**Tools:**
```bash
# Lighthouse CI
npx lighthouse http://localhost:3000 --view

# Load testing
dotenv --file .env.local run node test-scripts/load-test.mjs
```

**Success Criteria:**
- All performance thresholds met
- No performance regressions
- Lighthouse scores > 90

---

### Phase 7: Error Handling & Edge Cases

**Objective:** Verify error scenarios handled gracefully

**Duration:** 1.5 hours

**Test Groups:**

1. **Network Errors** (30 min)
   - Run all TC-*-ERROR-* tests
   - Simulate network failures
   - Verify error messages user-friendly
   - Test retry mechanisms

2. **Invalid Input** (30 min)
   - Test API endpoints with invalid data
   - Verify validation error messages
   - Test XSS/SQL injection prevention

3. **Edge Cases** (30 min)
   - Empty states (no stories, no posts)
   - Maximum limits (long titles, large files)
   - Concurrent operations
   - Race conditions

**Tools:**
```bash
# Run error handling tests
dotenv --file .env.local run npx playwright test tests/errors/ --headed
```

**Success Criteria:**
- No unhandled errors crash app
- Error messages helpful
- Recovery mechanisms work

---

### Phase 8: Cross-Cutting Tests

**Objective:** Verify non-functional requirements

**Duration:** 1.5 hours

**Test Groups:**

1. **Mobile Responsiveness** (30 min)
   - Run all TC-MOBILE-* tests
   - Test on multiple viewport sizes
   - Verify touch interactions

2. **Theme Support** (15 min)
   - Run all TC-THEME-* tests
   - Test light/dark mode switching
   - Verify no visual glitches

3. **Accessibility** (30 min)
   - Run all TC-A11Y-* tests
   - Test with screen reader
   - Verify keyboard navigation
   - Check WCAG compliance

4. **Security** (30 min)
   - Run all TC-SECURITY-* tests
   - Test XSS prevention
   - Verify CSRF protection
   - Test rate limiting

5. **SEO** (15 min)
   - Run all TC-SEO-* tests
   - Verify meta tags
   - Check sitemap and robots.txt

**Tools:**
```bash
# Accessibility testing
npx playwright test tests/a11y/ --headed

# Security scanning
npm audit
```

**Success Criteria:**
- Mobile experience excellent
- Accessibility standards met
- Security vulnerabilities addressed

---

### Phase 9: Regression Tests

**Objective:** Ensure no regressions from previous releases

**Duration:** 1 hour

**Test Groups:**

1. **Critical Path Smoke Tests** (30 min)
   - Run core user journeys end-to-end
   - Writer creates and publishes story
   - Reader discovers and reads story
   - Community engagement workflow

2. **Bug Fix Verification** (30 min)
   - Re-run tests for previously fixed bugs
   - Verify fixes still work
   - Check for regression in related areas

**Tools:**
```bash
# Run full test suite
dotenv --file .env.local run npx playwright test --headed

# Generate test report
npx playwright show-report
```

**Success Criteria:**
- No regressions detected
- All critical paths functional
- Previously fixed bugs stay fixed

---

## Test Automation Strategy

### Framework: Playwright

**Configuration:**
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Test projects
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
      dependencies: ['setup'],
    },
  ],
});
```

### Test Organization

```
tests/
├── setup/
│   ├── auth.setup.ts           # Setup authentication state
│   └── test-data.setup.ts      # Setup test data
├── e2e/
│   ├── home.spec.ts            # Home page redirect tests
│   ├── studio.spec.ts          # Studio tests
│   ├── novels.spec.ts          # Novels tests
│   ├── comics.spec.ts          # Comics tests
│   ├── community.spec.ts       # Community tests
│   ├── publish.spec.ts         # Publish tests
│   ├── analysis.spec.ts        # Analysis tests
│   └── settings.spec.ts        # Settings tests
├── api/
│   ├── auth.api.spec.ts        # Auth API tests
│   ├── story.api.spec.ts       # Story API tests
│   ├── generation.api.spec.ts  # Generation API tests
│   ├── community.api.spec.ts   # Community API tests
│   └── analysis.api.spec.ts    # Analysis API tests
├── cross-cutting/
│   ├── mobile.spec.ts          # Mobile responsiveness
│   ├── theme.spec.ts           # Theme switching
│   ├── a11y.spec.ts            # Accessibility
│   └── performance.spec.ts     # Performance tests
└── errors/
    ├── network-errors.spec.ts  # Network error handling
    └── edge-cases.spec.ts      # Edge case testing
```

### Authentication Helper

```typescript
// tests/helpers/auth.ts
import { Page } from '@playwright/test';
import fs from 'fs';

interface AuthProfile {
  email: string;
  password: string;
  role: string;
  userId: string;
}

export async function loginAs(page: Page, role: 'manager' | 'writer' | 'reader') {
  const authData = JSON.parse(fs.readFileSync('.auth/user.json', 'utf-8'));
  const profile = authData.profiles[role] as AuthProfile;

  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input[type="email"]', profile.email);
  await page.fill('input[type="password"]', profile.password);
  await page.click('button:has-text("Sign in with Email")');

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: pnpm install
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      - name: Run Playwright tests
        run: dotenv --file .env.local run npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Running Tests

```bash
# Run all tests
dotenv --file .env.local run npx playwright test

# Run specific test file
dotenv --file .env.local run npx playwright test tests/e2e/studio.spec.ts

# Run tests in headed mode
dotenv --file .env.local run npx playwright test --headed

# Run tests for specific browser
dotenv --file .env.local run npx playwright test --project=chromium

# Run tests in debug mode
dotenv --file .env.local run npx playwright test --debug

# Generate test report
npx playwright show-report
```

### Test Data Management

```bash
# Setup test users
dotenv --file .env.local run node scripts/setup-auth-users.mjs

# Verify auth setup
dotenv --file .env.local run node scripts/verify-auth-setup.mjs

# Setup test data
dotenv --file .env.local run node scripts/setup-test-data.mjs

# Clean test data
dotenv --file .env.local run node scripts/clean-test-data.mjs
```

---

## Test Data Requirements

### Test Users

**Required Profiles in `.auth/user.json`:**

1. **Anonymous User**
   - No authentication
   - Used for testing public access

2. **Reader Role User**
   ```json
   {
     "email": "reader@fictures.xyz",
     "password": "stored_in_auth_file",
     "role": "reader",
     "userId": "generated_id"
   }
   ```

3. **Writer Role User**
   ```json
   {
     "email": "writer@fictures.xyz",
     "password": "stored_in_auth_file",
     "role": "writer",
     "userId": "generated_id"
   }
   ```

4. **Manager Role User**
   ```json
   {
     "email": "manager@fictures.xyz",
     "password": "stored_in_auth_file",
     "role": "manager",
     "userId": "generated_id"
   }
   ```

**Setup:**
```bash
dotenv --file .env.local run node scripts/setup-auth-users.mjs
dotenv --file .env.local run node scripts/verify-auth-setup.mjs
```

### Test Content

**Stories:**
- 5 draft stories (writer-owned)
- 10 published stories (various authors)
- 3 stories with complete chapter structure
- 2 stories with analytics data
- 1 story with images

**Community Posts:**
- 20 posts across different categories
- Posts with 0, 1-5, 6-20 comments
- Posts with various like counts

**Analysis Data:**
- Reading events for last 30 days
- User engagement metrics
- Story performance data

**Setup:**
```bash
dotenv --file .env.local run node scripts/setup-test-data.mjs
```

---

## Test Report Template

### Executive Summary

**Test Run Information:**
- **Date:** [YYYY-MM-DD]
- **Environment:** Development / Staging / Production
- **Tester:** [Name]
- **Build Version:** [Version/Commit Hash]
- **Test Duration:** [X hours]

**Overall Results:**
- **Total Tests:** [XXX]
- **Passed:** [XXX] ([XX]%)
- **Failed:** [XX] ([XX]%)
- **Skipped:** [XX] ([XX]%)
- **Blocked:** [XX] ([XX]%)

**Test Execution Status:**
- Phase 1 (Setup & Smoke): ✅ Complete
- Phase 2 (Auth & Access Control): ✅ Complete
- Phase 3 (Navigation): ✅ Complete
- Phase 4 (Core Functionality): 🔄 In Progress
- Phase 5 (API Tests): ⏸️ Pending
- Phase 6 (Performance): ⏸️ Pending
- Phase 7 (Error Handling): ⏸️ Pending
- Phase 8 (Cross-Cutting): ⏸️ Pending
- Phase 9 (Regression): ⏸️ Pending

---

### Test Coverage Metrics

**Page Coverage:**
| Page | Tests Run | Passed | Failed | Coverage |
|------|-----------|--------|--------|----------|
| Home | 6/6 | 6 | 0 | 100% |
| Studio | 28/30 | 26 | 2 | 93% |
| Novels | 25/30 | 23 | 2 | 92% |
| Comics | 25/30 | 25 | 0 | 100% |
| Community | 24/30 | 22 | 2 | 91% |
| Publish | 24/30 | 20 | 4 | 83% |
| Analysis | 24/30 | 24 | 0 | 100% |
| Settings | 24/30 | 24 | 0 | 100% |

**API Coverage:**
| API Category | Endpoints Tested | Pass Rate |
|--------------|------------------|-----------|
| Authentication | 16/16 | 100% |
| Story | 35/35 | 100% |
| Generation | 25/25 | 96% |
| Community | 23/23 | 100% |
| Analysis | 14/14 | 100% |
| Publish | 13/13 | 92% |
| Image | 12/12 | 100% |
| User | 11/11 | 100% |

**Test Category Coverage:**
| Category | Tests | Pass Rate |
|----------|-------|-----------|
| Navigation | 45/45 | 100% |
| Access Control | 42/42 | 100% |
| Content | 54/54 | 100% |
| Functionality | 72/72 | 97% |
| Performance | 36/36 | 94% |
| Error Handling | 36/36 | 92% |

---

### Pass/Fail Statistics

**By Priority:**
- **P0 (Critical):** 50/50 passed (100%)
- **P1 (High):** 95/100 passed (95%)
- **P2 (Medium):** 140/150 passed (93%)
- **P3 (Low):** 45/50 passed (90%)

**By Test Type:**
- **UI Tests:** 200/220 passed (91%)
- **API Tests:** 149/149 passed (100%)
- **Integration Tests:** 45/50 passed (90%)
- **Performance Tests:** 36/36 passed (100%)

**Trend Analysis:**
- Previous run: 88% pass rate
- Current run: 92% pass rate
- Change: +4% improvement ✅

---

### Performance Benchmarks

**Page Load Times:**
| Page | Target | Actual | Status |
|------|--------|--------|--------|
| Home | < 100ms | 50ms | ✅ |
| Studio | < 2s | 1.8s | ✅ |
| Novels | < 2s | 1.5s | ✅ |
| Comics | < 2s | 2.1s | ⚠️ |
| Community | < 2s | 1.6s | ✅ |
| Publish | < 2s | 1.9s | ✅ |
| Analysis | < 3s | 2.4s | ✅ |
| Settings | < 2s | 1.3s | ✅ |

**Core Web Vitals:**
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| LCP | < 2.5s | 2.1s | ✅ |
| FCP | < 1.8s | 1.4s | ✅ |
| TTI | < 3.8s | 3.2s | ✅ |
| CLS | < 0.1 | 0.08 | ✅ |

**API Performance (p95):**
| Endpoint | Target | Actual | Status |
|----------|--------|--------|--------|
| GET /api/stories | < 500ms | 320ms | ✅ |
| POST /api/stories | < 500ms | 420ms | ✅ |
| GET /api/community/posts | < 500ms | 280ms | ✅ |
| POST /api/studio/api/novels/* | < 5s | 3.2s | ✅ |

**Lighthouse Scores:**
| Page | Performance | Accessibility | Best Practices | SEO |
|------|-------------|---------------|----------------|-----|
| Home | 95 | 98 | 100 | 100 |
| Studio | 92 | 95 | 100 | 95 |
| Novels | 94 | 97 | 100 | 98 |

---

### Issues & Bugs Found

**Critical Issues (P0):**

None found.

**High Priority Issues (P1):**

1. **ISSUE-001: Comics page load time exceeds threshold**
   - **Test:** TC-COMICS-PERF-001
   - **Expected:** Page load < 2s
   - **Actual:** 2.1s
   - **Impact:** User experience degradation
   - **Root Cause:** Large panel images not optimized
   - **Recommendation:** Implement lazy loading for comic panels
   - **Status:** Open
   - **Assigned To:** Frontend Team

2. **ISSUE-002: Publish validation error messages unclear**
   - **Test:** TC-PUBLISH-FUNC-008
   - **Expected:** Clear validation messages
   - **Actual:** Generic "Validation failed" message
   - **Impact:** User confusion during publishing
   - **Root Cause:** Error message mapping incomplete
   - **Recommendation:** Add specific validation error messages
   - **Status:** Open
   - **Assigned To:** Backend Team

**Medium Priority Issues (P2):**

3. **ISSUE-003: Mobile menu animation stutters on older devices**
   - **Test:** TC-MOBILE-002
   - **Impact:** Poor mobile UX on low-end devices
   - **Recommendation:** Optimize CSS animations
   - **Status:** Open

4. **ISSUE-004: Analysis chart tooltips cut off on small screens**
   - **Test:** TC-ANALYSIS-FUNC-008
   - **Impact:** Data not fully visible on mobile
   - **Recommendation:** Adjust tooltip positioning logic
   - **Status:** Open

**Low Priority Issues (P3):**

5. **ISSUE-005: Theme switch has brief flash of unstyled content**
   - **Test:** TC-THEME-003
   - **Impact:** Minor visual glitch
   - **Recommendation:** Preload theme CSS
   - **Status:** Open

---

### Recommendations

**Immediate Actions Required:**

1. **Fix Comics Page Performance** (ISSUE-001)
   - Implement progressive image loading
   - Add image size optimization
   - Target completion: Within 1 sprint

2. **Improve Publish Validation Messages** (ISSUE-002)
   - Map all validation errors to user-friendly messages
   - Add inline field-level validation
   - Target completion: Within 1 sprint

**Short-term Improvements (1-2 sprints):**

3. **Optimize Mobile Experience**
   - Address animation performance (ISSUE-003)
   - Fix responsive issues (ISSUE-004)
   - Add touch gesture improvements

4. **Enhance Error Handling**
   - Standardize error message format across app
   - Add retry mechanisms for transient failures
   - Improve error recovery flows

**Long-term Enhancements (3+ sprints):**

5. **Performance Optimization**
   - Implement service worker for offline support
   - Add predictive prefetching
   - Optimize bundle size

6. **Accessibility Improvements**
   - Add keyboard shortcuts
   - Enhance screen reader support
   - Improve focus management

---

### Test Environment Details

**Hardware:**
- **Device:** MacBook Pro M1
- **RAM:** 16GB
- **Browsers:** Chrome 120, Safari 17, Firefox 121

**Software:**
- **OS:** macOS Sonoma 14.2
- **Node.js:** v20.10.0
- **pnpm:** 8.14.0
- **Playwright:** 1.40.1

**Test Data:**
- **Test Users:** 3 (manager, writer, reader)
- **Test Stories:** 15 (5 draft, 10 published)
- **Test Posts:** 20
- **Database:** Neon PostgreSQL (development)
- **Blob Storage:** Vercel Blob (development)

**Configuration:**
```bash
# Environment
NODE_ENV=development
DATABASE_URL=[pooled_connection]
DATABASE_URL_UNPOOLED=[direct_connection]
BLOB_READ_WRITE_TOKEN=[token]

# Test users stored in
.auth/user.json
```

---

### Attachments

**Test Artifacts:**
- Playwright HTML Report: `playwright-report/index.html`
- Screenshots: `test-results/screenshots/`
- Trace Files: `test-results/traces/`
- Logs: `logs/playwright.log`

**Performance Reports:**
- Lighthouse Reports: `lighthouse-reports/`
- Bundle Analysis: `bundle-analysis/`

**Coverage Reports:**
- Test Coverage: `coverage/index.html`

---

### Sign-off

**Prepared By:**
- Name: [Tester Name]
- Role: QA Engineer
- Date: [YYYY-MM-DD]

**Reviewed By:**
- Name: [Reviewer Name]
- Role: QA Lead
- Date: [YYYY-MM-DD]

**Approved By:**
- Name: [Approver Name]
- Role: Engineering Manager
- Date: [YYYY-MM-DD]

---

**End of Test Development Guide**
