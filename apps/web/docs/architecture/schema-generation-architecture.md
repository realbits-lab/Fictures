# Schema Generation Architecture

**Single Source of Truth: Drizzle Schema → Zod Schemas → JSON Schemas**

## Overview

This document describes the unified schema architecture where the Drizzle ORM database schema serves as the **Single Source of Truth (SSOT)** for all type definitions across the application.

**Flow:**
```
Drizzle schema.ts (SSOT)
    ↓ drizzle-zod
Zod schemas (runtime validation + TypeScript types)
    ↓ zod-to-json-schema
JSON schemas (Gemini structured output)
```

## Architecture Layers

### Layer 1: Database Schema (SSOT)

**File:** `src/lib/schemas/database/index.ts`

**Purpose:** Single source of truth for all data structures

**Technology:** Drizzle ORM with PostgreSQL

**Example:**
```typescript
export const characters = pgTable("characters", {
  id: text().primaryKey().notNull(),
  storyId: text("story_id").notNull(),
  name: varchar({ length: 255 }).notNull(),
  coreTrait: text("core_trait"),
  personality: json(), // Nested object
  voiceStyle: json("voice_style"), // Nested object
  // ...
});
```

**Why This is SSOT:**
- Defines actual database structure
- Enforced by PostgreSQL constraints
- Validated by Drizzle migrations
- Used at runtime for all database operations

### Layer 2: Zod Schemas (Auto-Generated)

**File:** `src/lib/studio/generators/zod-schemas.ts`

**Purpose:** Runtime validation + TypeScript type inference

**Technology:** `drizzle-zod` (official Drizzle plugin)

**Example:**
```typescript
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { characters } from "@/lib/schemas/database";

// Refine JSON fields with nested Zod schemas
const personalitySchema = z.object({
  traits: z.array(z.string()),
  values: z.array(z.string()),
});

export const insertCharacterSchema = createInsertSchema(characters, {
  coreTrait: z.enum(["courage", "compassion", "integrity", "loyalty", "wisdom", "sacrifice"]),
  personality: personalitySchema,
  voiceStyle: voiceStyleSchema,
});

export const selectCharacterSchema = createSelectSchema(characters);

// Infer TypeScript types from Zod schemas
export type Character = z.infer<typeof selectCharacterSchema>;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
```

**Benefits:**
- **Runtime Validation:** Zod validates data at runtime (API requests, database inserts)
- **Type Safety:** TypeScript types automatically inferred from Zod schemas
- **JSON Field Refinement:** Nested schemas for complex JSON columns
- **Insert vs. Select:** Separate schemas for database writes vs. reads

**Usage Example:**
```typescript
// API route with runtime validation
export async function POST(request: Request) {
  const body = await request.json();

  // Runtime validation with Zod
  const validated = insertCharacterSchema.parse(body);

  // validated is fully type-safe!
  await db.insert(characters).values(validated);
}
```

### Layer 3: JSON Schemas (Auto-Generated)

**File:** `src/lib/studio/generators/json-schemas.generated.ts`

**Purpose:** Gemini structured output API contracts

**Technology:** `zod-to-json-schema` (converts Zod → OpenAPI 3.0 JSON Schema)

**Example:**
```typescript
import { zodToJsonSchema } from "zod-to-json-schema";
import { insertCharacterSchema } from "./zod-schemas";

const toGeminiJsonSchema = (zodSchema: any) => {
  const { $schema, ...rest } = zodToJsonSchema(zodSchema, {
    target: "openApi3",
    $refStrategy: "none",
  });
  return rest; // Remove $schema field that Gemini doesn't accept
};

export const CharacterJsonSchema = toGeminiJsonSchema(insertCharacterSchema);
```

**Usage with Gemini:**
```typescript
const response = await textGenerationClient.generate({
  prompt: userPrompt,
  responseFormat: "json",
  responseSchema: CharacterJsonSchema, // Gemini enforces this structure
});
```

## File Organization

```
src/lib/
├── db/
│   └── schema.ts                          ← SSOT: Drizzle ORM schema
│
└── studio/
    └── generators/
        ├── zod-schemas.ts       ← Auto-generated: Zod schemas + TS types
        ├── json-schemas.generated.ts      ← Auto-generated: JSON schemas for Gemini
        ├── types.ts                       ← Manual: Generator function signatures
        ├── ai-client.ts                   ← Uses generated schemas
        └── *-generator.ts                 ← Use generated types
```

