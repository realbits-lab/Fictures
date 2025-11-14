# Type Definition Files and Schema Organization Analysis

## Executive Summary

The codebase has **3,621 total lines** of type and schema definitions organized across multiple layers:
- **Global shared types**: 3 files
- **API layer types**: 2 files  
- **Service layer types**: 2 files
- **Domain/AI types**: 1 file
- **Validation/Evaluation/Improvement schemas**: 20+ files (3,600+ lines)
- **Database schemas**: 1 large file (1,843 lines)

### Key Finding: Duplication in AI/Evaluation Types

**CRITICAL ISSUE IDENTIFIED**: There is substantial duplication between:
1. **API types** (`src/app/api/evaluation/types.ts`) - 476 lines
2. **Schema validation** (`src/lib/schemas/evaluation/*`) - 101 lines
3. **Global types** partially re-exported

The evaluation types exist in **at least 2 different places** with overlapping definitions.

---

## Directory Structure Overview

```
src/
├── types/                          # Global shared types (3 files)
│   ├── index.ts                   # Type organization index (154 lines)
│   ├── reading-history.ts         # Reading history types (67 lines)
│   ├── validation-evaluation.ts   # Legacy evaluation types (NOT FOUND - referenced)
│   └── next-auth.d.ts            # NextAuth type augmentation
├── app/
│   ├── api/
│   │   ├── studio/
│   │   │   └── types.ts           # Studio API types (404 lines)
│   │   └── evaluation/
│   │       └── types.ts           # Evaluation API types (476 lines)
│   └── [other routes]
└── lib/
    ├── schemas/                   # All Zod schemas (3,600+ lines)
    │   ├── ai/                    # AI-generated fields (674 lines)
    │   ├── generated-zod/         # Auto-generated from DB (376 lines)
    │   ├── drizzle/               # Database schema definitions (1,843 lines)
    │   ├── evaluation/            # Quality evaluation (101 lines)
    │   ├── improvement/           # Story improvement (34 lines)
    │   ├── validation/            # Data validation (32 lines)
    │   └── nested-zod/            # Nested JSON structures (133 lines)
    ├── studio/
    │   └── generators/
    │       └── types.ts           # Service layer generator types (495 lines)
    ├── ai/
    │   └── types/
    │       └── image.ts           # Image generation types (68 lines)
    └── services/                  # Business logic (15 files)
        ├── validation.ts          # Validation service
        ├── evaluation.ts          # Evaluation service
        └── [others]
```

---

## File-by-File Analysis

### 1. GLOBAL SHARED TYPES - `/src/types/`

#### `/src/types/index.ts` (154 lines)
**Purpose**: Central index for type organization and imports  
**Contains**:
- Documentation of Clean Architecture layer principles
- Type naming conventions for each layer (API, Service, Domain, Shared)
- Re-exports from evaluation, improvement, validation, and reading-history
- **Layer**: Cross-cutting concerns (Shared layer)

**Key Re-exports**:
```typescript
// Evaluation types (from lib/schemas/evaluation)
ChapterEvaluation, CharacterEvaluation, CrossReferenceAnalysis, EvaluationScore
OverallEvaluation, PartEvaluation, QuickEvaluationResult, SceneEvaluation
SettingEvaluation, StoryEvaluationResult

// Improvement types (from lib/schemas/improvement)
ChangeLog, StoryImprovementRequest, StoryImprovementResult

// Validation types (from lib/schemas/validation)
FullValidationResult, ValidationError, ValidationRequest, ValidationResult
ValidationStats, ValidationWarning

// Reading history types (from reading-history.ts)
HistoryItem, ReadingFormat, ReadingHistoryRecord, StorageData
```

#### `/src/types/reading-history.ts` (67 lines)
**Purpose**: Track user reading progress  
**Contains**:
- `ReadingFormat` type (novel | comic)
- `HistoryItem` - Individual session records
- `StorageData` - Client-side localStorage format
- `ReadingHistoryRecord` - Server-side database format
- `AddToHistoryOptions` - Progress tracking parameters

