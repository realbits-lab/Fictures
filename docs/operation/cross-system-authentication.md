# Cross-System Authentication

This document describes the unified authentication system used across the Fictures platform (web app and AI server).

## Overview

The Fictures platform consists of two main applications:
- **Web App** (apps/web): Next.js frontend with API routes
- **AI Server** (apps/ai-server): Python FastAPI service for AI generation

Both systems share a **unified authentication system** with compatible API key generation, hashing, and permission scopes.

## Authentication Methods

### 1. API Key Authentication

API keys are used for:
- External service integration
- Server-to-server communication
- Automated scripts and tools
- Testing and development

### 2. Session Authentication (Web App Only)

Session-based authentication via NextAuth.js is used for:
- Web application user login
- Google OAuth integration
- Email/password authentication

## API Key Standards

### Format

```
fic_<base64url_encoded_random_bytes>
```

**Example**: `fic_xK9mQ2vN7tY4pL8jR6zW3aD5hF1cB0eG9yU4qI6sO2`

### Generation

- **Method**: Base64url encoding of 32 cryptographically random bytes
- **Prefix**: `fic_` (4 characters)
- **Random Part**: ~43 characters (base64url encoded)
- **Total Length**: ~47 characters

### Implementation

**Web App (TypeScript/Node.js)**:
```typescript
import crypto from 'crypto';

function generateApiKey(): string {
  const prefix = 'fic';
  const randomPart = crypto.randomBytes(32).toString('base64url');
  return `${prefix}_${randomPart}`;
}
```

**AI Server (Python)**:
```python
import secrets

def generate_api_key() -> str:
    prefix = "fic"
    random_part = secrets.token_urlsafe(32)
    return f"{prefix}_{random_part}"
```

## API Key Hashing

### Standard: bcrypt

Both systems use **bcrypt** for API key hashing to ensure:
- ✅ **Security**: Cryptographically secure with random salt
- ✅ **Compatibility**: Same hashes work across both systems
- ✅ **Verification**: bcrypt.compare() works identically

### Storage

**Database Schema**:
```sql
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name VARCHAR(255) DEFAULT 'API Key' NOT NULL,
  key_hash TEXT NOT NULL,              -- bcrypt hash (60 chars)
  key_prefix VARCHAR(16) NOT NULL,     -- First 16 chars of API key
  scopes JSON NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(key_hash)
);
```

### Hashing Implementation

**Web App (TypeScript/Node.js)**:
```typescript
import bcrypt from 'bcryptjs';

async function hashApiKey(apiKey: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(apiKey, saltRounds);
}

async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(apiKey, hash);
}
```

**AI Server (Python)**:
```python
import bcrypt

def hash_api_key(api_key: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(api_key.encode('utf-8'), salt).decode('utf-8')

def verify_api_key(api_key: str, key_hash: str) -> bool:
    return bcrypt.checkpw(api_key.encode('utf-8'), key_hash.encode('utf-8'))
```

### Key Prefix

Both systems extract the first **16 characters** of the API key as a prefix for:
- **Fast lookup**: Query by prefix before expensive bcrypt verification
- **Security**: Prefix alone is not sufficient for authentication

```typescript
function getApiKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 16);  // "fic_xK9mQ2vN7tY4"
}
```

## Permission Scopes

### Unified Scope System

Both systems use the same permission scopes to ensure consistent access control:

```typescript
type Scope =
  // Story Management (web + ai-server)
  | 'stories:read' | 'stories:write' | 'stories:delete' | 'stories:publish'

  // Image Management (ai-server)
  | 'images:read' | 'images:write'

  // Chapter Management (web)
  | 'chapters:read' | 'chapters:write' | 'chapters:delete'

  // Analytics (web)
  | 'analytics:read'

  // AI Features (web)
  | 'ai:use'

  // Community (web)
  | 'community:read' | 'community:write'

  // Settings (web)
  | 'settings:read' | 'settings:write'

  // Admin Access (web + ai-server)
  | 'admin:all';
```

### Role-Based Scopes

**Manager (Full Access)**:
```json
[
  "stories:read", "stories:write", "stories:delete", "stories:publish",
  "images:read", "images:write",
  "chapters:read", "chapters:write", "chapters:delete",
  "analytics:read",
  "ai:use",
  "community:read", "community:write",
  "settings:read", "settings:write",
  "admin:all"
]
```

**Writer (Content Creation)**:
```json
[
  "stories:read", "stories:write",
  "images:read", "images:write",
  "chapters:read", "chapters:write",
  "analytics:read",
  "ai:use",
  "community:read", "community:write",
  "settings:read"
]
```

**Reader (Read-Only)**:
```json
[
  "stories:read",
  "images:read",
  "chapters:read",
  "analytics:read",
  "community:read",
  "settings:read"
]
```

### Scope Verification

**Web App**:
```typescript
function hasRequiredScope(scopes: string[], requiredScope: string): boolean {
  // Check for exact scope match
  if (scopes.includes(requiredScope)) return true;

  // Check for wildcard scope (admin:all grants everything)
  if (scopes.includes('admin:all')) return true;

  // Check for parent scope (e.g., 'stories:write' implies 'stories:read')
  if (requiredScope === 'stories:read' && scopes.includes('stories:write')) {
    return true;
  }

  return false;
}
```

