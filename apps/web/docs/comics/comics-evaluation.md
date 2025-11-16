# Comics Evaluation Guide: Quality Metrics & Testing

## Overview

This document specifies the quality evaluation system for comics generation, including toonplay assessment criteria, automated metrics, testing strategies, and improvement workflows.

**Related Documents:**
- 📖 **Specification** (`comics-specification.md`): Core concepts, data model, and architecture
- 📋 **Development Guide** (`comics-development.md`): API specifications and implementation details

---

## Part I: Toonplay Quality Framework

### 1.1 Evaluation Philosophy

**Goal**: Ensure generated toonplay scripts preserve narrative "soul" while optimizing for mobile webtoon consumption.

**4-Category Weighted Scoring System**:

| Category | Weight | Focus Area | Passing Threshold |
|----------|--------|------------|-------------------|
| **Narrative Fidelity** | 20% | Preserves story essence | ≥ 3.0/5.0 |
| **Visual Transformation** | 30% | Show vs tell, strategic internal monologue | ≥ 3.0/5.0 |
| **Webtoon Pacing** | 30% | Mobile vertical-scroll optimization | ≥ 3.0/5.0 |
| **Script Formatting** | 20% | Production usability | ≥ 3.0/5.0 |

**Overall Passing Score**: Weighted average ≥ 3.0/5.0

### 1.2 Scoring Scale (1-5)

| Score | Level | Definition |
|-------|-------|------------|
| **5.0** | Exceptional | Professional-grade, ready for publication |
| **4.0** | Strong | Solid quality, minor improvements only |
| **3.0** | Effective | Meets minimum standards, acceptable |
| **2.0** | Weak | Significant issues, needs revision |
| **1.0** | Failed | Major problems, fundamental rework required |

---

## Part II: Evaluation Categories

### 2.1 Narrative Fidelity (20% weight)

**What It Measures**: Does the toonplay preserve the emotional beats, character arcs, and story essence from the prose source?

**Key Criteria**:

1. **Story Beats Preserved**
   - All major plot points included
   - Emotional progression intact
   - Climactic moments properly positioned

2. **Character Consistency**
   - Character voices maintained
   - Relationships accurately portrayed
   - Motivations clear

3. **Emotional Arc**
   - Setup → tension → climax → resolution
   - Emotional highs and lows preserved
   - Reader empathy maintained

**Scoring Guidelines**:

```
5.0 - All story beats preserved with enhanced emotional clarity
4.0 - Major beats intact, minor details condensed effectively
3.0 - Core story preserved, some supporting details simplified
2.0 - Key beats missing or emotional arc weakened
1.0 - Story fundamentally altered or incoherent
```

**Example - Score 5.0**:
```
Prose: "Sarah's hands trembled as she opened the letter.
After three years of silence, Marcus had finally written back..."

Toonplay Panel 1 (close_up):
Description: Sarah's hands holding sealed envelope, slight tremor visible
Dialogue: [internal monologue] "Three years... Is this really from him?"

Toonplay Panel 2 (extreme_close_up):
Description: Sarah's eyes scanning first line of letter, tears forming
[Preserves emotional beat while showing visually]
```

**Example - Score 2.0**:
```
Prose: "Sarah's hands trembled as she opened the letter.
After three years of silence, Marcus had finally written back..."

Toonplay Panel 1 (wide_shot):
Description: Sarah in room opening envelope
Dialogue: "Oh, a letter from Marcus."
[Lost emotional weight, trembling hands not shown, no context of 3-year silence]
```

### 2.2 Visual Transformation (30% weight)

**What It Measures**: Does the toonplay effectively transform prose narration into visual storytelling?

**Key Criteria**:

1. **Show vs Tell Ratio**
   - Narration < 5% of panels (time/location only)
   - Internal monologue < 10% of panels (strategic moments only)
   - Dialogue ~70% of panels
   - Visual action properly shown

2. **Character Expressions & Body Language**
   - Emotions shown through visual cues
   - Body language specified in character_poses
   - Facial expressions detailed

3. **Environmental Storytelling**
   - Settings actively contribute to mood
   - Visual details replace prose descriptions
   - Atmosphere created through lighting, composition

**Scoring Guidelines**:

