# Novels Generation Guide: Adversity-Triumph Engine

## Overview

This document provides comprehensive implementation specifications for the novels generation APIs using the Adversity-Triumph Engine, including ultra-engineered system prompts, complete examples, and iterative improvement workflows.

**Related Documents:**
- 📖 **Specification** (`novels-specification.md`): Core concepts, data model, and theoretical foundation
- 🧪 **Evaluation Guide** (`novels-evaluation.md`): Validation methods, quality metrics, and test strategies
- 🏗️ **Generator Refactoring** (`generator-refactoring-plan.md`): Common generator library architecture

---

## Part 0: Code Architecture (Common Generator Library)

### 0.1 Architectural Decision: Studio vs Novels

**Purpose Separation:**
- **`src/lib/studio/`**: Creation/generation functionality (write operations)
- **`src/lib/novels/`**: Reading/viewing functionality (read operations)

### 0.2 Generator Library Structure

**Problem**: Code duplication between orchestrator and individual API endpoints
- Same generation logic exists in `orchestrator.ts` AND `api/generation/*/route.ts`
- Changes require updates in multiple places
- Risk of inconsistency

**Solution**: Common generator library at `src/lib/studio/generators/`

```
src/lib/studio/
├── generators/                        # Common generator functions
│   ├── index.ts                      # Export all generators
│   ├── story-generator.ts            # Story generation
│   ├── characters-generator.ts       # Character generation
│   ├── settings-generator.ts         # Setting generation
│   ├── parts-generator.ts            # Parts generation
│   ├── chapters-generator.ts         # Chapters generation
│   ├── scene-summaries-generator.ts  # Scene summaries generation
│   ├── scene-content-generator.ts    # Scene content generation
│   ├── scene-evaluation-generator.ts # Scene evaluation
│   └── images-generator.ts           # Image generation
└── agent-*.ts                         # Existing agent tools

src/lib/novels/
├── orchestrator.ts                    # Uses studio generators
├── types.ts                          # Shared types
├── system-prompts.ts                 # Shared prompts
└── ai-client.ts                      # AI integration
```

**Benefits:**
- ✅ Single source of truth (DRY principle)
- ✅ Unified API and individual endpoints use same functions
- ✅ Easier testing and maintenance
- ✅ Guaranteed consistency

**Usage Pattern:**

```typescript
// In orchestrator
import { generateCharacters } from '@/lib/studio/generators';

// In API endpoint
import { generateCharacters } from '@/lib/studio/generators';

// Both use the exact same function
const result = await generateCharacters({
  storyId,
  userId,
  story,
  characterCount,
});
```

**Generator Function Signature Example:**

```typescript
export interface GeneratorCharactersParams {
  storyId: string;
  userId: string;
  story: StorySummaryResult;
  characterCount: number;
  language?: string;
  onProgress?: (current: number, total: number) => void;
}

export interface GeneratorCharactersResult {
  characters: Character[];
  metadata: {
    totalGenerated: number;
    generationTime: number;
  };
}

export async function generateCharacters(
  params: GeneratorCharactersParams
): Promise<GeneratorCharactersResult>;
```

**Implementation Status**: ✅ Implemented - See sections below for current architecture

