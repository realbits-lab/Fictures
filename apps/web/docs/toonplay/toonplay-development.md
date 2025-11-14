# Toonplay Development Guide: Implementation & APIs

## Overview

This document provides comprehensive implementation specifications for the toonplay generation system, including API architecture, code organization, process flows, and quality evaluation.

**Related Documents:**
- 📖 **Specification** (`toonplay-specification.md`): Core concepts, data model, and visual grammar
- 🧪 **Evaluation Guide** (`toonplay-evaluation.md`): Quality metrics, testing strategies, and validation methods

---

## Part I: Code Architecture

### 1.1 Architectural Overview

**Purpose Separation:**
- **`src/lib/studio/`**: Creation/generation functionality (write operations)
- **`src/app/comics/`**: Comic reading/viewing functionality (read operations)

**Primary Files**:
- `src/lib/ai/toonplay-converter.ts` - Core toonplay generation logic
- `src/lib/ai/comic-panel-generator.ts` - Image generation pipeline
- `src/lib/services/toonplay-evaluator.ts` - Quality evaluation rubric
- `src/lib/services/toonplay-improvement-loop.ts` - Iterative improvement system

**Database Integration**:
- `src/lib/schemas/database/index.ts` - Database schema (Drizzle ORM)
- `drizzle/schema.ts` - Auto-generated schema (do not edit manually)
- `drizzle/migrations/` - Database migration files

### 1.2 Type Naming Convention

**Layer-Based Naming Pattern**: `{Layer}{Entity}{Suffix}`

All types follow a consistent layer-prefix pattern for searchability and clarity.

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

### 1.3 TypeScript Schema Definitions

**Core Schemas** (`src/lib/ai/toonplay-converter.ts`):

```typescript
// SSOT: Zod Schema for Comic Panel
export const ComicPanelSpecSchema = z.object({
  panel_number: z.number().min(1),
  shot_type: z.enum([
    'establishing_shot',
    'wide_shot',
    'medium_shot',
    'close_up',
    'extreme_close_up',
    'over_shoulder',
    'dutch_angle'
  ]),
  description: z.string().describe('Detailed visual description for image generation'),
  characters_visible: z.array(z.string()),
  character_poses: z.record(z.string(), z.string()),
  setting_focus: z.string(),
  lighting: z.string(),
  camera_angle: z.string(),
  narrative: z.string().optional(),
  dialogue: z.array(z.object({
    character_id: z.string(),
    text: z.string().max(150),
    tone: z.string().optional()
  })),
  sfx: z.array(z.object({
    text: z.string(),
    emphasis: z.enum(['normal', 'large', 'dramatic'])
  })),
  mood: z.string()
});

// SSOT: Zod Schema for Complete Toonplay
export const ComicToonplaySchema = z.object({
  scene_id: z.string(),
  scene_title: z.string(),
  total_panels: z.number().min(1).max(12),
  panels: z.array(ComicPanelSpecSchema),
  pacing_notes: z.string().optional(),
  narrative_arc: z.string()
});

// Derived TypeScript Types
export type ComicPanelSpec = z.infer<typeof ComicPanelSpecSchema>;
export type ComicToonplay = z.infer<typeof ComicToonplaySchema>;
```

### 1.4 Database Schema

**scenes table** (toonplay storage):
```sql
-- Stores the generated toonplay specification
comic_toonplay JSONB  -- Complete toonplay with panels, pacing notes, etc.
comic_status TEXT     -- 'pending', 'generating', 'completed', 'failed'
comic_panel_count INTEGER  -- Number of panels generated
```

**characters table** (character consistency):
```sql
-- Physical description for visual consistency
physical_description JSONB NOT NULL
-- Structure: { age, appearance, distinctiveFeatures, style }
```

**Why Store Toonplay in Database**:
- ✅ Regenerate panels without re-running AI toonplay generation
- ✅ Enable future editing workflow (edit toonplay → regenerate specific panels)
- ✅ Debugging (compare toonplay vs actual panels)
- ✅ Versioning (track what toonplay generated current panels)

---