```
5.0 - Masterful visual storytelling, minimal narration, all emotions shown
4.0 - Strong visual focus, narration used sparingly and effectively
3.0 - Adequate show-vs-tell balance, meets <5% narration / <10% internal monologue targets
2.0 - Over-reliance on narration, missed visual opportunities
1.0 - Prose narrative copied verbatim, not adapted to visual medium
```

**Automated Metrics**:
- `narration_percentage`: % of panels with narrative text (target: <5%)
- `internal_monologue_percentage`: % of panels with internal monologue (target: <10%)
- `dialogue_presence`: % of panels with dialogue (target: ~70%)

**Example - Score 5.0**:
```
Prose: "Detective Morgan felt the weight of failure pressing down on him as he stared at the cold case files."

Toonplay Panel (medium_shot):
Description: Morgan slumped in chair, shoulders hunched, head in hands,
stack of dusty case files spread across desk, harsh desk lamp creating dramatic shadows
Lighting: Single desk lamp, otherwise dark office
Character_poses: {morgan: "defeated posture, face hidden in hands"}
Narrative: [NONE - emotion shown visually]
Dialogue: []
[Perfect - shows emotional weight through body language, lighting, composition]
```

**Example - Score 2.0**:
```
Prose: "Detective Morgan felt the weight of failure pressing down on him as he stared at the cold case files."

Toonplay Panel (medium_shot):
Description: Morgan sitting at desk looking at files
Narrative: "Detective Morgan felt the weight of failure pressing down on him."
[Copied narration verbatim, missed visual storytelling opportunity]
```

### 2.3 Webtoon Pacing (30% weight)

**What It Measures**: Is the toonplay optimized for mobile vertical-scroll thumb reading?

**Key Criteria**:

1. **Panel Count Appropriateness**
   - 8-12 panels per scene
   - One key action per panel
   - Avoid over-compression or over-expansion

2. **Visual Rhythm**
   - Shot type variety (not monotonous)
   - Clear progression of events
   - Cliffhanger potential at scene end

3. **Thumb-Scroll Optimization**
   - Each panel works as standalone visual
   - Clear visual hierarchy
   - Dialogue placement considerations

**Scoring Guidelines**:

```
5.0 - Perfect pacing, varied visual rhythm, strong panel-to-panel flow
4.0 - Good pacing, appropriate panel count, minor rhythm issues
3.0 - Acceptable pacing, meets 8-12 panel range, readable flow
2.0 - Rushed or dragged pacing, monotonous visuals
1.0 - Completely wrong pacing, incoherent panel sequence
```

**Automated Metrics**:
- `total_panels`: Count (target: 8-12)
- `shot_type_distribution`: Variety check
- `dialogue_length_compliance`: All under 150 characters

**Example - Score 5.0**:
```
Panel 1: establishing_shot (scene setup)
Panel 2: wide_shot (character entrance)
Panel 3: medium_shot (conversation starts)
Panel 4: close_up (emotional reaction)
Panel 5: over_shoulder (dialogue exchange)
Panel 6: medium_shot (action begins)
Panel 7: wide_shot (full action)
Panel 8: close_up (climactic moment)
Panel 9: medium_shot (aftermath)
Panel 10: close_up (emotional resolution)
[Varied shot types, clear progression, perfect rhythm]
```

**Example - Score 2.0**:
```
Panel 1: medium_shot
Panel 2: medium_shot
Panel 3: medium_shot
Panel 4: medium_shot
Panel 5: medium_shot
Panel 6: medium_shot
Panel 7: medium_shot
Panel 8: medium_shot
[Monotonous, no visual variety, poor pacing]
```

### 2.4 Script Formatting (20% weight)

**What It Measures**: Is the toonplay script production-ready and usable for image generation?

**Key Criteria**:

1. **Completeness**
   - All required fields populated
   - Character IDs match database
   - Setting references accurate

2. **Technical Specifications**
   - Detailed visual descriptions (200-400 characters)
   - Camera angles specified
   - Lighting described
   - Character poses defined

3. **Production Usability**
   - Clear instructions for AI image generation
   - Dialogue properly attributed
   - SFX appropriately placed

**Scoring Guidelines**:

