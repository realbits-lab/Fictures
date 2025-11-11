# Novels Generation Specification: Adversity-Triumph Engine

## Executive Summary

This document specifies the novels generation system using a **Cyclic Adversity-Triumph Engine** as the core narrative framework. This architecture is grounded in psychological principles of emotional resonance, focusing on empathy, catharsis, moral elevation, and the Korean concept of Gam-dong (감동 - profound emotional moving).

**Core Principle**: Stories generate deep emotional resonance through continuous cycles of adversity and triumph, powered by causally-linked serendipity (earned luck), unintended karmic rewards, and virtuous character actions.

**Status**: ✅ **Validated and Ready for Implementation**

**Related Documents:**
- 📋 **Development Guide** (`novels-development.md`): API specifications and system prompts for implementation
- 🧪 **Testing Guide** (`novels-testing.md`): Testing strategies, metrics, and validation methods

---

## Part I: Core Concepts

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

### 1.4 Quick Reference: Cycle Structure

**The 4-Phase Adversity-Triumph Cycle** (narrative structure):

```
1. ADVERSITY
   - Internal flaw (fear/belief/wound) + External obstacle
   - External conflict forces confrontation with internal conflict

2. VIRTUOUS ACTION
   - Character performs intrinsically motivated good deed
   - NOT transactional ("to get X")
   - Demonstrates courage/compassion/integrity/sacrifice/loyalty/wisdom

3. UNINTENDED CONSEQUENCE (Earned Luck)
   - Surprising resolution/reward emerges
   - Causally linked to past actions (not random)
   - Feels like karmic justice or poetic justice

4. NEW ADVERSITY
   - Resolution creates next problem
   - Stakes escalate
   - Cycle perpetuates
```

**Important Distinction:**
- **4 Cycle Phases** = The narrative structure (what happens in the story)
- **5 Scene Types** = How we divide the cycle into prose scenes (implementation)

See section 2.4 for how the 4-phase cycle maps to 5 scene types in practice.

### 1.5 Critical Success Factors

**Core Principles:**
1. **Intrinsic Motivation**: Virtuous actions MUST be genuine, not strategic
2. **Causal Linking**: Every event connects to previous actions (no deus ex machina)
3. **Seed Tracking**: Small actions pay off later as "earned luck"
4. **Cyclical Engine**: Every resolution creates next adversity
5. **Emotional Authenticity**: Show emotions through body/action, not tell

---

## Part II: Hierarchical Story Structure

### 2.1 Story Level (Foundation)

**Purpose**: Establish the world's moral framework and general thematic premise

**Key Field**:
- `summary` (text): General thematic premise, genre, tone, moral landscape
- NOT detailed adversity-triumph - just the world and its rules

**Content Format**:
```
Summary: "In a world where [setting/context], [moral principle] is tested when [inciting situation]"

Example: "In a fractured post-war society where trust has been shattered, the power of human connection is tested when strangers are forced to rely on each other to survive"
```

**Metadata to Track:**
- **Genre**: See Genre Catalog (section 2.1.1) for complete list and descriptions
- **Tone**: See Tone Catalog (section 2.1.2) for complete list and emotional characteristics
- **Moral Framework**: What virtues are valued? What vices are punished?
- **Characters** (2-4 main): name, core trait, internal flaw, external goal

#### 2.1.1 Genre Catalog

**Complete list of supported story genres with descriptions and characteristics:**

| Genre | Icon | Description | Key Elements | Emotional Appeal |
|-------|------|-------------|--------------|------------------|
| **Fantasy** | 🧙 | Magical worlds and supernatural elements | Magic systems, mythical creatures, epic quests, chosen ones, supernatural powers | Wonder, escapism, heroism, transformation |
| **Romance** | 💖 | Love stories and relationships | Emotional connections, relationship development, intimacy, partnership challenges, happy endings | Love, passion, connection, emotional fulfillment |
| **SciFi** | 🚀 | Future technology and space exploration | Advanced technology, space travel, AI, time travel, alternate realities, scientific concepts | Innovation, exploration, intellectual curiosity, futurism |
| **Mystery** | 🔍 | Puzzles and investigation | Clues, red herrings, detective work, plot twists, intellectual challenges, crime solving | Curiosity, suspense, intellectual satisfaction, revelation |
| **Horror** | 👻 | Fear and supernatural terror | Monsters, psychological terror, survival, supernatural threats, dark atmospheres | Fear, adrenaline, catharsis through terror, thrill |
| **Action** | ⚡ | Fast-paced battles and adventures | Combat sequences, chase scenes, physical conflict, high stakes, heroic feats | Excitement, adrenaline, vicarious thrill, empowerment |
| **Isekai** | 🌀 | Reborn or transported to new worlds | World transition, second chances, power growth, parallel worlds, adventure in foreign settings | Escapism, wish fulfillment, transformation, new beginnings |
| **LitRPG** | 🎮 | Game-like systems and progression | Stats and leveling, skill trees, quests, game mechanics, progression systems, achievement | Strategic satisfaction, measurable growth, gaming appeal |
| **Cultivation** | ⚔️ | Martial arts and power progression | Qi/energy systems, martial arts, power levels, spiritual growth, ancient wisdom, combat mastery | Mastery, self-improvement, power fantasy, discipline |
| **Slice** | ☕ | Everyday moments and relationships | Daily life, subtle emotions, character studies, mundane beauty, small victories, quiet reflection | Comfort, relatability, gentle warmth, peaceful reflection |
| **Paranormal** | 🌙 | Vampires, werewolves, and supernatural beings | Supernatural creatures, hidden worlds, forbidden love, dual identities, supernatural powers | Dark romance, mystique, forbidden attraction, otherworldly allure |
| **Dystopian** | 🏚️ | Dark futures and oppressive societies | Totalitarian governments, post-apocalyptic worlds, social commentary, survival, resistance | Social awareness, cautionary tales, rebellion, hope in darkness |
| **Historical** | 📜 | Stories set in the past | Period-accurate settings, historical events, cultural context, authentic details, bygone eras | Nostalgia, education, cultural appreciation, time travel through story |
| **LGBTQ** | 🏳️‍🌈 | LGBTQ+ romance and stories | Queer relationships, identity exploration, coming out, LGBTQ+ experiences, representation | Identity affirmation, representation, authentic love stories, community |