## Part II: API Architecture

### 2.1 Toonplay Generation API

**Endpoint**: `POST /api/comics/generate-toonplay`
**Purpose**: Convert narrative scene to webtoon toonplay specification
**Authentication**: Dual auth (API key OR session) - Requires `stories:write` scope

**Request Type**:
```typescript
interface ApiToonplayRequest {
  sceneId: string;           // Scene to convert
  evaluationMode?: 'quick' | 'standard' | 'thorough';  // Quality evaluation mode
}
```

**Response Type**:
```typescript
interface ApiToonplayResponse {
  success: true;
  result: {
    toonplay: ComicToonplay;        // Generated toonplay specification
    panels: GeneratedPanel[];       // Generated panel images
    evaluation: {                   // Quality evaluation (NEW)
      weighted_score: number;       // 1.0-5.0
      passes: boolean;              // true if >= 3.0
      iterations: number;           // 0-2
      final_report: string;         // Full evaluation breakdown
    };
    metadata: {
      modelId: string;              // AI model used
      tokensUsed: number;           // Token consumption
      generationTime: number;       // Milliseconds
    };
  };
}
```

**Error Response**:
```typescript
interface ApiToonplayErrorResponse {
  success: false;
  error: {
    code: string;      // 'SCENE_NOT_FOUND' | 'GENERATION_FAILED' | etc.
    message: string;   // Human-readable error
    details?: any;     // Additional error context
  };
}
```

### 2.2 Process Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Scene Input (narrative prose from Adversity-Triumph Engine) │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. generateToonplayWithEvaluation() [Entry Point]              │
│  Location: src/lib/services/toonplay-improvement-loop.ts        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ├─ Iteration 0: Initial Generation
                             │  ├─ convertSceneToToonplay()
                             │  │  - Analyzes scene content, characters, settings
                             │  │  - Generates toonplay using Gemini 2.5 Flash Lite
                             │  │  - Returns structured ComicToonplay object
                             │  │
                             │  └─ evaluateToonplay() [NEW]
                             │     - 4-category quality rubric evaluation
                             │     - Weighted score: 1.0-5.0
                             │     - Passing threshold: 3.0/5.0
                             │
                             ├─ If score < 3.0: Iteration 1 & 2 (Improvement) [NEW]
                             │  ├─ improveToonplay()
                             │  │  - Addresses specific weaknesses
                             │  │  - Implements improvement suggestions
                             │  │  - Re-generates with enhanced guidance
                             │  │
                             │  └─ evaluateToonplay()
                             │     - Re-evaluates improved version
                             │     - Tracks improvement history
                             │
                             └─ Returns best toonplay with evaluation report
                                - Final quality score and report
                                - Improvement iteration count
                                - Detailed rubric breakdown
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. generateComicPanels()                                       │
│  Location: src/lib/ai/comic-panel-generator.ts                  │
│                                                                 │
│  Character Consistency (Database-Driven):                       │
│  ├─ Fetch character data from database (characters table)      │
│  ├─ Build character prompts from physical_description           │
│  │  Format: age + appearance + distinctiveFeatures + style     │
│  └─ Cache character prompts for consistency across all panels   │
│                                                                 │
│  Panel Generation Loop:                                         │
│  ├─ Iterate through toonplay.panels                            │
│  ├─ Build image prompt for each panel                          │
│  │  - Visual grammar (shot type, camera angle, lighting)       │
│  │  - Database character descriptions (consistent)             │
│  │  - Setting context and mood                                 │
│  │                                                              │
│  ├─ Generate images via AI Server (Qwen-Image-Lightning)       │
│  │  - Resolution: 928×1664 (9:16 portrait for webtoons)        │
│  │  - Format: PNG (original)                                   │
│  │                                                              │
│  └─ Create 4 optimized variants per panel                      │
│     - AVIF format (mobile 1x: 464×832, mobile 2x: 928×1664)    │
│     - JPEG format (mobile 1x: 464×832, mobile 2x: 928×1664)    │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Database Storage                                            │
│  Location: src/lib/schemas/database/index.ts                    │
│                                                                 │
│  ├─ Store toonplay in scenes.comicToonplay (JSONB)             │
│  ├─ Store panels in comicPanels table                          │
│  ├─ Update scene metadata                                      │
│  │  - comicStatus: 'completed'                                 │
│  │  - comicPanelCount: number                                  │
│  │  - comicEvaluationScore: number                             │
│  │                                                              │
│  └─ Include evaluation metrics for tracking                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part III: Implementation Details

