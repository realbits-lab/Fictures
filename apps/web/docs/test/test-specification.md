# Test Specification

## Overview

This document defines the test requirements, test cases, and success criteria for the Fictures platform. It outlines **WHAT** needs to be tested across all features, focusing on functional requirements, access control, and quality standards.

For test execution details, automation setup, and implementation guidance, see [test-development.md](test-development.md).

---

## Test Directory Structure

The web application uses two separate test frameworks with distinct purposes:

### `tests/` - Playwright E2E Tests

**Framework**: Playwright
**Purpose**: End-to-end integration tests, API tests, cross-cutting concerns
**File Pattern**: `*.spec.ts`
**Config**: `playwright.config.ts`

```
tests/
├── setup/                    # Authentication setup
│   ├── auth.setup.ts
│   └── test-data.setup.ts
├── e2e/                      # Page-level E2E tests
│   ├── home.spec.ts
│   ├── studio.writer.spec.ts
│   ├── studio.reader.spec.ts
│   ├── novels.e2e.spec.ts
│   ├── comics.e2e.spec.ts
│   ├── community.e2e.spec.ts
│   ├── publish.writer.spec.ts
│   ├── analysis.writer.spec.ts
│   ├── settings.authenticated.spec.ts
│   └── studio-agent.writer.spec.ts
├── api/                      # API endpoint tests
│   ├── auth.api.spec.ts
│   ├── story.api.spec.ts
│   ├── generation.api.spec.ts
│   ├── community.api.spec.ts
│   ├── analysis.api.spec.ts
│   ├── publish.api.spec.ts
│   ├── image.api.spec.ts
│   └── user.api.spec.ts
├── cross-cutting/            # Non-functional tests
│   ├── mobile.mobile.spec.ts
│   ├── theme.spec.ts
│   ├── a11y.spec.ts
│   └── performance.spec.ts
├── errors/                   # Error handling tests
│   ├── network-errors.spec.ts
│   └── edge-cases.spec.ts
├── iteration-testing/        # A/B testing for generation
│   ├── novels/
│   ├── comics/
│   ├── toonplay/
│   └── images/
└── helpers/                  # Shared test utilities
    ├── auth.ts
    └── test-data.ts
```

**Running Playwright Tests:**
```bash
# Run all E2E tests
dotenv --file .env.local run npx playwright test

# Run specific test file
dotenv --file .env.local run npx playwright test tests/e2e/studio.writer.spec.ts

# Run API tests only
dotenv --file .env.local run npx playwright test tests/api/

# Run with headed browser
dotenv --file .env.local run npx playwright test --headed
```

### `__tests__/` - Jest Unit Tests

**Framework**: Jest
**Purpose**: Unit tests for services, utilities, and components
**File Pattern**: `*.test.ts` or `*.test.tsx`
**Config**: `jest.config.js`

```
__tests__/
├── novels/                   # Novel generation unit tests
│   ├── story.test.ts
│   ├── characters.test.ts
│   ├── settings.test.ts
│   ├── part.test.ts
│   ├── chapter.test.ts
│   ├── scene-summary.test.ts
│   ├── scene-content.test.ts
│   └── scene-improvement.test.ts
├── comics/                   # Comic generation tests
│   ├── comics.test.ts
│   └── comic-panel-generator.single.test.ts
├── toonplay/                 # Toonplay tests
│   └── toonplay.test.ts
├── images/                   # Image generation tests
│   └── images.test.ts
├── optimization/             # Performance optimization tests
│   └── novels-optimization.test.ts
├── components/               # React component tests
└── helpers/                  # Shared test utilities
    └── auth-loader.ts
```

**Running Jest Tests:**
```bash
# Run all unit tests
dotenv --file .env.local run pnpm test

# Run specific test file
dotenv --file .env.local run pnpm test __tests__/novels/story.test.ts

# Run with coverage
dotenv --file .env.local run pnpm test --coverage

# Run in watch mode
dotenv --file .env.local run pnpm test --watch
```

### Key Differences

| Aspect | `tests/` (Playwright) | `__tests__/` (Jest) |
|--------|----------------------|---------------------|
| Framework | Playwright | Jest |
| File Pattern | `*.spec.ts` | `*.test.ts` |
| Purpose | E2E, API, integration | Unit, service logic |
| Browser | Real browser | Node.js environment |
| Speed | Slower (browser) | Faster (no browser) |
| Auth Method | Storage state files | API key from `.auth/user.json` |
| Use When | Testing user flows, API contracts | Testing functions, services |

### File Naming Conventions

**Playwright Tests (`tests/`):**
- `*.e2e.spec.ts` - General E2E tests (no auth required)
- `*.writer.spec.ts` - Tests requiring writer role
- `*.reader.spec.ts` - Tests requiring reader role
- `*.manager.spec.ts` - Tests requiring manager role
- `*.authenticated.spec.ts` - Tests requiring any authenticated user
- `*.api.spec.ts` - API endpoint tests
- `*.mobile.spec.ts` - Mobile viewport tests

**Jest Tests (`__tests__/`):**
- `*.test.ts` - TypeScript unit tests
- `*.test.tsx` - React component tests

---

### Recent Updates (v2.2 - 2025-11-19)

**Key Changes:**

1. **Novels Page Test Cases Updated**: Aligned with actual implementation
   - Removed duplicate genre filter tests (TC-NOVELS-NAV-002 and TC-NOVELS-CONTENT-005)
   - Changed chapter references to scene list (TC-NOVELS-NAV-003/004, TC-NOVELS-CONTENT-006/007)
   - Removed word count from metadata (not implemented)
   - Removed font size/theme controls test (TC-NOVELS-FUNC-006 - not implemented)
   - Added new Caching Performance Tests section (TC-NOVELS-CACHE-001 to 006)
     - SWR caching, localStorage, ETag, Redis cache tests

2. **Comics Page Caching Tests Added**:
   - Added new Caching Performance Tests section (TC-COMICS-CACHE-001 to 006)
     - SWR caching, localStorage, ETag, Redis cache tests

3. **Added Test Directory Structure Section**: Comprehensive documentation of the two-framework test architecture
   - `tests/` - Playwright E2E tests (*.spec.ts)
   - `__tests__/` - Jest unit tests (*.test.ts)
   - Complete directory tree with all current test files
   - Running commands for both frameworks
   - Key differences comparison table
   - File naming conventions