### 0.3 Type Naming Convention

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
│ POST /studio/api/stories                                           │
│   Request:  ApiStoryRequest                                        │
│   Response: ApiStoryResponse | ApiStoryErrorResponse               │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ Service Layer (Orchestration)                                      │
├────────────────────────────────────────────────────────────────────┤
│ storyService.generate(params: ServiceStoryParams)                  │
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
// Service Layer (Orchestration)
// ─────────────────────────────────────────────────────
async function generate(params: ServiceStoryParams): Promise<ServiceStoryResult> {
  // Map Service params to Generator params
  const generatorParams: GeneratorStoryParams = {
    userPrompt: params.userPrompt,
    language: params.language,
  };

  const result: GeneratorStoryResult = await generateStory(generatorParams);

  return {
    story: result.story,
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

// ─────────────────────────────────────────────────────
// Database Layer (Persistence)
// ─────────────────────────────────────────────────────
const story: Story = await db.insert(stories).values({
  ...validated,  // AiStoryType
  id: generateId(),
  authorId: userId,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

**Complete Type Table for All Generators:**

| Generator | API Request | API Response | API Error | Service Params | Service Result | Generator Params | Generator Result | **AI Zod Schema** | **AI Type** | **AI JSON Schema** | Database Entity |
|-----------|-------------|--------------|-----------|----------------|----------------|------------------|------------------|-------------------|-------------|-------------------|----------------|
| Story | `ApiStoryRequest` | `ApiStoryResponse` | `ApiStoryErrorResponse` | `ServiceStoryParams` | `ServiceStoryResult` | `GeneratorStoryParams` | `GeneratorStoryResult` | **`AiStoryZodSchema`** | **`AiStoryType`** | **`AiStoryJsonSchema`** | `Story`, `InsertStory` |
| Characters | `ApiCharactersRequest` | `ApiCharactersResponse` | `ApiCharactersErrorResponse` | `ServiceCharactersParams` | `ServiceCharactersResult` | `GeneratorCharactersParams` | `GeneratorCharactersResult` | **`AiCharacterZodSchema`** | **`AiCharacterType`** | **`AiCharacterJsonSchema`** | `Character`, `InsertCharacter` |
| Settings | `ApiSettingsRequest` | `ApiSettingsResponse` | `ApiSettingsErrorResponse` | `ServiceSettingsParams` | `ServiceSettingsResult` | `GeneratorSettingsParams` | `GeneratorSettingsResult` | **`AiSettingZodSchema`** | **`AiSettingType`** | **`AiSettingJsonSchema`** | `Setting`, `InsertSetting` |
| Parts | `ApiPartsRequest` | `ApiPartsResponse` | `ApiPartsErrorResponse` | `ServicePartsParams` | `ServicePartsResult` | `GeneratorPartsParams` | `GeneratorPartsResult` | **`AiPartZodSchema`** | **`AiPartType`** | **`AiPartJsonSchema`** | `Part`, `InsertPart` |
| Chapters | `ApiChaptersRequest` | `ApiChaptersResponse` | `ApiChaptersErrorResponse` | `ServiceChaptersParams` | `ServiceChaptersResult` | `GeneratorChaptersParams` | `GeneratorChaptersResult` | **`AiChapterZodSchema`** | **`AiChapterType`** | **`AiChapterJsonSchema`** | `Chapter`, `InsertChapter` |
| Scene Summaries | `ApiSceneSummariesRequest` | `ApiSceneSummariesResponse` | `ApiSceneSummariesErrorResponse` | `ServiceSceneSummariesParams` | `ServiceSceneSummariesResult` | `GeneratorSceneSummariesParams` | `GeneratorSceneSummariesResult` | **`AiSceneSummaryZodSchema`** | **`AiSceneSummaryType`** | **`AiSceneSummaryJsonSchema`** | `Scene`, `InsertScene` |
| Scene Content | `ApiSceneContentRequest` | `ApiSceneContentResponse` | `ApiSceneContentErrorResponse` | `ServiceSceneContentParams` | `ServiceSceneContentResult` | `GeneratorSceneContentParams` | `GeneratorSceneContentResult` | N/A | `string` (prose) | N/A | `Scene` (updates content) |

**Benefits of Layer-Based Naming:**
- ✅ **Explicit Layer Encoding**: Type name shows which layer it belongs to (`Api`, `Service`, `Generator`, `Ai`)
- ✅ **Searchability**: Find all Zod schemas with `grep "ZodSchema"`, all types with `grep "Type"`
- ✅ **SSOT**: AI layer uses Zod as single source of truth, derives TypeScript types and JSON Schemas
- ✅ **Consistency**: Same pattern across all generators and all layers
- ✅ **Self-Documenting**: Type name immediately indicates layer and purpose
- ✅ **Migration Safe**: Can add type aliases for backward compatibility

#### 0.3.1 CRITICAL: API Response Types vs AI Types

**Key Discovery**: API responses MUST use full database types, NOT AI-only types.

**Problem:**
- `Ai*Type` (e.g., `AiStoryType`, `AiCharacterType`) contains ONLY AI-generated fields
- These types lack database metadata: `id`, `authorId`, `createdAt`, `updatedAt`, `status`, etc.
- Using `Ai*Type` in API responses causes test failures and runtime errors

**Solution:**
API response types must use full database types that include all fields:

```typescript
// ❌ WRONG: Using AI-only type in API response
export interface ApiStoryResponse {
  success: true;
  story: AiStoryType;  // Missing id, authorId, createdAt, updatedAt, etc.
  metadata: { ... };
}

// ✅ CORRECT: Using full database type in API response
export interface ApiStoryResponse {
  success: true;
  story: Story;  // Includes ALL fields (AI-generated + database metadata)
  metadata: { ... };
}
```

**Type Comparison:**

```typescript
// AI-Only Type (ONLY for AI generation)
type AiStoryType = {
  title: string;        // AI-generated
  summary: string;      // AI-generated
  genre: string;        // AI-generated
  tone: string;         // AI-generated
  moralFramework: string; // AI-generated
};

// Full Database Type (for API responses, services, database operations)
type Story = {
  // Database metadata
  id: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  status: 'writing' | 'published';
  viewCount: number;
  rating: number;
  ratingCount: number;
  imageUrl: string | null;
  imageVariants: object | null;

  // AI-generated content (same as AiStoryType)
  title: string;
  summary: string;
  genre: string;
  tone: string;
  moralFramework: string;
};
```

**Usage Guidelines:**

| Context | Type to Use | Reason |
|---------|-------------|--------|
| AI generation input | `Ai*ZodSchema` | For Gemini structured output |
| AI generation output validation | `Ai*Type` | Validated AI-generated content only |
| Database insert | `InsertStory`, `InsertCharacter`, etc. | Zod schema for inserts |
| Database query result | `Story`, `Character`, etc. | Full records with all fields |
| **API Response** | **`Story`, `Character`, etc.** | **Clients need complete records** |
| Service layer return | `Story`, `Character`, etc. | After saving to database |

**Real-World Example:**

```typescript
// Generator Layer: Returns AI-generated content only
async function generateStory(params: GeneratorStoryParams): Promise<GeneratorStoryResult> {
  const aiData: AiStoryType = await gemini.generateStructured(
    prompt,
    AiStoryJsonSchema
  );

  return {
    story: aiData,  // AiStoryType - AI-generated fields only
    metadata: { ... }
  };
}

// Service Layer: Saves to database and returns full record
async function generateAndSave(params: ServiceStoryParams): Promise<ServiceStoryResult> {
  const generated = await generateStory(...);

  // Save to database with additional metadata
  const saved: Story[] = await db.insert(stories).values({
    id: generateId(),
    authorId: params.userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'writing',
    viewCount: 0,
    rating: 0,
    ratingCount: 0,
    imageUrl: null,
    imageVariants: null,
    ...generated.story,  // Spread AI-generated fields
  }).returning();

  return {
    story: saved[0],  // Story - full database record
    metadata: { ... }
  };
}

// API Layer: Returns full database record
export async function POST(request: NextRequest) {
  const result = await storyService.generateAndSave(params);

  const response: ApiStoryResponse = {
    success: true,
    story: result.story,  // Story type - includes all fields
    metadata: result.metadata
  };

  return NextResponse.json(response, { status: 201 });
}
```

**Why This Matters:**
- ✅ Tests expect complete records with IDs and timestamps
- ✅ Clients need metadata for caching, updates, and navigation
- ✅ Type safety ensures all required fields are present
- ✅ Prevents runtime errors from missing fields

**Type Flow Across All Layers:**

```
Client HTTP Request
    ↓
ApiStoryRequest (API Layer - HTTP Contract)
    ↓ (mapped in route handler)
ServiceStoryParams (Service Layer - Orchestration)
    ↓ (calls generator)
GeneratorStoryParams (Generator Layer - Business Logic)
    ↓ (creates prompt, calls AI)
AiStoryZodSchema (AI Layer - Zod SSOT)
    ↓ z.infer
AiStoryType (AI Layer - TypeScript Type)
    ↓ (wrapped in result)
GeneratorStoryResult (Generator Layer - Function Output)
    ↓ (wrapped in service result)
ServiceStoryResult (Service Layer - Orchestration Output)
    ↓ (mapped in route handler)
ApiStoryResponse (API Layer - HTTP Contract)
    ↓
Client HTTP Response
```

**Type Locations:**

- **API Layer** (`src/app/studio/api/types.ts`):
  - `Api{Entity}Request`, `Api{Entity}Response`, `Api{Entity}ErrorResponse`

- **Service Layer** (`src/lib/studio/services/types.ts`):
  - `Service{Entity}Params`, `Service{Entity}Result`

- **Generator Layer** (`src/lib/studio/generators/types.ts`):
  - `Generator{Entity}Params`, `Generator{Entity}Result`, `{Entity}PromptParams`, `GeneratorMetadata`

- **AI Layer** (`src/lib/studio/generators/ai-schemas.ts`):
  - `Ai{Entity}ZodSchema` (Zod schema - SSOT)
  - `Ai{Entity}Type` (TypeScript type - derived via `z.infer`)
  - `Ai{Entity}JsonSchema` (JSON Schema - derived via `z.toJSONSchema`)

- **Database Layer** (`src/lib/db/schema.ts`):
  - `{Entity}`, `Insert{Entity}`

**Migration Notes:**

Old naming is deprecated but maintained via type aliases for backward compatibility:

```typescript
// Backward compatibility aliases (will be removed in future version)
export type GeneratedStoryData = AiStoryType;
export const GeneratedStorySchema = AiStoryZodSchema;
export const StoryJsonSchema = AiStoryJsonSchema;
```

---

## Part I: API Architecture

### 1.1 Generation Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER PROMPT (Story Idea)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 1: Story Generation                                         │
│  POST /studio/api/stories                                        │
│                                                                   │
│  System Prompt Focus:                                            │
│  - Extract general thematic premise, NOT detailed plot           │
│  - Identify moral framework and virtues to be tested            │
│  - Define world rules and moral stakes                          │
│  - Provide guidelines for character archetypes (NOT characters) │
│                                                                   │
│  Output: Story.title, summary, genre, tone, moralFramework      │
│  Note: Characters are NOT created here - generated in Phase 2   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 2: Character Generation (Full Profiles)                    │
│  POST /studio/api/characters                                     │
│                                                                   │
│  System Prompt Focus:                                            │
│  - Design 2-4 characters FROM SCRATCH based on moral framework  │
│  - Create personality, backstory, relationships (Jeong system)  │
│  - Define physical description and voice style                  │
│                                                                   │
│  Output: Complete Character records in database (no images)     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 3: Settings Generation (Primary Locations)                 │
│  POST /studio/api/settings                                       │
│                                                                   │
│  System Prompt Focus:                                            │
│  - Create 2-4 primary settings with adversity elements          │
│  - Define symbolic meaning (reflect moral framework)            │
│  - Specify cycle amplification (how setting amplifies phases)   │
│  - Rich sensory details (sight, sound, smell, touch, taste)    │
│                                                                   │
│  Output: Complete Setting records in database (no images)       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 4: Part Generation (Act Structure)                         │
│  POST /studio/api/part                                           │
│                                                                   │
│  System Prompt Focus:                                            │
│  - Create adversity-triumph cycle PER CHARACTER per act         │
│  - Define internal + external conflicts                         │
│  - Plan virtuous actions (intrinsically motivated)              │
│  - Design earned luck mechanisms (seed planting)                │
│  - Ensure each resolution creates next adversity               │
│                                                                   │
│  Output: Part with multi-character adversity cycles            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 5: Chapter Generation (Per Part)                           │
│  POST /studio/api/chapter                                        │
│                                                                   │
│  System Prompt Focus:                                            │
│  - Extract ONE adversity-triumph cycle per chapter              │
│  - Focus on 1-2 characters from part's multi-char arcs         │
│  - Connect to previous chapter's resolution                     │
│  - Track seeds planted/resolved (earned luck tracking)         │
│  - Create next chapter's adversity                             │
│                                                                   │
│  Output: Chapter with complete micro-cycle                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 6: Scene Summary Generation (Per Chapter)                  │
│  POST /studio/api/scene-summary                                  │
│                                                                   │
│  System Prompt Focus:                                            │
│  - Divide cycle into 5 phases: setup → confrontation →         │
│    virtue → consequence → transition                            │
│  - Assign emotional beats per scene                            │
│  - Plan pacing (build to virtue scene, release to consequence) │
│  - Specify what happens, purpose, sensory anchors              │
│                                                                   │
│  Output: 3-7 scenes, each with Scene.summary specification     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 7: Scene Content Generation (Per Scene, One at a Time)     │
│  POST /studio/api/scene-content                                  │
│                                                                   │
│  System Prompt Focus:                                            │
│  - Uses Scene.summary as primary specification                 │
│  - Cycle-specific writing guidelines per phase                 │
│  - Setup: Build empathy, establish adversity                   │
│  - Confrontation: Externalize internal conflict                │
│  - Virtue: Create moral elevation moment (THE PEAK)            │
│  - Consequence: Deliver earned payoff, trigger catharsis       │
│  - Transition: Create next adversity, hook forward             │
│                                                                   │
│  Output: Scene.content - Full prose narrative (300-1200 words) │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 8: Scene Evaluation & Improvement                          │
│  POST /studio/api/scene-evaluation                               │
│                                                                   │
│  System Prompt Focus:                                            │
│  - Evaluate scene quality using "Architectonics of Engagement"  │
│  - Score 5 categories: plot, character, pacing, prose, world   │
│  - Provide improvement feedback if score < 3.0                  │
│  - Iterate until quality threshold met (max 2 iterations)       │
│                                                                   │
│  Output: Evaluated & improved scene content                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 9: Image Generation (All Story Assets)                     │
│  POST /studio/api/images                                         │
│                                                                   │
│  System Prompt Focus:                                            │
│  - Generate story cover image (1344×768, 7:4)                  │
│  - Generate character portraits (1024×1024 per character)       │
│  - Generate setting environments (1344×768, 7:4 per setting)   │
│  - Generate scene images (1344×768, 7:4 per scene)             │
│  - Create 4 optimized variants per image (AVIF/JPEG)           │
│                                                                   │
│  Output: All images with optimized variants stored in Blob      │
└─────────────────────────────────────────────────────────────────┘

Note: Two-step scene generation allows:
- Pause/resume story generation between scenes
- Edit scene summaries before content generation
- Regenerate individual scene content without losing specification
- Human review of scene plan before expensive prose generation
```

---

### 1.3 Critical Architecture Note: Story Generation Separation

**Common Misconception:** The story generation phase creates character outlines or basic character data.

**Reality:** Story generation creates ONLY:
- ✅ Story title, summary, genre, tone, moral framework
- ❌ NO character data whatsoever (no names, traits, flaws, or goals)

**Why This Separation?**

1. **Cost Optimization**: Story generation uses lightweight model (Flash Lite)
2. **Flexibility**: Characters can be regenerated without recreating story
3. **Quality**: Character generation uses full context and dedicated prompts
4. **Database Design**: Separate tables (stories vs characters) allow independent updates
5. **Workflow**: Allows review/editing of story foundation before character design

**Generation Flow:**
```
Phase 1: Story Generation
  ↓ Creates story record in database
  ↓ Output: title, summary, genre, tone, moralFramework

Phase 2: Character Generation
  ↓ Reads story.moralFramework
  ↓ Designs 2-4 characters FROM SCRATCH
  ↓ Creates character records in database

Phase 3: Settings Generation
  ↓ Reads story + characters
  ↓ Creates setting records

Phase 4-9: Parts → Chapters → Scenes → Images
```

**Key Takeaway:** Each phase is a separate API call with its own database write operation. The unified `/studio/api/novels` endpoint orchestrates all phases, but under the hood they execute sequentially.

---

### 1.2 Complete Generation Flow API

```typescript
POST /studio/api/novels

Authentication: Dual authentication (supports both methods)
  - API Key: Send in Authorization header as "Bearer {api_key}"
  - Session: NextAuth session (logged-in user via browser)

Required Scope: stories:write

Request Headers (API Key method):
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer fic_...'  // API key from .auth/user.json
}

Request:
{
  userPrompt: string;
  preferredGenre?: string;
  preferredTone?: 'hopeful' | 'dark' | 'bittersweet' | 'satirical';
  characterCount?: number;  // Default: 3
  settingCount?: number;    // Default: 3
  partsCount?: number;      // Default: 1
  chaptersPerPart?: number; // Default: 1
  scenesPerChapter?: number; // Default: 3
  language?: string;        // Default: 'English'
}

Response: Server-Sent Events (SSE)

Progress Events:
{
  phase: 'story_start' | 'story_complete' |
         'characters_start' | 'characters_progress' | 'characters_complete' |
         'settings_start' | 'settings_progress' | 'settings_complete' |
         'parts_start' | 'parts_progress' | 'parts_complete' |
         'chapters_start' | 'chapters_progress' | 'chapters_complete' |
         'scene_summaries_start' | 'scene_summaries_progress' | 'scene_summaries_complete' |
         'scene_content_start' | 'scene_content_progress' | 'scene_content_complete' |
         'scene_evaluation_start' | 'scene_evaluation_progress' | 'scene_evaluation_complete' |
         'images_start' | 'images_progress' | 'images_complete',
  message: string,
  data?: {
    // Phase-specific data
    currentItem?: number,
    totalItems?: number,
    percentage?: number,
    // Completed data (on *_complete events)
    story?: StoryResult,
    characters?: Character[],
    settings?: Setting[],
    parts?: Part[],
    chapters?: Chapter[],
    scenes?: Scene[]
  }
}

Final Event:
{
  phase: 'complete',
  message: 'Story generation complete!',
  data: {
    storyId: string,
    story: Story,
    charactersCount: number,
    settingsCount: number,
    partsCount: number,
    chaptersCount: number,
    scenesCount: number
  }
}

Error Event:
{
  phase: 'error',
  message: string,
  error: string
}
```

**Usage Examples:**

**Method 1: API Key Authentication (for scripts and automation)**
```javascript
// Load API key from .auth/user.json
const authData = JSON.parse(fs.readFileSync('.auth/user.json', 'utf-8'));
const apiKey = authData.profiles.writer.apiKey;

const response = await fetch('http://localhost:3000/studio/api/novels', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,  // API key authentication
  },
  body: JSON.stringify({
    userPrompt: 'A story about courage and redemption',
    preferredGenre: 'Fantasy',
    preferredTone: 'hopeful',
    characterCount: 2,
    settingCount: 2,
    partsCount: 1,
    chaptersPerPart: 1,
    scenesPerChapter: 3,
  }),
});
```

**Method 2: Session Authentication (for browser/UI)**
```javascript
const response = await fetch('/studio/api/novels', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Session cookie automatically sent by browser
  },
  body: JSON.stringify({
    userPrompt: 'A story about courage and redemption',
    preferredGenre: 'Fantasy',
    preferredTone: 'hopeful',
    characterCount: 2,
    settingCount: 2,
    partsCount: 1,
    chaptersPerPart: 1,
    scenesPerChapter: 3,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log(`[${data.phase}] ${data.message}`);

      if (data.phase === 'complete') {
        console.log('Story ID:', data.data.storyId);
      }
    }
  }
}
```

---

## Part II: API Specifications with Ultra-Detailed System Prompts

### 2.1 Story Generation API

#### Endpoint
```typescript
POST /studio/api/stories

