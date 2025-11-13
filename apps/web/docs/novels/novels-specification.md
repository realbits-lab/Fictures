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

#### 2.1.0 Generation Sequence

**IMPORTANT**: Story creation is a **multi-phase process**. The Story entity itself does NOT contain character or setting data directly.

**Phase 1: Story Foundation**
- Generate: genre, tone, moralFramework, summary
- Output: Story record with foundational metadata
- Characters and Settings are NOT created in this phase

**Phase 2: Character Generation** (see section 3.1)
- Input: Story.id, Story.genre, Story.tone, Story.moralFramework, Story.summary
- Generate: 2-4 main characters with full Character schema data
- Output: Character records linked to Story via storyId

**Phase 3: Setting Generation** (see section 3.2)
- Input: Story.id, Story.genre, Story.tone, Story.summary, Characters
- Generate: 2-6 primary settings
- Output: Setting records linked to Story via storyId

**Phase 4+**: Part → Chapter → Scene generation (incremental)

#### 2.1.0a Input/Output Specification

**INPUT** (Story Generation):
```typescript
{
  userPrompt: string;  // User's creative direction for the story
}
```

**GENERATION PROCESS**:
1. Analyze user prompt to understand story concept and themes
2. Generate story title based on prompt
3. Select appropriate genre from Genre Catalog (2.1.1)
4. Select appropriate tone from Tone Catalog (2.1.2)
5. Define moral framework (what virtues/vices matter in this world)
6. Generate thematic summary using content format above

**OUTPUT** (Story Record):
```typescript
{
  id: string;                 // Generated UUID
  authorId: string;           // From authenticated session
  title: string;              // Generated
  genre: StoryGenre;          // Generated
  tone: StoryTone;            // Generated
  moralFramework: string;     // Generated
  summary: string;            // Generated
  status: 'writing';          // Initial status
  // Visual and metadata fields initialized as null/defaults
}
```

**Note**: After Story generation completes, proceed to Character generation (Phase 2), then Setting generation (Phase 3).

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
- **Macro Arc** (Part-level): Complete character transformation within this act
- **Micro Cycles** (Chapter-level): Each chapter advances character toward macro payoff
- **Incremental Writing**: Chapters generated one-by-one; Part defines MACRO arc only

