# Toonplay Specification: Novel-to-Webtoon Adaptation

## Executive Summary

This document specifies the toonplay generation system for converting narrative prose into production-ready webtoon scripts. A **toonplay** is a specialized format designed for scroll-based visual media, optimized for vertical reading and AI-powered panel generation.

**Core Principle**: Adapt novels into visually-driven comics through strategic distillation, externalization, and webtoon-specific pacing techniques.

**Implementation Status**: ✅ Production-ready (November 2024)
- All 7 core components implemented and tested
- Database schema migrated (`comic_toonplay` JSONB field in scenes table)
- Schema validation tests: 8/8 passing
- Type-safe implementation with comprehensive documentation

**Related Documents:**
- 📋 **Development Guide** (`toonplay-development.md`): Implementation details, API specifications, and code architecture
- 🧪 **Evaluation Guide** (`toonplay-evaluation.md`): Quality metrics, testing strategies, and validation methods

---

## Part I: Core Concepts

### 1.1 Why "Toonplay" Not "Screenplay"

#### The Problem with "Screenplay"

A **screenplay** is designed for audiovisual media (film/TV) where:
- Time is measured in **minutes** (1 page ≈ 1 minute)
- Content is consumed **linearly** at a fixed pace
- Focus is on **sound + video** (dialogue, camera direction, sound effects)

When adapted to comics, screenplays cause **"page-bloat"**:
- 7 pages of screenplay → 17 pages of comic (240% increase)
- Pacing becomes unmanageable
- Narrative structure breaks down

#### Why "Toonplay"

A **toonplay** is designed for scroll-based visual media (webtoons/webcomics) where:
- Space is measured in **panels + scroll distance**
- Content is consumed at **reader-controlled pace** (thumb-flick speed)
- Focus is on **dialogue + images** (visual storytelling, minimal narration)

**Key Distinction**:
```
Screenplay = Sound + Video (temporal medium)
Toonplay  = Dialogue + Image (spatial medium)
```

This is why Fictures uses the term "toonplay" throughout the codebase.

---

### 1.2 The Toonplay Format

#### Core Purpose

A toonplay is a **production blueprint** that serves as:
- Instructions for the artist/AI pipeline
- Roadmap for the production team
- Quality control document for the adapter

**It is NOT**:
- A 1:1 translation of the source novel
- A creative writing exercise
- A standalone readable document

#### Essential Components

Every panel in a toonplay must specify:

| Component | Purpose | Format in Code |
|-----------|---------|----------------|
| **Panel Number** | Sequential identifier | `panel_number: number` |
| **Shot Type** | Camera framing | `shot_type: enum` (establishing_shot, wide_shot, medium_shot, close_up, etc.) |
| **Description** | Visual instructions for AI/artist | `description: string` (200-400 chars) |
| **Characters Visible** | Who appears in frame (character IDs from database) | `characters_visible: string[]` |
| **Character Poses** | Specific body language per character | `character_poses: { [character_id]: string }` |
| **Setting Focus** | Which part of setting is emphasized | `setting_focus: string` |
| **Lighting** | Mood and atmosphere | `lighting: string` |
| **Camera Angle** | Viewer's perspective | `camera_angle: string` |
| **Dialogue** | Character speech (max 150 chars per bubble) | `dialogue: Array<{character_id, text, tone}>` |
| **SFX** | Sound effects as visual text | `sfx: Array<{text, emphasis}>` |
| **Narrative** | Caption text (use sparingly <5%) | `narrative?: string` |
| **Mood** | Overall emotional tone | `mood: string` |

#### Implementation Reference

For the complete TypeScript schema definitions (`ComicPanelSpecSchema` and `ComicToonplaySchema`), see:
- **Development Guide**: `toonplay-development.md` § 1.3 TypeScript Schema Definitions
- **Code Location**: `src/lib/ai/toonplay-converter.ts`

The schemas implement all components listed above with Zod validation for type safety and runtime checking.

---

### 1.3 Content Proportion Rules

For optimal webtoon adaptation:

```
📊 Dialogue:           ~70% (Primary story driver)
📊 Visual Action:      ~30% (Shown in panels, not told)
📊 Narration:          <5%  (Time/location markers, essential tone)
📊 Internal Monologue: <10% (Strategic use at pivotal moments, 1-2 panels per scene)
```

