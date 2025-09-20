# Story Specification (Level 1: Overall Narrative)

## 1. Definition and Purpose

The **Story** level encompasses the complete narrative journey from the initial hook to the final resolution. It represents the overarching question, conflict, or transformation that drives the entire work. At this level, writers consider the fundamental premise, core themes, and the ultimate destination of their narrative.

## 2. Key Functions in Planning

- **Central Question Identification**: Define the specific dramatic question your serial will explore over time, with both overarching and episodic questions
- **Character Profile Creation**: Build detailed backgrounds including personality traits, backstories, goals, flaws, and character development arcs suitable for long-form serial exploration
- **World and Setting Design**: Map specific locations, time periods, and cultural context that can support extended exploration across multiple episodes
- **Conflict Architecture**: Establish layered conflicts including overarching story conflict, part-level tensions, and chapter-specific obstacles for sustained reader engagement
- **Message and Meaning**: Identify themes that can develop gradually across serial installments while providing episodic satisfaction
- **Character Relationship Mapping**: Chart complex relationship dynamics that can evolve meaningfully across many chapters and reader feedback cycles
- **Serial Publication Planning**: Design story structure that accommodates regular publishing schedules, reader feedback integration, and sustainable writing pace
- **Reader Engagement Strategy**: Plan hooks, cliffhangers, and community interaction points that maintain audience investment over extended publication periods

## 3. Story Organization and Part Structure

Before writing, you must decide how to divide your complete story into major parts. This organizational decision shapes your entire narrative approach and reader experience.

**Determining Number of Parts:**

**Three-Part Structure (Most Common):**

- **Part I - Setup (25% of story)**: Establish world, characters, goals, and initial conflicts
- **Part II - Confrontation (50% of story)**: Escalate stakes, develop complications, build toward climax
- **Part III - Resolution (25% of story)**: Resolve conflicts, complete character arcs, provide satisfying conclusion

**Four-Part Structure (Epic/Complex Narratives):**

- **Part I - Ordinary World**: Introduce protagonist in their normal environment
- **Part II - Journey Begins**: Launch the adventure, establish stakes and obstacles
- **Part III - Crisis and Transformation**: Major setbacks, character growth, pivotal revelations
- **Part IV - Final Challenge**: Climax, resolution, return to changed world

**Five-Part Structure (Classical Drama):**

- **Part I - Exposition**: Introduce characters, setting, background information
- **Part II - Rising Action**: Build conflict, develop complications
- **Part III - Climax**: Story's turning point, highest tension
- **Part IV - Falling Action**: Consequences of climax, loose ends addressed
- **Part V - Resolution**: Final outcomes, character fates determined

**How to Choose Your Structure for Web Serials:**

1. **Publication Schedule**: Align part structure with your planned release timeline and reader expectations
2. **Reader Retention**: Design parts that create natural anticipation and investment cycles
3. **Character Development Arcs**: Structure parts around major character growth phases that can sustain reader interest
4. **Feedback Integration Points**: Plan parts to coincide with major reader feedback opportunities and potential story adjustments
5. **Community Engagement**: Create part divisions that generate discussion and speculation among serial readers
6. **Sustainable Writing**: Balance part complexity with your ability to maintain consistent publication quality

**Flexible Application**: Remember that these structures are templates, not rigid rules. Adapt them to serve your specific story rather than forcing your narrative into predetermined boxes.

## 4. Implementation Strategies for Web Serial Fiction

### 4.1. For New Serial Writers

**Establish Your Serial Foundation:**

1. Define your overarching story question and the episodic questions that will sustain reader engagement
2. Plan a sustainable publication schedule that matches your writing capacity
3. Design your story structure to accommodate reader feedback and potential plot adjustments
4. Create character and world foundations that can support long-term exploration

**Build Your Publication Strategy:**

1. Plan compelling chapter hooks that generate anticipation and discussion
2. Design cliffhangers that balance satisfaction with anticipation
3. Establish community engagement points throughout your narrative structure
4. Create feedback integration opportunities at natural story breaks

### 4.2. For Community Building

**Reader Engagement Planning:**

1. Design story moments specifically to generate reader theories and speculation
2. Plan character interactions that create emotional investment and discussion
3. Build mystery elements that sustain reader curiosity across multiple chapters
4. Create opportunities for readers to influence character development or plot direction

**Feedback Integration Systems:**

1. Structure story arcs to accommodate reader response between major developments
2. Plan flexible plot elements that can be adjusted based on reader engagement
3. Design character relationships that can evolve based on community feedback
4. Create story beats that can be extended or compressed based on reader interest

### 4.3. For Sustainable Serial Writing

**Publication Rhythm Management:**

1. Balance chapter complexity with consistent publication requirements
2. Plan story arcs that align with your natural writing and publication cycles
3. Design character development that can sustain reader interest over extended periods
4. Create backup content strategies for maintaining publication schedules

**Long-term Story Management:**

1. Plan story complexity that matches your ability to maintain quality over time
2. Design character arcs that provide ongoing development opportunities
3. Structure conflicts that can evolve and deepen across multiple story parts
4. Create world-building that supports extended exploration and reader engagement

## 5. YAML Data Structure Example for Story Planning

```yaml
# ============================================
# STORY SPECIFICATION - COMPACT FORMAT
# ============================================

story:
  title: "The Shadow Keeper"
  genre: "urban fantasy"
  words: 80000
  question: "Can Maya master shadow magic before power corrupts her?"

  # Universal pattern: goal → conflict → outcome
  goal: "Save Elena from Shadow Realm"
  conflict: "Shadow magic corrupts those who use it"
  outcome: "Maya embraces darkness to save light"

  # Character essentials (start→end arcs)
  chars:
    maya: { role: "protag", arc: "denial→acceptance", flaw: "overprotective" }
    elena:
      { role: "catalyst", arc: "missing→transformed", goal: "survive_realm" }
    marcus:
      { role: "mentor", arc: "guilt→redemption", secret: "previous_failure" }
    void: { role: "antag", arc: "power→corruption", goal: "merge_worlds" }

  # Core themes and structure
  themes: ["responsibility_for_power", "love_vs_control", "inner_battles"]
  structure:
    {
      type: "3_part",
      parts: ["setup", "confrontation", "resolution"],
      dist: [25, 50, 25],
    }

  # Setting essentials
  setting:
    primary: ["san_francisco", "photography_studio"]
    secondary: ["shadow_realm", "chinatown_passages"]

  # Part-level progression
  parts:
    - part: 1
      goal: "Maya accepts supernatural reality"
      conflict: "Denial vs mounting evidence"
      outcome: "Reluctant training commitment"
      tension: "denial vs acceptance"

    - part: 2
      goal: "Master shadow magic safely"
      conflict: "Growing power vs corruption risk"
      outcome: "Power embrace despite dangers"
      tension: "power vs integrity"

    - part: 3
      goal: "Save Elena without losing self"
      conflict: "Ultimate power vs moral cost"
      outcome: "Victory through accepting darkness"
      tension: "salvation vs corruption"

  # Serial publication essentials
  serial:
    schedule: "weekly"
    duration: "18_months"
    chapter_words: 4000
    breaks: ["part1_end", "part2_end"]
    buffer: "4_chapters_ahead"

  # Reader engagement hooks
  hooks:
    overarching: ["elena_fate", "maya_corruption_risk", "shadow_magic_truth"]
    mysteries: ["previous_student_identity", "mark_origin", "realm_connection"]
    part_endings: ["mentor_secret_revealed", "elena_appears_changed"]
```

