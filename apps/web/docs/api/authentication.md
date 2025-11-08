# Authentication APIs

User registration, login, and password management endpoints.

## Overview

Fictures supports two authentication methods for users:
- **Email/Password**: Traditional email and password authentication
- **OAuth**: Google OAuth 2.0 authentication

Additionally, API endpoints support **dual authentication**:
- **Session Authentication**: Browser-based authentication using NextAuth.js sessions
- **API Key Authentication**: Token-based authentication for programmatic access with scope-based permissions

## Endpoints

### Register New User

Create a new user account with email and password.

**Endpoint:** `POST /api/auth/register`

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User email address |
| password | string | Yes | User password (min 8 characters) |
| name | string | No | User display name |

**Success Response (200):**

```json
{
  "message": "User created successfully",
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Missing email or password |
| 409 | Conflict | User already exists with this email |
| 500 | Internal Server Error | Registration failed |

**Example:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "name": "John Doe"
  }'
```

---

### Change Password

Change the password for an authenticated user with email/password login.

**Endpoint:** `POST /api/auth/change-password`

**Authentication:** Required (Session)

**Runtime:** Node.js

**Request Body:**

```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| currentPassword | string | Yes | Current password |
| newPassword | string | Yes | New password (min 8 characters) |

**Validation Rules:**

- `currentPassword`: Required, non-empty
- `newPassword`: Minimum 8 characters
- New password must be different from current password
- Only available for email/password accounts (not OAuth users)

**Success Response (200):**

```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Invalid input, same password, or OAuth user |
| 401 | Unauthorized | Not authenticated |
| 404 | Not Found | User not found |
| 500 | Internal Server Error | Password change failed |

**Error Examples:**

```json
{
  "error": "Current password is incorrect"
}
```

```json
{
  "error": "New password must be different from current password"
}
```

```json
{
  "error": "Cannot change password for OAuth users. Password changes are only available for email/password accounts."
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "currentPassword": "oldPassword123",
    "newPassword": "newSecurePassword456"
  }'
```

---

### NextAuth Endpoints

NextAuth.js provides standard OAuth and session management endpoints.

**Base Path:** `/api/auth/[...nextauth]`

**Available Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/auth/signin | GET | Sign in page |
| /api/auth/signout | POST | Sign out |
| /api/auth/session | GET | Get current session |
| /api/auth/csrf | GET | Get CSRF token |
| /api/auth/providers | GET | List auth providers |
| /api/auth/callback/google | GET | Google OAuth callback |
| /api/auth/callback/credentials | POST | Email/password callback |

**Get Current Session:**

```bash
curl http://localhost:3000/api/auth/session \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Response:**

```json
{
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "writer",
    "image": "https://example.com/avatar.jpg"
  },
  "expires": "2024-12-31T23:59:59.999Z"
}
```

**Sign Out:**

```bash
curl -X POST http://localhost:3000/api/auth/signout \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

---

## Authentication Flow

### Email/Password Authentication

1. **Register**: `POST /api/auth/register`
2. **Login**: Navigate to `/login` and submit credentials
3. **Session**: NextAuth.js creates session cookie
4. **Authenticated Requests**: Include session cookie in requests

### Google OAuth Authentication

1. **Initiate**: Navigate to `/login` and click "Sign in with Google"
2. **Redirect**: User redirected to Google OAuth consent screen
3. **Callback**: Google redirects to `/api/auth/callback/google`
4. **Session**: NextAuth.js creates session cookie
5. **Authenticated Requests**: Include session cookie in requests

---

## User Roles

After authentication, users are assigned roles:

| Role | Permissions |
|------|-------------|
| reader | Read published stories |
| writer | Create and manage own stories |
| manager | Manage multiple stories and users |
| admin | Full system access |

Default role for new users: **reader**

---

## Dual Authentication System

The Fictures platform implements a dual authentication system that supports both traditional session-based authentication and API key-based authentication. This allows both browser-based users and programmatic clients to access protected APIs.

