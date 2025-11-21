# Iteration Testing Infrastructure

This testing infrastructure implements a systematic approach to improving the novel generation system through data-driven prompt refinement and metric calibration, based on the Adversity-Triumph Engine specifications.

## Overview

The iteration testing system follows a 12-week plan divided into 4 phases:

1. **Phase 1: Baseline Establishment** (Weeks 1-2)
2. **Phase 2: Core Principle Optimization** (Weeks 3-8)
3. **Phase 3: Metric Calibration** (Weeks 9-10)
4. **Phase 4: Production Rollout** (Weeks 11-12)

## Directory Structure

```
test-scripts/iteration-testing/
├── config/                 # Configuration files
│   └── test-prompts.ts    # Test prompt definitions
├── src/                    # Source code
│   ├── types.ts           # TypeScript type definitions
│   └── metrics-tracker.ts # Metrics aggregation utilities
├── results/               # Test results (gitignored)
│   ├── v1.0/             # Results for prompt v1.0
│   ├── v1.1/             # Results for prompt v1.1
│   └── ...               # Additional versions
├── reports/               # Generated reports (gitignored)
├── run-evaluation-suite.ts # Main evaluation script
├── ab-test.ts             # A/B testing script
├── chapter-prompt-test.ts # Chapter prompt iteration test
└── README.md             # This file
```

## Core Principles Tested

The system evaluates 5 Core Principles with 45+ metrics:

1. **Cyclic Structure** - Complete adversity-triumph cycles (9 metrics)
2. **Intrinsic Motivation** - Genuine virtuous actions (7 metrics)
3. **Earned Consequence** - Causal linking and temporal separation (11 metrics)
4. **Character Transformation** - Arc progression and growth (9 metrics)
5. **Emotional Resonance** - Gam-dong and moral elevation (14 metrics)

## Test Prompts

We use 4 standardized test prompts, each designed to test specific principles:

| Prompt ID | Name | Focus Principles |
|-----------|------|------------------|
| `last-garden` | The Last Garden | Emotional Resonance, Earned Consequence |
| `broken-healer` | The Broken Healer | Character Transformation, Intrinsic Motivation |
| `thiefs-gift` | The Thief's Gift | Earned Consequence, Cyclic Structure |
| `silent-painter` | The Silent Painter | Emotional Resonance, Setting Amplification |

## Getting Started

### Prerequisites

1. Ensure the development server is running:
```bash
cd apps/web
pnpm dev  # Should be on port 3000
```

2. Ensure evaluation APIs are available:
```bash
# Test that evaluation endpoints are working
curl http://localhost:3000/api/evaluation/story -X POST \
  -H "Content-Type: application/json" \
  -d '{"storyId": "test", "evaluationMode": "quick"}'
```

### Phase 1: Baseline Establishment

#### Step 1: Generate Baseline Stories

Run the evaluation suite to generate and evaluate 20 baseline stories:

```bash
# Generate 5 stories for each of the 4 test prompts (20 total)
pnpm tsx test-scripts/iteration-testing/run-evaluation-suite.ts \
  --version v1.0 \
  --prompts "last-garden,broken-healer,thiefs-gift,silent-painter" \
  --iterations 5 \
  --mode thorough \
  --output results/v1.0/baseline.json
```

**Options:**
- `--version`: Prompt version to test (default: v1.0)
- `--prompts`: Comma-separated prompt IDs (default: all)
- `--iterations`: Stories per prompt (default: 5)
- `--mode`: Evaluation mode - quick|standard|thorough (default: thorough)
- `--output`: Output file path

**Expected Output:**
- 20 stories generated (4 prompts × 5 iterations)
- Full evaluation for all 7 API endpoints per story
- Results saved to `results/v1.0/baseline.json`
- Execution time: ~60-90 minutes for thorough mode

#### Step 2: Analyze Baseline Metrics

The evaluation suite automatically:
- Aggregates metrics across all stories
- Identifies failure patterns
- Generates summary statistics

Review the output file for:
- Core Principle scores (0-100%)
- Failure patterns by category
- Top priority issues to address

### Phase 2: Core Principle Optimization

#### Step 3: A/B Test Prompt Improvements

After identifying issues from baseline testing, create prompt refinements and test them:

**For Part/Story-Level Prompts:**
```bash
# Example: Test virtue scene improvements
pnpm tsx tests/iteration-testing/novels/ab-test.ts \
  --control v1.0 \
  --experiment v1.1 \
  --prompts "last-garden" \
  --sample-size 5 \
  --hypothesis "Virtue scenes will increase from 683 to 900+ words"
```

**For Chapter-Level Prompts:**
```bash
# Example: Test chapter prompt improvements (causal linking, seed tracking)
pnpm tsx tests/iteration-testing/novels/chapter-prompt-test.ts \
  --control v1.0 \
  --experiment v1.1 \
  --prompts "last-garden" \
  --iterations 5 \
  --hypothesis "Adversity connection will improve from 2/4 to 4/4"
```

The chapter prompt test focuses specifically on chapter-level metrics:
- `adversityConnection`: Causal link to previous chapter
- `seedTrackingCompleteness`: Seed resolution tracking
- `singleCycleFocus`: One complete micro-cycle per chapter
- `stakesEscalation`: Progressive intensity
- `resolutionAdversityTransition`: Quality of chapter transitions
- `narrativeMomentum`: Forward movement

**Options:**
- `--control`: Control version (baseline)
- `--experiment`: Experiment version (with improvements)
- `--prompts`: Test prompts to use
- `--sample-size`: Stories per version
- `--hypothesis`: What you expect to improve

**Expected Output:**
- Statistical comparison (t-test p-value)
- Metric deltas (improvements and regressions)
- Recommendation: ADOPT | REVISE | REVERT
- Detailed markdown report