#### `/src/types/next-auth.d.ts` (Not examined)
**Purpose**: NextAuth.js type augmentation  
**Contains**: User session extensions

---

### 2. API LAYER TYPES - `/src/app/api/*/`

#### `/src/app/api/studio/types.ts` (404 lines)
**Purpose**: HTTP API contracts for Studio generation endpoints  
**Architecture Layer**: API (HTTP boundary)  

**Contains**:
- **Story Generation**: `ApiStoryRequest`, `ApiStoryResponse`, `ApiStoryErrorResponse`
- **Character Generation**: `ApiCharactersRequest`, `ApiCharactersResponse`, etc.
- **Settings Generation**: `ApiSettingsRequest`, `ApiSettingsResponse`, etc.
- **Parts Generation**: `ApiPartsRequest/Response`, `ApiPartRequest/Response` (singular for incremental)
- **Chapters Generation**: `ApiChaptersRequest/Response`, `ApiChapterRequest/Response` (singular)
- **Scene Summaries**: `ApiSceneSummariesRequest/Response`, `ApiSceneSummaryRequest/Response` (singular)
- **Scene Content**: `ApiSceneContentRequest/Response`
- **Scene Improvement**: `ApiSceneImprovementRequest/Response`
- **Validation Schemas** (Zod):
  - `generateStorySchema`
  - `generateCharactersSchema`
  - `generateSettingsSchema`
  - `generatePartsSchema`
  - `generateChaptersSchema`
  - `generateSceneSummariesSchema`
  - `generateSceneContentSchema`
  - `improveSceneSchema`

**Naming Convention**: `Api{Entity}{Suffix}` + Zod schemas

**SSOT Flow**: 
```
AiStoryZodSchema (Zod - SSOT) 
  → AiStoryType (TypeScript) 
    → ApiStoryResponse (API layer)
```

---

#### `/src/app/api/evaluation/types.ts` (476 lines)
**Purpose**: HTTP API contracts for evaluation endpoints  
**Architecture Layer**: API (HTTP boundary)  

**CRITICAL ISSUE**: This file contains extensive evaluation type definitions that **DUPLICATE** those in `/src/lib/schemas/evaluation/`

**Contains**:
- **Core Types**: `EvaluationMode`, `MetricMethod`, `MetricSeverity`
- **Base Interfaces**: `BaseEvaluationRequest`, `BaseEvaluationResponse`
- **Metric Result**: `MetricResult`
- **Evaluation History**: `EvaluationHistory`
- **Story Evaluation**: `StoryEvaluationRequest/Response`
- **Character Evaluation**: `CharacterEvaluationRequest/Result/Response`
- **Setting Evaluation**: `SettingEvaluationRequest/Result/Response`
- **Part Evaluation**: `PartEvaluationRequest/Response`
- **Chapter Evaluation**: `ChapterEvaluationRequest/Response`
- **Scene Evaluation**: `SceneSummaryEvaluationRequest/Response`, `SceneContentEvaluationRequest/Response`
- **Batch Evaluation**: `BatchEvaluationRequest/Response`
- **Story Pipeline**: `StoryPipelineEvaluationRequest/Response`
- **Core Principles**: `CorePrincipleRequest/Response`, `AllCorePrinciplesResponse`
- **Reports**: `StoryReportRequest`, `ExecutiveSummary`, `FullStoryReport`
- **Comparison**: `ComparisonRequest/Response`, `StoryComparison`
- **Error Types**: `EvaluationError`, error code constants

**Naming Convention**: `{Entity}EvaluationRequest/Response` pattern

---

### 3. SERVICE LAYER TYPES - `/src/lib/studio/generators/`

#### `/src/lib/studio/generators/types.ts` (495 lines)
**Purpose**: Internal function parameters and results for story generation  
**Architecture Layer**: Service (Business Logic)  

