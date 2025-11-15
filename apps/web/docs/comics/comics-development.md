# Comics Development Guide: API & Implementation

## Overview

This document provides comprehensive implementation specifications for the comics generation system, including API endpoints, toonplay conversion logic, and code architecture.

**Related Documents:**
- 📖 **Specification** (`comics-specification.md`): Core concepts, data model, and architecture
- 🧪 **Evaluation Guide** (`comics-evaluation.md`): Quality metrics, testing strategies, and validation

---

## Part I: Code Architecture

### 1.1 Architectural Layers

The comics generation system follows a **strict layered architecture** separating concerns into four distinct layers:

**Layer 1: API Layer** (`src/app/api/`)
- **Purpose**: HTTP endpoint handling, request validation, response formatting
- **Database Operations**: Read/write allowed
- **Responsibilities**: Authentication, authorization, SSE streaming, error responses
- **Type Convention**: `Api{Entity}Request`, `Api{Entity}Response`, `Api{Entity}ErrorResponse`

**Layer 2: Service Layer** (`src/lib/studio/services/`)
- **Purpose**: Orchestration of generation + persistence workflows
- **Database Operations**: Write allowed (combines generator output + database save)
- **Key Pattern**: `generateAndSave()` methods combining generator calls with database operations
- **Responsibilities**: Transaction management, data transformation, business logic coordination
- **Type Convention**: `Service{Entity}Params`, `Service{Entity}Result`

**Layer 3: Generator Layer** (`src/lib/studio/generators/`)
- **Purpose**: Pure generation logic for AI-powered content creation
- **Database Operations**: ❌ **NONE** - Generators do NOT read or write to database
- **Responsibilities**: AI client calls, prompt assembly, structured output validation
- **Key Principle**: **Pure functions** - same input always produces same output (excluding AI randomness)
- **Type Convention**: `Generator{Entity}Params`, `Generator{Entity}Result`

**Layer 4: AI Layer** (`src/lib/schemas/ai/`)
- **Purpose**: Structured output schemas for AI model validation
- **Source**: Defines Zod schemas for AI-generated data
- **Responsibilities**: Type safety, JSON schema generation, data validation
- **Type Convention**: `Ai{Entity}ZodSchema`, `Ai{Entity}Type`, `Ai{Entity}JsonSchema`

### 1.2 Directory Structure

```
src/
├── lib/
│   ├── studio/
│   │   ├── generators/                    # LAYER 3: Pure generation logic
│   │   │   ├── toonplay-converter.ts      # Phase 1: Prose → Toonplay (NO DB)
│   │   │   ├── comic-panel-generator.ts   # Phase 2: Toonplay → Images (NO DB)
│   │   │   ├── ai-client.ts              # Text generation client
│   │   │   ├── prompt-manager.ts         # System/user prompt management
│   │   │   └── types.ts                  # Generator type definitions
│   │   └── services/
│   │       └── comic-service.ts           # LAYER 2: Orchestration (future)
│   ├── schemas/
│   │   ├── nested-zod/                    # Hand-written Zod SSOT for nested JSON
│   │   ├── database/                      # Hand-written Drizzle SSOT for tables
│   │   │   └── index.ts                  # Comic panels table schema
│   │   ├── generated-zod/                 # Auto-generated Zod from Drizzle
│   │   │   └── index.ts                  # Generated validators
│   │   └── ai/                            # LAYER 4: AI-specific schemas (derived)
│   │       └── ai-toonplay.ts            # Toonplay Zod schemas for AI structured output
│   ├── db/
│   │   └── comic-queries.ts              # Comic-specific database queries
│   └── services/
│       ├── image-generation.ts            # Gemini 2.5 Flash Image wrapper
│       ├── image-optimization.ts          # 4-variant optimization
│       └── comic-layout.ts                # Panel spacing calculations
├── app/
│   └── api/
│       └── studio/
│           └── scenes/
│               └── [id]/
│                   └── comic/
│                       ├── generate/route.ts   # LAYER 1: POST Generate panels
│                       ├── publish/route.ts    # LAYER 1: POST Publish comic
│                       └── unpublish/route.ts  # LAYER 1: POST Unpublish comic
└── components/
    └── comic/
        ├── comic-viewer.tsx                    # Panel display component
        ├── comic-panel-generator-button.tsx    # Studio UI trigger
        └── comic-status-card.tsx               # Publishing status UI
```

