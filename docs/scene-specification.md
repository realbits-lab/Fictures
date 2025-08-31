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

## 6. YAML Data Structure Example for Scene Planning

This YAML structure provides a comprehensive framework for planning and generating a complete narrative unit, integrating all the principles outlined above. It is designed to give an LLM all the necessary components to construct a rich, purposeful, and structurally sound scene.

```yaml
# ============================================
# SCENE SPECIFICATION - COMPACT FORMAT
# ============================================

scene:
  scene: 1
  title: "The Unlocked Door"
  time: "sunday_10:05am"
  place: "elena_apartment_hallway"
  pov: "maya"

  # Universal pattern: goal → conflict → outcome
  goal: "Normal coffee date with Elena"
  conflict: "Door unlocked, apartment silent, signs of struggle"
  outcome: "Finds evidence, realizes Elena in danger"

  # Core scene mechanics
  turn: "Discovers overturned coffee table and broken mug"
  value: "routine(+) → fear(--)"
  change: "mundane_expectation → supernatural_threat_awareness"

  # Scene-Sequel structure
  scene_unit: # The action
    goal_type: "possession" # wants normal sister time
    obstacles:
      ["no_answer", "unlocked_door", "eerie_silence", "struggle_evidence"]
    escalation: "annoyance → unease → fear → danger_confirmed"
    disaster: "no_and_furthermore" # fails + evidence of danger

  sequel_unit: # The reaction
    reaction:
      {
        feel: "cold_dread",
        reflex: "hands_to_mouth",
        action: "scan_room",
        speech: "Oh_god_Elena",
      }
    dilemma: ["call_911", "call_parents", "search_clues_first"]
    decision: "Search for journal before calling police"

  # Line-level execution essentials
  sensory:
    sight: "dust_motes, coffee_splash, broken_mug_edges"
    sound: "apartment_silence, heart_thumping, distant_traffic"
    touch: "cold_doorknob, hand_tremor"
    smell: "elena_perfume, stale_coffee"

  # MRU examples for writing
  mru:
    [
      "knocked_third_time → irritation → sighed_phone_out",
      "doorknob_turned → cold_stomach_knot → froze_hand_on_knob",
    ]

  # Narrative function
  function:
    purpose: "story_inciting_incident"
    connects: "journal_search_goal_next_scene"
    builds: "journal_discovery_cliffhanger"
    questions: ["what_happened_elena", "how_long_missing", "journal_contents"]

  # Scene vs summary application
  render:
    scene_why: "emotional_impact_requires_realtime"
    key_moments:
      ["door_unlock", "evidence_discovery", "emotional_reaction", "decision"]
    summary_elements: ["sister_background", "coffee_routine", "work_life"]

  # Story advancement verification
  advance:
    opening: "expects_normal_coffee"
    closing: "realizes_supernatural_danger"
    catalyst: "evidence_discovery"
    plot: "launches_main_story_establishes_conflict"
```

## 7. YAML Field Documentation

This comprehensive guide explains each field in the compact scene specification YAML format, detailing how to plan and construct individual narrative units that serve as the fundamental building blocks of dramatic fiction.

### 7.1. Scene Identification

**`scene`**: Scene number within chapter or story sequence
- **Purpose**: Establishes position in narrative flow and structural hierarchy
- **Usage**: Sequential numbering that tracks scene order within chapters
- **Tips**: Consider both dramatic function and reader experience pacing

**`title`**: Descriptive scene title for planning reference
- **Purpose**: Quick identification and thematic focus during planning
- **Usage**: Should capture scene's essential dramatic function or key moment
- **Tips**: Useful for tracking and referencing during revision process

**`time`**: When scene occurs (using underscore format)
- **Purpose**: Establishes temporal context and story timeline placement
- **Usage**: Format like "sunday_10:05am" or "three_days_later"
- **Tips**: Maintains story timeline consistency and pacing awareness

**`place`**: Where scene takes place (using underscore format)
- **Purpose**: Establishes spatial context and environmental constraints
- **Usage**: Specific locations like "elena_apartment_hallway" or "downtown_coffee_shop"
- **Tips**: Location choice should support scene's dramatic function

**`pov`**: Point of view character for this scene
- **Purpose**: Determines narrative perspective and information limitations
- **Usage**: Consistent character abbreviations across planning documents
- **Tips**: POV choice affects what can be revealed and how tension builds

### 7.2. Universal Pattern Fields (Scene-Level Drama)

**`goal`**: What the POV character wants to accomplish in this scene
- **Purpose**: Drives scene's dramatic engine and creates reader investment
- **Usage**: Must be specific, immediate, and achievable within scene scope
- **Tips**: Best goals have both external action and internal significance

**`conflict`**: Obstacles preventing goal achievement in this scene
- **Purpose**: Creates moment-to-moment tension and forces character choice
- **Usage**: Should escalate through scene, forcing character adaptation
- **Tips**: Most effective conflicts have multiple layers (external/internal)

**`outcome`**: How scene's central conflict resolves
- **Purpose**: Provides scene resolution while connecting to larger story
- **Usage**: Should change character's situation or understanding
- **Tips**: Must feel earned through character effort and struggle

### 7.3. Core Scene Mechanics

**`turn`**: Specific moment when scene's direction changes
- **Purpose**: Creates scene's dramatic peak and character realization point
- **Usage**: Precise description of the pivotal action or revelation
- **Tips**: Should be surprising yet inevitable given scene setup

**`value`**: Emotional/situational shift using charge notation
- **Purpose**: Tracks scene's fundamental change in character circumstances
- **Usage**: Format like "routine(+) → fear(--)" showing positive to negative shift
- **Tips**: All effective scenes must create meaningful value shifts

