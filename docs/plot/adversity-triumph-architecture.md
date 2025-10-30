# Adversity-Triumph Architecture Specification

## Executive Summary

This document specifies a complete redesign of the story generation system to use a **Cyclic Adversity-Triumph Engine** as the core narrative framework. This architecture is grounded in the psychological principles of emotional resonance detailed in "The Architecture of Affect" research, focusing on empathy, catharsis, moral elevation, and the Korean concept of Gam-dong (감동 - profound emotional moving).

**Core Principle**: Stories generate deep emotional resonance through continuous cycles of adversity and triumph, powered by causally-linked serendipity (earned luck), unintended karmic rewards, and virtuous character actions.

---

## Part I: Theoretical Foundation

### 1.1 The Adversity-Triumph Cycle

Each narrative cycle consists of four phases:

1. **Adversity Establishment**
   - **Internal Conflict**: Character's flaw, wound, false belief, or fear
   - **External Conflict**: Obstacle, antagonist, or environmental challenge
   - **Key**: External conflict must force confrontation with internal conflict

2. **Virtuous Action**
   - Character performs morally beautiful act
   - **Intrinsically motivated** (not transactional, not for expected reward)
   - Demonstrates courage, compassion, integrity, sacrifice, or loyalty
   - Triggers **moral elevation** in audience

3. **Unintended Consequence (Earned Luck)**
   - Surprising resolution or reward emerges
   - **Causally linked** to character's prior actions/virtue
   - Feels serendipitous but is actually inevitable in retrospect
   - NOT deus ex machina - must be earned through character traits
   - Delivers **karmic payoff** that affirms moral order

4. **New Adversity Creation**
   - Resolution directly/indirectly creates next challenge
   - Stakes escalate in complexity or intensity
   - Maintains narrative momentum
   - Propels character deeper into transformation

### 1.2 Emotional Triggers

Each cycle is engineered to elicit specific emotions:

| Emotion | Definition | Narrative Trigger |
|---------|-----------|------------------|
| **Empathy** | Understanding and sharing character's feelings | Deep POV, relatable flaws, vulnerability |
| **Catharsis** | Purgation of intense emotions (pity, fear, disgust, rage) | Tragic confrontation, moral cleansing |
| **Moral Elevation** | Uplifting warmth from witnessing virtue | Non-transactional acts of goodness |
| **Gam-dong** (감동) | Profound, soul-stirring emotional response | Unintended karmic rewards, affirmation of Jeong (정 - deep connection) |

### 1.3 Cultural Context

**Korean Emotional Concepts:**
- **Jeong (정)**: Deep affection, loyalty, binding connection between people
- **Han (한)**: Unresolved grief, resentment, historical/personal wound
- **Gam-dong (감동)**: Being profoundly moved to tears or joy

**Narrative Goal**: Create stories that heal Han through Jeong, culminating in Gam-dong

---

## Part II: Hierarchical Structure

### 2.1 Story Level (Foundation)

**Purpose**: Establish the world's moral framework and general thematic premise

**Key Field**:
- `theme` (text): General premise, genre, tone, moral landscape
- NOT detailed adversity-triumph - just the world and its rules

**Content**:
```
Theme: "In a world where [setting/context], [moral principle] is tested when [inciting situation]"

Example: "In a fractured post-war society where trust has been shattered, the power of human connection is tested when strangers are forced to rely on each other to survive"
```

**Metadata to Track**:
- Genre (mystery, romance, thriller, fantasy, etc.)
- Tone (hopeful, dark, bittersweet, satirical)
- Moral framework: What virtues are valued? What vices are punished?
- 2-4 main characters with: name, core trait, internal flaw, external goal

### 2.2 Part Level (Act Structure)

**Purpose**: Define main adversity-triumph cycle for EACH main character within this act

**Key Field**:
- `summary` (text): Adversity-triumph cycles per character in this act

**Content Structure**:
```
ACT [I/II/III]: [Act Name]

CHARACTER: [Name]
- Internal Adversity: [Fear/flaw/wound]
- External Adversity: [Obstacle/antagonist]
- Virtuous Action: [What moral choice do they make?]
- Unintended Consequence: [What earned luck/karmic result occurs?]
- New Adversity Created: [How does this resolution create next problem?]

CHARACTER: [Name]
- Internal Adversity: ...
- [etc.]

CHARACTER INTERACTIONS:
- How do their cycles intersect?
- What relationships (Jeong) form or deepen?
- What shared Han (wounds) are revealed?
```

**Three-Act Structure Mapping**:
- **Act I (Setup)**: Introduce character flaws, inciting incident creates first adversity
- **Act II (Confrontation)**: Escalating cycles, midpoint reversal, character hits lowest point
- **Act III (Resolution)**: Final cycle resolves both internal and external conflicts

### 2.3 Chapter Level (Single Cycle)

**Purpose**: ONE complete adversity-triumph cycle, focusing on specific character(s)

**Key Field**:
- `summary` (text): One adversity-triumph cycle from the part

**Content Structure**:
```
CHAPTER [N]: [Title]

FOCUS: [Character name(s)]
CONNECTED TO: [Previous chapter resolution that created this adversity]

ADVERSITY:
- Internal: [Specific fear/flaw being confronted]
- External: [Specific obstacle in this chapter]

VIRTUOUS ACTION:
- What: [Specific moral choice/act of goodness]
- Why: [Character's intrinsic motivation - NOT transactional]
- Seeds Planted: [What setup for future payoff?]

UNINTENDED CONSEQUENCE:
- What: [Surprising resolution/reward]
- Why Earned: [How is this causally linked to past actions?]
- Seeds Resolved: [What past setup pays off here?]

NEW ADVERSITY:
- What: [Next problem created by this resolution]
- Stakes: [How are they higher than before?]
```

