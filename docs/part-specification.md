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
  title: string
  genre: string
  words: number
  question: string
  
  # Universal story pattern
  goal: string
  conflict: string
  outcome: string
  
  # Character foundations
  chars: object  # All story-level character definitions
  
  # Story structure and themes
  themes: array
  structure: object  # Contains type, parts, and distribution
  
  # Story-level parts with goals and conflicts
  parts: array  # Part assignments and goals for this specific part
  
  # Serial publication context
  serial: object  # Publication schedule and requirements
  
  # Reader engagement strategy
  hooks: object  # Overarching mysteries and engagement points
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

## 6. Output Data for Chapter Specification

The part specification provides the following output data structure for use as input by chapter specifications:

```yaml
# ============================================
# PART OUTPUT FOR CHAPTER SPECIFICATION INPUT
# ============================================

part_output:
  # Part context for chapters
  part_context:
    part: 1
    title: "Discovery"
    words: 20000
    function: "story_setup"
    
  # Inherited story context
  story_context:
    title: "The Shadow Keeper"
    genre: "urban fantasy"
    themes: ["responsibility_for_power", "love_vs_control", "inner_battles"]
    overall_goal: "Save Elena from Shadow Realm"
    overall_conflict: "Shadow magic corrupts those who use it"
    
  # Part-specific pattern
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
      
  # Chapter assignments and structure
  chapter_requirements:
    estimated_chapters: 5  # Based on 20000 words / 4000 words per chapter
    chapter_functions:
      - function: "part_opening"
        goal: "Establish Elena's disappearance"
        events: ["elena_disappearance"]
        
      - function: "rising_action" 
        goal: "Maya discovers supernatural evidence"
        events: ["journal_discovery", "photograph_evidence"]
        
      - function: "turning_point"
        goal: "Maya's powers manifest"
        events: ["shadow_manifestation", "reality_acceptance"]
        
      - function: "climax"
        goal: "Marcus introduces training"
        events: ["marcus_introduction", "training_offer"]
        
      - function: "part_transition"
        goal: "Commit to supernatural world"
        events: ["training_acceptance", "mentor_secret_hint"]
        
  # Thematic and emotional context for chapters
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

## 7. YAML Field Documentation

This comprehensive guide explains each field in the compact part specification YAML format, detailing how to plan and structure major story sections effectively.

### 6.1. Part Identification

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

### 6.2. Universal Pattern Fields (Part-Level Drama)

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

### 6.3. Driving Questions

**`questions`**: Central questions that drive reader engagement through this part
- **`primary`**: Main question this part exists to explore/answer
- **`secondary`**: Supporting question that adds depth and complexity
- **Purpose**: Maintains reader investment and provides structural focus
- **Usage**: Primary should be answerable within part; secondary may carry forward
- **Tips**: Questions should emerge from character needs and story conflicts

### 6.4. Character Development Architecture

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

### 6.5. Plot Architecture

**`plot`**: Story events and revelations specific to this part
- **`events`**: Major plot developments that occur in this part
- **`reveals`**: Important information discoveries that advance understanding
- **`escalation`**: How stakes/tension increase through this part
- **Purpose**: Tracks concrete story advancement within part structure
- **Usage**: Must build logically from previous parts while setting up future developments

### 6.6. Thematic Integration

**`themes`**: Thematic exploration within this part
- **`primary`**: Central theme this part develops
- **`elements`**: Specific thematic contrasts/tensions explored
- **`moments`**: Key scenes where themes become explicit
- **`symbols`**: Recurring images/objects that reinforce themes
- **Purpose**: Gives part depth beyond plot advancement
- **Usage**: Should emerge naturally from character choices and conflicts

### 6.7. Emotional Journey Management

**`emotion`**: Reader/character emotional progression through part
- **`start`**: Opening emotional state/tone
- **`progression`**: Emotional beats that escalate through part
- **`end`**: Closing emotional state that transitions to next part
- **Purpose**: Creates satisfying emotional arc within part structure
- **Usage**: Must feel earned and support overall story emotional trajectory

### 6.8. Part Ending Strategy

**`ending`**: How this part concludes and connects to story continuation
- **`resolution`**: What gets resolved/completed in this part
- **`setup`**: What gets established for future parts
- **`hooks`**: Specific elements that create anticipation for next part
- **`hook_out`**: Specific cliffhanger/transition that ends this part
- **Purpose**: Balances satisfaction with forward momentum
- **Usage**: Must reward reader investment while compelling continuation

### 6.9. Serial Structure Management

**`serial`**: Part's function within serialized publication model
- **`arc`**: Internal dramatic structure of this part
- **`climax_at`**: Where dramatic peak occurs within part (usually 80-90%)
- **`satisfaction`**: What readers gain from completing this part
- **`anticipation`**: What makes readers want to continue to next part
- **Purpose**: Optimizes part for serial reading experience
- **Usage**: Critical for maintaining reader engagement in serialized fiction

### 6.10. Reader Engagement Strategy

**`engagement`**: Community interaction planning for this part
- **`discussions`**: Topics likely to generate reader conversation
- **`speculation`**: Elements designed to spark reader theories
- **`debates`**: Character choices that create reader discussion
- **`feedback`**: Areas where reader input could influence future development
- **Purpose**: Builds active reader community around story
- **Usage**: Particularly important for serial fiction with reader interaction

### 6.11. Field Usage Guidelines

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
