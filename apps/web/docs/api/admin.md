# Admin APIs

Administrative operations requiring elevated permissions.

## Overview

The Admin APIs provide endpoints for system administration tasks:
1. **Database Operations**: Execute administrative database queries
2. **System Maintenance**: Cleanup and maintenance tasks

**IMPORTANT:** All admin endpoints require:
- API key authentication with `admin:all` scope
- OR admin-level session authentication

---

## Authentication

Admin endpoints support dual authentication:

### API Key Authentication (Recommended)

```bash
Authorization: Bearer YOUR_ADMIN_API_KEY
```

The API key must have the `admin:all` scope.

### Session Authentication (Alternative)

Use NextAuth session with `admin` role:

```bash
Cookie: next-auth.session-token=YOUR_ADMIN_SESSION_TOKEN
```

---

## Endpoints

### Execute Database Query

Execute administrative database queries with safety restrictions.

**Endpoint:** `POST /api/admin/database`

**Authentication:** Required (API Key with `admin:all` scope OR Admin Session)

**Request Body:**

```json
{
  "query": "DELETE FROM stories WHERE id = 'story_123'"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| query | string | Yes | SQL query to execute |

**Allowed Queries:**

For security, only specific query types are allowed:

| Query Type | Pattern | Purpose |
|------------|---------|---------|
| Delete Stories | `DELETE FROM stories` | Remove story records |

**Restrictions:**

- Only `DELETE FROM stories` queries are allowed
- Other query types will be rejected
- Prevents accidental data modification
- Cascading deletions are handled automatically

**Success Response (200):**

```json
{
  "success": true,
  "message": "Database cleanup completed"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Missing query or invalid query type |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions (requires `admin:all` scope) |
| 500 | Internal Server Error | Query execution failed |

**Example - API Key Authentication:**

```bash
curl -X POST http://localhost:3000/api/admin/database \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -d '{
    "query": "DELETE FROM stories WHERE id = '\''story_123'\''"
  }'
```

**Example - Session Authentication:**

```bash
curl -X POST http://localhost:3000/api/admin/database \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_ADMIN_SESSION_TOKEN" \
  -d '{
    "query": "DELETE FROM stories WHERE id = '\''story_123'\''"
  }'
```

---

## Database Operations

### Delete Stories

Remove stories and all associated data using cascade deletion.

**Query Pattern:**

```sql
DELETE FROM stories WHERE id = 'story_123'
```

**What Gets Deleted (Cascading):**

When you delete a story, the following are automatically removed:

1. **Story Content:**
   - Parts (story sections)
   - Chapters
   - Scenes

2. **Story Assets:**
   - Characters
   - Settings
   - AI interactions

3. **Community Data:**
   - Community posts
   - Likes
   - Comments/replies
   - Bookmarks

4. **Analytics Data:**
   - Reading sessions
   - Analysis events
   - Daily metrics

5. **Blob Storage:**
   - Story images NOT automatically deleted
   - Use story removal scripts for complete cleanup

**Database Cascade Rules:**

Defined in `drizzle/schema.ts`:

```typescript
parts: onDelete('cascade')
chapters: onDelete('cascade')
scenes: onDelete('cascade')
characters: onDelete('cascade')
settings: onDelete('cascade')
communityPosts: onDelete('cascade')
// ... and more
```

### Bulk Delete Stories

Delete multiple stories in one query:

```sql
DELETE FROM stories WHERE id IN ('story_1', 'story_2', 'story_3')
```

### Delete by Condition

Delete stories matching conditions:

```sql
DELETE FROM stories WHERE created_at < '2024-01-01'
```

**WARNING:** Always test queries on development environment first!

---

## Safety Features

### Query Whitelist

Only safe, approved query patterns are allowed:

- ✅ `DELETE FROM stories WHERE ...`
- ❌ `DROP TABLE ...`
- ❌ `UPDATE users SET ...`
- ❌ `INSERT INTO ...`
- ❌ `ALTER TABLE ...`

### Authentication Requirements

Three-level security:

1. **Authentication**: Valid API key or session required
2. **Authorization**: Must have `admin:all` scope or admin role
3. **Validation**: Query must match allowed patterns

### Audit Logging

All database operations are logged:

```
🗑️ Executing database cleanup: DELETE FROM stories WHERE id = 'story_123'
✅ Database cleanup completed
```

---

## Complete Story Removal

For complete story removal including blob storage, use the provided scripts:

### Remove Single Story

```bash
# Basic removal
dotenv --file .env.local run node scripts/remove-story.mjs STORY_ID

# With dry run
dotenv --file .env.local run node scripts/remove-story.mjs STORY_ID --dry-run

# Background execution
dotenv --file .env.local run node scripts/remove-story.mjs STORY_ID > logs/removal.log 2>&1 &
```

### Remove All Stories

```bash
# Requires confirmation
dotenv --file .env.local run node scripts/remove-all-stories.mjs --confirm

# Dry run to preview
dotenv --file .env.local run node scripts/remove-all-stories.mjs --dry-run
```

**What These Scripts Do:**

1. Delete database records (via cascade)
2. Remove blob storage images
3. Clean up all variants and optimized versions
4. Provide detailed logging
5. Support dry-run mode for safety

---

## API Key Management

### Create Admin API Key

Admin API keys are created via database or setup scripts.

**Required Scopes for Admin Operations:**

```json
{
  "scopes": ["admin:all"]
}
```

**API Key Structure:**

```typescript
{
  id: string;
  userId: string;
  keyHash: string;
  name: string;
  scopes: string[];
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}
```

### Check API Key Permissions

```bash
# Verify API key has admin:all scope
curl http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Error Handling

### Invalid Query Type

```json
{
  "success": false,
  "error": "Database operation failed",
  "details": "Only DELETE FROM stories is allowed"
}
```

### Authentication Failed

```json
{
  "error": "Authentication required"
}
```

### Insufficient Permissions

```json
{
  "error": "Insufficient permissions. Required scope: admin:all"
}
```

### Query Execution Failed

```json
{
  "success": false,
  "error": "Database operation failed",
  "details": "Foreign key constraint violation"
}
```

---

## Testing

### Test Database Query (Development)

```bash
# Set up test story first
STORY_ID=$(dotenv --file .env.local run node scripts/generate-minimal-story.mjs | grep "Story ID" | cut -d: -f2 | tr -d ' ')

# Test deletion
curl -X POST http://localhost:3000/api/admin/database \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(cat .env.local | grep ADMIN_API_KEY | cut -d= -f2)" \
  -d "{
    \"query\": \"DELETE FROM stories WHERE id = '$STORY_ID'\"
  }"
