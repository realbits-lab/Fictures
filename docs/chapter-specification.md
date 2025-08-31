# Chapter Specification (Level 3: Individual Chapters)

## 1. Definition and Core Purpose

A **chapter** is the primary unit of narrative delivery in serialized fiction. Its function is twofold and non-negotiable, governed by **The Dual Mandate**:

1.  **Episodic Satisfaction:** It must function as a self-contained narrative episode, providing the reader with a complete and satisfying emotional and structural arc (a clear beginning, middle, and end). The reader must feel their time was well-spent _within this single chapter_.
2.  **Serial Momentum:** It must compel the reader forward, ending in a way that creates an urgent need to know what happens next. It achieves this by resolving a chapter-specific question while simultaneously introducing a larger, more complex one.

## 2. Foundational Principles for Generation

Before constructing the chapter, internalize these guiding principles. They are the logic behind the structure.

- **The Narrative Arc Principle:** Every chapter is a microcosm of a full story. It must present a goal or status quo, introduce conflict that complicates it, build to a climax, and conclude with a changed state. This mini-arc is what provides reader satisfaction.
- **The Tension Engine Principle:** Tension is the fuel of narrative. A chapter must never be devoid of it. Every scene, every line of dialogue, must contain a layer of tension—be it **external** (physical threats), **internal** (emotional turmoil, doubt), **interpersonal** (conflict between characters), or **atmospheric** (a sense of dread or unease). Tension must escalate throughout the chapter.
- **The Cause-and-Effect Principle:** Events must be causally linked. The middle of the chapter exists because of the beginning; the end exists because of the middle. The fundamental building block is the **Scene-Sequel Structure**:
  - **Scene:** A character has a **Goal**, faces **Conflict**, and meets a **Setback/Disaster**. (Action)
  - **Sequel:** The character has a **Reaction** to the setback, faces a **Dilemma**, and makes a **Decision**. (Reaction/Planning)
    A strong chapter often contains one or more of these cycles.

## 3. The Three-Act Chapter Architecture

This is the non-negotiable blueprint for chapter construction. Every chapter must follow this internal micro-structure to ensure it fulfills The Dual Mandate.

### Act 1: The Setup (~20% of Chapter)

The purpose of this act is to hook the reader and establish the chapter's central conflict.

1.  **The Re-engagement Hook (First Line):** Must create immediate curiosity and intrigue.
2.  **The Orientation (First Paragraph):** Must ground the reader in **Time**, **Place**, and **Perspective (POV)**. It should subtly reference the outcome of the previous chapter without overt exposition.
3.  **The Chapter's Inciting Incident:** Introduce the specific goal, question, or problem that this chapter will revolve around. This is the event that disrupts the character's state at the beginning of the chapter.

### Act 2: The Confrontation (~60% of Chapter)

This is the core of the chapter where the conflict unfolds and escalates.

1.  **Rising Action & Progressive Complications:** The character pursues their goal but faces a series of obstacles. Each obstacle should be more difficult than the last. Do not allow the character to achieve their goal easily.
2.  **The Midpoint Shift:** Roughly halfway through the chapter, a significant event must occur. This is often a revelation, a major setback, or a "point of no return" that changes the stakes and forces the character to react in a new way. The situation should feel worse after the midpoint than before it.

### Act 3: The Resolution & Setup (~20% of Chapter)

The purpose of this act is to resolve the chapter's immediate conflict while setting up the hook for the next.

1.  **The Chapter Climax:** The character confronts the chapter's main obstacle, leading to the highest point of tension _within this chapter_.
2.  **Partial Resolution:** The central question of _this chapter_ is answered. The character succeeds or fails in their immediate goal. This provides the "Episodic Satisfaction."
3.  **The Forward Hook (Final Lines):** The resolution of the climax immediately creates a new, more complicated problem or question. This provides the "Serial Momentum." This must be a natural consequence of the chapter's events, not a random addition.

#### Types of Forward Hooks (Vary for Effect)

- **The Revelation:** New information re-contextualizes everything.
- **The Decision Point:** A character must make an impossible choice.
- **The Consequence:** The bill for a past action comes due.
- **The Looming Threat:** A new danger is revealed or an old one arrives.
- **The Emotional Cliffhanger:** A powerful emotional moment is left unresolved (a confession interrupted, a betrayal discovered).

