# Hierarchical Narrative Schema (HNS) for Serialized Fiction

## Introduction: A Systems-Oriented Framework

This document provides a comprehensive, data-driven framework for planning, generating, validating, and evaluating serialized fiction. It transforms storytelling from unstructured creative processes into a systematic approach using the "Story as Data" paradigm, enabling procedural generation and AI-assisted narrative creation.

The framework is built on the **Hierarchical Narrative Schema (HNS)**, a four-level data architecture that encapsulates story structure from the highest conceptual level down to individual scenes. This structured representation serves as the foundation for automated validation, AI-powered visualization, and systematic evaluation of narrative quality.

---

# Story Specification (Level 1: Overall Narrative)

## 1. Definition and Purpose

The **Story** level represents the complete narrative at its most abstract level. It contains the core conceptual DNA of the work, serving as the foundational input for the entire generation process. At this level, writers consider the fundamental premise, core themes, and the ultimate destination of their narrative.

## 2. Key Functions in Planning

- **Central Question Identification**: Define the specific dramatic question your serial will explore over time
- **Character Profile Creation**: Build detailed backgrounds including personality traits, backstories, goals, flaws, and character development arcs
- **World and Setting Design**: Map specific locations, time periods, and cultural context
- **Conflict Architecture**: Establish layered conflicts including overarching story conflict, part-level tensions, and chapter-specific obstacles
- **Message and Meaning**: Identify themes that can develop gradually across serial installments
- **Character Relationship Mapping**: Chart complex relationship dynamics that can evolve across chapters
- **Serial Publication Planning**: Design story structure that accommodates regular publishing schedules and reader feedback
- **Reader Engagement Strategy**: Plan hooks, cliffhangers, and community interaction points

## 3. Story Organization and Part Structure

Before writing, you must decide how to divide your complete story into major parts. This organizational decision shapes your entire narrative approach.

**Common Part Structures:**

**Three-Part Structure (Most Common):**
- **Part I - Setup (25%)**: Establish world, characters, goals, and initial conflicts
- **Part II - Confrontation (50%)**: Escalate stakes, develop complications, build toward climax
- **Part III - Resolution (25%)**: Resolve conflicts, complete character arcs, provide conclusion

**Four-Part Structure (Epic/Complex Narratives):**
- **Part I - Ordinary World**: Introduce protagonist in their normal environment
- **Part II - Journey Begins**: Launch the adventure, establish stakes and obstacles
- **Part III - Crisis and Transformation**: Major setbacks, character growth, pivotal revelations
- **Part IV - Final Challenge**: Climax, resolution, return to changed world

**Five-Part Structure (Classical Drama):**
- **Part I - Exposition**: Introduce characters, setting, background
- **Part II - Rising Action**: Build conflict, develop complications
- **Part III - Climax**: Story's turning point, highest tension
- **Part IV - Falling Action**: Consequences of climax, loose ends addressed
- **Part V - Resolution**: Final outcomes, character fates determined

## 4. Implementation Strategies for Web Serial Fiction

### 4.1. For New Serial Writers

**Establish Your Serial Foundation:**
1. Define your overarching story question and episodic questions
2. Plan a sustainable publication schedule matching your writing capacity
3. Design story structure to accommodate reader feedback
4. Create character and world foundations supporting long-term exploration

**Build Your Publication Strategy:**
1. Plan compelling chapter hooks for anticipation and discussion
2. Design cliffhangers balancing satisfaction with anticipation
3. Establish community engagement points throughout narrative
4. Create feedback integration opportunities at story breaks

### 4.2. For Community Building

**Reader Engagement Planning:**
1. Design story moments to generate reader speculation
2. Plan character interactions creating emotional investment
3. Build mystery elements sustaining curiosity across chapters
4. Create opportunities for reader influence on development

### 4.3. For Sustainable Serial Writing

**Publication Rhythm Management:**
1. Balance chapter complexity with publication requirements
2. Plan story arcs aligning with writing cycles
3. Design character development sustaining long-term interest
4. Create backup content strategies for schedule maintenance

## 5. JSON Data Structure for Story Object

### Field Descriptions

**story_id**: A unique identifier (e.g., UUID) for database management.

