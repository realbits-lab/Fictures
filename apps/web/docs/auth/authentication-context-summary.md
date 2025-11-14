# Authentication Context System - Complete Summary

## 🎯 Problem Statement

The original authentication system required passing API keys as parameters through multiple function layers:

```
Route Handler → Service → Generator → AI Client → Provider
     ↓              ↓           ↓          ↓          ↓
  apiKey?       apiKey?     apiKey?    apiKey?    apiKey?
```

This created several issues:
- **Clumsy**: Every function needed `apiKey?: string` parameter
- **Error-Prone**: Easy to forget passing the API key
- **Hard to Maintain**: Changes required updating multiple layers
- **Poor DX**: Verbose and repetitive code
- **Testing Complexity**: Difficult to mock authentication

## 🚀 Solution: Authentication Context System

The new system uses **AsyncLocalStorage** to maintain authentication context across async operations without parameter passing:

```
Route Handler (withAuthentication)
     ↓
AsyncLocalStorage Context
     ↓
[All functions automatically have access to auth]
     ↓
Service → Generator → AI Client → Provider
(no apiKey parameters needed!)
```

## 📦 Core Components

### 1. Authentication Context Types
**File**: `src/lib/auth/context.ts`

Defines the authentication context interface and helper types:

```typescript
interface AuthContext {
    type: 'session' | 'api-key' | 'anonymous';
    userId?: string;
    email?: string;
    apiKey?: string;
    scopes: string[];
    metadata: {
        requestId: string;
        timestamp: number;
        ip?: string;
        userAgent?: string;
    };
}
```

**Key exports**:
- `AuthContext` - Main context interface
- `AuthStore` - Store interface for managing context
- `hasScopes()` - Check permissions
- `createApiKeyContext()` - Create API key context
- `createSessionContext()` - Create session context
- Error types: `NoContextError`, `InsufficientScopesError`

### 2. Server Context (AsyncLocalStorage)
**File**: `src/lib/auth/server-context.ts`

Server-side context management using Node.js AsyncLocalStorage:

```typescript
// Set context for async operations
await withAuth(authContext, async () => {
    // All code here has access to auth
    await someService.doSomething();
});

// Get context anywhere in the call stack
const auth = getAuth();
const apiKey = getApiKey();
const userId = getUserId();
```

**Key exports**:
- `withAuth()` - Run function with auth context
- `getAuth()` - Get current context (throws if none)
- `getAuthSafe()` - Get current context (returns null if none)
- `getApiKey()` - Get API key from context
- `getUserId()` - Get user ID from context
- `traced()` - Automatic request tracing
- `measureWithContext()` - Performance measurement

### 3. Authentication Middleware
**File**: `src/lib/auth/middleware.ts`

Middleware for Next.js API routes:

```typescript
// Basic authentication
export const POST = withAuthentication(async (req) => {
    // Auth context automatically available
    return Response.json({ success: true });
});

// With required scopes
export const POST = requireScopes('stories:write')(
    withAuthentication(async (req) => {
        // Only accessible with required scope
        return Response.json({ success: true });
    })
);

// Admin only
export const DELETE = adminOnly(async (req) => {
    // Only accessible by admins
    return Response.json({ success: true });
});

// Optional authentication
export const GET = optionalAuth(async (req) => {
    const auth = getAuthSafe();
    // Handle both authenticated and anonymous
    return Response.json({ success: true });
});
```

**Key exports**:
- `withAuthentication()` - Main middleware wrapper
- `requireScopes()` - Require specific permissions
- `adminOnly()` - Admin-only endpoints
- `optionalAuth()` - Optional authentication
- `getServerAuth()` - Get auth in server components

### 4. Configuration
**File**: `src/lib/auth/config.ts`

Central configuration and permission definitions:

```typescript
export const authConfig = {
    useContext: true,
    allowParameterFallback: true,
    storage: 'async-local',
    enforceScopes: true,
    debug: process.env.NODE_ENV === 'development'
};

export const PERMISSION_SCOPES = {
    'stories:read': 'Read stories and related data',
    'stories:write': 'Create and edit stories',
    'admin:all': 'Full admin access',
    // ... more scopes
};

export const ROLE_SCOPES = {
    reader: ['stories:read', 'chapters:read', ...],
    writer: ['stories:write', 'ai:use', ...],
    manager: ['admin:all', ...]
};
```

**Key exports**:
- `authConfig` - System configuration
- `PERMISSION_SCOPES` - All available scopes
- `ROLE_SCOPES` - Role to scope mappings
- `ENDPOINT_SCOPES` - Route permission requirements
- `getScopesForRole()` - Get scopes for a role
- `getEndpointScopes()` - Get required scopes for a route

## 🔧 Bug Fixes Included

### 1. Hash Algorithm Mismatch (CRITICAL)
**Location**: `src/lib/auth/api-keys.ts:68`

**Before**:
```typescript
export function hashApiKey(key: string): string {
    return createHash("sha256").update(key).digest("hex");
}
```

**After**:
```typescript
export async function hashApiKey(key: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(key, saltRounds);
}
```

**Impact**: API keys can now be properly verified using bcrypt, matching the verification logic in `dual-auth.ts`.

### 2. Missing API Key in Streaming Requests
**Location**: `src/lib/studio/generators/ai-client.ts:455`

**Before**:
```typescript
const response = await fetch(url, {
    headers: {
        "Content-Type": "application/json",
    },
    // Missing API key!
});
```

