# Authentication Layer Pattern - Future Consideration

**Status**: Under Consideration
**Created**: 2025-11-12
**Category**: Architecture Decision Record (ADR)

## Context

Currently, API keys are passed through multiple layers of the application:

```
API Route (dual-auth validation)
  ↓ apiKey
Service Layer (DB + Business Logic)
  ↓ apiKey
Generator Layer (AI calls)
  ↓ apiKey
AI Server (validation)
```

## Problem Statement

### Current Issues

1. **Coupling & Redundancy**
   - Generators are coupled to authentication concerns
   - API key validated twice (API route + AI server)
   - Every service/generator method signature needs `apiKey` parameter
   - Credentials passed through business logic layers

2. **Service Layer Complexity**
   ```typescript
   // Current pattern
   class StoryService {
     async generateChapter(storyId: string, prompt: string, apiKey: string) {
       // 1. DB operations
       const story = await db.query.stories.findFirst(...);

       // 2. Create generator with apiKey
       const generator = createTextGenerationClient(apiKey);

       // 3. Generate content
       const chapter = await generator.generate(prompt);

       // 4. Save to DB
       await db.insert(chapters).values(chapter);
     }
   }
   ```

3. **Method Signature Pollution**
   - Every service method needs `apiKey` parameter
   - Parameter not semantically related to business logic
   - Clutters method signatures with infrastructure concerns

## Evaluated Approaches

### Option 1: Pass Generators to Service Methods
```typescript
await storyService.generateChapter(storyId, prompt, generators);
```
- ✅ Simple, explicit
- ❌ Clutters service signatures
- ❌ Repetitive (every method needs generators param)

### Option 2: Service as Class (Constructor Injection) ⭐ **RECOMMENDED**
```typescript
const service = createStoryService({ apiKey });
await service.generateChapter(storyId, prompt);
```
- ✅ Clean service method signatures
- ✅ Dependencies injected once
- ✅ Easy to test (inject mocks)
- ✅ Works for web app + scripts
- ❌ Changes from singleton services to instances

### Option 3: Layered Factories
```typescript
const app = createAppContext({ apiKey });
await app.services.story.generateChapter(storyId, prompt);
```
- ✅ Everything configured in one place
- ❌ Large context object
- ❌ Recreates everything per request

### Option 4: Split Service Responsibilities
```typescript
const generators = createGenerators({ apiKey });
const story = await storyRepository.getStory(storyId);
const chapter = await generators.chapter.generate(prompt);
```
- ✅ Clear separation of concerns
- ❌ Business logic scattered in API routes/scripts
- ❌ Loses encapsulation

### Option 5: Keep Current Pattern (with cleanup)
```typescript
await storyService.generateChapter(storyId, prompt, { apiKey });
```
- ✅ Minimal changes
- ❌ Still passing auth through layers
- ❌ Creates generators on every call

### Option 6: Context Manager Pattern (AsyncLocalStorage)
```typescript
authContext.run({ apiKey }, async () => {
  await storyService.generateChapter(storyId, prompt);
});
```
- ✅ No parameter passing
- ❌ Doesn't work in scripts
- ❌ Magic/implicit (harder to understand)

## Recommended Approach: Service Classes with Factory

### Architecture

```typescript
// 1. Generator Factory
function createGenerators(auth: { apiKey: string }) {
  const textClient = createTextGenerationClient(auth.apiKey);
  const imageClient = createImageGenerationClient(auth.apiKey);

  return {
    chapter: new ChapterGenerator(textClient),
    scene: new SceneGenerator(textClient, imageClient),
    character: new CharacterGenerator(textClient, imageClient),
  };
}

// 2. Service Factory
function createStoryService(auth: { apiKey: string }) {
  const db = getDatabase();
  const generators = createGenerators(auth);

  return new StoryService(db, generators);
}

// 3. Service Class (clean methods!)
class StoryService {
  constructor(
    private db: Database,
    private generators: Generators
  ) {}

  async generateChapter(storyId: string, prompt: string) {
    // NO apiKey parameter needed!
    const story = await this.db.query.stories.findFirst(...);
    const chapter = await this.generators.chapter.generate(prompt);
    await this.db.insert(chapters).values(chapter);
    return chapter;
  }
}
```