```
5.0 - Flawless formatting, all fields complete, production-ready
4.0 - Well-formatted, minor missing details
3.0 - Adequate formatting, meets minimum requirements
2.0 - Incomplete fields, ambiguous descriptions
1.0 - Critical missing information, unusable
```

**Automated Metrics**:
- `text_overlay_validation`: All panels have dialogue OR narrative (100% required)
- `dialogue_length_compliance`: All dialogue under 150 characters (100% required)
- `description_length_validation`: All descriptions 200-400 characters

---

## Part III: Automated Evaluation

### 3.1 Evaluation Schema

**Zod Schema**: `AiToonplayEvaluationZodSchema` (see `src/lib/schemas/ai/ai-toonplay.ts`)

```typescript
export const AiToonplayEvaluationZodSchema = z.object({
  weighted_score: z.number().min(1.0).max(5.0),
  passes: z.boolean(), // True if weighted_score >= 3.0

  category_scores: z.object({
    narrative_fidelity: z.number().min(1).max(5),      // Weight: 20%
    visual_transformation: z.number().min(1).max(5),   // Weight: 30%
    webtoon_pacing: z.number().min(1).max(5),          // Weight: 30%
    script_formatting: z.number().min(1).max(5),       // Weight: 20%
  }),

  metrics: z.object({
    narration_percentage: z.number().min(0).max(100),
    internal_monologue_percentage: z.number().min(0).max(100),
    dialogue_presence: z.number().min(0).max(100),
    shot_type_distribution: z.record(z.string(), z.number()),
    text_overlay_validation: z.boolean(),
    dialogue_length_compliance: z.boolean(),
  }),

  recommendations: z.array(z.string()),
  final_report: z.string().min(50).max(2000),
});
```

### 3.2 Weighted Score Calculation

```typescript
function calculateWeightedScore(categoryScores: CategoryScores): number {
  return (
    categoryScores.narrative_fidelity * 0.20 +
    categoryScores.visual_transformation * 0.30 +
    categoryScores.webtoon_pacing * 0.30 +
    categoryScores.script_formatting * 0.20
  );
}
```

### 3.3 Automated Metrics Calculation

```typescript
function calculateMetrics(toonplay: AiComicToonplayType): Metrics {
  const totalPanels = toonplay.panels.length;

  // Narration percentage
  const narrationPanels = toonplay.panels.filter(
    p => p.narrative && p.narrative.trim().length > 0
  ).length;
  const narration_percentage = (narrationPanels / totalPanels) * 100;

  // Internal monologue percentage
  const internalMonologuePanels = toonplay.panels.filter(
    p => p.narrative && isInternalMonologue(p.narrative)
  ).length;
  const internal_monologue_percentage = (internalMonologuePanels / totalPanels) * 100;

  // Dialogue presence
  const dialoguePanels = toonplay.panels.filter(
    p => p.dialogue && p.dialogue.length > 0
  ).length;
  const dialogue_presence = (dialoguePanels / totalPanels) * 100;

  // Shot type distribution
  const shot_type_distribution: Record<string, number> = {};
  for (const panel of toonplay.panels) {
    shot_type_distribution[panel.shot_type] =
      (shot_type_distribution[panel.shot_type] || 0) + 1;
  }

  // Text overlay validation (all panels must have dialogue OR narrative)
  const text_overlay_validation = toonplay.panels.every(
    p => (p.dialogue && p.dialogue.length > 0) ||
         (p.narrative && p.narrative.trim().length > 0)
  );

  // Dialogue length compliance (all under 150 characters)
  const dialogue_length_compliance = toonplay.panels.every(
    p => !p.dialogue || p.dialogue.every(d => d.text.length <= 150)
  );

  return {
    narration_percentage,
    internal_monologue_percentage,
    dialogue_presence,
    shot_type_distribution,
    text_overlay_validation,
    dialogue_length_compliance,
  };
}
```

---

## Part IV: Evaluation Process

### 4.1 Evaluation System Prompt

**Prompt Type**: `system` (AI evaluator)

