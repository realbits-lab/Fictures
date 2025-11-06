# User Management APIs

User role management and profile updates.

## Overview

The User Management APIs provide endpoints for:
1. **Role Management**: Update user roles and permissions
2. **Profile Management**: Manage user information (via NextAuth session)

---

## Endpoints

### Update User Role by ID

Update a user's role using their user ID.

**Endpoint:** `PATCH /api/users/[userId]/role`

**Authentication:** Required (Admin only)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User ID to update |

**Request Body:**

```json
{
  "role": "writer"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| role | string | Yes | New user role: `reader`, `writer`, `manager`, `admin` |

**Available Roles:**

| Role | Permissions | Description |
|------|-------------|-------------|
| reader | Read-only | Can read published stories |
| writer | Create & Edit | Can create and manage own stories |
| manager | Manage | Can manage multiple stories and users |
| admin | Full Access | Complete system access |

**Success Response (200):**

```json
{
  "message": "User role updated successfully",
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "writer"
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Invalid role value |
| 404 | Not Found | User not found |
| 500 | Internal Server Error | Update failed |

**Example:**

```bash
curl -X PATCH http://localhost:3000/api/users/user_abc123/role \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_ADMIN_SESSION_TOKEN" \
  -d '{
    "role": "writer"
  }'
```

---

### Update User Role by Email

Update a user's role using their email address (convenience endpoint).

**Endpoint:** `POST /api/users/[userId]/role`

**Authentication:** Required (Admin only)

**Note:** Despite the URL parameter, this endpoint uses the email from request body to identify the user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "role": "writer"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User email address |
| role | string | Yes | New user role: `reader`, `writer`, `manager`, `admin` |

**Success Response (200):**

```json
{
  "message": "User role updated successfully",
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "writer"
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Missing email/role or invalid role |
| 404 | Not Found | User not found with provided email |
| 500 | Internal Server Error | Update failed |

**Example:**

```bash
curl -X POST http://localhost:3000/api/users/user_any/role \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_ADMIN_SESSION_TOKEN" \
  -d '{
    "email": "user@example.com",
    "role": "writer"
  }'
```

---

## User Roles & Permissions

### Role Hierarchy

```
admin (highest)
  ↓
manager
  ↓
writer
  ↓
reader (lowest)
```

### Detailed Permissions

#### Reader
**Access:**
- Browse published stories
- Read story content
- View community posts
- Basic profile settings

**Restrictions:**
- Cannot create stories
- Cannot publish content
- Cannot access Studio
- Cannot access Analytics

#### Writer
**Access:**
- All Reader permissions
- Create and edit own stories
- Access Studio workspace
- Generate AI content
- Upload images
- View own story analytics
- Publish stories to community

**Restrictions:**
- Cannot manage other users
- Cannot access admin features
- Cannot modify global settings

#### Manager
**Access:**
- All Writer permissions
- Manage multiple writers
- Access team analytics
- Moderate community content
- Manage story publications

**Restrictions:**
- Cannot access system admin features
- Cannot manage other managers
- Limited database access

#### Admin
**Access:**
- All Manager permissions
- Full system access
- User management
- Database operations
- System configuration
- Analytics aggregation
- Cron job management

**Restrictions:**
- None (full access)

---

## Role Assignment Workflow

### Initial Registration
1. User registers via `/api/auth/register`
2. Default role assigned: **reader**
3. User can browse and read content

### Role Upgrade Process
1. Admin reviews user request
2. Admin calls role update API
3. User receives updated permissions immediately
4. No re-login required

### Role Management Best Practices

**For Admins:**
- Start with `reader` role by default
- Promote to `writer` after verification
- Use `manager` sparingly for team leads
- Keep `admin` role for platform administrators only

**Security Considerations:**
- Only admins can update roles
- Role changes are logged
- Verify user identity before promotion
- Review permissions regularly

---

## Testing

### Setup Test Users

Create test users with different roles:

```bash
# Create all test users (manager, writer, reader)
dotenv --file .env.local run node scripts/setup-auth-users.mjs

# Verify users were created correctly
dotenv --file .env.local run node scripts/verify-auth-setup.mjs
```

### Test Role Update by ID

```bash
# Get user ID first
USER_ID="user_abc123"

# Update role
curl -X PATCH "http://localhost:3000/api/users/${USER_ID}/role" \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .auth/admin-cookie.txt)" \
  -d '{
    "role": "writer"
  }'
```

### Test Role Update by Email

```bash
curl -X POST http://localhost:3000/api/users/any/role \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .auth/admin-cookie.txt)" \
  -d '{
    "email": "user@example.com",
    "role": "writer"
  }'
```

### Verify Role Change

```bash
# Check current session
curl http://localhost:3000/api/auth/session \
  -H "Cookie: $(cat .auth/user-cookie.txt)"
```

---

## User Management Scripts

### Available Scripts

**Setup Authentication Users:**
```bash
dotenv --file .env.local run node scripts/setup-auth-users.mjs
```
Creates three test users:
- manager@fictures.xyz (role: manager)
- writer@fictures.xyz (role: writer)
- reader@fictures.xyz (role: reader)

**Verify Authentication Setup:**
```bash
dotenv --file .env.local run node scripts/verify-auth-setup.mjs
```
Verifies test users exist with correct roles.

---

## Database Schema

### Users Table

```typescript
{
  id: string;              // Primary key
  email: string;           // Unique email
  name: string | null;     // Display name
  password: string | null; // Hashed password (null for OAuth)
  role: string;            // User role
  image: string | null;    // Profile image URL
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Role Field

- **Type**: String (enum)
- **Values**: `reader`, `writer`, `manager`, `admin`
- **Default**: `reader`
- **Indexed**: Yes (for role-based queries)

---

## Error Handling

### Invalid Role

```json
{
  "error": "Invalid role. Must be one of: reader, writer, manager, admin"
}
```

### User Not Found

```json
{
  "error": "User not found"
}
```

### Missing Fields

```json
{
  "error": "Email and role are required"
}
```

### Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Admin access required"
}
```

---

## Security Considerations

### Role Update Authorization

**Who Can Update Roles:**
- Only users with `admin` role
- System administrators with database access

**Audit Logging:**
- All role changes are logged
- Includes: timestamp, admin user, target user, old role, new role

**Prevention:**
- Users cannot update their own role via API
- Role updates require valid admin session
- Invalid role values are rejected

### Session Invalidation

**Current Behavior:**
- Role changes take effect immediately
- No session invalidation required
- User sees new permissions on next request

**Considerations:**
- Users may need to refresh page to see new UI
- Active API requests complete with old permissions
- New requests use updated role

---

## Rate Limits

| Operation | Limit | Time Window |
|-----------|-------|-------------|
| Role Update | 10 requests | per minute |

---

## Related Documentation

- [Authentication APIs](./authentication.md)
- [Authentication System](../auth/authentication-profiles.md)
- [Admin APIs](./admin.md)
- [Database Schema](../../drizzle/schema.ts)
