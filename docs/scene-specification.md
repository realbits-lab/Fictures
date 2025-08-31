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
