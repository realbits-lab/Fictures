# Comprehensive Test Specification

## Overview

This document outlines comprehensive test cases for the Fictures platform, including all Global Navigation Bar (GNB) menu items, API endpoints, and cross-cutting concerns. The specification ensures thorough testing of functionality, access control, performance, and user experience across the entire application.

### Recent Updates (v1.1 - 2025-11-05)

**Key Changes to Match Actual Implementation:**

1. **Home Page Tests**: Simplified from 26+ tests to 6 tests - home now only redirects to `/novels`
2. **Analytics → Analysis**: Route is `/analysis` not `/analytics` - updated all references throughout
3. **API Endpoints**: Corrected paths to match actual implementation:
   - Analysis API: `/analysis/api/*` (not `/api/analytics/*`)
   - Schedule publish: ✅ **Implemented** (verified via database + API routes)
4. **Performance Metrics**: Updated home page performance targets for redirect-only behavior

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

### Novels Page (/novels)

#### Navigation Tests
- **TC-NOVELS-NAV-001**: Novels menu item highlighted when active
- **TC-NOVELS-NAV-002**: Genre filter navigation works
- **TC-NOVELS-NAV-003**: Story card click opens reader
- **TC-NOVELS-NAV-004**: Chapter navigation works correctly
- **TC-NOVELS-NAV-005**: Bottom navigation bar persists while reading

#### Access Control Tests
- **TC-NOVELS-AUTH-001**: Anonymous users can access page
- **TC-NOVELS-AUTH-002**: All authenticated users can access page
- **TC-NOVELS-AUTH-003**: Menu item visible to all users
- **TC-NOVELS-AUTH-004**: Reading progress tracked for authenticated users only

#### Content Tests
- **TC-NOVELS-CONTENT-001**: Published stories display correctly
- **TC-NOVELS-CONTENT-002**: Story cards show title, genre, rating
- **TC-NOVELS-CONTENT-003**: Story cover images display
- **TC-NOVELS-CONTENT-004**: Empty state for no stories
- **TC-NOVELS-CONTENT-005**: Genre filters work correctly
- **TC-NOVELS-CONTENT-006**: Story metadata (author, date, word count) shows
- **TC-NOVELS-CONTENT-007**: Chapter list displays correctly
- **TC-NOVELS-CONTENT-008**: Scene content renders with proper formatting

#### Functionality Tests
- **TC-NOVELS-FUNC-001**: Story rating system works
- **TC-NOVELS-FUNC-002**: Reading history tracked for auth users
- **TC-NOVELS-FUNC-003**: Story preview shows correct chapters
- **TC-NOVELS-FUNC-004**: Comments section functional
- **TC-NOVELS-FUNC-005**: Search functionality works
- **TC-NOVELS-FUNC-006**: Bookmark functionality works
- **TC-NOVELS-FUNC-007**: Reading progress saves correctly
- **TC-NOVELS-FUNC-008**: Font size/theme controls work

#### Performance Tests
- **TC-NOVELS-PERF-001**: Story grid loads in under 2 seconds
- **TC-NOVELS-PERF-002**: Pagination works smoothly
- **TC-NOVELS-PERF-003**: Images lazy load correctly
- **TC-NOVELS-PERF-004**: Chapter switching is instantaneous
- **TC-NOVELS-PERF-005**: Scroll performance is smooth

#### Error Handling Tests
- **TC-NOVELS-ERROR-001**: Story fetch failure shows error
- **TC-NOVELS-ERROR-002**: Missing chapter shows appropriate message
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
- **TC-COMICS-FUNC-005**: Search functionality works
- **TC-COMICS-FUNC-006**: Bookmark functionality works
- **TC-COMICS-FUNC-007**: Reading progress saves correctly
- **TC-COMICS-FUNC-008**: Zoom/pan controls for panels work

#### Performance Tests
- **TC-COMICS-PERF-001**: Comic grid loads in under 2 seconds
- **TC-COMICS-PERF-002**: Pagination works smoothly
- **TC-COMICS-PERF-003**: Panel images preload correctly
- **TC-COMICS-PERF-004**: Panel switching is instantaneous
- **TC-COMICS-PERF-005**: Image optimization variants load correctly

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