## 6. YAML Field Documentation

This comprehensive guide explains each field in the compact YAML format, detailing what each element represents and how to use it effectively for story planning.

### 6.1. Basic Story Information

**`title`**: The working title of your story

- **Purpose**: Story identification and brand recognition
- **Usage**: Choose something memorable that hints at core conflict or theme
- **Tips**: Can be changed later, but helps maintain focus during planning

**`genre`**: Primary genre classification using underscores

- **Purpose**: Establishes reader expectations and market positioning
- **Usage**: Use standard genres like "urban_fantasy", "sci_fi", "romance", "mystery"
- **Tips**: Affects pacing, chapter length, and reader engagement strategies

**`words`**: Target word count for complete story

- **Purpose**: Scope planning and publication timeline estimation
- **Usage**: Industry standards (80k typical for adult fiction, 60k for YA)
- **Tips**: Affects part distribution and chapter count planning

**`question`**: Central dramatic question driving entire narrative

- **Purpose**: Story focus and reader hook - what keeps readers invested
- **Usage**: Must be answerable only at story's end, creates narrative tension
- **Tips**: Should involve character growth/change, not just plot resolution

### 6.2. Universal Pattern Fields (Core Story Engine)

**`goal`**: What the protagonist wants overall (external/plot goal)

- **Purpose**: Drives story forward, creates reader investment in outcome
- **Usage**: Must be specific, achievable, and personally meaningful to character
- **Tips**: Should connect to deeper character need/internal goal

**`conflict`**: Primary obstacle preventing protagonist from achieving goal

- **Purpose**: Source of story tension and character growth opportunities
- **Usage**: Must escalate throughout story, force character to change/grow
- **Tips**: Best conflicts challenge character's core beliefs/flaws

**`outcome`**: How the central story question resolves

- **Purpose**: Story's thematic statement and character arc completion
- **Usage**: Should reflect character transformation, not just plot resolution
- **Tips**: Often involves accepting/embracing what character initially feared

### 6.3. Character Architecture

**`chars`**: Character hierarchy with essential development data

- **Structure**: Main characters with role, arc, and key attributes
- **Purpose**: Track character functions and development trajectories
- **Usage**: Focus on story-critical characters only (4-6 maximum)

**Character Sub-fields:**