**story_title**: The working or final title of the story.

**genre**: An array specifying primary and secondary genres (e.g., ["urban_fantasy", "thriller"]), which informs stylistic choices in both text and image generation.

**premise**: A single, succinct sentence that encapsulates the entire novel. This is directly derived from the first step of the Snowflake Method and serves as the "elevator pitch" for the story. It should tie together the big-picture conflict with the personal stakes of the protagonist.

**dramatic_question**: The central yes-or-no question that drives the narrative and must be answered in the climax (e.g., "Will the detective solve the mystery?"). This attribute provides a clear definition of the story's ultimate goal.

**theme**: A concise statement of the story's central message or underlying idea, which helps guide narrative and character decisions to ensure thematic coherence.

**characters**: An array of character_ids, linking to all major and minor characters defined in the ancillary data objects.

**settings**: An array of setting_ids, linking to all key locations.

**parts**: An array of part_ids, representing the major structural divisions of the story.

### Example JSON Structure

```json
{
  "story": {
    "story_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "story_title": "The Shadow Keeper",
    "genre": ["urban_fantasy", "thriller"],
    "premise": "A photographer must master shadow magic to save her sister from a supernatural realm before power corrupts her",
    "dramatic_question": "Can Maya master shadow magic before power corrupts her?",
    "theme": "The conflict between power and responsibility",
    "characters": ["char_maya_001", "char_elena_002", "char_marcus_003", "char_void_004"],
    "settings": ["setting_sf_001", "setting_shadow_realm_002", "setting_studio_003"],
    "parts": ["part_001", "part_002", "part_003"]
  }
}
```

---

# Part Specification (Level 2: Major Sections)

## 1. Definition and Purpose

**Parts** represent major thematic or narrative divisions within the overall story. These substantial sections each have their own internal logic, often featuring distinct settings, time periods, or phases of character development. Parts typically correspond to acts in traditional dramatic structure.

## 2. Key Functions in Planning

- **Serial Arc Development**: Structure each part as a satisfying mini-arc within the larger story
- **Reader Engagement Cycles**: Design parts to create natural climax-and-anticipation patterns
- **Character Growth Phases**: Organize character development into distinct stages
- **Community Discussion Points**: Plan major plot developments generating reader speculation
- **Feedback Integration**: Structure parts to allow reader response between major movements
- **Publication Milestones**: Align part conclusions with natural publication breaks
- **Cliffhanger Architecture**: Design part endings creating anticipation for next movement

## 3. Part Planning Framework

**For Each Part, Define:**
- **Central Question**: What major question does this part explore or answer?
- **Character Development**: How do characters change during this section?
- **Plot Development**: What major events or revelations occur?
- **Thematic Focus**: What themes are emphasized in this part?
- **Emotional Journey**: What emotional progression do readers experience?
- **Ending Impact**: How does this part conclude to propel the story forward?

## 4. JSON Data Structure for Part Object

### Field Descriptions

**part_id**: A unique identifier for the part.

**part_title**: A descriptive title for the act (e.g., "Part I: The Setup").

**structural_role**: A string or enum that maps the part to its function within a recognized narrative framework. The most common implementation uses the Three-Act Structure: "Act 1: Setup," "Act 2: Confrontation," and "Act 3: Resolution". This ensures the story follows a proven dramatic arc.

**summary**: A one-paragraph summary describing the main movements and developments within this act.

**key_beats**: An array of strings identifying the crucial plot points contained within this part, based on narrative theory. For "Act 1," this might include "Exposition," "Inciting Incident," and "Plot Point One". For "Act 2," it would include "Rising Action," "Midpoint," and "Plot Point Two." This attribute allows for automated checks to ensure all critical structural elements are present.

**chapters**: An ordered array of chapter_ids that comprise this part of the story.

### Example JSON Structure

```json
{
  "part": {
    "part_id": "part_001",
    "part_title": "Part I: Discovery",
    "structural_role": "Act 1: Setup",
    "summary": "Dr. Maya Chen's ordinary life shatters when her sister Elena disappears, leaving behind evidence of supernatural research. Despite her skepticism, Maya discovers she has inherited shadow manipulation abilities and must accept training from the mysterious Marcus Webb to save her sister.",
    "key_beats": ["Exposition", "Inciting Incident", "Plot Point One"],
    "chapters": ["chap_001", "chap_002", "chap_003", "chap_004", "chap_005"]
  }
}
```