## Type Mapping

| Database Schema | Zod Schema | TypeScript Type | JSON Schema |
|----------------|------------|-----------------|-------------|
| `characters` table | `insertCharacterSchema` | `InsertCharacter` | `CharacterJsonSchema` |
| `stories` table | `insertStorySchema` | `InsertStory` | `StorySummaryJsonSchema` |
| `settings` table | `insertSettingSchema` | `InsertSetting` | `SettingJsonSchema` |
| `parts` table | `insertPartSchema` | `InsertPart` | `PartJsonSchema` |
| `chapters` table | `insertChapterSchema` | `InsertChapter` | `ChapterJsonSchema` |
| `scenes` table | `insertSceneSchema` | `InsertScene` | `SceneSummaryJsonSchema` |

## Schema Generation Process

**How It Works:**

The schema generation happens automatically through TypeScript imports and exports:

1. **Zod schemas** are generated from Drizzle schema using `drizzle-zod` in `src/lib/studio/generators/zod-schemas.ts`
2. **JSON schemas** are generated from Zod schemas using `zod-to-json-schema` in `src/lib/studio/generators/json-schemas.generated.ts`
3. All generated files are TypeScript files compiled and type-checked during the build process

**No manual generation script is needed** - the schemas are automatically updated when you import and use them in the codebase.

## Benefits

### ✅ Single Source of Truth
- **Database schema drives everything** - Change once, propagate everywhere
- **No manual duplication** - Zero risk of schema drift
- **Type safety across all layers** - Database ↔ API ↔ Gemini

### ✅ Runtime Validation
- **Zod validates at runtime** - Catch errors before database writes
- **API request validation** - Invalid data rejected early
- **Database insert validation** - Ensure data integrity

### ✅ Type Safety
- **TypeScript types from Zod** - Compile-time type checking
- **Inferred types** - No manual type definitions
- **Full IDE support** - Autocomplete and error detection

### ✅ Gemini Structured Output
- **JSON schemas auto-generated** - Always match database structure
- **API contract enforcement** - Gemini returns valid data
- **No manual JSON schema maintenance** - Automatically synchronized

### ✅ Developer Experience
- **Change schema once** - All types update automatically
- **No synchronization needed** - Automatic propagation
- **Clear error messages** - Zod provides detailed validation errors
- **Documentation as code** - Schema is self-documenting

## Workflow

### Adding a New Field to Database

**Example:** Add `backstory` field to characters

**Step 1:** Update Drizzle schema (`src/lib/schemas/database/index.ts`)
```typescript
export const characters = pgTable("characters", {
  // ... existing fields
  backstory: text(), // ← Add new field
});
```

**Step 2:** Generate database migration
```bash
pnpm db:generate
pnpm db:migrate
```

**Step 3:** Update Zod refinement if needed (`src/lib/studio/generators/zod-schemas.ts`)
```typescript
export const insertCharacterSchema = createInsertSchema(characters, {
  // No changes needed - backstory is text field
  // Only refine if it's a complex JSON field or enum
});
```

**Step 4:** Build and verify
```bash
pnpm build
```

**That's it!** All TypeScript types, Zod schemas, and JSON schemas are automatically updated.

### Updating a JSON Field Structure

**Example:** Add `quirks` array to character voice style

**Step 1:** Update Drizzle schema comment (documentation only - JSON fields are untyped in DB)

**Step 2:** Update Zod refinement (`src/lib/studio/generators/zod-schemas.ts`)
```typescript
const voiceStyleSchema = z.object({
  tone: z.string(),
  vocabulary: z.string(),
  quirks: z.array(z.string()), // ← Add new field
  emotionalRange: z.string(),
});

export const insertCharacterSchema = createInsertSchema(characters, {
  voiceStyle: voiceStyleSchema, // ← Updated refinement
});
```

**Step 3:** Build and verify
```bash
pnpm build
```

**Result:** TypeScript types and JSON schemas automatically include the new `quirks` field.

## Migration from Old Architecture

### Before (Manual Duplication)