- **`role`**: Character's narrative function ("protag", "antag", "mentor", "catalyst")
- **`arc`**: Character transformation using "start→end" format
- **`flaw`**: Core weakness driving character's internal conflict
- **`goal`**: What this character wants (may differ from protagonist's goal)
- **`secret`**: Hidden information that affects story when revealed

### 6.4. Themes and Structure

**`themes`**: Core thematic elements explored through story

- **Purpose**: Gives story depth and meaning beyond plot events
- **Usage**: 2-4 themes maximum, explore through character choices/conflicts
- **Tips**: Should emerge from character arcs and plot events naturally

**`structure`**: Story organization framework

- **`type`**: Structure pattern ("3_part", "4_part", "5_part")
- **`parts`**: Major section names
- **`dist`**: Percentage distribution (e.g., [25, 50, 25] for 3-part)

### 6.5. Setting Information

**`setting`**: Story world essentials

- **`primary`**: Main recurring locations where most action occurs
- **`secondary`**: Important but less frequent locations
- **Purpose**: Establishes story world scope and atmosphere
- **Usage**: Keep focused - too many settings dilute story impact

### 6.6. Part-Level Progression

**`parts`**: Array of major story sections with individual arcs

- **Purpose**: Structure large narrative into manageable dramatic units
- **Usage**: Each part should have complete mini-arc while advancing overall story

**Part Sub-fields:**

- **`part`**: Part number/order
- **`goal`**: What protagonist seeks in this part
- **`conflict`**: Primary obstacle in this part
- **`outcome`**: How this part resolves/transitions
- **`tension`**: Central tension driving this part's drama

### 6.7. Serial Publication Strategy

**`serial`**: Publication planning for serialized fiction

- **`schedule`**: Publication frequency ("weekly", "daily", "monthly")
- **`duration`**: Estimated total publication timeline
- **`chapter_words`**: Target words per chapter/episode
- **`breaks`**: Natural pause points for reader feedback integration
- **`buffer`**: How many chapters to write ahead of publication

### 6.8. Reader Engagement Architecture

**`hooks`**: Story elements designed to maintain reader interest

- **`overarching`**: Long-term mysteries/questions spanning multiple parts
- **`mysteries`**: Specific unanswered questions driving reader speculation
- **`part_endings`**: Cliffhangers/revelations at major structural points

**Purpose**: Creates active reader community and sustained engagement
**Usage**: Plant early, pay off strategically, balance revelation with new questions
**Tips**: Best hooks connect to character development and thematic exploration

### 6.9. Field Naming Conventions

**Abbreviations Used:**

- **`protag`**: protagonist
- **`antag`**: antagonist
- **`chap`**: chapter
- **`words`**: word count

**Underscore Usage:**

- **Time/Place**: "sunday_morning", "photography_studio"
- **Complex Concepts**: "love_vs_control", "denial_vs_acceptance"
- **Multi-word Items**: "part1_end", "shadow_magic_truth"

**Arrow Usage (→):**

- **Character Arcs**: "denial→acceptance" shows transformation
- **Progression**: "start→middle→end" shows sequence
- **Relationships**: "cause→effect" shows connection

### 6.10. Using This Format Effectively

**Planning Order:**

1. Start with basic info (title, genre, words, question)
2. Define universal pattern (goal, conflict, outcome)
3. Develop character architecture
4. Plan part-level progression
5. Add serial/engagement elements

**Validation Questions:**

- Does the goal drive the entire story?
- Does the conflict force character growth?
- Does the outcome reflect character transformation?
- Are character arcs interconnected and meaningful?
- Do parts build toward overall story resolution?

This compact format transforms story planning from academic exercise into practical tool for systematic narrative development.

---

# Part Specification (Level 2: Major Sections)

## 1. Definition and Purpose

**Parts** represent major thematic or narrative divisions within the overall story. These are substantial sections that each have their own internal logic, often featuring distinct settings, time periods, or phases of character development. Parts typically conclude with significant plot developments or character realizations that propel the story forward.

## 2. Key Functions in Planning

- **Serial Arc Development**: Structure each part as a satisfying mini-arc within the larger story, providing both resolution and anticipation
- **Reader Engagement Cycles**: Design parts to create natural climax-and-anticipation patterns that maintain long-term readership
- **Character Growth Phases**: Organize character development into distinct stages that can sustain reader investment across multiple chapters
- **Community Discussion Points**: Plan major plot developments that generate reader speculation and engagement
- **Feedback Integration Opportunities**: Structure parts to allow for reader response incorporation between major story movements
- **Publication Milestone Planning**: Align part conclusions with natural publication breaks and reader retention strategies
- **Cliffhanger Architecture**: Design part endings that create anticipation for the next major story movement while providing satisfying closure

## 3. Practical Application Guidelines

**Typical Part Structures:**

**Three-Part Structure (Classic):**

- Part I: Setup and initial conflict
- Part II: Development and complication
- Part III: Climax and resolution

**Four-Part Structure (Quest Narrative):**

- Part I: Ordinary world and call to adventure
- Part II: Journey begins and obstacles emerge
- Part III: Major crisis and transformation
- Part IV: Return and resolution

**Five-Part Structure (Complex Narratives):**

- Part I: Exposition and inciting incident
- Part II: Rising action and complications
- Part III: Midpoint crisis and reversal
- Part IV: Climax and falling action
- Part V: Resolution and denouement

## 4. Part Planning Framework

**For Each Part, Define:**

- **Central Question**: What major question does this part explore or answer?
- **Character Development**: How do characters change during this section?
- **Plot Development**: What major events or revelations occur?
- **Thematic Focus**: What themes are emphasized in this part?
- **Emotional Journey**: What emotional progression do readers experience?
- **Ending Impact**: How does this part conclude to propel the story forward?

## 5. Input Requirements from Story Specification

The part specification requires the following input data from the story-specification output:

```yaml
# ============================================
# REQUIRED INPUT FROM STORY SPECIFICATION
# ============================================

story_input:
  # Core story context
  title: "The Shadow Keeper"
  genre: "urban_fantasy"
  words: 80000
  question: "Can Maya master shadow magic before power corrupts her?"

  # Universal story pattern
  goal: "Save Elena from Shadow Realm"
  conflict: "Shadow magic corrupts those who use it"
  outcome: "Maya embraces darkness to save light"

  # Character foundations
  chars:
    maya: { role: "protag", arc: "denial→acceptance", flaw: "overprotective" }
    elena:
      { role: "catalyst", arc: "missing→transformed", goal: "survive_realm" }
    marcus:
      { role: "mentor", arc: "guilt→redemption", secret: "previous_failure" }
    void: { role: "antag", arc: "power→corruption", goal: "merge_worlds" }

  # Story structure and themes
  themes: ["responsibility_for_power", "love_vs_control", "inner_battles"]
  structure:
    type: "3_part"
    parts: ["setup", "confrontation", "resolution"]
    dist: [25, 50, 25]

  # Setting essentials
  setting:
    primary: ["san_francisco", "photography_studio"]
    secondary: ["shadow_realm", "chinatown_passages"]

  # Story-level parts with goals and conflicts
  parts:
    - part: 1
      goal: "Maya accepts supernatural reality"
      conflict: "Denial vs mounting evidence"
      outcome: "Reluctant training commitment"
      tension: "denial vs acceptance"
    - part: 2
      goal: "Master shadow magic safely"
      conflict: "Growing power vs corruption risk"
      outcome: "Power embrace despite dangers"
      tension: "power vs integrity"
    - part: 3
      goal: "Save Elena without losing self"
      conflict: "Ultimate power vs moral cost"
      outcome: "Victory through accepting darkness"
      tension: "salvation vs corruption"

  # Serial publication context
  serial:
    schedule: "weekly"
    duration: "18_months"
    chapter_words: 4000
    breaks: ["part1_end", "part2_end"]
    buffer: "4_chapters_ahead"

  # Reader engagement strategy
  hooks:
    overarching: ["elena_fate", "maya_corruption_risk", "shadow_magic_truth"]
    mysteries: ["previous_student_identity", "mark_origin", "realm_connection"]
    part_endings: ["mentor_secret_revealed", "elena_appears_changed"]
```

## 6. YAML Data Structure Example for Part Planning

```yaml
# ============================================
# PART SPECIFICATION - COMPACT FORMAT
# ============================================

part:
  part: 1
  title: "Discovery"
  words: 20000
  function: "story_setup"

  # Universal pattern: goal → conflict → outcome
  goal: "Maya accepts supernatural reality"
  conflict: "Denial vs mounting evidence"
  outcome: "Reluctant training commitment"

  # Central questions driving this part
  questions:
    primary: "How will Maya react to discovering her magical abilities?"
    secondary: "Can Maya overcome denial to accept the supernatural world?"

  # Character development in this part
  chars:
    maya:
      start: "denial_normalcy"
      end: "reluctant_acceptance"
      arc:
        [
          "normal_routine",
          "strange_discoveries",
          "power_manifestation",
          "training_acceptance",
        ]
      conflict: "safety_vs_responsibility"
      transforms: ["magical_manifestation", "mentor_acceptance"]

    elena:
      start: "mysterious_absence"
      end: "catalyst_revelation"
      arc: ["absent_mystery", "journal_revelation", "supernatural_connection"]
      function: "motivation_worldbuilding"
      transforms: ["disappearance_mystery", "supernatural_connection"]

  # Plot progression
  plot:
    events:
      [
        "elena_disappearance",
        "journal_discovery",
        "shadow_manifestation",
        "marcus_introduction",
      ]
    reveals: ["elena_research", "maya_abilities", "shadow_keeper_legacy"]
    escalation: ["personal_loss", "reality_challenge", "power_responsibility"]

  # Thematic focus
  themes:
    primary: "denial_and_acceptance"
    elements: ["denial_vs_truth", "family_responsibility"]
    moments: ["photograph_evidence", "power_manifestation", "training_decision"]
    symbols: ["shadows_as_fears", "photography_as_truth"]

  # Emotional journey
  emotion:
    start: "casual_family_concern"
    progression:
      ["growing_fear", "supernatural_terror", "determined_resolution"]
    end: "grim_commitment"

  # Part ending strategy
  ending:
    resolution: ["training_commitment", "moral_conflict_established"]
    setup: ["power_development_phase", "mentor_relationship"]
    hooks: ["elena_time_pressure", "corruption_risk"]
    hook_out: "Maya accepts training but discovers mentor's dark secret"

  # Serial structure
  serial:
    arc: "Setup → Rising Tension → Part Climax → Transition Hook"
    climax_at: "85%"
    satisfaction:
      ["elena_fate_revealed", "maya_abilities_confirmed", "mentor_established"]
    anticipation: ["corruption_risk", "training_challenges", "time_pressure"]

  # Reader engagement
  engagement:
    discussions:
      ["maya_moral_choices", "elena_true_situation", "marcus_hidden_past"]
    speculation: ["marcus_previous_student", "elena_still_herself"]
    debates: ["trust_marcus_completely", "elena_worth_corruption_risk"]
    feedback: ["character_dynamics", "magic_complexity", "pacing"]
```

## 7. Output Data for Chapter Specification

The part specification provides the following output data structure for use as input by chapter specifications:

```yaml
# ============================================
# PART OUTPUT FOR CHAPTER SPECIFICATION INPUT
# ============================================

# Output for chapter specification input
part_context:
  part: 1
  title: "Discovery"
  words: 20000
  function: "story_setup"

# Inherited story context
story_context:
  title: "The Shadow Keeper"
  genre: "urban_fantasy"
  themes: ["responsibility_for_power", "love_vs_control", "inner_battles"]
  overall_goal: "Save Elena from Shadow Realm"
  overall_conflict: "Shadow magic corrupts those who use it"

# Part-specific pattern that chapters must serve
part_pattern:
  goal: "Maya accepts supernatural reality"
  conflict: "Denial vs mounting evidence"
  outcome: "Reluctant training commitment"
  questions:
    primary: "How will Maya react to discovering her magical abilities?"
    secondary: "Can Maya overcome denial to accept the supernatural world?"

# Character states and development for chapters
chars:
  maya:
    role: "protag"
    part_arc: "denial_normalcy→reluctant_acceptance"
    current_state: "denial_normalcy"
    target_state: "reluctant_acceptance"
    conflict: "safety_vs_responsibility"
    key_transforms: ["magical_manifestation", "mentor_acceptance"]

  elena:
    role: "catalyst"
    part_arc: "mysterious_absence→catalyst_revelation"
    current_state: "mysterious_absence"
    target_state: "catalyst_revelation"
    function: "motivation_worldbuilding"
    key_transforms: ["disappearance_mystery", "supernatural_connection"]

# Chapter assignment for individual chapters (example: Chapter 1)
chapter_assignment:
  function: "part_opening"
  goal: "Establish Elena's disappearance"
  events: ["elena_disappearance", "signs_of_struggle", "supernatural_clues"]

# Thematic and emotional context
part_themes:
  primary: "denial_and_acceptance"
  elements: ["denial_vs_truth", "family_responsibility"]
  symbols: ["shadows_as_fears", "photography_as_truth"]

emotion_arc:
  start: "casual_family_concern"
  progression: ["growing_fear", "supernatural_terror", "determined_resolution"]
  end: "grim_commitment"

# Serial publication context
serial_context:
  part_climax_at: "85%"
  satisfaction_points: ["elena_fate_revealed", "maya_abilities_confirmed"]
  anticipation_hooks: ["corruption_risk", "training_challenges"]
  ending_hook: "Maya accepts training but discovers mentor's dark secret"
```

## 8. YAML Field Documentation

This comprehensive guide explains each field in the compact part specification YAML format, detailing how to plan and structure major story sections effectively.

### 8.1. Part Identification

**`part`**: Part number in story sequence

- **Purpose**: Establishes position in overall story structure
- **Usage**: Sequential numbering (1, 2, 3...) based on story structure type
- **Tips**: Aligns with story-level part planning and reader expectations

**`title`**: Distinctive name for this major story section

- **Purpose**: Thematic identity and organizational clarity
- **Usage**: Should reflect part's central focus or character development phase
- **Tips**: Often reflects character state or story movement ("Discovery", "Training", "Confrontation")

**`words`**: Target word count for this part

- **Purpose**: Pacing control and publication planning
- **Usage**: Typically 15k-25k words per part for standard novels
- **Tips**: Should align with story-level word distribution and part function

**`function`**: Part's role in overall story architecture

- **Purpose**: Defines structural purpose within larger narrative
- **Usage**: Common functions: "story_setup", "development", "climax_resolution"
- **Tips**: Must serve overall story arc while having internal completeness

### 8.2. Universal Pattern Fields (Part-Level Drama)

**`goal`**: What the protagonist seeks to accomplish in this part

- **Purpose**: Drives part-specific dramatic arc and reader engagement
- **Usage**: Must advance overall story goal while being achievable within part scope
- **Tips**: Should require significant effort/growth to achieve

**`conflict`**: Primary obstacle preventing goal achievement in this part

- **Purpose**: Creates part-level tension and forces character development
- **Usage**: Must escalate from previous part while building toward next
- **Tips**: Best conflicts challenge character growth needs for this story phase

**`outcome`**: How this part resolves and transitions to next

- **Purpose**: Provides satisfaction while creating momentum for continuation
- **Usage**: Should answer part-specific questions while raising new ones
- **Tips**: Must feel earned through character effort and growth

### 8.3. Driving Questions

**`questions`**: Central questions that drive reader engagement through this part

- **`primary`**: Main question this part exists to explore/answer
- **`secondary`**: Supporting question that adds depth and complexity
- **Purpose**: Maintains reader investment and provides structural focus
- **Usage**: Primary should be answerable within part; secondary may carry forward
- **Tips**: Questions should emerge from character needs and story conflicts

### 8.4. Character Development Architecture

**`chars`**: Character progression tracking for this part

- **Purpose**: Maps character growth phases within larger story arcs
- **Usage**: Focus on characters with significant development in this part
- **Structure**: Individual character objects with development tracking

**Character Development Sub-fields:**

- **`start`**: Character's emotional/psychological state entering this part
- **`end`**: Character's state after completing this part's journey
- **`arc`**: Step-by-step progression through part (array of development phases)
- **`conflict`**: Internal struggle driving character choices in this part
- **`transforms`**: Key moments of character change/realization
- **`function`**: Character's role in advancing this part's themes/plot

### 8.5. Plot Architecture

**`plot`**: Story events and revelations specific to this part

- **`events`**: Major plot developments that occur in this part
- **`reveals`**: Important information discoveries that advance understanding
- **`escalation`**: How stakes/tension increase through this part
- **Purpose**: Tracks concrete story advancement within part structure
- **Usage**: Must build logically from previous parts while setting up future developments

### 8.6. Thematic Integration

**`themes`**: Thematic exploration within this part

- **`primary`**: Central theme this part develops
- **`elements`**: Specific thematic contrasts/tensions explored
- **`moments`**: Key scenes where themes become explicit
- **`symbols`**: Recurring images/objects that reinforce themes
- **Purpose**: Gives part depth beyond plot advancement
- **Usage**: Should emerge naturally from character choices and conflicts

### 8.7. Emotional Journey Management

**`emotion`**: Reader/character emotional progression through part

- **`start`**: Opening emotional state/tone
- **`progression`**: Emotional beats that escalate through part
- **`end`**: Closing emotional state that transitions to next part
- **Purpose**: Creates satisfying emotional arc within part structure
- **Usage**: Must feel earned and support overall story emotional trajectory

### 8.8. Part Ending Strategy

**`ending`**: How this part concludes and connects to story continuation

- **`resolution`**: What gets resolved/completed in this part
- **`setup`**: What gets established for future parts
- **`hooks`**: Specific elements that create anticipation for next part
- **`hook_out`**: Specific cliffhanger/transition that ends this part
- **Purpose**: Balances satisfaction with forward momentum
- **Usage**: Must reward reader investment while compelling continuation

### 8.9. Serial Structure Management

**`serial`**: Part's function within serialized publication model

- **`arc`**: Internal dramatic structure of this part
- **`climax_at`**: Where dramatic peak occurs within part (usually 80-90%)
- **`satisfaction`**: What readers gain from completing this part
- **`anticipation`**: What makes readers want to continue to next part
- **Purpose**: Optimizes part for serial reading experience
- **Usage**: Critical for maintaining reader engagement in serialized fiction

### 8.10. Reader Engagement Strategy

**`engagement`**: Community interaction planning for this part

- **`discussions`**: Topics likely to generate reader conversation
- **`speculation`**: Elements designed to spark reader theories
- **`debates`**: Character choices that create reader discussion
- **`feedback`**: Areas where reader input could influence future development
- **Purpose**: Builds active reader community around story
- **Usage**: Particularly important for serial fiction with reader interaction

### 8.11. Field Usage Guidelines

**Planning Sequence for Parts:**

1. Define part's role in overall story (function, goal, conflict, outcome)
2. Map character development needs for this story phase
3. Plan plot events that support character growth
4. Integrate thematic exploration through character choices
5. Design ending that balances resolution with anticipation

**Validation Checklist:**

- Does this part advance overall story while being internally complete?
- Do character arcs progress meaningfully toward story-level goals?
- Are plot events necessary for character development?
- Does the emotional journey feel earned and satisfying?
- Does the ending create appropriate anticipation for continuation?

**Common Part Planning Mistakes:**

- Making parts too episodic (not advancing overall story)
- Focusing on plot events without character development
- Ending without sufficient resolution for reader satisfaction
- Failing to escalate stakes/tension from previous part
- Not setting up elements needed for future parts

This systematic approach ensures each part functions as both satisfying episode and essential story component.

---

# Character Specification (Cross-Level: Character Identity and Context)

## 1. Definition and Core Purpose

A **character** is the fundamental human element that drives narrative engagement. Characters must maintain consistent identity while evolving through story events. The character specification provides essential information for writing characters consistently across scenes, chapters, and story arcs.

## 2. The Essential Principle: Consistency Through Context

Characters need two types of information for effective scene writing:

### 2.1. Fixed Identity (Who They Are)

Core traits that remain consistent throughout the story:

- **Personality**: Key traits that drive behavior and decision-making
- **Voice**: How they speak and express themselves
- **Background**: Essential history that affects current behavior
- **Capabilities**: What they can and cannot do

### 2.2. Current Context (Where They Are Now)

Dynamic information that changes through story events:

- **Knowledge**: What they know at this point in the story
- **Emotional State**: Current feelings and mental condition
- **Relationships**: Current dynamics with other characters
- **Goals**: What they want right now

## 3. Application in Scene Writing

When writing scenes, characters should be applied through consistent patterns:

**Voice Consistency**: Characters speak in ways that reflect their background, personality, and current emotional state.

**Behavioral Consistency**: Characters act according to their established traits while responding to current circumstances.

**Knowledge Consistency**: Characters can only know what they've learned through story events or background experience.

**Growth Integration**: Character development should emerge from story events rather than arbitrary change.

## 4. YAML Character Specification Schema

This essential format provides only the information needed for consistent character writing across scenes and chapters.

```yaml
# ============================================
# CHARACTER SPECIFICATION - ESSENTIAL FORMAT
# ============================================

character:
  name: "Maya Chen"
  role: "protagonist"
  age: 28
  summary: "Investigative photographer searching for missing sister, reluctantly learning magic"

  # Core identity (consistent traits)
  identity:
    appearance: "5'4_athletic_asian_woman_practical_clothing_silver_star_necklace"
    personality: ["analytical", "protective", "skeptical", "determined"]
    background: "journalism_degree_freelance_photographer_elena_sister"
    skills:
      ["photography", "research", "investigation", "emerging_shadow_magic"]

  # Voice and behavior patterns
  voice:
    speech: "asks_probing_questions_measured_thoughtful"
    vocabulary: "educated_accessible_photography_metaphors"
    mannerisms: ["twists_hair_when_thinking", "taps_camera_when_nervous"]

  # Current story context (updated as story progresses)
  context:
    emotional_state: "determined_but_anxious_about_elena"
    knowledge:
      [
        "elena_missing",
        "shadow_realm_exists",
        "has_magical_mark",
        "training_with_marcus",
      ]
    goals: ["rescue_elena", "master_shadow_abilities", "stay_alive"]

  # Key relationships
  relationships:
    elena: { status: "missing_sister", feelings: "love_worry_determination" }
    marcus: { status: "reluctant_mentor", feelings: "cautious_trust" }
    shepherd: { status: "unknown_threat", feelings: "fear_curiosity" }
```

## 5. YAML Field Documentation

This guide explains each field in the essential character specification format, focusing on the minimum information needed for consistent character writing in scenes and chapters.

### 5.1. Basic Character Information

**`name`**: Character's full name used in story

- **Purpose**: Primary identifier for character consistency
- **Usage**: Use same form throughout all planning documents
- **Tips**: Should reflect character's cultural background

**`role`**: Character's story function

- **Purpose**: Determines character's importance and focus level
- **Usage**: "protagonist", "antagonist", "mentor", "support"
- **Tips**: Affects how much development detail to include

**`age`**: Character's chronological age

- **Purpose**: Influences behavior patterns and decision-making
- **Usage**: Consider maturity level and life experience
- **Tips**: Should align with background and capabilities

**`summary`**: One-sentence character description

- **Purpose**: Quick reference for character's core identity
- **Usage**: Capture essential role and current situation
- **Tips**: Focus on what's most important for scene writing

### 5.2. Core Identity Elements

**`identity`**: Fixed traits that remain consistent

- **Purpose**: Provides foundation for all character behavior
- **Usage**: Reference when writing character actions and dialogue
- **Structure**: Appearance, personality, background, skills

**Identity Sub-fields:**

- **`appearance`**: Key physical traits and visual presentation
- **`personality`**: 3-5 core traits that drive character behavior
- **`background`**: Essential history that affects current behavior
- **`skills`**: What character can and cannot do effectively

### 5.3. Voice and Behavior Patterns

**`voice`**: How character communicates and expresses themselves

- **Purpose**: Ensures consistent dialogue and internal thoughts
- **Usage**: Apply to all character speech in scenes
- **Structure**: Speech patterns, vocabulary, mannerisms

**Voice Sub-fields:**

- **`speech`**: How character typically talks and communicates
- **`vocabulary`**: Word choice level and specialized language
- **`mannerisms`**: Physical behaviors that identify character uniquely

### 5.4. Current Story Context

**`context`**: Dynamic information that changes through story

- **Purpose**: Tracks character's current state for scene writing
- **Usage**: Update as story progresses and character learns/grows
- **Structure**: Emotional state, knowledge, goals

**Context Sub-fields:**

- **`emotional_state`**: Character's current feelings and mental condition
- **`knowledge`**: What character knows at this story point
- **`goals`**: What character wants right now

### 5.5. Key Relationships

**`relationships`**: Character's connections to other characters

- **Purpose**: Tracks interpersonal dynamics for scene interactions
- **Usage**: Reference when characters interact in scenes
- **Structure**: Character objects with status and feelings

**Relationship Sub-fields:**

- **`status`**: Current relationship type and dynamic
- **`feelings`**: Character's emotional response to this person

### 5.6. Usage Guidelines

**Essential Character Planning Steps:**

1. Define character's role and basic identity
2. Establish consistent voice and behavior patterns
3. Set current emotional state and knowledge
4. Map key relationships and dynamics
5. Update context as story progresses

**Character Consistency Indicators:**

- Character speaks and acts according to established patterns
- Character knowledge matches what they've learned in story
- Character relationships evolve based on story events
- Character behavior reflects current emotional state
- Character decisions align with personality and goals

**Common Character Planning Mistakes:**

- Inconsistent personality (character acts against established nature)
- Knowledge errors (character knows/forgets things inappropriately)
- Voice inconsistencies (character speaks differently without reason)
- Static relationships (dynamics don't evolve with story events)
- Context not updated (character state doesn't reflect story progress)

This simplified approach ensures characters remain consistent and authentic while providing LLMs with clear, actionable information for effective scene writing.

---

# Scene Specification (Level 4: Individual Scenes)

## Introduction

Based on a comprehensive analysis of established narrative theories and practical writing advice, this document provides a definitive guide for scene construction. It serves as a robust framework for systematic scene writing, ensuring each narrative unit is purposeful, dramatic, and structurally sound.

## 1. The Foundational Principle: A Scene is a Unit of Change

The single most critical principle of scene construction is that a **scene must create meaningful change**. A scene is not defined by its location or duration but by its function: to advance the story. If a scene can be removed without consequence, it is redundant. This change must be tangible, altering a character's situation either externally or internally and setting up the events of the next scene.

To ensure this change is significant, it is measured by a **Value Shift**. Every scene operates on a spectrum of values (e.g., life/death, truth/lie, victory/defeat) and must move the character from one polarity to its opposite.

- **Positive (+) to Negative (-):** A character begins with hope and ends in despair.
- **Negative (-) to Positive (+):** A character begins in peril and ends in safety.
- **Escalating Shifts:** A bad situation gets worse (- to --), or a good situation gets even better (+ to ++).

This value shift is triggered by a **Turning Point**: a specific action or revelation that unexpectedly and irrevocably alters the scene's direction, forcing a reversal of the character's circumstances or expectations. The entire scene should build toward this moment.

## 2. The Core Architecture: The Scene-Sequel Cycle

The most effective and logical structure for building a propulsive narrative is Dwight V. Swain's **Scene-Sequel** model. This framework creates an unbreakable chain of cause and effect by alternating between proactive (action) and reactive (processing) units.

### 2.1. The Scene (The Action Unit)

This is the unit of conflict where a character actively pursues an objective. It is composed of three parts:

1.  **Goal:** The POV character enters the scene with a specific, immediate, and motivated objective. This goal must be established early to give the scene direction and make the character proactive. The character's desire is the engine of the scene.
2.  **Conflict:** A series of obstacles stands between the character and their goal. This conflict must escalate through **Progressive Complications**, raising the stakes and forcing the character to struggle. Conflict is not just physical; it can be a tense negotiation, a moral dilemma, or an internal struggle.
3.  **Disaster (Outcome):** The scene ends with a negative outcome. The character fails, or their success comes at a great cost. Common outcomes include:
    - **No, and furthermore...:** The character fails, and a new problem arises.
    - **Yes, but...:** The character succeeds, but with an unforeseen negative consequence.
      A scene should rarely end in a total victory until the story's conclusion. The disaster creates the problem that the character must react to in the Sequel.

### 2.2. The Sequel (The Reaction Unit)

Following the disaster, the Sequel provides a structured transition for the character to process events and decide what to do next. It is the bridge that connects one Scene to the next and is vital for character development and pacing. It also has three parts:

1.  **Reaction:** The immediate, visceral, and emotional response to the disaster. This is a moment of feeling, not thinking, and grounds the reader in the character's experience.
2.  **Dilemma:** After the initial shock, the character must intellectually process the new situation. The disaster has left them with no easy options, forcing them to confront a difficult choice (often a "best bad choice").
3.  **Decision:** The character analyzes their options and makes a decision on a new course of action. This decision becomes the **Goal** for the next proactive Scene, thus completing the cycle and launching the next phase of action.

## 3. The Line-Level Execution: Motivation-Reaction Units (MRUs)

To create prose that feels immediate and psychologically real, scenes should be constructed at the micro-level using **Motivation-Reaction Units (MRUs)**. This ensures a logical flow of stimulus and response that mirrors how people process the world.

- **Motivation (The Cause):** An external, observable event happens _to_ the character. It is described objectively.
  - _Example:_ `The door slammed shut.`
- **Reaction (The Effect):** The character's response to the motivation, which must occur in a specific, natural sequence:
  1.  **Feeling (Internal):** The immediate, involuntary emotional response. (_e.g., Fear shot through him._)
  2.  **Reflex (Physical):** The involuntary physical action. (_e.g., He flinched._)
  3.  **Rational Action & Speech (Deliberate):** The conscious, considered action and/or dialogue. (_e.g., He reached for the doorknob. "Who's there?"_)

Maintaining this sequence is critical for creating believable, immersive prose. A reaction should never precede its motivation.

## 4. Narrative Texture: Scene vs. Summary

The pacing of a story is controlled by the strategic balance between rendering events in real-time (**Scene**) and compressing them (**Summary**).

- **Scene ("Showing"):** Dramatizes an event in real-time (story time ≈ narrative time). It uses action, dialogue, and sensory detail to create immersion. Crucial plot points, turning points, and key character interactions _must_ be rendered in scene for maximum impact.
- **Summary ("Telling"):** Compresses time to convey information efficiently (narrative time \< story time). It is used for transitions, backstory, and relating events the reader has already witnessed.

## 5. From Scene to Chapter

Scenes are the building blocks of chapters. A chapter is a curated collection of scenes that functions as a larger, cohesive narrative unit.

- **Chapter Arc:** A well-structured chapter has its own internal arc, with escalating conflict leading to a chapter-level climax or turning point. It should end with a hook that raises a new question, compelling the reader to continue.
- **Unity:** Scenes within a chapter are typically unified by a continuous block of time, a single point of view (POV), a specific objective, or a central theme.
- **Scene Breaks:** A transition between scenes (a shift in time, location, or POV) is indicated by a clear visual break, typically an extra line of white space or a centered dinkus (e.g., `* * *`).

## 6. Input Requirements from Chapter Specification

The scene specification requires the following input data from the chapter-specification output:

```yaml
# ============================================
# REQUIRED INPUT FROM CHAPTER SPECIFICATION
# ============================================

chapter_input:
  # Chapter context for this scene
  chapter_context:
    chap: 1
    title: "Missing"
    pov: "maya"
    words: 3500

  # Inherited context from higher levels
  story_context:
    title: "The Shadow Keeper"
    genre: "urban_fantasy"
    themes: ["responsibility_for_power", "love_vs_control", "inner_battles"]

  part_context:
    part: 1
    title: "Discovery"
    goal: "Maya accepts supernatural reality"

  # Chapter-specific pattern that scene must serve
  chapter_pattern:
    goal: "Normal coffee date with Elena"
    conflict: "Elena missing, signs of supernatural danger"
    outcome: "Finds journal, realizes she's also a target"

  # Character states for this scene
  chars:
    maya:
      role: "protag"
      chapter_arc: "casual_concern→targeted_fear"
      start: "casual_sisterly_concern"
      end: "realizes_personal_danger"
      motivation: "Find Elena and understand threat"
      growth: "Supernatural reality acceptance begins"
    elena:
      role: "catalyst"
      chapter_arc: "absent→mysterious_presence"
      start: "missing_sister"
      end: "supernatural_connection_revealed"
      evidence_left: ["journal", "research_notes", "struggle_signs"]

  # Scene assignment within chapter
  scene_assignment:
    function: "chapter_opening"
    goal: "Establish Elena missing"
    setting: "elena_apartment_hallway"
    events: ["arrival", "door_discovery", "empty_apartment"]

  # Chapter structure context for scene placement
  acts:
    setup:
      percentage: 20
      hook_in: "Door unlocked, coffee warm, Elena gone"
      orient: "Weekly sister ritual, Maya's skeptical nature"
      incident: "Overturned chair, shattered mug - signs of struggle"
    confrontation:
      percentage: 60
      rising_action: "Journal discovery leads to supernatural research evidence"
      midpoint_shift: "Realizes Elena was targeted, not random"
      escalation: "Maya discovers she may be next target"
    resolution:
      percentage: 20
      climax: "Decision to investigate supernatural threat personally"
      resolution: "Commits to finding Elena despite danger"
      hook_out: "Marcus Webb watching from shadows"

  # Tension and atmosphere context
  tension_engine:
    external: "Missing person mystery with supernatural elements"
    internal: "Maya's skepticism vs growing supernatural evidence"
    interpersonal: "Concern for Elena, guilt over recent distance"
    atmospheric: "Empty apartment, signs of struggle, growing dread"

  # Serial publication context
  serial_context:
    satisfaction_provided:
      ["Elena's research revealed", "supernatural reality confirmed"]
    anticipation_created: ["Who is watching Maya?", "What happened to Elena?"]
    hook_type: "looming_threat"
    hook_content: "Marcus Webb watching from shadows"
```

## 7. YAML Data Structure Example for Scene Planning

Since scenes are components within chapters, this compact format focuses only on essential information needed for an LLM to write effective scene content.

```yaml
# ============================================
# SCENE SPECIFICATION - ESSENTIAL FORMAT
# ============================================

scene:
  id: 1
  summary: "Maya arrives for coffee date, finds Elena missing with signs of struggle"

  # Scene context
  time: "sunday_10:05am"
  place: "elena_apartment_hallway"
  pov: "maya"

  # Characters present
  characters:
    maya: { enters: "casual_anticipation", exits: "panicked_determination" }
    elena: { status: "absent_but_referenced", evidence: "struggle_signs" }

  # Core dramatic movement
  goal: "Normal coffee date with Elena"
  obstacle: "Door unlocked, apartment silent, struggle evidence"
  outcome: "Realizes Elena in danger, decides to search"

  # Key beats that must happen
  beats:
    - "Maya knocks, no answer, tries door"
    - "Finds apartment unlocked, calls Elena's name"
    - "Discovers overturned table, broken coffee mug"
    - "Maya panics, decides to search rather than call police"

  # Emotional/value shift
  shift: "routine_expectation → urgent_fear"

  # Connection to chapter flow
  leads_to: "maya_searches_apartment_for_clues"

  # Visual scene description
  image_prompt: "Young woman in casual clothes standing in a dimly lit apartment hallway, her face showing concern as she looks at an ajar door. The scene suggests early morning light filtering through windows, with subtle signs of disturbance visible - an overturned coffee table and scattered items in the background. Mood: tense, mysterious, domestic thriller atmosphere."
```

## 8. YAML Field Documentation

This guide explains each field in the essential scene specification format, focusing on the minimum information needed for an LLM to write effective scene content within chapters.

### 8.1. Scene Identification and Context

**`id`**: Scene number within chapter

- **Purpose**: Simple identification for scene order
- **Usage**: Sequential numbering (1, 2, 3...)
- **Tips**: Keep it simple since scenes are chapter components

**`summary`**: One-sentence description of what happens

- **Purpose**: Quick reference for scene's essential content
- **Usage**: Clear, concise summary of main event/conflict
- **Tips**: Should capture the scene's core dramatic function

**`time`**: When scene occurs

- **Purpose**: Temporal context within story timeline
- **Usage**: Format like "sunday_10:05am" or "later_that_night"
- **Tips**: Maintains chapter pacing and story continuity

**`place`**: Where scene takes place

- **Purpose**: Physical setting for scene action
- **Usage**: Specific locations like "elena_apartment_hallway"
- **Tips**: Setting should support scene's dramatic purpose

**`pov`**: Point of view character

- **Purpose**: Determines whose perspective readers experience
- **Usage**: Character name/abbreviation
- **Tips**: Usually consistent within chapter unless POV shifts

### 8.2. Character Information

**`characters`**: Characters present in scene and their emotional states

- **Purpose**: Tracks who's in scene and how they feel entering/exiting
- **Usage**: Character objects with emotional state info
- **Structure**: `character_name: { enters: "state", exits: "state" }`
- **Tips**: Focus on POV character primarily, others as needed

**Character Sub-fields:**

- **`enters`**: Character's emotional/mental state entering scene
- **`exits`**: Character's state after scene events
- **`status`**: For non-POV characters (present, absent, referenced)
- **`evidence`**: Physical traces of absent characters

### 8.3. Core Dramatic Movement

**`goal`**: What POV character wants in this scene

- **Purpose**: Drives scene action and reader engagement
- **Usage**: Simple, clear objective character pursues
- **Tips**: Should be achievable within scene scope

**`obstacle`**: What prevents goal achievement

- **Purpose**: Creates scene conflict and tension
- **Usage**: Specific barrier character must overcome
- **Tips**: Can be external (events) or internal (emotions)

**`outcome`**: How scene conflict resolves

- **Purpose**: Shows scene's result and character's new situation
- **Usage**: Clear statement of what character achieves or loses
- **Tips**: Should advance story while changing character state

### 8.4. Scene Structure and Flow

**`beats`**: Key events that must happen in scene

- **Purpose**: Ensures essential plot/character moments are included
- **Usage**: Array of specific actions or events in sequence
- **Tips**: Keep to 3-5 major beats to maintain focus

**`shift`**: Emotional or situational change through scene

- **Purpose**: Tracks scene's dramatic impact on character
- **Usage**: Format like "routine_expectation → urgent_fear"
- **Tips**: Every scene should create some meaningful change

**`leads_to`**: Connection to next scene or chapter element

- **Purpose**: Maintains narrative flow and chapter coherence
- **Usage**: Brief description of what naturally follows
- **Tips**: Should emerge from this scene's outcome

### 8.5. Visual Scene Elements

**`image_prompt`**: Detailed visual description for scene visualization

- **Purpose**: Provides comprehensive visual context for scene setting, characters, and atmosphere
- **Usage**: Descriptive text suitable for AI image generation or writer visualization
- **Structure**: Single detailed paragraph covering setting, characters, lighting, mood, and genre atmosphere
- **Tips**: Include specific details about character appearance, environmental elements, lighting conditions, and emotional tone

**Image Prompt Guidelines:**

- **Setting Details**: Physical environment, lighting conditions, time of day
- **Character Appearance**: Age, clothing, posture, facial expressions, positioning
- **Atmospheric Elements**: Mood, genre feel, emotional undertone
- **Visual Continuity**: Consistent with established story world and character descriptions
- **Practical Focus**: Actionable details that help visualize the scene's dramatic moment

### 8.6. Usage Guidelines for Scene Planning

**Essential Scene Planning Steps:**

1. Define scene's purpose within chapter
2. Identify characters present and their emotional states
3. Establish clear goal and obstacle
4. List key beats that must happen
5. Determine emotional/situational shift
6. Connect to chapter flow
7. Create visual description for scene atmosphere and key elements

**Scene Success Indicators:**

- Scene has clear dramatic purpose within chapter
- Characters have distinct emotional states entering/exiting
- Goal and obstacle create meaningful conflict
- Key beats advance chapter progression
- Scene creates change that affects story
- Connection to next element is logical
- Visual description enhances scene atmosphere and aids visualization

**Common Scene Planning Mistakes:**

- No clear purpose (scene doesn't advance chapter)
- Unclear character emotional states
- Weak or missing goal/obstacle
- Too many beats (scene becomes cluttered)
- No meaningful change occurs
- Poor connection to chapter flow
- Vague or generic visual descriptions that don't capture scene specifics

This simplified approach ensures scenes serve their function as chapter components while providing LLMs with clear, actionable information for effective scene writing.