---

# Chapter Specification (Level 3: Reading Units)

## 1. Definition and Purpose

The **Chapter** is the primary unit of reader consumption, especially critical in web novel format. Chapters must balance being self-contained reading experiences while advancing the larger narrative. They are designed for serialized release, requiring particular attention to pacing and hooks.

## 2. Key Functions in Planning

- **Reader Session Management**: Each chapter should be consumable in a single reading session (10-20 minutes)
- **Pacing Control**: Modulate narrative tempo through scene selection and prose style
- **Engagement Maintenance**: Every chapter must give readers a reason to continue
- **Character Voice Consistency**: Maintain POV character's perspective throughout
- **Subplot Integration**: Weave multiple story threads while maintaining focus
- **Cliffhanger Engineering**: Design chapter endings that compel continuation
- **Feedback Integration Points**: Natural breaks for reader comments and reactions

## 3. Chapter Structure Framework

**Three-Act Chapter Structure:**

**Setup (20%):**
- Hook readers with opening line or situation
- Establish chapter goal or question
- Orient readers to time, place, and POV

**Confrontation (60%):**
- Develop conflict through escalating complications
- Build tension toward chapter climax
- Integrate character development moments

**Resolution (20%):**
- Reach chapter-level climax
- Provide partial resolution
- Deploy chapter-ending hook

## 4. JSON Data Structure for Chapter Object

### Field Descriptions

**chapter_id**: A unique identifier for the chapter.

**chapter_number**: The sequential number of the chapter within the story.

**chapter_title**: The title of the chapter.

**part_ref**: Reference to the part this chapter belongs to.

**summary**: A detailed, one-paragraph summary of the chapter's events. This corresponds directly to the expanded paragraphs generated in Step 4 of the Snowflake Method, where each sentence of an act's summary is developed into a full paragraph.

**pacing_goal**: An enum ('fast', 'medium', 'slow', 'reflective') that dictates the intended tempo of the chapter. This attribute can be used by a procedural text generator to modulate sentence length, paragraph structure, and the ratio of action to description, ensuring the prose style matches the narrative intent.

**action_dialogue_ratio**: The percentage ratio of action to dialogue (e.g., "40:60").

**chapter_hook**: A structured object designed to formalize the end-of-chapter hook, a critical element for reader retention in serialized fiction. It contains:
- **type**: An enum specifying the nature of the hook (e.g., "revelation", "danger", "decision", "question", "emotional_turning_point").
- **description**: A brief sentence describing the hook itself.
- **urgency_level**: The urgency level of the hook (e.g., "high", "medium", "low").

**scenes**: An ordered array of scene_ids that make up the chapter.

### Example JSON Structure

```json
{
  "chapter": {
    "chapter_id": "chap_001",
    "chapter_number": 1,
    "chapter_title": "Missing",
    "part_ref": "part_001",
    "summary": "Maya arrives for her weekly coffee date with Elena only to find her sister's apartment unlocked and abandoned. Signs of struggle and a mysterious journal lead Maya to discover Elena was researching something called 'Shadow Keepers' before her disappearance.",
    "pacing_goal": "medium",
    "action_dialogue_ratio": "40:60",
    "chapter_hook": {
      "type": "revelation",
      "description": "Journal's last entry: 'They know about Maya. She has the mark too.'",
      "urgency_level": "high"
    },
    "scenes": ["scene_001", "scene_002", "scene_003"]
  }
}
```

---

# Scene Specification (Level 4: Individual Scenes)

## 1. The Foundational Principle: A Scene is a Unit of Change

The single most critical principle of scene construction is that a **scene must create meaningful change**. A scene is not defined by its location or duration but by its function: to advance the story. If a scene can be removed without consequence, it is redundant. This change must be tangible, altering a character's situation either externally or internally.

## 2. The Core Architecture: Scene-Sequel Model

Scenes follow the **Scene-Sequel** model, creating an unbreakable chain of cause and effect:

### 2.1. The Scene (Action Unit)

1. **Goal**: POV character enters with specific, immediate objective
2. **Conflict**: Series of escalating obstacles preventing goal achievement
3. **Disaster (Outcome)**: Scene ends with negative outcome or complication
   - "No, and furthermore..." (failure plus new problem)
   - "Yes, but..." (success with unforeseen consequence)

### 2.2. The Sequel (Reaction Unit)

1. **Reaction**: Immediate emotional response to disaster
2. **Dilemma**: Character processes situation and faces difficult choice
3. **Decision**: Character chooses new course, becoming next scene's goal

## 3. Line-Level Execution: Motivation-Reaction Units (MRUs)

Scenes should be constructed using **Motivation-Reaction Units** for psychological realism:

- **Motivation (External)**: Observable event happens TO character
- **Reaction (Internal → External)**:
  1. Feeling (involuntary emotion)
  2. Reflex (involuntary action)
  3. Rational action & speech (conscious response)

## 4. JSON Data Structure for Scene Object

### Field Descriptions

**scene_id**: A unique identifier for the scene.

**scene_number**: The sequential number of the scene within the chapter.

**chapter_ref**: Reference to the chapter this scene belongs to.

**character_ids**: An array of character IDs for all characters present or referenced in the scene.

**setting_id**: A link to the specific Setting object where the scene takes place.

**pov_character_id**: The identifier of the character from whose point of view the scene is told.

**narrative_voice**: The narrative perspective (e.g., "third_person_limited", "first_person").

**summary**: A one-sentence description of the scene's core action or purpose.

**entry_hook**: The opening line or action designed to immediately engage the reader.

**goal**: A clear statement of what the point-of-view character wants to achieve in the scene.

**conflict**: The obstacle, internal or external, that prevents the character from easily achieving their goal.

**outcome**: The result of the conflict, typically an enum ('success', 'failure', 'success_with_cost', 'failure_with_discovery'). This outcome drives the plot forward into the next scene.

**emotional_shift**: A description of the change in the POV character's emotional state from the beginning to the end of the scene (e.g., from "hopeful" to "terrified"). This is crucial for tracking character arcs.

### Example JSON Structure

```json
{
  "scene": {
    "scene_id": "scene_001",
    "scene_number": 1,
    "chapter_ref": "chap_001",
    "character_ids": ["char_maya_001", "char_elena_002"],
    "setting_id": "setting_elena_apt_001",
    "pov_character_id": "char_maya_001",
    "narrative_voice": "third_person_limited",
    "summary": "Maya arrives for coffee date, finds Elena's door unlocked and apartment empty with signs of struggle",
    "entry_hook": "The door to Elena's apartment stood ajar, a sliver of darkness where warmth should be.",
    "goal": "Have normal coffee date with Elena",
    "conflict": "Apartment unlocked, Elena missing, signs of struggle",
    "outcome": "failure_with_discovery",
    "emotional_shift": {
      "from": "hopeful",
      "to": "terrified"
    }
  }
}
```

---

# Character Specification (Cross-Level: Character Identity and Context)

## 1. Definition and Core Purpose

A **character** is the fundamental human element driving narrative engagement. Characters must maintain consistent identity while evolving through story events. The character specification provides essential information for writing characters consistently across all narrative levels.

## 2. The Essential Principle: Consistency Through Context

Characters need two types of information:

### 2.1. Fixed Identity (Who They Are)
- **Personality**: Core traits driving behavior
- **Voice**: How they speak and express themselves
- **Background**: Essential history affecting current behavior
- **Capabilities**: What they can and cannot do

### 2.2. Current Context (Where They Are Now)
- **Knowledge**: What they know at this story point
- **Emotional State**: Current feelings and mental condition
- **Relationships**: Current dynamics with other characters
- **Goals**: What they want right now

## 3. YAML Data Structure for Character Object

