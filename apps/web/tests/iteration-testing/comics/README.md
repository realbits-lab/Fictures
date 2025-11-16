# Comics Iteration Testing Infrastructure

This testing infrastructure implements a systematic approach to improving the comic panel generation system through data-driven prompt refinement and metric calibration.

## Overview

The comics iteration testing system evaluates comic panel generation using 4 weighted quality categories:

1. **Panel Quality** (30%) - Visual clarity, composition, character accuracy
2. **Narrative Coherence** (25%) - Story flow, panel sequence logic
3. **Technical Quality** (25%) - Format compliance, optimization
4. **Performance** (20%) - Generation time, success rate

**Passing Score**: 3.0/5.0 weighted average

## Directory Structure

```
tests/iteration-testing/comics/
├── config/                    # Configuration files
│   └── test-scenes.ts        # Test scene definitions
├── src/                       # Source code
│   ├── types.ts              # TypeScript type definitions
│   └── metrics-tracker.ts   # Metrics aggregation utilities
├── results/                   # Test results (gitignored)
│   ├── v1.0/                 # Results for prompt v1.0
│   ├── v1.1/                 # Results for prompt v1.1
│   └── ...                   # Additional versions
├── reports/                   # Generated reports (gitignored)
├── run-comic-tests.ts        # Main evaluation script
├── ab-test-comics.ts         # A/B testing script
└── README.md                 # This file
```

## Test Scenes

We use 5 standardized test scenes, each designed to test specific aspects:

| Scene ID | Name | Focus Areas | Challenge |
|----------|------|-------------|-----------|
| `action-sequence` | Action Sequence | Dynamic composition, clarity | Show action clearly across panels |
| `dialogue-heavy` | Dialogue Scene | Character expressions, layout | Balance dialogue with visuals |
| `emotional-beat` | Emotional Beat | Expression accuracy, mood | Capture emotional nuance |
| `establishing-shot` | Establishing Shot | Setting detail, atmosphere | Convey setting effectively |
| `climactic-moment` | Climactic Moment | Composition, impact | Create visual impact |

## Key Metrics

### Panel Quality (30% weight)

| Metric | Target | Threshold | Why It Matters |
|--------|--------|-----------|----------------|
| **Visual Clarity** | 4.0/5.0 | 3.0/5.0 | Clear, readable panels |
| **Composition Quality** | 4.0/5.0 | 3.0/5.0 | Professional composition |
| **Character Accuracy** | >90% | >85% | Characters match descriptions |
| **Expression Accuracy** | >90% | >85% | Expressions match scene emotion |

### Narrative Coherence (25% weight)

| Metric | Target | Threshold | Why It Matters |
|--------|--------|-----------|----------------|
| **Story Flow** | 4.0/5.0 | 3.0/5.0 | Logical panel sequence |
| **Panel Sequence Logic** | 4.0/5.0 | 3.0/5.0 | Clear progression |
| **Narrative Consistency** | >90% | >85% | Consistent with toonplay |

### Technical Quality (25% weight)

| Metric | Target | Threshold | Why It Matters |
|--------|--------|-----------|----------------|
| **Format Compliance** | 100% | 100% | Correct file format |
| **Aspect Ratio Accuracy** | ±0.5% | <1% | Correct panel dimensions |
| **Optimization Quality** | 4.0/5.0 | 3.0/5.0 | Efficient file sizes |
| **Variant Count** | 2 variants | Exactly 2 | Proper optimization |

### Performance (20% weight)

| Metric | Target | Threshold | Why It Matters |
|--------|--------|-----------|----------------|
| **Generation Time** | <10s/panel | <15s/panel | Fast generation |
| **Success Rate** | >95% | >90% | Reliable generation |
| **Batch Performance** | <2min/10panels | <3min/10panels | Efficient batch processing |

## Getting Started

### Prerequisites

1. Ensure the development server is running:
```bash
cd apps/web
dotenv --file .env.local run pnpm dev  # Port 3000
```

2. Ensure comic API is available:
```bash
# Test comic endpoint
curl http://localhost:3000/api/studio/scenes/{sceneId}/comic/generate -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Phase 1: Baseline Establishment

#### Step 1: Generate Baseline Comic Panels

Run the evaluation suite to generate and evaluate comic panels:

```bash
# Generate 5 comic sets for each of the 5 test scenes (25 total)
dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/comics/run-comic-tests.ts \
  --version v1.0 \
  --scenes "action-sequence,dialogue-heavy,emotional-beat,establishing-shot,climactic-moment" \
  --iterations 5 \
  --mode standard \
  --output results/v1.0/baseline.json
