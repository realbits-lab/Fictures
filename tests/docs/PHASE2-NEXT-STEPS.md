---
title: Phase 2 - Next Steps for Cache Invalidation Testing
date: 2025-11-02
---

# Phase 2 Next Steps - Unblocking Cache Tests

## Current Status

✅ **Completed:**
- Development server running (port 3000)
- Test infrastructure validated (28 tests ready)
- Phase 2 status report created

❌ **Blocked:**
- Authentication files missing
- Test data missing

## Option 1: Create Auth Files Manually (Fastest - 15 mins)

Since you have existing accounts, the quickest way is to login manually and save the session:

```bash
# 1. Create auth setup script
cat > tests/auth.setup.ts << 'SETUP'
import { test as setup, expect } from '@playwright/test';

// Setup for writer account
setup('authenticate as writer', async ({ page }) => {
  console.log('Navigating to login page...');
  await page.goto('http://localhost:3000/auth/signin');
  await page.waitForLoadState('networkidle');
  
  // Manual step: Login with writer@fictures.xyz
  // Wait for 60 seconds to allow manual login
  console.log('Please login as writer@fictures.xyz');
  console.log('Waiting 60 seconds for manual login...');
  await page.waitForTimeout(60000);
  
  // Verify logged in
  await expect(page).toHaveURL(/studio|novels|community/, { timeout: 5000 });
  
  // Save auth state
  await page.context().storageState({ path: '.auth/writer.json' });
  console.log('✅ Writer auth saved to .auth/writer.json');
});
SETUP

# 2. Run auth setup (use headed mode to login manually)
npx playwright test tests/auth.setup.ts --headed --project=setup
```

**After login completes:**
```bash
# Copy writer auth for other roles (if same account can be used)
cp .auth/writer.json .auth/manager.json
cp .auth/writer.json .auth/reader.json
cp .auth/writer.json .auth/user.json  # For cache tests
```

## Option 2: Update Cache Tests to Use Writer Auth (Quickest - 5 mins)

Instead of creating `user.json`, update the cache tests:

```bash
# Update cache-invalidation-studio.spec.ts
sed -i '' "s/'.auth\/user.json'/'.auth\/writer.json'/g" tests/cache-invalidation-studio.spec.ts

# Update cache-invalidation-community.spec.ts
sed -i '' "s/'.auth\/user.json'/'.auth\/writer.json'/g" tests/cache-invalidation-community.spec.ts

# Then run Option 1 to create writer.json
```

## Option 3: Create Test Data

The cache performance tests need test stories. You mentioned you had this before:

```bash
# Check for existing test data script
ls scripts/*cache*test* 2>/dev/null

# If script exists, run it:
dotenv --file .env.local run node scripts/cache-test-create-data.mjs

# If script doesn't exist, create basic test data:
# (You'll need to implement based on your story schema)
```

## Recommended Workflow

**Step 1: Create Writer Auth (15 mins)**
```bash
# Run the manual auth setup
npx playwright test tests/auth.setup.ts --headed --project=setup
# Login manually when browser opens
# Wait for auth to be saved
```

**Step 2: Copy Auth Files (1 min)**
```bash
cp .auth/writer.json .auth/manager.json
cp .auth/writer.json .auth/reader.json  
cp .auth/writer.json .auth/user.json
ls -la .auth/
```

**Step 3: Update Cache Tests OR Create User.json Symlink (2 mins)**
```bash
# Option A: Update tests to use writer.json
sed -i '' "s/'.auth\/user.json'/'.auth\/writer.json'/g" tests/cache-*.spec.ts

# Option B: Create symlink
cd .auth && ln -s writer.json user.json && cd ..
```

**Step 4: Run Cache Tests Without Test Data (5 mins)**
```bash
# Try running the invalidation tests (these might work without test data)
npx playwright test cache-invalidation-studio.spec.ts
npx playwright test cache-invalidation-community.spec.ts
```

**Step 5: Create Test Data (30-60 mins)**
```bash
# Find or create test data generation
# Then run performance tests
npx playwright test cache-performance.spec.ts
npx playwright test cache-performance-benchmarks.spec.ts
```

## Quick Test Without Full Setup

To verify the cache system is working, you can test manually:

```bash
# 1. Open the cache debug panel
open http://localhost:3000
# Press Ctrl+Shift+D in browser

# 2. Open metrics dashboard  
# Press Ctrl+Shift+M in browser

# 3. Test cache metrics API
curl http://localhost:3000/studio/api/cache/metrics | jq

# 4. Test cache monitoring API
curl http://localhost:3000/studio/api/cache/monitoring | jq
```

## Timeline

| Task | Time | Cumulative |
|------|------|------------|
| Create auth setup script | 5 min | 5 min |
| Run manual login | 10 min | 15 min |
| Copy auth files | 1 min | 16 min |
| Run cache invalidation tests | 5 min | 21 min |
| Create test data (optional) | 30-60 min | 51-81 min |
| Run all tests | 10 min | 61-91 min |

**Total: 1-1.5 hours to complete Phase 2**

## Success Criteria

After completing these steps, you should have:

✅ Authentication files in `.auth/` directory  
✅ Cache invalidation tests passing (12/28 tests)  
✅ Manual cache testing verified  
✅ Phase 2 completion report ready

**Then proceed to Phase 3: Production Deployment**

---

**Created:** 2025-11-02  
**Status:** Ready to execute  
**Priority:** High - Required for Phase 2 completion
