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

See section 2.7 for how the 4-phase cycle maps to 5 scene types in practice.

### 1.5 Critical Success Factors

**Core Principles:**
1. **Intrinsic Motivation**: Virtuous actions MUST be genuine, not strategic
2. **Causal Linking**: Every event connects to previous actions (no deus ex machina)
3. **Seed Tracking**: Small actions pay off later as "earned luck"
4. **Cyclical Engine**: Every resolution creates next adversity
5. **Emotional Authenticity**: Show emotions through body/action, not tell

---

## Part II: Story Generation Architecture

### 2.1 Generation Sequence Overview

**IMPORTANT**: Story creation is a **multi-phase process**. The Story entity itself does NOT contain character or setting data directly.

**Phase 1: Story Foundation** (see section 2.2)
- Generate: genre, tone, moralFramework, summary
- Output: Story record with foundational metadata
- Characters and Settings are NOT created in this phase

**Phase 2: Character Generation** (see section 2.3)
- Input: Story (complete with genre, tone, moralFramework, summary)
- Generate: 2-4 main characters with full Character schema data
- Output: Character records linked to Story via storyId

**Phase 3: Setting Generation** (see section 2.4)
- Input: Story, Characters
- Generate: 2-6 primary settings
- Output: Setting records linked to Story via storyId

**Phase 4: Part Generation** (see section 2.5)
- Input: Story, Characters, Settings, previousParts
- Generate: MACRO adversity-triumph arcs for each character
- Output: Part record with character arcs and selected settings

**Phase 5: Chapter Generation** (see section 2.6)
- Input: Story, Part, previousChapters, Characters, Settings
- Generate: Micro-cycle with chapter arc and focus character
- Output: Chapter record with micro-cycle structure

**Phase 6: Scene Generation** (see section 2.7)
- **Phase 6a: Scene Summaries** (see section 2.7.1)
  - Input: Story, Part, Chapter, previousScenes, Characters, Settings
  - Generate: Scene summaries and metadata (no content)
  - Output: Scene records with summaries and specifications
- **Phase 6b: Scene Content** (see section 2.7.2)
  - Input: Scene (with summary), Story, Part, Chapter, Characters, Setting
  - Generate: Full prose narrative content
  - Output: Scene record with content field populated

### 2.2 Phase 1: Story Foundation

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
- **Genre**: See Genre Catalog (section 2.2.2) for complete list and descriptions
- **Tone**: See Tone Catalog (section 2.2.3) for complete list and emotional characteristics
- **Moral Framework**: What virtues are valued? What vices are punished?

#### 2.2.1 Input/Output Specification

**INPUT** (Story Generation):
```typescript
{
  userPrompt: string;  // User's creative direction for the story
}
```

**GENERATION PROCESS**:
1. Analyze user prompt to understand story concept and themes
2. Generate story title based on prompt
3. Select appropriate genre from Genre Catalog (2.2.2)
4. Select appropriate tone from Tone Catalog (2.2.3)
5. Define moral framework (what virtues/vices matter in this world)
6. Generate thematic summary using content format above

**OUTPUT** (Story Record):
```typescript
{
  title: string;              // Generated
  genre: StoryGenre;          // Generated
  tone: StoryTone;            // Generated
  moralFramework: string;     // Generated
  summary: string;            // Generated
  // Visual and metadata fields initialized as null/defaults
}
```

**Note**: After Story generation completes, proceed to Character generation (Phase 2), then Setting generation (Phase 3).

#### 2.2.2 Genre Catalog

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

#### 2.2.3 Tone Catalog

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

### 2.3 Phase 2: Character Generation

**Purpose**: Generate 2-4 main characters who serve as moral agents driving the adversity-triumph cycles

**Key Concept**: Characters are defined by their **coreTrait** (moral virtue), **internalFlaw** (source of adversity), and **externalGoal** (what they think will solve their problem). Their arcs emerge from healing internal flaws through virtuous actions.

#### 2.3.1 Input/Output Specification

**INPUT** (Character Generation):
```typescript
{
  story: Story;  // Complete story with genre, tone, moralFramework, summary
}
```

**GENERATION PROCESS**:
1. **Determine Character Count**: Generate 2-4 main characters based on story complexity
2. **Define Moral Core**: For each character, establish:
   - coreTrait: The defining moral virtue (courage, compassion, integrity, loyalty, wisdom, sacrifice)
   - internalFlaw: Source of adversity with cause (format: "[fears/believes/wounded by] X because Y")
   - externalGoal: What they think will solve their problem (creates dramatic irony)