**Important**: Narration and internal monologue serve different purposes:
- **Narration**: Scene-setting, time/location markers, atmospheric tone
- **Internal Monologue**: Character thoughts at critical moments, psychological depth

---

### 1.4 Strategic Internal Monologue Guidelines

#### When to Use Narration

Use caption narration strategically for:

1. **Time/Location Markers**: "Seoul. Three days later..."
2. **Essential Tone**: "The city was a cold machine..." (scene opener)
3. **Critical Information**: Facts that cannot be visualized or spoken
4. **Strategic Internal Monologue**: Character thoughts at pivotal moments (see guidelines below)

#### Strategic Internal Monologue Guidelines

**✅ ACCEPTABLE USE CASES** (Use sparingly, max 1-2 panels per scene):

| Scenario | Why It Works | Example |
|----------|--------------|---------|
| **Critical Decision Moments** | Reveals character's internal conflict at turning points | "Should I trust him? Every instinct screams no..." |
| **Psychological Thrillers** | Essential for genre conventions and tension building | "They don't know. They can't know what I did." |
| **Complex Internal Struggles** | When visual externalization would be unclear or ambiguous | "I've killed before. But never someone innocent." |
| **Dramatic Irony** | Reader knows character's thoughts while other characters don't | "She smiled at me. She has no idea I'm here to betray her." |
| **Philosophical Reflection** | Brief existential moments that define character themes | "In the end, are we defined by our choices or our regrets?" |

**❌ AVOID INTERNAL MONOLOGUE FOR** (Externalize instead):

| Bad Use | Better Alternative |
|---------|-------------------|
| Describing emotions | **Show**: Trembling hands, tears, clenched fists |
| Simple reactions | **Show**: Facial expressions, body language |
| Obvious thoughts | **Show**: Action that reveals the thought |
| World-building info dumps | **Show**: Visual symbols, brief dialogue |
| Redundant narration | **Show**: The image already conveys this |

**USAGE LIMITS**:
- **Target**: <10% of panels with internal monologue (1-2 panels max per 10-12 panel scene)
- **Length**: Max 2 sentences, <100 characters total
- **Principle**: "Externalize first, internalize only when essential"

#### General Narration Restrictions

❌ **NEVER use narration for**:
- Exposition → Show through dialogue or visual symbols
- Description → That's what the image is for
- Simple emotional states → Show through facial expressions and body language

---

### 1.5 Pacing Through Space

**Core Principle**: Space = Time in vertical scroll

```
More space between panels = Longer perceived moment
Less space between panels  = Faster perceived moment
```

**Example: Slow Moment (Romantic Tension)**
```typescript
{
  panels: [
    { panel_number: 1, description: "CLOSE UP on his eyes, wide", ...},
    // [SCRIPT INDICATES LARGE VERTICAL GAP]
    { panel_number: 2, description: "CLOSE UP on her hand reaching out, trembling", ...},
    // [SCRIPT INDICATES LARGE VERTICAL GAP]
    { panel_number: 3, description: "EXTREME CLOSE UP on their fingers almost touching", ...}
  ]
}
```
Result: Reader scrolls slowly, stretching one second into an emotional beat.

**Example: Fast Moment (Action Sequence)**
```typescript
{
  panels: [
    { panel_number: 1, description: "WIDE SHOT. He throws the punch", sfx: [{text: "WHAM", emphasis: "dramatic"}]},
    { panel_number: 2, description: "CLOSE UP. Villain's jaw", sfx: [{text: "CRACK", emphasis: "large"}]},
    { panel_number: 3, description: "WIDE SHOT. Villain flies back into wall", ...}
  ]
}
```
Result: Three panels stacked closely = thumb-flick covers all in one instant = speed.

---

## Part II: Visual Grammar for AI Image Generation

### 2.1 The Prompt Structure

Every panel description in Fictures follows this layered pattern:

```
[STYLE] + [SUBJECT & TRAITS] + [ACTION & POSE] + [EMOTION] + [SETTING] + [VISUAL GRAMMAR]
```

**Example from `buildPanelImagePrompt()` in comic-panel-generator.ts**:
```typescript
const prompt = `Professional ${genre} comic panel, ${shotType}, ${cameraAngle}.