```

### Test with Admin Session

```bash
# Login as admin first
# Then use session cookie

curl -X POST http://localhost:3000/api/admin/database \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .auth/admin-cookie.txt)" \
  -d '{
    "query": "DELETE FROM stories WHERE created_at < '\''2024-01-01'\''"
  }'
```

---

## Best Practices

### Database Operations

1. **Always use dry-run first**: Test queries in development
2. **Backup before deletion**: Take database backup
3. **Use removal scripts**: For complete cleanup including blobs
4. **Check cascade effects**: Understand what gets deleted
5. **Monitor logs**: Check operation completed successfully

### Security

1. **Rotate API keys**: Change admin keys regularly
2. **Limit key scope**: Use minimum required permissions
3. **Audit regularly**: Review admin operation logs
4. **Secure storage**: Never commit API keys to git
5. **Use HTTPS**: Always in production

### Error Recovery

1. **Transaction safety**: Database operations are atomic
2. **Rollback capability**: Keep backups for recovery
3. **Verify deletion**: Check records removed correctly
4. **Clean orphans**: Remove associated blob files

---

## Monitoring

### Operation Logs

All admin operations are logged with emojis for visibility:

```
🗑️ Executing database cleanup: DELETE FROM stories...
✅ Database cleanup completed
```

### Error Logs

Errors are logged with details:

```
❌ Database operation error: Foreign key constraint violation
```

### Metrics to Monitor

- Number of stories deleted per day
- API key usage frequency
- Failed operation attempts
- Average operation duration

---

## Rate Limits

| Operation | Limit | Time Window |
|-----------|-------|-------------|
| Database Operations | 10 requests | per minute |

---

## Related Documentation

- [Story Removal](../novels/novels-removal.md)
- [User Management APIs](./users.md)
- [Authentication APIs](./authentication.md)
- [Database Schema](../../drizzle/schema.ts)
- [Removal Scripts](../../scripts/CLAUDE.md)