### Implementation

**Location**: `src/lib/auth/dual-auth.ts`

**Core Functions**:
- `authenticateRequest(request)` - Authenticate using either API key or session
- `hasRequiredScope(authResult, scope)` - Check if auth has required permission
- `requireAuth(request, scope?)` - Require authentication with optional scope check

### Authentication Priority

When processing API requests, authentication is checked in this order:

1. **API Key** (checked first)
   - `Authorization: Bearer YOUR_API_KEY` header
   - OR `x-api-key: YOUR_API_KEY` header
2. **Session** (fallback)
   - NextAuth.js session via HTTP-only cookies

### API Key Authentication

#### API Key Structure

API keys are stored in the `api_keys` table with the following fields:

```typescript
{
  id: string;                 // Unique key ID
  userId: string;             // Owner user ID
  name: string;               // Key name/description
  keyHash: string;            // Bcrypt hash of full key (64 chars)
  keyPrefix: string;          // First 16 characters for quick lookup
  scopes: string[];           // Permission scopes
  isActive: boolean;          // Active/revoked status
  lastUsedAt: Date | null;    // Last usage timestamp
  expiresAt: Date | null;     // Expiration date (optional)
  createdAt: Date;            // Creation timestamp
  updatedAt: Date;            // Last update timestamp
}
```

#### Authentication Flow

1. Extract API key from request headers (`Authorization` or `x-api-key`)
2. Get key prefix (first 16 characters)
3. Query database for matching keys by prefix
4. Verify full key hash using bcrypt
5. Check expiration and active status
6. Load user data and scopes
7. Update `lastUsedAt` timestamp (async)

#### Using API Keys

**Example Request:**

```bash
# Using Authorization header (recommended)
curl -X POST http://localhost:3000/studio/api/generation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -d '{
    "userPrompt": "A story about...",
    "preferredGenre": "fantasy"
  }'

# Using x-api-key header (alternative)
curl -X POST http://localhost:3000/studio/api/generation \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -d '{
    "userPrompt": "A story about...",
    "preferredGenre": "fantasy"
  }'
```

### Scope-Based Authorization

#### Available Scopes

| Scope | Description | Required For |
|-------|-------------|--------------|
| `stories:read` | Read story data | Viewing stories, characters, scenes |
| `stories:write` | Create and modify stories | Story generation, editing, deletion |
| `admin:all` | Full administrative access | Database operations, user management |

#### Scope Hierarchy

- `admin:all` grants all permissions (wildcard scope)
- `stories:write` implies `stories:read`
- Reader role: `stories:read` only
- Writer role: `stories:read`, `stories:write`
- Manager role: `stories:read`, `stories:write`, `admin:all`

### Implementation in API Routes

**Example 1: Basic Authentication**

```typescript
import { authenticateRequest } from '@/lib/auth/dual-auth';

export async function POST(request: NextRequest) {
  // Authenticate request (supports both API key and session)
  const authResult = await authenticateRequest(request);

  if (!authResult) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = authResult.user.id;
  // ... proceed with API logic
}
```

**Example 2: With Scope Check**

```typescript
import { authenticateRequest, hasRequiredScope } from '@/lib/auth/dual-auth';

export async function POST(request: NextRequest) {
  // Authenticate request
  const authResult = await authenticateRequest(request);

  if (!authResult) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check required scope
  if (!hasRequiredScope(authResult, 'stories:write')) {
    return new Response(
      JSON.stringify({ error: 'Insufficient permissions. Required scope: stories:write' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ... proceed with API logic
}
```

**Example 3: Using Helper Function**

```typescript
import { requireAuth } from '@/lib/auth/dual-auth';

export async function POST(request: NextRequest) {
  try {
    // Require authentication with specific scope
    const authResult = await requireAuth(request, 'stories:write');

    // Authenticated and authorized - proceed
    const userId = authResult.user.id;
    // ... API logic

  } catch (error) {
    if (error.message.includes('Insufficient permissions')) {
      return new Response(error.message, { status: 403 });
    }
    return new Response('Unauthorized', { status: 401 });
  }
}
```

