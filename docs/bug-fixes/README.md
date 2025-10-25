# Bug Fixes & Performance Investigations

This directory contains detailed reports of bugs fixed and performance investigations conducted in the Fictures project.

---

## Cache-Related Fixes

### Cache Miss & Prefetch Issues
- **[cache-miss-bug-fix.md](cache-miss-bug-fix.md)** - Fixed version mismatch logic causing cache to never be used
  - **Issue:** Version check treating `null` as mismatch
  - **Fix:** Only check version when data exists
  - **Impact:** Cache now works correctly, instant loading on revisits

- **[prefetch-cache-fix.md](prefetch-cache-fix.md)** - Fixed false "Cache MISS" logs for prefetched content
  - **Issue:** Prefetch only checking SWR in-memory, not localStorage
  - **Fix:** Check both cache layers
  - **Impact:** Accurate cache hit/miss logging

- **[prefetch-cache-miss-investigation.md](prefetch-cache-miss-investigation.md)** - Investigation report for cache miss issues
  - **Analysis:** Detailed timing breakdown
  - **Findings:** localStorage cache working, SWR integration issue
  - **Resolution:** Led to prefetch-cache-fix

- **[cache-fix-verification.md](cache-fix-verification.md)** - Verification testing of cache fixes
  - **Tests:** Manual and automated verification
  - **Results:** All cache issues resolved
  - **Metrics:** Sub-10ms loads for cached content

---

## Mobile Experience Fixes

### Navigation & UI
- **[mobile-bottom-nav-fix.md](mobile-bottom-nav-fix.md)** - Bottom navigation always visible on all screen sizes
  - **Change:** Removed conditional hide behavior on desktop
  - **Rationale:** Consistent UX, easier navigation
  - **Status:** ✅ Implemented in `ChapterReaderClient.tsx:917`

- **[mobile-scene-title-gnb-fix.md](mobile-scene-title-gnb-fix.md)** - Scene title in global navigation bar on mobile
  - **Change:** Added scene title to top nav
  - **Benefit:** Better context during reading
  - **Status:** ✅ Implemented

- **[scroll-boundary-flickering-fix.md](scroll-boundary-flickering-fix.md)** - Fixed navigation bar flickering at scroll boundaries
  - **Issue:** Rapid show/hide toggling at content edges
  - **Fix:** Added hysteresis to scroll detection
  - **Impact:** Smooth, professional experience

### Content & Layout
- **[scene-title-removal.md](scene-title-removal.md)** - Scene title display changes
  - **Change:** Moved scene title from content to navigation
  - **Benefit:** Cleaner content area

- **[skeleton-loading-empty-chapter.md](skeleton-loading-empty-chapter.md)** - Skeleton loading for empty chapter states
  - **Fix:** Show skeleton instead of blank screen
  - **Impact:** Better perceived performance

---

## Navigation & Component Fixes

- **[navigation-cleanup.md](navigation-cleanup.md)** - Navigation component cleanup and optimization
  - **Changes:** Removed redundant navigation elements
  - **Simplified:** In-content navigation removed
  - **Impact:** Cleaner UI, less clutter

---

## Data & Content Fixes

### Chapter & Scene Ordering
- **[bugfix-chapter-scene-ordering.md](bugfix-chapter-scene-ordering.md)** - Fixed chapter and scene ordering issues
  - **Issue:** Incorrect order_index handling
  - **Fix:** Proper sorting by order_index
  - **Status:** ✅ Fixed

### Comment System
- **[bugfix-duplicate-replies.md](bugfix-duplicate-replies.md)** - Prevented duplicate comment replies
  - **Issue:** Double-submission of replies
  - **Fix:** Debouncing and submission state management
  - **Status:** ✅ Fixed

### UI Controls
- **[bugfix-next-chapter-button.md](bugfix-next-chapter-button.md)** - Next chapter button functionality fix
  - **Issue:** Button not working in certain scenarios
  - **Fix:** Proper navigation logic
  - **Status:** ✅ Fixed

---

## Database & Schema Fixes

- **[genre-join-error-fix.md](genre-join-error-fix.md)** - Fixed genre join error in story queries
  - **Issue:** Incorrect JOIN causing query failures
  - **Fix:** Proper LEFT JOIN syntax
  - **Status:** ✅ Fixed

---

## Image & Media Fixes

- **[image-optimization-blob-conflict-fix.md](image-optimization-blob-conflict-fix.md)** - Resolved Vercel Blob upload conflicts
  - **Issue:** Concurrent uploads creating conflicts
  - **Fix:** Unique filenames and retry logic
  - **Status:** ✅ Fixed

---

## Performance Investigations

### Scene Loading Performance
- **[scene-loading-bottleneck-analysis.md](scene-loading-bottleneck-analysis.md)** - Scene loading performance bottleneck analysis
  - **Finding:** Database query contention during parallel requests
  - **Bottleneck:** Chapter queries slow from 220ms to 1200-1600ms
  - **Cause:** Connection pool contention
  - **Priority:** HIGH

- **[scene-loading-optimization-results.md](scene-loading-optimization-results.md)** - Results of scene loading optimizations
  - **Optimizations Applied:** Database indexes, N+1 query fixes
  - **Results:** 5-10x performance improvement
  - **Metrics:** Sub-100ms chapter queries

### Timing & Performance
- **[timing-gap-analysis.md](timing-gap-analysis.md)** - Performance timing gap analysis
  - **Analysis:** Breakdown of all timing gaps in loading pipeline
  - **Findings:** Identified optimization opportunities
  - **Actions:** Led to multiple performance improvements

---

## Summary Statistics

**Total Fixes:** 18 documented bug fixes and investigations

**By Category:**
- Cache fixes: 4 reports
- Mobile fixes: 4 reports
- Navigation: 1 report
- Data/content: 3 reports
- Database: 1 report
- Image/media: 1 report
- Performance: 3 investigation reports

**Status:**
- ✅ All bugs fixed and verified
- ✅ All performance issues addressed
- ✅ Documentation complete

---

## Related Documentation

For summary information, see:
- **[../mobile-improvements-summary.md](../mobile-improvements-summary.md)** - Mobile improvements overview
- **[../caching-strategy.md](../caching-strategy.md)** - Complete caching guide (references cache fixes)
- **[../database-optimization-strategy.md](../database-optimization-strategy.md)** - Database performance (references scene loading fixes)
- **[../reading-specification.md](../reading-specification.md)** - Reading UX spec (references mobile fixes)

---

**Last Updated:** 2025-10-25
**Directory Purpose:** Historical bug fix reports and performance investigation details