**AI Server**:
```python
def has_required_scope(scopes: list[str], required_scope: str) -> bool:
    # Check for exact scope match
    if required_scope in scopes:
        return True

    # Check for wildcard scope (admin:all grants everything)
    if "admin:all" in scopes:
        return True

    # Check for parent scope
    if required_scope == "stories:read" and "stories:write" in scopes:
        return True

    return False
```

## Authentication Configuration

### Shared Configuration File

Both systems read from `.auth/user.json`:

```json
{
  "main": {
    "profiles": {
      "manager": {
        "email": "manager@fictures.xyz",
        "password": "...",
        "apiKey": "fic_..."
      },
      "writer": {
        "email": "writer@fictures.xyz",
        "password": "...",
        "apiKey": "fic_..."
      },
      "reader": {
        "email": "reader@fictures.xyz",
        "password": "...",
        "apiKey": "fic_..."
      }
    }
  },
  "develop": {
    "profiles": {
      "manager": { ... },
      "writer": { ... },
      "reader": { ... }
    }
  }
}
```

### Environment Isolation

- **Production**: Uses `main` profiles
- **Development**: Uses `develop` profiles
- **Detection**: Based on `NODE_ENV` environment variable

## Setup and Management

### Initial Setup

**1. Generate User Accounts and API Keys** (Web App):
```bash
cd apps/web
dotenv --file .env.local run pnpm exec tsx scripts/setup-auth-users.ts
```

This creates:
- ✅ Three user accounts (manager, writer, reader) in database
- ✅ Hashed passwords using PBKDF2
- ✅ API keys hashed with bcrypt
- ✅ `.auth/user.json` file with plaintext credentials

**2. Sync with AI Server** (if using separate database):
```bash
cd apps/ai-server
python scripts/reset_user_auth.py --env develop
```

### Regenerate API Keys

**Web App**:
```bash
cd apps/web
node scripts/generate-auth-credentials.mjs --all
dotenv --file .env.local run pnpm exec tsx scripts/setup-auth-users.ts
```

**AI Server**:
```bash
cd apps/ai-server
python scripts/reset_user_auth.py --env develop
```

### Validation

**Verify Authentication Setup**:
```bash
cd apps/web
dotenv --file .env.local run pnpm exec tsx scripts/verify-auth-setup.ts
```

**Validate Credentials Format**:
```bash
cd apps/web
node scripts/validate-auth-credentials.mjs --verbose
```

## Security Best Practices

### API Key Security

1. **Never commit `.auth/user.json`** - File is gitignored
2. **Rotate keys regularly** - Regenerate API keys periodically
3. **Use environment-specific keys** - Separate keys for main/develop
4. **Monitor last_used_at** - Track API key usage
5. **Set expiration dates** - Use `expires_at` for temporary keys

### Database Security

1. **Hash all secrets** - Never store plaintext API keys
2. **Use bcrypt** - Provides salt and protection against rainbow tables
3. **Index key_prefix** - Fast lookup without full table scan
4. **Unique constraint on key_hash** - Prevent duplicate API keys

### Scope Management

1. **Principle of least privilege** - Grant minimum required scopes
2. **Role-based access** - Use predefined role scopes
3. **Audit scope usage** - Track which scopes are used
4. **Validate on every request** - Never trust client-provided scopes

## Migration Guide

### From Old System to New System

If you have existing API keys with SHA-256 hashing:

**1. Run Database Migration**:
```bash
cd apps/web
dotenv --file .env.local run pnpm db:migrate
```

This updates `key_hash` column from `varchar(64)` to `text`.

**2. Regenerate All API Keys**:
```bash
cd apps/web
node scripts/generate-auth-credentials.mjs --all
dotenv --file .env.local run pnpm exec tsx scripts/setup-auth-users.ts
```

**3. Sync AI Server**:
```bash
cd apps/ai-server
python scripts/reset_user_auth.py --env develop
```

**4. Update Application Code**:

All API key verification code already uses bcrypt, so no code changes needed.

## Troubleshooting

### Common Issues

**1. "Authentication failed" error**

- **Cause**: API key not found or invalid hash
- **Solution**: Regenerate API keys and verify database contains bcrypt hashes

**2. "Insufficient permissions" error**

- **Cause**: API key lacks required scope
- **Solution**: Check scopes in database, update if needed

**3. "Key prefix mismatch" error**

- **Cause**: Old API keys with 8-char prefix vs new 16-char prefix
- **Solution**: Regenerate all API keys

**4. Cross-system authentication not working**

- **Cause**: Different hashing algorithms or key formats
- **Solution**: Ensure both systems use latest code with bcrypt

### Debugging

**Check API Key in Database**:
```sql
SELECT id, key_prefix, scopes, is_active, expires_at
FROM api_keys
WHERE key_prefix = 'fic_xK9mQ2vN7tY4';
```

**Verify Bcrypt Hash**:
```typescript
import bcrypt from 'bcryptjs';

const apiKey = 'fic_xK9mQ2vN7tY4pL8jR6zW3aD5hF1cB0eG9yU4qI6sO2';
const storedHash = '$2a$12$...'; // from database

const isValid = await bcrypt.compare(apiKey, storedHash);
console.log('Valid:', isValid);
```

## References

- **Web App**: `apps/web/src/lib/auth/dual-auth.ts`
- **AI Server**: `apps/ai-server/scripts/reset_user_auth.py`
- **Database Schema**: `apps/web/drizzle/schema.ts`
- **Setup Script**: `apps/web/scripts/setup-auth-users.ts`
- **Environment Docs**: `docs/operation/environment-architecture.md`
