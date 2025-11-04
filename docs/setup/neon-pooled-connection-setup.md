# Neon Pooled Connection Setup for Vercel

Complete guide to setting up Neon's pooled database connections for optimal performance on Vercel.

## What is Connection Pooling?

Neon uses **PgBouncer** for connection pooling, which:
- Supports up to **10,000 concurrent connections**
- Reduces connection overhead and latency by **10-20%**
- Essential for serverless environments like Vercel

## Connection String Format

### Pooled Connection (Recommended)
```
postgresql://user:password@ep-cool-darkness-123456-pooler.us-east-2.aws.neon.tech/dbname
                                                    ^^^^^^^^
                                                    -pooler suffix routes to pooled port
```

### Direct Connection (For migrations/pg_dump)
```
postgresql://user:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/dbname
                                                    (no -pooler suffix)
```

## Getting Your Pooled Connection String

### Method 1: Neon Console (Recommended)

1. **Open Neon Console**: https://console.neon.tech
2. **Navigate to your project**
3. **Go to Connection Details** (Dashboard tab)
4. **Ensure "Connection pooling" toggle is ENABLED** (default since Jan 2025)
5. **Copy the connection string** - it will include `-pooler` in the hostname

Example:
```
postgresql://myuser:AbC123dEf@ep-cool-darkness-a1b2c3d4-pooler.us-east-2.aws.neon.tech/mydb
```

### Method 2: Neon CLI

```bash
# Install Neon CLI
npm install -g neonctl

# Login
neonctl auth

# Get pooled connection string
neonctl connection-string --pooled true [branch_name]
```

### Method 3: Manual Modification

If you have a direct connection string, add `-pooler` after the endpoint ID:

**Before (Direct)**:
```
postgres://user:pass@ep-cool-darkness-123456.us-east-2.aws.neon.tech/db
```

**After (Pooled)**:
```
postgres://user:pass@ep-cool-darkness-123456-pooler.us-east-2.aws.neon.tech/db
                                             ^^^^^^^^ Add this suffix
```

## Setup for Vercel Platform

### Option A: Vercel Environment Variables (Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project** (e.g., "Fictures")
3. **Go to Settings → Environment Variables**
4. **Add new variables**:

```bash
# For Production
DATABASE_URL=postgres://user:pass@endpoint-pooler.neon.tech/db
DATABASE_URL_POOLED=postgres://user:pass@endpoint-pooler.neon.tech/db  # Same as above

# For Development (optional - use local .env.local)
# Can also add these to Vercel for preview deployments
```

5. **Select Environments**:
   - ✅ Production
   - ✅ Preview (optional)
   - ❌ Development (use local .env.local instead)

6. **Click "Save"**
7. **Redeploy** your application

### Option B: Neon Integration for Vercel

#### Vercel-Managed Integration (Easier)

1. **Go to Vercel Dashboard** → Your Project → Integrations
2. **Search for "Neon"** in Marketplace
3. **Click "Add Integration"**
4. **Follow the setup wizard**
5. **Integration automatically sets**:
   - `DATABASE_URL` (pooled connection)
   - `DATABASE_URL_UNPOOLED` (direct connection)
   - Legacy variables: `DATABASE_URL`, `PGHOST`, etc.

#### Neon-Managed Integration (Keep Neon Billing)

1. **In Neon Console** → Project → Integrations
2. **Click "Add" next to Vercel**
3. **Select your Vercel project**
4. **Authorize the connection**
5. **Same environment variables are set automatically**

## Environment Variable Naming

### Modern Naming (Recommended by Neon)
```bash
DATABASE_URL=postgres://user:pass@endpoint-pooler.neon.tech/db           # Pooled
DATABASE_URL_UNPOOLED=postgres://user:pass@endpoint.neon.tech/db         # Direct
```

### Legacy Naming (PostgreSQL Standard)
```bash
DATABASE_URL=postgres://user:pass@endpoint-pooler.neon.tech/db          # Pooled
DATABASE_URL_POOLED=postgres://user:pass@endpoint-pooler.neon.tech/db   # Pooled (custom)
DATABASE_URL_UNPOOLED=postgres://user:pass@endpoint.neon.tech/db        # Direct (custom)
```

## Update Your Code

### Current Implementation
**File**: `src/lib/db/index.ts`

```typescript
// Already supports pooled connections!
const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!;

if (process.env.DATABASE_URL_POOLED) {
  console.log('🔗 [DB] Using Neon pooled connection for optimal performance');
} else {
  console.log('🔗 [DB] Using direct connection');
}
```

### Option 1: Use Standard DATABASE_URL (Recommended)

If using Neon's Vercel integration, update to:

```typescript
// Use modern naming from Neon integration
const connectionString =
  process.env.DATABASE_URL ||           // Neon integration (pooled by default)
  process.env.DATABASE_URL_POOLED ||    // Custom pooled
  process.env.DATABASE_URL!;            // Fallback

if (process.env.DATABASE_URL) {
  console.log('🔗 [DB] Using Neon integration pooled connection');
} else if (process.env.DATABASE_URL_POOLED) {
  console.log('🔗 [DB] Using custom pooled connection');
} else {
  console.log('🔗 [DB] Using direct connection');
}
```

### Option 2: Keep Current (Manual Setup)

Just set `DATABASE_URL_POOLED` in Vercel:
1. Get pooled connection string from Neon Console
2. Add to Vercel as `DATABASE_URL_POOLED`
3. Code already supports it!

## Local Development Setup

### Update .env.local

```bash
# Get pooled connection string from Neon Console
# Add to .env.local (NOT committed to git)

DATABASE_URL=postgres://user:pass@endpoint-pooler.neon.tech/db
DATABASE_URL_POOLED=postgres://user:pass@endpoint-pooler.neon.tech/db

# For migrations, keep unpooled version
DATABASE_URL_UNPOOLED=postgres://user:pass@endpoint.neon.tech/db
```

### Test Locally

```bash
# Restart dev server
pkill -f "next dev"
dotenv --file .env.local run pnpm dev > logs/dev-server.log 2>&1 &

# Check logs - should see "Using pooled connection"
tail -f logs/dev-server.log | grep "DB"
```

Expected output:
```
🔗 [DB] Using Neon pooled connection for optimal performance
```

## When to Use Each Connection Type

### Use Pooled Connection (Default)
- ✅ Application queries
- ✅ API routes
- ✅ Serverless functions
- ✅ High concurrency scenarios
- ✅ Production deployments

### Use Direct Connection (Unpooled)
- ✅ Database migrations (`drizzle-kit migrate`)
- ✅ Schema changes (`drizzle-kit push`)
- ✅ `pg_dump` / `pg_restore`
- ✅ Long-running transactions
- ✅ Prepared statements

## Drizzle Configuration for Migrations

**File**: `drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Use unpooled for migrations (required for schema changes)
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!,
  },
});
```

## Verification

### 1. Check Vercel Environment Variables

```bash
# Using Vercel CLI
vercel env ls

# Should show:
# DATABASE_URL              Production, Preview
# DATABASE_URL_POOLED       Production, Preview (if set manually)
# or
# DATABASE_URL              Production, Preview (if using integration)
```

### 2. Test Connection Locally

```bash
# Test pooled connection
psql "$DATABASE_URL_POOLED"

# You should connect successfully
# Connection should route through -pooler endpoint
```

### 3. Monitor Logs

```bash
# Check Vercel deployment logs
vercel logs

# Look for:
# "🔗 [DB] Using Neon pooled connection for optimal performance"
```

### 4. Performance Test

Before adding pooled connection:
```bash
curl -w "Time: %{time_total}s\n" https://your-app.vercel.app/novels/STORY_ID
# Time: ~2.5s
```

After adding pooled connection:
```bash
curl -w "Time: %{time_total}s\n" https://your-app.vercel.app/novels/STORY_ID
# Time: ~0.2s (should be 10-20% faster)
```

## Expected Performance Improvement

### Development (Localhost)
- Before: ~170ms query time
- After: ~150ms query time
- **Improvement**: ~10-15% faster

### Production (Vercel)
- Before: ~200ms query time
- After: ~160ms query time
- **Improvement**: ~20% faster + better scalability

### Under Load (High Concurrency)
- Before: Queries slow down significantly (connection pool exhaustion)
- After: Maintains consistent performance up to 10,000 concurrent connections

## Troubleshooting

### Error: "no such pool_mode"
**Cause**: Using pooled connection for migrations
**Solution**: Use `DATABASE_URL_UNPOOLED` for Drizzle commands

### Error: "prepared statement already exists"
**Cause**: Using pooled connection with prepared statements
**Solution**:
```typescript
const client = postgres(connectionString, {
  prepare: false,  // Required for pooled connections
});
```

### Connection Still Slow
**Check**:
1. Verify `-pooler` is in the hostname
2. Check Vercel region matches Neon region
3. Verify connection pooling enabled in code

## Best Practices

1. ✅ **Always use pooled connections** for application queries
2. ✅ **Use unpooled for migrations** and schema changes
3. ✅ **Set `prepare: false`** in postgres client config
4. ✅ **Monitor connection count** in Neon Console
5. ✅ **Keep secrets in environment variables**, never commit to git

## Resources

- [Neon Connection Pooling Docs](https://neon.com/docs/connect/connection-pooling)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Neon Vercel Integration](https://neon.com/docs/guides/vercel)
- [Drizzle with Neon](https://orm.drizzle.team/docs/get-started-postgresql#neon)

---

**Last Updated**: 2025-11-01
**Status**: Ready for Production ✅
