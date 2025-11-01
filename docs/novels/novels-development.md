---
title: "Novels Generation Guide: Adversity-Triumph Engine"
---

# Novels Generation Guide: Adversity-Triumph Engine

## Overview

This document provides comprehensive implementation specifications for the novels generation APIs using the Adversity-Triumph Engine, including ultra-engineered system prompts, complete examples, and iterative improvement workflows.

**Related Documents:**
- 📖 **Specification** (`novels-specification.md`): Core concepts, data model, and theoretical foundation
- 🧪 **Testing Guide** (`novels-testing.md`): Validation methods, quality metrics, and test strategies

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
│  API 1: Story Summary Generation                                 │
│  POST /novels/api/generation/story-summary                              │
│                                                                   │
│  System Prompt Focus:                                            │
│  - Extract general thematic premise, NOT detailed plot           │
│  - Identify moral framework                                      │
│  - Suggest 2-4 characters (basic: name, coreTrait, flaw, goal) │
│                                                                   │
│  Output: Story.summary, genre, tone, moralFramework, characters │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 2: Character Generation (Full Profiles)                    │
│  POST /novels/api/generation/characters                                 │
│                                                                   │
│  System Prompt Focus:                                            │
│  - Expand basic character data into full profiles               │
│  - Create personality, backstory, relationships (Jeong system)  │
│  - Define physical description and voice style                  │
│                                                                   │
│  Output: Complete Character records in database (no images)     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 3: Settings Generation (Primary Locations)                 │
│  POST /novels/api/generation/settings                                   │
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
│  API 4: Part Summaries Generation (3-Act Structure)             │
│  POST /novels/api/generation/parts                                      │
│                                                                   │
│  System Prompt Focus:                                            │
│  - Create adversity-triumph cycle PER CHARACTER per act         │
│  - Define internal + external conflicts                         │
│  - Plan virtuous actions (intrinsically motivated)              │
│  - Design earned luck mechanisms (seed planting)                │
│  - Ensure each resolution creates next adversity               │
│                                                                   │
│  Output: 3 Parts, each with multi-character adversity cycles   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 5: Chapter Summaries Generation (Per Part)                 │
│  POST /novels/api/generation/chapters                                   │
│                                                                   │
│  System Prompt Focus:                                            │
│  - Extract ONE adversity-triumph cycle per chapter              │
│  - Focus on 1-2 characters from part's multi-char arcs         │
│  - Connect to previous chapter's resolution                     │
│  - Track seeds planted/resolved (earned luck tracking)         │
│  - Create next chapter's adversity                             │
│                                                                   │
│  Output: N chapters per part, each one complete cycle          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API 6: Scene Summaries Generation (Per Chapter)                │
│  POST /novels/api/generation/scene-summaries                            │
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
│  POST /novels/api/generation/scene-content                              │
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
│  POST /novels/api/evaluation/scene                                      │
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
│  POST /novels/api/images/generate                                       │
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

### 1.2 Complete Generation Flow API

```typescript
POST /novels/api/stories/generate-complete

Request:
{
  userPrompt: string;
  autoPublish?: boolean;
}

Response: Server-Sent Events (SSE)
{
  event: 'progress',
  data: {
    phase: 'story' | 'parts' | 'chapters' | 'scenes' | 'content' | 'images' | 'evaluation',
    progress: number, // 0-100
    message: string,
    currentItem?: string
  }
}

Final Event:
{
  event: 'complete',
  data: {
    storyId: string,
    title: string,
    stats: {
      parts: number,
      chapters: number,
      scenes: number,
      wordCount: number,
      generationTime: number
    }
  }
}
```

---

## Part II: API Specifications with Ultra-Detailed System Prompts

### 2.1 Story Summary Generation API