```

**Options:**
- `--version`: Prompt version to test (default: v1.0)
- `--scenes`: Comma-separated scene IDs (default: all 5)
- `--iterations`: Comic sets per scene (default: 5)
- `--mode`: Evaluation mode - quick|standard|thorough (default: standard)
- `--output`: Output file path

**Expected Output:**
- 25 comic sets generated (5 scenes × 5 iterations)
- Full evaluation for each comic set
- Results saved to `results/v1.0/baseline.json`
- Execution time: ~15-30 minutes for standard mode

#### Step 2: Analyze Baseline Metrics

The evaluation suite automatically:
- Aggregates metrics across all comic sets
- Identifies failure patterns
- Generates summary statistics

Review the output file for:
- Overall weighted scores
- Category-specific failures
- Performance metrics
- Top priority issues to address

### Phase 2: Prompt Optimization

#### Step 3: A/B Test Improvements

After identifying issues from baseline testing, create prompt refinements:

```bash
# Example: Test improvements to panel quality
dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/comics/ab-test-comics.ts \
  --control v1.0 \
  --experiment v1.1 \
  --scenes "action-sequence,emotional-beat" \
  --sample-size 5 \
  --hypothesis "Improve visual clarity from 3.2 to 3.8+"
```

**Options:**
- `--control`: Control version (baseline)
- `--experiment`: Experiment version (with improvements)
- `--scenes`: Test scenes to use
- `--sample-size`: Comic sets per version
- `--hypothesis`: What you expect to improve

**Expected Output:**
- Statistical comparison (t-test)
- Metric deltas (improvements and regressions)
- Recommendation: ADOPT | REVISE | REVERT
- Detailed markdown report

## Metrics Reference

### Critical Thresholds

| Metric | Excellent | Good | Needs Work | Critical |
|--------|-----------|------|------------|----------|
| **Weighted Score** | ≥4.0 | ≥3.5 | ≥3.0 | <3.0 |
| **Visual Clarity** | ≥4.0 | ≥3.5 | ≥3.0 | <3.0 |
| **Character Accuracy** | >95% | >90% | >85% | ≤85% |
| **Generation Time** | <8s/panel | <12s/panel | <15s/panel | ≥15s/panel |
| **Success Rate** | >98% | >95% | >90% | ≤90% |

## Evaluation Modes

- **`quick`**: Automated metrics only (~20 sec/comic set)
- **`standard`**: Balanced automated + AI (~2 min/comic set) **[Default]**
- **`thorough`**: Comprehensive analysis (~5 min/comic set)

Use `standard` for most testing, `thorough` for final validation, `quick` for rapid iteration.

## Best Practices

1. **Establish baseline first** - Run v1.0 tests before making changes
2. **Test one aspect at a time** - Isolate variables
3. **Use sufficient sample size** - Minimum 5 comic sets per version
4. **Check for regressions** - Don't improve one metric at expense of others
5. **Document everything** - Track hypotheses, changes, and decisions
6. **Wait for significance** - p-value < 0.05 before adopting changes

## Troubleshooting

### Issue: Comic API not responding

**Solution**: Ensure dev server running on port 3000
```bash
dotenv --file .env.local run pnpm dev
curl http://localhost:3000/api/studio/scenes/{sceneId}/comic/generate  # Should return 400 or 401
```

### Issue: Generation timeout

**Solution**: Check AI Server status
- Panel generation may take 8-15s per panel
- Check logs: `curl http://localhost:8000/health`

### Issue: Results not significant

**Solution**: Increase sample size
- Minimum 5 comic sets per version
- For smaller effects, use 10+ comic sets

## Next Steps

After setting up the infrastructure:

1. Complete Phase 1 baseline testing (5 scenes × 5 iterations = 25 comic sets)
2. Prioritize top 3 failure patterns (likely: panel quality, narrative coherence, performance)
3. Begin Phase 2 optimization cycles
4. Run monthly iteration cycles after initial optimization

For detailed methodology, see:
- `apps/web/docs/comics/comics-evaluation.md` - Metrics and evaluation framework
- `apps/web/docs/comics/comics-development.md` - API specifications and implementation
- `apps/web/docs/comics/comics-specification.md` - Core concepts and architecture