**Contains**:

**AI Provider Types**:
- `ModelProvider` (gemini | ai-server)
- `PromptType` (story | character | setting | part | chapter | scene_summary | scene_content)
- `PromptTemplate` (system + userTemplate)
- `ResponseFormat` (text | json)
- `ResponseSchema` (Zod schema or JSON schema)

**Text Generation**:
- `TextGenerationRequest` (prompt, systemPrompt, model options, structured output)
- `TextGenerationResponse` (text, model, tokensUsed, finishReason)
- `GenerationOptions` (temperature, maxTokens, topP, etc.)

**Story Cycle Types**:
- `VirtueType` (courage | compassion | integrity | loyalty | wisdom | sacrifice)
- `ArcPosition` (ChapterArcPosition)
- `CyclePhase` (Adversity-Triumph cycle phases)

**Base Interfaces**:
- `GeneratorMetadata` (generationTime, model)
- `ArrayGeneratorMetadata` (totalGenerated, generationTime)
- `GeneratorResult<T>` (data, metadata)
- `ProgressCallback` type

**Entity-Specific Generators**:
- **Story**: `GeneratorStoryParams`, `GeneratorStoryResult`, `StoryPromptParams`
- **Characters**: `GeneratorCharactersParams`, `GeneratorCharactersResult`, `CharacterPromptParams`
- **Settings**: `GeneratorSettingsParams`, `GeneratorSettingsResult`, `SettingPromptParams`
- **Parts**: `GeneratorPartsParams`, `GeneratorPartsResult`, `PartPromptParams`
  - Plus singular `GeneratorPartParams/Result` (for incremental generation)
- **Chapters**: `GeneratorChaptersParams`, `GeneratorChaptersResult`, `ChapterPromptParams`
  - Plus singular `GeneratorChapterParams/Result`
- **Scene Summaries**: `GeneratorSceneSummariesParams`, `GeneratorSceneSummariesResult`, `SceneSummaryPromptParams`
  - Plus singular `GeneratorSceneSummaryParams/Result`
- **Scene Content**: `GeneratorSceneContentParams`, `GeneratorSceneContentResult`, `SceneContentPromptParams`
- **Scene Improvement**: `GeneratorSceneImprovementParams`, `GeneratorSceneImprovementResult`
- **Images**: `GeneratorImagesParams`, `GeneratorImagesResult`

**Naming Convention**: `Generator{Entity}{Params|Result}` + `{Entity}PromptParams`

---

### 4. DOMAIN/AI TYPES

#### `/src/lib/ai/types/image.ts` (68 lines)
**Purpose**: Provider-agnostic AI image generation types  
**Architecture Layer**: Domain (Core AI Concepts)  

**Contains**:
- `ImageProvider` (gemini | ai-server)
- `AspectRatio` (1:1 | 16:9 | 9:16 | 2:3)
- `ImageGenerationRequest` (prompt, aspectRatio, seed)
- `ImageGenerationResponse` (imageUrl, model, width, height, seed, provider)
- `ImageDimensions` (width, height)

**Naming Convention**: Domain-focused (no "Request"/"Response" suffixes, just core types)

---

### 5. VALIDATION & QUALITY SCHEMAS - `/src/lib/schemas/`

#### **Evaluation Schemas** (101 lines total)

**Index**: `/src/lib/schemas/evaluation/index.ts`
```typescript
export * from "./metrics";
export * from "./requests";
export * from "./results";
export * from "./story-evaluation";
```

**metrics.ts** (96 lines) - Quality scoring framework
```typescript
// Zod schemas for evaluation metrics (Architectonics of Engagement)
// Scoring: 1 (Nascent) → 2 (Developing) → 3 (Effective/PASSING) → 4 (Exemplary)
```

