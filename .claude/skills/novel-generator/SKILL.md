---
name: novel-generator
description: Generate complete novels using Adversity-Triumph Engine methodology with document-based output (no database/API). Creates story structure, scenes, characters, and settings saved as markdown files in outputs/ directory. Use when user asks to generate, write, or create a novel or story.
---

# Novel Generator Skill

Generate complete AI-powered novels using the **Cyclic Adversity-Triumph Engine** methodology. This skill creates comprehensive story documents with full structure, evaluation metrics, and metadata—all saved locally without database or API dependencies.

## When to Use This Skill

Activate this skill when the user requests:
- "generate a novel about..."
- "write a story using adversity-triumph..."
- "create a novel with..."
- Any novel/story generation request
- "build a story structure for..."

## Core Methodology

This skill implements the **Adversity-Triumph Engine** as specified in `docs/novels/novels-specification.md` and `docs/novels/novels-generation.md`:

### The 4-Phase Cycle

```
1. ADVERSITY
   - Internal flaw (fear/belief/wound) + External obstacle
   - External conflict forces confrontation with internal conflict

2. VIRTUOUS ACTION
   - Character performs intrinsically motivated good deed
   - NOT transactional ("to get X")
   - Demonstrates courage/compassion/integrity/sacrifice/loyalty/wisdom

3. UNINTENDED CONSEQUENCE (Earned Luck)
   - Surprising resolution/reward emerges
   - Causally linked to past actions (not random)
   - Feels like karmic justice or poetic justice

4. NEW ADVERSITY
   - Resolution creates next problem
   - Stakes escalate
   - Cycle perpetuates
```

### Nested Cycles Architecture

- **Story Level**: Moral framework and thematic premise
- **Part Level (Acts)**: MACRO adversity-triumph arcs (2-4 chapters each)
- **Chapter Level**: MICRO cycles that progressively build macro arcs
- **Scene Level**: 5 scene types implementing the 4-phase cycle

## Novel Generation Workflow

### Step 1: Get Story Prompt

If user hasn't provided a story idea, ask:
```
What kind of novel would you like me to generate?

Consider providing:
- Genre and tone
- Core theme or moral question
- Setting (time/place)
- Character archetypes or traits
- Central conflict
```

### Step 2: Generate Story Structure

Use the comprehensive system prompts from `docs/novels/novels-generation.md` to generate:

1. **Story Summary** - Moral framework, genre, tone, basic characters
2. **Characters** - Full profiles with adversity-triumph cores
3. **Settings** - Environments with adversity elements and symbolic meaning
4. **Parts** - 3-act structure with MACRO character arcs
5. **Chapters** - MICRO cycles advancing MACRO arcs
6. **Scene Summaries** - Specifications for each scene
7. **Scene Content** - Full prose narrative for each scene

### Step 3: Evaluate Quality

For each scene generated:
1. Evaluate using "Architectonics of Engagement" framework
2. Score 5 categories (plot, character, pacing, prose, world-building)
3. If score < 3.0, improve scene based on feedback
4. Re-evaluate (max 2 iterations)
5. Accept when passing or max iterations reached

### Step 4: Save to Outputs

Create document structure in `outputs/` directory:

```
outputs/
└── [story-slug]-[timestamp]/
    ├── story.md                    # Complete story document
    ├── metadata.json               # Story metadata
    ├── structure/
    │   ├── story-summary.md        # Story foundation
    │   ├── characters.md           # All character profiles
    │   ├── settings.md             # All setting descriptions
    │   ├── part-1-act-1.md        # Act I macro arcs
    │   ├── part-2-act-2.md        # Act II macro arcs
    │   └── part-3-act-3.md        # Act III macro arcs
    ├── chapters/
    │   ├── chapter-01.md           # Chapter 1 with all scenes
    │   ├── chapter-02.md
    │   └── ...
    ├── evaluations/
    │   ├── scene-evaluations.json  # All scene quality scores
    │   └── summary-stats.md        # Aggregate quality metrics
    └── prompts/
        ├── story-summary-prompt.md
        ├── characters-prompt.md
        ├── settings-prompt.md
        ├── parts-prompt.md
        ├── chapters-prompt.md
        ├── scene-summaries-prompt.md
        ├── scene-content-prompt.md
        └── scene-evaluation-prompt.md
```

## System Prompts Reference

All system prompts are documented in `docs/novels/novels-generation.md`:

### 1. Story Summary Generation
- **Purpose**: Extract moral framework and basic character setup
- **Model**: Gemini 2.5 Flash Lite
- **Temperature**: 0.7
- **Key Focus**: General theme, NOT detailed plot
- **Output**: JSON with summary, genre, tone, moralFramework, characters

### 2. Character Generation
- **Purpose**: Expand basic data into full profiles
- **Model**: Gemini 2.5 Flash
- **Temperature**: 0.8
- **Key Focus**: Adversity-triumph core (trait, flaw, goal)
- **Output**: JSON array of complete character objects

