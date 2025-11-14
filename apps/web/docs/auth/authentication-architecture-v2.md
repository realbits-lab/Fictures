# Authentication Architecture v2.0

## Overview

This document describes the redesigned authentication architecture for Fictures that eliminates the need to pass API keys as parameters through multiple function layers.

## Core Problems with Current System

1. **Parameter Drilling**: API keys passed through 4+ function layers (Route → Service → Generator → AI Client → Provider)
2. **Hash Algorithm Mismatch**: SHA-256 generation vs bcrypt verification (critical bug)
3. **Missing Streaming Auth**: API key not included in streaming requests
4. **Scattered Permission Logic**: Scope requirements hardcoded in individual routes
5. **Poor Developer Experience**: Every function needs `apiKey?: string` parameter

## New Architecture: Authentication Context System

### Design Principles

1. **Zero Parameter Passing**: No API key parameters in business logic
2. **Single Source of Truth**: Centralized authentication state
3. **Type-Safe**: Full TypeScript support with proper inference
4. **Framework Agnostic Core**: Works with both server and client contexts
5. **Backwards Compatible**: Gradual migration path

### Architecture Components

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────┐      ┌──────────────────────┐     │
│  │  Route Handler  │ ───> │  Service Functions   │     │
│  └─────────────────┘      └──────────────────────┘     │
│           │                         │                    │
│           ▼                         ▼                    │
│  ┌─────────────────────────────────────────────┐       │
│  │         Authentication Context API           │       │
│  │  • getAuth(): AuthContext                   │       │
│  │  • withAuth(ctx): AsyncLocalStorage         │       │
│  │  • requireScopes(...): Middleware           │       │
│  └─────────────────────────────────────────────┘       │
│                        │                                 │
├────────────────────────┼─────────────────────────────────┤
│                        ▼                                 │
│  ┌─────────────────────────────────────────────┐       │
│  │          Authentication Store                │       │
│  │  • Server: AsyncLocalStorage (Node.js)      │       │
│  │  • Client: React Context                    │       │
│  │  • Edge: Request Headers                    │       │
│  └─────────────────────────────────────────────┘       │
│                        │                                 │
├────────────────────────┼─────────────────────────────────┤
│                        ▼                                 │
│  ┌─────────────────────────────────────────────┐       │
│  │          Authentication Providers            │       │
│  │  • NextAuth Session Provider                │       │
│  │  • API Key Provider                         │       │
│  │  • Dual Auth Resolver                       │       │
│  └─────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Authentication Context Interface

```typescript
// src/lib/auth/context.ts
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
  };
}

interface AuthStore {
  getAuth(): AuthContext | null;
  setAuth(context: AuthContext): void;
  clearAuth(): void;
}
```

### 2. Server-Side Implementation (AsyncLocalStorage)

```typescript
// src/lib/auth/server-context.ts
import { AsyncLocalStorage } from 'async_hooks';

const authStorage = new AsyncLocalStorage<AuthContext>();

export function withAuth<T>(
  context: AuthContext,
  fn: () => Promise<T>
): Promise<T> {
  return authStorage.run(context, fn);
}

export function getAuth(): AuthContext {
  const context = authStorage.getStore();
  if (!context) {
    throw new AuthenticationError('No authentication context');
  }
  return context;
}

export function getAuthSafe(): AuthContext | null {
  return authStorage.getStore() ?? null;
}
```

### 3. Route Handler Integration

```typescript
// src/lib/auth/middleware.ts
export function withAuthentication(
  handler: NextApiHandler
): NextApiHandler {
  return async (req, res) => {
    const auth = await resolveAuthentication(req);
    return withAuth(auth, () => handler(req, res));
  };
}

// Usage in API route
export const POST = withAuthentication(
  requireScopes('novel:write')(
    async (req: Request) => {
      // No need to pass API key - it's in context
      const novel = await createNovel(data);
      return Response.json(novel);
    }
  )
);
```

### 4. Service Layer (No API Key Parameters!)

```typescript
// BEFORE: Clumsy parameter passing
export async function createNovel(
  data: NovelInput,
  userId: string,
  apiKey?: string  // <- Had to pass this everywhere
): Promise<Novel> {
  const content = await generateContent(prompt, apiKey);
  // ...
}

// AFTER: Clean, no parameters
export async function createNovel(
  data: NovelInput,
  userId: string
): Promise<Novel> {
  // API key automatically retrieved from context
  const content = await generateContent(prompt);
  // ...
}
```

### 5. AI Client Integration

```typescript
// src/lib/ai/ai-client.ts
export class AIClient {
  async generateText(prompt: string): Promise<string> {
    const auth = getAuth(); // Get from context

    const headers = {
      'Authorization': auth.apiKey ? `Bearer ${auth.apiKey}` : undefined,
      ...this.defaultHeaders
    };

    return this.provider.generate(prompt, headers);
  }
}
```

