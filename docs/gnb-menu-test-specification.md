# GNB Menu Test Specification

## Overview

This document outlines comprehensive test cases for all Global Navigation Bar (GNB) menu items in the Fictures application. Each menu item requires thorough testing to ensure proper functionality, access control, and user experience.

## GNB Menu Structure

The application has 7 main navigation items:

1. **Home (/)** - Landing page, accessible to all users
2. **Writing (/writing)** - Story management dashboard, restricted to writers and managers
3. **Reading (/reading)** - Browse and read published stories, accessible to all users
4. **Community (/community)** - Community discussions and posts, accessible to all users
5. **Publish (/publish)** - Publishing workflow, restricted to writers and managers
6. **Analytics (/analytics)** - Story analytics and statistics, restricted to writers and managers
7. **Settings (/settings)** - User settings and preferences, requires authentication

## Access Control Matrix

| Menu Item  | Anonymous | Reader | Writer | Manager |
|-----------|-----------|--------|--------|---------|
| Home      | ✅        | ✅     | ✅     | ✅      |
| Writing   | ❌        | ❌     | ✅     | ✅      |
| Reading   | ✅        | ✅     | ✅     | ✅      |
| Community | ✅        | ✅     | ✅     | ✅      |
| Publish   | ❌        | ❌     | ✅     | ✅      |
| Analytics | ❌        | ❌     | ✅     | ✅      |
| Settings  | ❌        | ✅     | ✅     | ✅      |

## Test Categories

### 1. Navigation Tests
- Verify menu items are visible/hidden based on user role
- Test menu item highlighting for active routes
- Verify clicking menu items navigates to correct pages
- Test mobile menu functionality

### 2. Access Control Tests
- Verify anonymous users cannot access restricted pages
- Verify readers cannot access writer/manager-only pages
- Verify writers can access all writer features
- Verify managers have full access
- Test redirect behavior for unauthorized access

### 3. Page Functionality Tests
- Verify page loads without errors
- Test core functionality of each page
- Verify data displays correctly
- Test user interactions (buttons, forms, etc.)

### 4. Performance Tests
- Measure page load times
- Test response times for API calls
- Verify smooth navigation between pages

### 5. Error Handling Tests
- Test behavior when data fails to load
- Verify error messages display correctly
- Test network error scenarios

## Detailed Test Cases

### Home Page (/)

#### Navigation Tests
- [x] TC-HOME-NAV-001: Logo link navigates to home page
- [x] TC-HOME-NAV-002: Home page loads without authentication
- [x] TC-HOME-NAV-003: Logo is highlighted when on home page

#### Content Tests
- [x] TC-HOME-CONTENT-001: Page displays welcome message
- [x] TC-HOME-CONTENT-002: Featured stories section visible
- [x] TC-HOME-CONTENT-003: Call-to-action buttons functional
- [x] TC-HOME-CONTENT-004: Footer contains correct links

#### Performance Tests
- [x] TC-HOME-PERF-001: Page loads in under 2 seconds
- [x] TC-HOME-PERF-002: No JavaScript errors on load

---

### Writing Page (/writing)

#### Access Control Tests
- [x] TC-WRITING-AUTH-001: Anonymous users redirected to sign in
- [x] TC-WRITING-AUTH-002: Reader role users see access denied
- [x] TC-WRITING-AUTH-003: Writer role users can access page
- [x] TC-WRITING-AUTH-004: Manager role users can access page
- [x] TC-WRITING-AUTH-005: Menu item hidden for unauthorized users

#### Navigation Tests
- [x] TC-WRITING-NAV-001: Writing menu item highlighted when active
- [x] TC-WRITING-NAV-002: Clicking Writing navigates correctly
- [x] TC-WRITING-NAV-003: Back navigation returns to previous page

#### Content Tests
- [x] TC-WRITING-CONTENT-001: Story list displays user's stories
- [x] TC-WRITING-CONTENT-002: "Create New Story" button visible
- [x] TC-WRITING-CONTENT-003: Story cards show correct information
- [x] TC-WRITING-CONTENT-004: Empty state shows when no stories
- [x] TC-WRITING-CONTENT-005: View toggle (card/table) works correctly
- [x] TC-WRITING-CONTENT-006: Story search/filter functions properly

#### Functionality Tests
- [x] TC-WRITING-FUNC-001: Create new story button opens creation flow
- [x] TC-WRITING-FUNC-002: Story card click navigates to editor
- [x] TC-WRITING-FUNC-003: Story deletion confirmation works
- [x] TC-WRITING-FUNC-004: Story status updates correctly

#### Performance Tests
- [x] TC-WRITING-PERF-001: Page loads in under 2 seconds
- [x] TC-WRITING-PERF-002: Story list renders smoothly with 50+ stories

---

### Reading Page (/reading)

#### Access Control Tests
- [x] TC-READING-AUTH-001: Anonymous users can access page
- [x] TC-READING-AUTH-002: All authenticated users can access page
- [x] TC-READING-AUTH-003: Menu item visible to all users

