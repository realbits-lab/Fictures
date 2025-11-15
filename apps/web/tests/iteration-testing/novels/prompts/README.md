# Novel Generation Prompt Versions

This directory contains versioned prompts for systematic A/B testing and iterative improvement of novel generation quality.

## Version History

### v1.0 (Baseline) - 2025-11-15

**Status**: Baseline established

**Location**: `src/lib/studio/generators/prompt-manager.ts` (lines 420-584)

**Results**:
- **Cyclic Structure**: 79% (⚠️ needs improvement)
- **Intrinsic Motivation**: 75% (⚠️ needs improvement)
- **Earned Consequence**: 85% (✅ passing)
- **Character Transformation**: 94% (✅ passing)
- **Emotional Resonance**: 87% (✅ passing)

**Primary Issue**: Part cycle coherence (2/4) - only 2 of 5 phases generated

**Test Data**: `results/v1.0/suite-2025-11-15T08-12-46-342Z.json`

---

### v1.1 (5-Phase Cycle Fix) - 2025-11-15

**Status**: Ready for A/B testing

**Location**: `prompts/v1.1/part-prompt.ts`

**Hypothesis**: "Adding explicit 5-phase cycle validation will increase part.cycleCoherence from 2/4 to 4/4"

**Changes from v1.0**:
1. **Added 5-Phase Cycle Output Validation section** - Explicit requirement and checklist for all 5 phases
2. **Updated user template** - Required structure with phase labels
3. **Added complete working example** - Full 5-phase cycle demonstration

**Expected Impact**:
- part.cycleCoherence: 2/4 → 4/4 (+2)
- Cyclic Structure: 79% → 92% (+13%)
- Intrinsic Motivation: 75% → 85% (+10%)

**Testing Command**:
```bash
pnpm tsx tests/iteration-testing/novels/ab-test.ts \
  --control v1.0 \
  --experiment v1.1 \
  --prompts "last-garden,broken-healer" \
  --sample-size 5
```

**Success Criteria**:
- ✅ part.cycleCoherence mean ≥3.5/4
- ✅ phasesCount = 5 in ≥80% of stories
- ✅ Cyclic Structure ≥85%
- ✅ p-value < 0.05

**Design Document**: `PART_PROMPT_V1.1_DESIGN.md`

---

## Prompt Versioning Strategy

### Version Naming Convention

`v{major}.{minor}` where:
- **Major version** (v1, v2, v3...): Fundamental architectural changes to prompt structure
- **Minor version** (v1.0, v1.1, v1.2...): Incremental improvements targeting specific metrics

### Development Workflow

1. **Baseline Test (v1.0)**
   - Run evaluation suite with current prompts
   - Identify lowest-scoring Core Principle
   - Document root cause

2. **Design New Version (v1.x)**
   - Create design document with hypothesis
   - Implement prompt changes in `prompts/v1.x/`
   - Define success criteria

3. **A/B Test**
   - Run parallel tests (control vs experiment)
   - Generate 5+ stories per version
   - Compare metrics statistically

4. **Analysis & Decision**
   - If successful (p < 0.05): Promote to default
   - If not: Analyze failure, iterate

5. **Iteration**
   - Target next lowest Core Principle
   - Repeat cycle

### File Organization

```
prompts/
├── README.md              # This file
├── v1.0/                  # Baseline prompts (reference only)
├── v1.1/                  # First iteration (5-phase cycle fix)
│   └── part-prompt.ts
├── v1.2/                  # Future iteration
└── v2.0/                  # Future major revision
```

### Prompt Types

Each version may include prompts for:
- **story**: Story foundation generation
- **part**: Part/act structure generation
- **chapter**: Chapter planning generation
- **scene**: Scene content generation

**Current focus**: Part prompt optimization (highest impact on Cyclic Structure and Intrinsic Motivation)

---

## Using Prompt Versions

### In Test Scripts

```typescript
import { partPromptV1_1 } from './prompts/v1.1/part-prompt';

// Override default prompt in test
const result = await generatePart({
  partNumber: 1,
  storyContext,
  customPrompt: partPromptV1_1  // Use v1.1 instead of v1.0
});
```

### In A/B Tests

```typescript
// A/B test automatically loads versions by name
const results = await runABTest({
  control: 'v1.0',      // Default prompts
  experiment: 'v1.1',   // Loads from prompts/v1.1/
  sampleSize: 5
});
```

### In Production

```typescript
// After validation, update prompt manager default
import { partPromptV1_1 } from '../tests/iteration-testing/novels/prompts/v1.1/part-prompt';

class PromptManager {
  prompts = {
    part: partPromptV1_1,  // Promote v1.1 to default
    // ...
  };
}
```

---

## Metrics Reference

### Core Principles (Target: ≥85%)

1. **Cyclic Structure** - Complete adversity-triumph cycles
2. **Intrinsic Motivation** - Character-driven choices
3. **Earned Consequence** - Causal payoffs
4. **Character Transformation** - Meaningful growth
5. **Emotional Resonance** - Gam-dong moments

### Evaluation Levels

- **Story**: moralFrameworkClarity, thematicCoherence, genreConsistency
- **Part**: cycleCoherence, conflictDefinitionClarity, earnedLuckTracking
- **Chapter**: singleCycleFocus, adversityConnection, stakesEscalation, resolutionAdversityTransition, seedTrackingCompleteness, narrativeMomentum
- **Scene**: wordCountCompliance, cycleAlignment, emotionalResonance

---

## Documentation

- **Iteration Strategy**: `ITERATION_STRATEGY.md` - 12-week improvement plan
- **Session Summary**: `SESSION_SUMMARY.md` - Implementation progress
- **Baseline Results**: `BASELINE_V1.0_RESULTS.md` - v1.0 analysis
- **v1.1 Design**: `PART_PROMPT_V1.1_DESIGN.md` - v1.1 design rationale

---

**Last Updated**: 2025-11-15 18:15 UTC
