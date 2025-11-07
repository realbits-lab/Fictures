# AI Server Authentication

Simple and secure API key authentication using PostgreSQL database.

## Overview

The AI server validates API keys against the web application's PostgreSQL database, ensuring consistent authentication across all services.

**Two database queries per request**:
1. Query API key by prefix and verify hash
2. Query user information

Clean, efficient, and production-ready.

## Quick Start

### 1. Configure Database

Add to `.env`:

```bash
DATABASE_URL=postgresql://user:password@host-pooler.region.aws.neon.tech:5432/database
REQUIRE_API_KEY=true
```

### 2. Create API Key

Via web application at `/settings/api-keys`:
1. Create new API key with `stories:write` scope
2. Copy the generated key (shown only once)

### 3. Use API Key

```bash
curl -X POST "http://localhost:8000/api/v1/images/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "prompt": "A sunset over mountains",
    "width": 1024,
    "height": 1024
  }'
```

## Authentication Flow

```
Request with API Key
    ↓
Extract from Header (Authorization: Bearer or x-api-key)
    ↓
Query 1: Find API key by prefix (key_prefix = first 16 chars)
    ↓
Verify bcrypt hash
    ↓
Check active status & expiration
    ↓
Query 2: Get user info (id, email, role)
    ↓
Update last_used_at (async)
    ↓
Return AuthResult with scopes
    ↓
✅ Request authorized
```

## Configuration

### Environment Variables

```bash
# Database Configuration (required)
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication (optional, defaults to true)
REQUIRE_API_KEY=true
```

### Database Connection

Use the same `DATABASE_URL` from the web application:
- **Production**: Pooled connection (`-pooler` in hostname for Neon)
- **Development**: Can use same connection string

**Example Neon connection**:
```
postgresql://user:password@host-pooler.region.aws.neon.tech:5432/database
```

## API Key Scopes

| Scope | Description | Required For |
|-------|-------------|--------------|
| `stories:read` | Read story data | Model listing endpoints |
| `stories:write` | Create and modify stories | Generation endpoints |
| `admin:all` | Full administrative access | All endpoints (wildcard) |

### Scope Hierarchy

- `admin:all` grants all permissions (wildcard)
- `stories:write` implies `stories:read`

## Protected Endpoints

### Text Generation
- `POST /api/v1/text/generate` - Requires `stories:write`
- `POST /api/v1/text/stream` - Requires `stories:write`
- `GET /api/v1/text/models` - Requires any valid API key

### Image Generation
- `POST /api/v1/images/generate` - Requires `stories:write`
- `GET /api/v1/images/models` - Requires any valid API key

## Usage Examples

### cURL

```bash
# Generate image
curl -X POST "http://localhost:8000/api/v1/images/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "prompt": "A beautiful landscape",
    "width": 1024,
    "height": 1024
  }'

# Alternative header format
curl -X POST "http://localhost:8000/api/v1/images/generate" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "prompt": "A beautiful landscape",
    "width": 1024,
    "height": 1024
  }'
```

### Python

```python
import httpx
import os

async def generate_image():
    api_key = os.getenv("FICTURES_API_KEY")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/v1/images/generate",
            json={
                "prompt": "A serene lake at sunset",
                "width": 1024,
                "height": 1024
            },
            headers={"Authorization": f"Bearer {api_key}"}
        )
        return response.json()
```

### JavaScript

```javascript
const apiKey = process.env.FICTURES_API_KEY;

const response = await fetch('http://localhost:8000/api/v1/images/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    prompt: 'A serene lake at sunset',
    width: 1024,
    height: 1024
  })
});

const result = await response.json();
```

## Error Responses

### 401 Unauthorized

**Missing API key**:
```json
{
  "detail": "API key required. Provide via 'Authorization: Bearer YOUR_API_KEY' or 'x-api-key: YOUR_API_KEY' header"
}
```

**Invalid or expired API key**:
```json
{
  "detail": "Invalid or expired API key"
}
```

