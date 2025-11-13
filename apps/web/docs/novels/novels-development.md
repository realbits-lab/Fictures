# Novels Generation Guide: Adversity-Triumph Engine

## Overview

This document provides comprehensive implementation specifications for the novels generation APIs using the Adversity-Triumph Engine, including complete examples and iterative improvement workflows.

**Related Documents:**
- 📖 **Specification** (`novels-specification.md`): Core concepts, data model, and theoretical foundation
- 🧪 **Evaluation Guide** (`novels-evaluation.md`): Validation methods, quality metrics, and test strategies

---

## Part I: Code Architecture (Common Generator Library)

### 1.1 Architectural Decision: Studio vs Novels

**Purpose Separation:**
- **`src/lib/studio/`**: Creation/generation functionality (write operations)
- **`src/lib/novels/`**: Reading/viewing functionality (read operations)

### 1.2 Type Naming Convention

**Layer-Based Naming Pattern**: `{Layer}{Entity}{Suffix}`

All types follow a consistent layer-prefix pattern with explicit suffixes for searchability and clarity.

**Layer Prefixes:**
- `Api` - HTTP layer (API routes)
- `Service` - Orchestration layer (business logic coordination)
- `Generator` - Core business logic (generation functions)
- `Ai` - AI output layer (Zod validation, JSON Schema)

**Suffixes:**
- `Request` - HTTP request body (API layer)
- `Response` - HTTP response body (API layer)
- `ErrorResponse` - HTTP error response (API layer)
- `Params` - Function parameters (Service/Generator layer)
- `Result` - Function return type (Service/Generator layer)
- `Type` - TypeScript type (AI layer - derived from Zod)
- `ZodSchema` - Zod validation schema (AI layer - SSOT)
- `JsonSchema` - JSON Schema for Gemini API (AI layer - derived from Zod)

**Complete Type Hierarchy for Story Generation:**

```
┌────────────────────────────────────────────────────────────────────┐
│ API Layer (HTTP Contracts)                                         │
├────────────────────────────────────────────────────────────────────┤
│ POST /api/studio/story                                             │
│   Request:  ApiStoryRequest                                        │
│   Response: ApiStoryResponse | ApiStoryErrorResponse               │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ Service Layer (Generation + Persistence)                           │
├────────────────────────────────────────────────────────────────────┤
│ storyService.generateAndSave(params: ServiceStoryParams)           │
│   → returns ServiceStoryResult                                     │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ Generator Layer (Business Logic)                                   │
├────────────────────────────────────────────────────────────────────┤
│ generateStory(params: GeneratorStoryParams) -> GeneratorStoryResult│
│   → promptManager.getPrompt(type, promptParams: StoryPromptParams)│
│   → textGenerationClient.generateStructured(                       │
│        prompt: string,                                             │
│        AiStoryZodSchema,                                           │
│        options: TextGenerationOptions                              │
│      ): AiStoryType                                                │
│   → returns GeneratorStoryResult {                                 │
│        story: AiStoryType,                                         │
│        metadata: GeneratorMetadata                                 │
│      }                                                             │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ AI Layer (SSOT - Zod Schema)                                      │
├────────────────────────────────────────────────────────────────────┤
│ AiStoryZodSchema (Zod)           ← SSOT                           │
│    ↓ z.infer                                                       │
│ AiStoryType (TypeScript)         ← Auto-derived                   │
│    ↓ z.toJSONSchema (Zod v4 native)                               │
│ AiStoryJsonSchema (JSON Schema)  ← Auto-derived                   │
└────────────────────────────────────────────────────────────────────┘
```

**SSOT Flow (AI Layer):**

```typescript
// SSOT: Zod Schema
const AiStoryZodSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(10).max(1000),
  genre: z.string().min(1),
  tone: z.enum(['hopeful', 'dark', 'bittersweet', 'satirical']),
  moralFramework: z.string().min(50).max(2000),
});

// Derived: TypeScript Type
type AiStoryType = z.infer<typeof AiStoryZodSchema>;

// Derived: JSON Schema (Zod v4 native)
const AiStoryJsonSchema = z.toJSONSchema(AiStoryZodSchema, {
  target: "openapi-3.0",
  $refStrategy: "none",
});
```

**Type Usage Pattern Across All Layers:**