```yaml
# ============================================
# CHARACTER SPECIFICATION - HNS FORMAT
# ============================================

character:
  # Core identification
  character_id: "char_maya_001"
  name: "Maya Chen"
  role: "protagonist"
  archetype: "reluctant_hero"
  age: 28

  # Character summary
  summary: "Investigative photographer searching for missing sister, reluctantly learning shadow magic"
  storyline: "Maya must overcome skepticism to master dangerous magic and save Elena"

  # Fixed identity traits
  personality:
    traits: ["analytical", "protective", "skeptical", "determined"]
    myers_briggs: "INTJ"
    enneagram: "Type 5 - Investigator"

  # Character backstory
  backstory:
    childhood: "Raised by grandmother after parents died mysteriously"
    education: "Journalism degree from UC Berkeley"
    career: "Freelance investigative photographer"
    relationships: "Close to sister Elena, few other connections"
    trauma: "Parents' unexplained disappearance at age 10"

  # Core drives
  motivations:
    primary: "Protect Elena at all costs"
    secondary: "Understand truth behind parents' disappearance"
    fear: "Losing control and hurting loved ones"

  # Character arc
  character_journey:
    starting_point: "Skeptical rationalist denying supernatural"
    goal: "Save Elena from Shadow Realm"
    internal_conflict: "Fear of power vs need to be strong"
    external_conflict: "Shadow Realm forces trying to corrupt her"
    epiphany: "True strength comes from accepting all parts of self"
    ending_point: "Integrated shadow keeper balancing light and dark"

  # Abilities and limitations
  capabilities:
    skills: ["photography", "investigation", "pattern_recognition"]
    supernatural: ["shadow_manipulation", "darkness_navigation", "void_sensing"]
    limitations: ["corruption_susceptible", "emotionally_guarded", "trust_issues"]

  # Voice and communication
  voice:
    speech_pattern: "Precise, questioning, measured"
    vocabulary: "Educated, journalistic, photography metaphors"
    verbal_tics: ["'Let me see if I understand...'", "'Picture this...'"]
    internal_voice: "Analytical with undercurrent of worry"

  # Physical description for visualization
  physical_description:
    ethnicity: "Chinese-American"
    height: "5'6''"
    build: "Athletic, runner's physique"
    hair_style_color: "Shoulder-length black hair, usually in ponytail"
    eye_color: "Dark brown with gold flecks when using magic"
    facial_features: "High cheekbones, expressive eyebrows, determined jaw"
    distinguishing_marks: "Silver star birthmark on left wrist"
    typical_attire: "Dark jeans, comfortable boots, photographer vest, camera"

  # Relationship dynamics
  relationships:
    elena:
      type: "sister"
      status: "missing"
      dynamic: "protective_older_sister"
      emotional_bond: "deep_love_and_responsibility"
    marcus:
      type: "mentor"
      status: "complicated"
      dynamic: "reluctant_trust"
      emotional_bond: "growing_respect_with_suspicion"
    void:
      type: "antagonist"
      status: "unknown_threat"
      dynamic: "corrupted_predecessor"
      emotional_bond: "fear_and_dark_recognition"

  # Current story context (updated as story progresses)
  current_state:
    location: "San Francisco"
    emotional: "determined but afraid"
    physical: "exhausted from training"
    knowledge_level: "learning shadow manipulation basics"
    immediate_goal: "Master first level of shadow walking"

  # Visual reference for consistency
  visual_reference_id: "maya_chen_ref_001.png"
  visual_style_notes: "Realistic, cinematic lighting, film noir influences"
```

---

# Setting Specification (Cross-Level: Location Context)

## 1. Definition and Purpose

**Settings** define specific locations within the story world, providing necessary details for both descriptive prose and environmental visualization. Settings must support the narrative's dramatic needs while maintaining consistency.

## 2. YAML Data Structure for Setting Object

