# Cron APIs

Scheduled tasks for analytics aggregation and system maintenance.

## Overview

Cron APIs are automated endpoints triggered by Vercel Cron Jobs on a schedule. These endpoints perform background tasks like:
1. **Daily Analytics Aggregation**: Aggregate daily story metrics
2. **Data Cleanup**: Remove old temporary data
3. **Report Generation**: Generate periodic reports

**Authentication:** All cron endpoints require the `CRON_SECRET` for security.

---

## Authentication

### Cron Secret

All cron endpoints validate requests using the `CRON_SECRET` environment variable:

```bash
Authorization: Bearer YOUR_CRON_SECRET
```

**Setup:**

1. Generate a secure random secret:
   ```bash
   openssl rand -hex 32
   ```

2. Add to `.env.local`:
   ```bash
   CRON_SECRET=your_generated_secret_here
   ```

3. Add to Vercel environment variables (Production)

**Security:**
- Never commit `CRON_SECRET` to git
- Use different secrets for dev/prod
- Rotate secrets periodically

---

## Endpoints

### Daily Analytics Aggregation

Aggregate yesterday's analytics data into daily metrics for efficient querying.

**Endpoint:** `GET /api/cron/analytics-daily`

**Authentication:** Required (`CRON_SECRET`)

**Schedule:** Runs daily at 1:00 AM UTC (configured in `vercel.json`)

**Description:**

This cron job:
1. Identifies all stories with activity yesterday
2. Aggregates analytics events per story
3. Calculates session metrics
4. Computes engagement rates
5. Stores results in `daily_story_metrics` table

**Request:**

No parameters required. Triggered automatically by Vercel Cron.

**Success Response (200):**

```json
{
  "success": true,
  "date": "2024-01-15",
  "metricsAggregated": 42,
  "stories": [
    {
      "storyId": "story_abc123",
      "views": 150,
      "readers": 45
    },
    {
      "storyId": "story_xyz789",
      "views": 200,
      "readers": 67
    }
  ]
}
```

**Response (No Activity):**

```json
{
  "success": true,
  "message": "No activity yesterday",
  "date": "2024-01-15",
  "metricsAggregated": 0
}
```

**Error Response (401):**

```json
{
  "error": "Unauthorized"
}
```

**Error Response (500):**

```json
{
  "error": "Failed to aggregate metrics",
  "details": "Database connection timeout"
}
```

**Manual Trigger (Development):**

```bash
curl -X GET http://localhost:3000/api/cron/analytics-daily \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Manual Trigger (Production):**

```bash
curl -X GET https://fictures.xyz/api/cron/analytics-daily \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Aggregated Metrics

### Daily Story Metrics Table

The cron job populates the `daily_story_metrics` table with aggregated data.

**Schema:**

```typescript
{
  id: string;
  storyId: string;
  date: string;                    // ISO date (YYYY-MM-DD)
  totalViews: number;             // Total story views
  uniqueReaders: number;          // Unique users who viewed
  newReaders: number;             // First-time readers
  comments: number;               // Total comments
  likes: number;                  // Total likes
  shares: number;                 // Total shares
  bookmarks: number;              // Total bookmarks
  engagementRate: string;         // Percentage (e.g., "12.5")
  avgSessionDuration: number;     // Average seconds
  totalSessions: number;          // Total reading sessions
  completedSessions: number;      // Sessions that finished story
  completionRate: string;         // Percentage (e.g., "45.2")
  avgChaptersPerSession: string;  // Average chapters read (e.g., "3.5")
  mobileUsers: number;            // Mobile device users
  desktopUsers: number;           // Desktop device users
  createdAt: string;              // Timestamp of aggregation
}
```

### Calculated Metrics

**Engagement Rate:**
```typescript
((comments + likes + shares) / totalViews) * 100
```

**Completion Rate:**
```typescript
(completedSessions / totalSessions) * 100
```

**Average Chapters Per Session:**
```typescript
avg(chaptersRead) across all sessions
```

---

## Cron Schedule Configuration