#### Navigation Tests
- [x] TC-READING-NAV-001: Reading menu item highlighted when active
- [x] TC-READING-NAV-002: Genre filter navigation works
- [x] TC-READING-NAV-003: Story card click opens reader

#### Content Tests
- [x] TC-READING-CONTENT-001: Published stories display correctly
- [x] TC-READING-CONTENT-002: Story cards show title, genre, rating
- [x] TC-READING-CONTENT-003: Story cover images display
- [x] TC-READING-CONTENT-004: Empty state for no stories
- [x] TC-READING-CONTENT-005: Genre filters work correctly
- [x] TC-READING-CONTENT-006: Search functionality works

#### Functionality Tests
- [x] TC-READING-FUNC-001: Story rating system works
- [x] TC-READING-FUNC-002: Reading history tracked for auth users
- [x] TC-READING-FUNC-003: Story preview shows correct chapters
- [x] TC-READING-FUNC-004: Comments section functional

#### Performance Tests
- [x] TC-READING-PERF-001: Story grid loads in under 2 seconds
- [x] TC-READING-PERF-002: Pagination works smoothly
- [x] TC-READING-PERF-003: Images lazy load correctly

---

### Community Page (/community)

#### Access Control Tests
- [x] TC-COMMUNITY-AUTH-001: Anonymous users can view posts
- [x] TC-COMMUNITY-AUTH-002: Creating posts requires authentication
- [x] TC-COMMUNITY-AUTH-003: Menu item visible to all users

#### Navigation Tests
- [x] TC-COMMUNITY-NAV-001: Community menu item highlighted when active
- [x] TC-COMMUNITY-NAV-002: Post categories navigation works
- [x] TC-COMMUNITY-NAV-003: Individual post navigation works

#### Content Tests
- [x] TC-COMMUNITY-CONTENT-001: Community posts display correctly
- [x] TC-COMMUNITY-CONTENT-002: Post cards show author and timestamp
- [x] TC-COMMUNITY-CONTENT-003: Empty state for no posts
- [x] TC-COMMUNITY-CONTENT-004: Category filter works

#### Functionality Tests
- [x] TC-COMMUNITY-FUNC-001: Create post button shows for auth users
- [x] TC-COMMUNITY-FUNC-002: Post creation modal works
- [x] TC-COMMUNITY-FUNC-003: Comments on posts functional
- [x] TC-COMMUNITY-FUNC-004: Like/dislike system works
- [x] TC-COMMUNITY-FUNC-005: Post editing/deletion for owner

#### Performance Tests
- [x] TC-COMMUNITY-PERF-001: Page loads in under 2 seconds
- [x] TC-COMMUNITY-PERF-002: Post list scrolling smooth

---

### Publish Page (/publish)

#### Access Control Tests
- [x] TC-PUBLISH-AUTH-001: Anonymous users redirected to sign in
- [x] TC-PUBLISH-AUTH-002: Reader role users see access denied
- [x] TC-PUBLISH-AUTH-003: Writer role users can access page
- [x] TC-PUBLISH-AUTH-004: Manager role users can access page
- [x] TC-PUBLISH-AUTH-005: Menu item hidden for unauthorized users

#### Navigation Tests
- [x] TC-PUBLISH-NAV-001: Publish menu item highlighted when active
- [x] TC-PUBLISH-NAV-002: Story selection navigation works
- [x] TC-PUBLISH-NAV-003: Preview navigation functional

#### Content Tests
- [x] TC-PUBLISH-CONTENT-001: Publishable stories list displays
- [x] TC-PUBLISH-CONTENT-002: Story metadata shows correctly
- [x] TC-PUBLISH-CONTENT-003: Publishing status indicators work
- [x] TC-PUBLISH-CONTENT-004: Empty state for no publishable stories

#### Functionality Tests
- [x] TC-PUBLISH-FUNC-001: Story selection for publishing works
- [x] TC-PUBLISH-FUNC-002: Publish workflow completes successfully
- [x] TC-PUBLISH-FUNC-003: Preview before publish works
- [x] TC-PUBLISH-FUNC-004: Unpublish functionality works
- [x] TC-PUBLISH-FUNC-005: Publishing settings save correctly

#### Performance Tests
- [x] TC-PUBLISH-PERF-001: Page loads in under 2 seconds
- [x] TC-PUBLISH-PERF-002: Publishing action completes in under 5 seconds

---

### Analytics Page (/analytics)

#### Access Control Tests
- [x] TC-ANALYTICS-AUTH-001: Anonymous users redirected to sign in
- [x] TC-ANALYTICS-AUTH-002: Reader role users see access denied
- [x] TC-ANALYTICS-AUTH-003: Writer role users can access page
- [x] TC-ANALYTICS-AUTH-004: Manager role users can access page
- [x] TC-ANALYTICS-AUTH-005: Menu item hidden for unauthorized users

#### Navigation Tests
- [x] TC-ANALYTICS-NAV-001: Analytics menu item highlighted when active
- [x] TC-ANALYTICS-NAV-002: Story filter navigation works
- [x] TC-ANALYTICS-NAV-003: Date range navigation functional