#### Create Story (POST /api/stories)
- **TC-API-STORY-001**: Authenticated writer can create story
- **TC-API-STORY-002**: Anonymous user cannot create story (401)
- **TC-API-STORY-003**: Reader role cannot create story (403)
- **TC-API-STORY-004**: Missing required fields returns 400
- **TC-API-STORY-005**: Invalid data types return 400
- **TC-API-STORY-006**: Story created with correct default values
- **TC-API-STORY-007**: Duplicate story titles allowed
- **TC-API-STORY-008**: Story ID generated correctly

#### Get Story (GET /api/stories/:id)
- **TC-API-STORY-009**: Public story accessible to all
- **TC-API-STORY-010**: Draft story accessible only to author
- **TC-API-STORY-011**: Non-existent story returns 404
- **TC-API-STORY-012**: Invalid story ID format returns 400
- **TC-API-STORY-013**: Story includes all required fields
- **TC-API-STORY-014**: Story includes related data (chapters, characters)

#### Update Story (PUT /api/stories/:id)
- **TC-API-STORY-015**: Story owner can update story
- **TC-API-STORY-016**: Non-owner cannot update story (403)
- **TC-API-STORY-017**: Manager can update any story
- **TC-API-STORY-018**: Partial updates work correctly
- **TC-API-STORY-019**: Invalid updates return 400
- **TC-API-STORY-020**: Concurrent updates handled correctly
- **TC-API-STORY-021**: Status transitions validated correctly

#### Delete Story (DELETE /api/stories/:id)
- **TC-API-STORY-022**: Story owner can delete story
- **TC-API-STORY-023**: Non-owner cannot delete story (403)
- **TC-API-STORY-024**: Manager can delete any story
- **TC-API-STORY-025**: Deleted story returns 404 on subsequent requests
- **TC-API-STORY-026**: Cascade deletion removes related data
- **TC-API-STORY-027**: Blob images deleted correctly
- **TC-API-STORY-028**: Soft delete preserves data in archive

#### List Stories (GET /api/stories)
- **TC-API-STORY-029**: Returns paginated list of stories
- **TC-API-STORY-030**: Filters by status work correctly
- **TC-API-STORY-031**: Filters by genre work correctly
- **TC-API-STORY-032**: Search by title works
- **TC-API-STORY-033**: Sorting options work correctly
- **TC-API-STORY-034**: User-specific filtering works
- **TC-API-STORY-035**: Pagination parameters respected

### Generation API

#### Generate Story (POST /api/studio/api/generation/story)
- **TC-API-GEN-001**: Authenticated writer can generate story
- **TC-API-GEN-002**: Invalid input parameters return 400
- **TC-API-GEN-003**: SSE streaming returns events correctly
- **TC-API-GEN-004**: Generation progress updates work
- **TC-API-GEN-005**: Generation completes with all phases
- **TC-API-GEN-006**: Generation errors handled gracefully
- **TC-API-GEN-007**: Concurrent generation requests handled
- **TC-API-GEN-008**: Generation timeout handled correctly

#### Generate Characters (POST /api/studio/api/generation/characters)
- **TC-API-GEN-009**: Character generation works correctly
- **TC-API-GEN-010**: Character portraits generated
- **TC-API-GEN-011**: Character traits follow constraints
- **TC-API-GEN-012**: Multiple characters generated correctly

#### Generate Settings (POST /api/studio/api/generation/settings)
- **TC-API-GEN-013**: Setting generation works correctly
- **TC-API-GEN-014**: Setting images generated
- **TC-API-GEN-015**: Setting descriptions detailed

#### Generate Scenes (POST /api/studio/api/generation/scenes)
- **TC-API-GEN-016**: Scene generation works correctly
- **TC-API-GEN-017**: Scene images generated
- **TC-API-GEN-018**: Scene content follows story arc
- **TC-API-GEN-019**: Scene evaluation scores returned

#### Generate Images (POST /api/studio/api/generation/images)
- **TC-API-GEN-020**: Image generation works with valid prompt
- **TC-API-GEN-021**: Image optimization creates 4 variants
- **TC-API-GEN-022**: Images uploaded to Blob storage
- **TC-API-GEN-023**: Image URLs returned correctly
- **TC-API-GEN-024**: Invalid prompts return 400
- **TC-API-GEN-025**: Image generation timeout handled