**Genre Selection Guidelines:**

1. **Primary Genre**: Choose the most dominant genre that defines the story's core experience
2. **Genre Blending**: Stories can incorporate elements from multiple genres, but select one primary
3. **Audience Targeting**: Consider target audience preferences when selecting genre
4. **Moral Framework Alignment**: Ensure genre supports the story's moral exploration
5. **Adversity-Triumph Compatibility**: Each genre should amplify the adversity-triumph cycles:
   - **Fantasy**: External magic/power obstacles force internal growth
   - **Romance**: Relationship adversity tests emotional maturity
   - **Mystery**: Investigation challenges reveal character depth
   - **Horror**: Fear forces courage and moral choices
   - **Action**: Physical conflict requires moral strength
   - **Isekai**: New world challenges test core values
   - **LitRPG**: System limitations force strategic virtue
   - **Cultivation**: Power progression mirrors spiritual growth
   - **Slice**: Small adversities create meaningful moments
   - **Paranormal**: Supernatural nature tests humanity/morality
   - **Dystopian**: Oppression challenges moral integrity
   - **Historical**: Period constraints force timeless choices
   - **LGBTQ**: Identity adversity demonstrates authentic courage

**Genre-Specific Adversity-Triumph Examples:**

**Fantasy:**
- **Adversity**: Young mage fears their destructive power (internal) + dark lord threatens kingdom (external)
- **Virtue**: Uses dangerous magic to save innocents despite risk of corruption
- **Consequence**: Power transforms into healing magic through selfless intent
- **New Adversity**: Healing power draws attention of jealous council

**Romance:**
- **Adversity**: Protagonist fears vulnerability (internal) + forced proximity with rival (external)
- **Virtue**: Chooses honesty about feelings despite risk of rejection
- **Consequence**: Rival reveals shared fear, connection deepens unexpectedly
- **New Adversity**: Past relationship trauma resurfaces, threatening new bond

**Mystery:**
- **Adversity**: Detective doubts own judgment (internal) + complex murder case (external)
- **Virtue**: Pursues truth despite pressure to close case quickly
- **Consequence**: Overlooked clue reveals institutional corruption
- **New Adversity**: Investigation puts detective's family at risk

**Cultivation:**
- **Adversity**: Cultivator believes power = worth (internal) + rival challenges them (external)
- **Virtue**: Helps weaker disciple instead of training for duel
- **Consequence**: Disciple's technique insight unlocks new cultivation path
- **New Adversity**: New path attracts forbidden sect's attention

**Code Reference:**
- **Constants**: `src/lib/constants/genres.ts` - Single source of truth for genre definitions
- **Type**: `StoryGenre` - TypeScript type for genre values
- **Metadata**: `GENRE_METADATA` - Detailed genre characteristics for UI and generation
- **Array**: `STORY_GENRES` - Array of all valid genre values for validation

#### 2.1.2 Tone Catalog

**Complete list of supported story tones with emotional characteristics and narrative guidance:**

| Tone | Label | Description | Emotional Characteristics | Narrative Guidance |
|------|-------|-------------|--------------------------|-------------------|
| **hopeful** | Hopeful | Optimistic and uplifting narratives that emphasize positive outcomes and character growth | Warmth, inspiration, light overcoming darkness, faith in humanity | Focus on resilience, redemption arcs, meaningful connections, and earned victories |
| **dark** | Dark | Grim and somber narratives exploring moral complexity, tragedy, and harsh realities | Tension, dread, moral ambiguity, harsh consequences, psychological depth | Emphasize difficult choices, moral compromise, tragic outcomes, and psychological realism |
| **bittersweet** | Bittersweet | Emotionally nuanced narratives balancing joy and sorrow, victory and loss | Melancholy beauty, poignant reflection, mixed emotions, nostalgic resonance | Balance triumph with sacrifice, happiness with loss, growth with letting go |
| **satirical** | Satirical | Witty and critical narratives using humor and irony to expose flaws and absurdities | Sharp wit, irony, social commentary, absurd humor, critical observation | Use irony and exaggeration to critique society, institutions, or human nature |

**Tone Selection Guidelines:**

1. **Emotional Foundation**: Choose tone based on the story's core emotional journey
2. **Genre Compatibility**: Ensure tone complements the selected genre
   - Fantasy + Hopeful = Epic triumph over darkness
   - Horror + Dark = Psychological terror and grim outcomes
   - Romance + Bittersweet = Love with sacrifices and losses
   - SciFi + Satirical = Social commentary through futuristic lens
3. **Adversity-Triumph Alignment**: Each tone amplifies the cycle differently:
   - **Hopeful**: Virtues lead to uplifting consequences, darkness eventually yields to light
   - **Dark**: Virtues may lead to tragic outcomes, moral complexity in consequences
   - **Bittersweet**: Virtues bring mixed blessings, joy and sorrow intertwined
   - **Satirical**: Virtues expose absurdities, ironic consequences reveal deeper truths
4. **Consistency**: Maintain tone throughout the story while allowing emotional variety within scenes
5. **Audience Appeal**: Consider reader expectations for emotional experience