```typescript
// ─────────────────────────────────────────────────────
// API Layer (Route Handler)
// ─────────────────────────────────────────────────────
const request: ApiStoryRequest = await req.json();

// Map API request to Service params
const serviceParams: ServiceStoryParams = {
  userId: session.user.id,
  userPrompt: request.userPrompt,
  language: request.language,
};

const result: ServiceStoryResult = await storyService.generate(serviceParams);

const response: ApiStoryResponse = {
  success: true,
  story: result.story,
  metadata: result.metadata,
};

// ─────────────────────────────────────────────────────
// Service Layer (Generation + Persistence)
// ─────────────────────────────────────────────────────
async function generateAndSave(params: ServiceStoryParams): Promise<ServiceStoryResult> {
  // 1. Map Service params to Generator params
  const generatorParams: GeneratorStoryParams = {
    userPrompt: params.userPrompt,
    language: params.language,
  };

  // 2. Generate using pure generator (no DB operations)
  const result: GeneratorStoryResult = await generateStory(generatorParams);

  // 3. Prepare & validate data for database
  const storyData = insertStorySchema.parse({
    id: nanoid(),
    authorId: params.userId,
    ...result.story,  // AiStoryType
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // 4. Save to database
  const savedStory: Story = await db.insert(stories)
    .values(storyData)
    .returning()[0];

  // 5. Return result
  return {
    story: savedStory,
    metadata: result.metadata,
  };
}

// ─────────────────────────────────────────────────────
// Generator Layer (Business Logic)
// ─────────────────────────────────────────────────────
async function generateStory(
  params: GeneratorStoryParams
): Promise<GeneratorStoryResult> {
  const prompt = promptManager.getPrompt('story', params);

  // Generate using Gemini API with JSON Schema
  const aiData: AiStoryType = await textGenerationClient.generateStructured(
    prompt,
    AiStoryJsonSchema,  // Uses derived JSON Schema
    { temperature: 0.7 }
  );

  // Validate with Zod
  const validated = AiStoryZodSchema.parse(aiData);

  return {
    story: validated,
    metadata: { modelId: 'gemini-2.5-flash', tokens: 1250 }
  };
}
```

**Complete Type Table for All Generators:**

| Generator | API Request | API Response | API Error | Service Params | Service Result | Generator Params | Generator Result | **AI Zod Schema** | **AI Type** | **AI JSON Schema** | Database Entity |
|-----------|-------------|--------------|-----------|----------------|----------------|------------------|------------------|-------------------|-------------|-------------------|----------------|
| Story | `ApiStoryRequest` | `ApiStoryResponse` | `ApiStoryErrorResponse` | `ServiceStoryParams` | `ServiceStoryResult` | `GeneratorStoryParams` | `GeneratorStoryResult` | **`AiStoryZodSchema`** | **`AiStoryType`** | **`AiStoryJsonSchema`** | `Story`, `InsertStory` |
| Characters | `ApiCharactersRequest` | `ApiCharactersResponse` | `ApiCharactersErrorResponse` | `ServiceCharactersParams` | `ServiceCharactersResult` | `GeneratorCharactersParams` | `GeneratorCharactersResult` | **`AiCharacterZodSchema`** | **`AiCharacterType`** | **`AiCharacterJsonSchema`** | `Character`, `InsertCharacter` |
| Settings | `ApiSettingsRequest` | `ApiSettingsResponse` | `ApiSettingsErrorResponse` | `ServiceSettingsParams` | `ServiceSettingsResult` | `GeneratorSettingsParams` | `GeneratorSettingsResult` | **`AiSettingZodSchema`** | **`AiSettingType`** | **`AiSettingJsonSchema`** | `Setting`, `InsertSetting` |
| Parts | `ApiPartsRequest` | `ApiPartsResponse` | `ApiPartsErrorResponse` | `ServicePartsParams` | `ServicePartsResult` | `GeneratorPartsParams` | `GeneratorPartsResult` | **`AiPartZodSchema`** | **`AiPartType`** | **`AiPartJsonSchema`** | `Part`, `InsertPart` |
| Chapters | `ApiChaptersRequest` | `ApiChaptersResponse` | `ApiChaptersErrorResponse` | `ServiceChaptersParams` | `ServiceChaptersResult` | `GeneratorChaptersParams` | `GeneratorChaptersResult` | **`AiChapterZodSchema`** | **`AiChapterType`** | **`AiChapterJsonSchema`** | `Chapter`, `InsertChapter` |
| Scene Summary | `ApiSceneSummaryRequest` | `ApiSceneSummaryResponse` | `ApiSceneSummaryErrorResponse` | `ServiceSceneSummaryParams` | `ServiceSceneSummaryResult` | `GeneratorSceneSummaryParams` | `GeneratorSceneSummaryResult` | **`AiSceneSummaryZodSchema`** | **`AiSceneSummaryType`** | **`AiSceneSummaryJsonSchema`** | `Scene`, `InsertScene` |
| Scene Content | `ApiSceneContentRequest` | `ApiSceneContentResponse` | `ApiSceneContentErrorResponse` | `ServiceSceneContentParams` | `ServiceSceneContentResult` | `GeneratorSceneContentParams` | `GeneratorSceneContentResult` | N/A | `string` (prose) | N/A | `Scene` (updates content) |

**Benefits of Layer-Based Naming:**
- ✅ **Explicit Layer Encoding**: Type name shows which layer it belongs to (`Api`, `Service`, `Generator`, `Ai`)
- ✅ **Searchability**: Find all Zod schemas with `grep "ZodSchema"`, all types with `grep "Type"`
- ✅ **SSOT**: AI layer uses Zod as single source of truth, derives TypeScript types and JSON Schemas
- ✅ **Consistency**: Same pattern across all generators and all layers
- ✅ **Self-Documenting**: Type name immediately indicates layer and purpose
- ✅ **Migration Safe**: Can add type aliases for backward compatibility