### 6. Permission Decorator System

```typescript
// src/lib/auth/decorators.ts
export function RequireScopes(...scopes: string[]) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const auth = getAuth();

      if (!hasScopes(auth, scopes)) {
        throw new ForbiddenError(`Missing scopes: ${scopes}`);
      }

      return original.apply(this, args);
    };
  };
}

// Usage
class NovelService {
  @RequireScopes('novel:write')
  async createNovel(data: NovelInput) {
    // Automatically checks permissions
  }
}
```

## Migration Strategy

### Phase 1: Implement Core (Week 1)
1. Create authentication context system
2. Fix critical bugs (hash mismatch, streaming)
3. Add AsyncLocalStorage support

### Phase 2: Route Integration (Week 2)
1. Update route handlers with middleware
2. Add permission decorators
3. Centralize scope definitions

### Phase 3: Service Refactoring (Week 3)
1. Remove apiKey parameters from services
2. Update AI client to use context
3. Refactor generators

### Phase 4: Testing & Documentation (Week 4)
1. Comprehensive testing
2. Update API documentation
3. Migration guide for developers

## Benefits

1. **Developer Experience**: No more parameter drilling
2. **Type Safety**: Full TypeScript support
3. **Performance**: Reduced object passing
4. **Maintainability**: Centralized auth logic
5. **Security**: Consistent permission checking
6. **Testability**: Easy to mock auth context

## Backwards Compatibility

The system maintains backwards compatibility:

```typescript
// Old way still works (deprecated)
await createNovel(data, userId, apiKey);

// New way (preferred)
await withAuth(authContext, () =>
  createNovel(data, userId)
);
```

## Example: Complete Request Flow

```typescript
// 1. API Route receives request
export const POST = async (req: Request) => {
  // 2. Authentication middleware resolves auth
  return withAuthentication(async () => {
    // 3. Permission check (automatic via decorator)
    // 4. Service called without API key parameter
    const novel = await novelService.createNovel(data);

    // 5. Generator uses context automatically
    // 6. AI Client gets API key from context
    // 7. Response returned
    return Response.json(novel);
  });
};
```

## Configuration

```typescript
// src/lib/auth/config.ts
export const authConfig = {
  // Enable context system
  useContext: true,

  // Fallback to parameter passing
  allowParameterFallback: true,

  // AsyncLocalStorage for Node.js
  storage: 'async-local',

  // Permission checking
  enforceScopes: true,

  // Logging
  debug: process.env.NODE_ENV === 'development'
};
```

## Error Handling

```typescript
// Specific error types for better debugging
export class AuthenticationError extends Error {
  code = 'AUTH_ERROR';
}

export class NoContextError extends AuthenticationError {
  code = 'NO_CONTEXT';
  message = 'No authentication context available';
}

export class InsufficientScopesError extends AuthenticationError {
  code = 'INSUFFICIENT_SCOPES';
  constructor(required: string[], actual: string[]) {
    super(`Missing scopes. Required: ${required}, Actual: ${actual}`);
  }
}
```

## Testing

```typescript
// Easy to test with mock context
describe('NovelService', () => {
  it('creates novel with API key context', async () => {
    const mockAuth: AuthContext = {
      type: 'api-key',
      apiKey: 'test-key',
      scopes: ['novel:write'],
      metadata: { requestId: '123', timestamp: Date.now() }
    };

    const novel = await withAuth(mockAuth, () =>
      novelService.createNovel(data)
    );

    expect(novel).toBeDefined();
  });
});
```

## Monitoring & Observability

```typescript
// Built-in request tracing
interface AuthContext {
  metadata: {
    requestId: string;    // Trace requests
    timestamp: number;    // Measure latency
    ip?: string;         // Audit logging
    userAgent?: string;  // Client detection
  };
}

// Automatic logging
withAuth(context, async () => {
  console.log(`[${context.metadata.requestId}] Starting request`);
  const result = await operation();
  console.log(`[${context.metadata.requestId}] Completed in ${Date.now() - context.metadata.timestamp}ms`);
  return result;
});
```

## Security Considerations

1. **Context Isolation**: Each request has isolated context
2. **No Global State**: AsyncLocalStorage prevents leaks
3. **Immutable Context**: Context cannot be modified after creation
4. **Automatic Cleanup**: Context cleared after request
5. **Type Safety**: TypeScript prevents misuse

## Conclusion

This new authentication architecture provides:
- **Zero parameter passing** for API keys
- **Centralized** authentication management
- **Type-safe** context system
- **Better developer experience**
- **Improved maintainability**

The migration can be done gradually while maintaining backwards compatibility.