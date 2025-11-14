# Authentication System Migration Guide

This guide provides step-by-step instructions for migrating from the old parameter-passing authentication system to the new authentication context system.

## Overview

The new authentication context system eliminates the need to pass API keys as parameters through multiple function layers. Instead, authentication is stored in AsyncLocalStorage and automatically available throughout the request lifecycle.

## Migration Strategy

We recommend a **gradual migration** approach:

1. **Phase 1**: Implement new authentication middleware (✅ Complete)
2. **Phase 2**: Update API routes (In Progress)
3. **Phase 3**: Refactor service layer (Pending)
4. **Phase 4**: Update generator functions (Pending)
5. **Phase 5**: Refactor AI client (Pending)
6. **Phase 6**: Remove old parameter-based code (Pending)

## Phase 2: Update API Routes

### Identify Routes to Migrate

Find all API routes that currently handle authentication:

```bash
# Find routes with API key handling
grep -r "x-api-key" apps/web/src/app/
grep -r "apiKey?" apps/web/src/app/api/
grep -r "getServerSession" apps/web/src/app/api/
```

### Migration Pattern

#### Before (Old Pattern)

```typescript
// apps/web/src/app/api/stories/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    // Manual authentication
    const session = await getServerSession(authOptions);
    const apiKey = req.headers.get('x-api-key');

    if (!session && !apiKey) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions manually
    if (!session?.user.role.includes('writer')) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();

    // Pass API key through function calls
    const result = await createStory(data, session.user.id, apiKey);

    return Response.json(result);
}
```

#### After (New Pattern)

```typescript
// apps/web/src/app/api/stories/route.ts
import { withAuthentication, requireScopes } from '@/lib/auth/middleware';

export const POST = requireScopes('stories:write')(
    withAuthentication(async (req: Request) => {
        const data = await req.json();

        // No API key parameter needed!
        const result = await createStory(data);

        return Response.json(result);
    })
);
```

### Checklist for Each Route

- [ ] Remove manual `getServerSession()` calls
- [ ] Remove manual API key extraction from headers
- [ ] Remove manual permission checking
- [ ] Wrap handler with `withAuthentication()`
- [ ] Add `requireScopes()` if specific permissions needed
- [ ] Remove `apiKey` parameter from service function calls
- [ ] Test the updated route

### Common Route Patterns

#### Pattern 1: Simple Authentication

```typescript
// Before
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const data = await fetchData(session.user.id);
    return Response.json(data);
}

// After
export const GET = withAuthentication(async (req: Request) => {
    const auth = getAuth();
    const data = await fetchData();
    return Response.json(data);
});
```

#### Pattern 2: With Permission Check

```typescript
// Before
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user, 'stories:write')) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const data = await req.json();
    const result = await createData(data, session.user.id);
    return Response.json(result);
}

// After
export const POST = requireScopes('stories:write')(
    withAuthentication(async (req: Request) => {
        const data = await req.json();
        const result = await createData(data);
        return Response.json(result);
    })
);
```

#### Pattern 3: Optional Authentication

```typescript
// Before
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const data = session
        ? await getPersonalizedData(session.user.id)
        : await getPublicData();
    return Response.json(data);
}

// After
import { optionalAuth, getAuthSafe } from '@/lib/auth/middleware';

export const GET = optionalAuth(async (req: Request) => {
    const auth = getAuthSafe();
    const data = auth
        ? await getPersonalizedData()
        : await getPublicData();
    return Response.json(data);
});
```

#### Pattern 4: Admin-Only

```typescript
// Before
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'manager') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    await deleteAllData();
    return Response.json({ success: true });
}

// After
import { adminOnly } from '@/lib/auth/middleware';

export const DELETE = adminOnly(async (req: Request) => {
    await deleteAllData();
    return Response.json({ success: true });
});
```

## Phase 3: Refactor Service Layer

### Identify Services to Migrate