**Tone-Specific Adversity-Triumph Examples:**

**Hopeful Tone:**
- **Adversity**: War orphan fears trusting others (internal) + must join refugee group to survive (external)
- **Virtue**: Shares last food with sick stranger despite own hunger
- **Consequence**: Stranger's family adopts orphan, providing home and belonging
- **New Adversity**: Family faces eviction, orphan must help save new home
- **Emotional Arc**: Fear → Generosity → Warmth → Renewed purpose

**Dark Tone:**
- **Adversity**: Detective compromised moral code (internal) + serial killer targets the innocent (external)
- **Virtue**: Refuses to use illegal methods despite pressure to stop killer quickly
- **Consequence**: Killer claims another victim while detective follows proper procedure
- **New Adversity**: Detective must live with guilt while continuing ethical investigation
- **Emotional Arc**: Moral conflict → Principled stand → Tragic loss → Haunting responsibility

**Bittersweet Tone:**
- **Adversity**: Aging artist fears irrelevance (internal) + final exhibition approaches (external)
- **Virtue**: Mentors young rival artist instead of competing for spotlight
- **Consequence**: Young artist's success overshadows mentor's final work, yet mentor finds peace in legacy
- **New Adversity**: Must accept fading recognition while celebrating student's rise
- **Emotional Arc**: Fear of obscurity → Generosity → Mixed triumph → Poignant acceptance

**Satirical Tone:**
- **Adversity**: Corporate drone believes success = conformity (internal) + absurd workplace demands (external)
- **Virtue**: Exposes ridiculous policy despite risk of termination
- **Consequence**: Gets promoted for "innovative thinking" while nothing actually changes
- **New Adversity**: Now must enforce same absurd policies as management
- **Emotional Arc**: Compliance → Bold honesty → Ironic reward → Absurd entrapment

**Code Reference:**
- **Constants**: `src/lib/constants/tones.ts` - Single source of truth for tone definitions
- **Type**: `StoryTone` - TypeScript type for tone values
- **Metadata**: `TONE_METADATA` - Detailed tone characteristics for UI and generation

### 2.2 Part Level (Act Structure)

**Purpose**: Define MACRO adversity-triumph arc for EACH main character within this act

**Key Concept: Nested Cycles**
- **Macro Arc** (Part-level): Complete character transformation over 2-4 chapters
- **Micro Cycles** (Chapter-level): Progressive steps building toward macro payoff

**Key Field**:
- `summary` (text): MACRO adversity-triumph arcs per character with progression planning

**Content Structure**:
```
ACT [I/II/III]: [Act Name]

CHARACTER: [Name]

MACRO ARC (Overall transformation for this act):
- Macro Adversity: [Major challenge/flaw confrontation]
- Macro Virtue: [Defining moral choice - THE moment for this act]
- Macro Consequence: [Major earned payoff/karmic result]
- Macro New Adversity: [How this creates next act's challenge]

PROGRESSION PLANNING:
- Estimated Chapters: [2-4 typically]
- Arc Position: [primary/secondary - primary gets more chapters]
- Progression Strategy: [How arc unfolds gradually]
  * Chapter N (Beginning): Setup macro adversity, first small choice
  * Chapter N+1 (Middle): Escalate crisis, bigger choices required
  * Chapter N+2 (Climax): MACRO VIRTUE demonstrated, major consequence
  * [Optional] Chapter N+3 (Resolution): Aftermath, transition

CHARACTER: [Name]
- Macro Arc: ...
- Progression: ...
- [etc.]

CHARACTER INTERACTIONS:
- How do their macro arcs intersect?
- Which chapters feature which characters? (Rotation strategy)
- What relationships (Jeong) form or deepen?
- What shared Han (wounds) are revealed?
- How do parallel arcs build toward convergence?
```

**Three-Act Structure Mapping**:
- **Act I (Setup)**: Introduce character flaws, inciting incident creates first adversity
  - Each character's macro arc unfolds over 2-3 chapters
- **Act II (Confrontation)**: Escalating macro arcs, midpoint reversal, character hits lowest point
  - Primary characters get 3-4 chapters, secondary get 2 chapters
  - Arcs interleave for variety and parallel development
- **Act III (Resolution)**: Final macro arcs resolve both internal and external conflicts
  - All character arcs converge toward story climax

### 2.3 Chapter Level (Micro Cycle)

**Purpose**: ONE complete adversity-triumph cycle (micro-cycle) that progressively builds the character's macro arc

**Key Concept: Micro Cycles within Macro Arcs**
- Each chapter is a self-contained cycle (complete on its own)
- Collectively, 2-4 micro-cycles build one macro arc
- Each micro-cycle advances the character toward their defining moment

**Key Fields**:
- `summary` (text): One micro-cycle adversity-triumph
- `characterId` (text): References Character.id (the character whose macro arc this chapter advances)
- `arcPosition` (enum): 'beginning' | 'middle' | 'climax' | 'resolution' (climax = MACRO moment)
- `contributesToMacroArc` (text): How does this advance the macro transformation?