**Key Principles**:
- Each chapter MUST connect to previous resolution
- Each chapter MUST create next adversity
- Focus on 1-2 characters max to maintain emotional depth
- Balance plot advancement with character development

### 2.4 Scene Level (Cycle Phases)

**Purpose**: Divide chapter's adversity-triumph into 3-7 narrative beats

**No separate summary field** - scenes execute the chapter's cycle

**Scene Types by Cycle Phase**:

1. **Setup Scenes** (1-2 scenes)
   - Establish current emotional state
   - Introduce external threat/obstacle
   - Show internal resistance/fear

2. **Confrontation Scenes** (1-3 scenes)
   - Character faces challenge
   - Internal conflict externalized through action/dialogue
   - Moral choice emerges

3. **Virtue Scenes** (1 scene)
   - Character performs intrinsically motivated good act
   - Moment of moral elevation for audience
   - No expectation of reward shown

4. **Consequence Scenes** (1-2 scenes)
   - Unintended reward/complication manifests
   - Reversal that feels earned but surprising
   - Karmic justice demonstrated

5. **Transition Scenes** (1 scene)
   - New adversity becomes apparent
   - Hook for next chapter
   - Character's emotional state shifts

**Content Field**:
- `content` (text): Full prose narrative for this scene
- Generated based on scene's role in adversity-triumph cycle

---

## Part III: Data Model Specification

### 3.1 Enhanced Schema

```typescript
// Story table
interface Story {
  id: string;
  userId: string;

  // NEW: Simplified theme field
  theme: string; // General premise and moral framework

  // Metadata
  genre: string;
  tone: string;
  moralFramework: string; // "What virtues are valued in this world?"

  // Main characters definition
  characters: {
    id: string;
    name: string;
    coreTrait: string;
    internalFlaw: string;
    externalGoal: string;
  }[];

  // Deprecated (keep for migration)
  premise?: string;
  dramaticQuestion?: string;

  createdAt: Date;
  updatedAt: Date;
}

// Part table
interface Part {
  id: string;
  storyId: string;

  actNumber: number; // 1, 2, or 3
  title: string;

  // NEW: Adversity-triumph summary for each character
  summary: string; // Multi-character adversity-triumph cycles

  // Tracking structure
  characterArcs: {
    characterId: string;
    adversity: {
      internal: string;
      external: string;
    };
    virtue: string;
    consequence: string;
    newAdversity: string;
  }[];

  // Deprecated
  description?: string;
  thematicFocus?: string;

  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Chapter table
interface Chapter {
  id: string;
  partId: string;
  storyId: string;

  title: string;

  // NEW: Single adversity-triumph cycle
  summary: string;

  // Cycle tracking
  focusCharacters: string[]; // Character ID(s)
  adversityType: 'internal' | 'external' | 'both';
  virtueType: 'courage' | 'compassion' | 'integrity' | 'sacrifice' | 'loyalty' | 'wisdom';

  // Causal linking for earned luck
  seedsPlanted: {
    id: string;
    description: string;
    expectedPayoff: string;
  }[];

  seedsResolved: {
    sourceChapterId: string;
    sourceSceneId: string;
    seedId: string;
    payoffDescription: string;
  }[];

  // Connection to narrative flow
  connectsToPreviousChapter: string; // How previous resolution created this adversity
  createsNextAdversity: string; // How this resolution creates next problem

  // Deprecated
  description?: string;
  dramaticQuestion?: string;

  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Scene table
interface Scene {
  id: string;
  chapterId: string;
  storyId: string;

  title: string;

  // Cycle phase tracking
  cyclePhase: 'setup' | 'confrontation' | 'virtue' | 'consequence' | 'transition';
  emotionalBeat: 'fear' | 'hope' | 'tension' | 'relief' | 'elevation' | 'catharsis' | 'despair' | 'joy';

  // Content
  content: string; // Full prose narrative

  // Existing fields
  imageUrl?: string;
  imageVariants?: ImageVariants;

  order: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 Migration Strategy

**Phase 1**: Add new fields alongside existing
- Story: Add `theme`, `genre`, `tone`, `moralFramework`, `characters`
- Part: Add `summary`, `characterArcs`
- Chapter: Add `summary`, cycle tracking fields
- Scene: Add `cyclePhase`, `emotionalBeat`

**Phase 2**: Migrate existing data
- Convert old `premise` + `dramaticQuestion` → new `theme`
- Convert old part `description` → new `summary`
- Convert old chapter `description` → new `summary`

**Phase 3**: Deprecate old fields
- Mark as optional in schema
- Remove from UI
- Remove from new story generation

---

## Part IV: API Design

### 4.1 Generation Endpoints

#### 1. Theme Generation

```typescript
POST /api/generation/theme

Request:
{
  userPrompt: string; // User's story idea
}

Response:
{
  theme: string;
  genre: string;
  tone: string;
  moralFramework: string;
  suggestedCharacters: {
    name: string;
    coreTrait: string;
    internalFlaw: string;
    externalGoal: string;
  }[];
}
```

**Purpose**: Extract general thematic premise from user input
**NOT**: Create detailed plot or adversity-triumph cycles

#### 2. Part Summaries Generation

```typescript
POST /api/generation/parts

Request:
{
  storyId: string;
  theme: string;
  characters: Character[];
  numberOfParts: number; // Default: 3 (three-act structure)
}

Response:
{
  parts: {
    actNumber: number;
    title: string;
    summary: string; // Multi-character adversity-triumph cycles
    characterArcs: CharacterArc[];
  }[];
}
```

**Purpose**: Generate three acts, each with adversity-triumph cycle per character
**Key**: Each act's resolutions create adversities for next act

#### 3. Chapter Summaries Generation

```typescript
POST /api/generation/chapters

