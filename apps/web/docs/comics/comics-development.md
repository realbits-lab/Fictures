# Comics Development Guide: API & Implementation

## Overview

This document provides comprehensive implementation specifications for the comics generation system, including API endpoints, toonplay conversion logic, and code architecture.

**Related Documents:**
- 📖 **Specification** (`comics-specification.md`): Core concepts, data model, and architecture
- 🧪 **Evaluation Guide** (`comics-evaluation.md`): Quality metrics, testing strategies, and validation

---

## Part I: Code Architecture

### 1.1 Directory Structure

```
src/
├── lib/
│   ├── ai/
│   │   └── comic-panel-generator.ts       # Legacy generator (to be deprecated)
│   ├── studio/
│   │   ├── generators/
│   │   │   ├── toonplay-converter.ts      # Phase 1: Prose → Toonplay
│   │   │   ├── comic-panel-generator.ts   # Phase 2: Toonplay → Images
│   │   │   ├── ai-client.ts              # Text generation client
│   │   │   ├── prompt-manager.ts         # System/user prompt management
│   │   │   └── types.ts                  # Generator type definitions
│   │   └── services/
│   │       └── comic-service.ts           # Orchestration layer (future)
│   ├── schemas/
│   │   ├── ai/
│   │   │   └── ai-toonplay.ts            # Toonplay Zod schemas (SSOT)
│   │   └── database/
│   │       └── index.ts                  # Drizzle schema (comic panels)
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
│                       ├── generate/route.ts   # POST: Generate panels
│                       ├── publish/route.ts    # POST: Publish comic
│                       └── unpublish/route.ts  # POST: Unpublish comic
└── components/
    └── comic/
        ├── comic-viewer.tsx                    # Panel display component
        ├── comic-panel-generator-button.tsx    # Studio UI trigger
        └── comic-status-card.tsx               # Publishing status UI
```

### 1.2 Type Naming Convention

**Layer-Based Pattern**: `{Layer}{Entity}{Suffix}`

**Layer Prefixes:**
- `Api` - HTTP layer (API routes)
- `Service` - Orchestration layer (business logic)
- `Generator` - Core generation logic
- `Ai` - AI output layer (Zod schemas)

**Suffixes:**
- `Request` - HTTP request body (API layer)
- `Response` - HTTP response body (API layer)
- `Params` - Function parameters (Service/Generator)
- `Result` - Function return type (Service/Generator)
- `Type` - TypeScript type (AI layer - from Zod)
- `ZodSchema` - Zod schema (AI layer - SSOT)

**Example:**
```typescript
// API Layer
type ApiComicGenerateRequest = { targetPanelCount?: number };
type ApiComicGenerateResponse = { success: boolean; panels: ComicPanel[] };

// Generator Layer
type GeneratorToonplayParams = { scene: Scene; story: Story };
type GeneratorToonplayResult = { toonplay: AiComicToonplayType };

// AI Layer
const AiComicToonplayZodSchema = z.object({ ... });
type AiComicToonplayType = z.infer<typeof AiComicToonplayZodSchema>;
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

### 4.3 Image Generation Code

**Service**: `src/lib/services/image-generation.ts`

**Function**:
```typescript
export async function generateComicPanelImage(
  prompt: string,
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-exp:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 1.0,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
          responseMimeType: 'image/jpeg',
          responseModalities: ['image'],
          aspectRatio: '16:9',  // 7:4 is close to 16:9
        }
      })
    }
  );

  const data = await response.json();
  const imageBase64 = data.candidates[0].content.parts[0].inlineData.data;
  const imageBuffer = Buffer.from(imageBase64, 'base64');

  return {
    imageBuffer,
    format: 'image/jpeg',
    width: 1344,
    height: 768,
  };
}
```

### 4.4 Image Optimization

**Service**: `src/lib/services/image-optimization.ts`

**Process**:
1. Original image uploaded to Vercel Blob (1344×768 PNG)
2. Generate 4 optimized variants:
   - AVIF mobile 1x: 672×384
   - AVIF mobile 2x: 1344×768 (uses original)
   - JPEG mobile 1x: 672×384
   - JPEG mobile 2x: 1344×768 (uses original)
3. Upload all variants to Vercel Blob
4. Return `imageVariants` object for database storage

**Code**:
```typescript
export async function optimizeComicPanelImage(
  originalBuffer: Buffer,
  storyId: string,
  sceneId: string,
  panelNumber: number
): Promise<ImageOptimizationResult> {
  const imageId = `panel-${panelNumber}`;
  const basePath = `stories/${storyId}/comics/${sceneId}`;

  // 1. Upload original
  const originalUrl = await uploadToVercelBlob(
    originalBuffer,
    `${basePath}/${imageId}.png`
  );

  // 2. Generate variants
  const variants: ImageVariant[] = [];

  // AVIF mobile 1x (672×384)
  const avif1x = await sharp(originalBuffer)
    .resize(672, 384)
    .avif({ quality: 80 })
    .toBuffer();
  const avif1xUrl = await uploadToVercelBlob(
    avif1x,
    `${basePath}/panel/avif/672x384/${imageId}.avif`
  );
  variants.push({ url: avif1xUrl, format: 'avif', width: 672, height: 384 });

  // AVIF mobile 2x (1344×768) - uses original
  const avif2xUrl = await uploadToVercelBlob(
    await sharp(originalBuffer).avif({ quality: 80 }).toBuffer(),
    `${basePath}/panel/avif/1344x768/${imageId}.avif`
  );
  variants.push({ url: avif2xUrl, format: 'avif', width: 1344, height: 768 });

  // JPEG mobile 1x (672×384)
  const jpeg1x = await sharp(originalBuffer)
    .resize(672, 384)
    .jpeg({ quality: 85 })
    .toBuffer();
  const jpeg1xUrl = await uploadToVercelBlob(
    jpeg1x,
    `${basePath}/panel/jpeg/672x384/${imageId}.jpeg`
  );
  variants.push({ url: jpeg1xUrl, format: 'jpeg', width: 672, height: 384 });

  // JPEG mobile 2x (1344×768) - uses original
  const jpeg2xUrl = await uploadToVercelBlob(
    await sharp(originalBuffer).jpeg({ quality: 85 }).toBuffer(),
    `${basePath}/panel/jpeg/1344x768/${imageId}.jpeg`
  );
  variants.push({ url: jpeg2xUrl, format: 'jpeg', width: 1344, height: 768 });

  return {
    imageUrl: originalUrl,
    imageVariants: {
      imageId,
      originalUrl,
      variants,
      generatedAt: new Date().toISOString(),
    },
  };
}
```

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