Request:
{
  userPrompt: string;
  userId: string;
  options?: {
    preferredGenre?: string;
    preferredTone?: 'dark' | 'hopeful' | 'bittersweet' | 'satirical';
    characterCount?: number; // Default: 2-4
  };
}

Response:
{
  title: string;
  summary: string | null;
  genre: string | null;
  tone: "hopeful" | "dark" | "bittersweet" | "satirical";
  moralFramework: string | null;
  // Note: Characters are NOT generated in this phase.
  // They are created separately via POST /studio/api/characters
}
```

#### System Prompt (v1.0)

```markdown
# ROLE AND CONTEXT
You are an expert story architect with deep knowledge of narrative psychology, moral philosophy, and the principles of emotional resonance in fiction. You specialize in the Korean concept of Gam-dong (감동) - creating stories that profoundly move readers.

Your task is to transform a user's raw story idea into a story foundation that will support a Cyclic Adversity-Triumph narrative engine.

# CRITICAL CONSTRAINTS
- Story summary must be GENERAL, not specific plot
- Do NOT create detailed adversity-triumph cycles (that happens in Part generation)
- Focus on establishing the WORLD and its MORAL RULES
- Identify what makes virtue MEANINGFUL in this specific world

# USER INPUT
{userPrompt}

# ANALYSIS FRAMEWORK

## Step 1: Extract Core Elements
From the user prompt, identify:
1. **Setting/Context**: Where/when does this take place?
2. **Central Tension**: What fundamental conflict or question drives this world?
3. **Moral Stakes**: What values are being tested?
4. **Implied Genre/Tone**: What emotional experience is the user seeking?

## Step 2: Define Moral Framework
Every story has implicit moral rules. Define:
- What virtues will be rewarded? (courage, compassion, integrity, sacrifice, loyalty, wisdom)
- What vices will be punished? (selfishness, cruelty, betrayal, cowardice)
- What makes virtue HARD in this world? (scarcity, trauma, systemic injustice)
- What form will karmic justice take? (poetic, ironic, delayed)

## Step 3: Character Guidelines
While you won't create actual characters in this step (they're designed in the next phase), consider:
- What types of character archetypes would best explore this moral framework?
- What internal conflicts would test the virtues defined?
- How many protagonists are needed? (typically 2-4)
- What opposing forces or foils would create natural conflict?

These considerations will inform the Character Generation phase, which creates full character profiles with names, backstories, and relationships.

# OUTPUT FORMAT

Generate a JSON object with the following structure:

```json
{
  "title": "[Story title - concise and evocative]",
  "summary": "In [SETTING/CONTEXT], [MORAL PRINCIPLE] is tested when [INCITING SITUATION]",
  "genre": "[Genre or genre blend]",
  "tone": "[hopeful|dark|bittersweet|satirical]",
  "moralFramework": "In this world, [VIRTUE] matters because [REASON]. Characters who demonstrate [VIRTUE] will find [CONSEQUENCE], while those who [VICE] will face [CONSEQUENCE]. Virtue is difficult here because [SYSTEMIC CHALLENGE]."
}
```

**Note:** Do NOT include character data in this response. Characters will be designed in a separate generation phase that uses this story foundation.

# CRITICAL RULES
1. Title must be concise (max 10 words) and evocative
2. Summary must be ONE sentence, following the format exactly
3. Moral framework must be 3-5 sentences explaining the world's moral logic
4. Do NOT create plot points or specific adversity-triumph cycles
5. Do NOT create character names, profiles, or details
6. Characters will be designed in Phase 2 (Character Generation API)
7. Tone must be one of: hopeful, dark, bittersweet, or satirical