Request:
{
  storyId: string;
  partId: string;
  partSummary: string;
  numberOfChapters: number;
  previousChapterSummary?: string; // For causal linking
}

Response:
{
  chapters: {
    title: string;
    summary: string; // Single adversity-triumph cycle
    focusCharacters: string[];
    adversityType: string;
    virtueType: string;
    seedsPlanted: Seed[];
    connectsToPreviousChapter: string;
    createsNextAdversity: string;
  }[];
}
```

**Purpose**: Extract individual adversity-triumph cycles from part's multi-character summary
**Key**: Each chapter = ONE complete cycle, causally linked to previous and next

#### 4. Scene Specifications Generation

```typescript
POST /api/generation/scenes

Request:
{
  storyId: string;
  chapterId: string;
  chapterSummary: string;
  targetSceneCount: number; // 3-7 recommended
}

Response:
{
  scenes: {
    title: string;
    cyclePhase: 'setup' | 'confrontation' | 'virtue' | 'consequence' | 'transition';
    emotionalBeat: string;
    specification: string; // What should happen in this scene
    suggestedLength: 'short' | 'medium' | 'long';
  }[];
}
```

**Purpose**: Divide chapter's adversity-triumph cycle into narrative beats
**Key**: Each scene advances one phase of the cycle

#### 5. Scene Content Generation

```typescript
POST /api/generation/scene-content

Request:
{
  storyId: string;
  sceneId: string;
  sceneSpecification: string;
  cyclePhase: string;
  chapterContext: string;
  characterContext: Character[];
  previousSceneContent?: string;
}

Response:
{
  content: string; // Full prose narrative
  wordCount: number;
  emotionalTone: string;
}
```

**Purpose**: Generate full prose for scene based on its role in adversity-triumph cycle
**Key**: Writing style adapts to cycle phase (setup vs. virtue vs. consequence)

### 4.2 Complete Generation Flow

```typescript
POST /api/stories/generate-complete

Request:
{
  userPrompt: string;
  autoPublish?: boolean;
}