**results.ts** (72 lines) - Evaluation result structures
```typescript
analysisPointSchema        // Single analysis point with evidence
categoryAnalysisSchema     // Strengths and improvements per category
actionableFeedbackSchema   // Diagnosis + suggestion pattern
evaluationSummarySchema    // High-level evaluation summary
evaluationResultSchema     // Complete evaluation result
EvaluationResult type      // TypeScript type inferred from Zod
```

**requests.ts** (38 lines) - Evaluation request parameters

**story-evaluation.ts** (101 lines) - Story-specific evaluation

---

#### **Improvement Schemas** (34 lines total)

**Index**: `/src/lib/schemas/improvement/index.ts`
**Files**:
- `change-log.ts` (10 lines) - Change tracking
- `requests.ts` (34 lines) - Improvement request parameters
- `results.ts` (30 lines) - Improvement result structures

---

#### **Validation Schemas** (32 lines total)

**Index**: `/src/lib/schemas/validation/index.ts`
**Files**:
- `full-validation.ts` (16 lines) - Complete validation
- `requests.ts` (16 lines) - Validation request parameters
- `results.ts` (32 lines) - Validation result structures

---

#### **Nested Zod Schemas** (133 lines total)

**Purpose**: Reusable Zod schemas for nested JSON objects  
**Contains**:
- `personality.ts` (23 lines) - Character personality
- `physical-description.ts` (33 lines) - Character appearance
- `voice-style.ts` (33 lines) - Character voice patterns
- `setting-elements.ts` (133 lines) - Setting sensory and symbolic details
- `index.ts` (32 lines) - Exports

**Key Exports**:
```typescript
adversityElementsSchema    // Adversity type + description
consequenceElementsSchema  // Consequence structure
personalitySchema          // Character personality traits
physicalDescriptionSchema  // Character appearance details
sensorySchema              // Sensory perception data
virtueElementsSchema       // Virtue descriptions
voiceStyleSchema           // Character voice characteristics
```

---

#### **AI Schemas** (674 lines)

**Purpose**: Derived from generated-zod with AI-specific metadata  
**SSOT Flow**: Generated Validators → .pick() → .extend() with AI descriptions

**Contains**:
- `AiStoryZodSchema` + `AiStoryType` - AI-generated story fields
- `AiCharacterZodSchema` + `AiCharacterType` - AI character generation
- `AiSettingZodSchema` + `AiSettingType` - AI setting generation
- `AiPartZodSchema` + `AiPartType` - AI part generation
- `AiChapterZodSchema` + `AiChapterType` - AI chapter generation
- `AiSceneSummaryZodSchema` + `AiSceneSummaryType` - AI scene summary
- `AiSceneContentZodSchema` + `AiSceneContentType` - AI scene content

---

#### **Generated Zod Schemas** (376 lines)

**Purpose**: Auto-generated from Drizzle schema using `createInsertSchema()` and `createSelectSchema()`

**Contains**:
- Story schemas (insert/select)
- Character schemas (insert/select)
- Setting schemas (insert/select)
- Part schemas (insert/select)
- Chapter schemas (insert/select)
- Scene schemas (insert/select)

**Naming**: `insertXSchema`, `selectXSchema`, `X` type, `InsertX` type

---

#### **Drizzle Schema** (1,843 lines)

**Purpose**: Database table definitions (Drizzle ORM)  
**Single Source of Truth** for database structure

**Contains**:
- PostgreSQL enum definitions (adversityType, genre, tone, arcPosition, etc.)
- Table definitions:
  - stories
  - characters
  - settings
  - parts
  - chapters
  - scenes
  - communityPosts
  - events
  - insights
  - And many more...

---

## Type Duplication Analysis

### CRITICAL ISSUE: Evaluation Types Duplication

**Location 1**: `/src/app/api/evaluation/types.ts` (476 lines)
- Contains complete evaluation API type definitions
- Covers: requests, responses, metrics, results, comparisons, reports, error types
- Appears to be the primary/original definition