```
You are an expert webtoon script evaluator specializing in assessing toonplay
quality for mobile vertical-scroll comics.

Your task: Evaluate the provided toonplay using the 4-category weighted scoring system.

EVALUATION CATEGORIES:

1. NARRATIVE FIDELITY (20% weight)
   - Preserves story beats from source prose
   - Character consistency maintained
   - Emotional arc intact
   - Score 1-5 (5 = exceptional, 3 = effective, 1 = failed)

2. VISUAL TRANSFORMATION (30% weight)
   - Show vs tell effectiveness
   - Narration < 5% of panels (time/location only)
   - Internal monologue < 10% of panels (strategic moments)
   - Dialogue ~70% of panels
   - Emotions shown through visual cues
   - Score 1-5

3. WEBTOON PACING (30% weight)
   - Panel count appropriate (8-12)
   - One key action per panel
   - Shot type variety
   - Thumb-scroll optimization
   - Score 1-5

4. SCRIPT FORMATTING (20% weight)
   - All required fields complete
   - Detailed visual descriptions (200-400 chars)
   - Production-ready specifications
   - Score 1-5

SCORING SCALE:
5.0 = Exceptional (professional-grade)
4.0 = Strong (minor improvements only)
3.0 = Effective (meets minimum standards) ← PASSING THRESHOLD
2.0 = Weak (significant issues)
1.0 = Failed (fundamental rework required)

WEIGHTED SCORE CALCULATION:
weighted_score = (narrative_fidelity × 0.20) +
                 (visual_transformation × 0.30) +
                 (webtoon_pacing × 0.30) +
                 (script_formatting × 0.20)

PASSES: weighted_score >= 3.0

PROVIDE:
1. Category scores (1-5 for each)
2. Weighted score
3. Pass/fail determination
4. Specific recommendations for failed categories
5. Detailed final report with examples
```

### 4.2 Evaluation User Prompt

```typescript
const userPrompt = `
SOURCE PROSE SCENE:
${sceneContent}

GENERATED TOONPLAY:
${JSON.stringify(toonplay, null, 2)}

AUTOMATED METRICS:
- Narration: ${metrics.narration_percentage}% (target: <5%)
- Internal Monologue: ${metrics.internal_monologue_percentage}% (target: <10%)
- Dialogue presence: ${metrics.dialogue_presence}% (target: ~70%)
- Shot type distribution: ${JSON.stringify(metrics.shot_type_distribution)}
- Text overlay validation: ${metrics.text_overlay_validation ? 'PASS' : 'FAIL'}
- Dialogue length compliance: ${metrics.dialogue_length_compliance ? 'PASS' : 'FAIL'}

Evaluate this toonplay against the 4 categories and provide detailed feedback.
`;
```

### 4.3 Evaluation Code

**File**: `src/lib/studio/services/toonplay-evaluator.ts`

```typescript
export async function evaluateToonplay(
  toonplay: AiComicToonplayType,
  sourceScene: Scene
): Promise<AiToonplayEvaluationType> {
  // 1. Calculate automated metrics
  const metrics = calculateMetrics(toonplay);

  // 2. Create text generation client
  const client = createTextGenerationClient();

  // 3. Build evaluation prompts
  const { system: systemPrompt, user: userPrompt } =
    promptManager.getPrompt(
      client.getProviderType(),
      "toonplay-evaluation",
      {
        sceneContent: sourceScene.content,
        toonplay: JSON.stringify(toonplay, null, 2),
        metrics,
      }
    );

  // 4. Generate evaluation using structured output
  const evaluation: AiToonplayEvaluationType = await client.generateStructured(
    userPrompt,
    AiToonplayEvaluationZodSchema,
    {
      systemPrompt,
      temperature: 0.3, // Lower temperature for consistent scoring
      maxTokens: 4096,
    }
  );

  // 5. Add automated metrics to evaluation
  evaluation.metrics = metrics;

  return evaluation;
}
```

---

## Part V: Improvement Workflow

### 5.1 Iterative Improvement Process