### 3.1 Toonplay Converter

**Function**: `convertSceneToToonplay()`
**Location**: `src/lib/ai/toonplay-converter.ts`
**Purpose**: Convert narrative prose to structured toonplay specification

**Input**:
```typescript
interface ConvertSceneParams {
  scene: Scene;              // Scene with content, summary, metadata
  story: Story;              // Story context (genre, tone) - needed for visual style
  characters: Character[];   // Character profiles - needed for physical_description in image prompts
  settings: Setting[];       // Location details - needed for atmosphere and visual context
}
```

**Design Note**: While the scene contains the narrative content, it typically only references characters and settings by ID. The full character profiles (with `physical_description` for image generation) and setting details (with `atmosphere` for visual context) must be passed explicitly to build consistent image prompts and provide genre/tone context for adaptation.

**Output**:
```typescript
interface ConvertSceneResult {
  toonplay: ComicToonplay;   // Structured toonplay specification
  metadata: {
    modelId: string;
    tokensUsed: number;
    generationTime: number;
  };
}
```

**AI Prompt Template**:

The system prompt instructs the AI to:

1. **Analyze Input**:
   - Read scene narrative (prose content)
   - Identify key story beats and emotional moments
   - Determine character actions and dialogue

2. **Break into Panels** (8-12 panels, target: 10):
   - Each panel must advance the story
   - Distribute shot types appropriately (see guidelines below)
   - Maintain pacing rhythm (space = time)

3. **Distribute Shot Types**:
   ```
   For 8-12 panels:
   - 1 establishing_shot (scene opening or major location change)
   - 2-3 wide_shot (full action, multiple characters, environment)
   - 3-5 medium_shot (main storytelling, conversations)
   - 2-3 close_up (emotional beats, reactions, important details)
   - 0-1 extreme_close_up (climactic moments, intense emotion)
   - 0-1 over_shoulder or dutch_angle (special moments, tension)
   ```

4. **Content Proportions**:
   - **Dialogue**: ~70% (primary story driver)
   - **Visual Action**: ~30% (shown in panels, not told)
   - **Narration**: <5% (time/location markers, essential tone)
   - **Internal Monologue**: <10% (strategic use at pivotal moments, 1-2 panels per scene)

5. **Text Overlay Requirement**:
   - Every panel MUST have either narrative OR dialogue
   - No silent panels (unless intentionally cinematic)

6. **Character Consistency**:
   - Use exact character descriptions from database
   - Maintain consistent traits across all panels

7. **Sound Effects (SFX)**:
   - Add SFX for impactful moments (punches, crashes, etc.)
   - Use appropriate emphasis levels (normal, large, dramatic)

**Example System Prompt** (abbreviated):

```markdown
You are a professional webtoon adapter specializing in novel-to-webtoon conversion.

TASK: Convert the provided narrative scene into a toonplay specification for webtoon production.

SCENE CONTENT:
{scene.content}

CHARACTERS:
{characters.map(c => `- ${c.name}: ${c.physical_description}`)}

SETTINGS:
{settings.map(s => `- ${s.name}: ${s.description}`)}

REQUIREMENTS:
1. Generate 8-12 panels (target: 10)
2. Distribute shot types according to guidelines
3. Maintain content proportions (70% dialogue, 30% visual, <5% narration, <10% internal monologue)
4. Every panel must have dialogue OR narrative
5. Use exact character descriptions from database
6. Show, don't tell - externalize internal states

OUTPUT FORMAT: JSON matching ComicToonplaySchema
```

### 3.2 Comic Panel Generator