#### Content Tests
- [x] TC-ANALYTICS-CONTENT-001: Analytics dashboard displays
- [x] TC-ANALYTICS-CONTENT-002: Reader metrics show correctly
- [x] TC-ANALYTICS-CONTENT-003: Engagement charts render
- [x] TC-ANALYTICS-CONTENT-004: Empty state for no data

#### Functionality Tests
- [x] TC-ANALYTICS-FUNC-001: Story selection filter works
- [x] TC-ANALYTICS-FUNC-002: Date range selection works
- [x] TC-ANALYTICS-FUNC-003: Export analytics data works
- [x] TC-ANALYTICS-FUNC-004: Charts update with filters

#### Performance Tests
- [x] TC-ANALYTICS-PERF-001: Page loads in under 3 seconds
- [x] TC-ANALYTICS-PERF-002: Charts render in under 1 second
- [x] TC-ANALYTICS-PERF-003: Data refresh works smoothly

---

### Settings Page (/settings)

#### Access Control Tests
- [x] TC-SETTINGS-AUTH-001: Anonymous users redirected to sign in
- [x] TC-SETTINGS-AUTH-002: All authenticated users can access
- [x] TC-SETTINGS-AUTH-003: Menu item visible to authenticated users

#### Navigation Tests
- [x] TC-SETTINGS-NAV-001: Settings menu item highlighted when active
- [x] TC-SETTINGS-NAV-002: Settings tabs navigation works
- [x] TC-SETTINGS-NAV-003: Back navigation preserves state

#### Content Tests
- [x] TC-SETTINGS-CONTENT-001: Profile settings display
- [x] TC-SETTINGS-CONTENT-002: Account settings display
- [x] TC-SETTINGS-CONTENT-003: Preferences display correctly
- [x] TC-SETTINGS-CONTENT-004: Current user info shows

#### Functionality Tests
- [x] TC-SETTINGS-FUNC-001: Profile update saves correctly
- [x] TC-SETTINGS-FUNC-002: Password change works
- [x] TC-SETTINGS-FUNC-003: Theme toggle works
- [x] TC-SETTINGS-FUNC-004: Notification preferences save
- [x] TC-SETTINGS-FUNC-005: Account deletion confirmation works

#### Performance Tests
- [x] TC-SETTINGS-PERF-001: Page loads in under 2 seconds
- [x] TC-SETTINGS-PERF-002: Settings save in under 1 second

---

## Cross-Cutting Tests

### Mobile Responsiveness
- [x] TC-MOBILE-001: All pages render correctly on mobile
- [x] TC-MOBILE-002: Mobile menu functions properly
- [x] TC-MOBILE-003: Touch interactions work correctly
- [x] TC-MOBILE-004: Content is readable on small screens

### Theme Support
- [x] TC-THEME-001: All pages support dark mode
- [x] TC-THEME-002: Theme toggle persists across sessions
- [x] TC-THEME-003: No visual glitches on theme switch

### Error Handling
- [x] TC-ERROR-001: Network errors display user-friendly messages
- [x] TC-ERROR-002: 404 pages show correct content
- [x] TC-ERROR-003: API errors don't crash the application
- [x] TC-ERROR-004: Error boundaries catch React errors

### Accessibility
- [x] TC-A11Y-001: All pages are keyboard navigable
- [x] TC-A11Y-002: Screen reader compatible
- [x] TC-A11Y-003: ARIA labels present where needed
- [x] TC-A11Y-004: Color contrast meets WCAG standards

## Test Execution Plan

### Phase 1: Smoke Tests
- Run basic navigation tests for all menu items
- Verify page loads without JavaScript errors
- Test authentication flows

### Phase 2: Functional Tests
- Execute all functionality tests per menu item
- Test CRUD operations where applicable
- Verify user interactions

### Phase 3: Integration Tests
- Test cross-page workflows
- Verify data consistency across pages
- Test session management

### Phase 4: Performance Tests
- Measure and optimize page load times
- Test with various data volumes
- Verify smooth animations and transitions

### Phase 5: Regression Tests
- Re-run all tests after changes
- Verify bug fixes don't break existing functionality
- Test edge cases

## Test Data Requirements

- **Test Users:**
  - Anonymous user (no authentication)
  - Reader role user (authenticated, no writing privileges)
  - Writer role user (authenticated, can write/publish)
  - Manager role user (authenticated, full privileges)

- **Test Content:**
  - Multiple test stories in various states (draft, published)
  - Test community posts and comments
  - Sample analytics data

## Success Criteria

- All critical path tests pass (100%)
- No JavaScript errors on any page
- Page load times under threshold
- All access control rules enforced
- Mobile experience fully functional
- Accessibility requirements met

## Test Automation Strategy

- Use Playwright for e2e tests
- Run tests in CI/CD pipeline
- Generate test reports with screenshots
- Maintain test data fixtures
- Use authentication state persistence (@playwright/.auth/user.json)

## Continuous Monitoring

- Set up monitoring for production
- Track real user metrics
- Alert on critical failures
- Regular test suite maintenance