## Part II: API Architecture

### 2.0 API Naming Convention

**Unified API Namespace**: All API routes follow a centralized `/api/` root structure following RESTful conventions.

**Pattern**: `/api/{feature}/{resource}/{action?}`

**Novel Generation APIs**: All novel generation endpoints are under `/api/studio/` namespace:
- `/api/studio/story` - Story generation
- `/api/studio/characters` - Character generation
- `/api/studio/settings` - Settings generation
- `/api/studio/part` - Part generation
- `/api/studio/chapter` - Chapter generation
- `/api/studio/scene-summary` - Scene summary generation
- `/api/studio/scene-content` - Scene content generation
- `/api/studio/scene-evaluation` - Scene evaluation
- `/api/studio/images` - Image generation

**Benefits**:
- ✅ RESTful compliance with industry standards
- ✅ Single `/api/` root for all endpoints
- ✅ Predictable structure for developers
- ✅ Better tooling support (Swagger, Postman)
- ✅ Easier middleware and authentication management

**File Structure**: `src/app/api/studio/{endpoint}/route.ts`

---

### 2.1 Generation Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER PROMPT (Story Idea)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 1: Story Generation                                         │
│  POST /api/studio/story                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 2: Character Generation (Full Profiles)                    │
│  POST /api/studio/characters                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 3: Settings Generation (Primary Locations)                 │
│  POST /api/studio/settings                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 4: Part Generation (Act Structure)                         │
│  POST /api/studio/part                                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 5: Chapter Generation (Per Part)                           │
│  POST /api/studio/chapter                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 6: Scene Summary Generation (Per Chapter)                  │
│  POST /api/studio/scene-summary                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 7: Scene Content Generation (Per Scene)                    │
│  POST /api/studio/scene-content                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 8: Scene Evaluation & Improvement                          │
│  POST /api/studio/scene-evaluation                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 9: Image Generation (All Story Assets)                     │
│  POST /api/studio/images                                         │
└─────────────────────────────────────────────────────────────────┘