**Content Structure**:
```
CHAPTER [N]: [Title]

MACRO ARC CONTEXT:
- Character: [Name]
- Macro Arc: [Brief macro adversity → macro virtue summary]
- Position in Arc: [beginning/middle/climax/resolution] (climax = MACRO moment)

MICRO-CYCLE (This Chapter):
FOCUS: [Character name(s)]
CONNECTED TO: [Previous chapter resolution that created this adversity]

ADVERSITY (Micro):
- Internal: [Specific fear/flaw being confronted]
- External: [Specific obstacle in this chapter]
- How it Advances Macro: [Connection to overall arc]

VIRTUOUS ACTION (Micro or MACRO):
- What: [Specific moral choice/act of goodness]
- Why: [Character's intrinsic motivation - NOT transactional]
- Is This MACRO Virtue?: [Yes/No]
- Seeds Planted: [What setup for future payoff?]

UNINTENDED CONSEQUENCE (Micro or MACRO):
- What: [Surprising resolution/reward]
- Why Earned: [How is this causally linked to past actions?]
- Seeds Resolved: [What past setup pays off here?]
- Magnitude: [Minor payoff OR Major macro consequence]

NEW ADVERSITY (Micro or MACRO):
- What: [Next problem created by this resolution]
- Stakes: [How are they higher than before?]
- Leads To: [Next chapter OR next act if macro moment]

PROGRESSION CONTRIBUTION:
[1-2 sentences explaining how this micro-cycle moves character closer to their macro virtue moment]
```

**Key Principles**:
- Each chapter MUST be a complete micro-cycle (works standalone)
- Each chapter MUST advance its macro arc progressively
- Focus on 1-2 characters max to maintain emotional depth
- Rotate between characters for variety (not all chapters for one character)
- Build tension gradually: beginning → middle → CLIMAX (macro moment)
- Climax chapter contains MACRO virtue and MACRO consequence

### 2.4 Scene Level (Cycle Phases)

**Purpose**: Divide chapter's adversity-triumph cycle into 3-7 narrative beats

**Key Fields**:
- `summary` (text): Scene specification - what happens, emotional beat, purpose, sensory anchors
- `content` (text): Full prose narrative generated from the summary
- `settingId` (text, nullable): References Setting.id - the physical location where this scene takes place

**Mapping 4-Phase Cycle to 5 Scene Types:**

The 4-phase narrative cycle (Adversity → Virtue → Consequence → New Adversity) is implemented as 5 scene types to provide better pacing and emotional flow:

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

**Two-Step Generation Process**:
1. Generate `summary` for all scenes in chapter (planning)
2. Generate `content` for each scene using its summary (execution)

### 2.5 Scene-Setting Connection Strategy

**Design Philosophy**: Settings are "emotional environments" that amplify cycle phases. Each scene explicitly references one primary setting to ground the narrative and enable setting-specific content generation.

**Implementation**:
- Each scene has optional `settingId` field (nullable for legacy/ambiguous scenes)
- Scene summaries generation selects appropriate setting based on:
  - **Cycle phase match**: Use setting's `cycleAmplification[phase]` to find best fit
  - **Action requirements**: Physical setting matches scene needs (confined space for confrontation, open space for freedom)
  - **Variety**: Aim to use all available settings across story, avoiding overuse of single location

**Setting Selection Guidance**:

| Cycle Phase | Setting Selection Strategy |
|-------------|----------------------------|
| **Setup** | Introduction/familiar settings (home, normal world) - establish comfort before adversity |
| **Confrontation** | Confined/adversity-rich settings - use `adversityElements` to create external pressure |
| **Virtue** | Contrast settings - barren/hostile environment makes virtue more powerful symbolically |
| **Consequence** | Transformation settings - use `symbolicMeaning` to reflect character change |
| **Transition** | Bridge settings - hint at new location/adversity through environment |

**Benefits**:
- ✅ Explicit location tracking for each scene
- ✅ Query-able scene-setting relationships
- ✅ Setting-specific image generation
- ✅ Consistent use of setting's sensory palette
- ✅ Enables setting-based navigation/filtering
- ✅ Analytics on setting usage patterns

---

## Part III: Data Model Specification

### 3.1 Character Schema (Zero-Base Design)

**Philosophy**: Characters are **moral agents** whose internal flaws create adversity, whose core virtues drive triumph, and whose transformation generates emotional resonance (Gam-dong).

```typescript
// Character table
interface Character {
  // === IDENTITY ===
  id: string;
  storyId: string;
  name: string;
  isMain: boolean; // Main characters (2-4) get MACRO arcs
  summary: string; // 1-2 sentence essence: "[CoreTrait] [role] [internalFlaw], seeking [externalGoal]"

  // === ADVERSITY-TRIUMPH CORE (The Engine) ===
  coreTrait: string; // THE defining moral virtue: "courage" | "compassion" | "integrity" | "loyalty" | "wisdom" | "sacrifice"
  internalFlaw: string; // MUST include cause: "[fears/believes/wounded by] X because Y"
  externalGoal: string; // What they THINK will solve their problem (healing flaw actually will)

  // === CHARACTER DEPTH (For Realistic Portrayal) ===
  personality: {
    traits: string[];        // Behavioral traits: "impulsive", "optimistic", "stubborn"
    values: string[];        // What they care about: "family", "honor", "freedom"
  };
  backstory: string; // Focused history providing motivation context (2-4 paragraphs)

  // === RELATIONSHIPS (Jeong System) ===
  relationships: {
    [characterId: string]: {
      type: 'ally' | 'rival' | 'family' | 'romantic' | 'mentor' | 'adversary';
      jeongLevel: number;      // 0-10: depth of connection (정 - affective bonds)
      sharedHistory: string;   // What binds them
      currentDynamic: string;  // Current relationship state
    };
  };

  // === PROSE GENERATION ===
  physicalDescription: {
    age: string;               // "mid-30s", "elderly", "young adult"
    appearance: string;        // Overall look
    distinctiveFeatures: string; // Memorable details for "show don't tell"
    style: string;            // How they dress/present themselves
  };
  voiceStyle: {
    tone: string;             // "warm", "sarcastic", "formal", "gentle"
    vocabulary: string;       // "simple", "educated", "technical", "poetic"
    quirks: string[];        // Verbal tics, repeated phrases
    emotionalRange: string;  // "reserved", "expressive", "volatile"
  };

  // === VISUAL GENERATION ===
  imageUrl: string | null;  // Original portrait (1024×1024 from DALL-E 3)
  imageVariants: {
    imageId: string;
    originalUrl: string;
    variants: Array<{
      format: 'avif' | 'jpeg';
      width: number;
      height: number;
      url: string;
    }>;
    generatedAt: string;
  } | null;

  // === METADATA ===
  createdAt: Date;
  updatedAt: Date;
}
```