### 3. Settings Generation
- **Purpose**: Create environments with adversity elements
- **Model**: Gemini 2.5 Flash
- **Temperature**: 0.8
- **Key Focus**: Adversity elements, cycle amplification, sensory details
- **Output**: JSON array of complete setting objects

### 4. Part Summaries Generation
- **Purpose**: Design MACRO arcs per character per act
- **Model**: Gemini 2.5 Flash
- **Temperature**: 0.8
- **Key Focus**: Multi-chapter character transformations
- **Output**: Structured text with character arcs

### 5. Chapter Summaries Generation
- **Purpose**: Create MICRO cycles advancing MACRO arcs
- **Model**: Gemini 2.5 Flash
- **Temperature**: 0.7
- **Key Focus**: Complete micro-cycles with arc progression
- **Output**: Structured text per chapter

### 6. Scene Summaries Generation
- **Purpose**: Break cycle into 3-7 scene specifications
- **Model**: Gemini 2.5 Flash Lite
- **Temperature**: 0.6
- **Key Focus**: Scene specifications with sensory anchors
- **Output**: Structured data per scene

### 7. Scene Content Generation
- **Purpose**: Write full prose from scene summaries
- **Model**: Gemini 2.5 Flash Lite (most), Gemini 2.5 Flash (virtue/consequence)
- **Temperature**: 0.7
- **Key Focus**: Cycle-specific writing guidelines
- **Output**: Prose narrative (300-1000 words)

### 8. Scene Evaluation
- **Purpose**: Assess and improve scene quality
- **Model**: Gemini 2.5 Flash
- **Temperature**: 0.3
- **Key Focus**: 5-category scoring (1-4 scale)
- **Output**: JSON with scores and feedback

## Quality Evaluation System

Every scene is automatically evaluated using the **"Architectonics of Engagement"** framework:

### Evaluation Categories (1-4 scale)

1. **Plot** - Goal clarity, conflict engagement, stakes progression
2. **Character** - Voice distinctiveness, motivation clarity, emotional authenticity
3. **Pacing** - Tension modulation, scene rhythm, narrative momentum
4. **Prose** - Sentence variety, word choice precision, sensory engagement
5. **World-Building** - Setting integration, detail balance, immersion

### Scoring Scale

- **1.0 - Nascent**: Foundational elements present but underdeveloped
- **2.0 - Developing**: Core elements functional but needing refinement
- **3.0 - Effective**: Professionally crafted, engaging, meets quality standards ✅
- **4.0 - Exemplary**: Exceptional craft, deeply immersive, publishable excellence

### Improvement Process

- **Passing Score**: 3.0/4.0 (Effective level)
- **Max Iterations**: 2 per scene
- **Improvement Level**: Moderate (balanced refinement)

## Response Templates

### Starting Generation

```
I'll generate a [genre] novel using the Adversity-Triumph Engine methodology.

This will create:
- Complete story structure (Story → Parts → Chapters → Scenes)
- Full character profiles with adversity-triumph cores
- Settings with environmental adversity elements
- Scene-by-scene prose with automatic quality evaluation

All files will be saved to outputs/[story-name]-[timestamp]/

Generating story structure...
```

### Progress Updates

```
✅ Story summary generated
   - Genre: [genre]
   - Tone: [tone]
   - Characters: [N] main characters
   - Moral framework: [brief summary]

🎭 Generating character profiles...
   - [Character 1]: [coreTrait] with flaw: [internalFlaw]
   - [Character 2]: [coreTrait] with flaw: [internalFlaw]
   - ...

🏞️ Generating settings...
   - [Setting 1]: [mood], [adversity elements count] adversity factors
   - [Setting 2]: [mood], [adversity elements count] adversity factors
   - ...

📚 Generating part summaries (3-act structure)...
   - Act I: [N] macro arcs planned
   - Act II: [M] macro arcs planned
   - Act III: [P] macro arcs planned

📖 Generating chapters...
   - Chapter 1: [title] ([arc position])
   - Chapter 2: [title] ([arc position])
   - ...

🎬 Generating scene content with evaluation...
   - Scene 1.1: [title] (setup phase) - Score: 3.2/4.0 ✅
   - Scene 1.2: [title] (confrontation phase) - Score: 2.8/4.0 → Improved → 3.1/4.0 ✅
   - ...
```

### Completion Report

