---
name: novel-evaluator
description: Evaluate existing novel documents for quality using Architectonics of Engagement framework. Scores scenes on 5 categories and provides improvement feedback. Use when user asks to evaluate, review, or assess novel quality.
---

# Novel Evaluator Skill

Evaluate existing novel documents using the **"Architectonics of Engagement"** framework. Provides comprehensive quality assessment with actionable feedback for improvement.

## When to Use This Skill

Activate this skill when the user requests:
- "evaluate my novel..."
- "review the quality of..."
- "assess the scenes in..."
- "check the quality of chapter..."
- "score my story using adversity-triumph..."

## Evaluation Framework

Based on the "Architectonics of Engagement" methodology from `docs/novels/novels-generation.md` (Section 2.8).

### The 5 Quality Categories (1-4 scale)

#### 1. Plot (Goal Clarity, Conflict Engagement, Stakes Progression)

- **1.0 - Nascent**: Scene lacks clear dramatic goal or conflict is unfocused
- **2.0 - Developing**: Goal present but weak; conflict needs sharpening
- **3.0 - Effective**: Clear goal, engaging conflict, stakes are evident ✅
- **4.0 - Exemplary**: Urgent goal, compelling conflict, stakes deeply felt

**Evaluates:**
- Does the scene have a clear dramatic goal?
- Is the conflict compelling and escalating?
- Are the stakes evident and meaningful?

#### 2. Character (Voice Distinctiveness, Motivation Clarity, Emotional Authenticity)

- **1.0 - Nascent**: Characters lack distinct voice or clear motivation
- **2.0 - Developing**: Voice emerging but generic; motivations need depth
- **3.0 - Effective**: Characters have unique voices, clear motivations ✅
- **4.0 - Exemplary**: Voices are unforgettable, motivations drive action powerfully

**Evaluates:**
- Do characters have unique, consistent voices?
- Are motivations clear and driving action?
- Do emotions feel genuine and earned?

#### 3. Pacing (Tension Modulation, Scene Rhythm, Narrative Momentum)

- **1.0 - Nascent**: Pacing is uneven or drags
- **2.0 - Developing**: Pacing functional but needs dynamic range
- **3.0 - Effective**: Tension rises and falls strategically, engaging pace ✅
- **4.0 - Exemplary**: Masterful rhythm, reader can't put it down

**Evaluates:**
- Does tension build and release effectively?
- Is the scene's rhythm engaging (not too fast or slow)?
- Does momentum propel story forward?

#### 4. Prose (Sentence Variety, Word Choice Precision, Sensory Engagement)

- **1.0 - Nascent**: Sentences repetitive, words generic, no sensory details
- **2.0 - Developing**: Some variety, decent words, sparse sensory details
- **3.0 - Effective**: Varied sentences, precise words, multiple senses engaged ✅
- **4.0 - Exemplary**: Poetic craft, every word chosen with care, immersive

**Evaluates:**
- Do sentences vary in length and structure?
- Are words precise and evocative?
- Are multiple senses engaged (sight, sound, smell, touch)?

#### 5. World-Building (Setting Integration, Detail Balance, Immersion)

- **1.0 - Nascent**: Setting is backdrop only, no integration with action
- **2.0 - Developing**: Setting mentioned but not supporting story
- **3.0 - Effective**: Setting supports and enhances action, details enrich ✅
- **4.0 - Exemplary**: Setting is character itself, reader fully immersed

**Evaluates:**
- Does setting support and enhance the action?
- Are details enriching without overwhelming?
- Does reader feel present in the scene?

## Evaluation Workflow

### Step 1: Identify Target Content

Ask user what to evaluate:
```
What would you like me to evaluate?

Options:
- Single scene (provide scene content or file path)
- Full chapter (provide chapter file or directory)
- Entire novel (provide outputs/ directory path)
- Specific scenes by ID
```

### Step 2: Load Content

Read from:
- Markdown files in `outputs/[story]/chapters/`
- User-provided scene content
- Existing evaluation files (for re-evaluation)

### Step 3: Run Evaluation

