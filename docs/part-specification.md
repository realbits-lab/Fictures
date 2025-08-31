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

## 5. YAML Data Structure Example for Part Planning

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