3. **Build Character Depth**: Generate personality, backstory, and character summary
4. **Create Physical Presence**: Generate physicalDescription for realistic portrayal
5. **Establish Voice**: Define voiceStyle to ensure distinct dialogue patterns
6. **Align with Story**: Ensure characters fit genre, tone, and moralFramework

**OUTPUT** (Character Generation Data):
```typescript
Array<{
  name: string;                // Generated character name
  role: 'protagonist' | 'deuteragonist' | 'tritagonist' | 'antagonist' | 'supporting';  // Character role in story
  summary: string;            // 1-2 sentence essence

  // Adversity-Triumph Core
  coreTrait: string;          // THE defining moral virtue
  internalFlaw: string;       // MUST include cause: "[fears/believes/wounded by] X because Y"
  externalGoal: string;       // What they THINK will solve their problem

  // Character Depth
  personality: {
    traits: string[];         // Behavioral traits: "impulsive", "optimistic", "stubborn"
    values: string[];         // What they care about: "family", "honor", "freedom"
  };
  backstory: string;          // Focused history (2-4 paragraphs)

  // Prose Generation
  physicalDescription: {
    age: string;              // "mid-30s", "elderly", "young adult"
    appearance: string;       // Overall look
    distinctiveFeatures: string;  // Memorable details
    style: string;            // How they dress/present themselves
  };
  voiceStyle: {
    tone: string;             // "warm", "sarcastic", "formal", "gentle"
    vocabulary: string;       // "simple", "educated", "technical", "poetic"
    quirks: string[];         // Verbal tics, repeated phrases
    emotionalRange: string;   // "reserved", "expressive", "volatile"
  };
}>
```

**Note**: Character images (portraits) are generated later in the image generation phase. `imageUrl` and `imageVariants` are initialized as null.

### 2.4 Phase 3: Setting Generation

**Purpose**: Generate 2-6 primary settings that serve as emotional environments amplifying cycle phases

**Key Concept**: Settings create external adversity through physical/social obstacles, amplify each cycle phase (setup, adversity, virtue, consequence, transition), and serve as symbolic mirrors for character transformation.

#### 2.4.1 Input/Output Specification

**INPUT** (Setting Generation):
```typescript
{
  story: Story;              // Complete story with genre, tone, summary
  characters: Character[];   // Generated characters (for setting alignment)
}
```

**GENERATION PROCESS**:
1. **Determine Setting Count**: Generate 2-6 primary settings based on story scope
2. **Define Adversity Elements**: For each setting, establish:
   - physicalObstacles: Environmental challenges
   - scarcityFactors: Limited resources forcing choices
   - dangerSources: Threats from environment
   - socialDynamics: Community factors
3. **Create Cycle Amplification**: Define how setting amplifies each phase:
   - setup: How setting establishes adversity
   - adversity: How setting intensifies conflict
   - virtue: How setting contrasts/witnesses moral beauty
   - consequence: How setting transforms or reveals
   - transition: How setting hints at new problems
4. **Build Atmosphere**: Generate mood, emotionalResonance, and symbolicMeaning
5. **Add Sensory Immersion**: Create detailed sensory arrays (sight, sound, smell, touch, taste)
6. **Align with Story**: Ensure settings fit genre, tone, and support moralFramework

**OUTPUT** (Setting Generation Data):
```typescript
Array<{
  name: string;               // Generated setting name
  summary: string;            // Comprehensive paragraph (3-5 sentences)

  // Adversity-Triumph Core
  adversityElements: {
    physicalObstacles: string[];    // Environmental challenges
    scarcityFactors: string[];      // Limited resources
    dangerSources: string[];        // Threats from environment
    socialDynamics: string[];       // Community factors
  };
  symbolicMeaning: string;          // How setting reflects moral framework (1-2 sentences)
  cycleAmplification: {
    setup: string;                  // Establishes adversity
    adversity: string;              // Intensifies conflict
    virtue: string;                 // Contrasts/witnesses moral beauty
    consequence: string;            // Transforms or reveals
    transition: string;             // Hints at new problems
  };

  // Emotional Atmosphere
  mood: string;                     // Primary emotional quality
  emotionalResonance: string;       // Emotion amplified: "isolation", "hope", "fear"

  // Sensory Immersion
  sensory: {
    sight: string[];                // Visual details (5-10 items)
    sound: string[];                // Auditory elements (3-7 items)
    smell: string[];                // Olfactory details (2-5 items)
    touch: string[];                // Tactile sensations (2-5 items)
    taste: string[] | null;         // Flavor elements (0-2 items, optional)
  };
  architecturalStyle: string;       // Structural design language (if applicable)
  visualReferences: string[];       // Style inspirations
  colorPalette: string[];           // Dominant colors
}>
```