**Location 2**: `/src/lib/schemas/evaluation/` (101 lines across files)
- Contains Zod validation schemas for evaluation
- Covers: metrics, requests, results, story-specific evaluation
- More focused on validation than API contracts

**Location 3**: `/src/types/index.ts`
- Re-exports evaluation types from `/src/lib/schemas/evaluation/`
- Also references legacy `validation-evaluation.ts` that wasn't found

### Problem:
1. **Dual SSOT**: Evaluation types appear to be defined in TWO places
2. **Incomplete overlap**: API types and schema types don't fully align
3. **Re-export complexity**: Multiple re-export paths cause confusion

### Recommended Solution:
Consolidate evaluation types following the established pattern:
```
Evaluation Zod Schemas (validation SSOT)
  ↓
Evaluation TypeScript Types (derived from Zod)
  ↓
API Layer Interfaces (map to HTTP contracts)
```

---

## Type Organization by Architectural Layer

### API Layer (HTTP Contracts)
**Location**: `src/app/api/*/types.ts`  
**Files**:
- `src/app/api/studio/types.ts` (404 lines) - Story generation APIs
- `src/app/api/evaluation/types.ts` (476 lines) - Evaluation APIs

**Naming**: `Api{Entity}Request/Response/ErrorResponse`

**Purpose**: Define public HTTP API contracts
- Request body validation schemas
- Response format specifications
- Error response structures

---

### Service Layer (Business Logic)
**Location**: `src/lib/studio/generators/types.ts`  
**Files**:
- `src/lib/studio/generators/types.ts` (495 lines)

**Naming**: `Generator{Entity}Params/Result`

**Purpose**: Internal function contracts between routes and business logic
- Function parameter types
- Function result types
- Metadata structures
- Prompt parameter types

---

### Domain Layer (Core Concepts)
**Location**: `src/lib/ai/types/*`, `src/lib/schemas/*`  
**Files**:
- `src/lib/ai/types/image.ts` (68 lines) - Image generation domain
- `src/lib/schemas/` (3,600+ lines) - Validation schemas and data models

**Naming**: Core domain concepts without layer suffixes

**Purpose**: 
- Define provider-agnostic abstractions
- Validate data structure using Zod
- Generate TypeScript types from schemas

---

### Shared Layer (Cross-Cutting)
**Location**: `src/types/`  
**Files**:
- `src/types/index.ts` (154 lines)
- `src/types/reading-history.ts` (67 lines)

**Purpose**: Global types used across multiple layers
- Cross-application concerns
- Re-exports from other layers
- Architecture documentation

---

## SSOT (Single Source of Truth) Analysis

### Database Layer SSOT
```
src/lib/schemas/drizzle/index.ts (1,843 lines)
↓ (createInsertSchema/createSelectSchema)
src/lib/schemas/generated-zod/index.ts (376 lines)
↓ (.pick() + .extend())
src/lib/schemas/ai/index.ts (674 lines)
↓ (inferred types)
TypeScript usage in services/routes
```

### Validation Layer SSOT
```
src/lib/schemas/evaluation/metrics.ts
src/lib/schemas/validation/*.ts
↓ (inferred types)
src/lib/schemas/evaluation/results.ts
↓ (re-exported)
src/types/index.ts
```

### API Layer SSOT
```
src/app/api/studio/types.ts (contains both types AND schemas)
src/app/api/evaluation/types.ts (contains both types AND schemas)
```

### Problem:
- API layer contains BOTH types AND Zod schemas
- No clear separation between definition and validation
- Mixed naming conventions within files

---

## File Count and Size Summary

