# API Key Generation Guide

This guide explains how to generate and use API keys for the Fictures platform.

## What are API Keys?

API keys allow you to authenticate programmatically with the Fictures API without using a web browser session. They're useful for:

- Running automated scripts
- Integrating with external tools
- Testing API endpoints
- Building custom applications

## How to Generate an API Key

### Method 1: Web UI (Recommended)

1. **Log in to Fictures**
   - Go to http://localhost:3000 (or your deployment URL)
   - Sign in with your Google account

2. **Navigate to Settings**
   - Click on your profile or settings icon
   - Go to "API Keys" section
   - Or visit directly: http://localhost:3000/settings/api-keys

3. **Create New API Key**
   - Click "Create API Key" or similar button
   - Enter a name for your key (e.g., "Development", "Testing", "Production")
   - Select the scopes (permissions) you need:
     - `stories:read` - Read stories
     - `stories:write` - Create and modify stories
     - `stories:delete` - Delete stories
     - Add other scopes as needed
   - (Optional) Set an expiration date
   - Click "Create"

4. **Save Your API Key**
   - **IMPORTANT**: Copy and save the API key immediately
   - You will **not** be able to see it again
   - Store it securely (e.g., in your `.env.local` file)

### Method 2: API Endpoint

You can also create an API key programmatically if you're already authenticated:

```bash
curl -X POST http://localhost:3000/api/settings/api-keys \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "My API Key",
    "scopes": ["stories:read", "stories:write"],
    "expiresAt": "2025-12-31T23:59:59Z"
  }'
```

**Response:**
```json
{
  "apiKey": {
    "id": "key_abc123",
    "name": "My API Key",
    "key": "fic_live_abc123def456...",
    "keyPrefix": "fic_live_abc123",
    "scopes": ["stories:read", "stories:write"],
    "expiresAt": "2025-12-31T23:59:59.000Z",
    "isActive": true,
    "createdAt": "2025-01-21T..."
  },
  "warning": "Save this API key now. You will not be able to see it again."
}
```

## Using Your API Key

### In Scripts

Add your API key to `.env.local`:

```bash
# .env.local
TEST_API_KEY=fic_live_abc123def456...
```

Then use it in your scripts:

```javascript
const API_KEY = process.env.TEST_API_KEY;

const response = await fetch('http://localhost:3000/api/stories/generate-hns', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  },
  body: JSON.stringify({
    prompt: 'Your story idea',
    language: 'English',
  }),
});
```

### In curl Commands

```bash
curl -X GET http://localhost:3000/api/stories/abc123/download \
  -H "Authorization: Bearer fic_live_abc123def456..." \
  -o story.zip
```

### Using the Download Scripts

The download scripts automatically use the `TEST_API_KEY` from your environment:

```bash
# Set in .env.local
TEST_API_KEY=fic_live_abc123def456...

# Run the script
dotenv --file .env.local run node scripts/download-story.mjs <story-id>
```

## Available Scopes

| Scope | Description |
|-------|-------------|
| `stories:read` | Read stories, chapters, scenes |
| `stories:write` | Create and modify stories |
| `stories:delete` | Delete stories |
| `characters:read` | Read character data |
| `characters:write` | Create and modify characters |
| `settings:read` | Read setting data |
| `settings:write` | Create and modify settings |

## Managing API Keys

### List Your API Keys

**Web UI:** Visit http://localhost:3000/settings/api-keys

**API Endpoint:**
```bash
curl -X GET http://localhost:3000/api/settings/api-keys \
  -H "Cookie: your-session-cookie"
```

### Revoke an API Key

**Web UI:**
1. Go to http://localhost:3000/settings/api-keys
2. Find the key you want to revoke
3. Click "Revoke" or "Delete"

**API Endpoint:**
```bash
curl -X DELETE http://localhost:3000/api/settings/api-keys/{key-id}/revoke \
  -H "Cookie: your-session-cookie"
```

### Update API Key

You can update the name, scopes, or expiration:

```bash
curl -X PATCH http://localhost:3000/api/settings/api-keys/{key-id} \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "Updated Name",
    "scopes": ["stories:read", "stories:write", "stories:delete"]
  }'
```

## Security Best Practices

1. **Keep API Keys Secret**
   - Never commit API keys to git
   - Store them in `.env.local` (already in `.gitignore`)
   - Don't share them in public channels

2. **Use Minimal Scopes**
   - Only grant the permissions you need
   - For read-only operations, use `stories:read` only
   - For testing, create a separate key with limited scopes

3. **Set Expiration Dates**
   - For temporary use, set an expiration date
   - Regularly rotate long-lived keys
   - Revoke keys you're no longer using

4. **Monitor Usage**
   - Check the "Last Used" date in the API keys list
   - Revoke unused keys
   - Create separate keys for different purposes

5. **Session Authentication Required**
   - You must be logged in via session to manage API keys
   - API keys cannot be used to create or manage other API keys
   - This prevents key compromise from escalating

## Troubleshooting

### "Authentication required" Error

**Problem:** API returns 401 Unauthorized

**Solutions:**
1. Verify your API key is correct
2. Check the Authorization header format: `Bearer {your-key}`
3. Ensure the key hasn't expired
4. Verify the key is still active (not revoked)

### "Insufficient permissions" Error

**Problem:** API returns 403 Forbidden with "Insufficient permissions"

**Solutions:**
1. Check which scope is required (shown in error message)
2. Update your API key to include that scope
3. Or create a new key with the required scopes

### Can't Create API Keys

**Problem:** "Session authentication required for API key management"

**Solutions:**
1. You must be logged in via the web browser
2. API keys cannot be used to create other API keys
3. Log in at http://localhost:3000 first

### API Key Not Working

**Checklist:**
- [ ] API key is correctly copied (including prefix)
- [ ] Authorization header format is correct: `Bearer {key}`
- [ ] Key has not expired
- [ ] Key is still active (not revoked)
- [ ] Key has the required scopes for the operation
- [ ] Development server is running

## Quick Start Example

Here's a complete example of generating an API key and using it:

```bash
# 1. Log in to the web app
open http://localhost:3000

# 2. Navigate to API Keys settings
# Go to Settings > API Keys

# 3. Create a new key with scopes:
#    - stories:read
#    - stories:write

# 4. Copy the generated key and add to .env.local
echo "TEST_API_KEY=fic_live_abc123def..." >> .env.local

# 5. Test the key by downloading a story
dotenv --file .env.local run node scripts/download-story.mjs <story-id>

# 6. Or generate a new story
dotenv --file .env.local run node scripts/test-story-download.mjs
```

## API Endpoints Summary

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/settings/api-keys` | GET | List your API keys | Session only |
| `/api/settings/api-keys` | POST | Create new API key | Session only |
| `/api/settings/api-keys/{id}` | PATCH | Update API key | Session only |
| `/api/settings/api-keys/{id}` | DELETE | Delete API key | Session only |
| `/api/settings/api-keys/{id}/revoke` | POST | Revoke API key | Session only |
| `/api/stories/generate-hns` | POST | Generate story | Session or API key |
| `/api/stories/{id}/download` | GET | Download story | Session or API key |

## Further Reading

- [Story Download API Documentation](./story-download-api.md)
- [Scripts README](../scripts/readme.md)
- [Main Project Documentation](../CLAUDE.md)