**Function**: `generateComicPanels()`
**Location**: `src/lib/ai/comic-panel-generator.ts`
**Purpose**: Generate images for all panels in toonplay

**Character Consistency Implementation**:

**Step 1: Fetch Character Data**
```typescript
// Fetch all characters appearing in toonplay
const characterIds = toonplay.panels
  .flatMap(panel => panel.characters_visible)
  .filter((id, index, self) => self.indexOf(id) === index);

const characters = await db.select()
  .from(charactersTable)
  .where(inArray(charactersTable.id, characterIds));
```

**Step 2: Build Character Prompts** (`buildPanelCharacterPrompts()`)
```typescript
/**
 * Constructs consistent character descriptions from database
 * This ensures visual consistency across all panels
 */
function buildPanelCharacterPrompts(
  characterIds: string[],
  characterMap: Map<string, Character>
): string {
  const prompts = characterIds.map(id => {
    const character = characterMap.get(id);
    if (!character) return '';

    const { age, appearance, distinctiveFeatures, style } =
      character.physical_description;

    // Construct exact prompt string
    return `${age} ${appearance}, ${distinctiveFeatures}, ${style}`;
  });

  return prompts.join('; ');
}

// Example output:
// "20-year-old male hunter, short black hair with glowing blue eyes, wearing a black trench coat;
//  mid-30s female healer, long silver hair, warm brown eyes, flowing white robes"
```

**Step 3: Cache Character Prompts**
```typescript
// Build character prompt cache (once per scene)
const characterPromptCache = new Map<string, string>();

for (const character of characters) {
  const { age, appearance, distinctiveFeatures, style } =
    character.physical_description;

  characterPromptCache.set(
    character.id,
    `${age} ${appearance}, ${distinctiveFeatures}, ${style}`
  );
}

// Reuse cached prompts for all panels
// Ensures identical descriptions in every panel
```

**Step 4: Build Panel Image Prompt**
```typescript
/**
 * Constructs AI image prompt for single panel
 * Uses visual grammar + database character descriptions
 */
function buildPanelImagePrompt(
  panel: ComicPanelSpec,
  characterPromptCache: Map<string, string>,
  setting: Setting,
  genre: string
): string {
  // 1. Get character descriptions from cache
  const characterPrompts = panel.characters_visible
    .map(id => characterPromptCache.get(id))
    .filter(Boolean)
    .join('; ');

  // 2. Build layered prompt
  const prompt = `Professional ${genre} comic panel, ${panel.shot_type}, ${panel.camera_angle}.

SCENE: ${panel.setting_focus}. ${setting.atmosphere}.

CHARACTERS: ${characterPrompts}

LIGHTING: ${panel.lighting}

ACTION: ${panel.description}

MOOD: ${panel.mood}

COMPOSITION RULES FOR 9:16 PORTRAIT FORMAT (928×1664):
- Vertical webtoon composition - taller than wide
- Frame composition: Utilize vertical space for scroll-based storytelling
- For establishing shots: Show expansive height with depth layers
- For medium shots: Position characters with vertical balance
- For close-ups: Frame character detail with vertical flow

VISUAL STYLE:
- Clean comic linework, vibrant colors, semi-realistic proportions
- Professional ${genre} comic art style
- Similar to Naver COMIC/Webtoon quality

CRITICAL CHARACTER CONSISTENCY:
Maintain exact character appearances from database - ${characterPrompts}
`;

  return prompt;
}
```

**Why Database-Driven Character Consistency Matters**:

AI image generators are highly sensitive to prompt wording. Even minor variations cause visual drift:

❌ **BAD** (Manual/Inconsistent):
```
Panel 1: "young man in a jacket"
Panel 2: "male hunter in a coat"
Panel 3: "guy with dark hair wearing black"
// Result: Three different-looking characters
```

✅ **GOOD** (Database-Driven):
```
All panels: "20-year-old male hunter, short black hair with glowing blue eyes, wearing a black trench coat"
// Result: Consistent character appearance across all panels
```

### 3.3 AI Prompt Template Structure

