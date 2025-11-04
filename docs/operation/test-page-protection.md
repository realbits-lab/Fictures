---
title: Test Page Protection - Development vs Production
---

# Test Page Protection

## Overview

The `/test` route is a development-only page for testing features without authentication. It is automatically blocked in production via middleware for security.

## Implementation

### Test Page Location
- **Route**: `/test`
- **File**: `src/app/test/page.tsx`
- **Purpose**: Quick testing and debugging without authentication

### Middleware Protection
- **File**: `src/middleware.ts`
- **Logic**: Checks `NODE_ENV` and blocks `/test` routes in production
- **Response**: Returns 404 in production to hide existence of test routes

### Code Implementation

```typescript
// src/middleware.ts
export default auth((req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Block /test routes in production
  if (pathname.startsWith('/test')) {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      // Return 404 in production to hide existence of test routes
      return NextResponse.rewrite(new URL('/404', req.url));
    }
  }

  // Continue with auth middleware for other routes
  return NextResponse.next();
});
```

## Testing

### Development Mode (NODE_ENV=development)
```bash
# Start dev server
dotenv --file .env.local run pnpm dev

# Test page should be accessible
curl http://localhost:3000/test
# Expected: 200 OK with "Development Test Page" content

# Or use verification script
NODE_ENV=development node test-scripts/verify-test-page-middleware.mjs
# Expected: ✅ SUCCESS: Test page accessible in development
```

### Production Mode Testing

**Option 1: Local Production Build**
```bash
# Build production bundle
pnpm build

# Start production server
NODE_ENV=production pnpm start

# Test page should be blocked
curl http://localhost:3000/test
# Expected: 404 Not Found

# Or use verification script
NODE_ENV=production node test-scripts/verify-test-page-middleware.mjs
# Expected: ✅ SUCCESS: Test page correctly blocked in production (404)
```

**Option 2: Vercel Deployment**
- Deploy to Vercel (automatically sets NODE_ENV=production)
- Try accessing `https://your-app.vercel.app/test`
- Should receive 404 Not Found

## Security Considerations

### Why Block in Production?
1. **Security**: Test routes may expose internal functionality
2. **Privacy**: No authentication required for test pages
3. **Data Protection**: Test pages might access production data unsafely
4. **Professional Image**: Hide development artifacts from end users

### Best Practices
1. ✅ Always test production builds locally before deploying
2. ✅ Use `/test` prefix for all development-only routes
3. ✅ Never put sensitive data or credentials in test pages
4. ✅ Consider using API keys or tokens for test API routes
5. ❌ Never commit `.env.local` with production credentials

## Extending Test Routes

### Adding New Test Pages

Create new pages under `/test`:
```bash
src/app/test/
├── page.tsx                    # Main test page
├── cache-performance/         # Cache testing
│   └── page.tsx
└── your-new-test/             # Your new test
    └── page.tsx
```

All routes under `/test/*` are automatically protected by middleware.

### Example Test Page

```typescript
// src/app/test/my-feature/page.tsx
export default function MyFeatureTest() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">My Feature Test</h1>
      <p>Test your feature here without authentication</p>
      {/* Your test UI */}
    </div>
  );
}
```

## Troubleshooting

### Test Page Not Loading in Development
1. Check dev server is running: `lsof -ti:3000`
2. Restart dev server: `rm -rf .next && dotenv --file .env.local run pnpm dev`
3. Check middleware for syntax errors
4. Verify NODE_ENV is set to "development"

### Test Page Still Accessible in Production
1. Verify `NODE_ENV=production` is set
2. Check middleware.ts is properly deployed
3. Clear Next.js cache: `rm -rf .next`
4. Rebuild: `pnpm build && NODE_ENV=production pnpm start`
5. Check Vercel environment variables

### 500 Error on Test Page
1. Check server logs: `tail -f logs/dev-server.log`
2. Check for TypeScript errors: `pnpm build`
3. Verify imports in page.tsx are correct
4. Check for missing dependencies

## Related Files

- **Middleware**: `src/middleware.ts`
- **Test Page**: `src/app/test/page.tsx`
- **Verification Script**: `test-scripts/verify-test-page-middleware.mjs`
- **Guidelines**: `CLAUDE.md` (Testing section)

## Verification Script

Use the provided script to verify protection:
```bash
# In development
NODE_ENV=development node test-scripts/verify-test-page-middleware.mjs

# In production
NODE_ENV=production node test-scripts/verify-test-page-middleware.mjs
```

Script output:
- ✅ **Success**: Correct behavior for environment
- ❌ **Failure**: Protection not working, check implementation