### Usage Patterns

**API Route:**
```typescript
export async function POST(req: Request) {
  const apiKey = await getDualAuthApiKey(req);
  const storyService = createStoryService({ apiKey });

  const result = await storyService.generateChapter(storyId, prompt);
  return Response.json(result);
}
```

**Script:**
```typescript
const apiKey = loadProfile('writer').apiKey;
const storyService = createStoryService({ apiKey });
const result = await storyService.generateChapter(storyId, prompt);
```

### Benefits

| Aspect | Current | Recommended |
|--------|---------|-------------|
| Service method signatures | `generateChapter(id, prompt, apiKey)` | `generateChapter(id, prompt)` |
| Generator creation | Every method call | Once at service creation |
| Script support | ✅ Yes | ✅ Yes |
| Web app support | ✅ Yes | ✅ Yes |
| Testability | ⚠️ Medium | ✅ Excellent (mock injection) |
| Credential passing | ❌ Through all layers | ✅ Only at factory |
| Type safety | ⚠️ Weak | ✅ Strong |

## Migration Strategy

### Phase 1: Create Factories (Non-Breaking)
```typescript
// Add factory alongside existing code
export function createStoryService(auth: { apiKey: string }) {
  return new StoryService(getDatabase(), createGenerators(auth));
}

// Keep existing singleton for backward compatibility
export const storyService = {
  // Old methods (deprecated)
  generateChapter: async (id, prompt, apiKey) => { ... },

  // New factory
  create: createStoryService,
};
```

### Phase 2: Migrate API Routes
- Update one API route as proof of concept
- Test thoroughly
- Gradually migrate remaining routes
- Keep both patterns working during transition

### Phase 3: Migrate Scripts
- Update scripts to use factory pattern
- Test with actual API calls
- Verify authentication works correctly

### Phase 4: Clean Up
- Remove deprecated methods
- Update documentation
- Remove old pattern examples

## Trade-offs

### Advantages
- ✅ Clean separation of concerns
- ✅ Authentication configured once, used everywhere
- ✅ Easy to test (dependency injection)
- ✅ Supports both web app and scripts
- ✅ Type-safe and explicit
- ✅ No credential passing through business logic

### Disadvantages
- ❌ Breaking change (requires migration)
- ❌ More boilerplate (factory functions)
- ❌ Services change from singletons to instances
- ❌ Need to pass service instances around (or recreate per request)

## Open Questions

1. **Performance**: Creating service instances per request vs singleton - measure overhead
2. **Memory**: Do we need pooling for service instances?
3. **Caching**: How do we handle cached generators/clients?
4. **Testing**: Do we need test-specific factories?
5. **Migration**: Can we do this incrementally or need big-bang?

## Related Patterns

- **Dependency Injection**: Services receive dependencies via constructor
- **Factory Pattern**: Functions that create configured instances
- **Repository Pattern**: Data access layer separate from business logic
- **Service Layer Pattern**: Business logic encapsulation

## References

- Current implementation: `apps/web/src/lib/studio/generators/ai-client.ts`
- Service layer: `apps/web/src/lib/studio/` (various services)
- API routes: `apps/web/src/app/studio/api/` (various endpoints)
- Scripts: `apps/web/scripts/` (various generation scripts)

## Decision

**Status**: DEFERRED - To be decided later

When implementing:
1. Start with proof of concept (one service + one API route)
2. Measure performance impact
3. Update this document with findings
4. Make final decision based on real-world usage

---

**Last Updated**: 2025-11-12
**Next Review**: When starting service layer refactoring