**Layered Prompt Pattern**:
```
[STYLE] + [SUBJECT & TRAITS] + [ACTION & POSE] + [EMOTION] + [SETTING] + [VISUAL GRAMMAR]
```

**Complete Prompt Example** (from `buildPanelImagePrompt()`):

```markdown
Professional fantasy comic panel, medium_shot, low angle.

SCENE: Ancient temple interior, dust particles visible in light beams. Mysterious and sacred.

CHARACTERS: 20-year-old male hunter, short black hair with glowing blue eyes, wearing a black trench coat; mid-30s female healer, long silver hair, warm brown eyes, flowing white robes

LIGHTING: Soft divine light filtering through stained glass windows, creating colorful patterns on stone floor

ACTION: Hunter kneels before altar while healer stands behind him, hand on his shoulder, both looking at glowing artifact

MOOD: Reverent and hopeful

COMPOSITION RULES FOR 9:16 PORTRAIT FORMAT (928×1664):
- Vertical webtoon composition - taller than wide
- Frame composition: Utilize vertical space for scroll-based storytelling
- For medium shots: Position characters with vertical balance
- Show depth with foreground, midground, background elements

VISUAL STYLE:
- Clean comic linework, vibrant colors, semi-realistic proportions
- Professional fantasy comic art style
- Similar to Naver COMIC/Webtoon quality

CRITICAL CHARACTER CONSISTENCY:
Maintain exact character appearances - 20-year-old male hunter with black hair and glowing blue eyes; mid-30s female healer with silver hair
```

### 3.4 Image Generation Specifications

**Model**: AI Server (Qwen-Image-Lightning)
**Resolution**: 928×1664 pixels (9:16 portrait aspect ratio)
**Format**: PNG (original), then optimized to AVIF + JPEG

**Optimization Pipeline**:

Every generated panel creates **4 optimized variants**:
- **AVIF Mobile 1x**: 464×832 (best compression)
- **AVIF Mobile 2x**: 928×1664 (uses original)
- **JPEG Mobile 1x**: 464×832 (universal fallback)
- **JPEG Mobile 2x**: 928×1664 (uses original)

**Storage**:
```typescript
interface GeneratedPanel {
  id: string;
  panel_number: number;
  imageUrl: string;           // Original PNG (928×1664)
  imageVariants: {
    imageId: string;
    originalUrl: string;
    variants: ImageVariant[];  // 4 optimized variants
    generatedAt: string;
  };
  toonplaySpec: ComicPanelSpec;  // Original specification
}
```

---

## Part IV: Quality Evaluation

**The toonplay generation system includes automatic quality evaluation and iterative improvement.**

For complete evaluation documentation, including:
- Quality metrics and rubric
- Testing strategies and scripts
- Improvement loop implementation
- Performance expectations

**See**: `toonplay-evaluation.md` - Complete quality evaluation guide

**Quick Reference**:
- **Location**: `src/lib/services/toonplay-evaluator.ts`
- **Passing Score**: 3.0/5.0 (weighted average across 4 categories)
- **First-Pass Rate**: 70-80% pass on first generation
- **Max Iterations**: 2 improvement cycles

---

## Part V: Related Documentation

**Specification & Concepts**:
- `toonplay-specification.md` - Core concepts, visual grammar, adaptation principles

**Evaluation & Testing**:
- `toonplay-evaluation.md` - Quality metrics, testing strategies, validation methods

**Code References**:
- `src/lib/ai/toonplay-converter.ts` - Core toonplay generation
- `src/lib/ai/comic-panel-generator.ts` - Image generation pipeline
- `src/lib/services/toonplay-evaluator.ts` - Quality evaluation
- `src/lib/services/toonplay-improvement-loop.ts` - Iterative improvement
- `src/lib/schemas/database/index.ts` - Database schema

**Other Documentation**:
- `docs/novels/novels-specification.md` - Adversity-Triumph Engine (source narrative)
- `docs/image/image-optimization.md` - Image optimization pipeline
- `docs/comics/comics-generation.md` - Complete comic generation workflow

---

**End of Document**

For questions or clarifications, refer to the code files listed above or consult related documentation.