#### Key Field Rationales

**coreTrait** (Critical):
- THE defining moral virtue that drives virtue scenes
- Single trait for focused moral elevation moments
- Valid values: courage, compassion, integrity, loyalty, wisdom, sacrifice
- Used in Part generation for MACRO virtue definition

**internalFlaw** (Critical):
- Source of ADVERSITY in cycles
- **MUST include cause** for specificity and empathy
- Format: "[fears/believes/wounded by] X because Y"
- Examples:
  - ✅ "fears abandonment because lost family in war and never felt secure since"
  - ✅ "believes strength means never showing emotion because father punished vulnerability"
  - ❌ "has trust issues" (too vague)

**externalGoal**:
- What character THINKS will solve their problem
- Creates dramatic irony (healing flaw is actual solution)
- External obstacle forces facing internal flaw

**personality vs coreTrait**:
- `coreTrait` = **MORAL** virtue (drives virtue scenes)
- `personality.traits` = **BEHAVIORAL** characteristics (drives everyday scenes)
- Both needed for dimensional, realistic characters

**relationships (Jeong System)**:
- Tracks 정 (deep affective bonds) between characters
- `jeongLevel` (0-10) determines emotional stakes
- High jeongLevel (7-10) makes virtuous actions more meaningful
- Enables relationship arcs parallel to character arcs

**voiceStyle**:
- Ensures distinct, authentic dialogue per character
- Prevents generic "everyone sounds the same" problem
- AI uses this to generate character-specific speech patterns

### 3.2 Setting Schema (Zero-Base Design)

**Philosophy**: Settings are **emotional environments** that create external adversity, amplify cycle phases through atmosphere, and serve as symbolic mirrors for character transformation.

```typescript
// Setting table
interface Setting {
  // === IDENTITY ===
  id: string;
  storyId: string;
  name: string;
  summary: string; // Comprehensive paragraph (3-5 sentences)

  // === ADVERSITY-TRIUMPH CORE (The Engine) ===
  adversityElements: {
    physicalObstacles: string[];    // Environmental challenges: "harsh desert heat", "crumbling infrastructure"
    scarcityFactors: string[];      // Limited resources that force choices: "water shortage", "food scarcity"
    dangerSources: string[];        // Threats from environment: "unstable buildings", "hostile wildlife"
    socialDynamics: string[];       // Community factors: "distrust between neighbors", "gang territories"
  };
  symbolicMeaning: string;          // How setting reflects story's moral framework (1-2 sentences)
  cycleAmplification: {
    setup: string;                  // How setting establishes adversity: "oppressive heat weighs on characters"
    confrontation: string;          // How setting intensifies conflict: "confined space forces interaction"
    virtue: string;                 // How setting contrasts/witnesses moral beauty: "barren land vs. act of nurture"
    consequence: string;            // How setting transforms or reveals: "garden blooms, proving hope possible"
    transition: string;             // How setting hints at new problems: "storm clouds gathering"
  };

  // === EMOTIONAL ATMOSPHERE ===
  mood: string;                     // Primary emotional quality: "oppressive and surreal", "hopeful but fragile"
  emotionalResonance: string;       // What emotion this amplifies: "isolation", "hope", "fear", "connection"

  // === SENSORY IMMERSION (For Prose Generation) ===
  sensory: {
    sight: string[];                // Visual details (5-10 items)
    sound: string[];                // Auditory elements (3-7 items)
    smell: string[];                // Olfactory details (2-5 items)
    touch: string[];                // Tactile sensations (2-5 items)
    taste: string[] | null;         // Flavor elements (0-2 items, optional - can be null)
  };
  architecturalStyle: string; // Structural design language (if applicable)

  // === VISUAL GENERATION ===
  imageUrl: string | null;  // Original environment image (1792×1024, 16:9 from DALL-E 3)
  imageVariants: {
    imageId: string;
    originalUrl: string;
    variants: Array<{
      format: 'avif' | 'jpeg';
      width: number;
      height: number;
      url: string;
    }>;
    generatedAt: string;
  } | null;
  visualReferences: string[];       // Style inspirations: ["Blade Runner 2049", "Studio Ghibli countryside"]
  colorPalette: string[];           // Dominant colors: ["warm golds", "dusty browns", "deep greens"]

  // === METADATA ===
  createdAt: Date;
  updatedAt: Date;
}
```

#### Key Field Rationales

**adversityElements** (Critical):
- THE source of external conflict in adversity-triumph cycles
- Creates obstacles that force characters to confront internal flaws
- Four categories cover all environmental adversity types:
  - Physical: Tangible environmental challenges
  - Scarcity: Resource limitations forcing moral choices
  - Danger: Threats requiring courage/sacrifice
  - Social: Community dynamics creating interpersonal conflict

**symbolicMeaning**:
- Connects setting to story's moral framework
- Makes environment meaningful beyond just backdrop
- Example: "Destroyed city represents broken trust and loss of community—garden becomes symbol of healing and renewal"

**cycleAmplification**:
- Specifies HOW setting amplifies each cycle phase
- Guides scene content generation to use setting appropriately
- Ensures setting actively participates in emotional architecture
- Different settings can amplify same phase differently (desert heat vs. cold rain both create adversity)