```
src/lib/studio/generators/
├── ai-types.ts                   ← Manual TypeScript interfaces
├── json-schemas.ts               ← Manual JSON schemas
└── types.ts                      ← Generator function types
```

**Problems:**
- ❌ Triple duplication (DB schema, TS types, JSON schemas)
- ❌ Manual synchronization required
- ❌ High risk of schema drift
- ❌ No runtime validation

### After (Auto-Generated from SSOT)

```
src/lib/db/
└── schema.ts                     ← SSOT: Database schema

src/lib/studio/generators/
├── zod-schemas.ts      ← Auto-generated: Zod + TS types
├── json-schemas.generated.ts     ← Auto-generated: JSON schemas
└── types.ts                      ← Manual: Function signatures only
```

**Benefits:**
- ✅ Single source of truth (Drizzle schema)
- ✅ Automatic synchronization (via drizzle-zod + zod-to-json-schema)
- ✅ Zero risk of schema drift
- ✅ Runtime validation with Zod

### Import Changes

**Before:**
```typescript
import { CharacterGenerationResult } from "./ai-types";
import { CharacterJsonSchema } from "./json-schemas";
```

**After:**
```typescript
import { Character, InsertCharacter } from "./zod-schemas";
import { CharacterJsonSchema } from "./json-schemas.generated";
```

## Dependencies

- **`drizzle-zod@^0.8.3`** - Official Drizzle plugin for Zod schema generation
- **`zod@^4.1.5`** - Runtime validation and type inference
- **`zod-to-json-schema@^3.24.6`** - Convert Zod schemas to JSON Schema (OpenAPI 3.0)

## Best Practices

### 1. Never Edit Generated Files Manually
- `zod-schemas.ts` and `json-schemas.generated.ts` are auto-generated
- Edit `src/lib/schemas/database/index.ts` instead
- Refinements for JSON fields go in the generated files (but are template-based)

### 2. Use Zod Validation in API Routes
```typescript
export async function POST(request: Request) {
  const body = await request.json();

  // Runtime validation
  const validated = insertCharacterSchema.parse(body);

  // Now type-safe!
  await db.insert(characters).values(validated);
}
```

### 3. Use Generated Types in Generators
```typescript
import { Character, InsertCharacter } from "./zod-schemas";

export async function generateCharacter(): Promise<Character> {
  // Return type is guaranteed to match database schema
}
```

### 4. Keep Function Types Separate
- `types.ts` still exists for **generator function signatures**
- These are different from **entity types** (which come from Zod)

```typescript
// types.ts - Function signatures
export interface GenerateCharactersParams {
  storyId: string;
  characterCount: number;
  onProgress?: ProgressCallback;
}

export interface GenerateCharactersResult {
  characters: Character[]; // ← Uses generated type
  metadata: GeneratorMetadata;
}
```

## Troubleshooting

### Q: Build fails with "Cannot find module './zod-schemas'"

**A:** The generated files are TypeScript files that exist in the source tree. Make sure they were created:
```bash
ls src/lib/studio/generators/zod-schemas.ts
ls src/lib/studio/generators/json-schemas.generated.ts
```

### Q: Zod validation fails but TypeScript compiles fine

**A:** Zod provides **runtime** validation, TypeScript provides **compile-time** validation. Both are needed:
- TypeScript catches errors during development
- Zod catches errors at runtime (invalid API requests, bad data)

### Q: How do I refine a JSON field?

**A:** Update the Zod refinement in `zod-schemas.ts`:
```typescript
const personalitySchema = z.object({
  traits: z.array(z.string()),
  values: z.array(z.string()),
});

export const insertCharacterSchema = createInsertSchema(characters, {
  personality: personalitySchema, // ← Refine JSON field
});
```

## References

- **Drizzle ORM Docs:** https://orm.drizzle.team/
- **drizzle-zod Plugin:** https://orm.drizzle.team/docs/zod
- **Zod Documentation:** https://zod.dev/
- **zod-to-json-schema:** https://github.com/StefanTerdell/zod-to-json-schema
- **Database Schema:** `src/lib/schemas/database/index.ts`
- **Generated Zod Schemas:** `src/lib/studio/generators/zod-schemas.ts`
- **Generated JSON Schemas:** `src/lib/studio/generators/json-schemas.generated.ts`