### 1.3 Schema Architecture

**Schema Organization** follows the centralized schema pattern:

**nested-zod/** (Hand-written SSOT for nested JSON)
- **Purpose**: Define complex nested JSON structures using Zod
- **Examples**: `ai-toonplay.ts` (toonplay structure), panel specifications
- **Usage**: AI structured output validation, API request/response validation
- **SSOT**: Manually maintained schemas for non-database data structures

**database/** (Hand-written SSOT for database tables)
- **Purpose**: Define database tables using Drizzle ORM
- **File**: `src/lib/schemas/database/index.ts`
- **Examples**: `scenes`, `comicPanels`, `stories` tables
- **SSOT**: Single source of truth for all database schema definitions
- **Generated Output**: `drizzle/schema.ts` (auto-generated by Drizzle Kit - DO NOT EDIT)

**generated-zod/** (Auto-generated Zod from Drizzle)
- **Purpose**: Zod validators auto-generated from Drizzle schemas using drizzle-zod
- **Source**: Generated from `src/lib/schemas/database/index.ts`
- **Usage**: Database insert/update validation, API request validation
- **Generation**: Run `pnpm db:generate` to regenerate
- **DO NOT EDIT**: Always regenerate from source schema

**ai/** (AI-specific schemas derived from nested-zod)
- **Purpose**: Schemas specifically for AI structured output validation
- **Source**: Derived from or references `nested-zod/` schemas
- **Examples**: `ai-toonplay.ts` uses toonplay schema from `nested-zod/`
- **Usage**: AI model structured output, JSON schema generation for AI calls

### 1.4 Type Naming Convention

**Layer-Based Pattern**: `{Layer}{Entity}{Suffix}`

| Layer | Prefix | Request/Params | Response/Result | Schema | Type | Error |
|-------|--------|----------------|-----------------|--------|------|-------|
| **API Layer** | `Api` | `Request` | `Response` | - | - | `ErrorResponse` |
| **Service Layer** | `Service` | `Params` | `Result` | - | - | - |
| **Generator Layer** | `Generator` | `Params` | `Result` | - | - | - |
| **AI Layer** | `Ai` | - | - | `ZodSchema` | `Type` | - |

**Examples:**

```typescript
// ============================================================================
// API Layer (HTTP endpoints)
// ============================================================================

// Request body types
type ApiComicGenerateRequest = {
  targetPanelCount?: number;
  regenerate?: boolean;
};

// Response body types
type ApiComicGenerateResponse = {
  success: boolean;
  message: string;
  scene: {
    id: string;
    comicStatus: "draft" | "published";
    comicPanelCount: number;
  };
  result: {
    toonplay: AiComicToonplayType;
    panels: ComicPanel[];
  };
};

// Error response types
type ApiComicGenerateErrorResponse = {
  error: string;
  message?: string;
};

// ============================================================================
// Service Layer (orchestration + persistence)
// ============================================================================

// Service function parameters
type ServiceToonplayParams = {
  sceneId: string;
  targetPanelCount?: number;
  regenerate?: boolean;
};

// Service function results
type ServiceToonplayResult = {
  toonplay: AiComicToonplayType;
  panels: ComicPanel[];
  evaluation: AiToonplayEvaluationType;
  metadata: {
    generationTime: number;
    savedToDatabase: boolean;
  };
};

// ============================================================================
// Generator Layer (pure generation - NO DATABASE)
// ============================================================================

// Generator function parameters
type GeneratorToonplayParams = {
  scene: Scene;
  story: Story;
  characters: Character[];
  settings: Setting[];
  language?: string;
};

// Generator function results
type GeneratorToonplayResult = {
  toonplay: AiComicToonplayType;
  metadata: {
    generationTime: number;
    panelCount: number;
    language: string;
  };
};

// Generator for panel images
type GeneratorPanelImageParams = {
  panel: AiComicPanelSpecType;
  characters: Character[];
  settings: Setting[];
  storyGenre: string;
};

type GeneratorPanelImageResult = {
  imageUrl: string;
  imageVariants: ImageVariantSet;
  metadata: {
    generationTime: number;
    prompt: string;
  };
};

// ============================================================================
// AI Layer (structured output schemas)
// ============================================================================

// Zod schema definitions (SSOT)
const AiComicToonplayZodSchema = z.object({
  scene_id: z.string(),
  scene_title: z.string(),
  total_panels: z.number(),
  panels: z.array(AiComicPanelSpecZodSchema),
});

// TypeScript types derived from Zod
type AiComicToonplayType = z.infer<typeof AiComicToonplayZodSchema>;
type AiComicPanelSpecType = z.infer<typeof AiComicPanelSpecZodSchema>;

// JSON Schema for AI structured output (generated from Zod)
const AiComicToonplayJsonSchema = zodToJsonSchema(AiComicToonplayZodSchema);
```

---

## Part II: API Endpoints

### 2.1 Generate Comic Panels

**Endpoint**: `POST /api/studio/scenes/[id]/comic/generate`

**Purpose**: Generate comic panels from scene narrative (two-phase process)

**Authentication**: NextAuth.js session (story owner, manager, or admin)

**Request Body**:
```typescript
{
  targetPanelCount?: number;  // Optional: 8-12 (default: 10)
  regenerate?: boolean;       // Optional: overwrite existing panels
}
```

**Response Formats**:

1. **Server-Sent Events (SSE)** - For progress updates
   - Header: `Accept: text/event-stream`
   - Events: `start`, `progress`, `complete`, `error`

2. **JSON** - For completion only
   - Returns final result after all panels generated

**SSE Event Types**:

```typescript
// Event: start
{
  message: "Generating comic panels for scene: {title}",
  sceneId: string,
  sceneTitle: string
}

// Event: progress
{
  current: number,     // Current progress value
  total: number,       // Total progress value (100)
  status: string,      // Human-readable status message
  percentage: number   // Calculated percentage (0-100)
}

// Event: complete
{
  success: true,
  message: "Comic panels generated successfully",
  scene: {
    id: string,
    title: string,
    comicStatus: "draft",
    comicPanelCount: number,
    comicGeneratedAt: string,
    comicVersion: number
  },
  result: {
    toonplay: AiComicToonplayType,
    panels: ComicPanel[],
    evaluation: AiToonplayEvaluationType, // Quality assessment
    metadata: {
      generationTime: number,
      toonplayTime: number,
      panelGenerationTime: number
    }
  }
}

// Event: error
{
  error: "Internal server error",
  message: string
}
```

**Example Request (cURL with SSE)**:
```bash
curl -X POST http://localhost:3000/api/studio/scenes/scene_abc123/comic/generate \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "targetPanelCount": 10,
    "regenerate": false
  }'
```

**Example Request (Fetch API with SSE)**:
```typescript
const eventSource = new EventSource(
  '/api/studio/scenes/scene_abc123/comic/generate',
  {
    headers: {
      'Content-Type': 'application/json',
    },
  }
);

eventSource.addEventListener('start', (e) => {
  const data = JSON.parse(e.data);
  console.log('Started:', data.message);
});

eventSource.addEventListener('progress', (e) => {
  const data = JSON.parse(e.data);
  console.log(`Progress: ${data.percentage}% - ${data.status}`);
});

eventSource.addEventListener('complete', (e) => {
  const data = JSON.parse(e.data);
  console.log('Completed:', data.result);
  eventSource.close();
});

eventSource.addEventListener('error', (e) => {
  const data = JSON.parse(e.data);
  console.error('Error:', data.message);
  eventSource.close();
});
```

**Process Flow**:

```
1. Validate request & authentication
   ├─> Check session (story owner/manager/admin)
   ├─> Validate targetPanelCount (8-12)
   └─> Check existing panels (if !regenerate)

2. Fetch context data
   ├─> Scene with chapter & story
   ├─> Story characters
   ├─> Story settings
   └─> Primary setting selection

3. Phase 1: Toonplay Conversion
   ├─> Call toonplay-converter.ts
   ├─> Convert prose to structured panel specs
   ├─> Generate AiComicToonplayType
   └─> Progress: 0-20%

4. Phase 2: Panel Image Generation
   ├─> For each panel specification:
   │   ├─> Build image prompt
   │   ├─> Generate image (Gemini 2.5 Flash)
   │   ├─> Create 4 optimized variants
   │   ├─> Upload to Vercel Blob
   │   └─> Save to comic_panels table
   └─> Progress: 20-90%

5. Phase 3: Quality Evaluation
   ├─> Evaluate toonplay quality
   ├─> Calculate weighted score
   ├─> Identify improvement areas
   └─> Progress: 90-100%

6. Update scene metadata
   ├─> comicStatus = 'draft'
   ├─> comicGeneratedAt = now
   ├─> comicPanelCount = panels.length
   └─> comicVersion = version + 1

7. Return result
   └─> SSE complete event OR JSON response
```

**Error Responses**:

```typescript
// 401 Unauthorized
{ error: "Unauthorized" }

// 403 Access Denied
{ error: "Access denied" }

// 404 Scene Not Found
{ error: "Scene not found" }

// 400 Bad Request
{
  error: "targetPanelCount must be between 1 and 12 (recommended: 8-12 for optimal pacing)"
}

// 409 Conflict (panels already exist)
{
  error: "Panels already exist for this scene. Set regenerate=true to overwrite."
}

// 500 Internal Server Error
{
  error: "Internal server error",
  message: "Error details..."
}
```

### 2.2 Publish Comic

**Endpoint**: `POST /api/studio/scenes/[id]/comic/publish`

**Purpose**: Make comic panels publicly visible at `/comics/{storyId}`

**Authentication**: NextAuth.js session (story owner, manager, or admin)

**Validation**:
- Verifies comic panels exist (`comicStatus !== 'none'`)
- Checks scene ownership
- Updates publishing metadata

**Request Body**: Empty `{}`

**Response**:
```typescript
{
  success: true,
  message: "Comic published successfully",
  scene: {
    id: string,
    title: string,
    comicStatus: "published",
    comicPublishedAt: string,
    comicPublishedBy: string,
    comicPanelCount: number
  }
}
```

**Database Updates**:
```typescript
{
  comicStatus: 'published',
  comicPublishedAt: new Date().toISOString(),
  comicPublishedBy: userId,
  updatedAt: new Date().toISOString()
}
```

### 2.3 Unpublish Comic

**Endpoint**: `POST /api/studio/scenes/[id]/comic/unpublish`

**Purpose**: Revert comic to draft status (hide from public)

**Authentication**: NextAuth.js session (story owner, manager, or admin)

**Request Body**: Empty `{}`

**Response**:
```typescript
{
  success: true,
  message: "Comic unpublished successfully",
  scene: {
    id: string,
    title: string,
    comicStatus: "draft",
    comicUnpublishedAt: string,
    comicUnpublishedBy: string
  }
}
```

**Database Updates**:
```typescript
{
  comicStatus: 'draft',
  comicUnpublishedAt: new Date().toISOString(),
  comicUnpublishedBy: userId,
  updatedAt: new Date().toISOString()
}
```

---

## Part III: Toonplay Conversion

### 3.1 Toonplay Converter Generator

**File**: `src/lib/studio/generators/toonplay-converter.ts`

**Purpose**: Convert narrative prose scenes into structured webtoon toonplay specifications

**Key Principle**: This generator does NOT save to database - it only generates and returns data.

**Function Signature**:
```typescript
export async function convertSceneToToonplay(
  params: GeneratorToonplayParams
): Promise<GeneratorToonplayResult>

// Parameters
interface GeneratorToonplayParams {
  scene: Scene;
  story: Story;
  characters: Character[];
  settings: Setting[];
  language?: string; // Default: "English"
}

// Result
interface GeneratorToonplayResult {
  toonplay: AiComicToonplayType;
  metadata: {
    generationTime: number;
    panelCount: number;
    language: string;
  };
}
```

### 3.2 Toonplay System Prompt

**Prompt Type**: `system` (provider-agnostic)

**Key Instructions**:

```
You are an expert webtoon adapter specializing in transforming literary prose
into visual comic toonplay scripts optimized for mobile vertical-scroll reading.

Your task: Convert the provided narrative scene into a structured toonplay with
8-12 sequential panels (TARGET: 10 panels for optimal pacing).

CRITICAL RULES:

1. PANEL COUNT (8-12 panels, TARGET: 10)
   - Quiet/dialogue scenes: 8-9 panels
   - Balanced narrative: 10 panels
   - Complex/action scenes: 11-12 panels

2. VISUAL STORYTELLING (Show, Don't Tell)
   - Primary focus: Visual action and dialogue
   - Narration: <5% of panels (use only for time/location markers)
   - Internal monologue: <10% of panels (strategic moments only)
   - Dialogue: ~70% of panels (main story driver)

3. SHOT TYPE VARIETY (for 10-panel scene)
   - 1 establishing_shot (scene opening)
   - 2-3 wide_shot (environment, multiple characters)
   - 3-4 medium_shot (main storytelling, conversations)
   - 2-3 close_up (emotional beats, reactions)
   - 0-1 extreme_close_up (climactic moments)
   - Vary shot types for visual interest

4. DIALOGUE CONSTRAINTS
   - Max 3 speech bubbles per panel
   - Max 150 characters per bubble
   - Concise, action-oriented dialogue
   - Avoid explaining what can be shown

5. CHARACTER CONSISTENCY
   - Use provided character descriptions EXACTLY
   - Maintain consistent visual appearance across panels
   - Reference character poses and expressions
   - Include character IDs for all dialogue

6. MOBILE-FIRST DESIGN
   - Optimize for vertical thumb-scroll reading
   - Each panel must work as standalone visual
   - Clear visual hierarchy in each frame

PROCESS:

1. Analyze narrative structure
   - Identify key story beats (setup, tension, climax, resolution)
   - Map emotional arc across panels
   - Determine optimal panel count (8-12)

2. Break into visual panels
   - ONE key action or dialogue exchange per panel
   - Vary shot types for visual rhythm
   - Ensure clear progression of events

3. Extract dialogue
   - Keep original character voice
   - Condense to max 150 characters per bubble
   - Remove exposition that can be shown visually

4. Specify visual grammar
   - Detailed descriptions for AI image generation
   - Character poses and expressions
   - Setting focus and lighting
   - Camera angle and mood

5. Add narration/internal monologue ONLY when necessary
   - Time/location transitions
   - Strategic internal thoughts that cannot be shown
   - Use sparingly (<5% narration, <10% internal monologue)

OUTPUT FORMAT:
Return structured toonplay following AiComicToonplayZodSchema:
- scene_id, scene_title, total_panels
- panels array (8-12 panel specifications)
- Each panel: panel_number, shot_type, description, characters_visible,
  character_poses, setting_focus, lighting, camera_angle, dialogue, sfx, mood
- Optional: narrative (use sparingly), pacing_notes, narrative_arc
```

### 3.3 Toonplay User Prompt Template

**Prompt Type**: `user` (filled with scene data)

```typescript
const userPrompt = `
SCENE CONTEXT:
Title: ${sceneTitle}
Genre: ${storyGenre}
Tone: ${storyTone}

CHARACTERS:
${characters}
// Example:
// - Emma Chen: 28 Asian-American detective, sharp observant eyes, practical professional attire
// - Marcus Kane: 35 African-American, tall athletic, commanding presence, tailored suits

SETTINGS:
${settings}
// Example:
// - Police Station: Fluorescent-lit bullpen, cluttered desks, whiteboard with case notes

NARRATIVE SCENE (PROSE):
${sceneContent}

---

INSTRUCTIONS:
Transform this narrative into a webtoon toonplay with 8-12 panels (TARGET: 10).

PRESERVE:
- Character relationships and dynamics
- Emotional beats and story arc
- Key dialogue moments
- Setting atmosphere

TRANSFORM:
- Prose narration → Visual panels
- Exposition → Dialogue + visual action
- Internal thoughts → Character expressions + strategic internal monologue (<10%)
- Descriptions → Detailed visual specifications

Remember:
- Each panel = ONE key visual moment
- Dialogue-driven (~70% of panels)
- Show, don't tell
- Mobile vertical-scroll optimized
`;
```

### 3.4 Toonplay Generation Code

**File**: `src/lib/studio/generators/toonplay-converter.ts`

**Core Logic**:

```typescript
export async function convertSceneToToonplay(
  params: GeneratorToonplayParams
): Promise<GeneratorToonplayResult> {
  const startTime = Date.now();

  // 1. Extract parameters
  const { scene, story, characters, settings, language = "English" } = params;

  // 2. Create text generation client
  const client = createTextGenerationClient();

  console.log(`[toonplay-converter] Converting scene: ${scene.title}`);

  // 3. Build character descriptions string
  const charactersStr = characters
    .map((c) => {
      const physDesc = c.physicalDescription;
      return `- ${c.name}: ${physDesc.age} ${physDesc.appearance}, ${physDesc.distinctiveFeatures}, ${physDesc.style}`;
    })
    .join("\n");

  // 4. Build settings descriptions string
  const settingsStr = settings
    .map((s) => `- ${s.name}: ${s.description}`)
    .join("\n");

  // 5. Build prompt parameters
  const promptParams: ToonplayPromptParams = {
    sceneContent: scene.content || "",
    sceneTitle: scene.title,
    sceneSummary: scene.summary || "",
    storyGenre: story.genre,
    storyTone: story.tone,
    characters: charactersStr,
    settings: settingsStr,
    language,
  };

  // 6. Get system and user prompts
  const { system: systemPrompt, user: userPromptText } =
    promptManager.getPrompt(
      client.getProviderType(),
      "toonplay",
      promptParams
    );

  console.log("[toonplay-converter] Generating toonplay using structured output");

  // 7. Generate toonplay using structured output (Zod schema)
  const toonplayData: AiComicToonplayType = await client.generateStructured(
    userPromptText,
    AiComicToonplayZodSchema,
    {
      systemPrompt,
      temperature: 0.7,  // Balance creativity with structure
      maxTokens: 16384,  // Large enough for 8-12 panels with full specs
    }
  );

  console.log(`[toonplay-converter] Generated ${toonplayData.total_panels} panels`);

  // 8. Calculate generation time
  const generationTime = Date.now() - startTime;

  // 9. Return result (caller handles database save)
  return {
    toonplay: toonplayData,
    metadata: {
      generationTime,
      panelCount: toonplayData.total_panels,
      language,
    },
  };
}
```

---

## Part IV: Panel Image Generation

### 4.1 Comic Panel Generator

**File**: `src/lib/studio/generators/comic-panel-generator.ts`

**Purpose**: Generate images for each toonplay panel specification

**Process**:

```
For each panel in toonplay:
1. Build detailed image prompt from panel spec
2. Generate image via Gemini 2.5 Flash (1344×768)
3. Create 4 optimized variants (AVIF/JPEG × 2 sizes)
4. Upload original and variants to Vercel Blob
5. Save panel record to database (comic_panels table)
```

### 4.2 Image Prompt Template

**Template Structure**:

```typescript
function buildPanelImagePrompt(panel: AiComicPanelSpecType, context: Context): string {
  return `
Professional ${genre} comic panel, ${panel.shot_type}, ${panel.camera_angle}.

SCENE: ${panel.setting_focus}. ${panel.lighting}.

CHARACTERS: ${buildCharacterDescriptions(panel.characters_visible, panel.character_poses)}

ACTION: ${panel.description}

MOOD: ${panel.mood}

Style: Clean comic linework, vibrant colors, semi-realistic proportions,
7:4 landscape format (1344×768), professional ${genre} comic art style.
NO text, NO speech bubbles, NO sound effects in the image.
`;
}
```

**Example Prompt**:

```
Professional thriller comic panel, medium_shot, eye level.

SCENE: Police station bullpen, harsh fluorescent lighting creating stark shadows.

CHARACTERS:
- Emma Chen (28, Asian-American detective, sharp observant eyes, practical blazer):
  Standing with arms crossed, leaning against desk, intense focused expression
- Marcus Kane (35, African-American, tall athletic, commanding presence):
  Seated at desk, reviewing case files, furrowed brow concentration

ACTION: Emma presents her theory about the case while Marcus reviews evidence.
The whiteboard behind them shows crime scene photos and suspect connections.

MOOD: Tense determination, investigative focus.

Style: Clean comic linework, vibrant colors, semi-realistic proportions,
7:4 landscape format (1344×768), professional thriller comic art style.
NO text, NO speech bubbles, NO sound effects in the image.
```

### 4.3 Image Generation & Optimization

**For complete image generation and optimization documentation, see:**

📖 **[Image System Documentation](../image/)**
- **[image-specification.md](../image/image-specification.md)** - Image system specifications and architecture
- **[image-development.md](../image/image-development.md)** - Implementation guide and API documentation
- **[image-evaluation.md](../image/image-evaluation.md)** - Quality evaluation and testing strategies

**Quick Reference for Comic Panels:**

**Image Generation**:
- **Service**: `src/lib/services/image-generation.ts`
- **Model**: Gemini 2.5 Flash
- **Format**: 1344×768 (7:4 aspect ratio)
- **Prompt**: Built from panel specification (shot type, characters, setting, mood)

**Image Optimization**:
- **Service**: `src/lib/services/image-optimization.ts`
- **Variants**: 4 optimized versions per panel
  - AVIF mobile 1x: 672×384
  - AVIF mobile 2x: 1344×768
  - JPEG mobile 1x: 672×384
  - JPEG mobile 2x: 1344×768
- **Storage**: Vercel Blob with environment-prefixed paths
- **Result**: `imageUrl` (original) + `imageVariants` (optimized set)

---

## Part V: Database Operations

### 5.1 Saving Comic Panels

**File**: `src/lib/studio/generators/comic-panel-generator.ts`

**Process**:

```typescript
// For each generated panel
const panelId = `panel_${nanoid(16)}`;

const panelData = {
  id: panelId,
  sceneId: sceneId,
  panelNumber: panel.panel_number,
  shotType: panel.shot_type,
  imageUrl: optimizedImage.imageUrl,
  imageVariants: optimizedImage.imageVariants,
  narrative: panel.narrative || null,
  dialogue: panel.dialogue || [],
  sfx: panel.sfx || [],
  description: panel.description,
  metadata: {
    prompt: imagePrompt,
    characters_visible: panel.characters_visible,
    camera_angle: panel.camera_angle,
    mood: panel.mood,
    generated_at: new Date().toISOString(),
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Insert into database
await db.insert(comicPanels).values(panelData);
```

### 5.2 Updating Scene Status

**After panel generation completes**:

```typescript
await db
  .update(scenes)
  .set({
    comicStatus: 'draft',
    comicGeneratedAt: new Date().toISOString(),
    comicPanelCount: panels.length,
    comicVersion: (scene.comicVersion || 0) + 1,
    updatedAt: new Date().toISOString(),
  })
  .where(eq(scenes.id, sceneId));
```

---

## Part VI: Frontend Integration

### 6.1 Comic Panel Generator Button

**Component**: `src/components/comic/comic-panel-generator-button.tsx`

**Usage in Studio**:

```tsx
import { ComicPanelGeneratorButton } from '@/components/comic/comic-panel-generator-button';

function SceneEditor({ scene }: { scene: Scene }) {
  return (
    <div>
      {/* ... scene editing UI ... */}

      <ComicPanelGeneratorButton
        sceneId={scene.id}
        onComplete={() => {
          // Refresh scene data
          mutate();
        }}
      />
    </div>
  );
}
```

**Button Component**:

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ComicPanelGeneratorButton({
  sceneId,
  onComplete,
}: {
  sceneId: string;
  onComplete?: () => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);

    const eventSource = new EventSource(
      `/api/studio/scenes/${sceneId}/comic/generate`
    );

    eventSource.addEventListener('progress', (e) => {
      const data = JSON.parse(e.data);
      setProgress(data.percentage);
      setStatus(data.status);
    });

    eventSource.addEventListener('complete', (e) => {
      const data = JSON.parse(e.data);
      console.log('Generation complete:', data);
      setIsGenerating(false);
      eventSource.close();
      onComplete?.();
    });

    eventSource.addEventListener('error', (e) => {
      const data = JSON.parse(e.data);
      console.error('Generation error:', data);
      setIsGenerating(false);
      eventSource.close();
    });
  };

  return (
    <div>
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? `Generating... ${progress}%` : 'Generate Comic Panels'}
      </Button>
      {isGenerating && <p>{status}</p>}
    </div>
  );
}
```