**sensory arrays**:
- Provide concrete details for "show don't tell" prose
- Ground abstract emotions in physical experiences
- Enable deep sensory immersion in scenes
- Must be SPECIFIC: "wind rattling dry leaves" not "nature sounds"

**cycleAmplification vs mood**:
- `mood` = Overall atmospheric quality (static)
- `cycleAmplification` = How atmosphere shifts with narrative phases (dynamic)
- Both needed for rich, emotionally responsive environments

### 3.3 Story Schema

```typescript
// Story table (from src/lib/db/schema.ts)
interface Story {
  // === IDENTITY ===
  id: string;
  authorId: string;
  title: string;

  // === ADVERSITY-TRIUMPH CORE ===
  summary: string; // General thematic premise and moral framework
  genre: StoryGenre; // See Genre Catalog (section 2.1.1)
  tone: StoryTone; // 'hopeful' | 'dark' | 'bittersweet' | 'satirical' (see Tone Catalog 2.1.2)
  moralFramework: string; // What virtues are valued in this world?

  // === PUBLISHING & ENGAGEMENT ===
  status: 'writing' | 'published'; // Default: 'writing'
  viewCount: number; // Default: 0
  rating: number; // Default: 0
  ratingCount: number; // Default: 0

  // === VISUAL ===
  imageUrl: string | null; // Original story cover image (1344×768, 7:4 aspect ratio)
  imageVariants: {
    imageId: string;
    originalUrl: string;
    variants: Array<{
      format: 'avif' | 'jpeg';
      width: number;
      height: number;
      url: string;
    }>;
    generatedAt: string;
  } | null;

  // === METADATA ===
  createdAt: string; // Timestamp as ISO string
  updatedAt: string; // Timestamp as ISO string

  // Note: Main characters (2-4 with isMain=true) stored in characters table
  // Note: Settings (2-6 primary) stored in settings table
}
```

**Database Column Mapping:**
- TypeScript fields use camelCase (e.g., `authorId`, `viewCount`)
- Database columns use snake_case (e.g., `author_id`, `view_count`)
- Drizzle ORM automatically handles the mapping

**Nullability:**
- Core identity fields (id, authorId, title, status) are NOT NULL
- Content fields (summary, genre, tone, moralFramework) are nullable (generated during creation)
- Visual fields (imageUrl, imageVariants) are nullable
- Engagement metrics have default values (0)

**Code Reference:**
- **Schema**: `src/lib/db/schema.ts:273-333` - Complete story table definition
- **Types**: `src/lib/studio/generators/zod-schemas.generated.ts` - Generated Zod schemas
- **Constants**: `src/lib/constants/genres.ts`, `src/lib/constants/tones.ts` - Genre and tone definitions

### 3.4 Part Schema

```typescript
// Part table (from src/lib/db/schema.ts)
interface Part {
  // === IDENTITY ===
  id: string;
  storyId: string;
  title: string;

  // === ADVERSITY-TRIUMPH CORE (Act Structure) ===
  summary: string; // MACRO adversity-triumph arcs per character with progression planning

  // === MACRO ARC TRACKING (Nested Cycles) ===
  // Stored as JSON in database
  characterArcs: Array<{
    characterId: string; // References Character.id

    // MACRO ARC (Part-level transformation)
    // Derived from Character.internalFlaw, Character.coreTrait, Character.externalGoal
    macroAdversity: {
      internal: string;  // From Character.internalFlaw
      external: string;  // External obstacle that forces facing internal flaw
    };
    macroVirtue: string;         // From Character.coreTrait - THE defining moral choice
    macroConsequence: string;    // Earned payoff for virtue
    macroNewAdversity: string;   // How resolution creates next act's challenge

    // Progression planning
    estimatedChapters: number;     // 2-4 typical
    arcPosition: 'primary' | 'secondary';  // Primary arcs get more chapters
    progressionStrategy: string;    // How does this unfold gradually?
    // Example: "Gradual escalation across 3 chapters: setup → crisis → resolution"
  }> | null;

  // === ORDERING ===
  orderIndex: number; // Act number / order

  // === METADATA ===
  createdAt: string; // Timestamp as ISO string
  updatedAt: string; // Timestamp as ISO string
}
```

**Database Column Mapping:**
- TypeScript fields use camelCase (e.g., `storyId`, `orderIndex`)
- Database columns use snake_case (e.g., `story_id`, `order_index`)
- `characterArcs` stored as JSON type in database

**Nullability:**
- Core identity fields (id, storyId, title) are NOT NULL
- Content fields (summary, characterArcs, orderIndex) are nullable

**Code Reference:**
- **Schema**: `src/lib/db/schema.ts:335-385` - Complete part table definition

### 3.5 Chapter Schema

```typescript
// Chapter table (from src/lib/db/schema.ts)
interface Chapter {
  // === IDENTITY ===
  id: string;
  storyId: string;
  partId: string;
  title: string;

  // === ADVERSITY-TRIUMPH CORE (Micro Cycle) ===
  summary: string; // ONE complete adversity-triumph cycle

  // === NESTED CYCLE TRACKING (Links micro-cycle to macro arc) ===
  characterId: string; // References Character.id (the character whose macro arc this chapter advances)
  arcPosition: 'beginning' | 'middle' | 'climax' | 'resolution'; // 'climax' = MACRO moment
  contributesToMacroArc: string; // How this chapter advances the macro arc

  // === CYCLE TRACKING ===
  focusCharacters: string[]; // Array of Character IDs, default: []
  adversityType: 'internal' | 'external' | 'both';
  virtueType: 'courage' | 'compassion' | 'integrity' | 'sacrifice' | 'loyalty' | 'wisdom';

  // === CAUSAL LINKING (For Earned Luck) ===
  // Both stored as JSON in database
  seedsPlanted: Array<{
    id: string;
    description: string;
    expectedPayoff: string;
  }>; // Default: []

  seedsResolved: Array<{
    sourceChapterId: string;
    sourceSceneId: string;
    seedId: string;
    payoffDescription: string;
  }>; // Default: []

  // === CONNECTION TO NARRATIVE FLOW ===
  connectsToPreviousChapter: string; // How previous resolution created this adversity
  createsNextAdversity: string; // How this resolution creates next problem

  // === PUBLISHING ===
  status: 'writing' | 'published'; // Default: 'writing'
  publishedAt: string | null; // Timestamp as ISO string
  scheduledFor: string | null; // Timestamp as ISO string

  // === ORDERING ===
  orderIndex: number;

  // === METADATA ===
  createdAt: string; // Timestamp as ISO string
  updatedAt: string; // Timestamp as ISO string
}
```