```
✅ Novel generation complete!

**Story Details:**
- Title: [Title]
- Genre: [Genre]
- Tone: [Tone]
- Total Word Count: ~[N] words

**Structure:**
- 📚 Parts: 3 (Acts I, II, III)
- 📝 Chapters: [N]
- 🎬 Scenes: [M]
- 👥 Characters: [P] ([Q] main)
- 🏞️ Settings: [R]

**Quality Metrics:**
- Average scene score: [X.X]/4.0
- Scenes passing first evaluation: [N]%
- Scenes improved: [M]
- Final passing rate: [P]%

**Output Location:**
outputs/[story-slug]-[timestamp]/

**Files Created:**
- story.md (complete novel)
- metadata.json (story metadata)
- structure/ (8 files)
- chapters/ ([N] files)
- evaluations/ (2 files)
- prompts/ (8 system prompts)

You can review, edit, or regenerate any part of the novel from these files.
```

## Document Format Specifications

### story.md Format

```markdown
# [Story Title]

**Genre**: [genre]
**Tone**: [tone]
**Word Count**: ~[N] words

## Story Summary

[Story summary with moral framework]

## Characters

### [Character Name] (Main)

**Core Trait**: [coreTrait]
**Internal Flaw**: [internalFlaw]
**External Goal**: [externalGoal]

[Full character description]

### [Character Name] (Supporting)

...

## Settings

### [Setting Name]

**Mood**: [mood]
**Adversity Elements**: [summary]

[Full setting description]

...

---

# Act I: [Part Title]

## Chapter 1: [Chapter Title]

### Scene 1: [Scene Title]

[Scene content prose]

### Scene 2: [Scene Title]

[Scene content prose]

...

## Chapter 2: [Chapter Title]

...

---

# Act II: [Part Title]

...

---

# Act III: [Part Title]

...

---

# Story Statistics

- Total Parts: [N]
- Total Chapters: [M]
- Total Scenes: [P]
- Total Characters: [Q]
- Total Settings: [R]
- Average Scene Score: [X.X]/4.0

---

Generated using Adversity-Triumph Engine
Fictures Novel Generator v1.0
```

### metadata.json Format

```json
{
  "title": "string",
  "genre": "string",
  "tone": "string",
  "summary": "string",
  "moralFramework": "string",
  "wordCount": 0,
  "statistics": {
    "parts": 3,
    "chapters": 0,
    "scenes": 0,
    "characters": 0,
    "settings": 0
  },
  "quality": {
    "averageSceneScore": 0.0,
    "scenesPassingFirstEval": 0,
    "scenesImproved": 0,
    "finalPassingRate": 0.0
  },
  "generatedAt": "ISO8601 timestamp",
  "generationTime": "duration in seconds",
  "modelUsed": "Gemini 2.5 Flash / Flash Lite"
}
```

## Error Handling

### Generation Failure

```
❌ Scene generation failed at Scene [N]

Error: [error message]

The generation has been paused. You can:
1. Retry from this point
2. Skip this scene and continue
3. Review partial output in outputs/[story]/
```

### Quality Issues

```
⚠️ Scene [N] did not reach quality threshold after 2 iterations

Final score: [X.X]/4.0 (target: 3.0/4.0)

The scene has been included but may need manual editing:
- Category scores: Plot [X.X], Character [X.X], Pacing [X.X], Prose [X.X], World [X.X]
- Priority improvements: [list from evaluation]
```

## Best Practices

1. **Clear prompts**: Ask for specifics if user prompt is vague
2. **Progress reporting**: Update user at each major milestone
3. **Quality transparency**: Report evaluation scores honestly
4. **Document integrity**: Save all prompts and intermediate outputs
5. **Error recovery**: Provide clear options when generation fails

## Advanced Usage

### Custom Generation Parameters

Allow user to specify:
- Number of acts (default: 3)
- Chapters per act (default: 2-4)
- Scenes per chapter (default: 3-7)
- Evaluation strictness (passing score 2.5-3.5)
- Style preferences (prose density, dialogue ratio)

### Regeneration

User can request regeneration of specific parts:
- "Regenerate chapter 3 with more tension"
- "Improve scene 2.4 with better dialogue"
- "Rewrite Act II to be darker"

## Troubleshooting

**Q: Generation is very slow**
A: Novel generation is compute-intensive. Expected time:
- Small novel (5-10 chapters): 15-30 minutes
- Medium novel (10-20 chapters): 30-60 minutes
- Large novel (20+ chapters): 60-120 minutes

**Q: Scene quality scores are low**
A: Review evaluation feedback in evaluations/scene-evaluations.json and manually edit scenes that didn't reach threshold.

**Q: Can I use this for non-fiction?**
A: No, the Adversity-Triumph Engine is designed specifically for narrative fiction with character arcs and moral frameworks.

**Q: How do I generate images?**
A: Use the separate `image-generator` skill after novel generation completes.

## Technical Notes

- **No database**: All data saved as markdown/JSON files
- **No API calls**: Everything runs locally through Claude
- **Version control**: Output directory structure enables git tracking
- **Reproducibility**: System prompts saved for exact regeneration
- **Modularity**: Each generation phase is independent

## Related Skills

- `novel-evaluator`: Evaluate existing novel documents
- `image-generator`: Generate character portraits and setting images