**After**:
```typescript
const response = await fetch(url, {
    headers: this.buildHeaders(), // Includes API key
});
```

**Impact**: Streaming requests now properly include authentication headers.

## 📚 Usage Examples

### Basic API Route

```typescript
// Before: Clumsy parameter passing
export async function POST(req: Request) {
    const apiKey = req.headers.get('x-api-key');
    const data = await req.json();
    const result = await createStory(data, userId, apiKey);
    return Response.json(result);
}

// After: Clean context usage
export const POST = requireScopes('stories:write')(
    withAuthentication(async (req: Request) => {
        const data = await req.json();
        const result = await createStory(data);
        return Response.json(result);
    })
);
```

### Service Layer

```typescript
// Before: API key parameter everywhere
export async function createStory(
    data: StoryInput,
    userId: string,
    apiKey?: string
): Promise<Story> {
    const content = await generateContent(prompt, apiKey);
    // ...
}

// After: No parameters needed
import { getAuth } from '@/lib/auth/server-context';

export async function createStory(
    data: StoryInput
): Promise<Story> {
    const auth = getAuth();
    const content = await generateContent(prompt);
    // ...
}
```

### AI Client

```typescript
// Before: API key in constructor
const client = new AIClient({ apiKey });

// After: No parameters needed
const client = new AIClient();
// API key automatically retrieved from context
```

## ✅ Benefits

### Developer Experience
- ✅ **No parameter passing** - Clean function signatures
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Easy testing** - Mock contexts with `withAuth()`
- ✅ **Less boilerplate** - No repetitive parameter handling

### Architecture
- ✅ **Centralized** - Single source of truth for authentication
- ✅ **Consistent** - Same pattern across all layers
- ✅ **Maintainable** - Changes in one place
- ✅ **Secure** - Isolated per-request contexts

### Performance
- ✅ **Efficient** - No object passing overhead
- ✅ **Automatic cleanup** - Context cleared after request
- ✅ **Request tracing** - Built-in request ID tracking

## 🧪 Testing

```typescript
import { withAuth, createApiKeyContext } from '@/lib/auth/server-context';

describe('Story Service', () => {
    it('creates story with context', async () => {
        const authContext = createApiKeyContext(
            'test-key',
            'user-123',
            'test@example.com',
            ['stories:write']
        );

        const result = await withAuth(authContext, async () => {
            return await createStory({ title: 'Test' });
        });

        expect(result).toBeDefined();
    });
});
```

## 📖 Documentation

1. **[Architecture v2.0](./authentication-architecture-v2.md)** - Complete design document
2. **[Usage Examples](./authentication-examples.md)** - Practical code examples
3. **[Migration Guide](./authentication-migration-guide.md)** - Step-by-step migration
4. **[API Reference](./authentication-api-reference.md)** - Complete API documentation

## 🚦 Migration Status

### ✅ Completed
- [x] Core context system implementation
- [x] Server-side AsyncLocalStorage
- [x] Authentication middleware
- [x] Configuration and permissions
- [x] Bug fixes (hash mismatch, streaming)
- [x] Documentation
- [x] Example code

### 🔄 In Progress
- [ ] API route migration
- [ ] Service layer refactoring

### ⏳ Pending
- [ ] Generator function updates
- [ ] AI client refactoring
- [ ] Complete test coverage
- [ ] Production deployment

## 🎯 Quick Start

### 1. Update an API Route

```typescript
// Import middleware
import { withAuthentication, requireScopes } from '@/lib/auth/middleware';

// Wrap your handler
export const POST = requireScopes('stories:write')(
    withAuthentication(async (req: Request) => {
        // Your code here - auth context automatically available
        const result = await yourService.doSomething();
        return Response.json(result);
    })
);
```

### 2. Update a Service

```typescript
// Import context helpers
import { getAuth, getApiKey } from '@/lib/auth/server-context';

// Remove apiKey parameters
export async function yourService(data: Input): Promise<Output> {
    // Get auth from context
    const auth = getAuth();

    // Use auth.userId, auth.scopes, etc.
    // Call other functions without passing apiKey
    return await otherFunction(data);
}
```

### 3. Update Tests

```typescript
import { withAuth, createApiKeyContext } from '@/lib/auth/server-context';

test('your test', async () => {
    const authContext = createApiKeyContext(
        'test-key',
        'user-id',
        'email@example.com',
        ['stories:write']
    );

    const result = await withAuth(authContext, async () => {
        return await yourFunction();
    });

    expect(result).toBeDefined();
});
```

## 🔍 Troubleshooting

### "No authentication context available"

**Solution**: Ensure your route uses `withAuthentication()` middleware

### "Insufficient permissions"

**Solution**: Add required scopes to the route using `requireScopes()`

### Type errors

**Solution**: Remove `apiKey?` parameters from function signatures

## 📞 Support

For help with migration or issues:

1. Review the [Examples Guide](./authentication-examples.md)
2. Check the [Migration Guide](./authentication-migration-guide.md)
3. Search existing code for patterns
4. Create an issue with details

## 🎉 Summary

The new authentication context system provides a **modern, elegant solution** to authentication management that:

- Eliminates parameter drilling
- Improves code quality and maintainability
- Provides better developer experience
- Maintains full backward compatibility during migration
- Fixes critical bugs in the authentication system

**Start migrating today** using the [Migration Guide](./authentication-migration-guide.md)!