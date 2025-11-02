# Neon Pooled Connection - Quick Start (5 Minutes)

## TL;DR - What You Need to Do

Add `-pooler` to your Neon connection string hostname to enable connection pooling and get 10-20% better performance.

## Step-by-Step Setup

### 1. Get Your Pooled Connection String

**Go to Neon Console**: https://console.neon.tech

1. Select your project
2. Click **Connection Details** (or the connection string icon)
3. **Ensure "Connection pooling" toggle is ON** (default since Jan 2025)
4. Copy the connection string

It should look like:
```
postgres://user:password@ep-xxxxx-pooler.us-east-2.aws.neon.tech/dbname
                                 ^^^^^^^^
                                 Must have -pooler suffix!
```

### 2. Add to Local Environment

**Edit `.env.local`** (in project root):

```bash
# Replace with your actual pooled connection string
POSTGRES_URL_POOLED=postgres://user:pass@ep-xxxxx-pooler.region.aws.neon.tech/dbname

# Keep your existing POSTGRES_URL for migrations
POSTGRES_URL=postgres://user:pass@ep-xxxxx.region.aws.neon.tech/dbname
```

### 3. Add to Vercel (Production)

**Option A: Vercel Dashboard (Easiest)**

1. Go to https://vercel.com/dashboard
2. Select your project (Fictures)
3. Settings → Environment Variables
4. Add new variable:
   - **Name**: `POSTGRES_URL_POOLED`
   - **Value**: Your pooled connection string from Step 1
   - **Environments**: ✅ Production, ✅ Preview
5. Click **Save**
6. **Redeploy** your app

**Option B: Vercel CLI**

```bash
# Set production environment variable
vercel env add POSTGRES_URL_POOLED production

# Paste your pooled connection string when prompted

# Set preview environment variable (optional)
vercel env add POSTGRES_URL_POOLED preview

# Redeploy
vercel deploy --prod
```

### 4. Verify Setup

**Local Development:**

```bash
# Restart dev server
pkill -f "next dev"
dotenv --file .env.local run pnpm dev > logs/dev-server.log 2>&1 &

# Check logs - should see pooled connection message
tail -10 logs/dev-server.log | grep "DB"
```

Expected:
```
🔗 [DB] Using Neon pooled connection for optimal performance
```

**Production (After Deploy):**

```bash
# Check Vercel logs
vercel logs --follow

# Should see:
# 🔗 [DB] Using Neon pooled connection for optimal performance
```

### 5. Test Performance

```bash
# Test page load time
curl -w "Time: %{time_total}s\n" https://your-app.vercel.app/novels/STORY_ID

# Should be ~10-20% faster than before
```

## Alternative: Use Neon Vercel Integration

Instead of manual setup, use Neon's official Vercel integration:

1. **Vercel Dashboard** → Your Project → Integrations
2. Search **"Neon"** → Click **"Add Integration"**
3. Follow setup wizard
4. Integration automatically sets `DATABASE_URL` (pooled) + `DATABASE_URL_UNPOOLED`

Then update your code to use `DATABASE_URL`:

```typescript
// src/lib/db/index.ts
const connectionString =
  process.env.DATABASE_URL ||           // From Neon integration (pooled)
  process.env.POSTGRES_URL_POOLED ||    // Manual setup
  process.env.POSTGRES_URL!;            // Fallback
```

## Verification Checklist

- [ ] Connection string has `-pooler` suffix
- [ ] `POSTGRES_URL_POOLED` set in `.env.local`
- [ ] `POSTGRES_URL_POOLED` set in Vercel (Production + Preview)
- [ ] Dev server shows "Using Neon pooled connection"
- [ ] Production deployment shows pooled connection in logs
- [ ] Page load time improved by ~10-20%

## Common Issues

### ❌ "Using direct connection" in logs
**Problem**: `POSTGRES_URL_POOLED` not set or doesn't have `-pooler` suffix
**Fix**: Double-check environment variable and connection string

### ❌ Migrations fail with "pool_mode error"
**Problem**: Using pooled connection for migrations
**Fix**: Keep `POSTGRES_URL` (unpooled) for `drizzle.config.ts`

### ❌ No performance improvement
**Problem**: Connection string doesn't actually have `-pooler` suffix
**Fix**: Verify hostname includes `-pooler` before the region

## Expected Results

### Query Performance
- **Before**: ~170ms (local), ~200ms (production)
- **After**: ~150ms (local), ~160ms (production)
- **Improvement**: 10-20% faster

### Concurrent Connection Support
- **Before**: ~100 connections (then degrades)
- **After**: Up to 10,000 connections
- **Improvement**: 100x scalability

## Need Help?

- Full documentation: `docs/setup/neon-pooled-connection-setup.md`
- Neon Docs: https://neon.com/docs/connect/connection-pooling
- Vercel Env Vars: https://vercel.com/docs/concepts/projects/environment-variables

---

**Time to Complete**: 5 minutes
**Performance Gain**: 10-20% faster queries
**Scalability**: 100x more concurrent connections