```
┌────────────────────────────────────────────────────────────┐
│               TOONPLAY IMPROVEMENT LOOP                     │
└────────────────────────────────────────────────────────────┘

1. Generate Initial Toonplay
   └─> convertSceneToToonplay()

2. Evaluate Quality
   └─> evaluateToonplay()
   └─> Calculate weighted_score

3. Check Pass/Fail
   ├─> If weighted_score >= 3.0: PASS → Generate panel images
   └─> If weighted_score < 3.0: FAIL → Improve toonplay

4. Improve Toonplay (if failed)
   ├─> Identify weakest categories
   ├─> Generate improvement prompts
   └─> improveToonplay() with targeted feedback

5. Re-evaluate Improved Toonplay
   └─> evaluateToonplay() again

6. Max Iterations
   ├─> If passes: Generate panel images
   ├─> If fails after 2 iterations: Use best attempt
   └─> Log failure for manual review

TYPICAL RESULTS:
- 70-80% pass on first evaluation
- 15-20% pass after one improvement
- 5-10% require manual review
```

### 5.2 Improvement System Prompt

```
You are an expert webtoon script editor specializing in improving toonplay
scripts based on evaluation feedback.

Your task: Revise the provided toonplay to address specific weaknesses identified
in the evaluation.

EVALUATION FEEDBACK:
${evaluationReport}

FOCUS AREAS FOR IMPROVEMENT:
${focusAreas.join('\n')}

INSTRUCTIONS:
1. Review the original toonplay
2. Identify specific issues in flagged categories
3. Make targeted improvements:
   - If Narrative Fidelity is weak: Restore missing story beats
   - If Visual Transformation is weak: Replace narration with visual descriptions
   - If Webtoon Pacing is weak: Adjust panel count, vary shot types
   - If Script Formatting is weak: Complete missing fields, enhance descriptions
4. Maintain all successful aspects
5. Do NOT fundamentally restructure if unnecessary

OUTPUT:
- improved_toonplay: Full revised toonplay
- changes_made: List of specific improvements
- addressed_categories: Categories that were targeted

CONSTRAINTS:
- Keep panel count 8-12
- Maintain source prose "soul"
- Follow all toonplay format requirements
```

### 5.3 Improvement Code

```typescript
export async function improveToonplay(
  originalToonplay: AiComicToonplayType,
  evaluation: AiToonplayEvaluationType,
  sourceScene: Scene
): Promise<AiToonplayImprovementType> {
  const client = createTextGenerationClient();

  // Identify focus areas (categories scoring < 3.0)
  const focusAreas: string[] = [];
  if (evaluation.category_scores.narrative_fidelity < 3.0) {
    focusAreas.push("Narrative Fidelity: Preserve story beats and emotional arc");
  }
  if (evaluation.category_scores.visual_transformation < 3.0) {
    focusAreas.push("Visual Transformation: Replace narration with visual descriptions");
  }
  if (evaluation.category_scores.webtoon_pacing < 3.0) {
    focusAreas.push("Webtoon Pacing: Adjust panel count and shot type variety");
  }
  if (evaluation.category_scores.script_formatting < 3.0) {
    focusAreas.push("Script Formatting: Complete missing fields and enhance descriptions");
  }

  const { system: systemPrompt, user: userPrompt } =
    promptManager.getPrompt(
      client.getProviderType(),
      "toonplay-improvement",
      {
        originalToonplay: JSON.stringify(originalToonplay, null, 2),
        evaluationReport: evaluation.final_report,
        focusAreas,
        recommendations: evaluation.recommendations,
      }
    );

  const improvement: AiToonplayImprovementType = await client.generateStructured(
    userPrompt,
    AiToonplayImprovementZodSchema,
    {
      systemPrompt,
      temperature: 0.7, // Same as initial generation
      maxTokens: 16384,
    }
  );

  return improvement;
}
```

---

## Part VI: Testing Strategies

### 6.1 Unit Tests

**Test File**: `__tests__/toonplay-evaluator.test.ts`

**Test Cases**:

```typescript
describe('Toonplay Evaluator', () => {
  it('should pass high-quality toonplay', async () => {
    const toonplay = createMockToonplay({
      totalPanels: 10,
      dialoguePercentage: 70,
      narrationPercentage: 3,
      shotTypeVariety: ['establishing_shot', 'wide_shot', 'medium_shot', 'close_up'],
    });

    const evaluation = await evaluateToonplay(toonplay, mockScene);

    expect(evaluation.passes).toBe(true);
    expect(evaluation.weighted_score).toBeGreaterThanOrEqual(3.0);
  });

  it('should fail toonplay with excessive narration', async () => {
    const toonplay = createMockToonplay({
      narrationPercentage: 60, // Way over 5% limit
    });

    const evaluation = await evaluateToonplay(toonplay, mockScene);

    expect(evaluation.passes).toBe(false);
    expect(evaluation.category_scores.visual_transformation).toBeLessThan(3.0);
  });

  it('should calculate metrics correctly', () => {
    const toonplay = createMockToonplay({
      totalPanels: 10,
      dialoguePanels: 7,
      narrationPanels: 2,
    });

    const metrics = calculateMetrics(toonplay);

    expect(metrics.dialogue_presence).toBe(70);
    expect(metrics.narration_percentage).toBe(20);
  });
});
```

