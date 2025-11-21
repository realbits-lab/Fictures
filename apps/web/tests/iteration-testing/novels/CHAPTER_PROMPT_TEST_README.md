# Chapter Prompt Iteration Test

## Overview

The `chapter-prompt-test.ts` script is a focused iteration testing tool specifically designed to test and improve chapter generation prompts. Unlike the general `ab-test.ts` which tests entire stories, this script focuses exclusively on chapter-level metrics.

## Purpose

This test is designed to:
1. Compare different versions of chapter generation prompts (e.g., v1.0 vs v1.1)
2. Evaluate chapter-specific metrics (adversity connection, seed tracking, etc.)
3. Generate statistical comparisons with recommendations
4. Provide detailed reports on chapter-level improvements

## Key Differences from `ab-test.ts`

| Feature | `ab-test.ts` | `chapter-prompt-test.ts` |
|---------|--------------|-------------------------|
| **Scope** | Full story generation | Chapter generation only |
| **Metrics** | All 5 Core Principles | Chapter-level metrics only |
| **Generation** | Complete stories (story → characters → settings → parts → chapters → scenes) | Story foundation + 3 chapters |
| **Focus** | Overall story quality | Chapter-to-chapter connections, seed tracking, transitions |
| **Speed** | Slower (full story) | Faster (chapters only) |

## Chapter-Level Metrics Tested

The test evaluates these specific chapter metrics:

1. **`adversityConnection`** - Causal link from previous chapter (0-4 scale)
   - Tests if current chapter's adversity is a direct consequence of previous chapter's resolution
   - Target: 4/4 (explicit causal mechanism)

2. **`seedTrackingCompleteness`** - Seed resolution tracking (0-100%)
   - Tests if seeds from previous chapters are properly resolved
   - Target: 100% (all previous seeds tracked)

3. **`singleCycleFocus`** - One complete micro-cycle per chapter (0-4 scale)
   - Tests if chapter contains exactly one adversity-triumph cycle
   - Target: 4/4 (single focused cycle)

4. **`stakesEscalation`** - Progressive intensity increase (0-4 scale)
   - Tests if stakes/complexity increases from previous chapters
   - Target: 3-4/4 (clear escalation)

5. **`resolutionAdversityTransition`** - Quality of chapter transitions (0-3 scale)
   - Tests if chapter ending creates next chapter's adversity organically
   - Target: 3/3 (seamless transition)

6. **`narrativeMomentum`** - Forward movement (0-100%)
   - Tests if chapter maintains narrative drive
   - Target: 90%+ (strong momentum)

## Usage

### Basic Test

```bash
cd apps/web
pnpm tsx tests/iteration-testing/novels/chapter-prompt-test.ts \
  --control v1.0 \
  --experiment v1.1 \
  --iterations 5
```

### With Specific Prompts

```bash
pnpm tsx tests/iteration-testing/novels/chapter-prompt-test.ts \
  --control v1.0 \
  --experiment v1.1 \
  --prompts "last-garden,broken-healer" \
  --iterations 5
```

### With Hypothesis

```bash
pnpm tsx tests/iteration-testing/novels/chapter-prompt-test.ts \
  --control v1.0 \
  --experiment v1.1 \
  --hypothesis "Adversity connection will improve from 2/4 to 4/4" \
  --iterations 5
```

## Command-Line Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--control` | string | `v1.0` | Control prompt version (baseline) |
| `--experiment` | string | `v1.1` | Experiment prompt version (with improvements) |
| `--prompts` | string | `last-garden` | Comma-separated test prompt IDs |
| `--iterations` | number | `5` | Number of stories per version |
| `--hypothesis` | string | (auto) | What you expect to improve |
| `--output` | string | (auto) | Output file path |
| `--help` | boolean | `false` | Show help message |

## What It Does

1. **Generates Stories**: For each version (control and experiment):
   - Creates story foundation (story, characters, settings, part)
   - Generates 3 chapters using the specified prompt version
   - This allows testing chapter-to-chapter connections

2. **Evaluates Chapters**: For each generated chapter:
   - Calls `/api/evaluation/chapter` endpoint
   - Collects chapter-level metrics
   - Aggregates metrics across all chapters

3. **Compares Results**: 
   - Calculates metric deltas (improvements/regressions)
   - Performs statistical significance test (t-test)
   - Generates recommendation (ADOPT/REVISE/REVERT)

4. **Generates Reports**:
   - JSON file with full results
   - Markdown report with analysis

## Output Files

### JSON Results File

Saved to: `results/chapter-prompt-test-{control}-vs-{experiment}-{timestamp}.json`