| Category | Location | Lines | Files | Purpose |
|----------|----------|-------|-------|---------|
| **Global Types** | `src/types/` | 221 | 3 | Cross-layer shared types |
| **API Layer** | `src/app/api/*/` | 880 | 2 | HTTP contracts + validation |
| **Service Layer** | `src/lib/studio/generators/` | 495 | 1 | Business logic contracts |
| **Domain Types** | `src/lib/ai/types/` | 68 | 1 | Core AI concepts |
| **Validation Schemas** | `src/lib/schemas/evaluation/` | 101 | 4 | Quality evaluation |
| **Improvement Schemas** | `src/lib/schemas/improvement/` | 74 | 3 | Story improvement |
| **Validation Schemas** | `src/lib/schemas/validation/` | 64 | 3 | Data validation |
| **Nested Zod** | `src/lib/schemas/nested-zod/` | 133 | 5 | Reusable components |
| **AI Schemas** | `src/lib/schemas/ai/` | 674 | 1 | AI-specific validation |
| **Generated Zod** | `src/lib/schemas/generated-zod/` | 376 | 1 | Auto-generated validators |
| **Database Schema** | `src/lib/schemas/drizzle/` | 1,843 | 1 | DB definitions (SSOT) |
| **TOTAL** | | **4,929** | **25** | |

---

## Key Findings & Recommendations

### Finding 1: Evaluation Types Duplication
**Issue**: Evaluation type definitions exist in two places with partial overlap
- `/src/app/api/evaluation/types.ts` (476 lines) - API contracts
- `/src/lib/schemas/evaluation/` (101 lines) - Validation schemas
- `/src/types/` partially re-exports evaluation types

**Impact**: Difficult to maintain consistency, unclear which is the source of truth

**Recommendation**: 
1. Move all evaluation Zod validation to `/src/lib/schemas/evaluation/`
2. Generate TypeScript types from Zod schemas (`.infer<typeof schema>`)
3. Keep API types in `/src/app/api/evaluation/types.ts` that reference the schema types
4. Update `/src/types/index.ts` to re-export from the authoritative location

---

### Finding 2: API Layer Contains Both Types and Schemas
**Issue**: API type files contain both TypeScript interfaces AND Zod validation schemas

Examples:
- `/src/app/api/studio/types.ts` has 8 Zod schemas
- `/src/app/api/evaluation/types.ts` has error code constants

**Problem**: Violates separation of concerns - schemas should live in `/src/lib/schemas/`

**Recommendation**:
1. Move Zod schemas to `/src/lib/schemas/studio/`
2. Keep only TypeScript types and type exports in API files
3. Import validation schemas from schemas directory
4. Follow the pattern: Zod (SSOT) → Types (derived) → API routes (use both)

---

### Finding 3: Inconsistent Naming Conventions
**Issue**: Different files use different naming patterns

| Layer | Pattern | Example |
|-------|---------|---------|
| API | `Api{Entity}{Suffix}` | `ApiStoryRequest` |
| Service | `Generator{Entity}{Params\|Result}` | `GeneratorStoryParams` |
| Domain | `{Entity}` (bare) | `ImageProvider` |
| Schemas | `insert{Entity}Schema` | `insertStorySchema` |
| Nested | `{component}Schema` | `personalitySchema` |

**Recommendation**: Standardize naming in API layer:
- Use `Api{Entity}Request` instead of `{Entity}Request`
- Use `Api{Entity}Response` instead of `{Entity}Response`
- Reserve "Generator" prefix for service layer only

---

### Finding 4: Missing Documentation of Type Usage
**Issue**: Type re-exports in `/src/types/index.ts` include excellent documentation, but:
1. Not all type files have layer information
2. Cross-file dependencies aren't documented
3. SSOT relationships aren't clear

**Recommendation**:
Add structured documentation headers to ALL type files:
```typescript
/**
 * {Feature} {Layer} Types
 *
 * Layer: {API|Service|Domain|Shared}
 * Used by: {consumer paths}
 * Related: {related type files}
 * SSOT: {if applicable}
 */
```

---

### Finding 5: Validation Schemas Not Used in API Routes
**Issue**: 
- Zod schemas exist in `/src/lib/schemas/evaluation/`
- Zod schemas also defined in `/src/app/api/studio/types.ts`
- Unknown if evaluation schemas are actually used by evaluation API routes