**Note**: Setting images (environment visuals) are generated later in the image generation phase. `imageUrl` and `imageVariants` are initialized as null.

#### 2.4.2 Setting Hierarchy System

**Design Philosophy**: Settings are "emotional environments" that amplify cycle phases. Settings flow through a **cascading hierarchy** from Story → Part → Chapter → Scene, creating focused setting usage at each narrative level.

**Setting Hierarchy Structure**

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

**Hierarchy Benefits**

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

**Setting Selection Guidance by Level**

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

**Implementation Details**

**Scene has required `settingId`**:
- Every scene MUST reference one setting
- Setting must be from parent Chapter.settingIds
- Enables setting-specific content generation

**Setting Selection Criteria**:
- **Cycle phase match**: Use setting's `cycleAmplification[phase]` to find best fit
- **Action requirements**: Physical setting matches scene needs (confined space for confrontation, open space for freedom)
- **Variety**: Distribute settings across scenes to avoid overuse

**Cascading Hierarchy Benefits**

- ✅ **Focused setting usage**: Each level narrows setting choices appropriately
- ✅ **Act coherence**: Parts use consistent setting palette
- ✅ **Chapter coherence**: Chapters don't jump between too many locations
- ✅ **Explicit tracking**: Query-able setting relationships at every level
- ✅ **Setting analytics**: Track which settings used in which acts/chapters
- ✅ **Guided generation**: Narrower choices make setting selection easier and more appropriate
- ✅ **Thematic consistency**: Settings match narrative scope at each level

### 2.5 Phase 4: Part Generation

**Purpose**: Define MACRO adversity-triumph arc for EACH main character within this act

**Key Concept: Nested Cycles**
- **Macro Arc** (Part-level): Complete character transformation within this act
- **Micro Cycles** (Chapter-level): Each chapter advances character toward macro payoff
- **Incremental Writing**: Chapters generated one-by-one; Part defines MACRO arc only