4. **Clarified Test Framework Separation**:
   - Playwright for E2E, API, and integration tests
   - Jest for unit tests and service logic
   - Auth method differences (storage state vs API keys)

**See [Change Log](#change-log) for complete version history.**

## GNB Menu Structure

The application has 8 main navigation items:

1. **Home (/)** - Redirects to /novels
2. **Studio (/studio)** - Story creation and management workspace, restricted to writers and managers
3. **Novels (/novels)** - Browse and read text-based stories, accessible to all users
4. **Comics (/comics)** - Browse and read visual/comic format stories, accessible to all users
5. **Community (/community)** - Story sharing and discussions, accessible to all users
6. **Publish (/publish)** - Publishing workflow, restricted to writers and managers
7. **Analysis (/analysis)** - Story performance metrics, restricted to writers and managers
8. **Settings (/settings)** - User preferences and account management, requires authentication

## Access Control Matrix

| Menu Item  | Anonymous | Reader | Writer | Manager |
|-----------|-----------|--------|--------|---------|
| Home      | ✅        | ✅     | ✅     | ✅      |
| Studio    | ❌        | ❌     | ✅     | ✅      |
| Novels    | ✅        | ✅     | ✅     | ✅      |
| Comics    | ✅        | ✅     | ✅     | ✅      |
| Community | ✅        | ✅     | ✅     | ✅      |
| Publish   | ❌        | ❌     | ✅     | ✅      |
| Analysis  | ❌        | ❌     | ✅     | ✅      |
| Settings  | ❌        | ✅     | ✅     | ✅      |

## Test Categories

### 1. Navigation Tests
- Verify menu items are visible/hidden based on user role
- Test menu item highlighting for active routes
- Verify clicking menu items navigates to correct pages
- Test mobile menu functionality
- Test breadcrumb navigation where applicable
- Test back/forward browser navigation

### 2. Access Control Tests
- Verify anonymous users cannot access restricted pages
- Verify readers cannot access writer/manager-only pages
- Verify writers can access all writer features
- Verify managers have full access
- Test redirect behavior for unauthorized access
- Test session expiration handling

### 3. Content Tests
- Verify page loads without errors
- Test data displays correctly
- Verify empty states show appropriately
- Test loading states and skeletons
- Verify error states display properly
- Test content pagination/infinite scroll

### 4. Functionality Tests
- Test core functionality of each page
- Verify user interactions (buttons, forms, etc.)
- Test CRUD operations where applicable
- Verify form validation
- Test search and filter functionality
- Test sorting and ordering

### 5. Performance Tests
- Measure page load times
- Test response times for API calls
- Verify smooth navigation between pages
- Test rendering performance with large datasets
- Verify image lazy loading
- Test caching behavior

### 6. Error Handling Tests
- Test behavior when data fails to load
- Verify error messages display correctly
- Test network error scenarios
- Test API error responses
- Verify error recovery mechanisms
- Test error boundaries catch React errors

---

## Detailed Test Cases

### Home Page (/)

**Note**: Home page automatically redirects to `/novels` - all tests focus on redirect behavior.

#### Redirect Tests
- **TC-HOME-REDIRECT-001**: Anonymous users redirected from `/` to `/novels`
- **TC-HOME-REDIRECT-002**: Authenticated users redirected from `/` to `/novels`
- **TC-HOME-REDIRECT-003**: Redirect uses proper HTTP status code (307 temporary redirect)
- **TC-HOME-REDIRECT-004**: Redirect preserves query parameters if present

#### Performance Tests
- **TC-HOME-PERF-001**: Redirect completes in under 100ms
- **TC-HOME-PERF-002**: No JavaScript errors during redirect

---

### Studio Page (/studio)

#### Navigation Tests
- **TC-STUDIO-NAV-001**: Studio menu item highlighted when active
- **TC-STUDIO-NAV-002**: Clicking Studio navigates correctly
- **TC-STUDIO-NAV-003**: Back navigation returns to previous page
- **TC-STUDIO-NAV-004**: Story card click navigates to editor
- **TC-STUDIO-NAV-005**: Breadcrumbs show correct hierarchy

#### Access Control Tests
- **TC-STUDIO-AUTH-001**: Anonymous users redirected to sign in
- **TC-STUDIO-AUTH-002**: Reader role users see access denied
- **TC-STUDIO-AUTH-003**: Writer role users can access page
- **TC-STUDIO-AUTH-004**: Manager role users can access page
- **TC-STUDIO-AUTH-005**: Menu item hidden for unauthorized users
- **TC-STUDIO-AUTH-006**: Direct URL access blocked for unauthorized users

#### Content Tests
- **TC-STUDIO-CONTENT-001**: Story list displays user's stories
- **TC-STUDIO-CONTENT-002**: "Create New Story" button visible
- **TC-STUDIO-CONTENT-003**: Story cards show correct information
- **TC-STUDIO-CONTENT-004**: Empty state shows when no stories
- **TC-STUDIO-CONTENT-005**: Story metadata (word count, status) displays correctly
- **TC-STUDIO-CONTENT-006**: Story thumbnails load properly

#### Functionality Tests
- **TC-STUDIO-FUNC-001**: Create new story button opens creation flow
- **TC-STUDIO-FUNC-002**: Story card click navigates to editor
- **TC-STUDIO-FUNC-003**: Story deletion confirmation works
- **TC-STUDIO-FUNC-004**: Story status updates correctly
- **TC-STUDIO-FUNC-005**: View toggle (card/table) works correctly
- **TC-STUDIO-FUNC-006**: Story search/filter functions properly
- **TC-STUDIO-FUNC-007**: Story sorting options work
- **TC-STUDIO-FUNC-008**: Bulk actions on multiple stories work

#### Performance Tests
- **TC-STUDIO-PERF-001**: Page loads in under 2 seconds
- **TC-STUDIO-PERF-002**: Story list renders smoothly with 50+ stories
- **TC-STUDIO-PERF-003**: Search/filter operations are responsive
- **TC-STUDIO-PERF-004**: Story thumbnails lazy load efficiently

#### Error Handling Tests
- **TC-STUDIO-ERROR-001**: Story fetch failure shows error message
- **TC-STUDIO-ERROR-002**: Story deletion failure shows error and doesn't remove from UI
- **TC-STUDIO-ERROR-003**: Network errors don't crash the page
- **TC-STUDIO-ERROR-004**: Invalid story ID shows appropriate error

---

### Studio Agent (/studio - AI Writing Assistant)

#### Navigation Tests
- **TC-AGENT-NAV-001**: Agent chat interface accessible from Studio
- **TC-AGENT-NAV-002**: Agent button/icon visible in story editor
- **TC-AGENT-NAV-003**: Agent panel toggles open/close
- **TC-AGENT-NAV-004**: Agent chat history persists during navigation
- **TC-AGENT-NAV-005**: Back navigation from agent doesn't lose chat context

#### Access Control Tests
- **TC-AGENT-AUTH-001**: Anonymous users cannot access agent
- **TC-AGENT-AUTH-002**: Reader role users cannot access agent
- **TC-AGENT-AUTH-003**: Writer role users can access agent
- **TC-AGENT-AUTH-004**: Manager role users can access agent
- **TC-AGENT-AUTH-005**: Agent button hidden for unauthorized users
- **TC-AGENT-AUTH-006**: API key authentication works for agent API

#### Content Tests
- **TC-AGENT-CONTENT-001**: Chat interface displays correctly
- **TC-AGENT-CONTENT-002**: Message bubbles show sender (user/agent)
- **TC-AGENT-CONTENT-003**: Streaming messages display progressively
- **TC-AGENT-CONTENT-004**: Empty state shows welcome message
- **TC-AGENT-CONTENT-005**: Chat history loads correctly
- **TC-AGENT-CONTENT-006**: Markdown formatting renders in messages
- **TC-AGENT-CONTENT-007**: Code blocks display with syntax highlighting
- **TC-AGENT-CONTENT-008**: Story context displays in chat

#### Functionality Tests
- **TC-AGENT-FUNC-001**: Send message to agent works
- **TC-AGENT-FUNC-002**: Agent responds to user messages
- **TC-AGENT-FUNC-003**: Message streaming works (SSE)
- **TC-AGENT-FUNC-004**: Multi-turn conversations maintain context
- **TC-AGENT-FUNC-005**: Agent can suggest scene improvements
- **TC-AGENT-FUNC-006**: Agent can suggest character development
- **TC-AGENT-FUNC-007**: Agent can suggest plot ideas
- **TC-AGENT-FUNC-008**: Clear chat history works
- **TC-AGENT-FUNC-009**: Copy message to clipboard works
- **TC-AGENT-FUNC-010**: Regenerate agent response works
- **TC-AGENT-FUNC-011**: Stop generation works
- **TC-AGENT-FUNC-012**: Insert agent suggestion into editor works

#### Performance Tests
- **TC-AGENT-PERF-001**: Agent panel opens in under 500ms
- **TC-AGENT-PERF-002**: Message send responds within 1 second
- **TC-AGENT-PERF-003**: Streaming tokens appear smoothly (<100ms latency)
- **TC-AGENT-PERF-004**: Chat history loads in under 1 second
- **TC-AGENT-PERF-005**: Agent responds to simple queries in under 3 seconds
- **TC-AGENT-PERF-006**: Context-aware queries complete in under 5 seconds

#### Error Handling Tests
- **TC-AGENT-ERROR-001**: API failure shows error message
- **TC-AGENT-ERROR-002**: Network timeout shows retry option
- **TC-AGENT-ERROR-003**: Invalid input shows validation error
- **TC-AGENT-ERROR-004**: Rate limit shows appropriate message
- **TC-AGENT-ERROR-005**: Streaming interruption handles gracefully
- **TC-AGENT-ERROR-006**: Context loading failure doesn't crash chat

---

### Novels Page (/novels)

#### Navigation Tests
- **TC-NOVELS-NAV-001**: Novels menu item highlighted when active
- **TC-NOVELS-NAV-002**: Story card click opens reader
- **TC-NOVELS-NAV-003**: Scene navigation works correctly (prev/next scene)
- **TC-NOVELS-NAV-004**: Bottom navigation bar persists while reading
- **TC-NOVELS-NAV-005**: Scene list sidebar navigation works

#### Access Control Tests
- **TC-NOVELS-AUTH-001**: Anonymous users can access page
- **TC-NOVELS-AUTH-002**: All authenticated users can access page
- **TC-NOVELS-AUTH-003**: Menu item visible to all users
- **TC-NOVELS-AUTH-004**: Reading progress tracked for authenticated users only

#### Content Tests
- **TC-NOVELS-CONTENT-001**: Published stories display correctly
- **TC-NOVELS-CONTENT-002**: Story cards show title, genre, rating
- **TC-NOVELS-CONTENT-003**: Story cover images display
- **TC-NOVELS-CONTENT-004**: Story metadata (author, date) shows
- **TC-NOVELS-CONTENT-005**: Scene list displays correctly in sidebar
- **TC-NOVELS-CONTENT-006**: Scene content renders with proper formatting
- **TC-NOVELS-CONTENT-007**: Scene images display with optimized variants

#### Functionality Tests
- **TC-NOVELS-FUNC-001**: Story rating system works
- **TC-NOVELS-FUNC-002**: Reading history tracked for auth users
- **TC-NOVELS-FUNC-003**: Scene list shows all scenes for story
- **TC-NOVELS-FUNC-004**: Comments section functional
- **TC-NOVELS-FUNC-005**: Reading progress saves correctly

#### Performance Tests
- **TC-NOVELS-PERF-001**: Story grid loads in under 2 seconds
- **TC-NOVELS-PERF-002**: Pagination works smoothly
- **TC-NOVELS-PERF-003**: Images lazy load correctly
- **TC-NOVELS-PERF-004**: Scene switching is instantaneous
- **TC-NOVELS-PERF-005**: Scroll performance is smooth

#### Caching Performance Tests
- **TC-NOVELS-CACHE-001**: SWR caching returns cached data on repeat requests
- **TC-NOVELS-CACHE-002**: localStorage persists story data across page reloads
- **TC-NOVELS-CACHE-003**: ETag validation returns 304 for unchanged content
- **TC-NOVELS-CACHE-004**: Redis cache serves story data within 50ms
- **TC-NOVELS-CACHE-005**: Cache invalidation clears stale data correctly
- **TC-NOVELS-CACHE-006**: Cache miss falls back to database correctly

#### Error Handling Tests
- **TC-NOVELS-ERROR-001**: Story fetch failure shows error
- **TC-NOVELS-ERROR-002**: Missing scene shows appropriate message
- **TC-NOVELS-ERROR-003**: Image loading errors show fallback
- **TC-NOVELS-ERROR-004**: Comments fetch failure doesn't break page

---

### Comics Page (/comics)

#### Navigation Tests
- **TC-COMICS-NAV-001**: Comics menu item highlighted when active
- **TC-COMICS-NAV-002**: Genre filter navigation works
- **TC-COMICS-NAV-003**: Comic card click opens reader
- **TC-COMICS-NAV-004**: Panel navigation works correctly
- **TC-COMICS-NAV-005**: Bottom navigation bar persists while reading

#### Access Control Tests
- **TC-COMICS-AUTH-001**: Anonymous users can access page
- **TC-COMICS-AUTH-002**: All authenticated users can access page
- **TC-COMICS-AUTH-003**: Menu item visible to all users
- **TC-COMICS-AUTH-004**: Reading progress tracked for authenticated users only

#### Content Tests
- **TC-COMICS-CONTENT-001**: Published comics display correctly
- **TC-COMICS-CONTENT-002**: Comic cards show title, genre, rating
- **TC-COMICS-CONTENT-003**: Comic cover images display
- **TC-COMICS-CONTENT-004**: Empty state for no comics
- **TC-COMICS-CONTENT-005**: Genre filters work correctly
- **TC-COMICS-CONTENT-006**: Panel images load in correct order
- **TC-COMICS-CONTENT-007**: Scene descriptions render correctly
- **TC-COMICS-CONTENT-008**: Comic layout (panels + text) displays properly

#### Functionality Tests
- **TC-COMICS-FUNC-001**: Comic rating system works
- **TC-COMICS-FUNC-002**: Reading history tracked for auth users
- **TC-COMICS-FUNC-003**: Panel navigation (prev/next) works
- **TC-COMICS-FUNC-004**: Comments section functional
- **TC-COMICS-FUNC-005**: Reading progress saves correctly

#### Performance Tests
- **TC-COMICS-PERF-001**: Comic grid loads in under 2 seconds
- **TC-COMICS-PERF-002**: Pagination works smoothly
- **TC-COMICS-PERF-003**: Panel images preload correctly
- **TC-COMICS-PERF-004**: Panel switching is instantaneous
- **TC-COMICS-PERF-005**: Image optimization variants load correctly

#### Caching Performance Tests
- **TC-COMICS-CACHE-001**: SWR caching returns cached data on repeat requests
- **TC-COMICS-CACHE-002**: localStorage persists comic data across page reloads
- **TC-COMICS-CACHE-003**: ETag validation returns 304 for unchanged content
- **TC-COMICS-CACHE-004**: Redis cache serves comic data within 50ms
- **TC-COMICS-CACHE-005**: Cache invalidation clears stale data correctly
- **TC-COMICS-CACHE-006**: Cache miss falls back to database correctly

#### Error Handling Tests
- **TC-COMICS-ERROR-001**: Comic fetch failure shows error
- **TC-COMICS-ERROR-002**: Missing panel shows appropriate message
- **TC-COMICS-ERROR-003**: Image loading errors show fallback
- **TC-COMICS-ERROR-004**: Comments fetch failure doesn't break page

---

### Community Page (/community)

#### Navigation Tests
- **TC-COMMUNITY-NAV-001**: Community menu item highlighted when active
- **TC-COMMUNITY-NAV-002**: Post categories navigation works
- **TC-COMMUNITY-NAV-003**: Individual post navigation works
- **TC-COMMUNITY-NAV-004**: Back to community list works
- **TC-COMMUNITY-NAV-005**: User profile navigation from posts works

#### Access Control Tests
- **TC-COMMUNITY-AUTH-001**: Anonymous users can view posts
- **TC-COMMUNITY-AUTH-002**: Creating posts requires authentication
- **TC-COMMUNITY-AUTH-003**: Menu item visible to all users
- **TC-COMMUNITY-AUTH-004**: Editing posts restricted to author/admin
- **TC-COMMUNITY-AUTH-005**: Deleting posts restricted to author/admin

#### Content Tests
- **TC-COMMUNITY-CONTENT-001**: Community posts display correctly
- **TC-COMMUNITY-CONTENT-002**: Post cards show author and timestamp
- **TC-COMMUNITY-CONTENT-003**: Empty state for no posts
- **TC-COMMUNITY-CONTENT-004**: Category filter works
- **TC-COMMUNITY-CONTENT-005**: Post content renders with formatting
- **TC-COMMUNITY-CONTENT-006**: Attached story links display correctly

#### Functionality Tests
- **TC-COMMUNITY-FUNC-001**: Create post button shows for auth users
- **TC-COMMUNITY-FUNC-002**: Post creation modal works
- **TC-COMMUNITY-FUNC-003**: Comments on posts functional
- **TC-COMMUNITY-FUNC-004**: Like/dislike system works
- **TC-COMMUNITY-FUNC-005**: Post editing/deletion for owner
- **TC-COMMUNITY-FUNC-006**: Search posts functionality works
- **TC-COMMUNITY-FUNC-007**: Reply to comments works
- **TC-COMMUNITY-FUNC-008**: Report post functionality works

#### Performance Tests
- **TC-COMMUNITY-PERF-001**: Page loads in under 2 seconds
- **TC-COMMUNITY-PERF-002**: Post list scrolling smooth
- **TC-COMMUNITY-PERF-003**: Comments load efficiently
- **TC-COMMUNITY-PERF-004**: Post creation is responsive

#### Error Handling Tests
- **TC-COMMUNITY-ERROR-001**: Post fetch failure shows error
- **TC-COMMUNITY-ERROR-002**: Comment submission failure shows error
- **TC-COMMUNITY-ERROR-003**: Like action failure shows error
- **TC-COMMUNITY-ERROR-004**: Post creation failure shows validation errors

---

### Publish Page (/publish)

#### Navigation Tests
- **TC-PUBLISH-NAV-001**: Publish menu item highlighted when active
- **TC-PUBLISH-NAV-002**: Story selection navigation works
- **TC-PUBLISH-NAV-003**: Preview navigation functional
- **TC-PUBLISH-NAV-004**: Back to story list works
- **TC-PUBLISH-NAV-005**: Breadcrumbs show correct hierarchy

#### Access Control Tests
- **TC-PUBLISH-AUTH-001**: Anonymous users redirected to sign in
- **TC-PUBLISH-AUTH-002**: Reader role users see access denied
- **TC-PUBLISH-AUTH-003**: Writer role users can access page
- **TC-PUBLISH-AUTH-004**: Manager role users can access page
- **TC-PUBLISH-AUTH-005**: Menu item hidden for unauthorized users
- **TC-PUBLISH-AUTH-006**: Only story owner can publish their stories

#### Content Tests
- **TC-PUBLISH-CONTENT-001**: Publishable stories list displays
- **TC-PUBLISH-CONTENT-002**: Story metadata shows correctly
- **TC-PUBLISH-CONTENT-003**: Publishing status indicators work
- **TC-PUBLISH-CONTENT-004**: Empty state for no publishable stories
- **TC-PUBLISH-CONTENT-005**: Preview shows actual published appearance
- **TC-PUBLISH-CONTENT-006**: Publishing checklist displays

#### Functionality Tests
- **TC-PUBLISH-FUNC-001**: Story selection for publishing works
- **TC-PUBLISH-FUNC-002**: Publish workflow completes successfully
- **TC-PUBLISH-FUNC-003**: Preview before publish works
- **TC-PUBLISH-FUNC-004**: Unpublish functionality works
- **TC-PUBLISH-FUNC-005**: Publishing settings save correctly
- **TC-PUBLISH-FUNC-006**: Schedule publish functionality works
- **TC-PUBLISH-FUNC-007**: Publish to specific categories works
- **TC-PUBLISH-FUNC-008**: Validation prevents publishing incomplete stories

#### Performance Tests
- **TC-PUBLISH-PERF-001**: Page loads in under 2 seconds
- **TC-PUBLISH-PERF-002**: Publishing action completes in under 5 seconds
- **TC-PUBLISH-PERF-003**: Preview generation is fast
- **TC-PUBLISH-PERF-004**: Status updates are real-time

#### Error Handling Tests
- **TC-PUBLISH-ERROR-001**: Publish failure shows clear error message
- **TC-PUBLISH-ERROR-002**: Incomplete story validation shows helpful errors
- **TC-PUBLISH-ERROR-003**: Network error during publish shows retry option
- **TC-PUBLISH-ERROR-004**: Concurrent publish attempts handled correctly

---

### Analysis Page (/analysis)

#### Navigation Tests
- **TC-ANALYSIS-NAV-001**: Analysis menu item highlighted when active
- **TC-ANALYSIS-NAV-002**: Story filter navigation works
- **TC-ANALYSIS-NAV-003**: Date range navigation functional
- **TC-ANALYSIS-NAV-004**: Chart detail views navigate correctly
- **TC-ANALYSIS-NAV-005**: Export options accessible

#### Access Control Tests
- **TC-ANALYSIS-AUTH-001**: Anonymous users redirected to sign in
- **TC-ANALYSIS-AUTH-002**: Reader role users see access denied
- **TC-ANALYSIS-AUTH-003**: Writer role users can access page
- **TC-ANALYSIS-AUTH-004**: Manager role users can access page
- **TC-ANALYSIS-AUTH-005**: Menu item hidden for unauthorized users
- **TC-ANALYSIS-AUTH-006**: Users only see analysis data for their own stories

#### Content Tests
- **TC-ANALYSIS-CONTENT-001**: Analysis dashboard displays
- **TC-ANALYSIS-CONTENT-002**: Reader metrics show correctly
- **TC-ANALYSIS-CONTENT-003**: Engagement charts render
- **TC-ANALYSIS-CONTENT-004**: Empty state for no data
- **TC-ANALYSIS-CONTENT-005**: Summary statistics cards display
- **TC-ANALYSIS-CONTENT-006**: Time-series graphs show correct data

#### Functionality Tests
- **TC-ANALYSIS-FUNC-001**: Story selection filter works
- **TC-ANALYSIS-FUNC-002**: Date range selection works
- **TC-ANALYSIS-FUNC-003**: Export analysis data works
- **TC-ANALYSIS-FUNC-004**: Charts update with filters
- **TC-ANALYSIS-FUNC-005**: Drill-down into specific metrics works
- **TC-ANALYSIS-FUNC-006**: Comparison between stories works
- **TC-ANALYSIS-FUNC-007**: Real-time data updates work
- **TC-ANALYSIS-FUNC-008**: Metric tooltips show detailed info

#### Performance Tests
- **TC-ANALYSIS-PERF-001**: Page loads in under 3 seconds
- **TC-ANALYSIS-PERF-002**: Charts render in under 1 second
- **TC-ANALYSIS-PERF-003**: Data refresh works smoothly
- **TC-ANALYSIS-PERF-004**: Large dataset rendering is optimized

#### Error Handling Tests
- **TC-ANALYSIS-ERROR-001**: Data fetch failure shows error
- **TC-ANALYSIS-ERROR-002**: Chart rendering error shows fallback
- **TC-ANALYSIS-ERROR-003**: Export failure shows error message
- **TC-ANALYSIS-ERROR-004**: Invalid date range shows validation error

---

### Settings Page (/settings)

#### Navigation Tests
- **TC-SETTINGS-NAV-001**: Settings menu item highlighted when active
- **TC-SETTINGS-NAV-002**: Settings tabs navigation works
- **TC-SETTINGS-NAV-003**: Back navigation preserves state
- **TC-SETTINGS-NAV-004**: Deep links to specific settings tabs work
- **TC-SETTINGS-NAV-005**: Mobile settings menu navigation works

#### Access Control Tests
- **TC-SETTINGS-AUTH-001**: Anonymous users redirected to sign in
- **TC-SETTINGS-AUTH-002**: All authenticated users can access
- **TC-SETTINGS-AUTH-003**: Menu item visible to authenticated users
- **TC-SETTINGS-AUTH-004**: Users can only modify their own settings
- **TC-SETTINGS-AUTH-005**: Admin settings visible only to managers

#### Content Tests
- **TC-SETTINGS-CONTENT-001**: Profile settings display
- **TC-SETTINGS-CONTENT-002**: Account settings display
- **TC-SETTINGS-CONTENT-003**: Preferences display correctly
- **TC-SETTINGS-CONTENT-004**: Current user info shows
- **TC-SETTINGS-CONTENT-005**: Privacy settings display
- **TC-SETTINGS-CONTENT-006**: Notification preferences show

#### Functionality Tests
- **TC-SETTINGS-FUNC-001**: Profile update saves correctly
- **TC-SETTINGS-FUNC-002**: Password change works
- **TC-SETTINGS-FUNC-003**: Theme toggle works
- **TC-SETTINGS-FUNC-004**: Notification preferences save
- **TC-SETTINGS-FUNC-005**: Account deletion confirmation works
- **TC-SETTINGS-FUNC-006**: Email preferences update correctly
- **TC-SETTINGS-FUNC-007**: Privacy settings update correctly
- **TC-SETTINGS-FUNC-008**: Avatar upload works

#### Performance Tests
- **TC-SETTINGS-PERF-001**: Page loads in under 2 seconds
- **TC-SETTINGS-PERF-002**: Settings save in under 1 second
- **TC-SETTINGS-PERF-003**: Tab switching is instantaneous
- **TC-SETTINGS-PERF-004**: Avatar upload is efficient

#### Error Handling Tests
- **TC-SETTINGS-ERROR-001**: Save failure shows error message
- **TC-SETTINGS-ERROR-002**: Invalid input shows validation errors
- **TC-SETTINGS-ERROR-003**: Password change with wrong password shows error
- **TC-SETTINGS-ERROR-004**: Network error shows retry option

---

## API Test Cases

### Authentication API

#### Login Endpoint (POST /api/auth/login)
- **TC-API-AUTH-001**: Successful login with email/password returns token
- **TC-API-AUTH-002**: Login with invalid credentials returns 401
- **TC-API-AUTH-003**: Login with missing fields returns 400
- **TC-API-AUTH-004**: Login with inactive account returns 403
- **TC-API-AUTH-005**: Successful OAuth login creates session
- **TC-API-AUTH-006**: Rate limiting prevents brute force attempts
- **TC-API-AUTH-007**: CSRF token validation works
- **TC-API-AUTH-008**: Session cookie set with secure flags

#### Logout Endpoint (POST /api/auth/logout)
- **TC-API-AUTH-009**: Successful logout clears session
- **TC-API-AUTH-010**: Logout without session returns 401
- **TC-API-AUTH-011**: Logout invalidates all active sessions
- **TC-API-AUTH-012**: Session cookie cleared on logout

#### Session Validation (GET /api/auth/session)
- **TC-API-AUTH-013**: Valid session returns user data
- **TC-API-AUTH-014**: Expired session returns 401
- **TC-API-AUTH-015**: Invalid session token returns 401
- **TC-API-AUTH-016**: Session refresh works correctly

### Story API

#### Create Story (POST /studio/api/story)
- **TC-API-STORY-001**: Authenticated writer can create story
- **TC-API-STORY-002**: Anonymous user cannot create story (401)
- **TC-API-STORY-003**: Reader role cannot create story (403)
- **TC-API-STORY-004**: Missing required fields returns 400
- **TC-API-STORY-005**: Invalid data types return 400
- **TC-API-STORY-006**: Story created with correct default values
- **TC-API-STORY-007**: Duplicate story titles allowed
- **TC-API-STORY-008**: Story ID generated correctly

#### Get Story (GET /studio/api/story/:id)
- **TC-API-STORY-009**: Public story accessible to all
- **TC-API-STORY-010**: Draft story accessible only to author
- **TC-API-STORY-011**: Non-existent story returns 404
- **TC-API-STORY-012**: Invalid story ID format returns 400
- **TC-API-STORY-013**: Story includes all required fields
- **TC-API-STORY-014**: Story includes related data (chapters, characters)

#### Update Story (PUT /studio/api/story/:id)
- **TC-API-STORY-015**: Story owner can update story
- **TC-API-STORY-016**: Non-owner cannot update story (403)
- **TC-API-STORY-017**: Manager can update any story
- **TC-API-STORY-018**: Partial updates work correctly
- **TC-API-STORY-019**: Invalid updates return 400
- **TC-API-STORY-020**: Concurrent updates handled correctly
- **TC-API-STORY-021**: Status transitions validated correctly

#### Delete Story (DELETE /studio/api/story/:id)
- **TC-API-STORY-022**: Story owner can delete story
- **TC-API-STORY-023**: Non-owner cannot delete story (403)
- **TC-API-STORY-024**: Manager can delete any story
- **TC-API-STORY-025**: Deleted story returns 404 on subsequent requests
- **TC-API-STORY-026**: Cascade deletion removes related data
- **TC-API-STORY-027**: Blob images deleted correctly
- **TC-API-STORY-028**: Soft delete preserves data in archive

#### List Stories (GET /studio/api/story)
- **TC-API-STORY-029**: Returns paginated list of stories
- **TC-API-STORY-030**: Filters by status work correctly
- **TC-API-STORY-031**: Filters by genre work correctly
- **TC-API-STORY-032**: Search by title works
- **TC-API-STORY-033**: Sorting options work correctly
- **TC-API-STORY-034**: User-specific filtering works
- **TC-API-STORY-035**: Pagination parameters respected

### Generation API

#### Generate Story (POST /studio/api/novels)
- **TC-API-GEN-001**: Authenticated writer can generate story
- **TC-API-GEN-002**: Invalid input parameters return 400
- **TC-API-GEN-003**: SSE streaming returns events correctly
- **TC-API-GEN-004**: Generation progress updates work
- **TC-API-GEN-005**: Generation completes with all phases
- **TC-API-GEN-006**: Generation errors handled gracefully
- **TC-API-GEN-007**: Concurrent generation requests handled
- **TC-API-GEN-008**: Generation timeout handled correctly

#### Generate Characters (POST /studio/api/novels/characters)
- **TC-API-GEN-009**: Character generation works correctly
- **TC-API-GEN-010**: Character portraits generated
- **TC-API-GEN-011**: Character traits follow constraints
- **TC-API-GEN-012**: Multiple characters generated correctly

#### Generate Settings (POST /studio/api/novels/settings)
- **TC-API-GEN-013**: Setting generation works correctly
- **TC-API-GEN-014**: Setting images generated
- **TC-API-GEN-015**: Setting descriptions detailed

#### Generate Scene Content (POST /studio/api/novels/scene-content)
- **TC-API-GEN-016**: Scene generation works correctly
- **TC-API-GEN-017**: Scene images generated
- **TC-API-GEN-018**: Scene content follows story arc
- **TC-API-GEN-019**: Scene evaluation scores returned

#### Generate Images (POST /studio/api/novels/images)
- **TC-API-GEN-020**: Image generation works with valid prompt
- **TC-API-GEN-021**: Image optimization creates 4 variants
- **TC-API-GEN-022**: Images uploaded to Blob storage
- **TC-API-GEN-023**: Image URLs returned correctly
- **TC-API-GEN-024**: Invalid prompts return 400
- **TC-API-GEN-025**: Image generation timeout handled

### Community API

#### Create Post (POST /community/api/posts)
- **TC-API-COMM-001**: Authenticated user can create post
- **TC-API-COMM-002**: Anonymous user cannot create post (401)
- **TC-API-COMM-003**: Post validation works correctly
- **TC-API-COMM-004**: Post attached to story correctly
- **TC-API-COMM-005**: Post created with correct metadata

#### Get Posts (GET /community/api/posts)
- **TC-API-COMM-006**: Returns paginated posts
- **TC-API-COMM-007**: Filter by category works
- **TC-API-COMM-008**: Filter by story works
- **TC-API-COMM-009**: Search posts works
- **TC-API-COMM-010**: Sorting options work

#### Update Post (PUT /community/api/posts/:id)
- **TC-API-COMM-011**: Post owner can update post
- **TC-API-COMM-012**: Non-owner cannot update post (403)
- **TC-API-COMM-013**: Manager can update any post
- **TC-API-COMM-014**: Post validation on update works

#### Delete Post (DELETE /community/api/posts/:id)
- **TC-API-COMM-015**: Post owner can delete post
- **TC-API-COMM-016**: Non-owner cannot delete post (403)
- **TC-API-COMM-017**: Manager can delete any post
- **TC-API-COMM-018**: Comments deleted with post

#### Like/Unlike Post (POST /community/api/posts/:id/like)
- **TC-API-COMM-019**: Authenticated user can like post
- **TC-API-COMM-020**: Anonymous user cannot like (401)
- **TC-API-COMM-021**: Like count increments correctly
- **TC-API-COMM-022**: Unlike removes like correctly
- **TC-API-COMM-023**: Cannot like post multiple times

### Analysis API

#### Get Story Analysis (GET /analysis/api/stories/:id)
- **TC-API-ANALYSIS-001**: Story owner can view analysis
- **TC-API-ANALYSIS-002**: Non-owner cannot view analysis (403)
- **TC-API-ANALYSIS-003**: Manager can view all analysis
- **TC-API-ANALYSIS-004**: Analysis data correct format
- **TC-API-ANALYSIS-005**: Date range filtering works
- **TC-API-ANALYSIS-006**: Metrics calculated correctly

#### Get User Analysis (GET /analysis/api/stats)
- **TC-API-ANALYSIS-007**: User can view own analysis
- **TC-API-ANALYSIS-008**: User cannot view other's analysis (403)
- **TC-API-ANALYSIS-009**: Manager can view all user analysis
- **TC-API-ANALYSIS-010**: Aggregated stats correct

#### Record Reading Event (POST /analysis/api/track)
- **TC-API-ANALYSIS-011**: Reading event recorded correctly
- **TC-API-ANALYSIS-012**: Anonymous events tracked
- **TC-API-ANALYSIS-013**: Event validation works
- **TC-API-ANALYSIS-014**: Rate limiting prevents spam

### Publish API

#### Publish Scene (POST /publish/api/scenes/:id)
- **TC-API-PUBLISH-001**: Story owner can publish scene
- **TC-API-PUBLISH-002**: Non-owner cannot publish scene (403)
- **TC-API-PUBLISH-003**: Incomplete scene cannot be published
- **TC-API-PUBLISH-004**: Published scene status updated
- **TC-API-PUBLISH-005**: Published scene visible in community

#### Unpublish Scene (POST /publish/api/scenes/:id/unpublish)
- **TC-API-PUBLISH-006**: Story owner can unpublish scene
- **TC-API-PUBLISH-007**: Non-owner cannot unpublish (403)
- **TC-API-PUBLISH-008**: Unpublished scene hidden from community
- **TC-API-PUBLISH-009**: Unpublished scene status updated

#### Create Publishing Schedule (POST /publish/api/schedules)
- **TC-API-PUBLISH-010**: Story can be scheduled for weekly publish
- **TC-API-PUBLISH-011**: Scheduled publish date validated
- **TC-API-PUBLISH-012**: Scenes published at correct time via cron
- **TC-API-PUBLISH-013**: Schedule can be updated/cancelled

### Image API

#### Upload Image (POST /api/images/upload)
- **TC-API-IMAGE-001**: Image upload works with valid file
- **TC-API-IMAGE-002**: Image size validation works
- **TC-API-IMAGE-003**: Image type validation works
- **TC-API-IMAGE-004**: Image uploaded to Blob storage
- **TC-API-IMAGE-005**: Image URL returned correctly

#### Get Image (GET /api/images/:id)
- **TC-API-IMAGE-006**: Image accessible via URL
- **TC-API-IMAGE-007**: Image variants accessible
- **TC-API-IMAGE-008**: Image not found returns 404

#### Delete Image (DELETE /api/images/:id)
- **TC-API-IMAGE-009**: Image owner can delete image
- **TC-API-IMAGE-010**: Non-owner cannot delete image (403)
- **TC-API-IMAGE-011**: Image deleted from Blob storage
- **TC-API-IMAGE-012**: All variants deleted

### User API

#### Get User Profile (GET /api/users/:id)
- **TC-API-USER-001**: Public profile accessible to all
- **TC-API-USER-002**: Private profile accessible only to owner
- **TC-API-USER-003**: Non-existent user returns 404
- **TC-API-USER-004**: User data includes public fields only

#### Update User Profile (PUT /api/users/:id)
- **TC-API-USER-005**: User can update own profile
- **TC-API-USER-006**: User cannot update other's profile (403)
- **TC-API-USER-007**: Profile validation works
- **TC-API-USER-008**: Avatar update works

#### Get User Stories (GET /api/users/:id/stories)
- **TC-API-USER-009**: Returns user's published stories
- **TC-API-USER-010**: Draft stories not returned for other users
- **TC-API-USER-011**: Pagination works correctly

---

## Cross-Cutting Tests

### Mobile Responsiveness
- **TC-MOBILE-001**: All pages render correctly on mobile (320px-768px)
- **TC-MOBILE-002**: Mobile menu functions properly
- **TC-MOBILE-003**: Touch interactions work correctly
- **TC-MOBILE-004**: Content is readable on small screens
- **TC-MOBILE-005**: Navigation gestures work (swipe, pinch-zoom)
- **TC-MOBILE-006**: Mobile keyboard doesn't break layout
- **TC-MOBILE-007**: Bottom navigation accessible on mobile
- **TC-MOBILE-008**: Modal dialogs work on mobile

### Theme Support
- **TC-THEME-001**: All pages support dark mode
- **TC-THEME-002**: Theme toggle persists across sessions
- **TC-THEME-003**: No visual glitches on theme switch
- **TC-THEME-004**: Color contrast meets WCAG standards in both themes
- **TC-THEME-005**: Images/icons adapt to theme
- **TC-THEME-006**: System theme preference detected

### Error Handling
- **TC-ERROR-001**: Network errors display user-friendly messages
- **TC-ERROR-002**: 404 pages show correct content
- **TC-ERROR-003**: API errors don't crash the application
- **TC-ERROR-004**: Error boundaries catch React errors
- **TC-ERROR-005**: Error pages have navigation back to app
- **TC-ERROR-006**: Error messages are actionable
- **TC-ERROR-007**: Retry mechanisms work for transient errors

### Accessibility
- **TC-A11Y-001**: All pages are keyboard navigable
- **TC-A11Y-002**: Screen reader compatible
- **TC-A11Y-003**: ARIA labels present where needed
- **TC-A11Y-004**: Color contrast meets WCAG standards
- **TC-A11Y-005**: Focus indicators visible
- **TC-A11Y-006**: Skip links work correctly
- **TC-A11Y-007**: Forms have proper labels
- **TC-A11Y-008**: Images have alt text

### Security
- **TC-SECURITY-001**: XSS prevention works
- **TC-SECURITY-002**: CSRF tokens validated
- **TC-SECURITY-003**: SQL injection prevented
- **TC-SECURITY-004**: Sensitive data not exposed in responses
- **TC-SECURITY-005**: Authentication tokens secure
- **TC-SECURITY-006**: Rate limiting prevents abuse
- **TC-SECURITY-007**: Input sanitization works

### Performance
- **TC-PERF-001**: Core Web Vitals meet thresholds (LCP < 2.5s)
- **TC-PERF-002**: First Contentful Paint < 1.8s
- **TC-PERF-003**: Time to Interactive < 3.8s
- **TC-PERF-004**: Cumulative Layout Shift < 0.1
- **TC-PERF-005**: API response times < 500ms (p95)
- **TC-PERF-006**: Database queries optimized (N+1 prevented)
- **TC-PERF-007**: Caching strategies effective

### SEO
- **TC-SEO-001**: Meta tags present on all pages
- **TC-SEO-002**: Open Graph tags correct
- **TC-SEO-003**: Sitemap generated correctly
- **TC-SEO-004**: Robots.txt configured properly
- **TC-SEO-005**: Canonical URLs set correctly
- **TC-SEO-006**: Schema.org markup present

---

## Success Criteria

### Critical Path Tests
- ✅ 100% pass rate for all critical path tests
- ✅ Authentication flows work flawlessly
- ✅ Story creation and publishing complete end-to-end
- ✅ Reading experience smooth on all devices

### Performance Benchmarks
- ✅ Page load times under threshold (< 2-3 seconds)
- ✅ API response times < 500ms (p95)
- ✅ Core Web Vitals meet Google standards
- ✅ Lighthouse scores > 90 for all pages

### Access Control
- ✅ No unauthorized access to restricted pages
- ✅ All role-based permissions enforced
- ✅ API endpoints properly secured
- ✅ Session management robust

### User Experience
- ✅ Mobile experience fully functional
- ✅ No JavaScript errors on any page
- ✅ Error messages user-friendly and actionable
- ✅ Loading states smooth and informative

### Accessibility
- ✅ WCAG 2.1 Level AA compliance
- ✅ Keyboard navigation works everywhere
- ✅ Screen reader compatible
- ✅ Color contrast standards met

---

## Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-05 | Initial comprehensive test specification | Claude |
| 1.1 | 2025-11-05 | Updated to match actual implementation:<br>- Simplified Home page tests (redirect only)<br>- Changed Analytics → Analysis throughout<br>- Updated API endpoints to match implementation<br>- Verified schedule publish feature (implemented)<br>- Updated performance metrics for home redirect | Claude |
| 1.2 | 2025-11-05 | Major updates for alignment with current codebase:<br>- Added Studio Agent test suite (37 test cases)<br>- Removed unimplemented features (search, bookmark, zoom/pan)<br>- Updated all API paths to match actual implementation<br>- Verified API paths against current codebase structure | Claude |
| 2.0 | 2025-11-05 | Restructured into test-specification.md (this file):<br>- Extracted specification content (test cases, requirements, success criteria)<br>- Removed execution plans, automation details, and implementation guidance<br>- Companion document: test-development.md for execution and automation | Claude |
| 2.1 | 2025-11-19 | Added comprehensive Test Directory Structure section:<br>- Documented `tests/` (Playwright E2E) vs `__tests__/` (Jest unit) separation<br>- Added complete directory trees matching current codebase<br>- Added running commands for both frameworks<br>- Added key differences comparison table<br>- Added file naming conventions documentation | Claude |
| 2.2 | 2025-11-19 | Novels and Comics Page test cases updated:<br>- Novels: Removed duplicate genre filter tests, changed chapter → scene references, removed unimplemented features<br>- Added Caching Performance Tests for both Novels (TC-NOVELS-CACHE-001-006) and Comics (TC-COMICS-CACHE-001-006)<br>- Tests cover SWR, localStorage, ETag, Redis cache | Claude |

---

## Glossary

- **GNB:** Global Navigation Bar
- **SSE:** Server-Sent Events
- **API:** Application Programming Interface
- **CRUD:** Create, Read, Update, Delete
- **LCP:** Largest Contentful Paint
- **FCP:** First Contentful Paint
- **TTI:** Time to Interactive
- **CLS:** Cumulative Layout Shift
- **WCAG:** Web Content Accessibility Guidelines

---

**End of Test Specification**