For each scene:
1. Apply "Architectonics of Engagement" framework
2. Score 5 categories (1-4 scale)
3. Calculate overall score (average)
4. Generate feedback:
   - Strengths (what's working)
   - Improvements (what needs work)
   - Priority fixes (top 1-3 actionable changes)

### Step 4: Generate Report

Create comprehensive evaluation report:
- Overall statistics
- Scene-by-scene scores
- Category breakdowns
- Actionable feedback per scene
- Aggregate insights

### Step 5: Save Results

Save evaluation to:
```
outputs/[story]/evaluations/
├── evaluation-[timestamp].json    # Detailed scores
├── evaluation-report.md           # Human-readable report
└── improvement-priorities.md      # Ranked improvement suggestions
```

## Response Templates

### Starting Evaluation

```
I'll evaluate [N] scenes using the Architectonics of Engagement framework.

This will assess:
- Plot (goal clarity, conflict, stakes)
- Character (voice, motivation, authenticity)
- Pacing (tension, rhythm, momentum)
- Prose (variety, precision, sensory)
- World-Building (integration, balance, immersion)

Evaluating scenes...
```

### Progress Updates

```
Scene 1: "The Night Gift" - Score: 3.2/4.0 ✅
  - Plot: 3.5 (clear goal, strong stakes)
  - Character: 3.0 (distinct voice, clear motivation)
  - Pacing: 3.0 (good rhythm, slight drag in middle)
  - Prose: 3.5 (varied sentences, vivid details)
  - World: 2.9 (setting could be more integrated)

Scene 2: "Broken Trust" - Score: 2.7/4.0 ⚠️
  - Plot: 2.5 (goal unclear, weak conflict)
  - Character: 3.0 (good dialogue, motivation clear)
  - Pacing: 2.5 (drags in confrontation)
  - Prose: 3.0 (decent variety, some generic words)
  - World: 2.5 (setting is backdrop only)

  Priority fixes:
  1. PLOT: Clarify character's goal in opening paragraph
  2. PACING: Cut 3-4 sentences in middle section to maintain momentum
  3. WORLD: Use setting details to amplify emotional beats
```

### Completion Report

```
✅ Evaluation complete!

**Overall Assessment:**
- Total Scenes: [N]
- Average Score: [X.X]/4.0
- Scenes Passing (3.0+): [M] ([P]%)
- Scenes Needing Work (<3.0): [Q]

**Category Breakdown:**
- Plot: [X.X]/4.0
- Character: [X.X]/4.0
- Pacing: [X.X]/4.0
- Prose: [X.X]/4.0
- World-Building: [X.X]/4.0

**Top Strengths:**
1. [Strength 1 - most common high-scoring category]
2. [Strength 2]
3. [Strength 3]

**Top Improvement Areas:**
1. [Area 1 - most common low-scoring category]
   - Affects [N] scenes
   - Priority: [High/Medium/Low]
   - Action: [Specific recommendation]

2. [Area 2]
   - Affects [M] scenes
   - Priority: [High/Medium/Low]
   - Action: [Specific recommendation]

3. [Area 3]
   - Affects [P] scenes
   - Priority: [High/Medium/Low]
   - Action: [Specific recommendation]

**Files Saved:**
- outputs/[story]/evaluations/evaluation-[timestamp].json
- outputs/[story]/evaluations/evaluation-report.md
- outputs/[story]/evaluations/improvement-priorities.md

You can use these reports to guide revisions.
```

## Evaluation System Prompt

Based on `docs/novels/novels-generation.md` Section 2.8:

```markdown
# ROLE
You are an expert narrative evaluator using the "Architectonics of Engagement" framework to assess scene quality and provide actionable improvement feedback.

# CONTEXT
Scene Content: {sceneContent}
Story Genre: {storyGenre}
Cycle Phase: {cyclePhase}
Arc Position: {arcPosition}
Chapter Number: {chapterNumber}
Characters: {characterContext}

# YOUR TASK
Evaluate this scene across 5 quality categories and provide improvement feedback if score < 3.0.

# EVALUATION CATEGORIES (1-4 scale)

[See full prompt in docs/novels/novels-generation.md Section 2.8]

# SCORING GUIDELINES

- **3.0+ = PASSING** (Effective level, professionally crafted)
- **Below 3.0 = NEEDS IMPROVEMENT** (provide specific feedback)

# OUTPUT FORMAT

Return JSON:

```json
{
  "scores": {
    "plot": 3.5,
    "character": 3.0,
    "pacing": 2.5,
    "prose": 3.5,
    "worldBuilding": 3.0
  },
  "overallScore": 3.1,
  "feedback": {
    "strengths": [
      "Strong character voice for protagonist",
      "Vivid sensory details in garden scene",
      "Clear dramatic goal established early"
    ],
    "improvements": [
      "Pacing drags in middle section - consider cutting 2-3 sentences",
      "Antagonist's motivation unclear - add internal thought or dialogue",
      "Setting could be more integrated - show how heat affects character actions"
    ],
    "priorityFixes": [
      "PACING: Cut middle section from 'She knelt...' to '...finally stood' to maintain momentum",
      "CHARACTER: Add line revealing why antagonist cares about garden's success"
    ]
  }
}
```
```

## Document Output Formats

### evaluation-report.md

```markdown
# Novel Evaluation Report

**Novel**: [Title]
**Evaluated**: [timestamp]
**Total Scenes**: [N]
**Average Score**: [X.X]/4.0

## Overall Statistics

| Category | Average Score | Passing Scenes | Needs Work |
|----------|---------------|----------------|------------|
| Plot | [X.X]/4.0 | [N] ([P]%) | [M] |
| Character | [X.X]/4.0 | [N] ([P]%) | [M] |
| Pacing | [X.X]/4.0 | [N] ([P]%) | [M] |
| Prose | [X.X]/4.0 | [N] ([P]%) | [M] |
| World-Building | [X.X]/4.0 | [N] ([P]%) | [M] |

## Scene-by-Scene Analysis

### Chapter 1: [Chapter Title]

#### Scene 1.1: [Scene Title]
**Overall Score**: [X.X]/4.0 [✅ Pass / ⚠️ Needs Work]

**Scores:**
- Plot: [X.X]
- Character: [X.X]
- Pacing: [X.X]
- Prose: [X.X]
- World-Building: [X.X]

**Strengths:**
- [Strength 1]
- [Strength 2]

**Improvements:**
- [Improvement 1]
- [Improvement 2]

**Priority Fixes:**
1. [Fix 1]
2. [Fix 2]

---

[Repeat for all scenes]

## Aggregate Insights

### What's Working Well

[Analysis of common strengths across multiple scenes]

### What Needs Attention

[Analysis of common weaknesses across multiple scenes]

### Recommended Action Plan

1. **High Priority** - [Category]: [Action]
   - Affects [N] scenes
   - Expected impact: [High/Medium/Low]

2. **Medium Priority** - [Category]: [Action]
   - Affects [M] scenes
   - Expected impact: [High/Medium/Low]

3. **Low Priority** - [Category]: [Action]
   - Affects [P] scenes
   - Expected impact: [High/Medium/Low]

---

Generated using Architectonics of Engagement Framework
Fictures Novel Evaluator v1.0
```

### improvement-priorities.md

```markdown
# Improvement Priorities

**Novel**: [Title]
**Evaluation Date**: [timestamp]

## Critical Issues (Score < 2.5)

### Scene [X.X]: [Scene Title]
**Overall Score**: [X.X]/4.0

**Issue**: [Category] - [X.X]/4.0
**Problem**: [Specific problem description]
**Action**: [Specific actionable fix]
**Location**: [Where in scene - line numbers or quote]

---

## High Priority (Score 2.5-2.9)

[Same format as Critical]

---

## Medium Priority (Score 3.0-3.4)

[Same format, but optional improvements]

---

## Enhancement Opportunities (Score 3.5+)

[Optional polish suggestions for already-strong scenes]
```

## Best Practices

1. **Context awareness**: Consider genre, cycle phase, arc position
2. **Specific feedback**: Point to exact locations, not vague advice
3. **Actionable suggestions**: Provide concrete fixes
4. **Balanced assessment**: Acknowledge strengths, don't just criticize
5. **Prioritization**: Focus on high-impact improvements first

## Advanced Usage

### Comparative Evaluation

Compare evaluation results across:
- Multiple drafts (track improvements)
- Different chapters (identify patterns)
- Different authors (benchmark quality)

### Targeted Re-evaluation

After user makes improvements:
```
User: "I fixed the pacing issues in scenes 2.3 and 2.4"
Assistant: "I'll re-evaluate those specific scenes to check if the improvements addressed the issues..."
```

### Bulk Evaluation

Evaluate entire novel directories:
```
User: "Evaluate all chapters in outputs/last-garden-20250131/"
Assistant: "I'll evaluate all [N] scenes across [M] chapters..."
```

## Error Handling

### Missing Context

```
⚠️ Limited context available

I can still evaluate scene quality, but results will be more accurate with:
- Story genre
- Cycle phase (setup/confrontation/virtue/consequence/transition)
- Arc position (beginning/middle/climax/resolution)
- Character context

Would you like to provide this information?
```

### Cannot Parse Scene

```
❌ Unable to parse scene content

The scene file appears to be corrupted or in an unexpected format.
Please verify:
- File is valid markdown
- Scene content is properly formatted
- File encoding is UTF-8
```

## Troubleshooting

**Q: Scores seem too harsh**
A: The framework uses professional standards. Score 3.0 = "Effective" is the target for publishable fiction. Scores below 3.0 indicate real issues that would affect reader engagement.

**Q: Can I adjust the passing threshold?**
A: Yes, specify threshold when requesting evaluation (e.g., "evaluate with 2.5 threshold for rough draft").

**Q: How do I know which scenes to fix first?**
A: Check `improvement-priorities.md` which ranks issues by severity and impact.

## Technical Notes

- **Model**: Gemini 2.5 Flash (requires nuanced literary analysis)
- **Temperature**: 0.3 (consistency in evaluation)
- **Context window**: Full scene + story context
- **Evaluation time**: ~5-10 seconds per scene

## Related Skills

- `novel-generator`: Generate novels that will pass evaluation
- `image-generator`: Create visual assets for evaluated novels