**Database Column Mapping:**
- TypeScript fields use camelCase (e.g., `storyId`, `partId`, `publishedAt`)
- Database columns use snake_case (e.g., `story_id`, `part_id`, `published_at`)
- JSON fields: `focusCharacters`, `seedsPlanted`, `seedsResolved`

**Nullability:**
- Core identity fields (id, storyId, title, status, orderIndex) are NOT NULL
- Part relationship (partId) is nullable
- All Adversity-Triumph tracking fields are nullable
- Causal linking arrays have default empty array values

**Code Reference:**
- **Schema**: `src/lib/db/schema.ts:387-468` - Complete chapter table definition
- **Enums**: `adversityType` (line 21-25), `arcPosition` (line 35-40), `virtueType` (line 134-141)

### 3.6 Scene Schema

**Important**: Scene has two schema definitions:
- **Database Schema** (below): Allows nulls for flexibility during creation/editing
- **Generation Schema** (`GeneratedSceneSummarySchema`): All fields required for AI generation

```typescript
// Scene table (from src/lib/db/schema.ts)
// Database storage schema - allows nulls for flexibility
interface Scene {
  // === IDENTITY ===
  id: string;
  chapterId: string;
  title: string;

  // === SCENE SPECIFICATION (Planning Layer) ===
  summary: string; // Scene specification: what happens, emotional beat, purpose, sensory anchors

  // === CYCLE PHASE TRACKING ===
  cyclePhase: 'setup' | 'confrontation' | 'virtue' | 'consequence' | 'transition' | null;
  emotionalBeat: 'fear' | 'hope' | 'tension' | 'relief' | 'elevation' | 'catharsis' | 'despair' | 'joy' | null;

  // === PLANNING METADATA (Guides Content Generation) ===
  characterFocus: string[]; // Array of Character IDs, default: []
  settingId: string | null; // Setting ID where this scene takes place (references Setting.id, nullable for legacy/ambiguous scenes)
  sensoryAnchors: string[]; // Array of sensory details, default: []
  dialogueVsDescription: string; // Balance guidance (e.g., "60% dialogue, 40% description")
  suggestedLength: 'short' | 'medium' | 'long'; // short: 300-500, medium: 500-800, long: 800-1000 words

  // === GENERATED PROSE (Execution Layer) ===
  content: string; // Full prose narrative generated from summary, default: ""

  // === VISUAL ===
  imageUrl: string | null;
  imageVariants: {
    imageId: string;
    originalUrl: string;
    variants: Array<{
      format: 'avif' | 'jpeg';
      width: number;
      height: number;
      url: string;
    }>;
    generatedAt: string;
  } | null;

  // === PUBLISHING (Novel Format) ===
  visibility: 'private' | 'unlisted' | 'public'; // Default: 'private'
  publishedAt: string | null; // Timestamp as ISO string
  publishedBy: string | null; // User ID who published
  unpublishedAt: string | null; // Timestamp as ISO string
  unpublishedBy: string | null; // User ID who unpublished
  scheduledFor: string | null; // Timestamp as ISO string
  autoPublish: boolean; // Default: false

  // === COMIC FORMAT ===
  comicStatus: 'none' | 'draft' | 'published'; // Default: 'none'
  comicPublishedAt: string | null; // Timestamp as ISO string
  comicPublishedBy: string | null; // User ID who published comic
  comicUnpublishedAt: string | null; // Timestamp as ISO string
  comicUnpublishedBy: string | null; // User ID who unpublished comic
  comicGeneratedAt: string | null; // Timestamp as ISO string
  comicPanelCount: number; // Default: 0
  comicVersion: number; // Default: 1

  // === ANALYTICS ===
  viewCount: number; // Default: 0
  uniqueViewCount: number; // Default: 0
  novelViewCount: number; // Default: 0
  novelUniqueViewCount: number; // Default: 0
  comicViewCount: number; // Default: 0
  comicUniqueViewCount: number; // Default: 0
  lastViewedAt: string | null; // Timestamp as ISO string

  // === ORDERING ===
  orderIndex: number;

  // === METADATA ===
  createdAt: string; // Timestamp as ISO string
  updatedAt: string; // Timestamp as ISO string
}
```

**Database Column Mapping:**
- TypeScript fields use camelCase (e.g., `chapterId`, `imageUrl`, `publishedAt`)
- Database columns use snake_case (e.g., `chapter_id`, `image_url`, `published_at`)
- JSONB fields: `characterFocus`, `sensoryAnchors`

**Nullability (Database Schema):**
- Core identity fields (id, chapterId, title, visibility, orderIndex) are NOT NULL
- Content generation fields (summary, cyclePhase, emotionalBeat, settingId, dialogueVsDescription, suggestedLength) are nullable to allow:
  - Manual editing and draft states
  - Legacy scenes created before schema updates
  - Incremental scene development