### Endpoints Using Dual Authentication

The following endpoints support both session and API key authentication:

| Endpoint | Required Scope | Description |
|----------|----------------|-------------|
| `POST /studio/api/generation` | `stories:write` | Generate complete novel |
| `POST /studio/api/stories` | `stories:write` | Create new story |
| `GET /studio/api/stories` | `stories:read` | List user stories |
| `POST /api/images/generate` | `stories:write` | Generate AI images |
| `POST /api/admin/database` | `admin:all` | Execute admin database operations |

### Managing API Keys

API keys can be managed through the Settings page:

1. Navigate to `/settings/api-keys`
2. Create new API key with name and scopes
3. Copy the generated key (shown only once)
4. Revoke or delete keys as needed

**API Endpoints for Key Management:**

- `GET /settings/api/api-keys` - List user's API keys
- `POST /settings/api/api-keys` - Create new API key
- `DELETE /settings/api/api-keys/[id]` - Delete API key
- `POST /settings/api/api-keys/[id]/revoke` - Revoke API key

### Security Features

1. **Bcrypt Hashing**: Full API keys are hashed using bcrypt before storage
2. **Prefix Matching**: Quick lookup using first 16 characters
3. **Expiration Support**: Optional expiration dates for temporary keys
4. **Active Status**: Keys can be revoked without deletion
5. **Scope Isolation**: Fine-grained permission control
6. **Usage Tracking**: `lastUsedAt` timestamp for monitoring

---

## Security Considerations

### Password Requirements
- Minimum 8 characters
- Hashed using bcrypt before storage
- Never returned in API responses

### Session Management
- HTTP-only cookies for session tokens
- Secure cookies in production (HTTPS only)
- Automatic session expiration (30 days)

### API Key Security
- **Storage**: Full keys hashed with bcrypt (never stored in plain text)
- **Transmission**: Always use HTTPS in production
- **Rotation**: Regularly rotate API keys
- **Scopes**: Use minimum required scopes (principle of least privilege)
- **Expiration**: Set expiration dates for temporary keys
- **Revocation**: Immediately revoke compromised keys
- **Monitoring**: Track `lastUsedAt` for unusual activity

### CSRF Protection
- NextAuth.js provides built-in CSRF protection
- CSRF tokens automatically validated
- API key requests bypass CSRF (stateless)

### OAuth Security
- State parameter validation
- Secure redirect URI validation
- Token exchange over HTTPS

---

## Testing

### Setup Test Users

```bash
# Create test users for all roles
dotenv --file .env.local run node scripts/setup-auth-users.mjs

# Verify setup
dotenv --file .env.local run node scripts/verify-auth-setup.mjs
```

### Test Authentication Profiles

Authentication profiles are stored in `.auth/user.json`:

```json
{
  "profiles": {
    "manager": {
      "email": "manager@fictures.xyz",
      "password": "manager123",
      "role": "manager"
    },
    "writer": {
      "email": "writer@fictures.xyz",
      "password": "writer123",
      "role": "writer"
    },
    "reader": {
      "email": "reader@fictures.xyz",
      "password": "reader123",
      "role": "reader"
    }
  }
}
```

---

## Related Documentation

- [User Management APIs](./users.md)
- [Admin APIs](./admin.md) - API key authentication for admin operations
- [Authentication System](../auth/authentication-profiles.md)
- [Database Schema](../../drizzle/schema.ts)
- **Implementation Files**:
  - `src/lib/auth.ts` - NextAuth v5 configuration
  - `src/lib/auth/dual-auth.ts` - Dual authentication middleware
  - `src/lib/db/index.ts` - Database connection
  - `src/lib/db/schema.ts` - Schema exports
