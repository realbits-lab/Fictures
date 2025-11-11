# TypeScript Type System Guide

## Overview

This document describes the TypeScript type system architecture used in the Fictures web application, explaining how types flow through different layers and how to use existing types instead of creating duplicates.

## Type System Architecture

### Three-Layer Type System

```
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (HTTP)                          │
│  Location: src/app/studio/api/types.ts                      │
│  Purpose: HTTP request/response contracts                    │
│  Examples: GenerateStoryRequest, EvaluateSceneResponse      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Service Layer (Business Logic)               │
│  Location: src/lib/studio/generators/types.ts               │
│  Purpose: Internal function parameters and results           │
│  Examples: EvaluateSceneParams, EvaluateSceneResult         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Domain Layer (Entities)                     │
│  Location: src/lib/studio/generators/zod-schemas.generated  │
│  Purpose: Core entity types from Zod schemas                 │
│  Examples: Story, Scene, Chapter, Character                  │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema Types

```
┌─────────────────────────────────────────────────────────────┐
│              Database Schema (Source of Truth)               │
│  Location: src/lib/db/schema.ts                             │
│  Purpose: Drizzle ORM schema definitions                     │
│  Inference: typeof scenes.$inferSelect                       │
└─────────────────────────────────────────────────────────────┘
```

## Type Locations and Usage

### 1. API Types (`src/app/studio/api/types.ts`)

**Purpose**: Define HTTP API contracts between client and server

**When to use**:
- Writing test files that call API endpoints
- Implementing API route handlers
- Client-side API calls

**Available types**:
```typescript
// Story Generation
GenerateStoryRequest
GenerateStoryResponse
GenerateStoryErrorResponse

// Character Generation
GenerateCharactersRequest
GenerateCharactersResponse
GenerateCharactersErrorResponse

// Scene Evaluation
EvaluateSceneRequest
EvaluateSceneResponse
EvaluateSceneErrorResponse

// Entity types (re-exported for convenience)
Story, Scene, Chapter, Character, Setting, Part
```

**Example usage in tests**:
```typescript
import type {
  GenerateStoryRequest,
  GenerateStoryResponse,
  EvaluateSceneRequest,
  EvaluateSceneResponse,
} from "@/app/studio/api/types";

// Use for request bodies
const requestBody: GenerateStoryRequest = {
  userPrompt: "A fantasy adventure",
  language: "English",
  preferredGenre: "Fantasy",
  preferredTone: "hopeful", // Type-checked: only allows valid tones
};

// Use for response data
const response: GenerateStoryResponse = await fetch(...).then(r => r.json());
```

### 2. Service Types (`src/lib/studio/generators/types.ts`)

**Purpose**: Define internal service layer contracts (function parameters/results)

**When to use**:
- Implementing generator functions
- API routes calling generator functions
- Type annotations for service layer functions

**Available types**:
```typescript
// Function parameters
EvaluateSceneParams
GenerateSceneContentParams
GenerateSceneSummariesParams

// Function results
EvaluateSceneResult
GenerateSceneContentResult
GenerateSceneSummariesResult

// Shared types
GeneratorMetadata
ArrayGeneratorMetadata
```

**Example usage in generators**:
```typescript
import type {
  EvaluateSceneParams,
  EvaluateSceneResult,
} from "./types";

export async function evaluateScene(
  params: EvaluateSceneParams
): Promise<EvaluateSceneResult> {
  // Implementation uses parameter types
  const { content, story, maxIterations } = params;

  // Return matches result type
  return {
    finalContent: improvedContent,
    score: evaluationScore,
    categories: { plot, character, pacing, prose, worldBuilding },
    feedback: { strengths: [], improvements: [] },
    iterations: iterationCount,
    improved: wasImproved,
    metadata: { generationTime: elapsed },
  };
}
```

### 3. Database Schema Types (`src/lib/db/schema.ts`)

**Purpose**: Define database table structures using Drizzle ORM

**When to use**:
- Database query results
- API route handlers working with database records
- Type annotations for database operations

**Type inference pattern**:
```typescript
import { scenes, chapters, stories } from "@/lib/db/schema";

// Create type aliases for readability
type SceneRecord = typeof scenes.$inferSelect;
type ChapterRecord = typeof chapters.$inferSelect;
type StoryRecord = typeof stories.$inferSelect;