SCENE: ${settingFocus}. ${settingAtmosphere}.

CHARACTERS: ${characterPrompts}
// characterPrompts built from database: characters.physical_description
// Format: age + appearance + distinctiveFeatures + style
// Example: "20-year-old male hunter, short black hair with glowing blue eyes, wearing a black trench coat"

LIGHTING: ${lighting}

ACTION: ${description}

MOOD: ${mood}

COMPOSITION RULES FOR 9:16 PORTRAIT FORMAT (928×1664):
- Vertical webtoon composition - taller than wide
- Frame composition: Utilize vertical space for scroll-based storytelling
- For establishing shots: Show expansive height with depth layers
- For medium shots: Position characters with vertical balance
- For close-ups: Frame character detail with vertical flow

VISUAL STYLE:
- Clean comic linework, vibrant colors, semi-realistic proportions
- Professional ${genre} comic art style
- Similar to Naver COMIC/Webtoon quality

CRITICAL CHARACTER CONSISTENCY:
Maintain exact character appearances from database - ${keyTraits}
// keyTraits sourced from characters.physical_description (age, appearance, distinctiveFeatures, style)
`;
```

---

### 2.2 Visual Grammar Lexicon

This table provides the **technical cinematography commands** used in panel descriptions to control narrative and emotional impact:

| Prompt Command | Narrative / Emotional Effect | Use in Toonplay |
|----------------|------------------------------|-----------------|
| **Low-Angle Shot / Hero Shot** | Makes subject powerful, imposing, dominant, threatening | `camera_angle: "low angle"` |
| **High-Angle View / Bird's-Eye** | Makes subject weak, vulnerable, small, distant | `camera_angle: "high angle"` or "bird's eye" |
| **Close-Up Portrait** | Captures emotion, creates intimacy, builds tension | `shot_type: "close_up"` |
| **Extreme Close-Up** | Focuses on tiny details (eyes, hands), intense emotion | `shot_type: "extreme_close_up"` |
| **Extreme Wide Shot** | Establishes location, emphasizes isolation | `shot_type: "establishing_shot"` |
| **Medium Shot** | Main storytelling, conversations, character interactions | `shot_type: "medium_shot"` |
| **Over-Shoulder** | Conversation, two-person scenes, POV | `shot_type: "over_shoulder"` |
| **Dutch Angle** | Creates unease, tension, disorientation | `shot_type: "dutch_angle"` |
| **Rim Lighting / Cool Edge** | Separates subject from background, creates halo/isolation | `lighting: "cool rim from hallway"` |
| **Chiaroscuro / Shadow Play** | High contrast, drama, mystery, moral ambiguity | `lighting: "harsh overhead fluorescent creating shadows"` |
| **Soft Window Light** | Calm, neutral, natural, melancholic | `lighting: "diffused natural light"` |
| **Single Strong Source** | Sharp contrast, tension, cyberpunk/noir feel | `lighting: "strong side lighting"` |

---

### 2.3 Character Consistency Rules

**CRITICAL**: For multi-panel stories, character traits must be **identical** across all prompts to prevent visual drift.

#### Database-Driven Character Descriptions

All character visual descriptions MUST be sourced from the `characters` table in the database:

```typescript
// Database Schema: characters table
{
  id: string;
  name: string;
  physical_description: {
    age: string;              // "mid-30s", "elderly", "young adult", "20 years old"
    appearance: string;       // Overall physical look
    distinctiveFeatures: string;  // Memorable visual details
    style: string;            // How they dress/present themselves
  }
}
```

**Character Prompt Generation** (`buildPanelCharacterPrompts()` function):

The function constructs consistent character descriptions by combining fields from `physical_description`:

```typescript
// Example: Constructing character prompt from database
const character = await db.characters.findUnique({ where: { id: characterId } });
const { age, appearance, distinctiveFeatures, style } = character.physical_description;

// Build consistent prompt string
const characterPrompt = `${age} ${appearance}, ${distinctiveFeatures}, ${style}`;
// Result: "20-year-old male hunter, short black hair with glowing blue eyes, wearing a black trench coat"
```

✅ **GOOD** (Database-Driven Consistency):
```typescript
// Panel 1, 2, 3, etc. - ALL panels use the EXACT same prompt from database
characterPrompt = buildCharacterPrompt(character.physical_description);
// "A 20-year-old male hunter, short black hair, glowing blue eyes, wearing a black trench coat"

// This EXACT string is used in every panel where this character appears
```