```yaml
# ============================================
# SETTING SPECIFICATION - HNS FORMAT
# ============================================

setting:
  # Identification
  setting_id: "setting_shadow_realm_002"
  name: "The Shadow Realm"
  category: "supernatural"

  # Setting description
  description: "A dark mirror dimension where shadows have substance and light is foreign. Architecture shifts based on inhabitants' fears, and time flows differently than in the material world."

  # Atmospheric elements
  mood: "oppressive and surreal"
  atmosphere_descriptors: ["ethereal", "menacing", "constantly shifting"]

  # Sensory details
  sensory:
    sight:
      - "Inverted architecture defying gravity"
      - "Shadows moving independently of sources"
      - "Muted colors except for rare light sources"
    sound:
      - "Whispers in unknown languages"
      - "Echoes that precede their sources"
      - "Absolute silence in light pools"
    smell:
      - "Ozone and old paper"
      - "Sweet decay beneath everything"
    touch:
      - "Surfaces that feel liquid but appear solid"
      - "Cold that burns exposed skin"
      - "Air thick like water"
    taste:
      - "Metallic undertone to the air"

  # Time and physics
  temporal_properties:
    time_flow: "nonlinear"
    time_ratio: "1 hour = 3 hours material world"

  physical_laws:
    gravity: "subjective to willpower"
    light_behavior: "pooled rather than radiating"
    matter_state: "semi-permeable based on intent"

  # Narrative functions
  story_purpose:
    - "Prison for Elena"
    - "Source of shadow keeper powers"
    - "Final confrontation location"

  associated_characters:
    - character_id: "char_void_004"
      relationship: "domain ruler"
    - character_id: "char_elena_002"
      relationship: "prisoner"

  # Key locations within setting
  sub_locations:
    - name: "The Threshold"
      description: "Entry point between realms"
    - name: "Memory Gardens"
      description: "Where stolen memories take root"
    - name: "The Void's Throne"
      description: "Center of realm's power"

  # Danger and obstacles
  hazards:
    - "Shadow predators hunting light-bearers"
    - "Memory mazes that trap visitors in past"
    - "Corruption zones accelerating shadow infection"

  # Visual generation parameters
  visual_style: "dark fantasy horror"
  visual_references: ["HR Giger", "Silent Hill", "Inception folding city"]
  color_palette: ["deep purples", "blacks", "silver highlights", "rare gold light"]
  architectural_style: "Gothic mixed with non-Euclidean geometry"
```

---

# Validation and Coherence Auditing

## 1. The Challenge of Narrative Coherence

A compelling narrative requires absolute coherence—events must follow logical cause-and-effect chains, characters must act consistently with their established personalities, and story world rules must be respected. The risk of incoherence is magnified in procedural or AI-assisted generation.

## 2. Dual-System Validation Framework

### System 1: Narrative State Tracker (Symbolic Validation)

Tracks objective state of story entities using a key-value store:

**Tracked States:**
- Character States: `character_A.status = 'alive'`, `character_B.location = 'castle'`
- Object States: `magic_sword.owner = 'character_A'`, `magic_sword.status = 'intact'`
- Knowledge States: `character_C.knows('secret') = true`
- Relationship States: `relationship(A, B).status = 'allies'`

**Implementation:**
```yaml
validation_checks:
  pre_conditions:
    - ASSERT(character_A.status == 'alive')
    - ASSERT(character_A.location == scene.location)
    - ASSERT(object.owner == character_A)

  post_conditions:
    - UPDATE(object.owner = character_B)
    - UPDATE(character_A.knows('betrayal') = true)
```

### System 2: LLM Logic & Emotion Auditor (Semantic Validation)

Uses AI to evaluate nuanced narrative coherence:

**Causality Check:**
- Evaluates logical progression between scenes
- Identifies missing steps or logical gaps
- Suggests bridging scenes when needed

**Character Consistency Check:**
- Compares character actions against established profile
- Flags out-of-character behavior
- Evaluates psychological plausibility

**Emotional Arc Check:**
- Tracks emotional progression across scenes
- Identifies unearned emotional shifts
- Ensures organic character development

---

# AI-Augmented Generation Process

## 1. The Iterative Refinement Paradigm

The process breaks down novel creation into manageable, sequential steps following the Snowflake Method, augmented with AI assistance at each stage.

## 2. The AI-Augmented Snowflake Algorithm

### Step 1: Core Concept Generation
- **Action**: Create one-sentence premise
- **Target**: Story object
- **AI Role**: Generate multiple premise variations
- **Human Role**: Select and refine best option

### Step 2: Act-Level Structuring
- **Action**: Expand premise to paragraph
- **Target**: Part objects
- **AI Role**: Structure into three-act format
- **Human Role**: Segment and assign to parts

