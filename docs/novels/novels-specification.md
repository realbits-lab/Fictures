# Novel Architecture Specification

## Overview

This document defines the **Hierarchical Narrative Schema (HNS)**, a four-level data architecture for serialized fiction. The schema enables systematic story planning, AI-assisted generation, and automated validation.

**Core Principle**: Story as structured data, enabling procedural generation and validation while preserving creative control.

---

## Architecture Hierarchy

```
Story (Level 1: Overall Narrative)
  ├── Parts (Level 2: Major Sections / Acts)
  │   ├── Chapters (Level 3: Reading Units)
  │   │   └── Scenes (Level 4: Individual Scenes)
  │   │
  ├── Characters (Cross-Level: Character Identity)
  └── Settings (Cross-Level: Location Context)
```

---

## Level 1: Story

**Definition**: The complete narrative at its most abstract level, containing the core conceptual DNA.

**Purpose**: Foundational input for entire generation process, encapsulating essential narrative elements.

### Core Fields

| Field               | Type      | Purpose                                                                      |
|---------------------|-----------|------------------------------------------------------------------------------|
| `story_id`          | UUID      | Unique identifier for database management                                    |
| `story_title`       | string    | Working or final title                                                       |
| `parts`             | string[]  | Array of part_ids (typically three acts)                                     |
| `characters`        | string[]  | Array of character_ids                                                       |
| `settings`          | string[]  | Array of setting_ids                                                         |
| `genre`             | string    | Single genre from predefined list (e.g., "Fantasy", "Science Fiction")       |
| `premise`           | string    | Single sentence (<20 words) encapsulating the complete novel                 |
| `dramatic_question` | string    | Central yes-or-no question driving narrative (answered in climax)            |
| `theme`             | string    | Central message guiding narrative decisions                                  |

### JSON Example

```json
{
  "story": {
    "story_id": "Kj3_xY9Qm2pL7",
    "story_title": "The Shadow Keeper",
    "parts": ["Xc9vB3nMk7L", "Qw5eR2tYu8I", "Zx1aS4dFg6H"],
    "characters": ["Hy8kL3mNp9Q", "Zx4vB7nWq2R", "Mj9pK5sXt6Y"],
    "settings": ["Bv7nM2kLp9X", "Ty6uI8oP3qW"],
    "genre": "Fantasy",
    "premise": "A photographer must master shadow magic to save her sister from a supernatural realm before power corrupts her",
    "dramatic_question": "Can Maya master shadow magic before power corrupts her?",
    "theme": "The conflict between power and responsibility"
  }
}
```

### Relationships

- **Story** → references **Parts** through `parts` array
- **Story** → references **Characters** through `characters` array
- **Story** → references **Settings** through `settings` array

---

## Level 2: Part

**Definition**: Major thematic or narrative divisions, typically mapping to three-act structure.

**Purpose**: Organize story into proven dramatic arcs with structural validation.

### Core Fields

| Field             | Type      | Purpose                                              |
|-------------------|-----------|------------------------------------------------------|
| `part_id`         | UUID      | Unique identifier                                    |
| `part_title`      | string    | Descriptive title (e.g., "Part I: Discovery")        |
| `chapters`        | string[]  | Ordered array of chapter_ids                         |
| `structural_role` | enum      | Maps to dramatic framework (e.g., "Act 1: Setup")    |
| `key_beats`       | string[]  | Crucial plot points for validation                   |
| `summary`         | string    | One-paragraph description of main movements          |

### Structural Roles & Key Beats

**Act 1: Setup**
- Key Beats: ["Exposition", "Inciting Incident", "Plot Point One"]
- Purpose: Introduce world, characters, launch story

**Act 2: Confrontation**
- Key Beats: ["Rising Action", "Midpoint", "Plot Point Two"]
- Purpose: Escalate complications, build to crisis

**Act 3: Resolution**
- Key Beats: ["Climax", "Falling Action", "Resolution"]
- Purpose: Resolve conflicts, complete arcs

### JSON Example