❌ **BAD** (Manual/Inconsistent - causes visual drift):
```typescript
Panel 1: "young man in a jacket"  // Missing key traits
Panel 2: "male hunter in a coat"  // Different phrasing
Panel 3: "guy with dark hair wearing black"  // Lost distinctive features
// Different words = AI generates different-looking characters
```

**Implementation Requirements**:
1. **ALWAYS** fetch character data from `characters` table before generating comic panels
2. **NEVER** manually write character descriptions - use database `physical_description` field
3. **Construct prompts** by combining: `age + appearance + distinctiveFeatures + style`
4. **Reuse exact string** across all panels featuring that character
5. **Cache** character prompts at scene level to avoid repeated database queries

This is handled automatically in `buildPanelCharacterPrompts()` function in `comic-panel-generator.ts`.

---

## Part III: Adaptation Principles

### 3.1 The Core Philosophy: Distill, Don't Duplicate

**Key Insight**: The best adaptation is NOT the most faithful one.

The adapter's job is to:
1. ✅ **Identify** the "soul" of the source material (core themes, central plot, essential characters)
2. ✅ **Distill** the essence into visual moments
3. ✅ **Discard** subplots, exposition, internal monologues that don't translate
4. ❌ **NOT** preserve every line, every character, every scene

---

### 3.2 The "Show, Don't Tell" Imperative

**The #1 Mistake**: Relying on narration to explain what's happening.

**Core Principle**: "Externalize first, internalize only when essential"

**Solution**: Externalize the internal through:

| Internal Element | External Visualization | When Internal Monologue IS Acceptable |
|------------------|------------------------|--------------------------------------|
| **Simple Internal Monologue** ("I'm so nervous...") | Physical action: character bites lip, hands trembling | ❌ Never - Too simple, externalize it |
| **Complex Internal Conflict** ("Should I save him or let him die?") | Silent panels showing character's hesitation, conflicted expression | ✅ Acceptable at critical decision moments |
| **Backstory** (long exposition) | Quick 2-3 panel flashback, stylized | ❌ Never - Show visually instead |
| **Character Motivation** (paragraph of angst) | Silent panels of triggering memory at moment of decision | ✅ Acceptable for 1-2 sentence philosophical reflection |
| **Emotional State** (basic feelings) | Dramatic facial expressions, body language, symbolic action | ❌ Never - Show through visuals |
| **Psychological State** (complex mental struggle) | Combine visuals with brief internal monologue | ✅ Acceptable in psychological thrillers, max 2 panels |
| **World-Building** (info dump) | Visual symbols, environmental storytelling, brief dialogue | ❌ Never - Show through environment |

**When Internal Monologue Works**:
- **Genre-appropriate**: Psychological thrillers, mystery, philosophical stories
- **Strategic placement**: 1-2 panels per scene maximum (<10% of total panels)
- **Critical moments**: Decision points, dramatic irony, existential reflection
- **Brief and impactful**: Max 2 sentences, <100 characters

---

### 3.3 Case Study: Solo Leveling Adaptation

**Novel Chapter 1**:
- Heavy internal monologue about hunter system
- Sung Jin-Woo has healing abilities (useful but weak)
- Vote to enter dungeon is tied, he decides
- Dense world-building exposition

**Webtoon Episode 1 (Adapted)**:
- Opens with S-Rank hunters fighting (shows power fantasy immediately)
- Removes SJW's healing → makes him purely a liability → emphasizes weakness
- Vote scene: replaces internal monologue with 3 silent flashback panels (sick mother, sister)
- Ends on cliffhanger: statue eyes glow

**Why This Works**:
- ✅ "Shows" weakness through visual contrast (S-Rank vs. E-Rank)
- ✅ Externalizes motivation (family) at exact moment of decision
- ✅ Hooks reader in 3 episodes (webtoon platform requirement)
- ✅ Preserves the "soul" (power fantasy) while sacrificing fidelity

**Result**: More dramatic, faster-paced, better suited to vertical scroll.

---

### 3.4 Case Study: Strategic Internal Monologue in Webtoons

**Successful Examples of Internal Monologue Usage**