## 4. Genre-Specific Adaptations

The Three-Act Architecture is universal, but its implementation varies by genre.

- **Thriller/Mystery:** Prioritize breakneck pacing. Chapters are often short (1.5k-3k words). Act 3 Forward Hooks are almost always high-stakes revelations or direct threats. Use alternating POVs to build suspense.
- **Romance:** Pacing is tied to the emotional arc. Chapters focus on relationship milestones. Tension is primarily interpersonal. Forward Hooks are emotional cliffhangers (a misunderstanding, an interrupted kiss, a vulnerable confession). Alternating POVs between the leads is standard.
- **Fantasy/Sci-Fi:** Chapters are often longer (4k-6k words) to accommodate world-building. Balance exposition with action. A chapter might focus on one character's plotline within a multi-POV narrative. Forward Hooks often involve plot twists, political intrigue, or the introduction of a new fantastical element.
- **Literary Fiction:** Pacing is introspective. The structure is driven by internal character change. Tension is often psychological or thematic. Forward Hooks are subtle—a profound realization, an unresolved moral question, or a subtle shift in a relationship's dynamic.

## 5. YAML Planning Schema for LLM Chapter Generation

This YAML structure is the definitive input required to generate a high-quality chapter. It is designed to be comprehensive, ensuring all principles and architectural elements are considered before writing begins.

```yaml
# ============================================
# CHAPTER SPECIFICATION - COMPACT FORMAT
# ============================================

chapter:
  chap: 1
  title: "Missing"
  pov: "maya"
  words: 3500

  # Universal pattern: goal → conflict → outcome
  goal: "Normal coffee date with Elena"
  conflict: "Elena missing, signs of supernatural danger"
  outcome: "Finds journal, realizes she's also a target"

  # Three-act structure (essential beats only)
  acts:
    setup: # Act 1 (20%)
      hook_in: "Door unlocked, coffee warm, Elena gone"
      orient: "Weekly sister ritual, Maya's skeptical nature"
      incident: "Overturned chair, shattered mug - signs of struggle"

    confrontation: # Act 2 (60%)
      rising: "Police dismissive, Maya searches alone"
      midpoint: "Discovers Elena's hidden research journal"
      complicate: "Journal reveals supernatural conspiracy, 'The Shepherd'"

    resolution: # Act 3 (20%)
      climax: "Final journal entry: 'He looks for the mark'"
      resolve: "Maya realizes Elena was in supernatural danger"
      hook_out: "Knock at door, Maya has the 'mark' mentioned"

  # Character development
  chars:
    maya:
      start: "casual_anticipation"
      arc: "concern → panic → targeted_fear"
      end: "trapped_resolve"
      motivation: "protect_elena"
      growth: "skeptic → reluctant_believer"

  # Tension layers
  tension:
    external: "signs_struggle, mysterious_knocker"
    internal: "maya_panic, guilt_unaware"
    interpersonal: "dismissive_police"
    atmospheric: "journal_warnings"
    peak: "door_knock_connects_abstract_threat_to_immediate"

  # Dual mandate fulfillment
  mandate:
    episodic:
      arc: "search_for_elena → journal_discovery → question_answered"
      payoff: "casual_concern → urgent_fear"
      answered: "What happened to Elena? Supernatural research gone wrong"
    serial:
      complication: "The Shepherd threat established"
      stakes: "Maya also targeted due to mark"
      compulsion: "door_knock_immediate_danger"

  # Forward hook architecture
  hook:
    type: "compound" # revelation + threat + emotional
    reveal: "Maya bears the mark from journal warning"
    threat: "Knock suggests Shepherd found Maya"
    emotion: "protective_instincts vs newfound_vulnerability"

  # Continuity
  continuity:
    foreshadow: ["the_shepherd", "mark_significance", "elena_research"]
    theories: ["shepherd_identity", "mark_meaning", "journal_locations"]

  # Genre essentials
  genre: "urban_fantasy"
  pacing: "moderate_build_sharp_escalation"
  exposition: "discovery_not_explanation"
```