```json
{
  "config": {
    "controlVersion": "v1.0",
    "experimentVersion": "v1.1",
    "testPrompts": ["last-garden"],
    "sampleSize": 5,
    "hypothesis": "..."
  },
  "control": [
    {
      "storyId": "...",
      "chapterIds": ["...", "...", "..."],
      "evaluations": [...],
      "metrics": {
        "adversityConnection": 2.5,
        "seedTrackingCompleteness": 75.0,
        ...
      }
    }
  ],
  "experiment": [...],
  "comparison": {
    "controlSnapshot": {...},
    "experimentSnapshot": {...},
    "deltas": {...},
    "pValue": 0.023,
    "recommendation": "ADOPT"
  }
}
```

### Markdown Report

Saved to: `results/chapter-prompt-test-{control}-vs-{experiment}-{timestamp}-report.md`

Includes:
- Hypothesis and test configuration
- Statistical significance (p-value)
- Recommendation with rationale
- Chapter-level metrics comparison table
- Top improvements and regressions

## Example Output

```
═══════════════════════════════════════════════════════════════
              CHAPTER PROMPT ITERATION TEST
═══════════════════════════════════════════════════════════════
  Control:        v1.0
  Experiment:     v1.1
  Test Prompts:   last-garden
  Iterations:     5 stories per version
  Total Stories:  10

  Hypothesis:     Adversity connection will improve from 2/4 to 4/4
═══════════════════════════════════════════════════════════════

► Generating Control Stories (v1.0)...
  ...

► Generating Experiment Stories (v1.1)...
  ...

► Analyzing Results...

═══════════════════════════════════════════════════════════════
                  CHAPTER PROMPT TEST RESULTS
═══════════════════════════════════════════════════════════════
  Control:        v1.0 (5 stories)
  Experiment:     v1.1 (5 stories)
  Statistical Significance: p=0.0234 ✓

  CHAPTER-LEVEL METRICS:
  • adversityConnection: 2.50 → 3.80 (+52.0%)
  • seedTrackingCompleteness: 75.00 → 92.00 (+22.7%)
  • singleCycleFocus: 3.20 → 3.60 (+12.5%)
  • stakesEscalation: 2.80 → 3.20 (+14.3%)
  • resolutionAdversityTransition: 2.00 → 2.80 (+40.0%)
  • narrativeMomentum: 82.00 → 88.00 (+7.3%)

  RECOMMENDATION: ADOPT
  ✅ Experiment shows significant improvement

  Total Time:     45.2 minutes
  Results Saved:  results/chapter-prompt-test-v1.0-vs-v1.1-2025-01-15T10-30-00.json
═══════════════════════════════════════════════════════════════
```

## When to Use This Test

Use `chapter-prompt-test.ts` when:

✅ You're specifically improving chapter generation prompts
✅ You want to test chapter-to-chapter connections
✅ You're focusing on seed tracking or causal linking
✅ You need faster iteration (chapters only, not full stories)
✅ You want detailed chapter-level metric analysis

Use `ab-test.ts` when:

✅ You're testing part or story-level prompts
✅ You want to evaluate full story quality
✅ You need comprehensive Core Principle scores
✅ You're testing end-to-end story generation

## Prerequisites

1. **Development Server Running**:
   ```bash
   cd apps/web
   pnpm dev  # Should be on port 3000
   ```

2. **Evaluation APIs Available**:
   - `/api/evaluation/chapter` endpoint must be working
   - Test with: `curl http://localhost:3000/api/evaluation/chapter`

3. **Authentication Setup**:
   - `.auth/user.json` file with writer profile API key
   - Required for story generation

## Tips for Effective Testing

1. **Start with Baseline**: Always test v1.0 first to establish baseline metrics
2. **Focus on One Metric**: Target specific improvements (e.g., adversity connection)
3. **Use Multiple Prompts**: Test with different story types to ensure robustness
4. **Check for Regressions**: Don't improve one metric at expense of others
5. **Statistical Significance**: Wait for p-value < 0.05 before adopting changes

## Integration with Prompt Versioning

The test works with the prompt versioning system:

1. **Control Version**: Uses default v1.0 chapter prompt (or specified version)
2. **Experiment Version**: Loads from `src/lib/studio/prompts/{version}/chapter-prompt.js`

To create a new chapter prompt version:

1. Create file: `src/lib/studio/prompts/v1.2/chapter-prompt.js`
2. Export: `exports.chapterPromptV1_2 = { system: "...", userTemplate: "..." }`
3. Update `prompt-manager.ts` to support v1.2
4. Test with: `--experiment v1.2`

## Next Steps

After running the test:

1. **Review Results**: Check JSON and markdown report
2. **Analyze Metrics**: Identify which metrics improved/regressed
3. **Make Decision**: Follow recommendation (ADOPT/REVISE/REVERT)
4. **Document Changes**: Update prompt version documentation
5. **Iterate**: If REVISE, refine prompt and test again

For more information, see:
- `README.md` - General iteration testing guide
- `ab-test.ts` - Full story A/B testing
- `run-evaluation-suite.ts` - Baseline evaluation suite