**Key Fields**:
- `summary` (text): MACRO adversity-triumph arcs per character
- `settingIds` (string[]): Settings available for use in this Part (subset of Story's settings)

#### 2.5.1 Input/Output Specification

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
     - **Timing**: Performed in **beginning/middle chapters** (NOT at climax)
     - This is the morally defining moment that sets up the earned consequence
   - **Macro Consequence**: Major earned payoff/karmic result
     - Surprising but causally-linked result of the virtue
     - **Timing**: Manifests at **climax chapter** (after virtue, with temporal separation)
     - How does the moral universe reward this character through seemingly unrelated events?
   - **Macro New Adversity**: How this resolution creates next part's challenge
     - What new problem emerges from the resolution?
     - How do stakes escalate?
5. **Plan Character Interactions**: Determine how character arcs intersect
   - Which relationships (Jeong) form or deepen?
   - What shared Han (wounds) are revealed?
   - How do arcs converge toward part climax (where CONSEQUENCE manifests)?
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

**Note on Incremental Writing**:
- Part defines **MACRO arc destination** but NOT detailed chapter-by-chapter progression
- Each Chapter generated individually will advance its character toward the macro payoff
- This allows flexibility while maintaining coherent character transformation

**Common Story Structures** (not prescriptive):
- **Three-Act**: Setup → Confrontation → Resolution
- **Four-Act**: Setup → Complication → Development → Resolution
- **Five-Act**: Exposition → Rising Action → Climax → Falling Action → Denouement
- **Custom**: Generator determines optimal structure based on story needs

#### 2.5.2 Macro Arc Timing Pattern

**Pattern A: MACRO Arc Timing** (Adversity-Triumph Engine Standard):

The Part follows **Pattern A** for maximum Gam-dong (profound emotional impact):

```
Part Structure (4-chapter example):
├─ Chapter 1 (Beginning): Setup MACRO adversity
├─ Chapter 2-3 (Middle): MACRO Virtue performed ⭐
├─ Chapter 4 (Climax): MACRO Consequence manifests 💫
└─ Chapter 4 end: MACRO New Adversity emerges
```

**Why Pattern A?**
- ✅ **Temporal separation**: Time between virtue and consequence makes payoff feel earned, not transactional
- ✅ **Unintended consequence**: Events happen between virtue and payoff → feels serendipitous
- ✅ **Gam-dong maximization**: Moral elevation (virtue) → anticipation → profound moving (consequence)
- ✅ **Causal complexity**: Allows for complex narrative chains that feel inevitable in retrospect

### 2.6 Phase 5: Chapter Generation

**Purpose**: ONE complete adversity-triumph cycle (micro-cycle) that progressively builds the character's macro arc

**Key Concept: Micro Cycles within Macro Arcs**
- Each chapter is a self-contained cycle (complete on its own)
- Each micro-cycle advances the character toward their MACRO virtue (beginning/middle) and MACRO consequence (climax)
- Multiple chapters collectively build one character's macro arc following Pattern A:
  - Early chapters: Setup and build tension
  - Middle chapters: MACRO virtue performed
  - Climax chapter: MACRO consequence manifests

**Key Fields**:
- `summary` (text): One micro-cycle adversity-triumph
- `characterId` (text): References Character.id
- `characterArc` (object): Structured micro-cycle tracking
- `arcPosition` (enum): 'beginning' | 'middle' | 'climax' | 'resolution'
- `settingIds` (string[]): Settings used in this chapter (subset of Part's settings)

#### 2.6.1 Input/Output Specification

**INPUT** (Chapter Generation):
```typescript
{
  // Story and Part context
  story: Story;                 // Complete story with all metadata
  part: Part;                   // Complete part with character arcs and settings

  // Previous Chapters context (all previous chapters in order)
  previousChapters: Chapter[];  // Empty array if first Chapter

  // Available resources
  characters: Character[];      // All story characters
  settings: Setting[];          // Filtered by Part.settingIds
}
```

**GENERATION PROCESS**:
1. **Select Focus Character**: Determine which character's MACRO arc advances in this chapter
   - Rotate between characters for variety
   - Consider which character needs development based on previousChapters
   - Get character's MACRO arc from Part.characterArcs
2. **Determine Arc Position**: Is this beginning/middle/climax/resolution of the MACRO arc?
   - Use character's MACRO arc from Part.characterArcs to understand the overall journey
   - Analyze previousChapters to understand arc progression
   - **Pattern A Timing**: MACRO virtue happens in beginning/middle, MACRO consequence at climax
3. **Generate Title**: Create chapter title based on focus character and arc position
4. **Select Settings**: Choose 1-3 settings from Part.settingIds that fit this chapter's needs
5. **Define Micro-Cycle**:
   - **Micro Adversity**: Specific challenge within larger macro adversity
   - **Micro Virtue**: Moral choice building toward MACRO virtue (or IS the MACRO virtue if arcPosition='middle')
   - **Micro Consequence**: Earned result (minor payoff OR MACRO consequence if arcPosition='climax')
   - **Micro New Adversity**: Next problem (feeds next chapter or next Part)
6. **Plant/Resolve Seeds**: Setup future payoffs or resolve past setups
   - MACRO virtue plants the seed for MACRO consequence (resolved at climax)
7. **Generate Summary**: Comprehensive chapter description

**OUTPUT** (Chapter Generation Data):
```typescript
{
  title: string;                // Generated chapter title

  summary: string;              // Generated comprehensive summary

  // Position in macro arc
  arcPosition: 'beginning' | 'middle' | 'climax' | 'resolution'; // Generated (determined in step 2)

  // Structured micro-cycle tracking
  characterArc: {
    characterId: string;        // Character whose arc advances (generated in step 1)
    microAdversity: {
      internal: string;         // Specific fear/flaw confronted
      external: string;         // Specific obstacle in this chapter
    };
    microVirtue: string;        // Moral choice (building toward MACRO)
    microConsequence: string;   // Earned result
    microNewAdversity: string;  // Next problem created
  };

  contributesToMacroArc: string; // How this advances MACRO transformation

  // Settings used in this chapter
  settingIds: string[];         // Selected from Part.settingIds

  // Causal linking (for earned luck)
  seedsPlanted: Seed[];         // Setup for future chapters
  seedsResolved: SeedResolution[]; // Payoffs from past chapters

  connectsToPreviousChapter: string;
  createsNextAdversity: string;
}
```

**Character Appearances**: Supporting characters are handled at Scene level via `scene.characterFocus`. The primary character is specified in `characterArc.characterId`.

**Key Principles**:
- Each chapter MUST be a complete micro-cycle (works standalone)
- Each chapter MUST advance its macro arc progressively via characterArc field
- Focus on 1-2 characters max to maintain emotional depth
- Rotate between characters for variety
- **Arc Position Timing**:
  - Beginning/Middle chapters: Build up to and perform MACRO virtue
  - Climax chapter (arcPosition='climax'): MACRO consequence manifests
  - Resolution chapter: Handle aftermath and transition

### 2.7 Phase 6: Scene Generation

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

#### 2.7.1 Scene Summary Generation (Planning Phase)

**Purpose**: Generate scene summaries and metadata for all scenes in a chapter (without content)

**INPUT** (Scene Summaries Generation):
```typescript
{
  // Story, Part, and Chapter context
  story: Story;                 // Complete story with all metadata
  part: Part;                   // Complete part with character arcs
  chapter: Chapter;             // Complete chapter with micro-cycle

  // Previous Scenes context (all previous scenes in order)
  previousScenes: Scene[];      // Empty array if first scene batch

  // Available resources
  characters: Character[];      // All story characters
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

**OUTPUT** (Scene Summaries Generation Data - Single Record):
```typescript
{
  title: string;                // Generated scene title

  // Scene specification (planning layer)
  summary: string;              // Generated scene specification
  cyclePhase: 'setup' | 'adversity' | 'virtue' | 'consequence' | 'transition';
  emotionalBeat: 'fear' | 'hope' | 'tension' | 'relief' | 'elevation' | 'catharsis' | 'despair' | 'joy';

  // Scene metadata (guides content generation)
  characterFocus: string[];     // Character IDs featured (primary + supporting)
  settingId: string;            // Selected from Chapter.settingIds
  sensoryAnchors: string[];     // Concrete sensory details
  dialogueVsDescription: string; // e.g., "60% dialogue, 40% description"
  suggestedLength: 'short' | 'medium' | 'long';
}
```

**Note**: `chapterId` and `orderIndex` are automatically handled by the system (not part of generation data). Scene `content` is generated separately in section 2.7.2 (Execution Phase).

#### 2.7.2 Scene Content Generation (Execution Phase)

**Purpose**: Generate full prose narrative content for each scene using its summary and metadata

**INPUT** (Scene Content Generation):
```typescript
{
  // Scene specification from planning phase
  previousScenes: Scene[];      // All previous scenes in order (for context and continuity)

  // Full context for prose generation
  story: Story;                 // Complete story with genre/tone
  part: Part;                   // Complete part with character arcs
  chapter: Chapter;             // Complete chapter with micro-cycle
  characters: Character[];      // Full character data for voice/appearance
  setting: Setting;             // Full setting data for sensory details
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
  // ... all planning fields remain unchanged
  content: string;              // Generated prose narrative
}
```

**Two-Step Generation Process**:
1. **Planning Phase (2.7.1)**: Generate `summary` and metadata for all scenes in chapter
2. **Execution Phase (2.7.2)**: Generate `content` for each scene using its specification

---

## Part III: Related Documentation

This specification document focuses on core concepts and generation architecture. For implementation details and validation:

### 📋 **Development Guide** (`novels-development.md`)
- **Part I: Data Model Specification** - Complete schema definitions for Story, Character, Setting, Part, Chapter, and Scene
- **Part II: API Architecture** - Generation flow and API structure
- **Part III: API Specifications** - System prompts and implementation details

### 🧪 **Testing Guide** (`novels-testing.md`)
- **Part II: Success Metrics** - Baseline performance targets and validated results
- **Part III-VIII**: Complete testing methodology, evaluation metrics, and quality assurance

**Navigation:**
- 📖 Concepts & Architecture → This document (novels-specification.md)
- 🔧 Implementation & Schemas → Development Guide (novels-development.md)
- ✅ Validation & Metrics → Testing Guide (novels-testing.md)
