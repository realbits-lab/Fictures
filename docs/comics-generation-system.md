# Comics Generation System Documentation

## Table of Contents
1. [What Are Comics in Fictures?](#what-are-comics-in-fictures)
2. [Complete Generation Pipeline](#complete-generation-pipeline)
3. [Screenplay Text Generation](#screenplay-text-generation)
4. [Image Generation Process](#image-generation-process)
5. [Storage Architecture](#storage-architecture)
6. [Technical Implementation](#technical-implementation)
7. [Panel Layout System](#panel-layout-system)

---

## What Are Comics in Fictures?

### Definition

**Comics are separate, sequential image panels** generated from scene narrative text. Unlike traditional comics where artists draw each panel manually, Fictures uses AI to:

1. **Analyze** narrative scene text (prose/novel format)
2. **Convert** narrative into visual screenplay specifications
3. **Generate** individual panel images using AI image generation
4. **Store** each panel as separate images with metadata

### Key Characteristics

- **Source**: Scene narrative text (novel/prose format)
- **Output**: 8-12 separate image panels per scene
- **Format**: 16:9 widescreen images (1792×1024 pixels)
- **Layout**: Vertical scrolling (mobile-optimized)
- **Components**: Each panel includes:
  - AI-generated image (DALL-E 3)
  - Dialogue bubbles (optional)
  - Sound effects (SFX)
  - Dynamic spacing (gutters)

### Example Transformation

**Input (Scene Narrative Text)**:
```
Maya stood in the server room, her hands trembling as she stared at the
glowing terminal. The memory fragments flickered on the screen—faces she
couldn't place, moments she couldn't remember.

"This can't be real," she whispered, her voice shaking.

The AI's holographic form materialized beside her, its expression
unreadable. "Your memories were archived, Maya. For your protection."

"Protection?" She spun to face it, anger replacing fear. "You erased my life!"
```

**Output (10 Comic Panels - Example)**:

**Panel 1: Establishing Shot**
- Image: Wide shot of futuristic server room, Maya standing before glowing terminal
- Dialogue: None
- SFX: [HUM] (server ambient sound)
- Visual Description: "Professional Science Fiction comic panel, establishing shot, eye level. SCENE: Futuristic server room with glowing terminals and holographic displays. CHARACTERS: Maya (determined woman, tech jacket, short dark hair) standing before large terminal screen showing memory fragments..."

**Panel 2: Wide Shot**
- Image: Maya and AI hologram in conversation, medium distance
- Dialogue:
  - AI: "Your memories were archived, Maya. For your protection."
  - Maya: "Protection?"
- SFX: None
- Visual Description: "Professional Science Fiction comic panel, wide shot, eye level. SCENE: Same server room, focus on interaction space between Maya and AI. CHARACTERS: Maya facing holographic AI projection..."

**Panel 3: Close-Up**
- Image: Close-up of Maya's face, intense emotion
- Dialogue:
  - Maya: "You erased my life!"
- SFX: None
- Visual Description: "Professional Science Fiction comic panel, close up shot, low angle. SCENE: Blurred server room background. CHARACTERS: Maya's face filling frame, eyes blazing with anger..."

---

## Complete Generation Pipeline

### Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    NARRATIVE SCENE TEXT                         │
│  (Novel-format prose stored in scenes.content)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               STEP 1: SCREENPLAY CONVERSION                     │
│  AI analyzes narrative and generates panel specifications       │
│  - Panel count (1-3)                                            │
│  - Shot types (establishing, wide, close-up, etc.)              │
│  - Camera angles (eye level, low angle, high angle, etc.)       │
│  - Character positions and poses                                │
│  - Dialogue extraction                                          │
│  - SFX identification                                           │
│  - Lighting specifications                                      │
│  - Visual descriptions                                          │
│                                                                 │
│  Model: OpenAI GPT-4o-mini via Vercel AI Gateway               │
│  Input: Scene narrative + characters + setting + genre          │
│  Output: Structured ComicScreenplay JSON                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            STEP 2: PANEL IMAGE GENERATION                       │
│  For each panel specification:                                  │
│  1. Build detailed image prompt from screenplay                 │
│  2. Generate image via DALL-E 3                                 │
│  3. Handle content filter errors (auto-retry with sanitization) │
│  4. Generate 18 optimized variants (AVIF/WebP/JPEG)            │
│  5. Upload all images to Vercel Blob Storage                    │
│  6. Store panel data in PostgreSQL database                     │
│                                                                 │
│  Model: OpenAI DALL-E 3 (1792×1024, 16:9)                      │
│  Optimization: Sharp (18 variants per panel)                    │
│  Storage: Vercel Blob Storage                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│             STEP 3: DATABASE STORAGE                            │
│  Each panel stored in comic_panels table:                       │
│  - Panel number (order)                                         │
│  - Shot type                                                    │
│  - Image URL (original 1792×1024)                              │
│  - Image variants (18 optimized versions)                       │
│  - Dialogue JSON                                                │
│  - SFX JSON                                                     │
│  - Gutter spacing (vertical space after panel)                  │
│  - Metadata (prompt, characters, camera angle, mood)            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 4: VERTICAL LAYOUT ASSEMBLY                   │
│  Comics reader page assembles panels into vertical scroll:      │
│  - Panel 1 (y: 0)                                               │
│  - Gutter 1 (200-1000px spacing)                               │
│  - Panel 2 (y: panel1_height + gutter1)                        │
│  - Gutter 2                                                     │
│  - Panel 3                                                      │
│                                                                 │
│  Total Height: Sum of all panel heights + gutters              │
│  Mobile Optimization: Responsive sizing, optimized images       │
└─────────────────────────────────────────────────────────────────┘
```

### Processing Time

**Average per Scene:**
- Screenplay conversion: 10-20 seconds
- Image generation per panel: 10-15 seconds (DALL-E 3)
- Image optimization per panel: 0.5 seconds (4 variants: AVIF/JPEG × 2 sizes)
- Total for 10 panels (average): **2-2.5 minutes**
- Total for 12 panels (maximum): **2.5-3 minutes**

**Note:** Using optimized 4-variant system (AVIF + JPEG, mobile 1x/2x only). Desktop uses mobile 2x with 1.5x upscaling for acceptable quality. See [Image Optimization Guide](./image-optimization.md).

---

## Screenplay Text Generation

### Purpose

Convert unstructured narrative prose into **structured visual specifications** that can be used to generate comic panel images.

### AI Model Configuration

```javascript
Model: OpenAI GPT-4o-mini
API: Vercel AI Gateway
Temperature: 0.7 (balanced creativity)
Schema Validation: Zod (runtime type checking)
```

### Input Data Structure

```typescript
{
  scene: {
    scene_title: string,      // "The Glitch in the Machine"
    content: string,           // Full narrative text (1000-3000 words)
    goal: string,              // "Maya discovers the truth"
    conflict: string,          // "AI vs Maya's autonomy"
    outcome: string,           // "Maya confronts the AI"
    emotional_shift: {
      from: string,            // "confusion"
      to: string               // "anger"
    }
  },
  characters: [
    {
      name: string,            // "Maya"
      role: string,            // "protagonist"
      appearance: string,      // "30s woman, tech jacket..."
      motivations: string      // "Reclaim her memories"
    }
  ],
  setting: {
    name: string,              // "Server Room"
    description: string,       // "Futuristic data center..."
    atmosphere: string         // "cold, technological"
  },
  storyGenre: string,          // "Science Fiction"
  targetPanelCount: number     // 1-3 (maximum 3 panels)
}
```

### AI Prompt Engineering

The AI receives a **detailed instruction prompt** with:

1. **Scene Information**: Title, goal, conflict, outcome, emotional arc
2. **Narrative Content**: Full scene text
3. **Character Details**: Physical appearance, personality, motivations
4. **Setting Details**: Location description, atmosphere, mood
5. **Genre**: Story genre for visual style matching

**Key Instructions for AI:**

```
1. Break narrative into 8-12 visual panels (TARGET: 10 PANELS)
   - Aim for 10 panels for optimal pacing
   - Use more panels (up to 12) for complex action sequences
   - Use fewer panels (minimum 8) for quiet, reflective moments

2. Shot Type Distribution (for 8-12 panels):
   - 1 establishing_shot (scene opening or major location change)
   - 2-3 wide_shot (show full action, multiple characters, environment)
   - 3-5 medium_shot (main storytelling, conversations, interactions)
   - 2-3 close_up (emotional beats, reactions, important details)
   - 0-1 extreme_close_up (climactic moments, critical details)
   - 0-1 over_shoulder or dutch_angle (special moments, tension)

3. Each panel must SHOW action, not tell (minimize narration)

4. Visual Variety and Pacing:
   - Vary shot types to maintain visual interest
   - Use establishing shots sparingly (scene openings, major transitions)
   - Alternate between wide/medium shots for rhythm
   - Save close-ups for emotional peaks
   - Build tension with shot progression (wide → medium → close-up)

5. Maintain character consistency - reference same physical traits across all panels

6. Include dialogue (max 2-3 bubbles per panel, 100 chars each)

7. Add sound effects for impactful moments

8. Set gutter spacing for pacing control:
   - 200-300px: continuous action (same beat, rapid sequence)
   - 400-600px: beat changes (next moment, dialogue transition)
   - 800-1000px: major transitions (location change, time jump)

9. Ensure each panel advances the story - no redundant panels
```

### Output Schema

```typescript
ComicScreenplay = {
  scene_id: string,
  scene_title: string,
  total_panels: number,      // 8-12 (recommended: 10)
  panels: [
    {
      panel_number: number,
      shot_type: 'establishing_shot' | 'wide_shot' | 'medium_shot' |
                 'close_up' | 'extreme_close_up' | 'over_shoulder' |
                 'dutch_angle',
      description: string,    // Detailed visual description for DALL-E
      characters_visible: string[],  // Array of character IDs
      character_poses: {
        [character_id]: string  // "standing with arms crossed, angry"
      },
      setting_focus: string,  // "terminal screen in foreground"
      lighting: string,       // "harsh overhead fluorescent"
      camera_angle: string,   // "low angle" | "eye level" | "high angle"
      dialogue: [
        {
          character_id: string,
          text: string,       // Max 100 characters
          tone: string        // "angry" | "whispered" | "shouting"
        }
      ],
      sfx: [
        {
          text: string,       // "CRASH" | "HUM" | "WHOOSH"
          emphasis: 'normal' | 'large' | 'dramatic'
        }
      ],
      gutter_after: number,   // 200-1000 pixels
      mood: string            // "tense" | "calm" | "climactic"
    }
  ],
  pacing_notes: string,
  narrative_arc: string       // How panels collectively tell story
}
```

### Example Screenplay Output

```json
{
  "scene_id": "s25ARzn_TttzuO9r5lvX3",
  "scene_title": "The Glitch in the Machine",
  "total_panels": 3,
  "panels": [
    {
      "panel_number": 1,
      "shot_type": "establishing_shot",
      "description": "Wide view of futuristic server room. Maya stands before massive glowing terminal displaying memory fragments. Rows of servers recede into darkness. Cold blue lighting.",
      "characters_visible": ["char_maya_001"],
      "character_poses": {
        "char_maya_001": "standing with back to camera, hands at sides, looking up at terminal screen"
      },
      "setting_focus": "massive terminal screen showing flickering memory data",
      "lighting": "cold blue glow from screens, harsh overhead lights creating shadows",
      "camera_angle": "eye level, slight wide angle to show scale of room",
      "dialogue": [],
      "sfx": [
        {
          "text": "HUM",
          "emphasis": "normal"
        }
      ],
      "gutter_after": 600,
      "mood": "ominous"
    },
    {
      "panel_number": 2,
      "shot_type": "wide_shot",
      "description": "Maya facing holographic AI projection. AI appears as translucent blue humanoid form. Maya's expression shifts from confusion to realization. Server room visible in background.",
      "characters_visible": ["char_maya_001", "char_ai_001"],
      "character_poses": {
        "char_maya_001": "turning toward AI, hands gesturing questioningly",
        "char_ai_001": "holographic form standing calmly, arms at sides"
      },
      "setting_focus": "space between Maya and AI hologram",
      "lighting": "AI hologram emits soft blue glow, backlighting from servers",
      "camera_angle": "eye level, framing both characters in conversation",
      "dialogue": [
        {
          "character_id": "char_ai_001",
          "text": "Your memories were archived, Maya. For your protection.",
          "tone": "calm"
        },
        {
          "character_id": "char_maya_001",
          "text": "Protection?",
          "tone": "confused"
        }
      ],
      "sfx": [],
      "gutter_after": 400,
      "mood": "tense"
    },
    {
      "panel_number": 3,
      "shot_type": "close_up",
      "description": "Tight close-up of Maya's face. Eyes wide with anger, jaw clenched. Server room blurred in background. Dramatic lighting emphasizes emotion.",
      "characters_visible": ["char_maya_001"],
      "character_poses": {
        "char_maya_001": "face contorted with anger, leaning forward aggressively"
      },
      "setting_focus": "Maya's face, background out of focus",
      "lighting": "dramatic side lighting creating strong shadows on face",
      "camera_angle": "low angle looking up, emphasizing power and intensity",
      "dialogue": [
        {
          "character_id": "char_maya_001",
          "text": "You erased my life!",
          "tone": "shouting"
        }
      ],
      "sfx": [],
      "gutter_after": 800,
      "mood": "climactic"
    }
  ],
  "pacing_notes": "Opens with wide establishing shot to set scene, transitions to conversation, culminates in emotional close-up. Increasing gutter spacing builds tension.",
  "narrative_arc": "Discovery (panel 1) → Confrontation (panel 2) → Emotional Peak (panel 3)"
}
```

---

## Image Generation Process

### Overview

Each panel specification from the screenplay is transformed into a **detailed image prompt** and generated using **OpenAI DALL-E 3**.

### Image Prompt Construction

The system builds a comprehensive prompt by combining:

1. **Genre & Shot Type**: "Professional Science Fiction comic panel, establishing shot, eye level"
2. **Scene Description**: Setting focus and atmosphere
3. **Character Descriptions**: Physical traits, poses, expressions
4. **Lighting**: Mood-appropriate lighting setup
5. **Action**: What's happening in the panel
6. **Mood**: Emotional tone
7. **Style Instructions**: Comic art style specifications

### Prompt Template

```
Professional {genre} comic panel, {shot_type}, {camera_angle}.

SCENE: {setting_focus}. {setting_atmosphere}.

CHARACTERS: {character_descriptions_with_poses}

LIGHTING: {lighting}

ACTION: {description}

MOOD: {mood}

Style: Clean comic linework, vibrant colors, semi-realistic proportions,
16:9 widescreen format, professional {genre} comic art style, cinematic
composition, similar to Naver COMIC quality.

CRITICAL: Maintain exact character appearances - {key_physical_traits}
```

### Example Prompt (Panel 1)

```
Professional Science Fiction comic panel, establishing_shot, eye level.

SCENE: massive terminal screen showing flickering memory data. cold,
technological atmosphere.

CHARACTERS: Maya (30s woman, tech jacket with utility pockets, short dark
hair, determined expression, athletic build) - standing with back to camera,
hands at sides, looking up at terminal screen

LIGHTING: cold blue glow from screens, harsh overhead lights creating shadows

ACTION: Wide view of futuristic server room. Maya stands before massive
glowing terminal displaying memory fragments. Rows of servers recede into
darkness. Cold blue lighting.

MOOD: ominous

Style: Clean comic linework, vibrant colors, semi-realistic proportions,
16:9 widescreen format, professional Science Fiction comic art style,
cinematic composition, similar to Naver COMIC quality.

CRITICAL: Maintain exact character appearances - tech jacket, short dark
hair, athletic build
```

### DALL-E 3 Configuration

```javascript
Model: DALL-E 3
Size: 1792×1024 (16:9 widescreen)
Quality: standard
Style: vivid (for comics) or natural (for realistic)
Output Format: PNG
```

### Content Filter Handling

DALL-E 3 has safety filters that sometimes reject prompts containing:
- Emotional distress terms ("hurt", "pain", "terrified")
- Physical descriptions ("trembling", "tears", "slumped")
- Intense situations

**Automatic Retry Logic** (3 attempts):

**Attempt 1**: Use original prompt
**Attempt 2**: Sanitize sensitive terms
- "distressed" → "concerned"
- "hurt" → "affected"
- "pain" → "discomfort"
- "erased" → "reset"
- "scared" → "worried"
- "terrified" → "anxious"
- "tears" → "eyes glistening"

**Attempt 3**: Generic safe fallback
```
Professional {genre} comic panel, {shot_type}, cinematic composition.
Characters in a futuristic setting with neutral expressions, clean modern
environment, balanced lighting.
```

### Image Optimization

After DALL-E generates the base image (1792×1024 PNG), the system automatically creates **4 optimized variants** using a mobile-first approach:

**Formats**: AVIF (best compression), JPEG (universal fallback)
**Sizes** (16:9 aspect ratio):
- Mobile 1x: 640×360 (standard density)
- Mobile 2x: 1280×720 (retina displays + desktop fallback)

**Total**: 2 formats × 2 sizes = **4 variants per panel**

**Desktop Strategy**: Comics are mobile-first content. Desktop uses mobile 2x (1280×720) with acceptable 1.5x upscaling. No separate desktop sizes needed.

### Generation Performance

**Per Panel**:
- DALL-E generation: 10-15 seconds
- Optimization (4 variants): 0.5 seconds (80% faster than 18-variant system)
- Upload to Vercel Blob: 0.5 seconds
- Database storage: <100ms

**Total**: ~11-16 seconds per panel

**Rate Limiting**: 2-second delay between panels to avoid API throttling

**System Improvements**:
- 80% faster optimization (4 variants vs 18 variants)
- 78% fewer images generated per scene
- 66% storage savings per scene

---

## Storage Architecture

### Vercel Blob Storage

All comic panel images are stored in **Vercel Blob Storage** (cloud object storage).

### Storage Structure

```
Vercel Blob Storage
└── stories/
    └── {story_id}/
        ├── story/              # Story cover images (1 per story)
        ├── character/          # Character portraits (1 per character)
        ├── setting/            # Setting visuals (1 per setting)
        ├── scene/              # Scene illustrations (1 per scene)
        └── comics/             # Comic panels (first-class content type)
            └── {scene_id}/     # Group by scene for multi-panel sequences
                ├── original/
                │   └── panel-1.png                    (1792×1024 original)
                ├── avif/
                │   ├── 640x360/
                │   │   └── panel-1.avif               (Mobile 1x)
                │   └── 1280x720/
                │       └── panel-1.avif               (Mobile 2x / Desktop)
                └── jpeg/
                    ├── 640x360/
                    │   └── panel-1.jpeg               (Mobile 1x fallback)
                    └── 1280x720/
                        └── panel-1.jpeg               (Mobile 2x / Desktop fallback)

                # 4 variants per panel (AVIF + JPEG × 2 sizes)
                # Panels 2-12 follow same structure
```

**Storage Optimization**: 4 variants vs 18 variants = **78% reduction per panel**

### URL Format

```
Original Image:
https://[blob-id].public.blob.vercel-storage.com/stories/3JpLdcXb5hQK7zy5g3QIj/comics/original/panel-1.png

Optimized Variants:
https://[blob-id].public.blob.vercel-storage.com/stories/3JpLdcXb5hQK7zy5g3QIj/comics/avif/640x360/panel-1.avif
https://[blob-id].public.blob.vercel-storage.com/stories/3JpLdcXb5hQK7zy5g3QIj/comics/avif/1280x720/panel-1.avif
https://[blob-id].public.blob.vercel-storage.com/stories/3JpLdcXb5hQK7zy5g3QIj/comics/jpeg/640x360/panel-1.jpeg
https://[blob-id].public.blob.vercel-storage.com/stories/3JpLdcXb5hQK7zy5g3QIj/comics/jpeg/1280x720/panel-1.jpeg
```

### PostgreSQL Database Storage

Panel metadata is stored in the `comic_panels` table:

```sql
CREATE TABLE comic_panels (
  id TEXT PRIMARY KEY,                    -- Unique panel ID (nanoid)
  scene_id TEXT NOT NULL,                 -- Foreign key to scenes table
  panel_number INTEGER NOT NULL,          -- 1-12 panels per scene
  shot_type shot_type NOT NULL,           -- enum: establishing_shot, etc.
  image_url TEXT,                         -- Original image URL (1792×1024)
  image_variants JSON,                    -- 4 optimized variants metadata (AVIF/JPEG × 2 sizes)
  dialogue JSON,                          -- Array of dialogue objects
  sfx JSON,                               -- Array of SFX objects
  gutter_after INTEGER,                   -- Vertical spacing (200-1000px)
  metadata JSON,                          -- Prompt, characters, camera angle
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
);

CREATE INDEX idx_comic_panels_scene ON comic_panels(scene_id);
CREATE INDEX idx_comic_panels_order ON comic_panels(scene_id, panel_number);
```

### Example Database Record

```json
{
  "id": "panel_abc123xyz",
  "scene_id": "s25ARzn_TttzuO9r5lvX3",
  "panel_number": 1,
  "shot_type": "establishing_shot",
  "image_url": "https://[...]/panel-1-original.png",
  "image_variants": {
    "imageId": "panel_abc123xyz",
    "originalUrl": "https://[...]/original/panel-1.png",
    "variants": [
      {
        "format": "avif",
        "device": "mobile",
        "resolution": "1x",
        "width": 640,
        "height": 360,
        "url": "https://[...]/avif/640x360/panel-1.avif",
        "size": 12000
      },
      {
        "format": "avif",
        "device": "mobile",
        "resolution": "2x",
        "width": 1280,
        "height": 720,
        "url": "https://[...]/avif/1280x720/panel-1.avif",
        "size": 25000
      },
      {
        "format": "jpeg",
        "device": "mobile",
        "resolution": "1x",
        "width": 640,
        "height": 360,
        "url": "https://[...]/jpeg/640x360/panel-1.jpeg",
        "size": 35000
      },
      {
        "format": "jpeg",
        "device": "mobile",
        "resolution": "2x",
        "width": 1280,
        "height": 720,
        "url": "https://[...]/jpeg/1280x720/panel-1.jpeg",
        "size": 65000
      }
      // Total: 4 variants (AVIF + JPEG × 2 sizes)
    ],
    "generatedAt": "2025-10-26T10:47:54Z"
  },
  "dialogue": [],
  "sfx": [
    {
      "text": "HUM",
      "emphasis": "normal"
    }
  ],
  "gutter_after": 600,
  "metadata": {
    "prompt": "Professional Science Fiction comic panel...",
    "characters_visible": ["char_maya_001"],
    "camera_angle": "eye level",
    "mood": "ominous",
    "generated_at": "2025-10-26T10:47:54Z"
  },
  "created_at": "2025-10-26T10:47:54Z",
  "updated_at": "2025-10-26T10:47:54Z"
}
```

### Storage Costs & Optimization

**Per Scene (10 panels average, 4-variant system)**:
- Original images: 10 × ~500KB = ~5MB (stored but rarely accessed)
- Optimized variants: 10 × 4 × ~34KB avg = ~1.37MB (primary delivery)
- **Total storage**: ~6.37MB per scene
- **Actual bandwidth**: ~1.37MB (variants only)

**Comparison with 18-variant system**:
- OLD (18 variants): 10 panels × 18 × ~100KB = ~18MB per scene
- NEW (4 variants): 10 panels × 4 × ~34KB = ~1.37MB per scene
- **Savings**: ~93% bandwidth reduction for actual delivery
- **Storage savings**: 66% total storage reduction

**Optimization Benefits**:
- AVIF format: 50-70% smaller than JPEG at same quality
- Mobile-first: Desktop uses mobile 2x (1280×720) with acceptable upscaling
- Responsive sizing: Load only what's needed for device
- CDN delivery: Fast global access via Vercel Edge Network
- Lazy loading: Images load as user scrolls (below-fold panels)
- Format fallback: Automatic JPEG fallback for older browsers

---

## Technical Implementation

### File Structure

```
src/
├── lib/
│   ├── ai/
│   │   ├── screenplay-converter.ts       # Narrative → Screenplay
│   │   └── comic-panel-generator.ts      # Main orchestrator
│   ├── services/
│   │   ├── image-generation.ts           # DALL-E 3 wrapper
│   │   ├── image-optimization.ts         # 18 variant generation
│   │   ├── comic-layout.ts               # Layout calculations
│   │   └── character-consistency.ts      # Character prompt building
│   └── db/
│       └── schema.ts                      # Database schema
├── app/
│   ├── api/
│   │   └── comic/
│   │       └── generate-panels/
│   │           └── route.ts               # Generation API endpoint
│   └── comics/
│       └── [id]/
│           └── page.tsx                   # Comics reader page
└── scripts/
    ├── generate-comics-direct.mjs         # CLI generation tool
    └── check-comic-panels.mjs             # Verification tool
```

### API Endpoint

**POST /api/comic/generate-panels**

**Request**:
```json
{
  "sceneId": "s25ARzn_TttzuO9r5lvX3",
  "targetPanelCount": 3,
  "regenerate": false
}
```

**Response** (Server-Sent Events):
```
data: {"type":"start","message":"Starting panel generation..."}

data: {"type":"progress","current":0,"total":100,"status":"Converting scene to screenplay..."}

data: {"type":"progress","current":20,"total":100,"status":"Screenplay ready: 3 panels"}

data: {"type":"progress","current":20,"total":100,"status":"Generating panel 1/3: establishing_shot"}

data: {"type":"progress","current":43,"total":100,"status":"Generating panel 2/3: wide_shot"}

data: {"type":"progress","current":66,"total":100,"status":"Generating panel 3/3: close_up"}

data: {"type":"progress","current":100,"total":100,"status":"Panel generation complete!"}

data: {"type":"complete","result":{...}}
```

### Authentication

Requires **dual authentication** (session OR API key):
- NextAuth.js session (browser)
- API key (scripts, external tools)

Required scope: `ai:use`

### Error Handling

1. **Schema Validation Errors**: AI output doesn't match Zod schema
   - Retry with stricter prompt
   - Add default values for optional fields

2. **Content Filter Errors**: DALL-E rejects prompt
   - Automatic retry (3 attempts)
   - Progressive prompt sanitization
   - Generic fallback on final attempt

3. **Rate Limit Errors**: Too many API requests
   - 2-second delay between panels
   - Exponential backoff on failures

4. **Storage Errors**: Blob upload failures
   - Retry upload 3 times
   - Clean up partial uploads on failure

---

## Panel Layout System

### Vertical Scrolling

Comics are designed for **mobile-first vertical scrolling**:

```
┌─────────────────────┐
│                     │
│     Panel 1         │  ← 1024px height
│                     │
├─────────────────────┤
│   Gutter (600px)    │  ← Dynamic spacing
├─────────────────────┤
│                     │
│     Panel 2         │  ← 1024px height
│                     │
├─────────────────────┤
│   Gutter (400px)    │
├─────────────────────┤
│                     │
│     Panel 3         │  ← 1024px height
│                     │
├─────────────────────┤
│   Gutter (800px)    │
└─────────────────────┘

Total Height = (3 × 1024) + (600 + 400 + 800) = 4872px
```

### Gutter Spacing

**Gutters** are vertical spaces between panels that control pacing:

- **200px**: Continuous action (same moment, rapid sequence)
- **400-600px**: Beat change (next moment, dialogue transition)
- **800-1000px**: Scene transition (location change, time jump)

### Responsive Sizing

```javascript
// Desktop (1792px container)
panel_width: 1792px
panel_height: 1024px
scale: 1.0

// Tablet (1024px viewport)
panel_width: 1024px
panel_height: 585px
scale: 0.571

// Mobile (375px viewport)
panel_width: 375px
panel_height: 214px
scale: 0.209
```

### Reading Time Estimation

```javascript
Base time per panel: 3 seconds
+ Dialogue reading: (word_count / 200 words per minute) × 60
+ SFX processing: 1 second (if present)

Example (10 panels):
- Panel 1: 3s (no dialogue) = 3s
- Panel 2: 3s + 8 words dialogue = 3s + 2.4s = 5.4s
- Panel 3: 3s + 12 words dialogue = 3s + 3.6s = 6.6s
- Panel 4-9: Average 5s per panel = 30s
- Panel 10: 3s + 5 words dialogue = 3s + 1.5s = 4.5s
Total: 49.5s ≈ 50 seconds per scene
```

---

## Summary

### What Comics Are
Comics in Fictures are **AI-generated sequential image panels** created from narrative scene text, optimized for vertical scrolling on mobile devices.

### How They're Generated
1. **Narrative** → AI screenplay conversion (GPT-4o-mini)
2. **Screenplay** → Detailed image prompts
3. **Prompts** → Panel images (DALL-E 3, 1792×1024)
4. **Images** → 18 optimized variants (AVIF/WebP/JPEG)
5. **Upload** → Vercel Blob Storage
6. **Store** → PostgreSQL database (metadata + URLs)

### Where They're Stored
- **Images**: Vercel Blob Storage (cloud object storage)
  - Original: 1792×1024 PNG
  - Variants: 18 responsive/optimized images
- **Metadata**: PostgreSQL database (comic_panels table)
  - Panel specs, dialogue, SFX, layout
  - Image URLs and optimization data

### Key Technologies
- **Text Generation**: OpenAI GPT-4o-mini (screenplay)
- **Image Generation**: OpenAI DALL-E 3 (panels, 1792×1024)
- **Image Optimization**: Sharp (4 variants: AVIF/JPEG × 2 sizes)
- **Storage**: Vercel Blob + PostgreSQL
- **Format**: 16:9 widescreen, vertical scroll, mobile-first

### Performance
- **Generation Time**: 2-2.5 minutes per scene (10 panels average)
  - 80% faster optimization with 4-variant system
- **Storage Size**: ~6.4MB per scene (10 panels with 4 variants each)
  - 66% smaller than 18-variant system
- **Bandwidth**: ~1.4MB per scene (variants only, originals cached)
  - 93% reduction vs 18-variant delivery
- **Reading Time**: 45-60 seconds per scene
- **Mobile Optimized**:
  - AVIF format (50-70% smaller than JPEG)
  - Mobile-first sizing (desktop uses mobile 2x)
  - Lazy loading (below-fold panels)
  - Format fallback (automatic JPEG for older browsers)

---

## Related Documentation

- [Image Generation Guide](./image-generation-guide.md) - DALL-E 3 integration
- [Image Optimization](./image-optimization.md) - 18-variant system
- [Story Specification](./story-specification.md) - HNS methodology
- [Database Schema](./database-schema.md) - PostgreSQL structure

---

**Last Updated**: 2025-10-26
**Version**: 1.0.0