```

---


## Part III: Generator System Architecture & API Specifications

### Overview: Novel Generation Architecture

The novel generation system uses a modular, layered architecture with **9 distinct generators**. Each generator is a pure function that focuses on a single phase of story creation.

#### **Architectural Layers**

```
┌─────────────────────────────────────────────────────────────┐
│  API Layer (HTTP Contract)                                   │
│  Location: src/app/api/studio/                               │
│  Types: Api*Request, Api*Response, Api*ErrorResponse         │
│  Purpose: HTTP endpoints, request validation, response        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Service Layer (Generation + Persistence)                    │
│  Location: src/lib/studio/services/*-service.ts              │
│  Method: generateAndSave()                                   │
│  Types: Service*Params, Service*Result                       │
│  Purpose: Orchestrate generation + database persistence      │
│  Pattern:                                                    │
│    1. Fetch & verify related data (story, ownership, etc.)  │
│    2. Call pure generator function (no DB operations)        │
│    3. Validate & save to database using Drizzle ORM          │
│    4. Return result with metadata                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Generator Layer (Pure Business Logic)                       │
│  Location: src/lib/studio/generators/*-generator.ts          │
│  Functions: generateStory(), generateCharacters(), etc.      │
│  Types: Generator*Params, Generator*Result                   │
│  Purpose: Pure AI generation logic (NO database operations)  │
│  Characteristics:                                            │
│    - Stateless, side-effect free                             │
│    - Returns plain data structures                           │
│    - Can be tested independently of database                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  AI Layer (Model Integration)                                │
│  Location: src/lib/studio/generators/ai-client.ts            │
│  Client: TextGenerationClient (supports Gemini & AI Server)  │
│  Prompts: Managed by prompt-manager.ts (centralized)         │
│  Purpose: Provider abstraction, structured output            │
└─────────────────────────────────────────────────────────────┘
```

**Service Layer Examples**:

All services follow the same `generateAndSave()` pattern:

```typescript
// Story Service
class StoryService {
  async generateAndSave(params: ServiceStoryParams): Promise<ServiceStoryResult> {
    // 1. Generate using pure generator
    const generationResult = await generateStory(params);

    // 2. Prepare & validate data for database
    const storyData = insertStorySchema.parse({
      id: nanoid(),
      ...generationResult.story
    });

    // 3. Save to database
    const savedStory = await db.insert(stories).values(storyData).returning();

    // 4. Return result
    return { story: savedStory[0], metadata: generationResult.metadata };
  }
}

// Character Service
class CharacterService {
  async generateAndSave(params: ServiceCharactersParams): Promise<ServiceCharactersResult> {
    // 1. Fetch & verify story + ownership
    const story = await db.select().from(stories).where(eq(stories.id, storyId));
    if (story.authorId !== userId) throw new Error("Access denied");

    // 2. Generate using pure generator
    const generationResult = await generateCharacters({ story, ...params });

    // 3. Save to database
    const savedCharacters = [];
    for (const char of generationResult.characters) {
      const characterData = insertCharacterSchema.parse({ id: nanoid(), ...char });
      const saved = await db.insert(characters).values(characterData).returning();
      savedCharacters.push(saved[0]);
    }

    // 4. Return result
    return { characters: savedCharacters, metadata: generationResult.metadata };
  }
}
```

**Why No Separate `persist()` Function?**

Services are designed for **atomic operations** - generation and persistence happen together to:
- Ensure data consistency (no partial saves)
- Simplify error handling (rollback generation if save fails)
- Maintain single responsibility (one method = one complete operation)
- Enable better transaction management

#### **9-Phase Generation Pipeline**

| Phase | Generator | Input | Output | Database Table |
|-------|-----------|-------|--------|----------------|
| 1 | `story-generator.ts` | User prompt + preferences | Story foundation | `stories` |
| 2 | `characters-generator.ts` | Story + character count | Character profiles | `characters` |
| 3 | `settings-generator.ts` | Story + setting count | Location details | `settings` |
| 4 | `part-generator.ts` | Story + previous parts | Part/Act structure | `parts` |
| 5 | `chapter-generator.ts` | Story + part + previous chapters | Chapter outline | `chapters` |
| 6 | `scene-summary-generator.ts` | Story + chapter + previous scenes | Scene specification | `scenes` (summary) |
| 7 | `scene-content-generator.ts` | Scene summary + context | Full prose content | `scenes` (content) |
| 8 | `scene-evaluation-generator.ts` | Scene content | Quality score + improvements | `scenes` (updated) |
| 9 | `images-generator.ts` | All entities | Generated images | `*` (imageUrl fields) |

#### **AI Provider Support**

The system supports multiple AI providers through a unified interface:

**Supported Providers**:
1. **Google Generative AI (Gemini)**
   - Models: Gemini 2.5 Flash, Gemini 2.5 Flash Lite
   - Method: `generateStructured()` with Zod schemas
   - Use case: Primary text generation (fast, reliable)

2. **AI Server (Custom)**
   - Models: Qwen-3 or other self-hosted LLMs
   - Method: `generate()` with JSON Schema
   - Use case: Fallback or custom model deployment

**Provider Selection**:
- Environment variable: `TEXT_GENERATION_PROVIDER` (default: "gemini")
- Per-request: Pass `apiKey` parameter to use specific provider

#### **Authentication**

**Dual Authentication** (API key OR session):

**Method 1: API Key** (for scripts, automation, cross-system calls)
```typescript
const apiKey = 'fic_...'; // From .auth/user.json

const result = await generateStory({
  userPrompt: '...',
  apiKey: apiKey  // Passed to generator
});
```

**Method 2: Session** (for web app users)
```typescript
// NextAuth session automatically available in API routes
const session = await auth();
const userId = session?.user?.id;

// No apiKey needed - uses session credentials
const result = await generateStory({
  userPrompt: '...'
});
```

**Required Scope**: `stories:write` for all novel generation operations

#### **Type System**

**3-Layer Type Structure**:

1. **API Layer Types** (`src/app/api/studio/types.ts`)
   - `Api{Entity}Request` - HTTP request body
   - `Api{Entity}Response` - HTTP success response
   - `Api{Entity}ErrorResponse` - HTTP error response

2. **Generator Layer Types** (`src/lib/studio/generators/types.ts`)
   - `Generator{Entity}Params` - Generator function parameters
   - `Generator{Entity}Result` - Generator function return value
   - `{Entity}PromptParams` - Prompt template variables

3. **AI Layer Types** (`src/lib/studio/generators/zod-schemas.generated.ts`)
   - `Ai{Entity}ZodSchema` - Zod schema (SSOT)
   - `Ai{Entity}Type` - TypeScript type derived from Zod
   - `Ai{Entity}JsonSchema` - JSON Schema for AI models

**Example Type Flow** (Story Generation):
```
ApiStoryRequest (API Layer)
    ↓
GeneratorStoryParams (Generator Layer)
    ↓
AiStoryZodSchema (AI Layer - validation)
    ↓
AiStoryType (AI Layer - result type)
    ↓
GeneratorStoryResult (Generator Layer)
    ↓
ApiStoryResponse (API Layer)
```

---

### 3.1 Story Generation API

**Phase 1 of 9** - Creates the story foundation that establishes theme, moral framework, and genre/tone guidance.

#### Generator Function

**Location**: `src/lib/studio/generators/story-generator.ts`

```typescript
export async function generateStory(
  params: GeneratorStoryParams
): Promise<GeneratorStoryResult>
```

#### Parameters (`GeneratorStoryParams`)

```typescript
{
  userPrompt: string;                    // Required: User's story concept
  preferredGenre?: StoryGenre;          // Optional: Genre preference (default: "Slice")
  preferredTone?: StoryTone;            // Optional: Tone preference (default: "hopeful")
  language?: string;                    // Optional: Output language (default: "English")
  apiKey?: string;                      // Optional: API key for authentication
}
```

**Genre Options**: Fantasy, Romance, SciFi, Mystery, Horror, Action, Isekai, LitRPG, Cultivation, Slice, Paranormal, Dystopian, Historical, LGBTQ

**Tone Options**: hopeful, dark, bittersweet, satirical

#### Return Value (`GeneratorStoryResult`)

```typescript
{
  story: AiStoryType;                   // Generated story data
  metadata: {
    generationTime: number;             // Time in milliseconds
    model?: string;                     // AI model used ("gemini" | "ai-server")
  }
}
```

**AiStoryType** Structure:
```typescript
{
  title: string;                        // Story title (max 255 chars)
  summary: string;                      // 2-3 sentence thematic premise
  genre: StoryGenre;                    // Selected genre
  tone: StoryTone;                      // Selected tone
  moralFramework: string;               // Moral rules of the story world
}
```

---

### 3.2 Character Generation API

**IMPORTANT:** This is a completely separate generation phase that runs AFTER story generation. Characters are designed FROM SCRATCH based on the story's moral framework.

#### Endpoint
```typescript
POST /api/studio/characters

Request:
{
  storyId: string;
  story: {              // Story metadata from Phase 1
    title: string;
    summary: string;
    genre: string;
    tone: string;
    moralFramework: string;
  };
  characterCount: number;  // How many characters to generate (typically 2-4)
  language?: string;       // Default: 'English'
}

Response:
{
  characters: Array<{
    id: string;
    name: string;
    isMain: boolean;
    summary: string;
    coreTrait: string;
    internalFlaw: string;
    externalGoal: string;
    personality: {
      traits: string[];
      values: string[];
    };
    backstory: string;
    relationships: Record<string, Relationship>;
    physicalDescription: {
      age: string;
      appearance: string;
      distinctiveFeatures: string;
      style: string;
    };
    voiceStyle: {
      tone: string;
      vocabulary: string;
      quirks: string[];
      emotionalRange: string;
    };
    imageUrl: string;
    imageVariants: ImageVariantSet;
  }>;
}
```

---

### 3.3 Settings Generation API

#### Endpoint
```typescript
POST /api/studio/settings

Request:
{
  storyId: string;
  storyContext: {
    summary: string;
    genre: string;
    tone: string;
    moralFramework: string;
  };
  characters: Array<{  // For social dynamics and symbolic connections
    name: string;
    coreTrait: string;
    internalFlaw: string;
  }>;
  numberOfSettings?: number; // Default: 2-4 primary settings
  visualStyle: 'realistic' | 'anime' | 'painterly' | 'cinematic';
}

Response:
{
  settings: Array<{
    id: string;
    name: string;
    description: string;
    adversityElements: {
      physicalObstacles: string[];
      scarcityFactors: string[];
      dangerSources: string[];
      socialDynamics: string[];
    };
    symbolicMeaning: string;
    cycleAmplification: {
      setup: string;
      confrontation: string;
      virtue: string;
      consequence: string;
      transition: string;
    };
    mood: string;
    emotionalResonance: string;
    sensory: {
      sight: string[];
      sound: string[];
      smell: string[];
      touch: string[];
      taste: string[];
    };
    architecturalStyle?: string;
    visualStyle: string;
    visualReferences: string[];
    colorPalette: string[];
    imageUrl: string;
    imageVariants: ImageVariantSet;
  }>;
}
```

---

### 3.4 Part Generation API

#### Endpoint
```typescript
POST /api/studio/part

Request:
{
  storyId: string;
  summary: string;
  moralFramework: string;
  characters: Character[];
  numberOfParts?: number; // Default: 3
}

Response:
{
  parts: {
    actNumber: number;
    title: string;
    summary: string;
    characterArcs: {
      characterId: string;
      adversity: { internal: string; external: string; };
      virtue: string;
      consequence: string;
      newAdversity: string;
    }[];
  }[];
}
```

---

### 3.5 Chapter Generation API

#### Endpoint
```typescript
POST /api/studio/chapter

Request:
{
  storyId: string;
  partId: string;
  partSummary: string;
  numberOfChapters: number;
  previousChapterSummary?: string;
}

Response:
{
  chapters: {
    title: string;
    summary: string;
    characterId: string; // The character whose MACRO arc this chapter advances
    arcPosition: 'beginning' | 'middle' | 'climax' | 'resolution';
    contributesToMacroArc: string;
    focusCharacters: string[];
    adversityType: string;
    virtueType: string;
    seedsPlanted: Seed[];
    seedsResolved: SeedResolution[];
    connectsToPreviousChapter: string;
    createsNextAdversity: string;
  }[];
}
```

---

### 3.6 Scene Summary Generation API

#### Endpoint
```typescript
POST /api/studio/scene-summary

Request:
{
  storyId: string;
  chapterId: string;
  chapterSummary: string;
  numberOfScenes: number; // Typically 3-7
  storySummary: string;
  characters: Character[];
}

Response:
{
  scenes: {
    title: string;
    summary: string; // Scene specification
    cyclePhase: 'setup' | 'confrontation' | 'virtue' | 'consequence' | 'transition';
    emotionalBeat: string;
    characterFocus: string[];
    sensoryAnchors: string[];
    dialogueVsDescription: string;
    suggestedLength: 'short' | 'medium' | 'long';
  }[];
}
```

---

### 3.7 Scene Content Generation API

#### Endpoint
```typescript
POST /api/studio/scene-content

Request:
{
  storyId: string;
  sceneId: string;
  sceneSummary: string; // Scene specification from Scene.summary
  cyclePhase: string;
  emotionalBeat: string;
  chapterSummary: string;
  storySummary: string;
  characters: Character[];
  previousSceneContent?: string;
}

Response:
{
  content: string;
  wordCount: number;
  emotionalTone: string;
}
```

---

### 3.8 Scene Evaluation & Improvement API

#### Endpoint
```typescript
POST /api/studio/scene-evaluation

Request:
{
  sceneId: string;
  content: string;
  context: {
    storyGenre: string;
    cyclePhase: 'setup' | 'confrontation' | 'virtue' | 'consequence' | 'transition';
    arcPosition: 'beginning' | 'middle' | 'climax' | 'resolution';
    chapterNumber: number;
    characterContext: string[]; // Character summary
  };
  options?: {
    maxIterations?: number; // Default: 2
    passingScore?: number; // Default: 3.0
    improvementLevel?: 'light' | 'moderate' | 'heavy'; // Default: 'moderate'
  };
}

Response:
{
  scene: {
    id: string;
    content: string; // Final improved content
  };
  evaluations: Array<{
    iteration: number;
    scores: {
      plot: number;          // 1-4 scale
      character: number;     // 1-4 scale
      pacing: number;        // 1-4 scale
      prose: number;         // 1-4 scale
      worldBuilding: number; // 1-4 scale
    };
    overallScore: number;    // Average of 5 categories
    feedback: {
      strengths: string[];
      improvements: string[];
      priorityFixes: string[];
    };
  }>;
  iterations: number;
  finalScore: number;
  passed: boolean;
  improvements: string[]; // List of changes made
}
```

---

### 3.9 Image Generation API

#### Endpoint
```typescript
POST /api/studio/images

Request:
{
  storyId: string;
  imageTypes: Array<'story' | 'character' | 'setting' | 'scene'>;
  options?: {
    visualStyle: 'realistic' | 'anime' | 'painterly' | 'cinematic'; // Default from story
    batchSize?: number; // Generate N images at a time, default: 5
  };
}

Response: Server-Sent Events (SSE)
{
  event: 'progress',
  data: {
    type: 'story' | 'character' | 'setting' | 'scene',
    current: number,
    total: number,
    message: string
  }
}

Final Event:
{
  event: 'complete',
  data: {
    generated: {
      story: number,      // Count of story images
      characters: number, // Count of character images
      settings: number,   // Count of setting images
      scenes: number      // Count of scene images
    },
    totalImages: number,
    totalVariants: number // 18 variants per image
  }
}
```

#### Image Generation Specifications

**Story Cover Image**:
- Size: 1344×768 (7:4 aspect ratio)
- Prompt: `Book cover illustration for "{storyTitle}", {storySummary}, {genre} genre, {tone} atmosphere, {visualStyle} art style, dramatic composition, professional book cover design`

**Character Portrait**:
- Size: 1024×1024 (square)
- Prompt: `Portrait of {characterName}, {physicalDescription.appearance}, {physicalDescription.distinctiveFeatures}, {visualStyle} style, {genre} genre aesthetic, character concept art`

**Setting Environment**:
- Size: 1344×768 (7:4 aspect ratio)
- Prompt: `Wide landscape view of {settingName}, {settingDescription}, {visualReferences[0]} style, {genre} aesthetic, {colorPalette} colors, {mood} atmosphere, cinematic composition`

**Scene Image**:
- Size: 1344×768 (7:4 aspect ratio)
- Prompt: `Cinematic scene from {storyTitle}: {sceneTitle}, {sceneVisualDescription}, {settingName} environment, {charactersPresent}, {visualStyle} style, {genre} aesthetic, 7:4 composition`

#### Image Optimization

For EACH generated image, automatically create 4 optimized variants:

**Formats**: AVIF (best compression), JPEG (universal fallback)
**Sizes**:
- Mobile 1x: 672×384 (for 320-640px viewports)
- Mobile 2x: 1344×768 (original Gemini size, also used for desktop)

**Total per image**: 2 formats × 2 sizes = 4 variants

**Why 4 variants?** Mobile-first optimization strategy:
- AVIF provides 50% smaller files than JPEG with 93.8% browser support
- No WebP needed (only 1.5% coverage gap, adds 50% more variants)
- Desktop uses mobile 2x (original 1344×768) - no upscaling needed
- Optimized for comics with many panels per scene

---


## Part IV: Iterative Improvement Methodology

### 4.1 Overview

The Adversity-Triumph Engine uses a systematic, data-driven approach to continuously improve story generation quality through iterative prompt refinement. This methodology ensures that prompts evolve based on empirical evidence from production testing and reader feedback.

**Key Principle**: All prompt changes must be validated through A/B testing with quantitative metrics before adoption.

**Related Documentation**: See [novels-evaluation.md](novels-evaluation.md) for complete testing metrics, evaluation frameworks, and production test results.

---

### 4.2 The 7-Step Optimization Loop

This cyclic process continuously refines prompts based on measurable outcomes:

```
┌─────────────────────────────────────────────────────────────┐
│  1. GENERATE                                                 │
│  Run current prompt → Produce story/content                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  2. EVALUATE                                                 │
│  - Automated metrics (cycle completeness, quality score)    │
│  - Reader surveys (emotional response, comprehension)       │
│  - Expert review (manual rubric)                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3. ANALYZE                                                  │
│  - Identify failure patterns                                │
│  - Categorize issues (structural, emotional, prose)         │
│  - Prioritize by impact                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  4. HYPOTHESIZE                                              │
│  - Propose prompt changes to address top issues             │
│  - Predict expected improvement                             │
│  - Design A/B test                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  5. UPDATE PROMPT                                            │
│  - Implement changes to prompt                              │
│  - Version control (v1.0 → v1.1)                           │
│  - Document rationale                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  6. TEST                                                     │
│  - Generate with new prompt                                 │
│  - Compare to control (old prompt)                          │
│  - Measure delta in metrics                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  7. DECIDE                                                   │
│  - If improvement: Keep new prompt, iterate again           │
│  - If regression: Revert, try different approach            │
│  - If neutral: Run more tests or keep and monitor           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     └──────────────────────┐
                                            │
                     ┌──────────────────────┘
                     │
                     ▼
            (Return to Step 1)
```

---

### 4.3 Practical Implementation Example: "The Last Garden" Baseline Test

This real example demonstrates the complete optimization loop from production testing.

**Test Date**: 2025-11-15  
**User Prompt**: "A story about a refugee woman who starts a garden in a destroyed city and the former enemy soldier who helps her without revealing his identity"  
**Purpose**: Establish baseline metrics and identify improvement opportunities

#### Step 1: Generate with Baseline Prompt

Generate stories using initial prompts (v1.0), collect all metrics defined in [novels-evaluation.md](novels-evaluation.md).

#### Step 2: Identify Issues

Example from "The Last Garden" baseline test:

| Issue | Metric | Baseline | Target | Gap |
|-------|--------|----------|--------|-----|
| Issue 1 | Virtue scene word count | 683 words | 800-1000 words | -14.6% |
| Issue 2 | Emotional resonance (Gam-dong) | 40% positive response | 60% target | -20% |
| Issue 3 | POV discipline | Fair | Excellent | Quality gap |

#### Step 3: Update Prompts

Based on identified issues, enhance prompts with specific instructions:

**VIRTUE SCENE SPECIAL INSTRUCTIONS (v1.1)**:

```markdown
Length: Aim for 800-1000 words minimum. This is THE moment—take your time.

Ceremonial Pacing:
- SLOW DOWN during the virtuous action
- Use short sentences or fragments
- Allow silence and stillness
- Let reader witness every detail

Emotional Lingering:
- After virtuous action, give 2-3 paragraphs for emotional resonance
- Show character's internal state AFTER the act
- Physical sensations (trembling, tears, breath)

POV Discipline:
- Do NOT switch to observer's POV in same scene
- Their reaction can be next scene's opening
```

**Rationale**: The baseline test revealed that virtue scenes were too brief (683 words vs 800-1000 target) and lacked emotional depth (40% Gam-dong response vs 60% target). The updated instructions explicitly require:
1. Longer word count with emphasis on ceremonial pacing
2. Physical manifestation of emotions after virtuous action
3. Strict POV discipline to maintain reader immersion

#### Step 4: Test & Measure

Generate 5 stories with updated prompts (v1.1), compare metrics:

| Metric | v1.0 Baseline | v1.1 Updated | Improvement | Status |
|--------|---------------|--------------|-------------|--------|
| Virtue Scene Word Count | 683 words | 1,011 words | +48% | ✅ Target met |
| Gam-dong Response Rate | 40% | 75% | +35% | ✅ Exceeded target |
| POV Discipline Score | Fair | Excellent | Qualitative | ✅ Improved |
| Scene Quality (Overall) | 2.8/4.0 | 3.4/4.0 | +0.6 | ✅ Above threshold |

**Key Findings**:
- Word count increased by 48% (683 → 1,011 words), exceeding target range
- Emotional response jumped from 40% to 75% (+35%), exceeding 60% target
- POV discipline improved from Fair to Excellent (qualitative assessment)
- Overall scene quality increased by 0.6 points (2.8 → 3.4)

**Reader Feedback on v1.1** (5 test readers):
- Profoundly moved: 75% (3/5 to tears, 2/5 strongly affected)
- Most impactful changes:
  * "Slowed-down pouring sequence felt sacred" (4/5)
  * "Staying with Yuna instead of jumping to Jin" (3/5)
  * "Emotional lingering after water was gone" (5/5)

#### Step 5: Adopt or Revert

**Decision Criteria**:
- ✅ **ADOPT** if all problem metrics improve without regressions
- ⚠️ **REVISE** if some metrics improve but others regress
- ❌ **REVERT** if overall quality decreases

**Decision for v1.1**: ✅ **ADOPT as new baseline**

**Rationale**: Significant improvements across all problem areas (word count +48%, emotional response +35%, POV quality excellent) with no regressions in other metrics.

#### Step 6: Continue Iteration

**Next Priority**: Consequence scenes

**Hypothesis**: Current consequence scenes rush through payoff, need similar depth and emotional lingering as Virtue scenes

**Proposed Fix**:
- Add 600-900 word target for consequence scenes
- Require 2+ paragraphs for emotional aftermath
- Show long-term impact of consequence, not just immediate resolution

**Testing Plan**: Generate 5 stories with v1.2, measure consequence scene impact using metrics from [novels-evaluation.md](novels-evaluation.md#part-iv-evaluation-metrics)

**Iteration Cadence**:
- Monthly testing cycle
- 5 stories per prompt version for statistical validity
- Track all metrics in version-controlled JSON
- Document prompt changes with rationale

---

### 4.4 Version Control & Documentation

**Prompt Versioning Format**: `vMAJOR.MINOR`
- **MAJOR**: Structural changes to generation pipeline or data model
- **MINOR**: Refinements to existing prompts (instructions, examples, constraints)

**Example Changelog**:

**Documentation Requirements**:
1. **Hypothesis**: What problem are we solving?
2. **Changes**: Specific prompt modifications
3. **Rationale**: Why do we expect this to work?
4. **Test Results**: Quantitative metrics from A/B test
5. **Decision**: Adopt, revise, or revert with reasoning

---

### 4.5 Metrics Reference

For complete testing metrics, evaluation frameworks, and success criteria, see:

**[novels-evaluation.md](novels-evaluation.md)** - Comprehensive evaluation guide including:
- Part I: Testing Objectives & Success Criteria
- Part III: Generation Metrics & Evaluation (45+ metrics across 5 categories)
- Part IV: Evaluation Metrics (Structural, Quality, Emotional)
- Part V: Production Testing Results (baseline metrics from real stories)
- Part VI: Iterative Improvement Methodology (failure patterns & solutions)

**Key Metrics Categories**:
1. **Foundation Metrics**: Story, Character, Settings generation quality
2. **Structure Metrics**: Cycle coherence, seed tracking, adversity connection
3. **Content Metrics**: Word count, cycle alignment, emotional resonance
4. **Quality Metrics**: Scene evaluation scores (Plot, Character, Pacing, Prose, World-Building)
5. **Assets Metrics**: Image generation and optimization quality

**Critical Success Metrics** (Must Have):
- 90%+ cycles complete with all 5 components
- 85%+ scenes pass quality evaluation on first attempt (3.0+/4.0)
- 80%+ readers identify moral elevation moment correctly
- 70%+ causal links clear and logical
- 0% deus ex machina incidents

---

### 4.6 Best Practices

**DO**:
- ✅ Test with at least 5 stories per prompt version (statistical validity)
- ✅ Compare against baseline using identical test prompts
- ✅ Document all changes with clear rationale
- ✅ Wait for complete metrics before making decisions
- ✅ Revert immediately if regressions detected
- ✅ Track cumulative improvements over time

**DON'T**:
- ❌ Change multiple prompt sections simultaneously (can't isolate cause)
- ❌ Adopt changes based on single story results
- ❌ Ignore qualitative feedback from readers
- ❌ Skip version control and documentation
- ❌ Rush the testing phase (minimum 1 week per iteration)
- ❌ Optimize for single metrics at expense of others

**Validation Checklist**:
- [ ] Hypothesis clearly stated with predicted improvement
- [ ] Baseline metrics captured from v1.0 control
- [ ] 5+ test stories generated with new prompt version
- [ ] All metrics measured using standardized rubrics
- [ ] Reader surveys completed (5+ readers per story)
- [ ] Results compared to baseline with statistical significance
- [ ] Decision documented with rationale
- [ ] Changelog updated with version details

---

**End of Part III: Iterative Improvement Methodology**
