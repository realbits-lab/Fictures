# Webtoon Panel Generation from Scene Text

**Version**: 1.0
**Date**: 2025-10-25
**Status**: Development Specification

## Executive Summary

This document specifies a comprehensive system for converting narrative scene text into visually compelling webtoon panels. The system integrates with Fictures' existing HNS (Hierarchical Narrative Schema) architecture to transform prose-based scenes into panel-by-panel storyboards with AI-generated images optimized for vertical-scroll webtoon format.

### Key Innovation

Rather than generating a single scene image, this system:
1. **Decomposes** scene narrative into discrete visual panels using AI
2. **Generates** consistent character images across all panels
3. **Formats** output for vertical-scroll webtoon consumption
4. **Maintains** narrative quality through integration with the scene evaluation system

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Workflow Overview](#workflow-overview)
3. [Technical Implementation](#technical-implementation)
4. [Prompt Engineering](#prompt-engineering)
5. [API Specification](#api-specification)
6. [Database Schema](#database-schema)
7. [UI/UX Considerations](#uiux-considerations)
8. [Testing Strategy](#testing-strategy)
9. [Future Enhancements](#future-enhancements)

---

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INPUT: Scene Narrative                       │
│  • HNSScene.content (prose, 500-1500 words)                         │
│  • Character refs, setting refs, emotional arc                      │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PHASE 1: Scene Analysis                           │
│  • Extract key moments, actions, dialogue                           │
│  • Identify visual beats (using GPT-4o-mini)                        │
│  • Map emotional progression                                        │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│              PHASE 2: Storyboard/Screenplay Generation               │
│  • Convert narrative to panel-by-panel screenplay                   │
│  • Determine camera angles, character poses                         │
│  • Calculate optimal panel count (3-8 panels per scene)             │
│  • Apply webtoon pacing rules (vertical scroll rhythm)              │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│              PHASE 3: Character Reference Extraction                 │
│  • Load character visual descriptions from HNS                      │
│  • Generate/retrieve character model sheets                         │
│  • Create character embeddings for consistency                      │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  PHASE 4: Panel Image Generation                     │
│  • For each panel:                                                  │
│    - Construct detailed DALL-E 3 prompt                             │
│    - Include character consistency references                       │
│    - Specify camera angle, composition                              │
│    - Generate 1792x1024 (16:9) image                                │
│    - Create 18 optimized variants                                   │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                PHASE 5: Webtoon Layout Assembly                      │
│  • Calculate gutter spacing (200-1000px)                            │
│  • Add speech bubbles and text overlays                             │
│  • Apply SFX (sound effects) lettering                              │
│  • Generate final vertical-scroll layout                            │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    OUTPUT: Webtoon Panels                            │
│  • Array of WebtoonPanel objects                                    │
│  • Images stored in Vercel Blob                                     │
│  • Layout metadata for rendering                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Scene Analyzer** | OpenAI GPT-4o-mini | Extract visual beats from narrative |
| **Screenplay Generator** | OpenAI GPT-4o-mini | Convert prose to panel descriptions |
| **Character Manager** | Database + AI | Maintain visual consistency |
| **Image Generator** | OpenAI DALL-E 3 | Create panel artwork (16:9, 1792x1024) |
| **Image Optimizer** | Sharp.js | Generate 18 optimized variants |
| **Layout Engine** | Next.js Component | Assemble vertical webtoon layout |
| **Storage** | Vercel Blob | Store panel images and metadata |

---

## Workflow Overview

### 1. Input Processing

**Starting Point**: `HNSScene` object with generated narrative content

```typescript
interface HNSScene {
  scene_id: string;
  scene_title: string;
  content: string;              // 500-1500 words of prose
  character_ids: string[];      // References to characters
  setting_id: string;           // Reference to setting
  pov_character_id: string;     // POV character
  emotional_shift: {
    from: string;
    to: string;
  };
  goal: string;                 // Scene goal
  conflict: string;             // Scene conflict
  outcome: string;              // Scene outcome
}
```

### 2. Scene-to-Screenplay Conversion

**AI Prompt Structure**:

```typescript
const SCENE_TO_SCREENPLAY_PROMPT = `You are an expert webtoon storyboard artist. Convert this narrative scene into a panel-by-panel screenplay optimized for vertical-scroll webtoons.

SCENE INFORMATION:
Title: {scene.scene_title}
Goal: {scene.goal}
Conflict: {scene.conflict}
Outcome: {scene.outcome}
Emotional Arc: {scene.emotional_shift.from} → {scene.emotional_shift.to}

NARRATIVE CONTENT:
{scene.content}

CHARACTERS PRESENT:
{characterDescriptions}

SETTING:
{settingDescription}

INSTRUCTIONS:
1. Break the narrative into 3-8 visual panels
2. Each panel must show, not tell (avoid narration boxes where possible)
3. Use varied camera angles (wide, medium, close-up, extreme close-up)
4. Maintain character consistency - reference the same visual traits
5. Include dialogue in speech bubbles (max 2-3 bubbles per panel)
6. Add sound effects (SFX) for impactful moments
7. Plan gutters: small (200px) for fast action, large (600-1000px) for scene transitions
8. End with a hook or cliffhanger if this scene is episodic

OUTPUT FORMAT (JSON):
Return an array of panels with the following structure:
{
  "panels": [
    {
      "panel_number": 1,
      "shot_type": "wide_shot" | "medium_shot" | "close_up" | "extreme_close_up" | "establishing_shot",
      "description": "Detailed visual description for image generation",
      "characters_visible": ["character_id_1", "character_id_2"],
      "character_poses": {
        "character_id_1": "standing with arms crossed, looking stern",
        "character_id_2": "sitting, leaning forward anxiously"
      },
      "setting_focus": "The dim interrogation room with a single overhead light",
      "lighting": "dramatic shadows, single overhead light source",
      "camera_angle": "slightly low angle, looking up at standing character",
      "dialogue": [
        {
          "character_id": "character_id_1",
          "text": "Where were you on the night of the 15th?",
          "tone": "accusatory"
        }
      ],
      "sfx": [],
      "gutter_after": 200,
      "mood": "tense, confrontational"
    }
  ]
}`;
```

### 3. Character Consistency Strategy

**Problem**: DALL-E 3 doesn't support reference images or style transfer.

**Solution**: Detailed, consistent character descriptions in every prompt.

```typescript
// Character Visual Profile (stored in database)
interface CharacterVisualProfile {
  character_id: string;
  name: string;
  base_description: string;    // "A tall woman in her 30s with..."
  physical_traits: string[];    // ["sharp green eyes", "short auburn hair", "athletic build"]
  typical_attire: string;       // "dark blue detective's coat, white shirt, black slacks"
  distinguishing_features: string; // "small scar above left eyebrow"
  art_style_notes: string;      // "webtoon style, clean linework, semi-realistic proportions"
}

// Prompt Construction with Character Consistency
function buildPanelPrompt(
  panel: WebtoonPanel,
  characters: CharacterVisualProfile[],
  setting: HNSSetting
): string {
  const characterPrompts = panel.characters_visible.map(id => {
    const char = characters.find(c => c.character_id === id);
    const pose = panel.character_poses[id];

    return `${char.name} (${char.base_description}, ${char.physical_traits.join(', ')},
    wearing ${char.typical_attire}, ${char.distinguishing_features}): ${pose}`;
  }).join('. ');

  return `Professional webtoon panel, ${panel.shot_type}, ${panel.camera_angle}.

SCENE: ${panel.setting_focus}. ${setting.description}.

CHARACTERS: ${characterPrompts}

LIGHTING: ${panel.lighting}

COMPOSITION: ${panel.description}

MOOD: ${panel.mood}

Style: Clean webtoon linework, vibrant colors, semi-realistic proportions, 16:9 widescreen format,
cinematic composition, similar to popular Naver WEBTOON series.

IMPORTANT: Maintain exact character appearance across all panels - ${char.physical_traits.join(', ')}`;
}
```

### 4. Panel Generation Loop

```typescript
async function generateWebtoonPanels(
  sceneId: string,
  screenplay: WebtoonScreenplay,
  storyContext: StoryContext
): Promise<WebtoonPanelSet> {

  const panels: WebtoonPanel[] = [];

  for (let i = 0; i < screenplay.panels.length; i++) {
    const panelSpec = screenplay.panels[i];

    console.log(`🎬 Generating panel ${i + 1}/${screenplay.panels.length}`);

    // 1. Build image prompt with character consistency
    const prompt = buildPanelPrompt(
      panelSpec,
      storyContext.characters,
      storyContext.setting
    );

    // 2. Generate image via DALL-E 3
    const imageResult = await generateStoryImage({
      prompt: prompt,
      storyId: storyContext.storyId,
      imageType: 'webtoon-panel',
      style: 'vivid',    // For vibrant webtoon colors
      quality: 'standard',
      aspectRatio: '16:9'
    });

    // 3. Store panel with metadata
    panels.push({
      panel_id: nanoid(),
      scene_id: sceneId,
      panel_number: panelSpec.panel_number,
      shot_type: panelSpec.shot_type,
      image_url: imageResult.url,
      image_variants: imageResult.optimizedSet,
      dialogue: panelSpec.dialogue,
      sfx: panelSpec.sfx,
      gutter_after: panelSpec.gutter_after,
      metadata: {
        prompt: prompt,
        characters_visible: panelSpec.characters_visible,
        camera_angle: panelSpec.camera_angle,
        mood: panelSpec.mood,
        generated_at: new Date().toISOString()
      }
    });

    // 4. Small delay to avoid rate limits
    if (i < screenplay.panels.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return {
    scene_id: sceneId,
    panels: panels,
    total_panels: panels.length,
    vertical_height: calculateVerticalHeight(panels),
    generated_at: new Date().toISOString()
  };
}
```

---

## Technical Implementation

### File Structure

```
src/
├── lib/
│   ├── ai/
│   │   ├── webtoon-panel-generator.ts    # Main panel generation orchestrator
│   │   ├── screenplay-converter.ts       # Scene → Screenplay conversion
│   │   └── panel-prompt-builder.ts       # DALL-E 3 prompt construction
│   ├── services/
│   │   ├── webtoon-layout.ts             # Vertical scroll layout calculator
│   │   └── character-consistency.ts      # Character visual profile manager
│   └── db/
│       └── schema/
│           └── webtoon-panels.ts         # Database schema for panels
├── app/
│   └── api/
│       └── webtoon/
│           ├── generate-panels/route.ts  # API endpoint for panel generation
│           └── [sceneId]/panels/route.ts # Get panels for a scene
└── components/
    └── webtoon/
        ├── WebtoonViewer.tsx             # Vertical scroll reader
        ├── PanelRenderer.tsx             # Individual panel component
        └── DialogueBubble.tsx            # Speech bubble overlay
```

### Core Service: `webtoon-panel-generator.ts`

```typescript
/**
 * Webtoon Panel Generator
 *
 * Converts HNS scene narrative into visually compelling webtoon panels
 * with AI-generated images optimized for vertical scroll consumption.
 */

import { generateObject, generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { z } from 'zod';
import { HNSScene, HNSCharacter, HNSSetting } from '@/types/hns';
import { generateStoryImage } from '@/lib/services/image-generation';
import { db } from '@/lib/db';
import { webtoonPanels } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

// ============================================
// SCHEMA DEFINITIONS
// ============================================

export const WebtoonPanelSpecSchema = z.object({
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
  characters_visible: z.array(z.string()).describe('Array of character IDs visible in panel'),
  character_poses: z.record(z.string()).describe('Map of character_id to pose description'),
  setting_focus: z.string().describe('Which part of the setting is emphasized'),
  lighting: z.string().describe('Lighting setup and mood'),
  camera_angle: z.string().describe('Camera positioning (e.g., low angle, eye level, birds eye)'),
  dialogue: z.array(z.object({
    character_id: z.string(),
    text: z.string().max(100).describe('Max 100 characters for readability'),
    tone: z.string().optional()
  })),
  sfx: z.array(z.object({
    text: z.string(),
    emphasis: z.enum(['normal', 'large', 'dramatic'])
  })),
  gutter_after: z.number().min(0).max(1000).describe('Vertical space after panel in pixels'),
  mood: z.string().describe('Overall emotional tone of the panel')
});

export const WebtoonScreenplaySchema = z.object({
  scene_id: z.string(),
  scene_title: z.string(),
  total_panels: z.number().min(3).max(12),
  panels: z.array(WebtoonPanelSpecSchema),
  pacing_notes: z.string().optional(),
  narrative_arc: z.string().describe('How the panels collectively tell the scene story')
});

export type WebtoonPanelSpec = z.infer<typeof WebtoonPanelSpecSchema>;
export type WebtoonScreenplay = z.infer<typeof WebtoonScreenplaySchema>;

// ============================================
// CHARACTER CONSISTENCY MANAGER
// ============================================

interface CharacterVisualCache {
  [character_id: string]: {
    base_prompt: string;
    last_generated: Date;
  };
}

const characterVisualCache: CharacterVisualCache = {};

function buildCharacterPromptFragment(
  character: HNSCharacter,
  pose: string
): string {
  // Cache character visual description for consistency
  const cacheKey = character.character_id;

  if (!characterVisualCache[cacheKey]) {
    const physicalDesc = character.physical_description;
    const basePrompt = `${character.name} (${physicalDesc?.age || 'adult'},
      ${physicalDesc?.gender || 'character'},
      ${physicalDesc?.height || 'average height'},
      ${physicalDesc?.build || 'average build'},
      ${physicalDesc?.hair_color || ''} hair,
      ${physicalDesc?.eye_color || ''} eyes,
      ${physicalDesc?.skin_tone || ''} skin tone,
      wearing ${physicalDesc?.typical_attire || 'casual clothing'},
      ${physicalDesc?.distinguishing_features || ''})`.replace(/\s+/g, ' ').trim();

    characterVisualCache[cacheKey] = {
      base_prompt: basePrompt,
      last_generated: new Date()
    };
  }

  return `${characterVisualCache[cacheKey].base_prompt}: ${pose}`;
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

export interface GenerateWebtoonPanelsOptions {
  sceneId: string;
  scene: HNSScene;
  characters: HNSCharacter[];
  setting: HNSSetting;
  story: { story_id: string; genre: string };
  targetPanelCount?: number;  // Optional: override default 4-6 panels
  progressCallback?: (current: number, total: number, status: string) => void;
}

export async function generateWebtoonPanels(
  options: GenerateWebtoonPanelsOptions
): Promise<{
  screenplay: WebtoonScreenplay;
  panels: any[];
  metadata: {
    total_generation_time: number;
    total_panels: number;
    total_images: number;
  };
}> {

  const startTime = Date.now();
  const { scene, characters, setting, story, progressCallback } = options;

  console.log(`\n🎬 ============= WEBTOON PANEL GENERATION START =============`);
  console.log(`   Scene: ${scene.scene_title}`);
  console.log(`   Scene ID: ${scene.scene_id}`);

  // ========================================
  // STEP 1: Convert Scene to Screenplay
  // ========================================

  progressCallback?.(0, 100, 'Converting scene to screenplay...');

  const characterDescriptions = characters
    .map(c => `${c.name} - ${c.role}: ${c.motivation}`)
    .join('\n');

  const screenplayPrompt = `You are an expert webtoon storyboard artist. Convert this narrative scene into a panel-by-panel screenplay optimized for vertical-scroll webtoons.

SCENE INFORMATION:
Title: ${scene.scene_title}
Goal: ${scene.goal}
Conflict: ${scene.conflict}
Outcome: ${scene.outcome}
Emotional Arc: ${scene.emotional_shift?.from || 'neutral'} → ${scene.emotional_shift?.to || 'resolved'}

NARRATIVE CONTENT:
${scene.content}

CHARACTERS PRESENT:
${characterDescriptions}

SETTING:
${setting.name}: ${setting.description}

GENRE: ${story.genre}

INSTRUCTIONS:
1. Break the narrative into ${options.targetPanelCount || '4-6'} visual panels
2. Each panel must SHOW the action, not tell (minimize narration)
3. Use varied camera angles for visual interest
4. Maintain character consistency - reference same physical traits
5. Include dialogue (max 2-3 speech bubbles per panel, max 100 chars each)
6. Add sound effects (SFX) for impactful moments
7. Set gutters: 200px for continuous action, 400-600px for beat changes, 800-1000px for scene transitions
8. Ensure each panel advances the story

IMPORTANT: This is for a ${story.genre} story. Match the visual style and tone accordingly.`;

  const screenplayResult = await generateObject({
    model: gateway('openai/gpt-4o-mini'),
    schema: WebtoonScreenplaySchema,
    prompt: screenplayPrompt,
    temperature: 0.7,
  });

  const screenplay = screenplayResult.object;
  console.log(`✓ Screenplay generated: ${screenplay.total_panels} panels`);

  progressCallback?.(20, 100, `Screenplay ready: ${screenplay.total_panels} panels`);

  // ========================================
  // STEP 2: Generate Panel Images
  // ========================================

  const generatedPanels = [];
  const totalPanels = screenplay.panels.length;

  for (let i = 0; i < screenplay.panels.length; i++) {
    const panelSpec = screenplay.panels[i];
    const progress = 20 + Math.floor((i / totalPanels) * 70);

    progressCallback?.(
      progress,
      100,
      `Generating panel ${i + 1}/${totalPanels}: ${panelSpec.shot_type}`
    );

    console.log(`\n🎨 Panel ${i + 1}/${totalPanels}: ${panelSpec.shot_type}`);

    // Build character descriptions for this panel
    const characterPrompts = panelSpec.characters_visible
      .map(charId => {
        const character = characters.find(c => c.character_id === charId);
        if (!character) return '';

        const pose = panelSpec.character_poses[charId] || 'standing naturally';
        return buildCharacterPromptFragment(character, pose);
      })
      .filter(Boolean)
      .join('. ');

    // Construct full image prompt
    const imagePrompt = `Professional ${story.genre} webtoon panel, ${panelSpec.shot_type}, ${panelSpec.camera_angle}.

SCENE: ${panelSpec.setting_focus}. ${setting.atmosphere || ''}.

CHARACTERS: ${characterPrompts}

LIGHTING: ${panelSpec.lighting}

ACTION: ${panelSpec.description}

MOOD: ${panelSpec.mood}

Style: Clean webtoon linework, vibrant colors, semi-realistic proportions, 16:9 widescreen format,
professional ${story.genre} webtoon art style, cinematic composition, similar to Naver WEBTOON quality.

CRITICAL: Maintain exact character appearances - ${characterPrompts}`;

    console.log(`   Prompt: ${imagePrompt.substring(0, 100)}...`);

    // Generate image
    const imageResult = await generateStoryImage({
      prompt: imagePrompt,
      storyId: story.story_id,
      imageType: 'webtoon-panel',
      style: 'vivid',
      quality: 'standard',
    });

    console.log(`   ✅ Image generated: ${imageResult.url}`);
    console.log(`   ✅ Variants: ${imageResult.optimizedSet?.variants.length || 0}`);

    // Store panel in database
    const panelId = nanoid();
    await db.insert(webtoonPanels).values({
      id: panelId,
      sceneId: scene.scene_id,
      panelNumber: panelSpec.panel_number,
      shotType: panelSpec.shot_type,
      imageUrl: imageResult.url,
      imageVariants: imageResult.optimizedSet as any,
      dialogue: panelSpec.dialogue as any,
      sfx: panelSpec.sfx as any,
      gutterAfter: panelSpec.gutter_after,
      metadata: {
        prompt: imagePrompt,
        characters_visible: panelSpec.characters_visible,
        camera_angle: panelSpec.camera_angle,
        mood: panelSpec.mood,
        generated_at: new Date().toISOString()
      } as any,
      createdAt: new Date(),
    });

    generatedPanels.push({
      id: panelId,
      ...panelSpec,
      image_url: imageResult.url,
      image_variants: imageResult.optimizedSet,
    });

    // Rate limiting delay
    if (i < totalPanels - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  progressCallback?.(100, 100, 'Panel generation complete!');

  const totalTime = Date.now() - startTime;
  console.log(`\n✅ ============= WEBTOON PANEL GENERATION COMPLETE =============`);
  console.log(`   Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`   Panels Generated: ${generatedPanels.length}`);
  console.log(`   Images Generated: ${generatedPanels.length}`);

  return {
    screenplay,
    panels: generatedPanels,
    metadata: {
      total_generation_time: totalTime,
      total_panels: generatedPanels.length,
      total_images: generatedPanels.length,
    }
  };
}

// ============================================
// UTILITY: Calculate Vertical Height
// ============================================

export function calculateVerticalHeight(panels: any[]): number {
  // Standard panel height: 1024px (16:9 at 1792x1024)
  // Add gutter space after each panel
  return panels.reduce((total, panel) => {
    return total + 1024 + (panel.gutter_after || panel.gutterAfter || 200);
  }, 0);
}
```

---

## Database Schema

### New Table: `webtoon_panels`

```sql
CREATE TABLE webtoon_panels (
  id VARCHAR(21) PRIMARY KEY,
  scene_id VARCHAR(21) NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  panel_number INTEGER NOT NULL,
  shot_type VARCHAR(50) NOT NULL,

  -- Image data
  image_url TEXT NOT NULL,
  image_variants JSONB,  -- Optimized variants (AVIF, WebP, JPEG)

  -- Content overlays
  dialogue JSONB,        -- Array of { character_id, text, tone }
  sfx JSONB,            -- Array of { text, emphasis }

  -- Layout
  gutter_after INTEGER DEFAULT 200,  -- Vertical space after this panel

  -- Metadata
  metadata JSONB,        -- { prompt, characters_visible, camera_angle, mood, generated_at }

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  INDEX idx_webtoon_panels_scene (scene_id),
  INDEX idx_webtoon_panels_order (scene_id, panel_number)
);
```

### Migration File

```typescript
// src/lib/db/migrations/YYYYMMDDHHMMSS_add_webtoon_panels.ts

import { sql } from 'drizzle-orm';
import { pgTable, varchar, integer, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

export const webtoonPanels = pgTable('webtoon_panels', {
  id: varchar('id', { length: 21 }).primaryKey(),
  sceneId: varchar('scene_id', { length: 21 }).notNull(),
  panelNumber: integer('panel_number').notNull(),
  shotType: varchar('shot_type', { length: 50 }).notNull(),

  imageUrl: text('image_url').notNull(),
  imageVariants: jsonb('image_variants'),

  dialogue: jsonb('dialogue'),
  sfx: jsonb('sfx'),

  gutterAfter: integer('gutter_after').default(200),

  metadata: jsonb('metadata'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  sceneIdx: index('idx_webtoon_panels_scene').on(table.sceneId),
  orderIdx: index('idx_webtoon_panels_order').on(table.sceneId, table.panelNumber),
}));
```

---

## API Specification

### Endpoint: `POST /api/webtoon/generate-panels`

**Purpose**: Generate webtoon panels for a scene

**Request**:
```typescript
{
  sceneId: string;               // Required
  targetPanelCount?: number;     // Optional: 3-12, default 4-6
  regenerate?: boolean;          // Optional: regenerate if panels exist
}
```

**Response** (SSE Stream):
```typescript
// Progress events
{ phase: 'screenplay_generation', progress: 20, message: 'Converting scene to screenplay...' }
{ phase: 'panel_generation', progress: 50, panel: 2, total: 6, message: 'Generating panel 2/6' }

// Final event
{
  phase: 'complete',
  screenplay: WebtoonScreenplay,
  panels: WebtoonPanel[],
  metadata: {
    total_generation_time: 45000,
    total_panels: 6,
    total_images: 6
  }
}
```

**Implementation**:

```typescript
// src/app/api/webtoon/generate-panels/route.ts

import { NextRequest } from 'next/server';
import { authenticateRequest, hasRequiredScope } from '@/lib/auth/dual-auth';
import { db } from '@/lib/db';
import { scenes, characters, settings, stories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateWebtoonPanels } from '@/lib/ai/webtoon-panel-generator';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const authResult = await authenticateRequest(request);
    if (!authResult || !hasRequiredScope(authResult, 'stories:write')) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 2. Parse request
    const { sceneId, targetPanelCount, regenerate } = await request.json();

    if (!sceneId) {
      return new Response('sceneId required', { status: 400 });
    }

    // 3. Fetch scene and related data
    const sceneData = await db
      .select()
      .from(scenes)
      .where(eq(scenes.id, sceneId))
      .limit(1);

    if (sceneData.length === 0) {
      return new Response('Scene not found', { status: 404 });
    }

    const scene = sceneData[0];

    // Fetch characters, setting, story
    const sceneCharacters = await db
      .select()
      .from(characters)
      .where(/* character_ids match */);

    const sceneSetting = await db
      .select()
      .from(settings)
      .where(eq(settings.id, scene.settingId))
      .limit(1);

    const sceneStory = await db
      .select()
      .from(stories)
      .where(eq(stories.id, scene.storyId))
      .limit(1);

    // 4. Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendUpdate = (phase: string, data: any) => {
          const message = `data: ${JSON.stringify({ phase, ...data })}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          // Generate panels with progress callbacks
          const result = await generateWebtoonPanels({
            sceneId,
            scene: scene as any,
            characters: sceneCharacters as any,
            setting: sceneSetting[0] as any,
            story: sceneStory[0] as any,
            targetPanelCount,
            progressCallback: (current, total, status) => {
              sendUpdate('progress', { current, total, status });
            }
          });

          sendUpdate('complete', result);
          controller.close();
        } catch (error) {
          sendUpdate('error', {
            message: error instanceof Error ? error.message : 'Unknown error'
          });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('Panel generation error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
```

### Endpoint: `GET /api/webtoon/[sceneId]/panels`

**Purpose**: Retrieve generated panels for a scene

**Response**:
```typescript
{
  scene_id: string;
  total_panels: number;
  vertical_height: number;  // Total scrollable height in pixels
  panels: Array<{
    id: string;
    panel_number: number;
    shot_type: string;
    image_url: string;
    image_variants: OptimizedImageSet;
    dialogue: Array<{ character_id, text, tone }>;
    sfx: Array<{ text, emphasis }>;
    gutter_after: number;
    metadata: object;
  }>;
}
```

---

## UI/UX Considerations

### Webtoon Viewer Component

```tsx
// src/components/webtoon/WebtoonViewer.tsx

'use client';

import { useEffect, useState } from 'react';
import { PanelRenderer } from './PanelRenderer';

interface WebtoonViewerProps {
  sceneId: string;
}

export function WebtoonViewer({ sceneId }: WebtoonViewerProps) {
  const [panels, setPanels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/webtoon/${sceneId}/panels`)
      .then(res => res.json())
      .then(data => {
        setPanels(data.panels);
        setLoading(false);
      });
  }, [sceneId]);

  if (loading) {
    return <div className="flex justify-center py-20">Loading panels...</div>;
  }

  return (
    <div className="webtoon-container max-w-[1792px] mx-auto">
      {panels.map((panel, index) => (
        <div key={panel.id}>
          <PanelRenderer panel={panel} />

          {/* Gutter spacing */}
          {index < panels.length - 1 && (
            <div
              className="gutter"
              style={{ height: `${panel.gutter_after}px` }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

### Panel Renderer with Dialogue Overlays

```tsx
// src/components/webtoon/PanelRenderer.tsx

'use client';

import Image from 'next/image';
import { DialogueBubble } from './DialogueBubble';
import { SFXText } from './SFXText';

interface Panel {
  image_url: string;
  image_variants: any;
  dialogue: Array<{ character_id: string; text: string; tone?: string }>;
  sfx: Array<{ text: string; emphasis: 'normal' | 'large' | 'dramatic' }>;
  shot_type: string;
}

export function PanelRenderer({ panel }: { panel: Panel }) {
  return (
    <div className="relative w-full aspect-video">
      {/* Base panel image */}
      <Image
        src={panel.image_url}
        alt={panel.shot_type}
        width={1792}
        height={1024}
        className="w-full h-auto"
        priority
      />

      {/* Dialogue bubbles overlay */}
      {panel.dialogue?.map((dialogue, i) => (
        <DialogueBubble
          key={i}
          text={dialogue.text}
          characterId={dialogue.character_id}
          tone={dialogue.tone}
          position={calculateBubblePosition(i, panel.dialogue.length)}
        />
      ))}

      {/* Sound effects overlay */}
      {panel.sfx?.map((sfx, i) => (
        <SFXText
          key={i}
          text={sfx.text}
          emphasis={sfx.emphasis}
          position={calculateSFXPosition(i)}
        />
      ))}
    </div>
  );
}

// Helper to position bubbles
function calculateBubblePosition(index: number, total: number) {
  // Simple top-to-bottom stacking
  const topOffset = 10 + (index * 15); // 15% spacing
  return { top: `${topOffset}%`, left: '10%' };
}

function calculateSFXPosition(index: number) {
  return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// __tests__/webtoon-panel-generator.test.ts

import { describe, it, expect } from '@jest/globals';
import { generateWebtoonPanels } from '@/lib/ai/webtoon-panel-generator';

describe('Webtoon Panel Generator', () => {
  it('should generate 4-6 panels for standard scene', async () => {
    const mockScene = {
      scene_id: 'test-scene-1',
      scene_title: 'The Confrontation',
      content: 'Detective Sarah entered the dimly lit warehouse...',
      // ... full scene data
    };

    const result = await generateWebtoonPanels({
      sceneId: mockScene.scene_id,
      scene: mockScene,
      // ... other required params
    });

    expect(result.screenplay.total_panels).toBeGreaterThanOrEqual(4);
    expect(result.screenplay.total_panels).toBeLessThanOrEqual(6);
    expect(result.panels.length).toBe(result.screenplay.total_panels);
  });

  it('should maintain character consistency across panels', async () => {
    // Test that character descriptions are repeated correctly
  });

  it('should calculate correct vertical height with gutters', async () => {
    // Test layout calculations
  });
});
```

### Integration Tests

```typescript
// __tests__/api/webtoon-generation.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Webtoon Panel Generation API', () => {
  test('should generate panels via API', async ({ page }) => {
    // Navigate to scene
    await page.goto('/writing/test-story-id/scene/test-scene-id');

    // Click "Generate Webtoon Panels" button
    await page.click('button:has-text("Generate Panels")');

    // Wait for SSE completion
    await page.waitForSelector('[data-testid="panel-1"]');

    // Verify panels are displayed
    const panels = await page.$$('[data-testid^="panel-"]');
    expect(panels.length).toBeGreaterThan(3);

    // Check image loaded
    const firstPanel = await page.$('[data-testid="panel-1"] img');
    const src = await firstPanel?.getAttribute('src');
    expect(src).toContain('blob.vercel-storage.com');
  });
});
```

---

## Cost Estimation

### Per Scene (4-6 panels average)

| Component | Cost per Unit | Units per Scene | Total |
|-----------|---------------|-----------------|-------|
| Screenplay Generation (GPT-4o-mini) | ~$0.005 | 1 | $0.005 |
| Panel Image Generation (DALL-E 3, 1792x1024) | $0.080 | 5 | $0.400 |
| Image Optimization (Sharp.js, 18 variants) | $0.001 | 5 | $0.005 |
| Vercel Blob Storage (1GB) | $0.15/month | ~5MB | ~$0.001 |
| **TOTAL PER SCENE** | | | **~$0.41** |

**For a 10-scene story**: ~$4.10
**For a 50-scene story**: ~$20.50

### Optimization Strategies

1. **Batch Generation**: Generate all panels for a story in one session to reduce API overhead
2. **Caching**: Cache character visual descriptions to avoid regenerating prompts
3. **Optional Feature**: Make webtoon panel generation opt-in (default to single scene image)
4. **Progressive Enhancement**: Generate panels on-demand when user views scene in "webtoon mode"

---

## Future Enhancements

### Phase 2: Advanced Features

1. **Character Model Sheets**
   - Generate 360° turnaround character images
   - Use as reference for panel consistency
   - Store in character visual profile

2. **Panel-to-Panel Animation**
   - Subtle motion between panels (parallax scrolling)
   - Character eye movement
   - Breathing animation

3. **Interactive Dialogue**
   - Click to reveal speech bubbles sequentially
   - Voice acting audio clips
   - Sound effect audio

4. **AI-Assisted Editing**
   - "Regenerate this panel" button
   - Adjust camera angle without full regeneration
   - Swap character expressions

5. **Export to Standard Formats**
   - Export as .CBZ (comic book archive)
   - Export as video (animated panels)
   - Export as Instagram reel format

### Phase 3: Platform Features

1. **Webtoon Episode Builder**
   - Combine multiple scenes into a single episode
   - Automatic chapter breaks and cliffhangers
   - Episode thumbnail generation

2. **Reader Analytics**
   - Track which panels readers spend time on
   - Identify drop-off points
   - A/B test different panel compositions

3. **Monetization**
   - "Fast pass" for early panel access
   - HD panel downloads
   - Behind-the-scenes storyboard access

---

## References

### Research & Best Practices

1. **AI Script Generation**:
   - Perchance AI Script Generator: https://perchance.org/ai-script-generator
   - Squibler Free AI Script Generator: https://www.squibler.io/ai-script-generator/

2. **Webtoon Storyboarding**:
   - LTX Studio AI Storyboard Generator: https://ltx.studio/platform/ai-storyboard-generator
   - Medium: "Team BEIAI and how to make an AI webcomic/webtoon": https://medium.com/loool/team-beiai-and-how-to-make-an-ai-webcomic-webtoon-7b55e2aa55a

3. **Technical Implementation**:
   - MIT Technology Review: "Lore Machine's generative AI to turn story into comic": https://www.technologyreview.com/2024/03/05/1089458/
   - Medium: "Advanced Storyboarding with AI": https://medium.com/better-marketing/advanced-storyboarding-with-ai-d74e841dc3ae

### Internal Documentation

- [Image Generation Guide](./image-generation-guide.md)
- [Image Optimization](./image-optimization.md)
- [Scene Evaluation API](./scene-evaluation-api.md)
- [HNS Schema Documentation](../src/types/hns.ts)

---

## Appendix: Example Workflow

### Complete Example: From Scene Text to Webtoon Panels

**Input Scene** (HNSScene):
```
Title: "The Interrogation"
Content: "Detective Sarah Chen stepped into the interrogation room,
the fluorescent lights casting harsh shadows across Marcus Bell's face.
He sat perfectly still, hands folded on the metal table, eyes following
her every movement. She placed a manila folder between them, the sound
echoing in the small space.

'Mr. Bell,' she began, her voice level despite the tension coiling
in her chest. 'We have security footage placing you at the gallery
fifteen minutes before the alarm was triggered.'

Marcus's lips curved into a slight smile. 'I was admiring the art,
Detective. Is that a crime?'

Sarah leaned forward, her fingers drumming once on the folder.
'The stolen Monet was your favorite piece, wasn't it? You mentioned
it in your interview last month. How it reminded you of your
grandmother's garden.'

For the first time, a flicker of something—surprise? fear?—crossed
Marcus's face. His composed mask slipped for just a fraction of
a second before returning. But Sarah had seen it. And they both
knew that she had."

Goal: Get Marcus to reveal his connection to the stolen painting
Conflict: Marcus is skilled at deflecting questions and maintaining composure
Outcome: failure_with_discovery (Sarah doesn't get a confession, but confirms his emotional connection)
```

**Generated Screenplay** (6 panels):

```json
{
  "scene_id": "scene_12345",
  "scene_title": "The Interrogation",
  "total_panels": 6,
  "panels": [
    {
      "panel_number": 1,
      "shot_type": "establishing_shot",
      "description": "Wide shot of a stark interrogation room from above, showing the entire small space with metal table in center",
      "characters_visible": ["detective_sarah", "marcus_bell"],
      "character_poses": {
        "detective_sarah": "entering through door, hand on doorknob, professional stance",
        "marcus_bell": "sitting at table, hands folded, perfectly still, watchful"
      },
      "setting_focus": "The entire interrogation room with harsh fluorescent overhead lighting",
      "lighting": "harsh fluorescent overhead light casting strong shadows downward",
      "camera_angle": "birds eye view, looking down at 45 degree angle",
      "dialogue": [],
      "sfx": [{ "text": "CLANK", "emphasis": "normal" }],
      "gutter_after": 400,
      "mood": "tense, institutional, cold"
    },
    {
      "panel_number": 2,
      "shot_type": "medium_shot",
      "description": "Medium shot of Sarah placing the manila folder on the table, focus on the folder hitting the metal surface",
      "characters_visible": ["detective_sarah", "marcus_bell"],
      "character_poses": {
        "detective_sarah": "standing, leaning slightly forward, placing folder down with deliberate motion",
        "marcus_bell": "seated, eyes locked on the folder, subtle tension in shoulders"
      },
      "setting_focus": "The metal interrogation table, cold and reflective",
      "lighting": "harsh overhead light creating strong contrast, shadows under eyes",
      "camera_angle": "eye level, slightly favoring Sarah's perspective",
      "dialogue": [],
      "sfx": [{ "text": "THUD", "emphasis": "large" }],
      "gutter_after": 200,
      "mood": "confrontational, building tension"
    },
    {
      "panel_number": 3,
      "shot_type": "close_up",
      "description": "Close-up on Sarah's face as she speaks, professional but intense",
      "characters_visible": ["detective_sarah"],
      "character_poses": {
        "detective_sarah": "speaking, eyes focused, jaw set with determination"
      },
      "setting_focus": "Blurred background of interrogation room wall",
      "lighting": "harsh side lighting emphasizing her determined expression",
      "camera_angle": "straight on, eye level",
      "dialogue": [
        {
          "character_id": "detective_sarah",
          "text": "We have footage placing you at the gallery fifteen minutes before the alarm.",
          "tone": "level, professional"
        }
      ],
      "sfx": [],
      "gutter_after": 200,
      "mood": "accusatory, controlled intensity"
    },
    {
      "panel_number": 4,
      "shot_type": "close_up",
      "description": "Close-up on Marcus's face showing his slight, confident smile",
      "characters_visible": ["marcus_bell"],
      "character_poses": {
        "marcus_bell": "slight smile, eyes calm and calculating"
      },
      "setting_focus": "Dark background, focus entirely on his face",
      "lighting": "dramatic side lighting creating mystery and intrigue",
      "camera_angle": "straight on, eye level, intimate",
      "dialogue": [
        {
          "character_id": "marcus_bell",
          "text": "I was admiring the art, Detective. Is that a crime?",
          "tone": "smooth, deflecting"
        }
      ],
      "sfx": [],
      "gutter_after": 300,
      "mood": "smug, controlled, deflective"
    },
    {
      "panel_number": 5,
      "shot_type": "medium_shot",
      "description": "Medium shot showing Sarah leaning forward, fingers drumming once on the folder, Marcus watching from across table",
      "characters_visible": ["detective_sarah", "marcus_bell"],
      "character_poses": {
        "detective_sarah": "leaning forward aggressively, one hand drumming on folder, eyes locked on Marcus",
        "marcus_bell": "seated, posture still controlled but subtle shift backward"
      },
      "setting_focus": "The interrogation table between them, creating visual barrier",
      "lighting": "harsh overhead creating shadows between them",
      "camera_angle": "low angle favoring Sarah's power position",
      "dialogue": [
        {
          "character_id": "detective_sarah",
          "text": "The Monet was your favorite. It reminded you of your grandmother's garden.",
          "tone": "pointed, knowing"
        }
      ],
      "sfx": [{ "text": "TAP", "emphasis": "normal" }],
      "gutter_after": 600,
      "mood": "pressure building, psychological warfare"
    },
    {
      "panel_number": 6,
      "shot_type": "extreme_close_up",
      "description": "Extreme close-up on Marcus's eyes showing the momentary crack in his composure, widening slightly",
      "characters_visible": ["marcus_bell"],
      "character_poses": {
        "marcus_bell": "eyes widening in surprise/fear for a brief moment"
      },
      "setting_focus": "Complete darkness, only his eyes visible",
      "lighting": "dramatic spotlight effect on eyes only",
      "camera_angle": "extreme close-up, directly on eyes",
      "dialogue": [],
      "sfx": [],
      "gutter_after": 800,
      "mood": "revelation, mask slipping, vulnerability exposed"
    }
  ],
  "pacing_notes": "Build from establishing wide shot to increasing intimacy and psychological pressure, culminating in extreme close-up revelation. Large gutter before final panel creates suspenseful pause.",
  "narrative_arc": "Visual progression from cold institutional setting → direct confrontation → psychological pressure → momentary victory for Sarah as she sees through Marcus's facade"
}
```

**Generated Images**: 6 DALL-E 3 images (1792x1024 each) with consistent character appearances

**Final Output**: Vertical-scroll webtoon ready for reading with automatic speech bubble overlays and SFX text

---

## Conclusion

This specification provides a complete roadmap for implementing webtoon panel generation from narrative scene text. The system leverages existing Fictures infrastructure (HNS schema, image generation, evaluation) while introducing new capabilities specifically optimized for the vertical-scroll webtoon format.

**Key Advantages**:
- ✅ Fully automated scene-to-panel conversion
- ✅ Character consistency through detailed prompt engineering
- ✅ Professional webtoon formatting (gutters, pacing, shot variety)
- ✅ Integration with existing story generation pipeline
- ✅ Cost-effective (~$0.41 per scene)
- ✅ Extensible for future enhancements (animation, interactivity)

**Next Steps**:
1. Implement core `webtoon-panel-generator.ts` service
2. Create database schema and migration
3. Build API endpoints
4. Develop WebtoonViewer UI component
5. Test with sample scenes
6. Deploy and iterate based on user feedback

---

**Document Status**: Ready for Implementation
**Estimated Development Time**: 2-3 weeks (1 developer)
**Priority**: Medium (Enhancement, not critical path)