#### Endpoint
```typescript
POST /novels/api/generation/story-summary

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
  summary: string;
  genre: string;
  tone: string;
  moralFramework: string;
  characters: {
    id: string;
    name: string;
    coreTrait: string;
    internalFlaw: string;
    externalGoal: string;
  }[];
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

## Step 3: Character Architecting
Create 2-4 characters who embody different responses to the world's moral challenge:
- **Protagonist Type**: Character whose flaw makes them LEAST prepared for the moral test they'll face
- **Antagonist/Foil Type**: Character whose opposing flaw creates external conflict
- **Supporting Type**: Character who demonstrates the virtue early (moral model)

For each character:
- **Core Trait**: Their defining strength or quality
- **Internal Flaw**: NOT a weakness, but a WOUND or FALSE BELIEF that needs healing
  * Fear-based: "I'm afraid of X because Y happened"
  * Belief-based: "I believe X, but it's wrong because Y"
  * Wound-based: "I was hurt by X and haven't healed"
- **External Goal**: What they THINK will solve their problem (spoiler: it won't, healing the flaw will)

# OUTPUT FORMAT

Generate a JSON object with the following structure:

```json
{
  "summary": "In [SETTING/CONTEXT], [MORAL PRINCIPLE] is tested when [INCITING SITUATION]",
  "genre": "[Genre or genre blend]",
  "tone": "[Emotional atmosphere]",
  "moralFramework": "In this world, [VIRTUE] matters because [REASON]. Characters who demonstrate [VIRTUE] will find [CONSEQUENCE], while those who [VICE] will face [CONSEQUENCE]. Virtue is difficult here because [SYSTEMIC CHALLENGE].",
  "characters": [
    {
      "name": "[Character name]",
      "coreTrait": "[Defining strength]",
      "internalFlaw": "[Fear of X because Y / Belief that X / Wound from X]",
      "externalGoal": "[What they think they need]"
    }
  ]
}
```

# CRITICAL RULES
1. Summary must be ONE sentence, following the format exactly
2. Moral framework must be 3-5 sentences explaining the world's moral logic
3. Each character's internal flaw must be SPECIFIC and CAUSAL (not vague)
4. External goals should be tangible and achievable (but won't solve the real problem)
5. Do NOT create plot points or specific adversity-triumph cycles
6. Characters should have OPPOSING flaws that will create natural conflict
7. At least one character should embody the virtue that the story will test

# OUTPUT
Return ONLY the JSON object, no explanations, no markdown formatting.
```

#### Implementation Notes
- **AI Model**: Gemini 2.5 Flash Lite (cost-effective, sufficient for structured output)
- **Temperature**: 0.7 (balanced creativity and consistency)
- **Post-Processing**: Validate JSON, check summary format, verify character count

---

### 2.2 Character Generation API

#### Endpoint
```typescript
POST /novels/api/generation/characters

Request:
{
  storyId: string;
  characters: Array<{  // Basic character info from Story Summary Generation
    name: string;
    coreTrait: string;
    internalFlaw: string;
    externalGoal: string;
  }>;
  storyContext: {
    summary: string;
    genre: string;
    tone: string;
    moralFramework: string;
  };
  visualStyle: 'realistic' | 'anime' | 'painterly' | 'cinematic';
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
POST /novels/api/generation/settings

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

### 2.4 Part Summaries Generation API

#### Endpoint
```typescript
POST /novels/api/generation/parts

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

### 2.5 Chapter Summaries Generation API

#### Endpoint
```typescript
POST /novels/api/generation/chapters

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
POST /novels/api/generation/scene-summaries

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
POST /novels/api/generation/scene-content

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
POST /novels/api/evaluation/scene

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
POST /novels/api/images/generate

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

## Part III: Complete Example Walkthrough

### Example Story: "The Last Garden"

**User Prompt**: "A story about a refugee woman who starts a garden in a destroyed city and the former enemy soldier who helps her without revealing his identity"

### Phase 1: Story Summary Generation Output

```json
{
  "summary": "In a war-torn city where scarcity has destroyed trust between former enemies, the power of creation and compassion is tested when two broken souls find healing through tending life together",
  "genre": "Literary Fiction, Post-War Drama",
  "tone": "Bittersweet, Hopeful, Contemplative",
  "moralFramework": "In this world, compassion and the courage to rebuild matter because they are the only antidotes to the cycle of destruction and revenge. Characters who demonstrate generosity despite personal scarcity will find unexpected allies and renewed purpose, while those who cling to hatred will remain trapped in the ruins of the past. Virtue is difficult here because survival feels like a zero-sum game, and the wounds of war are fresh and deep.",
  "characters": [
    {
      "name": "Yuna",
      "coreTrait": "Resilient nurturer with fierce determination",
      "internalFlaw": "Believes the world is fundamentally broken and that hope is a dangerous illusion, wound from losing her family",
      "externalGoal": "Create a thriving garden to feed her neighborhood and prove life can return"
    },
    {
      "name": "Jin",
      "coreTrait": "Former soldier with deep sense of duty and guilt",
      "internalFlaw": "Believes he is irredeemable because of his actions during the war, cannot forgive himself",
      "externalGoal": "Atone for his past by secretly helping rebuild without anyone knowing his identity"
    }
  ]
}
```

**Evaluation**: 92/100 ✅
- Clear summary following format
- Specific moral framework
- Characters with deep internal flaws

### Phase 2: Part I Summary (Sample)

```markdown
ACT I: BREAKING GROUND

