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