// Use in query results
const sceneResults: SceneRecord[] = await db
  .select()
  .from(scenes)
  .where(eq(scenes.id, sceneId));

const scene: SceneRecord | undefined = sceneResults[0];
```

## Best Practices

### ✅ DO: Use Existing Types

**Before creating a new type, check these locations**:

1. **API types**: `src/app/studio/api/types.ts`
2. **Service types**: `src/lib/studio/generators/types.ts`
3. **Entity types**: `src/lib/studio/generators/zod-schemas.generated.ts`
4. **Database types**: `src/lib/db/schema.ts` (use `$inferSelect`)

**Example - Using existing API types**:
```typescript
// ✅ GOOD: Use existing GenerateStoryRequest
import type { GenerateStoryRequest } from "@/app/studio/api/types";

const body: GenerateStoryRequest = {
  userPrompt: "...",
  preferredTone: "hopeful",
};
```

```typescript
// ❌ BAD: Creating duplicate inline type
const body: {
  userPrompt: string;
  preferredTone: string; // Missing validation!
} = {
  userPrompt: "...",
  preferredTone: "mysterious", // Runtime error! Not a valid tone
};
```

### ✅ DO: Create Named Type Aliases

**Use type aliases for complex types**:

```typescript
// ✅ GOOD: Named type alias for Drizzle inference
type SceneRecord = typeof scenes.$inferSelect;

const sceneResults: SceneRecord[] = await db.select()...;
const scene: SceneRecord | undefined = sceneResults[0];
```

```typescript
// ❌ BAD: Inline Drizzle inference (verbose and repetitive)
const sceneResults: Array<typeof scenes.$inferSelect> = await db.select()...;
const scene: typeof scenes.$inferSelect | undefined = sceneResults[0];
```

### ✅ DO: Use Index Access Types

**Extract nested types from existing types**:

```typescript
// ✅ GOOD: Extract nested type using index access
type EvaluationCategories = EvaluateSceneResult["categories"];

const categories: EvaluationCategories = {
  plot: 0,
  character: 0,
  pacing: 0,
  prose: 0,
  worldBuilding: 0,
};
```

```typescript
// ❌ BAD: Duplicate inline type definition
const categories: {
  plot: number;
  character: number;
  pacing: number;
  prose: number;
  worldBuilding: number;
} = { /* ... */ };
```

### ✅ DO: Create Type Aliases for Utility Types

**For `Awaited<ReturnType<>>` and similar utility types**:

```typescript
// ✅ GOOD: Named type alias
type TextGenerationResponse = Awaited<
  ReturnType<typeof textGenerationClient.generate>
>;

const response: TextGenerationResponse = await textGenerationClient.generate({
  prompt: "...",
});
```

```typescript
// ❌ BAD: Inline utility type (hard to read)
const response: Awaited<ReturnType<typeof textGenerationClient.generate>> =
  await textGenerationClient.generate({ prompt: "..." });
```

### ✅ DO: Define Local Types for Test-Specific APIs

**When APIs don't have exported response types**:

```typescript
// ✅ GOOD: Local interface for list endpoint response
interface PartsListResponse {
  parts?: Array<{ id: string }>;
}