#### Example 1: Psychological Thriller - "Killing Stalking"

**Usage Pattern**: Heavy internal monologue (~15-20% of panels) - Genre-appropriate for psychological horror

**Why It Works**:
- ✅ **Genre Convention**: Psychological thrillers demand access to character's disturbed mental state
- ✅ **Unreliable Narrator**: Internal monologue creates dramatic irony (reader knows truth, character doesn't)
- ✅ **Critical Information**: Character's twisted reasoning cannot be shown visually alone

**Example Panel**:
```
[Visual: Character smiling at victim]
Internal Monologue: "He said he loved me. But I know what love really means now."
```

#### Example 2: Action Fantasy - "Solo Leveling"

**Usage Pattern**: Minimal internal monologue (~5% of panels) - Used sparingly for critical decisions

**Why It Works**:
- ✅ **Decision Moments**: "Should I use this skill now? No... I need to save it for the boss."
- ✅ **System Interface**: Internal monologue integrates with game UI elements
- ✅ **Strategic Thinking**: Brief tactical thoughts that enhance action without slowing it

**Bad Alternative Would Be**:
```
❌ Narrator: "Sung Jin-Woo was nervous."
✅ Internal Monologue: "My hands are shaking. But I can't let them see."
✅ Visual Alone: Panel showing trembling hands, confident expression
```

#### Example 3: Romance Drama - "True Beauty"

**Usage Pattern**: Rare internal monologue (~2-3% of panels) - Almost entirely externalized

**Why It Works**:
- ✅ **Reserved for Pivotal Moments**: "Should I tell him the truth about my face?"
- ✅ **Everything Else Shown**: Embarrassment (blushing), anxiety (nervous gestures), attraction (lingering glances)
- ✅ **Genre Fit**: Romance relies on visual chemistry and dialogue, not internal angst

**Principle Illustrated**:
If a romance webtoon can tell compelling stories with <5% internal monologue, most genres can too.

#### Example 4: Mystery Thriller - "Bastard"

**Usage Pattern**: Moderate internal monologue (~8-10% of panels) - Strategic use for dramatic irony

**Why It Works**:
- ✅ **Dramatic Irony**: Reader knows protagonist's dark thoughts while other characters don't
- ✅ **Moral Conflict**: "I want to save her. But that would mean betraying him."
- ✅ **Tension Building**: Internal countdown or planning that viewers see but characters don't

**Key Technique**:
```
Panel 1: [Visual: Father and son at dinner, smiling]
Internal Monologue: "He's going to kill her tonight. I have to stop him."
Panel 2: [Visual: Son's hands gripping knife under table]
Dialogue: "Dad, the food is delicious."
```

This creates maximum tension with minimal words.

#### Guideline Summary from Real Webtoons

| Genre | Internal Monologue % | When to Use | When NOT to Use |
|-------|---------------------|-------------|-----------------|
| **Psychological Thriller** | 15-20% | Character's disturbed mental state, unreliable narration | Simple emotional reactions |
| **Action/Fantasy** | 3-5% | Critical tactical decisions, system integration | Describing what's shown in action |
| **Romance** | 2-5% | Major relationship decisions, vulnerability moments | Basic attraction or embarrassment |
| **Mystery** | 8-10% | Dramatic irony, hidden motivations, planning | Obvious clues or reactions |
| **Slice of Life** | 1-3% | Rare philosophical reflection | Daily activities and emotions |

**Universal Rule**: No matter the genre, if you can show it visually, show it visually. Internal monologue is a precision tool, not a crutch.

---

## Part IV: Related Documentation

### Related Documents

- **📋 Development Guide** (`toonplay-development.md`): Implementation details, API specifications, testing, and code architecture
- **🧪 Evaluation Guide** (`toonplay-evaluation.md`): Quality metrics, evaluation rubric, and validation methods
- **🎨 Image Generation**: `docs/image/image-generation.mdx` - Image generation pipeline
- **📖 Novels System**: `docs/novels/novels-specification.md` - Source narrative generation system

---

**Navigation**:
- 📖 **Concepts & Principles** → This document (toonplay-specification.md)
- 🔧 **Implementation & APIs** → Development Guide (toonplay-development.md)
- ✅ **Quality & Validation** → Evaluation Guide (toonplay-evaluation.md)