- Generated prose (content) has default empty string
- JSONB arrays (characterFocus, sensoryAnchors) have default empty array values
- All publishing and analytics fields are nullable or have default values

**Nullability (Generation Schema):**
- ✅ ALL fields are required - AI must provide complete scene specifications
- ⚠️ This is enforced at the Zod schema level, not the database level
- 🔄 When AI generates scenes, all fields must be present and valid

**Code Reference:**
- **Database Schema**: `src/lib/db/schema.ts:470-591` - Complete scene table definition
- **Generation Schema**: `src/lib/studio/generators/zod-schemas.generated.ts:740-785` - AI generation schema
- **Enums**: `cyclePhase` (line 62-67), `emotionalBeat` (line 68-73), `visibility` (line 142-146), `comicStatus` (line 48-52)
- **Enum Constants**: `CYCLE_PHASES`, `EMOTIONAL_BEATS`, `SUGGESTED_LENGTHS` (line 681-706)

#### Scene Generation Schema

The `GeneratedSceneSummarySchema` is used by AI to generate scene summaries. Unlike the database schema, **all fields are required** to ensure complete scene specifications:

```typescript
// GeneratedSceneSummarySchema (from zod-schemas.generated.ts)
// AI generation schema - all fields required
interface GeneratedSceneSummary {
  title: string;                    // Scene title - descriptive and engaging
  summary: string;                  // Scene specification: what happens, emotional beat, purpose, and key moments
  cyclePhase: CyclePhase;          // Position in adversity-triumph cycle (required)
  emotionalBeat: EmotionalBeat;    // Target emotional response (required)
  characterFocus: string[];         // Array of character IDs (required, can be empty array)
  settingId: string;               // Setting ID where scene takes place (required)
  sensoryAnchors: string[];        // Concrete sensory details (required, can be empty array)
  dialogueVsDescription: string;   // Balance guidance (required, e.g., "60% dialogue, 40% description")
  suggestedLength: SuggestedLength; // Recommended word count (required)
}

// Enum types
type CyclePhase = 'setup' | 'confrontation' | 'virtue' | 'consequence' | 'transition';
type EmotionalBeat = 'fear' | 'hope' | 'tension' | 'relief' | 'elevation' | 'catharsis' | 'despair' | 'joy';
type SuggestedLength = 'short' | 'medium' | 'long';
```

**Key Differences from Database Schema:**
- ✅ All fields are **required** (no nulls)
- ✅ Enum types are strictly typed using exported constants
- ✅ Arrays cannot be null (use empty arrays instead)
- ✅ Comprehensive `.describe()` annotations guide AI generation
- ⚠️ `settingId` is required (AI must always assign a setting)

**Why Two Schemas?**
- **Database**: Flexible for manual editing, legacy data, and incomplete scenes
- **Generation**: Strict requirements ensure AI produces complete, valid scene specifications

---

## Part IV: Success Metrics

**Note**: For detailed testing methodology, evaluation frameworks, and complete metric definitions, see **Testing Guide** (`adversity-triumph-testing.md`).

### 4.1 Baseline Performance Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| **Cycle Completeness** | 100% | 90% |
| **Causal Chain Continuity** | 100% | 95% |
| **Seed Resolution Rate** | 60-80% | 50% |
| **Scene Quality Score** | 3.5+/4.0 | 3.0+/4.0 |
| **First-Pass Success** | 85% | 70% |
| **Moral Elevation Detection** | 80% | 70% |
| **Gam-dong Response** | 80% | 60% |
| **Intrinsic Motivation** | 90% | 70% |

### 4.2 Metric Categories

**Structural Metrics:**
- Cycle Completeness, Causal Chain Continuity, Seed Resolution Rate, Phase Coverage

**Quality Metrics:**
- Scene Quality Score, First-Pass Success Rate, Word Count Accuracy, Formatting Compliance

**Emotional Metrics:**
- Moral Elevation Detection, Gam-dong Response, Emotional Beat Accuracy, Catharsis Experience

*See Testing Guide (Part III) for detailed measurement methods and evaluation rubrics.*

### 4.3 Validated Baseline Results

From "The Last Garden" test story:

| Metric | Target | Achieved | Status |
|--------|--------|----------|--------|
| Cycle Completeness | 90% | 100% | ✅ EXCEEDED |
| Causal Chain Continuity | 95% | 100% | ✅ EXCEEDED |
| Seed Resolution Rate | 60% | 80% | ✅ EXCEEDED |
| Scene Quality Score | 3.5+/4.0 | 3.83 | ✅ EXCEEDED |
| First-Pass Success | 85% | 88% | ✅ PASS |
| Moral Elevation Detection | 80% | 100% | ✅ EXCEEDED |
| Gam-dong Response | 60% | 75% | ✅ EXCEEDED |
| Intrinsic Motivation | 70% | 100% | ✅ EXCEEDED |

**Conclusion**: System performs above expectations at baseline. Ready for production.

*See Testing Guide (Part IV) for complete test story analysis and detailed results.*

---

## Part VI: Adversity-Triumph Engine

### System Overview
- Focus: Emotional engineering at every level
- Structure: Hierarchical AND cycle-based (fractal design)
- Emotional design: Explicit targeting of empathy/elevation/catharsis/Gam-dong
- Quality control: Cycle validation + scene evaluation + iterative improvement

### Core Components
- **Scene Evaluation**: Quality assessment using "Architectonics of Engagement"
- **Image Generation**: Gemini 2.5 Flash for visual storytelling
- **Publishing Flow**: Automated scene-by-scene scheduling
- **Generation Pipeline**: 9-phase system with iterative improvement
- **Add**: Seed tracking, causal linking validation, emotional metrics
