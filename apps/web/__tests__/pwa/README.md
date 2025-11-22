# PWA Test Suite

Comprehensive test suite for Progressive Web App (PWA) functionality.

## Test Files

### 1. `manifest.spec.ts` - Manifest Validation Tests
Tests the web app manifest configuration:
- ✅ Valid manifest.json structure
- ✅ All required icons (10 icons: 72x72 to 512x512)
- ✅ App shortcuts configured (Studio, Library)
- ✅ Correct categories
- ✅ Manifest link in HTML head
- ✅ Theme-color meta tag
- ✅ Apple-touch-icon
- ⚠️ Mobile-web-app-capable meta tag (has duplicate - needs fix)

**Results**: 7/8 passed

### 2. `service-worker.spec.ts` - Service Worker Tests
Tests service worker registration and functionality:
- Service worker registration in production
- SW.js file accessibility
- Service worker API support
- Ready state handling
- Update mechanism
- Static asset caching
- Skip waiting behavior

**Note**: Service worker is **disabled in development mode** (see `next.config.mjs:66`)
- Tests will fail in development
- Run `pnpm build && pnpm start` to test in production mode

### 3. `install.spec.ts` - Installation Tests
Tests PWA installation capabilities:
- PWA installability criteria
- beforeinstallprompt event support
- Standalone display mode
- Install prompt deferral
- App shortcuts accessibility
- Viewport configuration
- Orientation preferences

### 4. `offline.spec.ts` - Offline Functionality Tests
Tests offline capabilities and caching:
- Static asset caching
- Network status detection
- Network status change handling
- Navigation request caching
- Cache Storage API
- Offline fallback behavior
- Background sync API support
- Image and asset caching
- Cache updates on navigation

**Note**: Offline tests require production build with active service worker

### 5. `icons-assets.spec.ts` - Icons and Assets Tests
Tests icon availability and asset loading:
- Standard icons (8 sizes: 72x72 to 512x512)
- Maskable icons (192x192, 512x512)
- Apple-touch-icon
- Favicon.ico
- Icon dimensions validation
- Icon file sizes
- MIME types
- Mobile and high-resolution icons
- Icon caching

## Running Tests

### All PWA Tests
```bash
# From project root
pnpm --filter web exec playwright test --project=pwa-tests

# From apps/web
npx playwright test --project=pwa-tests
```

### Specific Test File
```bash
# Manifest tests only
npx playwright test __tests__/pwa/manifest.spec.ts --project=pwa-tests

# Service worker tests only
npx playwright test __tests__/pwa/service-worker.spec.ts --project=pwa-tests
```

### With Different Reporters
```bash
# List reporter (concise)
npx playwright test --project=pwa-tests --reporter=list

# Line reporter (progress)
npx playwright test --project=pwa-tests --reporter=line

# HTML reporter (detailed report)
npx playwright test --project=pwa-tests --reporter=html
```

## Test Configuration

Tests are configured in `playwright.config.ts`:
```typescript
{
  name: "pwa-tests",
  use: {
    ...devices["Desktop Chrome"],
  },
  testDir: "./__tests__/pwa",
  testMatch: /.*\.spec\.ts/,
}
```

## Prerequisites

### 1. Install Playwright Browsers
```bash
pnpm exec playwright install chromium
```

### 2. Start Development Server
```bash
pnpm dev

# Server must be running on http://localhost:3000
```

### 3. For Full PWA Testing (Production Mode)
```bash
# Build production version
pnpm build

# Start production server
pnpm start

# Run tests
npx playwright test --project=pwa-tests
```

## Test Results Summary

### Development Mode Tests (Current)
- **Manifest Tests**: ✅ 7/8 passed (1 duplicate meta tag issue)
- **Service Worker Tests**: ⚠️ Expected to fail (SW disabled in dev)
- **Install Tests**: ✅ Most pass (install prompts won't trigger in dev)
- **Offline Tests**: ⚠️ Expected to fail (no SW in dev)
- **Icons/Assets Tests**: ✅ Should pass (static assets available)

### Production Mode Tests (Required for Full PWA Testing)
- All tests should pass
- Service worker active
- Offline functionality works
- Install prompts can be triggered
- Full PWA features enabled

## Known Issues

### 1. Duplicate Meta Tag
**File**: `src/app/layout.tsx`
**Issue**: `mobile-web-app-capable` meta tag appears twice
**Fix**: Remove duplicate from layout

### 2. Service Worker in Development
**Expected**: Service worker disabled in development mode
**Config**: `next.config.mjs:66` - `disable: process.env.NODE_ENV === "development"`
**Solution**: Run production build for SW tests

## PWA Configuration Files

- `public/manifest.json` - PWA manifest
- `public/icons/` - PWA icons (10 sizes)
- `public/favicon.ico` - Browser favicon
- `next.config.mjs` - PWA plugin configuration
- `src/app/layout.tsx` - PWA meta tags

## Best Practices

1. **Always test in production mode** for comprehensive PWA validation
2. **Run tests before deploying** to catch manifest/icon issues early
3. **Test on mobile devices** for real-world PWA experience
4. **Verify offline functionality** in production builds
5. **Check service worker updates** after deployments

## Debugging

### View Test Results
```bash
# Generate HTML report
npx playwright show-report

# Run tests in headed mode (see browser)
npx playwright test --project=pwa-tests --headed

# Debug single test
npx playwright test --project=pwa-tests --debug
```

### Check Server Status
```bash
# Verify server is running
curl -I http://localhost:3000

# Check manifest accessibility
curl http://localhost:3000/manifest.json | jq .

# Verify icon availability
curl -I http://localhost:3000/icons/icon-192x192.png
```

## Coverage

### Tested PWA Features
- ✅ Manifest validation
- ✅ Icon availability (all sizes)
- ✅ Service worker registration
- ✅ Offline caching
- ✅ Install prompt support
- ✅ App shortcuts
- ✅ Mobile optimization
- ✅ Viewport configuration

### Not Yet Tested
- Push notifications
- Background sync (tested API support only)
- Periodic background sync
- Web Share API
- Payment Request API

## Future Enhancements

1. Add push notification tests
2. Add Web Share API tests
3. Add performance metrics tests
4. Add lighthouse PWA score validation
5. Add mobile device-specific tests
6. Add network throttling tests
7. Add cache invalidation tests

## Related Documentation

- [PWA Feature Test Script](../../test-scripts/test-pwa-features.mjs)
- [PWA Icon Generator](../../scripts/generate-pwa-icons.mjs)
- [Playwright Config](../../playwright.config.ts)
- [Next.js PWA Plugin Docs](https://github.com/DuCanhGH/next-pwa)