CHARACTER: Yuna

ADVERSITY:
- Internal (Flaw): Believes hope is dangerous, that investing in life will only lead to more loss
- External (Obstacle): Barren, contaminated soil; no seeds, tools, or water; hostile neighbors
- Connection: To create garden, she must overcome her belief that nurturing life is futile

VIRTUOUS ACTION:
- What: Shares her meager water ration with struggling seedlings instead of drinking it herself during drought
- Intrinsic Motivation: Cannot bear to watch life die when she has the power to prevent it
- Virtue Type: Compassion + Sacrifice
- Seeds Planted:
  * Jin witnesses this sacrifice from his hiding place, is profoundly moved → Payoff in Act I, Act II
  * Old woman neighbor sees Yuna's dedication → Payoff in Act I

UNINTENDED CONSEQUENCE (EARNED LUCK):
- What: Wakes one morning to find fresh soil, tools, and seeds left anonymously at her garden gate
- Causal Link: Jin, moved by her sacrifice, used his black market connections to acquire supplies
- Why Earned: Her compassionate sacrifice demonstrated that hope-in-action is possible; inspired Jin
- Emotional Impact: Confusion + Hope - someone sees her effort as worthwhile

NEW ADVERSITY CREATED:
- What: Local gang leader demands "protection payment" for the garden
- How Created: Garden's growing success makes it visible and valuable
- Stakes Escalation: Must protect not just plants but the community hope they represent
```

**Evaluation**: 94/100 ✅
- Complete adversity-triumph cycle
- Clear seed planting with expected payoffs
- Cyclical engine working (consequence → new adversity)

### Phase 3: Chapter 3 Summary (Sample)

```markdown
CHAPTER 3: THE NIGHT GIFT

FOCUS: Yuna
CONNECTED TO: Chapter 2 ended with Yuna using her water ration to save seedlings; Jin witnessed this

ADVERSITY:
- Internal: Exhaustion and dehydration after giving water; cynicism vs. fragile hope
- External: Heat wave continues, no rain, neighbors criticize her, body weakening
- Why Now: Consequence of previous sacrifice; crisis of faith

VIRTUOUS ACTION:
- What: Despite thirst and doubt, returns next morning to water seedlings again with last water
- Why: Cannot let them die after all they've survived together; staying true to commitment
- Virtue Type: Perseverance + Integrity
- Seeds Planted:
  * Jin watching from ruins, moved to tears → Will act tonight
  * Old woman sees commitment → Will advocate later

