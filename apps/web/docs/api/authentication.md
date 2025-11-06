# Authentication APIs

User registration, login, and password management endpoints.

## Overview

Fictures supports two authentication methods:
- **Email/Password**: Traditional email and password authentication
- **OAuth**: Google OAuth 2.0 authentication

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

## Security Considerations

### Password Requirements
- Minimum 8 characters
- Hashed using bcrypt before storage
- Never returned in API responses

### Session Management
- HTTP-only cookies for session tokens
- Secure cookies in production (HTTPS only)
- Automatic session expiration (30 days)

### CSRF Protection
- NextAuth.js provides built-in CSRF protection
- CSRF tokens automatically validated

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
- [Authentication System](../auth/authentication-profiles.md)
- [Database Schema](../../drizzle/schema.ts)