### 403 Forbidden

**Insufficient permissions**:
```json
{
  "detail": "Insufficient permissions. Required scope: stories:write"
}
```

### 500 Internal Server Error

**Database not configured**:
```json
{
  "detail": "Database not configured for authentication"
}
```

**Database connection failed**:
```json
{
  "detail": "Database connection failed"
}
```

## Managing API Keys

API keys are managed through the web application at `/settings/api-keys`.

### Create API Key

1. Navigate to `/settings/api-keys`
2. Click "Create new API key"
3. Enter name and select scopes
4. Copy the generated key (shown only once)
5. Store securely (never commit to git)

### Revoke API Key

1. Navigate to `/settings/api-keys`
2. Find the key to revoke
3. Click "Revoke" or "Delete"

### API Endpoints (Web App)

- `GET /settings/api/api-keys` - List your API keys
- `POST /settings/api/api-keys` - Create new API key
- `DELETE /settings/api/api-keys/[id]` - Delete API key
- `POST /settings/api/api-keys/[id]/revoke` - Revoke API key

## Development Mode

For development, you can disable authentication:

```bash
REQUIRE_API_KEY=false
```

**⚠️ WARNING**:
- Never use in production
- Bypasses all security checks
- Uses mock user with full permissions
- Only for local debugging

When disabled:
- No database queries
- All requests authorized as `dev@localhost` with `admin:all` scope
- Warning logged on each request

## Security Considerations

### API Key Storage
- Keys are hashed with bcrypt before storage
- Only hash is stored in database
- Original key never stored or logged

### Database Security
- Use secure connection strings
- Store `DATABASE_URL` in environment variables
- Never commit credentials to version control
- Use connection pooling for performance

### Key Rotation
- Regularly rotate API keys
- Set expiration dates on temporary keys
- Revoke compromised keys immediately
- Monitor `last_used_at` for unusual activity

### Scope Minimization
- Use minimum required scopes (principle of least privilege)
- Don't grant `admin:all` unless necessary
- Separate keys for different services

## Performance

- **2 database queries per authenticated request**:
  1. API key lookup and verification (~10-20ms)
  2. User information retrieval (~5-10ms)
- Connection pooling reduces overhead
- `last_used_at` update is async (fire-and-forget)
- Total authentication overhead: ~15-30ms

## Troubleshooting

### "Database not configured for authentication"

**Cause**: `DATABASE_URL` not set

**Solution**:
```bash
# Add to .env
DATABASE_URL=postgresql://user:password@host:5432/database
```

### "Database connection failed"

**Cause**: Invalid connection string or network issue

**Solution**:
- Verify `DATABASE_URL` format
- Check database server is accessible
- Ensure firewall allows connection
- For Neon, use pooled connection URL

### "Invalid or expired API key"

**Cause**:
- Wrong API key
- Key has been revoked
- Key has expired

**Solution**:
- Verify API key is correct
- Check key status in web app
- Create new API key if needed

### "Insufficient permissions"

**Cause**: API key doesn't have required scope

**Solution**:
- Check required scope for endpoint
- Create new API key with correct scopes

## Implementation Details

**Module**: `src/auth.py`

**Key Functions**:
- `verify_api_key(api_key)` - Validate against database
- `require_api_key()` - FastAPI dependency
- `require_scope(scope)` - Scope-specific dependency
- `AuthResult.has_scope(scope)` - Permission check

**Database Schema** (`api_keys` table):

```sql
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name VARCHAR(255) DEFAULT 'API Key',
  key_hash VARCHAR(64) NOT NULL,
  key_prefix VARCHAR(16) NOT NULL,
  scopes JSON DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Related Documentation

- **Web App Authentication**: `../../web/docs/api/authentication.md`
- **API Reference**: `../api/api-reference.md`
- **Database Schema**: `../../web/drizzle/schema.ts`
- **Setup Guide**: `./setup.md`