```bash
# Find service functions with apiKey parameters
grep -r "apiKey\?" apps/web/src/lib/services/
grep -r "apiKey:" apps/web/src/lib/studio/
grep -r "apiKey," apps/web/src/lib/
```

### Migration Pattern

#### Before (Old Pattern)

```typescript
// apps/web/src/lib/services/story-service.ts
export async function createStory(
    data: StoryInput,
    userId: string,
    apiKey?: string  // <- Remove this parameter
): Promise<Story> {
    // Generate content with API key
    const summary = await generateSummary(data.prompt, apiKey);  // <- Remove apiKey
    const characters = await generateCharacters(summary, apiKey);  // <- Remove apiKey

    // Save to database
    const story = await db.insert(stories).values({
        userId,
        summary,
        // ...
    });

    return story;
}
```

#### After (New Pattern)

```typescript
// apps/web/src/lib/services/story-service.ts
import { getAuth } from '@/lib/auth/server-context';

export async function createStory(
    data: StoryInput
): Promise<Story> {
    // Get auth from context
    const auth = getAuth();

    // Generate content - no API key parameter
    const summary = await generateSummary(data.prompt);
    const characters = await generateCharacters(summary);

    // Save to database
    const story = await db.insert(stories).values({
        userId: auth.userId!,
        summary,
        // ...
    });

    return story;
}
```

### Checklist for Each Service

- [ ] Remove `apiKey?: string` parameter
- [ ] Add `import { getAuth } from '@/lib/auth/server-context'`
- [ ] Replace `userId` parameter with `getAuth().userId`
- [ ] Remove `apiKey` from all downstream function calls
- [ ] Update function signature in TypeScript types
- [ ] Update all call sites to not pass `apiKey`
- [ ] Test the updated service

## Phase 4: Update Generator Functions

### Migration Pattern

#### Before (Old Pattern)

```typescript
// apps/web/src/lib/studio/generators/summary-generator.ts
export async function generateSummary(
    prompt: string,
    apiKey?: string  // <- Remove this
): Promise<string> {
    const client = new AIClient({ apiKey });  // <- Remove apiKey
    return await client.generateText({
        prompt,
        maxTokens: 1000
    });
}
```

#### After (New Pattern)

```typescript
// apps/web/src/lib/studio/generators/summary-generator.ts
export async function generateSummary(
    prompt: string
): Promise<string> {
    const client = new AIClient();  // No apiKey needed
    return await client.generateText({
        prompt,
        maxTokens: 1000
    });
}
```

### Checklist for Each Generator

- [ ] Remove `apiKey?: string` parameter
- [ ] Remove `apiKey` from AIClient constructor calls
- [ ] Update function signature
- [ ] Update all call sites
- [ ] Test generation

## Phase 5: Refactor AI Client

### Migration Pattern

#### Before (Old Pattern)

```typescript
// apps/web/src/lib/studio/generators/ai-client.ts
export class AIClient {
    private apiKey?: string;

    constructor(options: { apiKey?: string } = {}) {
        this.apiKey = options.apiKey;
    }

    private buildHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (this.apiKey) {
            headers['x-api-key'] = this.apiKey;
        }

        return headers;
    }
}
```

#### After (New Pattern)

```typescript
// apps/web/src/lib/studio/generators/ai-client.ts
import { getApiKey } from '@/lib/auth/server-context';

export class AIClient {
    constructor() {
        // No apiKey parameter needed
    }

    private buildHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        // Get API key from context
        const apiKey = getApiKey();
        if (apiKey) {
            headers['x-api-key'] = apiKey;
        }

        return headers;
    }
}
```

### Checklist for AI Client

- [ ] Remove `apiKey` from constructor parameters
- [ ] Remove `this.apiKey` private field
- [ ] Update `buildHeaders()` to use `getApiKey()`
- [ ] Update all instantiation sites to not pass `apiKey`
- [ ] Test AI client functionality

## Phase 6: Cleanup

### Remove Old Code

Once all phases are complete, remove backward compatibility code:

```typescript
// Remove from auth/config.ts
export const authConfig = {
    // ... remove this line
    allowParameterFallback: true,  // <- Remove this
};
```

### Update Documentation

- [ ] Update API documentation
- [ ] Update code examples
- [ ] Update developer guides
- [ ] Remove references to old parameter-passing pattern

## Testing Strategy

### 1. Unit Tests

Update unit tests to use the new context system:

```typescript
import { withAuth } from '@/lib/auth/server-context';
import { createApiKeyContext } from '@/lib/auth/context';

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

### 2. Integration Tests

Test API routes with authentication middleware:

```typescript
describe('POST /api/stories', () => {
    it('creates story with API key', async () => {
        const response = await fetch('/api/stories', {
            method: 'POST',
            headers: {
                'x-api-key': 'test-api-key',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: 'Test Story' })
        });

        expect(response.status).toBe(200);
    });

    it('returns 401 without authentication', async () => {
        const response = await fetch('/api/stories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: 'Test Story' })
        });

        expect(response.status).toBe(401);
    });
});
```

### 3. E2E Tests

Update Playwright tests to work with new authentication:

```typescript
// Playwright test remains the same - authentication is handled server-side
test('create story', async ({ page }) => {
    await login(page, writer.email, writer.password);
    await page.goto('/studio/new');
    await page.fill('[name="title"]', 'Test Story');
    await page.click('button:has-text("Create")');
    await expect(page).toHaveURL(/\/studio\/edit\//);
});
```

## Migration Checklist

Use this checklist to track your migration progress:

### API Routes
- [ ] `/studio/api/novels/*` routes
- [ ] `/api/images/*` routes
- [ ] `/api/users/*` routes
- [ ] `/api/admin/*` routes
- [ ] Other API routes

### Services
- [ ] `story-service.ts`
- [ ] `scene-service.ts`
- [ ] `character-service.ts`
- [ ] `image-service.ts`
- [ ] Other services

### Generators
- [ ] `summary-generator.ts`
- [ ] `character-generator.ts`
- [ ] `scene-generator.ts`
- [ ] Other generators

### AI Client
- [ ] Update AIClient class
- [ ] Update AIServerProvider
- [ ] Update GeminiProvider
- [ ] Test all providers

### Documentation
- [ ] Update API documentation
- [ ] Update code examples
- [ ] Update developer guides
- [ ] Update README

### Testing
- [ ] Update unit tests
- [ ] Update integration tests
- [ ] Update E2E tests
- [ ] Manual testing

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback**: The system supports backward compatibility via `allowParameterFallback: true` in `auth/config.ts`
2. **Gradual Rollback**: Revert specific routes/services while keeping the new system for others
3. **Complete Rollback**: Revert all changes using git

## Common Issues and Solutions

### Issue: "No authentication context available"

**Cause**: Function called outside of authentication context

**Solution**: Ensure the route uses `withAuthentication()` middleware

### Issue: Type errors after removing parameters

**Cause**: TypeScript interfaces not updated

**Solution**: Update all TypeScript interfaces and type definitions

### Issue: Tests failing

**Cause**: Tests not using new context system

**Solution**: Update tests to use `withAuth()` wrapper

## Support

If you encounter issues during migration:

1. Check the [Examples Guide](./authentication-examples.md)
2. Review the [Architecture Document](./authentication-architecture-v2.md)
3. Search for similar patterns in already-migrated code
4. Create an issue with details of the problem

## Timeline

Recommended migration timeline:

- **Week 1**: Phase 1 & 2 (Infrastructure + API Routes)
- **Week 2**: Phase 3 (Service Layer)
- **Week 3**: Phase 4 & 5 (Generators + AI Client)
- **Week 4**: Phase 6 (Testing + Cleanup + Documentation)

## Next Steps

1. Start with Phase 2: Update API Routes
2. Follow the patterns in this guide
3. Test thoroughly after each phase
4. Move to next phase once current is stable