```json
{
  "part": {
    "part_id": "Xc9vB3nMk7L",
    "part_title": "Part I: Discovery",
    "chapters": ["Hg8jK4lZx2C", "Nm5bV7cXz9Q", "Ty3uI1oP6wE"],
    "structural_role": "Act 1: Setup",
    "key_beats": ["Exposition", "Inciting Incident", "Plot Point One"],
    "summary": "Dr. Maya Chen's ordinary life shatters when her sister Elena disappears, leaving behind evidence of supernatural research. Despite her skepticism, Maya discovers she has inherited shadow manipulation abilities and must accept training from the mysterious Marcus Webb to save her sister."
  }
}
```

### Relationships

- **Part** → belongs to **Story** through `story_id` reference
- **Part** → contains **Chapters** through `chapters` array

---

## Level 3: Chapter

**Definition**: Primary unit of reader consumption, balancing self-contained experience with larger narrative advancement.

**Purpose**: Create compelling reading sessions with deliberate pacing and reader retention mechanisms.

### Core Fields

| Field                   | Type     | Purpose                                                       |
|-------------------------|----------|---------------------------------------------------------------|
| `chapter_id`            | UUID     | Unique identifier                                             |
| `chapter_number`        | integer  | Sequential position in story                                  |
| `chapter_title`         | string   | Chapter title                                                 |
| `part_ref`              | UUID     | Reference to parent part                                      |
| `scenes`                | string[] | Ordered array of scene_ids                                    |
| `summary`               | string   | Detailed one-paragraph summary                                |
| `pacing_goal`           | enum     | Intended tempo: 'fast', 'medium', 'slow', 'reflective'        |
| `action_dialogue_ratio` | string   | Percentage ratio (e.g., "40:60")                              |
| `chapter_hook`          | object   | Structured end-of-chapter hook                                |

### Chapter Hook Structure

```json
"chapter_hook": {
  "type": "revelation | danger | decision | question | emotional_turning_point",
  "description": "Specific hook content",
  "urgency_level": "high | medium | low"
}
```

### JSON Example

```json
{
  "chapter": {
    "chapter_id": "Hg8jK4lZx2C",
    "chapter_number": 1,
    "chapter_title": "Missing",
    "part_ref": "Xc9vB3nMk7L",
    "scenes": ["Qp9wE3rTy5U", "Lk2mN8bVc7X", "Zx4aS6dFg1H"],
    "summary": "Maya arrives for her weekly coffee date with Elena only to find her sister's apartment unlocked and abandoned. Signs of struggle and a mysterious journal lead Maya to discover Elena was researching something called 'Shadow Keepers' before her disappearance.",
    "pacing_goal": "medium",
    "action_dialogue_ratio": "40:60",
    "chapter_hook": {
      "type": "revelation",
      "description": "Journal's last entry: 'They know about Maya. She has the mark too.'",
      "urgency_level": "high"
    }
  }
}
```

### Relationships

- **Chapter** → belongs to **Part** through `part_ref`
- **Chapter** → belongs to **Story** (inherited through Part)
- **Chapter** → contains **Scenes** through `scenes` array

---

## Level 4: Scene

**Definition**: The fundamental unit of change in narrative. Each scene creates meaningful change in a character's situation, externally or internally.

**Purpose**: Advance story through tangible change, following Scene-Sequel architecture.

### Core Principle: Scene-Sequel Model

**Scene (Action Unit):**
1. **Goal**: POV character enters with specific objective
2. **Conflict**: Obstacle preventing easy achievement
3. **Outcome**: Result as enum value

**Sequel (Reaction Unit):**
1. **Emotional Shift**: Tracked from beginning to end
2. **Processing**: Character internalizes outcome
3. **New Direction**: Decision becomes goal for next scene

### Core Fields