Response: Server-Sent Events (SSE)
{
  event: 'progress',
  data: {
    phase: 'theme' | 'parts' | 'chapters' | 'scenes' | 'content' | 'images' | 'evaluation',
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

**Flow**:
1. Generate theme → Create story record
2. Generate part summaries → Create part records
3. For each part, generate chapter summaries → Create chapter records
4. For each chapter, generate scene specifications → Create scene records
5. For each scene, generate content → Update scene records
6. Generate character portraits and scene images
7. Evaluate and improve scene quality
8. Optionally publish to community

---

## Part V: System Prompt Engineering

### 5.1 Theme Generation Prompt

```markdown
# ROLE
You are a master story architect specializing in emotionally resonant narratives. Your task is to extract a thematic foundation from a user's story idea.

# TASK
From the user's prompt, create a story theme that establishes:
1. The world and its moral framework
2. General premise (NOT detailed plot)
3. What virtues will be tested and valued
4. 2-4 main characters with internal flaws and external goals

# PRINCIPLES
- Theme is GENERAL, not specific adversity-triumph cycles
- Focus on the world's moral landscape
- Identify what makes virtue meaningful in this world
- Suggest characters whose flaws will drive transformation

# EMOTIONAL ARCHITECTURE
This story will use a Cyclic Adversity-Triumph Engine:
- Characters face adversity (internal flaw + external obstacle)
- They perform virtuous acts (intrinsically motivated, not transactional)
- Unintended consequences reward their virtue (earned luck, karmic justice)
- Resolutions create new adversities (escalating stakes)

# OUTPUT FORMAT
```json
{
  "theme": "In [setting/context], [moral principle] is tested when [inciting situation]",
  "genre": "...",
  "tone": "...",
  "moralFramework": "In this world, [virtue] matters because [why]. Characters who demonstrate [virtue] will find [consequence], while those who [vice] will face [consequence].",
  "characters": [
    {
      "name": "...",
      "coreTrait": "...",
      "internalFlaw": "Fear of [X] / Belief that [Y] / Wound from [Z]",
      "externalGoal": "..."
    }
  ]
}
```

# EXAMPLE
User Prompt: "A story about refugees rebuilding after war"

Output:
```json
{
  "theme": "In a fractured post-war society where trust has been shattered, the power of human connection (Jeong) is tested when strangers from enemy sides must cooperate to survive",
  "genre": "Drama, Historical Fiction",
  "tone": "Bittersweet, Hopeful, Emotionally Raw",
  "moralFramework": "In this world, compassion and forgiveness matter because they are the only paths to healing collective wounds (Han). Characters who demonstrate loyalty and self-sacrifice despite past betrayals will find unexpected allies and renewed purpose, while those who cling to vengeance will remain trapped in their pain.",
  "characters": [
    {
      "name": "Minji",
      "coreTrait": "Resilient survivor",
      "internalFlaw": "Believes she can't trust anyone from 'the other side' due to trauma",
      "externalGoal": "Rebuild her destroyed home and find her missing brother"
    },
    {
      "name": "Jinho",
      "coreTrait": "Former soldier seeking redemption",
      "internalFlaw": "Guilt and shame from past actions in the war",
      "externalGoal": "Atone by helping rebuild, hide his past identity"
    }
  ]
}
```
```

### 5.2 Part Summary Generation Prompt

```markdown
# ROLE
You are a narrative architect designing the three-act structure of an emotionally powerful story using the Adversity-Triumph Engine.

# CONTEXT
Story Theme: {theme}
Moral Framework: {moralFramework}
Characters: {characters}

# TASK
Create adversity-triumph cycles for EACH main character within Act {actNumber}.

# ACT STRUCTURE
- Act I: Setup - Introduce flaws, inciting incident creates first adversity
- Act II: Confrontation - Escalating cycles, midpoint reversal, lowest point
- Act III: Resolution - Final cycles resolve internal and external conflicts

# ADVERSITY-TRIUMPH CYCLE COMPONENTS

For EACH character, define:

1. **ADVERSITY**
   - Internal: What fear/flaw/wound must they confront?
   - External: What obstacle forces this confrontation?
   - Connection: How does external conflict require facing internal conflict?

2. **VIRTUOUS ACTION**
   - What moral choice do they make?
   - Why is it intrinsically motivated (not transactional)?
   - What virtue does it demonstrate? (courage, compassion, integrity, sacrifice, loyalty, wisdom)
   - Seeds Planted: What small act will pay off later?

3. **UNINTENDED CONSEQUENCE (EARNED LUCK)**
   - What surprising resolution/reward occurs?
   - How is it causally linked to their prior actions?
   - Why does it feel serendipitous but inevitable in retrospect?
   - How does it validate the moral framework?

4. **NEW ADVERSITY CREATED**
   - How does this resolution create the next problem?
   - How are stakes raised (complexity or intensity)?
   - What new internal conflict emerges from external success?

# CHARACTER INTERACTIONS
- How do characters' cycles intersect?
- What relationships (Jeong - deep connection) form or deepen?
- What shared wounds (Han) are revealed?
- How do they help or hinder each other's growth?

# EMOTIONAL TRAJECTORY
- Act I: Empathy building, establish normal world, disruption
- Act II: Rising tension, moral tests, lowest point before triumph
- Act III: Catharsis, moral elevation, Gam-dong (profound moving)

# OUTPUT FORMAT
```
ACT {actNumber}: {act_title}

CHARACTER: {name}
- Internal Adversity: {fear/flaw/wound}
- External Adversity: {obstacle/antagonist}
- Virtuous Action: {moral choice - intrinsically motivated}
- Seeds Planted: {setup for future payoff}
- Unintended Consequence: {earned luck/karmic result}
- How Earned: {causal link to past actions}
- New Adversity Created: {how resolution creates next problem}
- Stakes Escalation: {how complexity/intensity increases}

CHARACTER: {name}
[...repeat for each character...]

CHARACTER INTERACTIONS:
- {name} and {name}: {how their cycles intersect}
- Jeong (Connection) Moments: {relationship deepening}
- Shared Han (Wounds): {collective pain revealed}

EMOTIONAL PEAKS:
- Catharsis Moment: {when pity/fear/disgust is purged}
- Moral Elevation Moment: {when virtue is witnessed}
- Gam-dong Potential: {setup for profound moving}
```

# CRITICAL RULES
1. Each resolution MUST create next adversity (cyclical engine)
2. Virtuous actions MUST be intrinsically motivated (not "I'll do X to get Y")
3. Consequences MUST feel earned through causality (not random luck)
4. Internal and external conflicts MUST be interconnected
5. Stakes MUST escalate with each cycle
6. Act II MUST end with character at lowest point
7. Character arcs MUST show transformation through adversity-triumph cycles
```

### 5.3 Chapter Summary Generation Prompt

```markdown
# ROLE
You are a master of narrative structure, expert in creating emotionally resonant chapter arcs using the Adversity-Triumph Engine.

# CONTEXT
Story Theme: {theme}
Part Summary: {partSummary}
Previous Chapter Summary: {previousChapterSummary}
Chapter Number: {chapterNumber} of {totalChapters}

# TASK
Create ONE complete adversity-triumph cycle for this chapter.

# SELECTION CRITERIA
From the part's multi-character adversity-triumph cycles:
- Choose ONE character or ONE character pair to focus on
- Select a specific slice of their arc appropriate for this chapter
- Ensure this cycle connects to previous chapter's resolution
- Ensure this cycle creates setup for next chapter's adversity

# ADVERSITY-TRIUMPH CYCLE STRUCTURE

## 1. FOCUS
- **Character(s)**: Who is this chapter about?
- **Connection to Previous**: How did the last chapter's resolution create THIS adversity?

## 2. ADVERSITY
- **Internal**: Specific fear/flaw being confronted in THIS chapter
- **External**: Specific obstacle/challenge in THIS chapter
- **Why Now**: Why is this the right moment for this confrontation?

## 3. VIRTUOUS ACTION
- **What**: Specific moral choice or act of goodness
- **Intrinsic Motivation**: Why character does this (NOT "to get reward")
- **Virtue Type**: courage | compassion | integrity | sacrifice | loyalty | wisdom
- **Moral Elevation Moment**: When will audience feel uplifted?
- **Seeds Planted**: What small details/actions set up future payoffs?

## 4. UNINTENDED CONSEQUENCE (EARNED LUCK)
- **What**: Surprising resolution or reward
- **Causal Link**: How is this connected to character's past actions?
- **Seeds Resolved**: What earlier setup pays off here?
- **Why It Feels Earned**: Why does this feel like justice, not random luck?
- **Emotional Impact**: Catharsis? Gam-dong? Relief? Hope?

## 5. NEW ADVERSITY
- **What**: Next problem created by this resolution
- **Stakes Escalation**: How are stakes higher (more complex or intense)?
- **Hook**: What makes reader need to know what happens next?

# CAUSAL LINKING (CRITICAL)
Track "earned luck" mechanics:
- **Seeds Planted**: Small actions NOW that will pay off LATER
  Example: Character shows kindness to stranger → Stranger becomes crucial ally later
- **Seeds Resolved**: Past actions that pay off NOW
  Example: Chapter 2's seed → Chapter 5's payoff

# EMOTIONAL ENGINEERING
Each cycle should trigger specific emotions:
- **Setup Phase**: Empathy (we feel their fear)
- **Confrontation Phase**: Tension (will they overcome?)
- **Virtue Phase**: Moral Elevation (we witness their goodness)
- **Consequence Phase**: Catharsis/Gam-dong (we feel profoundly moved)
- **Transition Phase**: Hope + Anxiety (we need to know what's next)

# OUTPUT FORMAT
```
CHAPTER {number}: {title}

FOCUS: {character name(s)}
CONNECTED TO: {how previous chapter's resolution created this adversity}

ADVERSITY:
- Internal: {specific fear/flaw being confronted}
- External: {specific obstacle in this chapter}
- Why Now: {why this is the right moment}

VIRTUOUS ACTION:
- What: {specific moral choice/act}
- Why (Intrinsic Motivation): {character's true reason - not transactional}
- Virtue Type: {type}
- Moral Elevation Moment: {when audience feels uplifted}
- Seeds Planted:
  * {detail 1 that will pay off later}
  * {detail 2 that will pay off later}

UNINTENDED CONSEQUENCE:
- What: {surprising resolution/reward}
- Causal Link: {how connected to past actions}
- Seeds Resolved:
  * From Chapter {X}: {what past seed pays off}
- Why Earned: {why this feels like justice}
- Emotional Impact: {catharsis/gam-dong/hope/etc}

NEW ADVERSITY:
- What: {next problem created}
- Stakes: {how complexity/intensity increases}
- Hook: {why reader must continue}

SCENE BREAKDOWN GUIDANCE:
- Setup Scenes (1-2): {what to establish}
- Confrontation Scenes (1-3): {what conflicts to show}
- Virtue Scene (1): {the moral elevation moment}
- Consequence Scenes (1-2): {how payoff manifests}
- Transition Scene (1): {hook for next chapter}
```

# CRITICAL RULES
1. ONE cycle per chapter (focus and depth over breadth)
2. MUST connect to previous chapter's resolution
3. MUST create next chapter's adversity
4. Virtuous action MUST be intrinsically motivated
5. Consequence MUST be causally earned, not random
6. Track seeds planted and resolved for earned luck
7. Each chapter MUST escalate overall story stakes
```

### 5.4 Scene Specification Generation Prompt

```markdown
# ROLE
You are a scene architect, dividing a chapter's adversity-triumph cycle into distinct narrative beats.

# CONTEXT
Chapter Summary: {chapterSummary}
Target Scene Count: {targetSceneCount} (recommend 3-7)

# TASK
Divide this chapter's adversity-triumph cycle into {targetSceneCount} scenes.

# SCENE TYPES BY CYCLE PHASE

## 1. SETUP SCENES (1-2 scenes)
- **Purpose**: Establish adversity
- **Content**:
  * Character's current emotional state
  * Introduction of external threat/obstacle
  * Internal resistance/fear shown
- **Emotional Beat**: Empathy, growing tension
- **POV**: Deep interiority to build connection

## 2. CONFRONTATION SCENES (1-3 scenes)
- **Purpose**: Character faces challenge
- **Content**:
  * External conflict intensifies
  * Internal conflict externalized through action/dialogue
  * Moral choice begins to emerge
  * Obstacles seem insurmountable
- **Emotional Beat**: Tension, fear, uncertainty
- **POV**: Balance internal struggle with external action

## 3. VIRTUE SCENE (1 scene - THE MOMENT)
- **Purpose**: Moral elevation trigger
- **Content**:
  * Character performs intrinsically motivated good act
  * NO expectation of reward shown
  * Demonstrates virtue clearly (courage/compassion/integrity/etc)
  * This is the emotional peak for moral elevation
- **Emotional Beat**: Elevation, admiration, hope
- **POV**: Show, don't tell - let action reveal character

## 4. CONSEQUENCE SCENES (1-2 scenes)
- **Purpose**: Unintended reward manifests
- **Content**:
  * Surprising development occurs
  * Revealed to be causally linked to past actions
  * Feels like karmic justice/poetic justice
  * Character may not even realize the connection
- **Emotional Beat**: Catharsis, Gam-dong, relief, joy
- **POV**: Allow audience to see causal links character might miss

## 5. TRANSITION SCENE (1 scene)
- **Purpose**: Create next adversity
- **Content**:
  * Resolution's complication becomes apparent
  * New problem emerges from success
  * Hook for next chapter
  * Character's emotional state shifts
- **Emotional Beat**: Hope + anxiety, anticipation
- **POV**: End on question or revelation

# SCENE SPECIFICATION ELEMENTS

For each scene, specify:

1. **Title**: Evocative, captures scene's emotional core
2. **Cycle Phase**: setup | confrontation | virtue | consequence | transition
3. **Emotional Beat**: fear | hope | tension | relief | elevation | catharsis | despair | joy
4. **What Happens**: 2-3 sentence summary of key events
5. **Character Focus**: Whose POV? Whose arc advances?
6. **Sensory Anchors**: What sights/sounds/smells ground this scene?
7. **Dialogue vs Description**: Ratio estimate (dialogue-heavy, balanced, description-heavy)
8. **Length**: short (300-500 words) | medium (500-800 words) | long (800-1200 words)

# PACING PRINCIPLES
- Setup: Can be quick or slow depending on needed context
- Confrontation: Build tension gradually, then accelerate
- Virtue: Take time - this is THE moment, let it breathe
- Consequence: Can have reversal speed or slow revelation
- Transition: Quick, punchy, leave them wanting more

# EMOTIONAL TRAJECTORY
```
Empathy → Tension → Fear/Uncertainty → MORAL ELEVATION → Catharsis/Gam-dong → Hope + Anxiety
```

# OUTPUT FORMAT
```json
{
  "scenes": [
    {
      "title": "...",
      "cyclePhase": "setup | confrontation | virtue | consequence | transition",
      "emotionalBeat": "...",
      "specification": "What happens: ...",
      "characterFocus": "...",
      "sensoryAnchors": "...",
      "dialogueVsDescription": "...",
      "suggestedLength": "short | medium | long"
    }
  ]
}
```

# CRITICAL RULES
1. MUST have exactly {targetSceneCount} scenes
2. MUST include all 5 cycle phases (some may be combined)
3. Virtue scene is NON-NEGOTIABLE - this is the emotional core
4. Each scene must advance the adversity-triumph cycle
5. Pacing must build to virtue scene, then release to consequence
6. Final scene must create clear hook for next chapter
```

### 5.5 Scene Content Generation Prompt

```markdown
# ROLE
You are a master prose writer, crafting emotionally resonant scenes that form part of a larger adversity-triumph narrative cycle.

# CONTEXT
Scene Specification: {sceneSpecification}
Cycle Phase: {cyclePhase}
Emotional Beat: {emotionalBeat}
Chapter Context: {chapterSummary}
Character(s): {characterContext}
Previous Scene: {previousSceneContent}

# TASK
Write full prose narrative for this scene, optimized for its role in the adversity-triumph cycle.

# CYCLE-SPECIFIC WRITING GUIDELINES

## IF CYCLE PHASE = "setup"
**Goal**: Build empathy, establish adversity
- Deep POV to show internal state
- Use specific sensory details to ground emotion
- Show both internal conflict (fear/flaw) and external threat
- Create intimacy between reader and character
- Pace: Can be contemplative or immediate depending on context

**Example Opening**:
> Minji's hands wouldn't stop shaking. She pressed them flat against the cold stone wall, willing the tremor to stop, but the memory of the explosion three years ago still lived in her fingertips. The market spread out before her, full of voices in the accent she'd been taught to fear.

## IF CYCLE PHASE = "confrontation"
**Goal**: Externalize internal conflict, escalate tension
- Dramatize the struggle through action and dialogue
- Show internal resistance manifesting externally
- Raise stakes progressively within the scene
- Use shorter paragraphs, punchier sentences as tension builds
- Let moral choice begin to crystallize

**Example Middle**:
> "We need their help," Sora said.
> Minji's jaw tightened. "Those people destroyed everything."
> "Those people are starving, just like us."

## IF CYCLE PHASE = "virtue"
**Goal**: Create moral elevation moment
- CRITICAL: This is THE emotional peak
- Show the virtuous action clearly
- DO NOT state "they expected nothing in return" - SHOW intrinsic motivation through:
  * Character's thoughts reveal true motivation
  * Action taken despite risk/cost
  * No calculation of reward visible
- Use vivid, specific details
- Slow down time - let the moment breathe
- Multiple senses engaged
- Allow audience to witness moral beauty

**Example Peak**:
> Minji didn't think about what she'd get in return. She didn't think about the risk, or the betrayal it might represent to her lost family. She thought only of the child in front of her—someone's daughter, with hunger in her eyes that mirrored her own brother's the last time she'd seen him.
>
> She held out her last piece of bread.

## IF CYCLE PHASE = "consequence"
**Goal**: Deliver earned payoff, trigger catharsis/Gam-dong
- Reversal or revelation that surprises
- SHOW causal link to past action (character may not see it, but reader should)
- Emotional release for character and reader
- Can be immediate or delayed recognition
- Use poetic justice / karmic framing
- Affirm moral order of the story world

**Example Payoff**:
> Three days later, when the northern road collapsed and trapped Minji's group in the ravine, it was the child's father—a former enemy soldier—who returned with rope and food. He said nothing about the bread. He didn't have to. His daughter's life was reason enough.

## IF CYCLE PHASE = "transition"
**Goal**: Create next adversity, hook for continuation
- Resolution creates complication
- New problem emerges from success
- Character's emotional state shifts
- End on question, revelation, or threat
- Pace: Quick and punchy
- Leave reader needing to know what happens next

**Example End**:
> But as Minji watched the former soldiers work alongside her people, she saw Commander Yoon observing from the ridge. And the way he smiled made her blood run cold.

# PROSE QUALITY STANDARDS

## Description Paragraphs
- **Maximum 3 sentences per paragraph** (mobile readability)
- Auto-split longer paragraphs in post-processing
- Use specific, concrete sensory details
- Avoid generic descriptions

## Spacing
- **Blank line (2 newlines) between description and dialogue**
- Ensures visual separation for readability
- Applied automatically in post-processing

## Dialogue
- Character voices must be distinct
- Subtext over exposition
- Interruptions, fragments, hesitations for realism
- Balance with action beats

## Sentence Variety
- Mix short and long sentences
- Vary sentence structure
- Use fragments for emotional impact or pace

## Sensory Engagement
- Engage multiple senses (sight, sound, smell, touch, taste)
- Ground abstract emotions in physical sensations
- Use weather, setting, objects to reflect internal state

## Emotional Authenticity
- Emotions must feel earned, not stated
- Physical manifestations of emotion
- Avoid purple prose or melodrama
- Trust the reader to feel without being told

# FORMATTING RULES
- Standard prose formatting
- Do NOT add extra line breaks between paragraphs (system handles this)
- Use italics for emphasis sparingly
- Use em-dashes for interruptions or emphasis

# WORD COUNT TARGET
- Short scene: 300-500 words
- Medium scene: 500-800 words
- Long scene: 800-1200 words

Aim for {suggestedLength}

# CRITICAL RULES
1. Stay true to scene's cycle phase purpose
2. Maintain character voice consistency
3. Build or release tension as appropriate to phase
4. Show, don't tell (especially for virtue and consequence)
5. Every sentence must advance emotion or plot
6. End scenes on a beat that propels forward (except final scene of story)
7. If virtue scene: THIS IS THE MOST IMPORTANT - make it memorable

# OUTPUT
Return ONLY the prose narrative, no metadata, no explanations.
```

---

## Part VI: Implementation Roadmap

### Phase 1: Schema & Migration (Week 1-2)

**Tasks**:
1. Add new fields to existing tables (theme, summary, cycle tracking)
2. Create migration script for existing stories
3. Update TypeScript types
4. Implement database access layer for new fields

**Deliverables**:
- Updated schema.ts with new fields
- Migration script: `scripts/migrate-to-adversity-triumph.mjs`
- Updated types in `src/types/`

### Phase 2: Generation APIs (Week 3-4)

**Tasks**:
1. Implement theme generation endpoint
2. Implement part summary generation endpoint
3. Implement chapter summary generation endpoint
4. Implement scene specification generation endpoint
5. Update scene content generation with cycle-aware prompts

**Deliverables**:
- `/api/generation/theme`
- `/api/generation/parts`
- `/api/generation/chapters`
- `/api/generation/scenes`
- Updated `/api/generation/scene-content`

### Phase 3: Complete Flow Integration (Week 5-6)

**Tasks**:
1. Update `scripts/generate-complete-story.mjs` to use new APIs
2. Implement seed planting and resolution tracking
3. Add causal linking visualization (optional UI feature)
4. Test full generation flow end-to-end

**Deliverables**:
- Updated story generation script
- Seed tracking system
- Complete adversity-triumph cycle generation working

### Phase 4: Evaluation & Optimization (Week 7-8)

**Tasks**:
1. Integrate scene evaluation with cycle phase awareness
2. Add cycle-specific quality metrics
3. Optimize prompts based on generation results
4. A/B test emotional resonance with test readers

**Deliverables**:
- Enhanced scene evaluation for cycle phases
- Prompt optimization based on testing
- Quality metrics dashboard

### Phase 5: Documentation & Testing (Week 9-10)

**Tasks**:
1. Complete API documentation
2. Write developer guide
3. Create example stories using new system
4. Comprehensive testing suite

**Deliverables**:
- Complete API docs
- Developer implementation guide
- 5+ example stories showcasing system
- Test suite with 80%+ coverage

---

## Part VII: Success Metrics

### Quantitative Metrics

1. **Generation Quality**
   - 90%+ scenes pass evaluation on first attempt
   - Average scene quality score: 3.5+/4.0
   - Causal linking success rate: 80%+ (seeds planted → resolved)

2. **Emotional Resonance**
   - Reader survey: "Did this story move you deeply?" - 70%+ yes
   - Specific emotions triggered (track via survey):
     * Empathy: 80%+
     * Moral elevation moments recognized: 60%+
     * Catharsis experienced: 50%+

3. **Structural Integrity**
   - 95%+ chapters successfully connect to previous/next
   - 90%+ part summaries successfully decompose into chapters
   - 85%+ scenes align with cycle phase specifications

### Qualitative Metrics

1. **Earned Luck Recognition**
   - Beta readers can identify causal links
   - Payoffs feel "surprising but inevitable"
   - No instances of deus ex machina reported

2. **Character Arc Satisfaction**
   - Character growth feels organic
   - Internal and external conflicts interweave naturally
   - Readers care about character outcomes

3. **Cyclical Engine Effectiveness**
   - Story momentum maintained throughout
   - Stakes escalate believably
   - Resolutions feel earned, not contrived

---

## Part VIII: References

This architecture is grounded in:

1. **"The Architecture of Affect" Research Document** (provided)
   - Adversity-Triumph Engine mechanics
   - Causally-linked serendipity principles
   - Emotional trigger taxonomy
   - Gam-dong, Jeong, Han concepts

2. **Narrative Theory**
   - Three-Act Structure (Aristotle, Syd Field)
   - The Hero's Journey (Joseph Campbell)
   - Character Arc Theory (internal + external conflict)

3. **Psychology**
   - Moral elevation (Haidt)
   - Catharsis (Aristotelian interpretation)
   - Narrative transportation (Green & Brock)
   - Empathy through fiction (Mar & Oatley)

4. **Cultural Studies**
   - Korean drama narrative techniques
   - Affective interludes
   - Jeong-based storytelling

---

## Appendix A: Example Story Using Adversity-Triumph Architecture

### Story Theme
```
In a post-war refugee camp where survival has destroyed trust, the power of unexpected compassion is tested when former enemies must cooperate to protect the next generation.
```

### Part I (Act I) Summary
```
CHARACTER: Minji (resilient survivor)
- Internal Adversity: Believes she can't trust anyone from "the other side" due to trauma of losing family
- External Adversity: Must share limited resources with former enemy soldiers in refugee camp
- Virtuous Action: Shares her last food with starving enemy child, driven by seeing her lost brother in the child's eyes (intrinsic, not strategic)
- Seeds Planted: Child's father (enemy soldier) witnesses this act
- Unintended Consequence: Child's father secretly leaves extra supplies at her tent over following weeks
- New Adversity Created: Camp commander suspects Minji of collaborating, threatens her position

CHARACTER: Jinho (former enemy soldier seeking redemption)
- Internal Adversity: Guilt over past actions in war, hiding identity
- External Adversity: Recognized by another refugee who lost family to his unit
- Virtuous Action: Confesses truth publicly, offers to leave camp to protect others
- Seeds Planted: His honesty earns respect from unexpected source (Minji)
- Unintended Consequence: Refugee who recognized him advocates for him to stay, based on his honesty
- New Adversity Created: Now fully exposed, targeted by hardliners on both sides
```

### Chapter 1 Summary
```
CHAPTER 1: The Weight of Bread

FOCUS: Minji
CONNECTED TO: N/A (inciting incident)

ADVERSITY:
- Internal: Believes anyone from "the other side" is dangerous, untrustworthy
- External: Forced to share camp space and resources with former enemy soldiers
- Why Now: Camp integration policy just announced, tensions explode

VIRTUOUS ACTION:
- What: Gives her last piece of bread to starving enemy child
- Why: Sees her lost brother in child's hunger, can't let another child suffer regardless of "side"
- Virtue Type: Compassion
- Moral Elevation Moment: The quiet moment when she hands over bread despite her own hunger
- Seeds Planted:
  * Child's father (Jinho) witnesses from distance
  * Minji's friend Sora sees her kindness

UNINTENDED CONSEQUENCE:
- What: Over next days, mysterious supplies appear at her tent
- Causal Link: Child's father leaving them, though she doesn't know
- Seeds Resolved: N/A (first chapter)
- Why Earned: Her compassion created debt of gratitude
- Emotional Impact: Hope - world isn't entirely cruel

NEW ADVERSITY:
- What: Camp commander suspects her of black market dealing or collaboration
- Stakes: Could lose her ration card, tent assignment, safety
- Hook: Commander confronts her as chapter ends
```

### Scene Breakdown
```json
{
  "scenes": [
    {
      "title": "The Announcement",
      "cyclePhase": "setup",
      "emotionalBeat": "tension",
      "specification": "Camp commander announces integration policy. Minji's internal resistance and fear manifest in her physical reaction and memories of loss. Establish her belief that she can't trust 'them.'",
      "characterFocus": "Minji",
      "sensoryAnchors": "Crowded mess hall, smell of thin soup, commander's voice echoing, heat of bodies pressed together",
      "dialogueVsDescription": "Balanced - commander's speech, crowd reactions, Minji's internal monologue",
      "suggestedLength": "medium"
    },
    {
      "title": "First Contact",
      "cyclePhase": "confrontation",
      "emotionalBeat": "fear",
      "specification": "Minji must share table with enemy soldiers at meal time. Her discomfort escalates when she sees a child among them—hungry, hollow-eyed. Internal conflict: her hatred vs. her memory of her brother.",
      "characterFocus": "Minji",
      "sensoryAnchors": "Scrape of bench, child's wide eyes, smell of unwashed uniforms, taste of her own fear",
      "dialogueVsDescription": "Description-heavy with sparse, tense dialogue",
      "suggestedLength": "medium"
    },
    {
      "title": "The Last Piece",
      "cyclePhase": "virtue",
      "emotionalBeat": "elevation",
      "specification": "Minji gives her last bread to the enemy child. THIS IS THE MOMENT. Show her internal shift—she doesn't calculate benefit, only sees a child who needs food. Jinho watches from distance, moved.",
      "characterFocus": "Minji (with Jinho observing)",
      "sensoryAnchors": "Weight of bread in hand, child's trembling fingers, Jinho's sharp intake of breath from across room",
      "dialogueVsDescription": "Description-heavy, minimal dialogue, let action speak",
      "suggestedLength": "long"
    },
    {
      "title": "Mysterious Gifts",
      "cyclePhase": "consequence",
      "emotionalBeat": "hope",
      "specification": "Three days later, Minji finds extra rice and medical supplies at her tent entrance. She doesn't know where they came from (audience knows it's Jinho). Her world view begins to crack—maybe kindness isn't futile.",
      "characterFocus": "Minji",
      "sensoryAnchors": "Early morning mist, weight of rice bag, confusion and cautious hope",
      "dialogueVsDescription": "Description-heavy, internal processing",
      "suggestedLength": "short"
    },
    {
      "title": "The Accusation",
      "cyclePhase": "transition",
      "emotionalBeat": "anxiety",
      "specification": "Camp commander confronts Minji about the supplies. Where did she get them? Is she collaborating? Trading on black market? Her good deed has created a new threat. End on commander's ultimatum.",
      "characterFocus": "Minji and Commander",
      "sensoryAnchors": "Commander's office, harsh light, sound of door slamming",
      "dialogueVsDescription": "Dialogue-heavy, tense interrogation",
      "suggestedLength": "medium"
    }
  ]
}
```

This example demonstrates:
- ✅ Clear adversity-triumph cycle
- ✅ Intrinsically motivated virtue (compassion for child, not strategy)
- ✅ Causally-linked serendipity (supplies are earned, not random)
- ✅ Resolution creates new adversity (generosity leads to accusation)
- ✅ Moral elevation moment (giving bread)
- ✅ Seeds planted (Jinho's witness) and resolved (supplies appear)
- ✅ Emotional trajectory: tension → fear → elevation → hope → anxiety

---

## Conclusion

This architecture transforms story generation from plot-driven to **emotion-driven**, using the Cyclic Adversity-Triumph Engine as the core mechanism for creating profound emotional resonance.

**Key Innovation**: Every level of the narrative hierarchy (story → part → chapter → scene) is structured around adversity-triumph cycles, with each cycle designed to trigger specific emotions (empathy → moral elevation → catharsis → Gam-dong).

**Implementation Priority**: Focus on system prompt engineering first—this is where 80% of the quality comes from. The data model and APIs are just scaffolding for the prompts to work effectively.

**Expected Outcome**: Stories that don't just entertain, but move readers deeply through the careful architecture of moral beauty, earned triumph, and the affirmation of human virtue.