**Recommendation**: 
1. Audit which Zod schemas are actually used by API routes
2. Move all validation schemas to centralized `/src/lib/schemas/` locations
3. Update API routes to import schemas from there
4. Remove duplicate schema definitions

---

### Finding 6: Generator Types Are Incomplete
**Issue**: Service layer types in `/src/lib/studio/generators/types.ts` include:
- Text generation types
- AI provider abstractions
- Prompt parameter types

But corresponding **request/response mapping** to API types is not documented

**Recommendation**:
1. Add mapping documentation: API types → Generator types
2. Document the transformation layer (which files do the mapping)
3. Create example mappings for each entity type (story, character, etc.)

---

## Suggested Unified Structure

### Proposed Organization

```
src/lib/schemas/
├── index.ts                    # Central SSOT documentation
├── drizzle/                    # Database definitions (SSOT)
│   └── index.ts               # Table definitions + enums
├── generated-zod/             # Auto-generated (do not edit)
│   └── index.ts               # Zod validators from drizzle
├── ai/                        # AI-specific schemas
│   └── index.ts               # Story, Character, Setting, Part, Chapter, Scene
├── evaluation/                # Quality evaluation (CONSOLIDATE HERE)
│   ├── metrics.ts            # Evaluation scoring framework
│   ├── results.ts            # Evaluation result structures
│   ├── requests.ts           # Evaluation request parameters
│   └── index.ts              # Exports
├── validation/               # Data validation
│   ├── results.ts           # Validation results
│   ├── requests.ts          # Validation requests
│   └── index.ts             # Exports
├── improvement/             # Story improvement
│   ├── results.ts          # Improvement results
│   ├── requests.ts         # Improvement requests
│   └── index.ts            # Exports
└── nested-zod/             # Reusable nested components
    ├── personality.ts
    ├── physical-description.ts
    ├── voice-style.ts
    ├── setting-elements.ts
    └── index.ts            # Exports all

src/types/
├── index.ts               # Type organization index + re-exports
├── reading-history.ts    # Cross-app reading tracking
└── next-auth.d.ts       # NextAuth augmentation

src/app/api/
├── studio/
│   └── types.ts          # ONLY TypeScript API types, NO Zod schemas
│       ├── Story types
│       ├── Character types
│       ├── Settings types
│       ├── Parts types
│       ├── Chapters types
│       ├── Scene types
│       └── Images types
├── evaluation/
│   └── types.ts          # ONLY TypeScript API types, NO Zod schemas
│       ├── Story evaluation types
│       ├── Character evaluation types
│       ├── etc.
│       └── Re-import from src/lib/schemas/evaluation/
└── [other routes]

src/lib/studio/generators/
└── types.ts              # Service layer (Generator* types)
    ├── ModelProvider types
    ├── TextGeneration types
    ├── Generator* Params/Result types
    └── PromptParams types
```

---

## Implementation Priority

1. **High Priority** (Address duplication):
   - Consolidate evaluation types (API + schemas)
   - Move Zod schemas from API files to `src/lib/schemas/`
   - Add SSOT documentation headers

2. **Medium Priority** (Consistency):
   - Standardize naming conventions across layers
   - Document type mappings between layers
   - Update type re-exports in `src/types/`

3. **Low Priority** (Documentation):
   - Add layer information to all type files
   - Create type relationship diagram
   - Document SSOT flow visually

---

## Conclusion

The codebase has a **well-intentioned layered architecture** but suffers from:

1. **Type Duplication** - Evaluation types defined in multiple places
2. **Zod/Type Separation** - Validation schemas mixed into API type files
3. **Naming Inconsistency** - Different patterns across layers
4. **Documentation Gaps** - SSOT relationships not clearly marked

**Total Type Definition Size**: 4,929 lines across 25 files

**Recommendation**: Implement the suggested unified structure while maintaining the clean architectural separation between API, Service, Domain, and Shared layers.