**Key Fields**:
- `summary` (text): MACRO adversity-triumph arcs per character
- `settingIds` (string[]): Settings available for use in this Part (subset of Story's settings)

#### 2.2.0 Input/Output Specification

**INPUT** (Part Generation):
```typescript
{
  // Story context
  story: Story;                 // Complete story with all metadata

  // Available resources
  characters: Character[];      // Main characters (isMain=true)
  settings: Setting[];          // All story settings

  // Previous Parts context (all previous parts in order)
  previousParts: Part[];        // Empty array if first Part
}
```

**GENERATION PROCESS**:
1. **Generate Title**: Create part title based on story arc position and themes
2. **Determine Act Type**: Setup vs. Confrontation vs. Resolution (or other structure based on story needs)
3. **Select Settings**: Choose 2-4 settings from Story.settings that fit this part's atmosphere and thematic needs
4. **Define Character Arcs**: For each main character, create MACRO arc:
   - **Macro Adversity**: Major challenge/flaw confrontation for this part
     - Internal: From Character.internalFlaw (what fear/belief/wound is confronted?)
     - External: What obstacle forces facing the internal conflict?
   - **Macro Virtue**: THE defining moral choice from Character.coreTrait
     - Intrinsically motivated act of courage/compassion/integrity/sacrifice/loyalty/wisdom
     - This is the MORAL CLIMAX of this part's arc
   - **Macro Consequence**: Major earned payoff/karmic result
     - Surprising but causally-linked result of the virtue
     - How does the moral universe reward this character?
   - **Macro New Adversity**: How this resolution creates next part's challenge
     - What new problem emerges from the resolution?
     - How do stakes escalate?
5. **Plan Character Interactions**: Determine how character arcs intersect
   - Which relationships (Jeong) form or deepen?
   - What shared Han (wounds) are revealed?
   - How do parallel arcs converge toward part climax?
6. **Generate Summary**: Comprehensive description of all macro arcs, their convergence, and this part's role in overall story

**OUTPUT** (Part Generation Data):
```typescript
{
  title: string;                // Generated act title

  summary: string;              // Generated comprehensive summary

  characterArcs: Array<{
    characterId: string;

    // MACRO ARC (Part-level transformation)
    macroAdversity: {
      internal: string;         // From Character.internalFlaw
      external: string;         // External obstacle forcing confrontation
    };
    macroVirtue: string;        // From Character.coreTrait
    macroConsequence: string;   // Earned payoff
    macroNewAdversity: string;  // Creates next act's challenge
  }>;

  settingIds: string[];         // Selected settings for this Part
}
```

**Note**: `storyId` and `orderIndex` are automatically handled by the system (not part of generation data).

**Common Story Structures** (not prescriptive):
- **Three-Act**: Setup → Confrontation → Resolution
- **Four-Act**: Setup → Complication → Development → Resolution
- **Five-Act**: Exposition → Rising Action → Climax → Falling Action → Denouement
- **Custom**: Generator determines optimal structure based on story needs

**Note on Incremental Writing**:
- Part defines **MACRO arc destination** but NOT detailed chapter-by-chapter progression
- Each Chapter generated individually will advance its character toward the macro payoff
- This allows flexibility while maintaining coherent character transformation

### 2.3 Chapter Level (Micro Cycle)

**Purpose**: ONE complete adversity-triumph cycle (micro-cycle) that progressively builds the character's macro arc

**Key Concept: Micro Cycles within Macro Arcs**
- Each chapter is a self-contained cycle (complete on its own)
- Each micro-cycle advances the character toward their MACRO virtue moment
- Multiple chapters collectively build one character's macro arc

**Key Fields**:
- `summary` (text): One micro-cycle adversity-triumph
- `characterId` (text): References Character.id
- `characterArc` (object): Structured micro-cycle tracking
- `arcPosition` (enum): 'beginning' | 'middle' | 'climax' | 'resolution'
- `settingIds` (string[]): Settings used in this chapter (subset of Part's settings)

#### 2.3.0 Input/Output Specification

**INPUT** (Chapter Generation):
```typescript
{
  storyId: string;
  partId: string;
  title: string;
  orderIndex: number;           // Chapter sequence within Part

  // Context from Story
  story: {
    genre: StoryGenre;
    tone: StoryTone;
    moralFramework: string;
  };

  // Context from Part
  part: {
    characterArcs: Array<{
      characterId: string;
      macroAdversity: { internal: string; external: string };
      macroVirtue: string;
      macroConsequence: string;
      macroNewAdversity: string;
    }>;
    settingIds: string[];       // Available settings for this Part
  };

  // Focus character for THIS chapter
  focusCharacterId: string;     // Which character's arc advances in this chapter
  arcPosition: 'beginning' | 'middle' | 'climax' | 'resolution';

  // Previous Chapter context (if exists)
  previousChapter?: {
    id: string;
    characterArc: MicroCharacterArc;
    seedsPlanted: Seed[];
  };

  // Available resources
  characters: Character[];
  settings: Setting[];          // Filtered by Part.settingIds
}
```

**GENERATION PROCESS**:
1. **Identify Macro Context**: Get character's MACRO arc from Part.characterArcs
2. **Determine Micro-Cycle Position**: Is this beginning/middle/climax/resolution of macro arc?
3. **Select Settings**: Choose 1-3 settings from Part.settingIds that fit this chapter's needs
4. **Define Micro-Cycle**:
   - **Micro Adversity**: Specific challenge within larger macro adversity
   - **Micro Virtue**: Moral choice building toward MACRO virtue
   - **Micro Consequence**: Earned result (minor or MAJOR if climax)
   - **Micro New Adversity**: Next problem (feeds next chapter or next Part)
5. **Plant/Resolve Seeds**: Setup future payoffs or resolve past setups
6. **Generate Summary**: Comprehensive chapter description

**OUTPUT** (Chapter Record):
```typescript
{
  id: string;
  storyId: string;
  partId: string;
  title: string;
  orderIndex: number;

  summary: string;              // Generated comprehensive summary

  // Primary character whose arc this chapter advances
  characterId: string;

  // Structured micro-cycle tracking
  characterArc: {
    microAdversity: {
      internal: string;         // Specific fear/flaw confronted
      external: string;         // Specific obstacle in this chapter
    };
    microVirtue: string;        // Moral choice (building toward MACRO)
    microConsequence: string;   // Earned result
    microNewAdversity: string;  // Next problem created
    contributesToMacroArc: string; // How this advances MACRO transformation
  };

  // Position in macro arc
  arcPosition: 'beginning' | 'middle' | 'climax' | 'resolution';

  // Settings used in this chapter
  settingIds: string[];

  // Causal linking
  focusCharacters: string[];    // All characters featured (array of IDs)
  adversityType: 'internal' | 'external' | 'both';
  virtueType: VirtueType;       // From Character.coreTrait

  seedsPlanted: Seed[];         // Setup for future chapters
  seedsResolved: SeedResolution[]; // Payoffs from past chapters

  connectsToPreviousChapter: string;
  createsNextAdversity: string;

  status: 'writing';
}
```

**Content Structure**:
```
CHAPTER [N]: [Title]

MACRO ARC CONTEXT:
- Character: [Name]
- Macro Arc: [Brief macro adversity → macro virtue summary from Part]
- Position in Arc: [beginning/middle/climax/resolution]
  - beginning/middle: Build up to and perform MACRO virtue
  - climax: Experience MACRO consequence
  - resolution: Handle aftermath, transition to next Part
- Progression Contribution: [How this micro-cycle moves character closer to macro virtue moment or consequence]

MICRO-CYCLE (This Chapter):
FOCUS: [Character name(s)]
CONNECTED TO: [Previous chapter resolution that created this adversity]

CHARACTER ARC (Structured):
  Micro Adversity:
    - Internal: [Specific fear/flaw being confronted]
    - External: [Specific obstacle in this chapter]

  Micro Virtue: [Specific moral choice/act building toward MACRO virtue]
    - Motivation: [Why character acts - must be intrinsic, NOT transactional]
    - Is This MACRO Virtue?: [Yes if arcPosition='beginning' or 'middle', No otherwise]
    - Note: MACRO virtue performed in beginning/middle phases

  Micro Consequence: [Surprising resolution/reward]
    - Why Earned: [Causal link to past actions]
    - Magnitude: [Minor payoff OR MAJOR MACRO CONSEQUENCE if arcPosition='climax']
    - Note: MACRO consequence manifests in climax phase

  Micro New Adversity: [Next problem created by this resolution]
    - Stakes: [How are they higher than before?]
    - Leads To: [Next chapter OR next Part]

SEEDS:
- Planted: [What setup for future payoff?]
- Resolved: [What past setup pays off here?]

SETTINGS:
- [Setting 1]: [How used in this chapter]
- [Setting 2]: [How used in this chapter]
```

**Key Principles**:
- Each chapter MUST be a complete micro-cycle (works standalone)
- Each chapter MUST advance its macro arc progressively via characterArc field
- Focus on 1-2 characters max to maintain emotional depth
- Rotate between characters for variety
- **Arc Position Timing**:
  - Beginning/Middle chapters: Build up to and perform MACRO virtue
  - Climax chapter (arcPosition='climax'): MACRO consequence manifests
  - Resolution chapter: Handle aftermath and transition

### 2.4 Scene Level (Cycle Phases)

**Purpose**: Divide chapter's adversity-triumph cycle into 3-7 narrative beats

**Key Fields**:
- `summary` (text): Scene specification - what happens, emotional beat, purpose, sensory anchors
- `content` (text): Full prose narrative generated from the summary
- `settingId` (text): References Setting.id - the physical location (from Chapter.settingIds)

**Mapping 4-Phase Cycle to 5 Scene Types:**

The 4-phase narrative cycle (Adversity → Virtue → Consequence → New Adversity) is implemented as 5 scene types to provide better pacing and emotional flow:

**Scene Types by Cycle Phase**:

1. **Setup Scenes** (1-2 scenes)
   - Establish current emotional state
   - Introduce external threat/obstacle
   - Show internal resistance/fear

2. **Adversity Scenes** (1-3 scenes)
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

#### 2.4.0 Input/Output Specification

**INPUT** (Scene Summaries Generation - Planning Phase):
```typescript
{
  chapterId: string;
  orderIndices: number[];       // Scene sequence numbers

  // Context from Chapter
  chapter: {
    title: string;
    characterArc: {
      microAdversity: { internal: string; external: string };
      microVirtue: string;
      microConsequence: string;
      microNewAdversity: string;
    };
    settingIds: string[];       // Available settings for this chapter
    focusCharacters: string[];
  };

  // Available resources
  characters: Character[];
  settings: Setting[];          // Filtered by Chapter.settingIds
}
```

**GENERATION PROCESS (Planning Phase)**:
1. **Determine Scene Count**: Typically 3-7 scenes per chapter
2. **Map Cycle to Scenes**: Distribute 4-phase cycle across scene types
   - 1-2 Setup scenes
   - 1-3 Adversity scenes
   - 1 Virtue scene
   - 1-2 Consequence scenes
   - 1 Transition scene
3. **Assign Settings**: Select appropriate setting from Chapter.settingIds for each scene
4. **Define Scene Specs**: For each scene, generate specification with:
   - Title, summary, cyclePhase, emotionalBeat
   - Character focus, setting selection
   - Sensory anchors, dialogue/description balance
   - Suggested length

**OUTPUT** (Scene Summaries - Multiple Records):
```typescript
Array<{
  id: string;
  chapterId: string;
  title: string;
  orderIndex: number;

  // Scene specification (planning layer)
  summary: string;              // Generated scene specification
  cyclePhase: 'setup' | 'adversity' | 'virtue' | 'consequence' | 'transition';
  emotionalBeat: 'fear' | 'hope' | 'tension' | 'relief' | 'elevation' | 'catharsis' | 'despair' | 'joy';

  // Scene metadata (guides content generation)
  characterFocus: string[];     // Character IDs featured
  settingId: string;            // Selected from Chapter.settingIds
  sensoryAnchors: string[];     // Concrete sensory details
  dialogueVsDescription: string; // e.g., "60% dialogue, 40% description"
  suggestedLength: 'short' | 'medium' | 'long';

  content: "";                  // Empty initially - filled in execution phase
}>
```

**INPUT** (Scene Content Generation - Execution Phase):
```typescript
{
  sceneId: string;

  // Scene specification from planning phase
  scene: {
    title: string;
    summary: string;
    cyclePhase: CyclePhase;
    emotionalBeat: EmotionalBeat;
    characterFocus: string[];
    settingId: string;
    sensoryAnchors: string[];
    dialogueVsDescription: string;
    suggestedLength: SuggestedLength;
  };

  // Context for prose generation
  chapter: {
    title: string;
    characterArc: MicroCharacterArc;
  };
  characters: Character[];      // Full character data for voice/appearance
  setting: Setting;             // Full setting data for sensory details
  story: {
    genre: StoryGenre;
    tone: StoryTone;
  };
}
```

**GENERATION PROCESS (Execution Phase)**:
1. **Load Scene Context**: Get scene specification and all context data
2. **Apply Character Voices**: Use Character.voiceStyle for authentic dialogue
3. **Apply Sensory Details**: Use Setting.sensory + scene.sensoryAnchors
4. **Apply Genre/Tone**: Use Story.genre and Story.tone for atmosphere
5. **Balance Dialogue/Description**: Follow scene.dialogueVsDescription ratio
6. **Target Length**: Follow scene.suggestedLength (short: 300-500, medium: 500-800, long: 800-1000 words)
7. **Generate Prose**: Create full narrative content

**OUTPUT** (Scene with Content):
```typescript
{
  id: string;
  // ... all planning fields remain unchanged
  content: string;              // Generated prose narrative
}
```

**Two-Step Generation Process**:
1. **Planning Phase**: Generate `summary` and metadata for all scenes in chapter
2. **Execution Phase**: Generate `content` for each scene using its specification

### 2.5 Setting Hierarchy and Scene-Setting Connection

**Design Philosophy**: Settings are "emotional environments" that amplify cycle phases. Settings flow through a **cascading hierarchy** from Story → Part → Chapter → Scene, creating focused setting usage at each narrative level.

#### Setting Hierarchy Structure

```
Story (2-6 settings)
  └── All available settings for entire story
      │
      ├── Part 1 (settingIds: 2-4 settings)
      │   └── Subset of Story settings used in this act
      │       │
      │       ├── Chapter 1 (settingIds: 1-3 settings)
      │       │   └── Subset of Part settings used in this chapter
      │       │       │
      │       │       ├── Scene 1 (settingId: 1 setting)
      │       │       ├── Scene 2 (settingId: 1 setting)
      │       │       └── Scene 3 (settingId: 1 setting)
      │       │
      │       └── Chapter 2 (settingIds: 1-3 settings)
      │           └── ...
      │
      └── Part 2 (settingIds: 2-4 settings)
          └── ...
```

#### Hierarchy Benefits

**Story Level (All Settings)**:
- Establishes complete world geography
- 2-6 primary settings total
- Each setting fully specified with adversityElements, sensory data, cycleAmplification

**Part Level (Act Settings)**:
- Selects 2-4 settings from Story.settings
- Settings match act's thematic needs and atmosphere
- Act I might use "home" settings; Act II uses "journey" settings; Act III uses "climax" settings
- Stored in `Part.settingIds`

**Chapter Level (Chapter Settings)**:
- Selects 1-3 settings from Part.settingIds
- Settings match chapter's specific micro-cycle needs
- Provides constrained choices for scene generation
- Stored in `Chapter.settingIds`

**Scene Level (Single Setting)**:
- Selects 1 setting from Chapter.settingIds
- Each scene anchored to specific physical location
- Enables setting-specific sensory details and image generation
- Stored in `Scene.settingId`

#### Setting Selection Guidance by Level

**Part Generation**:
- Choose settings that support MACRO arc atmosphere
- Consider setting's `symbolicMeaning` alignment with act themes
- Ensure variety: different settings for different act moods

**Chapter Generation**:
- Choose settings that support micro-cycle phases
- Consider setting's `cycleAmplification` for specific phases
- Aim for 1-3 settings max to maintain chapter coherence

**Scene Generation**:

| Cycle Phase | Setting Selection Strategy |
|-------------|----------------------------|
| **Setup** | Introduction/familiar settings (home, normal world) - establish comfort before adversity |
| **Adversity** | Confined/adversity-rich settings - use `adversityElements` to create external pressure |
| **Virtue** | Contrast settings - barren/hostile environment makes virtue more powerful symbolically |
| **Consequence** | Transformation settings - use `symbolicMeaning` to reflect character change |
| **Transition** | Bridge settings - hint at new location/adversity through environment |

#### Implementation Details

**Scene has required `settingId`**:
- Every scene MUST reference one setting
- Setting must be from parent Chapter.settingIds
- Enables setting-specific content generation

**Setting Selection Criteria**:
- **Cycle phase match**: Use setting's `cycleAmplification[phase]` to find best fit
- **Action requirements**: Physical setting matches scene needs (confined space for confrontation, open space for freedom)
- **Variety**: Distribute settings across scenes to avoid overuse

#### Cascading Hierarchy Benefits

- ✅ **Focused setting usage**: Each level narrows setting choices appropriately
- ✅ **Act coherence**: Parts use consistent setting palette
- ✅ **Chapter coherence**: Chapters don't jump between too many locations
- ✅ **Explicit tracking**: Query-able setting relationships at every level
- ✅ **Setting analytics**: Track which settings used in which acts/chapters
- ✅ **Guided generation**: Narrower choices make setting selection easier and more appropriate
- ✅ **Thematic consistency**: Settings match narrative scope at each level

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
    adversity: string;              // How setting intensifies conflict: "confined space forces interaction"
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
}
```

**IMPORTANT - Multi-Phase Generation:**

Story creation follows a **sequential multi-phase process**:

1. **Phase 1: Story Foundation** (THIS schema)
   - Generate: genre, tone, moralFramework, summary
   - Output: Story record
   - Characters and Settings are NOT included

2. **Phase 2: Character Generation** (separate)
   - Input: Story.id and Story metadata
   - Generate: 2-4 main characters (Character schema, section 3.1)
   - Output: Character records linked via storyId
   - Stored in: `characters` table

3. **Phase 3: Setting Generation** (separate)
   - Input: Story.id, Story metadata, Characters
   - Generate: 2-6 primary settings (Setting schema, section 3.2)
   - Output: Setting records linked via storyId
   - Stored in: `settings` table

4. **Phase 4+: Incremental Content** (Parts → Chapters → Scenes)

**Relationship Notes:**
- Story does NOT directly contain character or setting data
- Characters accessed via: `SELECT * FROM characters WHERE story_id = ?`
- Settings accessed via: `SELECT * FROM settings WHERE story_id = ?`
- Main characters: `WHERE story_id = ? AND is_main = true`

**Database Column Mapping:**
- TypeScript fields use camelCase (e.g., `authorId`, `viewCount`)
- Database columns use snake_case (e.g., `author_id`, `view_count`)
- Drizzle ORM automatically handles the mapping

**Nullability:**
- Core identity fields (id, authorId, title, status) are NOT NULL
- Content fields (summary, genre, tone, moralFramework) are NOT NULL (required after Phase 1 generation)
- Visual fields (imageUrl, imageVariants) are nullable
- Engagement metrics have default values (0)

**Code Reference:**
- **Schema**: `src/lib/db/schema.ts:273-333` - Complete story table definition
- **Types**: `src/lib/studio/generators/zod-schemas.generated.ts` - Generated Zod schemas
- **Constants**: `src/lib/constants/genres.ts`, `src/lib/constants/tones.ts` - Genre and tone definitions
- **Generation Sequence**: See section 2.1.0 for complete Phase 1-4 workflow

### 3.4 Part Schema

```typescript
// Part table (from src/lib/db/schema.ts)
interface Part {
  // === IDENTITY ===
  id: string;
  storyId: string;
  title: string;

  // === ADVERSITY-TRIUMPH CORE (Act Structure) ===
  summary: string; // MACRO adversity-triumph arcs per character

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
  }> | null;

  // === SETTING HIERARCHY ===
  // Stored as JSON array in database
  settingIds: string[]; // Settings used in this Part (subset of Story settings)
  // Default: []

  // === ORDERING ===
  orderIndex: number; // Act number / order

  // === METADATA ===
  createdAt: string; // Timestamp as ISO string
  updatedAt: string; // Timestamp as ISO string
}
```

**Key Changes from Previous Version:**
- ❌ **REMOVED**: `estimatedChapters`, `arcPosition`, `progressionStrategy` - no longer needed for incremental chapter-by-chapter writing
- ✅ **ADDED**: `settingIds` - implements setting hierarchy (Story → Part → Chapter → Scene)
- ✅ **SIMPLIFIED**: Part now focuses on MACRO arc destination only, not chapter-by-chapter progression planning

**Database Column Mapping:**
- TypeScript fields use camelCase (e.g., `storyId`, `orderIndex`, `settingIds`)
- Database columns use snake_case (e.g., `story_id`, `order_index`, `setting_ids`)
- JSON fields: `characterArcs`, `settingIds`

**Nullability:**
- Core identity fields (id, storyId, title) are NOT NULL
- Content fields (summary, characterArcs, orderIndex) are nullable
- `settingIds` has default empty array value

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
  arcPosition: 'beginning' | 'middle' | 'climax' | 'resolution';
  // beginning/middle: MACRO virtue performed
  // climax: MACRO consequence manifests
  // resolution: Aftermath and transition

  // === STRUCTURED MICRO-CYCLE TRACKING ===
  // Stored as JSON in database
  characterArc: {
    microAdversity: {
      internal: string;         // Specific fear/flaw confronted in this chapter
      external: string;         // Specific obstacle in this chapter
    };
    microVirtue: string;        // Moral choice building toward MACRO virtue
    microConsequence: string;   // Earned result (minor or MAJOR if climax)
    microNewAdversity: string;  // Next problem created by this resolution
    contributesToMacroArc: string; // How this micro-cycle advances MACRO transformation
  } | null;

  // === SETTING HIERARCHY ===
  // Stored as JSON array in database
  settingIds: string[]; // Settings used in this Chapter (subset of Part settings)
  // Default: []

  // === CYCLE TRACKING (Legacy/Supplementary) ===
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

**Key Changes from Previous Version:**
- ✅ **ADDED**: `characterArc` - Structured micro-cycle tracking (adversity, virtue, consequence, new adversity, contribution to macro)
- ✅ **ADDED**: `settingIds` - Implements setting hierarchy (subset of Part.settingIds)
- ❌ **DEPRECATED**: `contributesToMacroArc` as standalone field (now part of `characterArc.contributesToMacroArc`)
- ✅ **IMPROVED**: Clearer organization of micro-cycle data for generation and validation

**Database Column Mapping:**
- TypeScript fields use camelCase (e.g., `storyId`, `partId`, `characterArc`, `settingIds`)
- Database columns use snake_case (e.g., `story_id`, `part_id`, `character_arc`, `setting_ids`)
- JSON fields: `characterArc`, `settingIds`, `focusCharacters`, `seedsPlanted`, `seedsResolved`

**Nullability:**
- Core identity fields (id, storyId, title, status, orderIndex) are NOT NULL
- Part relationship (partId) is nullable
- `characterArc` is nullable (allows legacy chapters, manual editing)
- `settingIds` has default empty array value
- All other Adversity-Triumph tracking fields are nullable
- Causal linking arrays have default empty array values

**characterArc Field Benefits:**
- ✅ Explicit micro-cycle structure for AI generation
- ✅ Clear mapping to Part-level MACRO arc
- ✅ Easier validation of cycle completeness
- ✅ Better organization for chapter planning
- ✅ Simplified queries for arc progression tracking

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
  cyclePhase: 'setup' | 'adversity' | 'virtue' | 'consequence' | 'transition';
  emotionalBeat: 'fear' | 'hope' | 'tension' | 'relief' | 'elevation' | 'catharsis' | 'despair' | 'joy';

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
type CyclePhase = 'setup' | 'adversity' | 'virtue' | 'consequence' | 'transition';
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