**`change`**: Overall transformation accomplished by this scene
- **Purpose**: Defines scene's contribution to larger story progression
- **Usage**: Describes shift in character understanding, situation, or capability
- **Tips**: Should connect to character's overall journey and growth needs

### 7.4. Scene-Sequel Structure

**`scene_unit`**: The action portion where character pursues goal
- **Purpose**: Creates forward momentum and dramatic tension
- **Usage**: Character has goal, faces obstacles, experiences setback
- **Structure**: Goal → Conflict → Disaster pattern

**Scene Unit Sub-fields:**
- **`goal_type`**: Category of goal character pursues ("possession", "relief", "information")
- **`obstacles`**: Array of specific barriers character must overcome
- **`escalation`**: Pattern of increasing difficulty through scene
- **`disaster`**: Type of negative outcome ("yes_but", "no_and_furthermore")

**`sequel_unit`**: The reaction portion where character processes and decides
- **Purpose**: Provides character development and transition to next scene
- **Usage**: Character reacts emotionally, faces dilemma, makes decision
- **Structure**: Reaction → Dilemma → Decision pattern

**Sequel Unit Sub-fields:**
- **`reaction`**: Character's immediate emotional/physical response to disaster
- **`dilemma`**: Array of difficult choices character must consider
- **`decision`**: What character chooses to do next (becomes next scene's goal)

### 7.5. Line-Level Execution Elements

**`sensory`**: Sensory details that bring scene to life
- **Purpose**: Creates immersive reading experience and emotional connection
- **Usage**: Specific details for each sense that support scene's mood/theme
- **Structure**: Individual fields for sight, sound, touch, smell, taste

**Sensory Sub-fields:**
- **`sight`**: Visual details that reinforce scene's emotional tone
- **`sound`**: Auditory elements that enhance atmosphere
- **`touch`**: Tactile sensations that ground reader in physical reality
- **`smell`**: Olfactory details that trigger memory and emotion
- **`taste`**: When relevant, taste elements that add realism

### 7.6. Motivation-Reaction Units (MRUs)

**`mru`**: Motivation-Reaction Unit examples for scene construction
- **Purpose**: Provides line-level writing guidance for realistic character behavior
- **Usage**: Array of "motivation → reaction" patterns showing cause-effect
- **Format**: "external_stimulus → internal_feeling → physical_response → conscious_action"
- **Tips**: Essential for creating believable, immersive prose at sentence level

### 7.7. Narrative Function Integration

**`function`**: Scene's role within larger story structure
- **Purpose**: Ensures scene serves story advancement, not just dramatic entertainment
- **Usage**: Defines how scene connects to chapter and story goals
- **Structure**: Purpose, connections, and story building elements

**Function Sub-fields:**
- **`purpose`**: Scene's specific job in story progression
- **`connects`**: How this scene links to next scene's goal
- **`builds`**: What larger story element this scene develops
- **`questions`**: Reader questions this scene raises or answers

### 7.8. Scene vs Summary Decision Making

**`render`**: Justification for writing this moment as scene vs summary
- **Purpose**: Validates dramatic choice to render moment in real-time
- **Usage**: Explains why this moment deserves scene treatment
- **Structure**: Reasoning and moment identification

**Render Sub-fields:**
- **`scene_why`**: Specific reason this moment needs real-time dramatic treatment
- **`key_moments`**: Essential beats that must be shown, not told
- **`summary_elements`**: Background information that can be compressed

### 7.9. Story Advancement Verification

**`advance`**: How scene moves overall story forward
- **Purpose**: Ensures scene contributes meaningfully to story progression
- **Usage**: Tracks character/plot advancement and story connection
- **Structure**: Before/after states and change catalyst

**Advancement Sub-fields:**
- **`opening`**: Character's state/situation entering scene
- **`closing`**: Character's state/situation after scene events
- **`catalyst`**: Specific event that creates the change
- **`plot`**: How scene advances overall plot progression

### 7.10. Field Usage Guidelines

**Scene Planning Sequence:**
1. Identify scene's story function and dramatic necessity
2. Define clear goal that character pursues actively
3. Plan obstacles that escalate toward scene climax
4. Design turning point that changes scene direction
5. Structure sequel reaction that transitions to next scene
6. Select sensory details that support emotional progression

**Scene Construction Validation:**
- Does scene create meaningful change in character's circumstances?
- Is character pursuing specific, immediate goal throughout?
- Do obstacles escalate, forcing character adaptation and growth?
- Is turning point surprising yet inevitable from scene setup?
- Does sequel provide appropriate reaction and transition time?
- Are MRU patterns realistic and immersive for reader?

**Common Scene Planning Errors:**
- No clear character goal (scene lacks dramatic engine)
- Static conflict (obstacles don't escalate or evolve)
- Missing turning point (scene lacks dramatic peak)
- Arbitrary outcome (resolution not earned through conflict)
- Weak sequel (insufficient processing of scene events)
- Irrelevant sensory details (atmosphere not supporting drama)

**Scene Success Indicators:**
- Character's situation clearly changes from beginning to end
- Goal pursuit creates escalating tension throughout
- Turning point emerges logically from established conflict
- Sequel provides emotional processing and logical transition
- Reader experiences both scene events and character interiority
- Scene advances story while being dramatically satisfying

**MRU Construction Guidelines:**
- External stimulus must be observable and specific
- Internal feeling should be immediate and involuntary
- Physical response must be believable reflex action
- Conscious action should be character's deliberate choice
- Sequence must follow natural psychological progression

This systematic approach ensures each scene functions as effective dramatic unit while advancing the larger narrative through proper cause-and-effect progression.