### 6.2 Comic Viewer Component

**Component**: `src/components/comic/comic-viewer.tsx`

**Purpose**: Display sequential comic panels with vertical scroll

```tsx
'use client';

import Image from 'next/image';
import type { ComicPanel } from '@/lib/schemas/database';

export function ComicViewer({ panels }: { panels: ComicPanel[] }) {
  return (
    <div className="comic-container max-w-[1344px] mx-auto space-y-6">
      {panels.map((panel) => (
        <div key={panel.id} className="relative w-full">
          {/* Panel image */}
          <Image
            src={panel.imageUrl}
            alt={`Panel ${panel.panelNumber}`}
            width={1344}
            height={768}
            className="w-full h-auto"
          />

          {/* Dialogue overlays */}
          {panel.dialogue?.map((d, i) => (
            <DialogueBubble key={i} {...d} />
          ))}

          {/* Sound effects overlays */}
          {panel.sfx?.map((sfx, i) => (
            <SFXText key={i} {...sfx} />
          ))}

          {/* Narrative caption */}
          {panel.narrative && (
            <NarrativeCaption text={panel.narrative} />
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Conclusion

The comics development system provides:

1. **Two-Phase Generation**: Toonplay conversion → Panel image generation
2. **SSE Progress Updates**: Real-time feedback during long operations
3. **Quality Evaluation**: Automated assessment of toonplay quality
4. **Independent Publishing**: Separate text and comic publishing workflows
5. **Mobile-First Design**: Optimized for vertical scroll webtoon reading

**Next Steps:**
- See `comics-specification.md` for core concepts and data model
- See `comics-evaluation.md` for quality metrics and testing strategies