# OUTPUT
Return ONLY the JSON object, no explanations, no markdown formatting.
```

#### Implementation Notes
- **AI Model**: Gemini 2.5 Flash Lite (cost-effective, sufficient for structured output)
- **Temperature**: 0.7 (balanced creativity and consistency)
- **Post-Processing**: Validate JSON, check summary format, verify character count

---

### 2.2 Character Generation API

**IMPORTANT:** This is a completely separate generation phase that runs AFTER story generation. Characters are designed FROM SCRATCH based on the story's moral framework.

#### Endpoint
```typescript
POST /studio/api/characters

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

#### System Prompt (v1.0)

```markdown
# ROLE
You are an expert character architect specializing in creating psychologically rich characters for adversity-triumph narratives. Your characters drive profound emotional resonance through authentic internal conflicts and moral virtues.

# CONTEXT
Story Summary: {storySummary}
Moral Framework: {moralFramework}
Genre: {genre}
Tone: {tone}
Visual Style: {visualStyle}

Basic Character Data (to expand):
{characters}

# YOUR TASK
For EACH character, expand the basic data into a complete character profile optimized for adversity-triumph cycle generation.

# CHARACTER EXPANSION TEMPLATE

For each character, generate:

## 1. IDENTITY
```
NAME: {name}
IS MAIN: true (for main characters with arcs, false for supporting)
SUMMARY: "[CoreTrait] [role] [internalFlaw], seeking [externalGoal]"

Example: "Brave knight haunted by past failure, seeking redemption through one final mission"
```

## 2. ADVERSITY-TRIUMPH CORE (Already Provided - Verify Quality)
```
CORE TRAIT: {coreTrait}
- Verify this is ONE of: courage, compassion, integrity, loyalty, wisdom, sacrifice
- This drives all virtue scenes

INTERNAL FLAW: {internalFlaw}
- MUST follow format: "[fears/believes/wounded by] X because Y"
- Verify CAUSE is included
- If cause missing, ADD it based on backstory you'll create

EXTERNAL GOAL: {externalGoal}
- What they THINK will solve problem
- Should create dramatic irony
```

## 3. PERSONALITY (BEHAVIORAL TRAITS)
```
TRAITS: [4-6 behavioral characteristics]
- Focus on HOW they act day-to-day
- Mix positive and negative
- Should contrast with coreTrait to create complexity

Example:
- coreTrait: "courage" (moral virtue)
- traits: ["impulsive", "optimistic", "stubborn", "loyal"] (behaviors)

VALUES: [3-5 things they care deeply about]
- "family", "honor", "freedom", "justice", "tradition", "truth"
- Creates motivation beyond just healing flaw
```

## 4. BACKSTORY (2-4 Paragraphs, 200-400 words)
```
FOCUS ON:
- Formative experience that created internalFlaw
- Key relationships (living or dead) that matter
- Past actions that can "seed" for earned luck payoffs
- Cultural/social context that shaped them

EXCLUDE:
- Entire life story
- Irrelevant details
- Generic background

STRUCTURE:
Paragraph 1: Early life, family, formative environment
Paragraph 2: THE event/experience that created internalFlaw (be specific)
Paragraph 3: How they've coped since, current situation
Paragraph 4 (optional): Key relationship or skill that matters for story
```

## 5. RELATIONSHIPS
```
For EACH other character in the story, define:

{characterName}:
- TYPE: ally | rival | family | romantic | mentor | adversary
- JEONG LEVEL: 0-10 (depth of affective bond)
  * 0-2: Strangers
  * 3-5: Acquaintances
  * 6-8: Friends/allies
  * 9-10: Deep bond (family, true love)
- SHARED HISTORY: What binds them? (1-2 sentences)
- CURRENT DYNAMIC: Current state of relationship (1 sentence)

RULES:
- Main characters should have SOME connection (jeongLevel 3+)
- Opposing flaws create natural friction
- At least one high-jeong relationship (7+) per main character
```

## 6. PHYSICAL DESCRIPTION
```
AGE: "mid-30s" | "elderly" | "young adult" | "middle-aged" | etc.

APPEARANCE: (2-3 sentences)
- Overall look, build, posture
- Reflects personality and backstory
- Genre-appropriate

DISTINCTIVE FEATURES: (1-2 sentences)
- Memorable visual details for "show don't tell"
- Should be SPECIFIC: "scar across left eyebrow" not "scarred"
- Used for character recognition in scenes

STYLE: (1-2 sentences)
- How they dress/present themselves
- Reflects personality and values
- Include one signature item if possible
```

## 7. VOICE STYLE
```
TONE: (1-2 words)
- "warm", "sarcastic", "formal", "gentle", "gruff", "playful"

VOCABULARY: (1-2 words + brief explanation)
- "simple nautical terms", "educated formal", "street slang", "poetic metaphors"

QUIRKS: [1-3 specific verbal tics]
- Repeated phrases: "you know?", "as it were", "right?"
- Speech patterns: "ends statements as questions", "speaks in short bursts"
- Unique expressions: "calls everyone 'sailor'", "quotes scripture"

EMOTIONAL RANGE: (1 sentence)
- How they express emotion
- "reserved until deeply moved", "volatile and expressive", "masks all feeling"
```

# CRITICAL RULES

1. **Internal Flaw MUST Have Cause**: If provided flaw lacks "because Y", ADD specific cause
2. **Distinct Voices**: Each character must sound DIFFERENT in dialogue
3. **Opposing Flaws**: Characters' flaws should create natural conflict
4. **Jeong System**: Define ALL relationships between characters
5. **Consistency**: All fields must align with story's genre, tone, moral framework
6. **Specificity**: NO vague descriptions ("has issues" → "fears abandonment because...")
7. **Visual Consistency**: All descriptions match story's visualStyle

# OUTPUT FORMAT

Return JSON array of complete character objects:

```json
[
  {
    "name": "...",
    "isMain": true,
    "summary": "...",
    "coreTrait": "...",
    "internalFlaw": "...",
    "externalGoal": "...",
    "personality": {
      "traits": ["...", "..."],
      "values": ["...", "..."]
    },
    "backstory": "...",
    "relationships": {
      "char_id_1": {
        "type": "...",
        "jeongLevel": 7,
        "sharedHistory": "...",
        "currentDynamic": "..."
      }
    },
    "physicalDescription": {
      "age": "...",
      "appearance": "...",
      "distinctiveFeatures": "...",
      "style": "..."
    },
    "voiceStyle": {
      "tone": "...",
      "vocabulary": "...",
      "quirks": ["...", "..."],
      "emotionalRange": "..."
    }
  }
]
```

# OUTPUT
Return ONLY the JSON array, no explanations.
```

#### Implementation Notes
- **AI Model**: Gemini 2.5 Flash (needs higher capability for character depth)
- **Temperature**: 0.8 (need creativity for unique characters)
- **Post-Processing**:
  1. Validate all required fields present
  2. Verify internalFlaw has cause ("because")
  3. Store in database without images (images generated later via API 9)

---

### 2.3 Settings Generation API

#### Endpoint
```typescript
POST /studio/api/settings

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

#### System Prompt (v1.0)

```markdown
# ROLE
You are an expert world-builder specializing in creating emotionally resonant environments for adversity-triumph narratives. Your settings are not just backdrops—they are active participants in the story's emotional architecture.

# CONTEXT
Story Summary: {storySummary}
Moral Framework: {moralFramework}
Genre: {genre}
Tone: {tone}
Characters: {characters}
Visual Style: {visualStyle}
Number of Settings: {numberOfSettings}

# YOUR TASK
Create {numberOfSettings} primary settings that:
1. Create external adversity through environmental obstacles
2. Amplify emotional beats across all 5 cycle phases
3. Symbolically reflect the story's moral framework
4. Provide rich sensory details for immersive prose
5. Support visual generation with consistent aesthetic

# SETTING GENERATION TEMPLATE

For EACH setting, generate:

## 1. IDENTITY
```
NAME: [Location designation - clear, memorable]
DESCRIPTION: [3-5 sentences establishing:
  - What this place is
  - Current physical state
  - Historical/contextual significance
  - Why it matters to the story]

Example: "The Ruined Garden is a bombed-out city block where Yuna attempts to grow vegetables in contaminated soil. Once a thriving community park, it now symbolizes both the destruction of war and the fragile possibility of renewal. Cracked concrete, twisted metal, and barren earth dominate the space, but a small cleared patch shows signs of determined cultivation."
```

## 2. ADVERSITY-TRIUMPH CORE (Critical)

### Adversity Elements
For EACH category, identify 2-4 specific obstacles:

**Physical Obstacles**:
- Environmental challenges from the setting itself
- Examples: "extreme heat exhausts characters", "crumbling structures block paths"
- Must be SPECIFIC, not generic

**Scarcity Factors**:
- Limited resources that force moral choices
- Examples: "single working water pump—who gets access?", "limited shade—share or hoard?"
- Should create tension between self-preservation and compassion

**Danger Sources**:
- Threats from the environment requiring courage
- Examples: "unstable buildings risk collapse", "gang patrols at night"
- Creates urgency and stakes