### 6.2 Integration Tests

**Test File**: `tests/comic-generation.spec.ts` (Playwright)

**Test Scenarios**:

```typescript
test('Generate comic panels for scene', async ({ page }) => {
  // Login as writer
  await login(page, writer.email, writer.password);

  // Navigate to scene editor
  await page.goto(`http://localhost:3000/studio/edit/scene_${sceneId}`);

  // Click generate button
  await page.click('button:has-text("Generate Comic Panels")');

  // Wait for generation to complete
  await page.waitForSelector('text=Comic panels generated successfully', {
    timeout: 120000, // 2 minutes
  });

  // Verify panels were created
  const panelCount = await page.textContent('[data-testid="panel-count"]');
  expect(Number(panelCount)).toBeGreaterThanOrEqual(8);
  expect(Number(panelCount)).toBeLessThanOrEqual(12);

  // Verify comic status is draft
  const status = await page.textContent('[data-testid="comic-status"]');
  expect(status).toBe('draft');
});

test('Publish comic panels', async ({ page }) => {
  await login(page, writer.email, writer.password);

  // Navigate to scene with generated panels
  await page.goto(`http://localhost:3000/studio/edit/scene_${sceneId}`);

  // Click publish button
  await page.click('button:has-text("Publish Comic")');

  // Wait for success message
  await page.waitForSelector('text=Comic published successfully');

  // Verify status updated
  const status = await page.textContent('[data-testid="comic-status"]');
  expect(status).toBe('published');

  // Verify visible at /comics/[storyId]
  await page.goto(`http://localhost:3000/comics/${storyId}`);
  await expect(page.locator('[data-testid="comic-panel"]')).toHaveCount(
    Number(panelCount)
  );
});
```

### 6.3 Quality Benchmarking

**Benchmark Test**: Track evaluation scores over time

```typescript
// scripts/benchmark-toonplay-quality.ts

const results = [];

for (const scene of testScenes) {
  const toonplay = await convertSceneToToonplay({
    scene,
    story,
    characters,
    settings,
  });

  const evaluation = await evaluateToonplay(toonplay, scene);

  results.push({
    sceneId: scene.id,
    sceneLength: scene.content.length,
    panelCount: toonplay.total_panels,
    weightedScore: evaluation.weighted_score,
    passes: evaluation.passes,
    categoryScores: evaluation.category_scores,
    metrics: evaluation.metrics,
  });
}

// Calculate aggregate statistics
const averageScore = results.reduce((sum, r) => sum + r.weightedScore, 0) / results.length;
const passRate = results.filter(r => r.passes).length / results.length;

console.log(`Average Weighted Score: ${averageScore.toFixed(2)}`);
console.log(`Pass Rate: ${(passRate * 100).toFixed(1)}%`);
console.log(`Average Narration %: ${averageMetric(results, 'narration_percentage')}%`);
console.log(`Average Dialogue %: ${averageMetric(results, 'dialogue_presence')}%`);
```

---

## Conclusion

The comics evaluation system ensures quality through:

1. **4-Category Weighted Scoring**: Comprehensive quality assessment
2. **Automated Metrics**: Objective measurement of key criteria
3. **Iterative Improvement**: Targeted refinement of weak areas
4. **Production-Ready Output**: Only publish toonplay that meets standards

**Quality Targets**:
- 70-80% pass rate on first evaluation
- 90%+ pass rate after one improvement cycle
- Average weighted score: 3.2-3.5/5.0

**Next Steps**:
- See `comics-specification.md` for core concepts and data model
- See `comics-development.md` for API specifications and implementation