#### Step 4: Adopt Successful Changes

If A/B test shows improvements without regressions:

1. Update prompt version in code:
```typescript
// src/lib/studio/generators/prompt-manager.ts
export const CURRENT_PROMPT_VERSION = 'v1.1'; // Updated from v1.0
```

2. Document the change:
```typescript
// src/lib/studio/generators/prompt-versions.ts
export const PROMPT_VERSIONS = {
  'v1.1': {
    date: '2025-01-14',
    changes: ['Added ceremonial pacing to virtue scenes'],
    hypothesis: 'Increase word count and emotional depth',
    testResults: { /* A/B test results */ },
    decision: 'ADOPT'
  }
};
```

### Example Workflow

Here's a complete example testing cycle:

```bash
# 1. Run baseline test
pnpm tsx test-scripts/iteration-testing/run-evaluation-suite.ts \
  --version v1.0 \
  --prompts "last-garden" \
  --iterations 5

# 2. Review results (find virtue scenes too brief)
cat results/v1.0/suite-*.json | jq '.failurePatterns'

# 3. Create improved prompts (v1.1) with fixes
# ... edit prompt files ...

# 4. Run A/B test (for part/story prompts)
pnpm tsx tests/iteration-testing/novels/ab-test.ts \
  --control v1.0 \
  --experiment v1.1 \
  --prompts "last-garden" \
  --sample-size 5

# Or for chapter prompts specifically:
pnpm tsx tests/iteration-testing/novels/chapter-prompt-test.ts \
  --control v1.0 \
  --experiment v1.1 \
  --prompts "last-garden" \
  --iterations 5

# 5. Review A/B test results
cat results/ab-test-v1.0-vs-v1.1-*.json | jq '.comparison.recommendation'

# 6. If ADOPT, update production prompts
# ... update prompt-manager.ts ...
```

## Metrics Reference

### Key Metrics by Core Principle

#### Cyclic Structure (9 metrics)
- `cycleCompleteness`: All 4 phases present (100% target)
- `narrativeMomentum`: Perpetual forward pull (90% target)
- `stakesEscalation`: Progressive intensity (85% target)

#### Intrinsic Motivation (7 metrics)
- `genuineGoodnessPerception`: Non-transactional virtue (85% target)
- `moralElevationTrigger`: Audience inspiration (80% target)
- `strategicGoodDeeds`: Must be 0% (0% target)

#### Earned Consequence (11 metrics)
- `earnedLuckFeeling`: Karmic payoff (90% target)
- `temporalSeparation`: Pattern A timing (85% target)
- `deusExMachinaIncidents`: Must be 0% (0% target)

#### Character Transformation (9 metrics)
- `flawDrivenAdversity`: Internal drives external (90% target)
- `virtueConfrontsFlaw`: Direct confrontation (90% target)
- `earnedTransformation`: Genuine growth (85% target)

#### Emotional Resonance (14 metrics)
- `gamdongAchievement`: Profound moving (80% target)
- `sceneQualityScore`: Overall quality (3.5/4.0 target)
- `firstPassSuccessRate`: Quality on first try (85% target)

## Evaluation Modes

- **`quick`**: Automated metrics only (~2 min/story)
- **`standard`**: Balanced automated + AI (~5 min/story)
- **`thorough`**: Comprehensive analysis (~10 min/story)

Use `thorough` for baseline testing, `standard` for A/B tests, and `quick` for rapid iteration.

## Output Files

### Test Results (`results/`)
```json
{
  "version": "v1.0",
  "testDate": "2025-01-14T10:00:00Z",
  "stories": [...],
  "aggregatedMetrics": {
    "cyclicStructure": {...},
    "intrinsicMotivation": {...},
    // ...
  },
  "failurePatterns": [
    {
      "category": "emotional",
      "description": "gamdongAchievement failed",
      "frequency": 6,
      "priority": "high"
    }
  ]
}
```

### A/B Test Results
```json
{
  "config": {
    "controlVersion": "v1.0",
    "experimentVersion": "v1.1",
    "hypothesis": "..."
  },
  "comparison": {
    "deltas": {...},
    "pValue": 0.023,
    "recommendation": "ADOPT"
  }
}
```

## Best Practices

1. **Always establish baseline first** - Run v1.0 tests before making changes
2. **Test one principle at a time** - Isolate variables for clear results
3. **Use sufficient sample size** - Minimum 5 stories per version
4. **Check for regressions** - Don't improve one metric at expense of others
5. **Document everything** - Track hypotheses, changes, and decisions
6. **Wait for statistical significance** - p-value < 0.05 before adopting

## Troubleshooting

### Common Issues

**Issue**: Evaluation APIs not responding
- **Solution**: Ensure dev server is running on port 3000
- Check: `curl http://localhost:3000/api/evaluation/story`

**Issue**: Story generation fails
- **Solution**: Check database connection and API keys
- Verify: `.env.local` has required environment variables

**Issue**: Out of memory during testing
- **Solution**: Reduce iterations or use `quick` mode
- Alternative: Run prompts individually

**Issue**: Results not statistically significant
- **Solution**: Increase sample size or effect size
- Minimum: 5 stories per version for basic significance

## Next Steps

After setting up the infrastructure:

1. Complete Phase 1 baseline testing (Week 1-2)
2. Prioritize top 3 failure patterns
3. Begin Phase 2 optimization cycles (Week 3-8)
4. Run monthly iteration cycles after initial optimization

For detailed methodology, see:
- `apps/web/docs/novels/novels-evaluation.md` - Metrics and evaluation
- `apps/web/docs/novels/novels-development.md` - Iterative improvement methodology
- `apps/web/docs/novels/novels-specification.md` - Core principles and architecture