const partsData: PartsListResponse = await fetch(
  `/studio/api/parts?storyId=${id}`
).then(r => r.json());
```

## Type Flow Examples

### Example 1: Scene Evaluation

```
┌─────────────────────────────────────────────────────────────┐
│ TEST FILE                                                    │
│ __tests__/api/studio/scene-evaluation.test.ts               │
├─────────────────────────────────────────────────────────────┤
│ Import: EvaluateSceneRequest, EvaluateSceneResponse         │
│ From:   @/app/studio/api/types                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ API ROUTE                                                    │
│ src/app/studio/api/scene-evaluation/route.ts                │
├─────────────────────────────────────────────────────────────┤
│ Import: EvaluateSceneParams, EvaluateSceneResult            │
│ From:   @/lib/studio/generators/types                       │
│                                                              │
│ Maps:   Request → Params → Result → Response                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ GENERATOR FUNCTION                                           │
│ src/lib/studio/generators/scene-evaluation-generator.ts     │
├─────────────────────────────────────────────────────────────┤
│ Input:  EvaluateSceneParams                                 │
│ Output: EvaluateSceneResult                                 │
└─────────────────────────────────────────────────────────────┘
```

### Example 2: Database Operations

```
┌─────────────────────────────────────────────────────────────┐
│ API ROUTE                                                    │
│ src/app/studio/api/scene-evaluation/route.ts                │
├─────────────────────────────────────────────────────────────┤
│ Import: scenes, chapters, stories                           │
│ From:   @/lib/db/schema                                     │
│                                                              │
│ Type Aliases:                                                │
│   type SceneRecord = typeof scenes.$inferSelect             │
│   type ChapterRecord = typeof chapters.$inferSelect         │
│   type StoryRecord = typeof stories.$inferSelect            │
│                                                              │
│ Usage:                                                       │
│   const results: SceneRecord[] = await db.select()...       │
│   const scene: SceneRecord | undefined = results[0]         │
└─────────────────────────────────────────────────────────────┘
```

## Common Patterns

### Pattern 1: API Route Handler

```typescript
import type { NextRequest } from "next/server";
import { z } from "zod";
import { scenes, chapters, stories } from "@/lib/db/schema";
import type {
  EvaluateSceneParams,
  EvaluateSceneResult,
} from "@/lib/studio/generators/types";

// 1. Define type aliases for database records
type SceneRecord = typeof scenes.$inferSelect;
type ChapterRecord = typeof chapters.$inferSelect;
type StoryRecord = typeof stories.$inferSelect;

export async function POST(request: NextRequest) {
  // 2. Parse and validate request
  const body: unknown = await request.json();
  const validatedData: z.infer<typeof requestSchema> = requestSchema.parse(body);

  // 3. Database queries with typed results
  const sceneResults: SceneRecord[] = await db.select()...;
  const scene: SceneRecord | undefined = sceneResults[0];

  // 4. Call generator with service types
  const result: EvaluateSceneResult = await evaluateScene(params);

  // 5. Return API response (types inferred from Response interface)
  return NextResponse.json({ success: true, scene, evaluation: result });
}
```

### Pattern 2: Generator Function

```typescript
import type {
  EvaluateSceneParams,
  EvaluateSceneResult,
} from "./types";

// Use index access for nested types
type EvaluationCategories = EvaluateSceneResult["categories"];

export async function evaluateScene(
  params: EvaluateSceneParams
): Promise<EvaluateSceneResult> {
  // Use extracted type
  const categories: EvaluationCategories = {
    plot: 0,
    character: 0,
    pacing: 0,
    prose: 0,
    worldBuilding: 0,
  };

  // Return matches EvaluateSceneResult structure
  return {
    finalContent,
    score,
    categories,
    feedback: { strengths: [], improvements: [] },
    iterations,
    improved,
    metadata: { generationTime },
  };
}
```

### Pattern 3: Test File

```typescript
import type {
  GenerateStoryRequest,
  GenerateStoryResponse,
  EvaluateSceneRequest,
  EvaluateSceneResponse,
} from "@/app/studio/api/types";

describe("Scene Evaluation API", () => {
  it("should evaluate scene", async () => {
    // 1. Use API request type
    const storyRequest: GenerateStoryRequest = {
      userPrompt: "Test story",
      preferredTone: "hopeful", // Type-checked!
    };

    // 2. Use API response type
    const storyResponse: GenerateStoryResponse = await fetch(...)
      .then(r => r.json());

    // 3. Use evaluation types
    const evalRequest: EvaluateSceneRequest = {
      sceneId: storyResponse.story.id,
      maxIterations: 2,
    };

    const evalResponse: EvaluateSceneResponse = await fetch(...)
      .then(r => r.json());
  });
});
```

## Type Checking Commands

```bash
# Check entire project
pnpm type-check

# Check entire project (watch mode)
pnpm type-check:watch

# Build (includes type checking)
pnpm build
```

## Summary

**Remember**:
1. **Check existing types first** before creating new ones
2. **Use API types** for HTTP requests/responses
3. **Use service types** for generator functions
4. **Use database types** with `$inferSelect` for queries
5. **Create type aliases** for complex or repeated types
6. **Use index access types** to extract nested types
7. **Name all non-trivial types** - avoid inline types

**Type Safety Benefits**:
- Compile-time validation of API contracts
- Auto-completion in IDEs
- Refactoring safety
- Runtime error prevention
- Documentation through types