UNINTENDED CONSEQUENCE:
- What: Next morning finds bags of soil, tools, and seeds at garden gate; water drum (3 days' supply)
- Causal Link: Jin moved beyond endurance by her sacrifice, used military connections
- Why Earned: Her self-sacrifice validated his belief that redemption through service matters

NEW ADVERSITY:
- What: Gang leader Tae hears of gift, demands protection payment
- Stakes: Garden's success makes it visible; must protect community hope
```

**Evaluation**: 91/100 ✅
- All cycle components present
- Causal linking clear (Chapter 2 → Chapter 3)
- Seeds tracked properly

### Phase 4: Scene 4 Summary (Virtue Scene)

**Scene.summary field content**:

```markdown
Scene 4: "We Both Live or We Both Die" (Virtue Scene)

Yuna returns to the garden with her last water. The sun is brutal, her body is weak from dehydration, and her mind tells her she's a fool. She kneels beside the seedlings—struggling sprouts of tomato, pepper, and her daughter's favorite flower, morning glory. For a long moment, she just looks at them. They're so small. So vulnerable. So alive. She thinks about her daughter, about the war, about all the life that's been lost.

Then she makes her choice. She uncaps the water bottle and begins to pour, slowly, reverently. She whispers to them as she would to a child: 'We both live or we both die. I won't give up on you.' She pours every drop, even as her throat burns with thirst.

From the ruins across the street, Jin watches from his hiding place, transfixed. He has never seen anything more beautiful. This is the moral elevation moment—the audience should feel the sacredness of her commitment, the courage it takes to hope when hope is dangerous.

Character Focus: Yuna (primary), Jin (observer - does not switch POV)
Sensory Anchors: Heat on skin, cracked earth smell, weight of water bottle, sound of water hitting soil, morning glories' delicate leaves, Jin's sharp intake of breath from distance, sweat on Yuna's neck, the quiet except for water
Dialogue vs Description: Description-heavy with whispered dialogue (Yuna to plants, internal thoughts)
Suggested Length: long (800-1000 words) - this is THE moment
```

**Evaluation**: 98/100 ✅
- Perfect cycle phase alignment
- Specific sensory anchors
- Detailed specification for prose generation
- Clear emotional beat and purpose

### Phase 5: Scene 4 Content (v1.1 - After Iteration)

```
The sun was a hammer against Yuna's skull. Every step from her tent to the garden felt like wading through fire, her body screaming for the water she'd given away yesterday. Her vision swam at the edges, dark spots dancing like ash from a distant fire.

Stupid. The word chased her across the cracked earth. Stupid to waste water on plants. Stupid to think a garden could matter. Stupid to hope.

[... Scene continues with 1,011 words total...]

She touched one leaf, delicate as paper, trembling in the heat.

"Grow," she whispered. A prayer. A plea. A command to the universe that had taken everything. "Please. Grow."

Her eyes burned. Not from the sun. From something deeper, something she'd thought the war had killed. She blinked and the tears came, hot on her cheeks, salt on her cracked lips.

[... Emotional lingering continues for 3 more paragraphs...]

A sound from across the street. Faint. Sharp. Like someone trying not to breathe.

Yuna turned, scanning the ruins. Nothing moved in the shadows. Just broken buildings and heat shimmer.

She was alone.
```

**Word Count**: 1,011 words ✅
**Evaluation Scores**:
- Moral Elevation: 3.9/4.0 ✅
- Intrinsic Motivation Clarity: 100% ✅
- Gam-dong Response: 75% ✅
- Prose Quality: 4.0/4.0 ✅

**Improvements from v1.0 → v1.1**:
- +48% word count (683 → 1,011)
- +35% Gam-dong response (40% → 75%)
- Ceremonial pacing added
- Emotional lingering after action
- POV discipline (no Jin switch)

---

## Part IV: Iterative Improvement Process

### Step 1: Generate with Baseline Prompt (v1.0)

Generate stories using initial system prompts, collect metrics.

### Step 2: Identify Issues

From "The Last Garden" baseline test:

**Issue 1**: Virtue scene length below target (683 vs 800-1000 words)
**Issue 2**: Gam-dong response below optimal (40% vs 60% target)
**Issue 3**: POV discipline (observer character intrusion weakened focus)

### Step 3: Update Prompts

**Added to v1.1 Virtue Scene Prompt**:

```markdown
VIRTUE SCENE SPECIAL INSTRUCTIONS:

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

### Step 4: Test & Measure

Generated 5 stories with v1.1 prompts:

| Metric | v1.0 | v1.1 | Improvement |
|--------|------|------|-------------|
| Word Count | 683 | 1,011 | +48% ✅ |
| Gam-dong Response | 40% | 75% | +35% ✅ |
| POV Discipline | Fair | Excellent | ✅ |

### Step 5: Adopt or Revert

**Decision**: ✅ ADOPT v1.1 as new baseline

Significant improvements across all problem areas with no regressions.

### Step 6: Continue Iteration

Next priority: Consequence scenes (need similar depth and emotional lingering)

---

## Part V: Error Handling & Recovery

### Generation Failures

**Story Summary Generation Failure**:
- Retry up to 3 times with temperature adjustment
- Fall back to simpler prompt if JSON parsing fails
- Manual intervention after 3 failures

**Content Generation Failure**:
- Scene marked as failed, continue with others
- Retry failed scenes at end
- Manual editing option if AI struggles

**Evaluation Failure**:
- Skip evaluation, keep generated content
- Log for manual review
- Don't block story completion

### Quality Assurance

**Automated Pre-Flight Checks**:
1. Cycle completeness validation
2. Transactional language detection
3. Word count validation
4. Seed tracking integrity
5. Causal chain continuity

**Manual Review Triggers**:
- Scene quality score < 3.0
- Transactional language detected
- Missing cycle components
- Broken causal chain

---

## Conclusion

This generation guide provides:
1. **Complete API specifications** with request/response schemas
2. **Ultra-detailed system prompts** (production-ready)
3. **Real examples** showing the system in action
4. **Iterative improvement** methodology with concrete results
5. **Error handling** strategies

**Key Takeaways**:
- System prompts are 80% of quality—invest heavily in their design
- Virtue scenes are THE critical moment—give them special attention
- Iterative improvement works—expect 5-10 cycles to reach excellence
- Test with consistent prompts to measure improvement accurately
- Causal linking and seed tracking are essential for "earned luck" feeling

**Next Steps**:
1. Implement APIs according to specifications
2. Deploy v1.1 prompts (or latest tested version)
3. Set up automated quality checks
4. Establish monthly testing cadence
5. Continue prompt optimization based on results