### Vercel Cron Setup

Cron jobs are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/analytics-daily",
      "schedule": "0 1 * * *"
    }
  ]
}
```

### Schedule Format

Uses standard cron syntax: `minute hour day month dayOfWeek`

| Schedule | Description | Format |
|----------|-------------|--------|
| Daily at 1 AM UTC | Analytics aggregation | `0 1 * * *` |
| Every hour | Hourly tasks | `0 * * * *` |
| Every 15 min | Frequent tasks | `*/15 * * * *` |
| Weekly Sunday 2 AM | Weekly cleanup | `0 2 * * 0` |

**Examples:**

```json
{
  "crons": [
    {
      "path": "/api/cron/analytics-daily",
      "schedule": "0 1 * * *"
    },
    {
      "path": "/api/cron/cleanup-temp",
      "schedule": "0 2 * * 0"
    },
    {
      "path": "/api/cron/generate-reports",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

---

## Data Aggregation Process

### Step-by-Step Process

**1. Identify Active Stories:**

```sql
SELECT DISTINCT story_id
FROM analysis_events
WHERE timestamp >= '2024-01-15 00:00:00'
  AND timestamp <= '2024-01-15 23:59:59'
```

**2. Aggregate Event Metrics:**

For each story:

```sql
SELECT
  COUNT(DISTINCT CASE WHEN event_type = 'story_view' THEN id END) as total_views,
  COUNT(DISTINCT user_id) as unique_readers,
  COUNT(CASE WHEN event_type = 'comment_created' THEN 1 END) as comments,
  COUNT(CASE WHEN event_type = 'story_liked' THEN 1 END) as likes,
  COUNT(CASE WHEN event_type = 'share' THEN 1 END) as shares,
  COUNT(CASE WHEN event_type = 'bookmark' THEN 1 END) as bookmarks,
  COUNT(DISTINCT CASE WHEN metadata->>'deviceType' = 'mobile' THEN user_id END) as mobile_users,
  COUNT(DISTINCT CASE WHEN metadata->>'deviceType' = 'desktop' THEN user_id END) as desktop_users
FROM analysis_events
WHERE story_id = 'story_abc123'
  AND timestamp >= '2024-01-15 00:00:00'
  AND timestamp <= '2024-01-15 23:59:59'
```

**3. Aggregate Session Metrics:**

```sql
SELECT
  AVG(duration_seconds) as avg_duration,
  COUNT(id) as total_sessions,
  COUNT(CASE WHEN completed_story = true THEN 1 END) as completed_sessions,
  AVG(chapters_read) as avg_chapters
FROM reading_sessions
WHERE story_id = 'story_abc123'
  AND start_time >= '2024-01-15 00:00:00'
  AND start_time <= '2024-01-15 23:59:59'
```

**4. Calculate Rates:**

```typescript
const engagementRate = ((comments + likes + shares) / totalViews) * 100
const completionRate = (completedSessions / totalSessions) * 100
const avgChaptersPerSession = avgChapters
```

**5. Insert Daily Metrics:**

```sql
INSERT INTO daily_story_metrics (
  id, story_id, date, total_views, unique_readers,
  comments, likes, shares, engagement_rate,
  avg_session_duration, completion_rate, ...
) VALUES (...)
```

---

## Monitoring

### Successful Execution Log

```
✅ Aggregated 42 daily metrics for 2024-01-15
```

### Error Execution Log

```
❌ Failed to aggregate daily metrics: Database connection timeout
```

### Metrics to Monitor

1. **Execution Time**: Should complete in < 5 minutes
2. **Stories Processed**: Number of active stories
3. **Success Rate**: Percentage of successful runs
4. **Error Rate**: Failed aggregations per day

### Vercel Cron Logs

View cron execution logs in Vercel Dashboard:

1. Go to Vercel Dashboard
2. Select your project
3. Navigate to "Cron Jobs" tab
4. View execution history and logs

---

## Testing

### Test Locally

```bash
# Set CRON_SECRET in .env.local
echo "CRON_SECRET=$(openssl rand -hex 32)" >> .env.local

# Run development server
dotenv --file .env.local run pnpm dev

# Trigger cron manually
curl -X GET http://localhost:3000/api/cron/analytics-daily \
  -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2)"
```

### Test with Sample Data

```bash
# Create test stories and generate analytics events
dotenv --file .env.local run node scripts/seed-analytics-data.mjs

# Run aggregation
curl -X GET http://localhost:3000/api/cron/analytics-daily \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Verify results in database
dotenv --file .env.local run pnpm db:studio
```

### Test Error Handling

```bash
# Test without auth
curl -X GET http://localhost:3000/api/cron/analytics-daily
# Expected: 401 Unauthorized

# Test with invalid secret
curl -X GET http://localhost:3000/api/cron/analytics-daily \
  -H "Authorization: Bearer invalid_secret"
# Expected: 401 Unauthorized
```

---

## Deployment

### Setup in Vercel

1. **Add CRON_SECRET to Environment Variables:**
   ```bash
   # Vercel Dashboard > Settings > Environment Variables
   CRON_SECRET=your_generated_secret_here
   ```

2. **Ensure vercel.json is configured:**
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/analytics-daily",
         "schedule": "0 1 * * *"
       }
     ]
   }
   ```

3. **Deploy to Vercel:**
   ```bash
   git push origin main
   ```

4. **Verify Cron Setup:**
   - Go to Vercel Dashboard → Project → Cron Jobs
   - Verify cron appears in list
   - Check next scheduled run time

---

## Best Practices

### Cron Job Design

1. **Idempotent**: Can run multiple times without side effects
2. **Fast**: Complete within timeout limits (10 minutes on Hobby, 5 minutes on Pro)
3. **Atomic**: Use transactions for database operations
4. **Logged**: Always log start, success, and errors
5. **Monitored**: Track execution metrics

### Error Handling

```typescript
try {
  // Cron job logic
  console.log('✅ Cron job completed successfully');
  return Response.json({ success: true });
} catch (error) {
  console.error('❌ Cron job failed:', error);
  return Response.json(
    { error: 'Cron job failed', details: error.message },
    { status: 500 }
  );
}
```

### Performance Optimization

1. **Batch Processing**: Process multiple records in batches
2. **Indexes**: Ensure database indexes on timestamp columns
3. **Pagination**: For large datasets, process in chunks
4. **Caching**: Cache frequently accessed data
5. **Parallel Processing**: Use Promise.all for independent tasks

---

## Troubleshooting

### Cron Not Running

**Possible Causes:**
- Cron not configured in `vercel.json`
- Project not deployed to Vercel
- Cron disabled in Vercel settings

**Solution:**
1. Check `vercel.json` configuration
2. Redeploy project
3. Verify in Vercel Dashboard → Cron Jobs

### Authentication Failures

**Possible Causes:**
- `CRON_SECRET` not set in environment
- Incorrect secret value
- Missing Authorization header

**Solution:**
1. Verify `CRON_SECRET` in Vercel environment variables
2. Check secret matches in code and Vercel
3. Test with manual trigger

### Timeout Errors

**Possible Causes:**
- Processing too many records
- Slow database queries
- External API delays

**Solution:**
1. Optimize database queries with indexes
2. Add pagination for large datasets
3. Increase Vercel timeout (Pro plan)
4. Process in smaller batches

---

## Rate Limits

Vercel Cron execution limits:

| Plan | Max Execution Time | Max Crons | Frequency |
|------|-------------------|-----------|-----------|
| Hobby | 10 seconds | 1 | Every minute |
| Pro | 5 minutes | 100 | Every minute |
| Enterprise | 15 minutes | Unlimited | Any |

---

## Related Documentation

- [Analytics System](../analysis/analysis-specification.md)
- [Data Tracking Strategy](../analysis/data-tracking-strategy.md)
- [Daily Story Metrics Schema](../../drizzle/schema.ts)
- [Vercel Cron Documentation](https://vercel.com/docs/cron-jobs)