| Field              | Type     | Purpose                                                                      |
|--------------------|----------|------------------------------------------------------------------------------|
| `scene_id`         | UUID     | Unique identifier                                                            |
| `scene_number`     | integer  | Sequential number within chapter                                             |
| `scene_title`      | string   | Descriptive title capturing key event                                        |
| `chapter_ref`      | UUID     | Reference to parent chapter                                                  |
| `character_ids`    | string[] | All characters present or referenced                                         |
| `setting_id`       | UUID     | Link to specific location                                                    |
| `pov_character_id` | UUID     | Point-of-view character                                                      |
| `narrative_voice`  | enum     | Perspective (e.g., "third_person_limited")                                   |
| `summary`          | string   | One-sentence core action description                                         |
| `entry_hook`       | string   | Opening line for reader engagement                                           |
| `goal`             | string   | What POV character wants to achieve                                          |
| `conflict`         | string   | Obstacle preventing goal achievement                                         |
| `outcome`          | enum     | Result: 'success', 'failure', 'success_with_cost', 'failure_with_discovery'  |
| `emotional_shift`  | object   | Change in POV character's emotional state                                    |

### Outcome Enum Values

- **success**: Goal achieved as intended
- **failure**: Complete failure to achieve goal
- **success_with_cost**: Goal achieved with negative consequences
- **failure_with_discovery**: Failed but learned something important

### JSON Example