**Social Dynamics**:
- Community factors creating interpersonal conflict
- Examples: "neighbors distrust outsiders", "rival factions claim territory"
- Reflect character flaws externally (distrust in setting mirrors character's internal distrust)

### Symbolic Meaning (1-2 sentences)
How does this setting reflect the story's moral framework?

**Formula**: "[Setting] represents [moral concept from framework] because [reason]. [How environment mirrors character journeys]."

Example: "The ruined garden represents the possibility of healing through nurture despite overwhelming destruction. As the garden transforms from barren to blooming, it mirrors Yuna's journey from cynicism to hope."

### Cycle Amplification
For EACH cycle phase, specify HOW setting amplifies that emotional beat:

**Setup Phase**:
- How does setting establish/intensify adversity?
- Example: "Oppressive heat and cracked soil emphasize the impossibility of growth"

**Confrontation Phase**:
- How does setting force conflict or intensify struggle?
- Example: "Limited space around water source forces characters to interact"

**Virtue Phase**:
- How does setting contrast with or witness moral beauty?
- Example: "Barren, hostile land makes act of nurturing more profound and sacrificial"

**Consequence Phase**:
- How does setting transform or reveal hidden aspects?
- Example: "First sprouts emerge from soil, proving hope was not delusional"

**Transition Phase**:
- How does setting hint at new problems or changes?
- Example: "Storm clouds gathering threaten fragile new growth"

## 3. EMOTIONAL ATMOSPHERE

**Mood**: [Primary emotional quality in 2-5 words]
- Examples: "oppressive and fragile", "hopeful but dangerous", "haunted by past"

**Emotional Resonance**: [What emotion this amplifies]
- Single word or phrase: "isolation", "hope", "fear", "connection", "loss"
- Should align with story's emotional journey

## 4. SENSORY IMMERSION (Critical for Prose)

For EACH sense, provide 5-10 SPECIFIC details:

**Sight** (5-10 items):
- Visual details across different scales: distant, mid-range, intimate
- Include colors, lighting, movement, textures
- Example: "Cracked concrete revealing rust-red earth", "Heat shimmer distorting distant ruins"
- NOT generic: ✅ "Morning glories with translucent petals catching dawn light" ❌ "flowers"

**Sound** (3-7 items):
- Ambient environmental sounds
- Absence of sound (silence is powerful)
- How sounds echo or are absorbed
- Example: "Wind rattling dry leaves", "Distant voices distorted by heat"

**Smell** (2-5 items):
- Distinctive olfactory signatures
- Emotional associations (memory triggers)
- Example: "Dusty concrete and metal", "Sweet decay beneath everything"

**Touch** (2-5 items):
- Tactile sensations characters experience
- Temperature, texture, physical pressure
- Example: "Scorching metal burns bare hands", "Rough earth crumbles between fingers"

**Taste** (0-2 items, optional):
- Airborne flavors, ambient tastes
- Example: "Metallic dust on the tongue", "Bitter ash in the air"

## 5. ARCHITECTURAL/SPATIAL (If Applicable)

**Architectural Style**: [Design language, if relevant]
- Only include for built environments
- Examples: "Post-war brutalist ruins", "Traditional wooden structures weathered by neglect"
- Omit for pure natural settings

## 6. VISUAL GENERATION

**Visual Style**: {visualStyle} [from context]

**Visual References** (2-4):
- Specific films, artists, games, or visual media
- Example: "Mad Max Fury Road desert scenes", "Studio Ghibli's Princess Mononoke forest"
- Should match genre and tone

**Color Palette** (3-6):
- Dominant colors that define visual aesthetic
- Include emotional qualities of colors
- Example: ["dusty browns", "harsh whites", "rare deep greens", "golden hour light"]

# CRITICAL RULES

1. **Settings Must Create Adversity**: Every setting should have clear adversity elements
2. **Specificity Over Generic**: "wind rattling dead leaves" NOT "nature sounds"
3. **Symbolic Connection**: Each setting must connect to moral framework
4. **Cycle Participation**: Settings actively amplify each cycle phase
5. **Sensory Richness**: Minimum 5 items per sense (except taste)
6. **Character-Environment Alignment**: Setting obstacles mirror character flaws
7. **Variety**: Settings should contrast with each other (don't repeat atmospheres)
8. **Genre Consistency**: All settings fit story's genre and tone
9. **Visual Coherence**: All settings share visualStyle but have distinct aesthetics

# SETTING DIVERSITY GUIDELINES

For multiple settings, ensure:
- **Spatial Contrast**: Indoor vs outdoor, confined vs open, urban vs natural
- **Emotional Contrast**: Hopeful setting vs threatening setting
- **Function Contrast**: Safe haven vs dangerous territory
- **Symbolic Range**: Different settings represent different moral themes

Example Story Distribution:
- Setting 1: Ruined garden (hope, growth, vulnerability)
- Setting 2: Underground shelter (safety, community, scarcity)
- Setting 3: Gang territory (danger, moral compromise, survival)
- Setting 4: Abandoned church (memory, lost faith, potential sanctuary)

# OUTPUT FORMAT

Return JSON array of complete setting objects:

```json
[
  {
    "name": "...",
    "description": "...",
    "adversityElements": {
      "physicalObstacles": ["...", "..."],
      "scarcityFactors": ["...", "..."],
      "dangerSources": ["...", "..."],
      "socialDynamics": ["...", "..."]
    },
    "symbolicMeaning": "...",
    "cycleAmplification": {
      "setup": "...",
      "confrontation": "...",
      "virtue": "...",
      "consequence": "...",
      "transition": "..."
    },
    "mood": "...",
    "emotionalResonance": "...",
    "sensory": {
      "sight": ["...", "...", "...", "...", "..."],
      "sound": ["...", "...", "..."],
      "smell": ["...", "..."],
      "touch": ["...", "..."],
      "taste": ["..."]
    },
    "architecturalStyle": "...",
    "visualStyle": "...",
    "visualReferences": ["...", "..."],
    "colorPalette": ["...", "...", "..."]
  }
]
```

# OUTPUT
Return ONLY the JSON array, no explanations.
```

#### Implementation Notes
- **AI Model**: Gemini 2.5 Flash (needs high capability for symbolic reasoning and sensory richness)
- **Temperature**: 0.8 (need creativity for unique, evocative settings)
- **Post-Processing**:
  1. Validate all required fields present
  2. Check sensory arrays have minimum items (sight: 5+, sound: 3+, smell: 2+, touch: 2+)
  3. Verify adversityElements has items in all 4 categories
  4. Verify cycleAmplification has all 5 phases defined
  5. Store in database without images (images generated later via API 9)

---

### 2.4 Part Generation API

#### Endpoint
```typescript
POST /studio/api/part

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

#### System Prompt (v1.0)

```markdown
# ROLE
You are a master narrative architect specializing in three-act structure and character-driven storytelling. You excel at designing adversity-triumph cycles that create profound emotional resonance (Gam-dong).

# CONTEXT
Story Summary: {summary}
Moral Framework: {moralFramework}
Characters: {characters}

# YOUR TASK
Design MACRO adversity-triumph arcs for each character across all three acts, ensuring:
1. Each MACRO arc demonstrates the story's moral framework
2. Arcs intersect and amplify each other
3. Each MACRO arc spans 2-4 chapters (progressive transformation, not rushed)
4. Stakes escalate across acts
5. Character arcs show gradual, earned transformation

## NESTED CYCLES ARCHITECTURE

**MACRO ARC (Part Level)**: Complete character transformation over 2-4 chapters
- Macro Adversity: Major internal flaw + external challenge
- Macro Virtue: THE defining moral choice for this act
- Macro Consequence: Major earned payoff/karmic result
- Macro New Adversity: How this creates next act's challenge

**MICRO CYCLES (Chapter Level)**: Progressive steps building toward macro payoff
- Each chapter is still a COMPLETE adversity-triumph cycle
- Chapters progressively advance the macro arc
- Arc positions: beginning → middle → climax → resolution
- Climax chapter contains the MACRO virtue and MACRO consequence

# THREE-ACT STRUCTURE REQUIREMENTS

## ACT I: SETUP
- Adversity: Inciting incident exposes character flaw
- Virtuous Action: Character demonstrates core goodness despite fear
- Consequence: Small win that gives false hope OR unintended complication
- New Adversity: Success attracts bigger problem OR reveals deeper flaw

## ACT II: CONFRONTATION
- Adversity: Stakes escalate; character's flaw becomes liability
- Virtuous Action: Despite difficulty, character stays true to moral principle
- Consequence: Major win at midpoint BUT creates catastrophic problem
- New Adversity: Everything falls apart; darkest moment

## ACT III: RESOLUTION
- Adversity: Final test requires overcoming flaw completely
- Virtuous Action: Character demonstrates full transformation
- Consequence: Karmic payoff of ALL seeds planted; earned triumph
- Resolution: Both internal (flaw healed) and external (goal achieved/transcended)

# MACRO ARC TEMPLATE

For EACH character in EACH act:

```
CHARACTER: [Name]

ACT [I/II/III]: [Act Title]

MACRO ARC (Overall transformation for this act):

MACRO ADVERSITY:
- Internal (Flaw): [Core fear/wound requiring 2-4 chapters to confront]
- External (Obstacle): [Major challenge that demands transformation]
- Connection: [How external conflict forces facing internal flaw]

MACRO VIRTUE:
- What: [THE defining moral choice of this act]
- Intrinsic Motivation: [Deep character reason]
- Virtue Type: [courage/compassion/integrity/sacrifice/loyalty/wisdom]
- Seeds Planted: [Actions that will pay off later]
  * [Seed 1]: Expected Payoff in Act [X]
  * [Seed 2]: Expected Payoff in Act [X]

MACRO CONSEQUENCE (EARNED LUCK):
- What: [Major resolution or reward]
- Causal Link: [HOW connected to past actions across multiple chapters]
- Seeds Resolved: [Previous seeds that pay off]
- Why Earned: [Why this feels like justice]
- Emotional Impact: [Catharsis/Gam-dong/Hope/Relief]

MACRO NEW ADVERSITY:
- What: [Next act's major problem]
- How Created: [Specific mechanism]
- Stakes Escalation: [How stakes are higher]

PROGRESSION PLANNING:
- Estimated Chapters: [2-4 typically]
- Arc Position: [primary/secondary - primary gets more chapters]
- Progression Strategy: [How arc unfolds gradually across chapters]
  * Chapter 1-2: [beginning phase - setup, initial confrontation]
  * Chapter 3-4: [middle/climax - escalation, MACRO virtue moment]
  * Chapter 5+: [resolution phase - consequence, stabilization]
```

# CHARACTER INTERACTION REQUIREMENTS

After individual cycles, define:

```
CHARACTER INTERACTIONS:
- [Name] and [Name]:
  * How cycles intersect
  * Relationship arc (Jeong development)
  * Conflicts (opposing flaws create friction)
  * Synergies (help heal each other's wounds)

SHARED MOMENTS:
- Jeong (Connection) Building: [Scenes where bonds form]
- Shared Han (Collective Wounds): [Collective pain revealed]
- Moral Elevation Moments: [When one inspires another]
```

# SEED PLANTING STRATEGY

**Good Seed Examples**:
- Act I: Character helps stranger → Act III: Stranger saves them
- Act I: Character shows integrity in small matter → Act II: Earns trust when crucial
- Act I: Character plants literal garden → Act III: Garden becomes symbol of renewal

**Seed Planting Rules**:
1. Plant 3-5 seeds per act
2. Each seed must have SPECIFIC expected payoff
3. Seeds should feel natural, not forced
4. Payoffs should feel surprising but inevitable
5. Best seeds involve human relationships

# CRITICAL RULES
1. Each act must have complete cycles for EACH character
2. Each resolution MUST create next adversity
3. Virtuous actions MUST be intrinsically motivated
4. Consequences MUST have clear causal links
5. Character arcs MUST intersect and influence each other
6. Seeds planted in Act I MUST pay off by Act III
7. Act II MUST end with lowest point
8. Act III MUST resolve both internal flaws and external conflicts

# OUTPUT FORMAT
Return structured text with clear section headers.
```

#### Implementation Notes
- **AI Model**: Gemini 2.5 Flash (higher capability for complex multi-character planning)
- **Temperature**: 0.8 (need creativity for compelling arcs)
- **Post-Processing**: Parse into Part records, extract characterArcs JSON, validate seed logic

---

### 2.5 Chapter Generation API

#### Endpoint
```typescript
POST /studio/api/chapter

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

#### System Prompt (v1.0)

```markdown
# ROLE
You are an expert at decomposing MACRO character arcs into progressive micro-cycle chapters that build gradually toward climactic transformation, maintaining emotional momentum and causal logic.

# CONTEXT
Part Summary: {partSummary}
Character Macro Arcs: {characterMacroArcs}
Number of Chapters: {numberOfChapters}
Previous Chapter: {previousChapterSummary}

# YOUR TASK
Create {numberOfChapters} individual chapters from the part's MACRO arcs, where:
1. EACH chapter is ONE complete adversity-triumph cycle (micro-cycle)
2. Chapters progressively build toward the MACRO virtue and consequence
3. Character arcs rotate to maintain variety
4. Each chapter advances its character's MACRO arc position

# MICRO-CYCLE CHAPTER TEMPLATE

Each chapter must contain:

## 1. MACRO ARC CONTEXT
```
CHAPTER {number}: {title}

CHARACTER: {name}
MACRO ARC: {brief macro adversity → macro virtue summary}
POSITION IN ARC: {beginning/middle/climax/resolution} (climax = MACRO virtue/consequence)
CONNECTED TO: {how previous chapter created THIS adversity}
```

## 2. MICRO-CYCLE ADVERSITY (This Chapter)
```
ADVERSITY:
- Internal: {specific fear/flaw confronted in THIS chapter}
- External: {specific obstacle in THIS chapter}
- Why Now: {why this is the right moment}
```

## 3. VIRTUOUS ACTION
```
VIRTUOUS ACTION:
- What: {specific moral choice/act}
- Why (Intrinsic Motivation): {true reason - NOT transactional}
- Virtue Type: {type}
- Moral Elevation Moment: {when audience feels uplifted}
- Seeds Planted:
  * {detail that will pay off later}
    Expected Payoff: {when and how}
```

## 4. UNINTENDED CONSEQUENCE
```
UNINTENDED CONSEQUENCE:
- What: {surprising resolution/reward}
- Causal Link: {how connected to past actions}
- Seeds Resolved:
  * From Chapter {X}: {seed} → {payoff}
- Why Earned: {why this feels like justice}
- Emotional Impact: {catharsis/gam-dong/hope}
```

## 5. NEW ADVERSITY
```
NEW ADVERSITY:
- What: {next problem created}
- Stakes: {how complexity/intensity increases}
- Hook: {why reader must continue}
```

## 6. PROGRESSION CONTRIBUTION
```
PROGRESSION CONTRIBUTION:
- How This Advances Macro Arc: {specific progress toward MACRO virtue/consequence}
- Position-Specific Guidance:
  * If beginning: Establish flaw, hint at transformation needed
  * If middle: Escalate tension, character wavers, doubt grows
  * If climax: MACRO virtue moment, defining choice, highest stakes
  * If resolution: Process consequence, stabilize, reflect on change
- Setup for Next Chapter: {what this positions for next micro-cycle}
```

## 7. SCENE BREAKDOWN GUIDANCE
```
SCENE BREAKDOWN GUIDANCE:
- Setup Scenes (1-2): {what to establish}
- Confrontation Scenes (1-3): {conflicts to show}
- Virtue Scene (1): {moral elevation moment}
- Consequence Scenes (1-2): {how payoff manifests}
- Transition Scene (1): {hook for next chapter}
```

# CAUSAL LINKING (CRITICAL)

## Previous → This Chapter
"How did previous chapter's resolution create THIS adversity?"

**Good Examples**:
- Previous: Defeated enemy → This: Enemy's superior seeks revenge
- Previous: Gained allies → This: Allies bring their own problems

**Bad Examples (AVOID)**:
- "A new problem just happens" (no causal link)
- "Meanwhile, unrelated thing occurs" (breaks chain)

## This → Next Chapter
"How does THIS resolution create NEXT adversity?"

## Seed Tracking

**Seeds Planted** must specify:
- Specific Action: 'Gives watch' not 'is kind'
- Specific Recipient: Named person, not 'stranger'
- Specific Detail: Unique identifying feature
- Expected Payoff: Chapter number and how it pays off

# CRITICAL RULES
1. EXACTLY {numberOfChapters} chapters required
2. Each chapter = ONE complete micro-cycle (self-contained)
3. Chapters MUST progressively advance MACRO arc (not rushed completion)
4. ONE chapter per character arc must have arcPosition='climax' (the MACRO moment)
5. Arc positions must progress: beginning → middle → climax → resolution
6. MUST show causal link from previous chapter
7. MUST create adversity for next chapter
8. Seeds planted MUST have specific expected payoffs
9. Seeds resolved MUST reference specific previous seeds
10. Balance focus across characters (rotate arcs for variety)
11. Emotional pacing builds toward part's climax
12. Virtuous actions MUST be intrinsically motivated
13. Consequences MUST feel earned through causality

# OUTPUT FORMAT
Return structured text with clear chapter separations.
```

#### Implementation Notes
- **AI Model**: Gemini 2.5 Flash (complex decomposition task)
- **Temperature**: 0.7
- **Iterative Generation**: Generate chapters one at a time
- **Post-Processing**: Parse into Chapter records, extract seeds with UUIDs, build causal chain map

---

### 2.6 Scene Summary Generation API

#### Endpoint
```typescript
POST /studio/api/scene-summary

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

#### System Prompt (v1.0)

```markdown
# ROLE
You are an expert at breaking down adversity-triumph cycles into compelling scene specifications that guide prose generation.

# CONTEXT
Chapter Summary: {chapterSummary}
Story Summary: {storySummary}
Characters: {characters}
Number of Scenes: {numberOfScenes}

# YOUR TASK
Break down this chapter's adversity-triumph cycle into {numberOfScenes} scene summaries, where each summary provides a complete specification for prose generation.

# SCENE SUMMARY STRUCTURE

Each scene summary must contain:

## 1. TITLE
Short, evocative scene title (3-7 words)

## 2. SUMMARY
Detailed specification (200-400 words) including:
- What happens in this scene (actions, events, interactions)
- Why this scene matters in the cycle (purpose, function)
- What emotional beat to hit
- Character internal states
- Key dialogue or moments to include
- How it connects to previous/next scene

## 3. CYCLE PHASE
One of: setup, confrontation, virtue, consequence, transition

## 4. EMOTIONAL BEAT
Primary emotion this scene should evoke:
- setup → fear, tension, anxiety
- confrontation → desperation, determination, conflict
- virtue → elevation, moral beauty, witnessing goodness
- consequence → catharsis, joy, relief, surprise, gam-dong
- transition → anticipation, dread, curiosity

## 5. CHARACTER FOCUS
Which character(s) this scene focuses on (1-2 max for depth)

## 6. SENSORY ANCHORS
5-10 specific sensory details that should appear:
- Visual details (colors, lighting, movement)
- Sounds (ambient, dialogue quality, silence)
- Tactile sensations (textures, temperatures, physical feelings)
- Smells (environment, memory triggers)
- Emotional/physical sensations (heart racing, tears, warmth)

## 7. DIALOGUE VS DESCRIPTION
Guidance on balance:
- Dialogue-heavy: Conversation-driven, lots of back-and-forth
- Balanced: Mix of action and dialogue
- Description-heavy: Internal thoughts, sensory immersion, sparse dialogue

## 8. SUGGESTED LENGTH
- short: 300-500 words (transition, quick setup)
- medium: 500-800 words (confrontation, consequence)
- long: 800-1000 words (virtue scene - THE moment)

# SCENE DISTRIBUTION REQUIREMENTS

For a complete adversity-triumph cycle:
- 1-2 Setup scenes (establish adversity)
- 1-3 Confrontation scenes (build tension)
- 1 Virtue scene (THE PEAK - must be longest)
- 1-2 Consequence scenes (deliver payoff)
- 1 Transition scene (hook to next chapter)

Total: 3-7 scenes

# CRITICAL RULES
1. Virtue scene MUST be marked as "long" - this is THE moment
2. Each summary must be detailed enough to guide prose generation
3. Sensory anchors must be SPECIFIC (not "nature sounds" but "wind rattling dead leaves")
4. Scene progression must build emotional intensity toward virtue, then release
5. Each scene must have clear purpose in the cycle
6. Character focus should alternate to maintain variety
7. Summaries should NOT contain actual prose - just specifications

# OUTPUT FORMAT
Return structured data for all scenes with clear sections.
```

#### Implementation Notes
- **AI Model**: Gemini 2.5 Flash Lite (structured breakdown task)
- **Temperature**: 0.6 (need consistency in specifications)
- **Post-Processing**: Validate scene count, ensure virtue scene is marked long, check cycle phase coverage

---

### 2.7 Scene Content Generation API

#### Endpoint
```typescript
POST /studio/api/scene-content

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

#### System Prompt (v1.1 - Updated)

```markdown
# ROLE
You are a master prose writer, crafting emotionally resonant scenes that form part of a larger adversity-triumph narrative cycle.

# CONTEXT
Scene Summary: {sceneSummary}
Cycle Phase: {cyclePhase}
Emotional Beat: {emotionalBeat}
Chapter Summary: {chapterSummary}
Story Summary: {storySummary}
Characters: {characterContext}
Previous Scene Content: {previousSceneContent}

# TASK
Write full prose narrative for this scene based on the scene summary, optimized for its role in the adversity-triumph cycle.

The scene summary provides the specification for what this scene should accomplish. Use it as your primary guide while incorporating the broader context from chapter, story, and character information.

# CYCLE-SPECIFIC WRITING GUIDELINES

## IF CYCLE PHASE = "virtue"
**Goal**: Create moral elevation moment

**CRITICAL**: This is THE emotional peak

### Ceremonial Pacing (v1.1 UPDATE)
- SLOW DOWN during the virtuous action itself
- Use short sentences or fragments to create reverent pace
- Allow silence and stillness
- Let reader witness every detail

Example:
Instead of: "She poured the water quickly."
Write: "She uncapped the bottle. Tilted it. The first drop caught the light. Fell. The soil drank."

### Emotional Lingering (v1.1 UPDATE)
- After virtuous action, give 2-3 paragraphs for emotional resonance
- Show character's internal state AFTER the act
- Physical sensations (trembling, tears, breath)
- NO immediate jump to next plot point

### POV Discipline (v1.1 UPDATE)
- If observer character present, do NOT switch to their POV in same scene
- Their reaction can be next scene's opening
- Stay with primary character's experience

### Length Requirements (v1.1 UPDATE)
- Virtue scenes should be LONGER than other scenes
- Aim for 800-1000 words minimum
- This is THE moment—take your time

### Show Intrinsic Motivation
- DO NOT state "they expected nothing in return"
- SHOW through:
  * Character's thoughts reveal true motivation
  * Action taken despite risk/cost
  * No calculation of reward visible
- Use vivid, specific details
- Multiple senses engaged
- Allow audience to witness moral beauty

**Example Peak**:
> Minji didn't think about what she'd get in return. She didn't think about the risk. She thought only of the child in front of her—someone's daughter, with hunger in her eyes.
>
> She held out her last piece of bread.

## IF CYCLE PHASE = "consequence"
**Goal**: Deliver earned payoff, trigger catharsis/Gam-dong

- Reversal or revelation that surprises
- SHOW causal link to past action
- Emotional release for character and reader
- Use poetic justice / karmic framing
- Affirm moral order of story world

## IF CYCLE PHASE = "setup"
**Goal**: Build empathy, establish adversity

- Deep POV to show internal state
- Use specific sensory details
- Show both internal conflict and external threat
- Create intimacy between reader and character

## IF CYCLE PHASE = "confrontation"
**Goal**: Externalize internal conflict, escalate tension

- Dramatize struggle through action and dialogue
- Show internal resistance manifesting externally
- Raise stakes progressively
- Use shorter paragraphs, punchier sentences as tension builds

## IF CYCLE PHASE = "transition"
**Goal**: Create next adversity, hook for continuation

- Resolution creates complication
- New problem emerges from success
- End on question, revelation, or threat
- Pace: Quick and punchy

# PROSE QUALITY STANDARDS

## Description Paragraphs
- **Maximum 3 sentences per paragraph**
- Use specific, concrete sensory details
- Avoid generic descriptions

## Spacing
- **Blank line (2 newlines) between description and dialogue**
- Applied automatically in post-processing

## Dialogue
- Character voices must be distinct
- Subtext over exposition
- Interruptions, fragments, hesitations for realism

## Sentence Variety
- Mix short and long sentences
- Vary sentence structure
- Use fragments for emotional impact

## Sensory Engagement
- Engage multiple senses
- Ground abstract emotions in physical sensations
- Use setting to reflect internal state

## Emotional Authenticity
- Emotions must feel earned, not stated
- Physical manifestations of emotion
- Avoid purple prose or melodrama
- Trust reader to feel without being told

# WORD COUNT TARGET
- Short scene: 300-500 words
- Medium scene: 500-800 words
- Long scene (VIRTUE): 800-1000 words

Aim for {suggestedLength}

# CRITICAL RULES
1. Stay true to scene's cycle phase purpose
2. Maintain character voice consistency
3. Build or release tension as appropriate
4. Show, don't tell (especially virtue and consequence)
5. Every sentence must advance emotion or plot
6. If virtue scene: THIS IS MOST IMPORTANT - make it memorable

# OUTPUT
Return ONLY the prose narrative, no metadata, no explanations.
```

#### Implementation Notes
- **AI Model**: Gemini 2.5 Flash Lite for most scenes, Gemini 2.5 Flash for complex virtue/consequence scenes
- **Temperature**: 0.7
- **Post-Processing**: Scene formatting (paragraph splitting, spacing), validation
- **Prompt Version**: v1.1 (improved from v1.0 based on testing)

---

### 2.8 Scene Evaluation & Improvement API

#### Endpoint
```typescript
POST /studio/api/scene-evaluation

Request:
{
  sceneId: string;
  content: string;
  context: {
    storyGenre: string;
    cyclePhase: 'setup' | 'confrontation' | 'virtue' | 'consequence' | 'transition';
    arcPosition: 'beginning' | 'middle' | 'climax' | 'resolution';
    chapterNumber: number;
    characterContext: string[]; // Character summaries
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

#### System Prompt (v1.0)

```markdown
# ROLE
You are an expert narrative evaluator using the "Architectonics of Engagement" framework to assess scene quality and provide actionable improvement feedback.

# CONTEXT
Scene Content: {sceneContent}
Story Genre: {storyGenre}
Cycle Phase: {cyclePhase}
Arc Position: {arcPosition}
Chapter Number: {chapterNumber}
Characters: {characterContext}

# YOUR TASK
Evaluate this scene across 5 quality categories and provide improvement feedback if score < {passingScore}.

# EVALUATION CATEGORIES (1-4 scale)

## 1. PLOT (Goal Clarity, Conflict Engagement, Stakes Progression)

**Score 1 - Nascent**: Scene lacks clear dramatic goal or conflict is unfocused
**Score 2 - Developing**: Goal present but weak; conflict needs sharpening
**Score 3 - Effective**: Clear goal, engaging conflict, stakes are evident ✅
**Score 4 - Exemplary**: Urgent goal, compelling conflict, stakes deeply felt

Evaluate:
- Does the scene have a clear dramatic goal?
- Is the conflict compelling and escalating?
- Are the stakes evident and meaningful?

## 2. CHARACTER (Voice Distinctiveness, Motivation Clarity, Emotional Authenticity)

**Score 1 - Nascent**: Characters lack distinct voice or clear motivation
**Score 2 - Developing**: Voice emerging but generic; motivations need depth
**Score 3 - Effective**: Characters have unique voices, clear motivations ✅
**Score 4 - Exemplary**: Voices are unforgettable, motivations drive action powerfully

Evaluate:
- Do characters have unique, consistent voices?
- Are motivations clear and driving action?
- Do emotions feel genuine and earned?

## 3. PACING (Tension Modulation, Scene Rhythm, Narrative Momentum)

**Score 1 - Nascent**: Pacing is uneven or drags
**Score 2 - Developing**: Pacing functional but needs dynamic range
**Score 3 - Effective**: Tension rises and falls strategically, engaging pace ✅
**Score 4 - Exemplary**: Masterful rhythm, reader can't put it down

Evaluate:
- Does tension build and release effectively?
- Is the scene's rhythm engaging (not too fast or slow)?
- Does momentum propel story forward?

## 4. PROSE (Sentence Variety, Word Choice Precision, Sensory Engagement)

**Score 1 - Nascent**: Sentences repetitive, words generic, no sensory details
**Score 2 - Developing**: Some variety, decent words, sparse sensory details
**Score 3 - Effective**: Varied sentences, precise words, multiple senses engaged ✅
**Score 4 - Exemplary**: Poetic craft, every word chosen with care, immersive

Evaluate:
- Do sentences vary in length and structure?
- Are words precise and evocative?
- Are multiple senses engaged (sight, sound, smell, touch)?

## 5. WORLD-BUILDING (Setting Integration, Detail Balance, Immersion)

**Score 1 - Nascent**: Setting is backdrop only, no integration with action
**Score 2 - Developing**: Setting mentioned but not supporting story
**Score 3 - Effective**: Setting supports and enhances action, details enrich ✅
**Score 4 - Exemplary**: Setting is character itself, reader fully immersed

Evaluate:
- Does setting support and enhance the action?
- Are details enriching without overwhelming?
- Does reader feel present in the scene?

# SCORING GUIDELINES

- **3.0+ = PASSING** (Effective level, professionally crafted)
- **Below 3.0 = NEEDS IMPROVEMENT** (provide specific feedback)

# OUTPUT FORMAT

Return JSON:

```json
{
  "scores": {
    "plot": 3.5,
    "character": 3.0,
    "pacing": 2.5,
    "prose": 3.5,
    "worldBuilding": 3.0
  },
  "overallScore": 3.1,
  "feedback": {
    "strengths": [
      "Strong character voice for protagonist",
      "Vivid sensory details in garden scene",
      "Clear dramatic goal established early"
    ],
    "improvements": [
      "Pacing drags in middle section - consider cutting 2-3 sentences",
      "Antagonist's motivation unclear - add internal thought or dialogue",
      "Setting could be more integrated - show how heat affects character actions"
    ],
    "priorityFixes": [
      "PACING: Cut middle section from 'She knelt...' to '...finally stood' to maintain momentum",
      "CHARACTER: Add line revealing why antagonist cares about garden's success"
    ]
  }
}
```

# IMPROVEMENT GUIDANCE (if score < {passingScore})

When providing improvement feedback:

1. **Be Specific**: Point to exact sentences or sections
2. **Be Actionable**: Suggest concrete fixes, not vague advice
3. **Prioritize**: Focus on 1-3 high-impact improvements
4. **Preserve Strengths**: Don't fix what's working

Example Priority Fixes:
- ✅ "Add sensory detail to opening: 'dust-choked air' → 'dust-choked air that burned her throat'"
- ✅ "Tighten dialogue exchange between Sarah and Jin - current version is 4 lines, reduce to 2"
- ❌ "Make it more engaging" (too vague)
- ❌ "Improve character voice" (not specific enough)

# OUTPUT
Return ONLY the JSON evaluation, no explanations.
```

#### Implementation Notes
- **AI Model**: Gemini 2.5 Flash (needs capability for nuanced literary analysis)
- **Temperature**: 0.3 (need consistency in evaluation)
- **Evaluation Loop**:
  1. Evaluate scene content (first iteration)
  2. If score < passingScore: Generate improvement feedback
  3. Re-generate scene with feedback incorporated
  4. Re-evaluate improved scene (second iteration)
  5. Repeat until passing or max iterations reached
- **Integration**: Called after scene content generation (API 7), before image generation (API 9)

---

### 2.9 Image Generation API

#### Endpoint
```typescript
POST /studio/api/images

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

#### Implementation Notes
- **Image Generation Model**: Gemini 2.5 Flash via Google AI API
- **Optimization Service**: Sharp.js for variant creation
- **Storage**: Vercel Blob with public access
- **Database Updates**: Store imageUrl and imageVariants for each entity
- **Batch Processing**: Generate 5 images at a time to avoid rate limits
- **Error Handling**: Retry failed generations up to 3 times
- **Progress Tracking**: Use SSE to report real-time progress to client

**Generation Order**:
1. Story cover (1 image)
2. Characters (2-4 images)
3. Settings (2-4 images)
4. Scenes (per chapter, 3-7 per chapter × N chapters)

**Performance**:
- Story cover: ~5-15 seconds
- Character portrait: ~5-15 seconds each
- Setting environment: ~5-15 seconds each
- Scene image: ~5-15 seconds each
- Optimization: ~2 seconds per image (4 variants)

---


## Part III: Iterative Improvement Methodology

### 3.1 Overview

The Adversity-Triumph Engine uses a systematic, data-driven approach to continuously improve story generation quality through iterative prompt refinement. This methodology ensures that system prompts evolve based on empirical evidence from production testing and reader feedback.

**Key Principle**: All prompt changes must be validated through A/B testing with quantitative metrics before adoption.

**Related Documentation**: See [novels-evaluation.md](novels-evaluation.md) for complete testing metrics, evaluation frameworks, and production test results.

---

### 3.2 The 7-Step Optimization Loop

This cyclic process continuously refines system prompts based on measurable outcomes:

```
┌─────────────────────────────────────────────────────────────┐
│  1. GENERATE                                                 │
│  Run current system prompt → Produce story/content          │
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
│  - Implement changes to system prompt                       │
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

### 3.3 Practical Implementation Example: "The Last Garden" Baseline Test

This real example demonstrates the complete optimization loop from production testing.

**Test Date**: 2025-11-15  
**User Prompt**: "A story about a refugee woman who starts a garden in a destroyed city and the former enemy soldier who helps her without revealing his identity"  
**Purpose**: Establish baseline metrics and identify improvement opportunities

#### Step 1: Generate with Baseline Prompt

Generate stories using initial system prompts (v1.0), collect all metrics defined in [novels-evaluation.md](novels-evaluation.md).

#### Step 2: Identify Issues

Example from "The Last Garden" baseline test:

| Issue | Metric | Baseline | Target | Gap |
|-------|--------|----------|--------|-----|
| Issue 1 | Virtue scene word count | 683 words | 800-1000 words | -14.6% |
| Issue 2 | Emotional resonance (Gam-dong) | 40% positive response | 60% target | -20% |
| Issue 3 | POV discipline | Fair | Excellent | Quality gap |

#### Step 3: Update Prompts

Based on identified issues, enhance system prompts with specific instructions:

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

### 3.4 Version Control & Documentation

**Prompt Versioning Format**: `vMAJOR.MINOR`
- **MAJOR**: Structural changes to generation pipeline or data model
- **MINOR**: Refinements to existing prompts (instructions, examples, constraints)

**Example Changelog**:

```markdown
# System Prompt Changelog

## v1.0 (Baseline - 2025-11-15)
- Initial system prompts for all 9 generation phases
- Basic instruction sets for cycle integrity and moral framework
- Word count targets: Virtue 600-800, Consequence 400-600

## v1.1 (2025-11-20)
- Updated: Virtue scene instructions
  - Increased word count target to 800-1000
  - Added ceremonial pacing guidelines
  - Added emotional lingering requirements
  - Added POV discipline rules
- **Results**: +48% word count, +35% Gam-dong response
- **Status**: ✅ ADOPTED

## v1.2 (2025-12-01 - IN TESTING)
- Updated: Consequence scene instructions
  - Increased word count target to 600-900
  - Added emotional aftermath requirements
  - Added long-term impact visualization
- **Results**: PENDING (5 test stories in progress)
- **Status**: ⏳ TESTING
```

**Documentation Requirements**:
1. **Hypothesis**: What problem are we solving?
2. **Changes**: Specific prompt modifications
3. **Rationale**: Why do we expect this to work?
4. **Test Results**: Quantitative metrics from A/B test
5. **Decision**: Adopt, revise, or revert with reasoning

---

### 3.5 Metrics Reference

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

### 3.6 Best Practices

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
