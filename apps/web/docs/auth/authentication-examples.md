# Authentication Context System - Usage Examples

This document provides practical examples of using the new authentication context system that eliminates API key parameter passing.

## Table of Contents

1. [Basic API Route](#basic-api-route)
2. [Service Layer](#service-layer)
3. [Generator Functions](#generator-functions)
4. [AI Client Integration](#ai-client-integration)
5. [Permission-Based Access](#permission-based-access)
6. [Migration from Old System](#migration-from-old-system)

---

## Basic API Route

### Before (Old Way with Parameters)

```typescript
// ❌ OLD: API key passed as parameter
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const apiKey = req.headers.get('x-api-key');

    if (!session && !apiKey) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    // Pass API key through every function
    const result = await createStory(data, session?.user.id, apiKey);

    return Response.json(result);
}
```

### After (New Way with Context)

```typescript
// ✅ NEW: Authentication context handled automatically
import { withAuthentication } from '@/lib/auth/middleware';
import { requireScopes } from '@/lib/auth/middleware';

export const POST = withAuthentication(
    async (req: Request) => {
        const data = await req.json();

        // No API key parameter needed!
        const result = await createStory(data);

        return Response.json(result);
    },
    { requiredScopes: ['stories:write'] }
);

// Or using decorator style
export const POST = requireScopes('stories:write')(
    withAuthentication(async (req: Request) => {
        const data = await req.json();
        const result = await createStory(data);
        return Response.json(result);
    })
);
```

---

## Service Layer

### Before (Old Way with Parameters)

```typescript
// ❌ OLD: API key threaded through service functions
export async function createStory(
    data: StoryInput,
    userId: string,
    apiKey?: string  // <- Clumsy parameter
): Promise<Story> {
    // Generate content with API key
    const summary = await generateSummary(data.prompt, apiKey);

    // More generation with API key
    const characters = await generateCharacters(summary, apiKey);

    // Save to database
    const story = await db.insert(stories).values({
        userId,
        summary,
        // ...
    });

    return story;
}
```

### After (New Way with Context)

```typescript
// ✅ NEW: No API key parameters!
import { getAuth } from '@/lib/auth/server-context';

export async function createStory(
    data: StoryInput
): Promise<Story> {
    // Get auth from context
    const auth = getAuth();

    // Generate content - no API key parameter
    const summary = await generateSummary(data.prompt);

    // More generation - no API key parameter
    const characters = await generateCharacters(summary);

    // Save to database
    const story = await db.insert(stories).values({
        userId: auth.userId,
        summary,
        // ...
    });

    return story;
}
```

---

## Generator Functions

### Before (Old Way with Parameters)

```typescript
// ❌ OLD: API key passed to generators
export async function generateSummary(
    prompt: string,
    apiKey?: string
): Promise<string> {
    const client = new AIClient({ apiKey });
    return await client.generateText({
        prompt,
        maxTokens: 1000
    });
}

export async function generateCharacters(
    summary: string,
    apiKey?: string
): Promise<Character[]> {
    const client = new AIClient({ apiKey });
    const result = await client.generateText({
        prompt: `Create characters for: ${summary}`,
        maxTokens: 2000
    });
    return parseCharacters(result);
}
```

### After (New Way with Context)

```typescript
// ✅ NEW: Generators access context automatically
import { getAuth } from '@/lib/auth/server-context';

export async function generateSummary(
    prompt: string
): Promise<string> {
    // AI client automatically gets API key from context
    const client = new AIClient();
    return await client.generateText({
        prompt,
        maxTokens: 1000
    });
}

export async function generateCharacters(
    summary: string
): Promise<Character[]> {
    const client = new AIClient();
    const result = await client.generateText({
        prompt: `Create characters for: ${summary}`,
        maxTokens: 2000
    });
    return parseCharacters(result);
}
```

---

## AI Client Integration

### Before (Old Way with Parameters)

```typescript
// ❌ OLD: API key in constructor
export class AIClient {
    private apiKey?: string;

    constructor(options: { apiKey?: string }) {
        this.apiKey = options.apiKey;
    }

    async generateText(request: GenerateRequest): Promise<string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (this.apiKey) {
            headers['x-api-key'] = this.apiKey;
        }

        const response = await fetch(url, { headers, ... });
        return await response.text();
    }
}
```

### After (New Way with Context)

```typescript
// ✅ NEW: API key from context
import { getAuth, getApiKey } from '@/lib/auth/server-context';

export class AIClient {
    constructor() {
        // No API key parameter needed
    }

    async generateText(request: GenerateRequest): Promise<string> {
        // Get API key from context
        const apiKey = getApiKey();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (apiKey) {
            headers['x-api-key'] = apiKey;
        }

        const response = await fetch(url, { headers, ... });
        return await response.text();
    }
}
```

---

## Permission-Based Access

### Example 1: Multiple Permission Levels

```typescript
// Only writers can create stories
export const POST = requireScopes('stories:write')(
    withAuthentication(async (req) => {
        const data = await req.json();
        const story = await createStory(data);
        return Response.json(story);
    })
);

// Only managers can delete all stories
export const DELETE = requireScopes('admin:all')(
    withAuthentication(async (req) => {
        await deleteAllStories();
        return Response.json({ success: true });
    })
);

// Readers can view stories
export const GET = requireScopes('stories:read')(
    withAuthentication(async (req) => {
        const stories = await getStories();
        return Response.json(stories);
    })
);
```

### Example 2: Multiple Required Scopes

```typescript
// Requires BOTH stories:write AND images:write
export const POST = requireScopes('stories:write', 'images:write')(
    withAuthentication(async (req) => {
        const data = await req.json();

        // Create story with image
        const story = await createStoryWithImage(data);

        return Response.json(story);
    })
);
```

### Example 3: Optional Authentication

```typescript
// Allow both authenticated and anonymous users
import { optionalAuth, getAuthSafe } from '@/lib/auth/middleware';

export const GET = optionalAuth(async (req) => {
    const auth = getAuthSafe();

    if (auth) {
        // Show personalized content for authenticated users
        const stories = await getPersonalizedStories(auth.userId);
        return Response.json(stories);
    } else {
        // Show public content for anonymous users
        const stories = await getPublicStories();
        return Response.json(stories);
    }
});
```

### Example 4: Admin-Only Endpoint

```typescript
import { adminOnly } from '@/lib/auth/middleware';

export const POST = adminOnly(async (req) => {
    // Only accessible by users with 'admin:all' scope
    const data = await req.json();
    await performAdminAction(data);
    return Response.json({ success: true });
});
```

---

## Migration from Old System

### Step 1: Update API Route

```typescript
// BEFORE
export async function POST(req: Request) {
    const apiKey = req.headers.get('x-api-key');
    const data = await req.json();
    const result = await createStory(data, userId, apiKey);
    return Response.json(result);
}

// AFTER
export const POST = withAuthentication(async (req: Request) => {
    const data = await req.json();
    const result = await createStory(data);
    return Response.json(result);
}, { requiredScopes: ['stories:write'] });
```

### Step 2: Update Service Function

```typescript
// BEFORE
export async function createStory(
    data: StoryInput,
    userId: string,
    apiKey?: string
): Promise<Story> {
    const content = await generateContent(prompt, apiKey);
    // ...
}

// AFTER
import { getAuth } from '@/lib/auth/server-context';

export async function createStory(
    data: StoryInput
): Promise<Story> {
    const auth = getAuth();
    const content = await generateContent(prompt);
    // ...
}
```

### Step 3: Update Generator

```typescript
// BEFORE
export async function generateContent(
    prompt: string,
    apiKey?: string
): Promise<string> {
    const client = new AIClient({ apiKey });
    return await client.generate(prompt);
}

// AFTER
export async function generateContent(
    prompt: string
): Promise<string> {
    const client = new AIClient();
    return await client.generate(prompt);
}
```

### Step 4: Update AI Client

```typescript
// BEFORE
export class AIClient {
    constructor(private options: { apiKey?: string }) {}

    async generate(prompt: string) {
        const headers = this.options.apiKey
            ? { 'x-api-key': this.options.apiKey }
            : {};
        // ...
    }
}

// AFTER
import { getApiKey } from '@/lib/auth/server-context';

export class AIClient {
    constructor() {}

    async generate(prompt: string) {
        const apiKey = getApiKey();
        const headers = apiKey
            ? { 'x-api-key': apiKey }
            : {};
        // ...
    }
}
```

---

## Testing Examples

### Test with Mock Context

```typescript
import { withAuth } from '@/lib/auth/server-context';
import { createApiKeyContext } from '@/lib/auth/context';

describe('createStory', () => {
    it('creates story with authentication', async () => {
        // Create mock auth context
        const authContext = createApiKeyContext(
            'test-api-key',
            'user-123',
            'test@example.com',
            ['stories:write'],
            { requestId: 'test-req-1', timestamp: Date.now() }
        );

        // Run test with context
        const result = await withAuth(authContext, async () => {
            return await createStory({
                title: 'Test Story',
                prompt: 'A test prompt'
            });
        });

        expect(result).toBeDefined();
        expect(result.title).toBe('Test Story');
    });

    it('throws error without authentication', async () => {
        // Test without context should throw
        await expect(async () => {
            await createStory({
                title: 'Test Story',
                prompt: 'A test prompt'
            });
        }).rejects.toThrow('No authentication context');
    });
});
```

---

## Benefits Summary

### Before (Old System)
- ❌ API key passed through 4+ function layers
- ❌ Every function signature includes `apiKey?: string`
- ❌ Easy to forget passing the API key
- ❌ Difficult to test
- ❌ No centralized permission checking

### After (New System)
- ✅ No API key parameters anywhere
- ✅ Clean function signatures
- ✅ Automatic context propagation
- ✅ Easy to test with mock contexts
- ✅ Centralized permission management
- ✅ Better type safety
- ✅ Improved developer experience

---

## Common Patterns

### Pattern 1: Service with Context Access

```typescript
export class StoryService {
    async create(data: StoryInput): Promise<Story> {
        const auth = getAuth();

        // Use auth throughout the service
        const story = await this.generateStory(data);
        story.userId = auth.userId;

        return await this.save(story);
    }

    private async generateStory(data: StoryInput): Promise<Story> {
        // Context automatically available
        const content = await aiService.generate(data.prompt);
        return { ...data, content };
    }
}
```

### Pattern 2: Conditional Logic Based on Scopes

```typescript
export async function getStories(): Promise<Story[]> {
    const auth = getAuth();

    if (auth.scopes.includes('admin:all')) {
        // Admins see all stories
        return await db.select().from(stories);
    } else {
        // Users see only their stories
        return await db.select().from(stories).where(eq(stories.userId, auth.userId));
    }
}
```

### Pattern 3: Safe Context Access

```typescript
export async function getPublicData(): Promise<Data> {
    const auth = getAuthSafe(); // Returns null if no context

    if (auth) {
        // Personalized data for authenticated users
        return await getPersonalizedData(auth.userId);
    } else {
        // Public data for anonymous users
        return await getPublicData();
    }
}
```

---

## Troubleshooting

### Issue: "No authentication context available"

**Cause**: Trying to call `getAuth()` outside of a `withAuth()` or `withAuthentication()` context.

**Solution**: Ensure your route uses the authentication middleware:

```typescript
// ❌ Wrong - No authentication middleware
export async function POST(req: Request) {
    const auth = getAuth(); // This will throw!
    // ...
}

// ✅ Correct - With authentication middleware
export const POST = withAuthentication(async (req: Request) => {
    const auth = getAuth(); // This works!
    // ...
});
```

### Issue: "Insufficient permissions"

**Cause**: User doesn't have required scopes for the endpoint.

**Solution**: Check the user's role and assigned scopes:

```typescript
export const POST = requireScopes('stories:write', 'images:write')(
    withAuthentication(async (req: Request) => {
        // User must have BOTH scopes
        // ...
    })
);
```

### Issue: Type errors with async functions

**Cause**: Context not properly propagated in async operations.

**Solution**: Ensure all async operations are within the `withAuth()` block:

```typescript
// ✅ Correct
export const POST = withAuthentication(async (req: Request) => {
    const data = await req.json();

    // All async operations within middleware have context
    const result = await someAsyncFunction();
    const more = await anotherAsyncFunction();

    return Response.json(result);
});
```

---

## Related Documentation

- [Authentication Profiles](./authentication-profiles.md) - User roles, password hashing, and API key management