```json
{
  "scene": {
    "scene_id": "Qp9wE3rTy5U",
    "scene_number": 1,
    "scene_title": "The Empty Apartment",
    "chapter_ref": "Hg8jK4lZx2C",
    "character_ids": ["Hy8kL3mNp9Q", "Zx4vB7nWq2R"],
    "setting_id": "Rt5yU8iO9pA",
    "pov_character_id": "Hy8kL3mNp9Q",
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

### Relationships

- **Scene** → belongs to **Chapter** through `chapter_ref`
- **Scene** → references **Characters** through `character_ids` array
- **Scene** → references **Setting** through `setting_id`
- **Scene** → specifies POV through `pov_character_id`

---

## Cross-Level: Character

**Definition**: The fundamental human element driving narrative engagement, with comprehensive identity, psychology, and physical traits.

**Purpose**: Provide consistent character behavior across all narrative levels and enable AI-powered visual generation.

### Core Fields

| Field                  | Type   | Purpose                                                               |
|------------------------|--------|-----------------------------------------------------------------------|
| `character_id`         | UUID   | Unique identifier                                                     |
| `name`                 | string | Character's name                                                      |
| `visual_reference_id`  | string | Reference to visual asset for consistency                             |
| `role`                 | enum   | Narrative function: 'protagonist', 'antagonist', 'mentor', etc.      |
| `archetype`            | string | Character pattern (e.g., 'reluctant_hero', 'trickster')              |
| `summary`              | string | Brief description and story role                                      |
| `storyline`            | string | Character's complete narrative journey                                |
| `personality`          | object | Traits, Myers-Briggs, Enneagram                                       |
| `backstory`            | object | Childhood, education, career, relationships, trauma                   |
| `motivations`          | object | Primary goal, secondary goals, fears                                  |
| `voice`                | object | Speech patterns, vocabulary, verbal tics, internal voice              |
| `physical_description` | object | Detailed appearance for AI image generation                           |

### Physical Description Structure (Optimized for AI)

```json
"physical_description": {
  "age": 28,
  "ethnicity": "Chinese-American",
  "height": "5'6\"",
  "build": "Athletic, runner's physique",
  "hair_style_color": "Shoulder-length black hair, usually in ponytail",
  "eye_color": "Dark brown with gold flecks when using magic",
  "facial_features": "High cheekbones, expressive eyebrows, determined jaw",
  "distinguishing_marks": "Silver star birthmark on left wrist",
  "typical_attire": "Dark jeans, comfortable boots, photographer vest, camera"
}
```

### JSON Example

```json
{
  "character": {
    "character_id": "Hy8kL3mNp9Q",
    "name": "Maya Chen",
    "visual_reference_id": "Gh7jK9lMn2B.png",
    "role": "protagonist",
    "archetype": "reluctant_hero",
    "summary": "Investigative photographer searching for missing sister, reluctantly learning shadow magic",
    "storyline": "Maya must overcome skepticism to master dangerous magic and save Elena",
    "personality": {
      "traits": ["analytical", "protective", "skeptical", "determined"],
      "myers_briggs": "INTJ",
      "enneagram": "Type 5 - Investigator"
    },
    "backstory": {
      "childhood": "Raised by grandmother after parents died mysteriously",
      "education": "Journalism degree from UC Berkeley",
      "career": "Freelance investigative photographer",
      "relationships": "Close to sister Elena, few other connections",
      "trauma": "Parents' unexplained disappearance at age 10"
    },
    "motivations": {
      "primary": "Protect Elena at all costs",
      "secondary": "Understand truth behind parents' disappearance",
      "fear": "Losing control and hurting loved ones"
    },
    "voice": {
      "speech_pattern": "Precise, questioning, measured",
      "vocabulary": "Educated, journalistic, photography metaphors",
      "verbal_tics": ["'Let me see if I understand...'", "'Picture this...'"],
      "internal_voice": "Analytical with undercurrent of worry"
    },
    "physical_description": {
      "age": 28,
      "ethnicity": "Chinese-American",
      "height": "5'6\"",
      "build": "Athletic, runner's physique",
      "hair_style_color": "Shoulder-length black hair, usually in ponytail",
      "eye_color": "Dark brown with gold flecks when using magic",
      "facial_features": "High cheekbones, expressive eyebrows, determined jaw",
      "distinguishing_marks": "Silver star birthmark on left wrist",
      "typical_attire": "Dark jeans, comfortable boots, photographer vest, camera"
    }
  }
}
```

### Character Integration Patterns

**Cross-Level References:**
- Story object maintains array of all `character_ids`
- Scene objects track present characters through `character_ids` array
- Scenes specify POV through `pov_character_id` field
- Chapters inherit character continuity through their scenes

**Character Tracking:**
- Each scene explicitly lists all present/referenced characters
- POV character determines narrative voice and perspective
- Character arcs tracked through `emotional_shift` in scenes
- Motivations drive goal setting at scene level

---

## Cross-Level: Setting

**Definition**: Specific locations within the story world, defined through structured sensory and visual data.

**Purpose**: Enable consistent environmental description and AI-powered visualization across all scenes.

### Core Fields

| Field                 | Type     | Purpose                                                            |
|-----------------------|----------|--------------------------------------------------------------------|
| `setting_id`          | UUID     | Unique identifier                                                  |
| `name`                | string   | Location designation                                               |
| `description`         | string   | Comprehensive paragraph describing location                        |
| `mood`                | string   | Atmospheric quality (e.g., "oppressive and surreal")              |
| `architectural_style` | string   | Structural design language                                         |
| `sensory`             | object   | Arrays for five senses                                             |
| `visual_style`        | string   | Artistic direction for image generation                            |
| `visual_references`   | string[] | Style inspirations (e.g., ["HR Giger", "Silent Hill"])            |
| `color_palette`       | string[] | Dominant colors                                                    |

### Sensory Object Structure

```json
"sensory": {
  "sight": ["Visual description 1", "Visual description 2"],
  "sound": ["Auditory element 1", "Auditory element 2"],
  "smell": ["Olfactory detail 1", "Olfactory detail 2"],
  "touch": ["Tactile sensation 1", "Tactile sensation 2"],
  "taste": ["Flavor element 1"] // Optional
}
```

### JSON Example

```json
{
  "setting": {
    "setting_id": "Ty6uI8oP3qW",
    "name": "The Shadow Realm",
    "description": "A dark mirror dimension where shadows have substance and light is foreign. Architecture shifts based on inhabitants' fears, and time flows differently than in the material world.",
    "mood": "oppressive and surreal",
    "architectural_style": "Gothic mixed with non-Euclidean geometry",
    "sensory": {
      "sight": [
        "Inverted architecture defying gravity",
        "Shadows moving independently of sources",
        "Muted colors except for rare light sources"
      ],
      "sound": [
        "Whispers in unknown languages",
        "Echoes that precede their sources",
        "Absolute silence in light pools"
      ],
      "smell": ["Ozone and old paper", "Sweet decay beneath everything"],
      "touch": [
        "Surfaces that feel liquid but appear solid",
        "Cold that burns exposed skin",
        "Air thick like water"
      ],
      "taste": ["Metallic undertone to the air"]
    },
    "visual_style": "dark fantasy horror",
    "visual_references": ["HR Giger", "Silent Hill", "Inception folding city"],
    "color_palette": ["deep purples", "blacks", "silver highlights", "rare gold light"]
  }
}
```

### Setting Integration Patterns

**Cross-Level References:**
- Story object maintains array of all `setting_ids`
- Scene objects reference specific settings through `setting_id` field
- Multiple scenes can occur in same setting
- Settings enable consistent world-building across narrative

**Usage Patterns:**
- Characters interact with sensory elements during scenes
- Mood field influences pacing and tone decisions
- Visual fields ensure consistent imagery across chapters
- Architectural style maintains spatial coherence

---

## Architecture Principles

### 1. Hierarchical Containment

```
Story
  └─ contains Parts (via parts array)
      └─ contain Chapters (via chapters array)
          └─ contain Scenes (via scenes array)