### Community API

#### Create Post (POST /api/community/posts)
- **TC-API-COMM-001**: Authenticated user can create post
- **TC-API-COMM-002**: Anonymous user cannot create post (401)
- **TC-API-COMM-003**: Post validation works correctly
- **TC-API-COMM-004**: Post attached to story correctly
- **TC-API-COMM-005**: Post created with correct metadata

#### Get Posts (GET /api/community/posts)
- **TC-API-COMM-006**: Returns paginated posts
- **TC-API-COMM-007**: Filter by category works
- **TC-API-COMM-008**: Filter by story works
- **TC-API-COMM-009**: Search posts works
- **TC-API-COMM-010**: Sorting options work

#### Update Post (PUT /api/community/posts/:id)
- **TC-API-COMM-011**: Post owner can update post
- **TC-API-COMM-012**: Non-owner cannot update post (403)
- **TC-API-COMM-013**: Manager can update any post
- **TC-API-COMM-014**: Post validation on update works

#### Delete Post (DELETE /api/community/posts/:id)
- **TC-API-COMM-015**: Post owner can delete post
- **TC-API-COMM-016**: Non-owner cannot delete post (403)
- **TC-API-COMM-017**: Manager can delete any post
- **TC-API-COMM-018**: Comments deleted with post

#### Like/Unlike Post (POST /api/community/posts/:id/like)
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

#### Publish Story (POST /api/publish/:id)
- **TC-API-PUBLISH-001**: Story owner can publish story
- **TC-API-PUBLISH-002**: Non-owner cannot publish story (403)
- **TC-API-PUBLISH-003**: Incomplete story cannot be published
- **TC-API-PUBLISH-004**: Published story status updated
- **TC-API-PUBLISH-005**: Published story visible in community

#### Unpublish Story (POST /api/publish/:id/unpublish)
- **TC-API-PUBLISH-006**: Story owner can unpublish story
- **TC-API-PUBLISH-007**: Non-owner cannot unpublish (403)
- **TC-API-PUBLISH-008**: Unpublished story hidden from community
- **TC-API-PUBLISH-009**: Unpublished story status updated

#### Schedule Publish (POST /api/publish/:id/schedule)
- **TC-API-PUBLISH-010**: Story can be scheduled for publish
- **TC-API-PUBLISH-011**: Scheduled publish date validated
- **TC-API-PUBLISH-012**: Scheduled story published at correct time
- **TC-API-PUBLISH-013**: Scheduled publish can be cancelled

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
   - **TC-NOVELS-FUNC-005**: Search stories
   - **TC-NOVELS-FUNC-006**: Bookmark story
   - **TC-NOVELS-FUNC-007**: Save reading progress
   - **TC-NOVELS-FUNC-008**: Adjust font/theme

3. **Comics - Reading Experience** (30 min)
   - **TC-COMICS-FUNC-001**: Rate comic
   - **TC-COMICS-FUNC-002**: Track reading history
   - **TC-COMICS-FUNC-003**: Navigate panels
   - **TC-COMICS-FUNC-004**: Post/view comments
   - **TC-COMICS-FUNC-005**: Search comics
   - **TC-COMICS-FUNC-006**: Bookmark comic
   - **TC-COMICS-FUNC-007**: Save reading progress
   - **TC-COMICS-FUNC-008**: Zoom/pan panels

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
| POST /api/studio/api/generation/* | < 5s | 3.2s | ✅ |

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

## Appendix

### Test Case ID Mapping

Full mapping of test case IDs to test descriptions available in this document.

### Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-05 | Initial comprehensive test specification | Claude |
| 1.1 | 2025-11-05 | Updated to match actual implementation:<br>- Simplified Home page tests (redirect only)<br>- Changed Analytics → Analysis throughout<br>- Updated API endpoints to match implementation<br>- Verified schedule publish feature (implemented)<br>- Updated performance metrics for home redirect | Claude |

### Glossary

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

**End of Comprehensive Test Specification**
