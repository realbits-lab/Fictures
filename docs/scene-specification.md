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
```

## 7. YAML Field Documentation

This guide explains each field in the essential scene specification format, focusing on the minimum information needed for an LLM to write effective scene content within chapters.

### 7.1. Scene Identification and Context

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

### 7.2. Character Information

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

### 7.3. Core Dramatic Movement

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

### 7.4. Scene Structure and Flow

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

### 7.5. Usage Guidelines for Scene Planning

**Essential Scene Planning Steps:**

1. Define scene's purpose within chapter
2. Identify characters present and their emotional states
3. Establish clear goal and obstacle
4. List key beats that must happen
5. Determine emotional/situational shift
6. Connect to chapter flow

**Scene Success Indicators:**

- Scene has clear dramatic purpose within chapter
- Characters have distinct emotional states entering/exiting
- Goal and obstacle create meaningful conflict
- Key beats advance chapter progression
- Scene creates change that affects story
- Connection to next element is logical

**Common Scene Planning Mistakes:**

- No clear purpose (scene doesn't advance chapter)
- Unclear character emotional states
- Weak or missing goal/obstacle
- Too many beats (scene becomes cluttered)
- No meaningful change occurs
- Poor connection to chapter flow

This simplified approach ensures scenes serve their function as chapter components while providing LLMs with clear, actionable information for effective scene writing.