```

Each level maintains ordered arrays of child IDs, enabling:
- Top-down planning
- Bottom-up validation
- Sequential narrative flow

### 2. Cross-Cutting Concerns

**Characters and Settings** exist at story level but are referenced at scene level:

```
Story
  ├─ characters array (all character_ids)
  └─ settings array (all setting_ids)

Scene
  ├─ character_ids (present in this scene)
  ├─ pov_character_id (POV for this scene)
  └─ setting_id (location for this scene)
```

This architecture enables:
- Character consistency across scenes
- Setting reuse without duplication
- Clear POV tracking
- Presence validation

### 3. Scene-Sequel Chain

Every scene follows **Goal → Conflict → Outcome → Emotional Shift** pattern:

```
Scene N:
  goal → conflict → outcome (failure_with_discovery)
  emotional_shift: hopeful → terrified

Scene N+1:
  goal (derived from Scene N outcome) → conflict → outcome
  emotional_shift: terrified → determined
```

This creates unbreakable cause-and-effect chains for narrative coherence.

### 4. Validation Points

**Story Level:**
- All referenced character_ids must exist in characters array
- All referenced setting_ids must exist in settings array
- All referenced part_ids must exist

**Part Level:**
- structural_role must map to recognized framework
- key_beats must include required beats for act type
- All chapter_ids must exist

**Chapter Level:**
- Must belong to valid part (part_ref exists)
- pacing_goal must be valid enum value
- chapter_hook must have valid type
- All scene_ids must exist

**Scene Level:**
- Must belong to valid chapter (chapter_ref exists)
- All character_ids must exist in story's characters array
- setting_id must exist in story's settings array
- pov_character_id must be in scene's character_ids
- outcome must be valid enum value

---

## Database Schema Alignment

This HNS architecture maps directly to the database schema in `src/lib/db/schema.ts`:

| HNS Entity | Database Table | Key Relations |
|------------|----------------|---------------|
| Story | `stories` | → parts, chapters, characters, settings |
| Part | `parts` | → story (via storyId), → chapters |
| Chapter | `chapters` | → story (via storyId), → part (via partId), → scenes |
| Scene | `scenes` | → chapter (via chapterId), includes characterIds, settingId arrays |
| Character | `characters` | → story (via storyId) |
| Setting | `settings` | → story (via storyId) |

**Key Database Features:**
- Cascading deletes maintain referential integrity
- JSON fields store complex nested objects (personality, backstory, sensory)
- Enums enforce valid values (status, pacing_goal, outcome)
- Image fields support both original URLs and optimized variants

---

## Generation Modes

### One-Shot Mode
Generate complete structure upfront (Story → Parts → Chapters → Scenes) before writing prose. Use when:
- Planning entire narrative before writing
- Ensuring complete story coherence
- Pre-planning all character arcs

### Serial Mode
Generate through Story → Parts → Characters → Settings, then create Chapters/Scenes iteratively. Use when:
- Writing web serial fiction
- Incorporating reader feedback
- Allowing organic story evolution

Both modes use the same architecture; only the generation timing differs.

---

## Conclusion

This Hierarchical Narrative Schema provides:

1. **Clear Data Model**: Four levels + cross-cutting entities
2. **Structured Relationships**: Explicit references between all entities
3. **Validation Foundation**: Fields designed for automated coherence checking
4. **AI Integration**: Structured data enables consistent AI generation
5. **Database Alignment**: Direct mapping to implementation schema

The architecture transforms storytelling into systematic, data-driven process while preserving creative control and narrative quality.