### Step 3: Character Conception
- **Action**: Create character profiles
- **Target**: Character objects
- **AI Role**: Generate character foundations
- **Human Role**: Add psychological depth

### Step 4: Chapter-Level Expansion
- **Action**: Expand act summaries
- **Target**: Chapter objects
- **AI Role**: Detail plot progression
- **Human Role**: Ensure coherence

### Step 5: Scene Breakdown
- **Action**: List individual scenes
- **Target**: Scene objects
- **AI Role**: Break chapters into scenes
- **Human Role**: Adjust pacing and flow

## 3. AI Prompting Templates

**Premise Generation:**
```
Given the concept "[initial idea]", generate 5 one-sentence premises under 20 words.
Each must introduce: protagonist, core conflict, personal stakes.
```

**Act Expansion:**
```
Expand premise "[premise]" into 5-sentence paragraph following three-act structure:
- Sentence 1: Setup and ordinary world
- Sentences 2-4: Three escalating disasters
- Sentence 5: Resolution hint
```

**Scene Breakdown:**
```
Break this chapter summary into 3-5 distinct scenes:
"[chapter summary]"
For each scene provide: one-sentence action, setting, involved characters.
```

---

# Evaluation Framework for Web Novels

## 1. Defining Quality for Serialized Fiction

Web novel success prioritizes sustained reader engagement over traditional literary merit. The primary goal is compelling readers to consume the next chapter through effective pacing, conflict escalation, and hooks.

## 2. Multi-Axis Evaluation Matrix

### Quantitative Metrics

**Chapter Word Count:**
- Target Range: 1,500-2,500 words
- Measurement: Simple word count
- Purpose: Optimal for single-session reading

**Pacing Score:**
- Formula: (Plot-Advancing Scenes) / (Word Count / 1000)
- Measurement: Density of meaningful events
- Purpose: Ensure appropriate narrative momentum

**Hook Presence:**
- Measurement: Binary check for chapter_hook
- Target: 1 (present) for all chapters
- Purpose: Ensure reader retention mechanism

**Reader Engagement Score:**
- Formula: (Comments + Likes) / Views
- Source: Platform analytics
- Purpose: Track audience interaction trends

### Qualitative Metrics (1-5 Scale)

**Plot Coherence & Progression:**
- 1: Significant plot holes or contradictions
- 3: Logically consistent but weak progression
- 5: Compelling, logical advancement

**Character Development & Believability:**
- 1: Out-of-character actions
- 3: Plausible but static
- 5: Deep, consistent development

**Pacing & Flow:**
- 1: Jarringly slow/fast
- 3: Acceptable but uneven
- 5: Perfectly matched to content

**Hook Effectiveness:**
- 1: Flat ending
- 3: Generic hook
- 5: Compelling urgency to continue

**Prose & Style:**
- 1: Many errors
- 3: Clear but generic
- 5: Evocative and immersive

## 3. Diagnostic Application

The evaluation matrix serves as a diagnostic tool for systematic improvement:

```yaml
chapter_evaluation:
  chapter_id: "chap_001"

  quantitative:
    word_count: 2,145
    pacing_score: 2.8
    hook_present: true
    engagement_score: 0.145

  qualitative:
    plot_coherence: 4
    character_believability: 5
    pacing_flow: 3
    hook_effectiveness: 5
    prose_style: 4

  recommendations:
    - "Consider adding one more plot-advancing scene"
    - "Smooth transitions between scene 2 and 3"
    - "Strong character voice maintained throughout"
```

---

# Conclusion

This Hierarchical Narrative Schema provides a comprehensive framework for systematic story creation, validation, and evaluation. By treating narrative as structured data, it enables:

1. **Systematic Planning**: Clear progression from concept to detailed scenes
2. **AI Augmentation**: Structured prompts for consistent AI assistance
3. **Automated Validation**: Dual-system coherence checking
4. **Visual Consistency**: Data-driven prompt generation for art assets
5. **Quality Evaluation**: Objective metrics for serialized fiction success

The framework transforms storytelling from an unstructured creative process into a systematic discipline while preserving the essential human elements of creativity, taste, and emotional depth. It provides the foundation for scalable, high-quality narrative content production in the digital age.