---
title: Authentication Setup Guide for Phase 2 Testing
date: 2025-11-02
---

# Authentication Setup Guide

## Quick Start

### Option 1: Interactive Script (Recommended)

```bash
./run-auth-setup.sh
```

This will:
- Open browser in headed mode
- Give you 90 seconds to login
- Save authentication to `.auth/writer.json`
- Optionally set up manager and reader accounts

### Option 2: Direct Playwright Command

```bash
# For writer account (most important)
npx playwright test tests/auth.setup.ts --headed --project=setup --grep="authenticate as writer"

# For all accounts
npx playwright test tests/auth.setup.ts --headed --project=setup
```

## What Happens

1. **Browser opens** in headed mode (you can see it)
2. **Navigate to** `http://localhost:3000/auth/signin`
3. **You login** with your account (Google OAuth or email/password)
4. **Script waits** 90 seconds for you to complete login
5. **Saves session** to `.auth/*.json` files

## Files Created

After successful setup:
```
.auth/
├── writer.json   # writer@fictures.xyz session
├── manager.json  # manager@fictures.xyz session  
├── reader.json   # reader@fictures.xyz session
└── user.json     # Symlink/copy of writer.json (for cache tests)
```

## Troubleshooting

### "Login verification failed"
- This is OK if you are actually logged in
- Check the browser - are you on a logged-in page?
- Auth file will still be saved

### "Auth file not created"
- Make sure you completed login within 90 seconds
- Check browser didn't close early
- Try running again with longer timeout

### "Session expired"
- Delete old `.auth/*.json` files
- Run setup again
- Sessions typically last 30 days

## Testing Auth Files

```bash
# Check files exist
ls -lh .auth/

# Test with a simple playwright test
npx playwright test cache-invalidation-studio.spec.ts --headed

# If it works, you'll see tests running with your logged-in session
```

## Next Steps

Once auth files are created:

1. **Run cache invalidation tests:**
   ```bash
   npx playwright test cache-invalidation-studio.spec.ts
   npx playwright test cache-invalidation-community.spec.ts
   ```

2. **Create test data** for performance tests

3. **Run full test suite**

---

**Created:** 2025-11-02  
**Modified:** `tests/auth.setup.ts`  
**Helper:** `run-auth-setup.sh`
