

# Toonplay Iteration Testing Infrastructure

This testing infrastructure implements a systematic approach to improving the toonplay generation system through data-driven prompt refinement and metric calibration.

## Overview

The toonplay iteration testing system evaluates novel-to-webtoon adaptations using 4 weighted quality categories:

1. **Narrative Fidelity** (20%) - Story essence preserved
2. **Visual Transformation** (30%) - Show don't tell
3. **Webtoon Pacing** (30%) - Thumb-scroll optimized
4. **Script Formatting** (20%) - Production-ready

**Passing Score**: 3.0/5.0 weighted average

## Directory Structure

```
tests/iteration-testing/toonplay/
├── config/                    # Configuration files
│   └── test-scenes.ts        # Test scene definitions
├── src/                       # Source code
│   ├── types.ts              # TypeScript type definitions
│   └── metrics-tracker.ts    # Metrics aggregation utilities
├── results/                   # Test results (gitignored)
│   ├── v1.0/                 # Results for prompt v1.0
│   ├── v1.1/                 # Results for prompt v1.1
│   └── ...                   # Additional versions
├── reports/                   # Generated reports (gitignored)
├── run-toonplay-tests.ts     # Main evaluation script
├── ab-test-toonplay.ts       # A/B testing script
└── README.md                 # This file
```

## Test Scenes

We use 5 standardized test scenes, each designed to test specific aspects:

| Scene ID | Name | Focus Areas | Challenge |
|----------|------|-------------|-----------|
| `emotional-moment` | The Revelation | Internal emotion externalization | Show internal feelings visually |
| `action-sequence` | The Chase | Action clarity, shot variety | Maintain clear action flow |
| `dialogue-heavy` | The Confession | Dialogue distribution, expressions | Balance 70% dialogue with visuals |
| `setting-atmosphere` | The Abandoned Library | Establishing shots, atmosphere | Build mood through visuals |
| `mixed-elements` | The Decision | Scene variety, tension | Balance multiple story elements |

## Key Metrics

### Content Proportions (Primary Focus)

| Metric | Target | Threshold | Why It Matters |
|--------|--------|-----------|----------------|
| **Narration %** | <5% | <10% | Webtoons show, don't tell |
| **Internal Monologue %** | <10% | <15% | Strategic use only for pivotal moments |
| **Dialogue Presence** | ~70% | 60-80% | Dialogue drives webtoon engagement |

### Quality Categories (Weighted)

| Category | Weight | Target | Focus |
|----------|--------|--------|-------|
| **Narrative Fidelity** | 20% | 4.0/5.0 | Story essence preserved |
| **Visual Transformation** | 30% | 4.0/5.0 | Show don't tell success |
| **Webtoon Pacing** | 30% | 4.0/5.0 | Thumb-scroll optimization |
| **Script Formatting** | 20% | 4.0/5.0 | Production readiness |

### Panel Quality

| Metric | Target | Method |
|--------|--------|--------|
| **Panel Count** | 8-12 | Automated |
| **Description Length** | 200-400 chars | Automated |
| **Dialogue Length** | ≤150 chars/bubble | Automated |
| **Shot Variety** | 5+ types | Automated |

## Getting Started

### Prerequisites

1. Ensure the development server is running:
```bash
cd apps/web
dotenv --file .env.local run pnpm dev  # Port 3000
```

2. Ensure toonplay API is available:
```bash
# Test toonplay endpoint
curl http://localhost:3000/studio/api/toonplay -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"sceneId": "test-scene-id", "evaluationMode": "standard"}'
```

3. Setup authentication:
```bash
# Create test users with API keys
dotenv --file .env.local run pnpm exec tsx scripts/setup-auth-users.ts
```

### Phase 1: Baseline Establishment

#### Step 1: Generate Baseline Toonplays

Run the evaluation suite to generate and evaluate toonplays:

```bash
# Generate 5 toonplays for each of the 5 test scenes (25 total)
dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/toonplay/run-toonplay-tests.ts \
  --version v1.0 \
  --scenes "emotional-moment,action-sequence,dialogue-heavy,setting-atmosphere,mixed-elements" \
  --iterations 5 \
  --mode standard \
  --output results/v1.0/baseline.json
```

**Options:**
- `--version`: Prompt version to test (default: v1.0)
- `--scenes`: Comma-separated scene IDs (default: all 5)
- `--iterations`: Toonplays per scene (default: 5)
- `--mode`: Evaluation mode - quick|standard|thorough (default: standard)
- `--output`: Output file path

**Expected Output:**
- 25 toonplays generated (5 scenes × 5 iterations)
- Full evaluation for each toonplay
- Results saved to `results/v1.0/baseline.json`
- Execution time: ~60-75 minutes for standard mode (3min/toonplay × 25)

#### Step 2: Analyze Baseline Metrics

The evaluation suite automatically:
- Aggregates metrics across all toonplays
- Identifies failure patterns
- Generates summary statistics

Review the output file for:
- Overall weighted scores
- Content proportion compliance rates
- Category-specific failures
- Top priority issues to address

### Phase 2: Prompt Optimization

#### Step 3: A/B Test Improvements

After identifying issues from baseline testing, create prompt refinements:

```bash
# Example: Test improvements to dialogue distribution
dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/toonplay/ab-test-toonplay.ts \
  --control v1.0 \
  --experiment v1.1 \
  --scenes "dialogue-heavy,mixed-elements" \
  --sample-size 5 \
  --hypothesis "Improve dialogue presence from 65% to 70%"
```

**Options:**
- `--control`: Control version (baseline)
- `--experiment`: Experiment version (with improvements)
- `--scenes`: Test scenes to use
- `--sample-size`: Toonplays per version
- `--hypothesis`: What you expect to improve

**Expected Output:**
- Statistical comparison (t-test)
- Metric deltas (improvements and regressions)
- Recommendation: ADOPT | REVISE | REVERT
- Detailed markdown report

#### Step 4: Adopt Successful Changes

If A/B test shows improvements without regressions:

1. Update prompt version in code:
```typescript
// src/lib/studio/generators/prompt-manager.ts
// Update toonplay prompt with v1.1 improvements
```

2. Document the change:
```typescript
// tests/iteration-testing/toonplay/prompt-versions.ts
export const TOONPLAY_PROMPT_VERSIONS = {
  'v1.1': {
    date: '2025-01-14',
    changes: ['Emphasized "show, don't tell" for internal emotions'],
    hypothesis: 'Reduce narration from 8% to <5%',
    targetMetrics: ['narrationPercentage', 'visualTransformation'],
    testResults: {
      avgScore: 3.4, // Up from 3.1
      improvements: ['narrationPercentage', 'visualTransformation'],
      regressions: []
    },
    decision: 'ADOPTED'
  }
};
```

## Example Workflow

```bash
# 1. Run baseline test
dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/toonplay/run-toonplay-tests.ts \
  --version v1.0 \
  --scenes "emotional-moment" \
  --iterations 5

# 2. Review results (find narration too high)
cat results/v1.0/*.json | jq '.aggregatedMetrics.averageNarrationPercentage'
# Output: 8.2% (target: <5%)

# 3. Create improved prompts (v1.1) with fixes
# Edit src/lib/studio/generators/prompt-manager.ts
# Add: "CRITICAL: Externalize ALL internal states through visual actions and expressions"

# 4. Run A/B test
dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/toonplay/ab-test-toonplay.ts \
  --control v1.0 \
  --experiment v1.1 \
  --scenes "emotional-moment" \
  --sample-size 5

# 5. Review A/B test results
cat results/ab-test-v1.0-vs-v1.1-*.json | jq '.comparison.recommendation'
# Output: "ADOPT"

# 6. If ADOPT, update production prompts and document decision
```

## Metrics Reference

### Critical Thresholds

| Metric | Excellent | Good | Needs Work | Critical |
|--------|-----------|------|------------|----------|
| **Weighted Score** | ≥4.0 | ≥3.5 | ≥3.0 | <3.0 |
| **Narration %** | <3% | <5% | <8% | ≥8% |
| **Internal Monologue %** | <5% | <10% | <12% | ≥12% |
| **Dialogue Presence** | 68-72% | 65-75% | 60-80% | <60% or >80% |
| **Category Scores** | ≥4.0 | ≥3.5 | ≥3.0 | <3.0 |

### Content Proportion Targets

Based on toonplay specification:
- **Dialogue**: ~70% of panels (7 out of 10)
- **Visual Action**: ~30% (shown, not told)
- **Narration**: <5% (0-1 panels, time/location markers only)
- **Internal Monologue**: <10% (1-2 panels, strategic pivotal moments)

### Shot Type Distribution (10 panels)

Ideal distribution for varied visual grammar:
- 1 establishing_shot (set scene)
- 2-3 wide_shot (context)
- 3-5 medium_shot (main action)
- 2-3 close_up (emotion)
- 0-1 extreme_close_up (critical moments)
- 0-1 special angles (over_shoulder, dutch_angle)

## Evaluation Modes

- **`quick`**: Automated metrics only (~30 sec/toonplay)
- **`standard`**: Balanced automated + AI (~3 min/toonplay) **[Default]**
- **`thorough`**: Comprehensive analysis (~5 min/toonplay)

Use `standard` for most testing, `thorough` for final validation, `quick` for rapid iteration.

## Common Failure Patterns

### Pattern 1: Excessive Narration (Critical)

**Symptoms**: Narration >8%, low Visual Transformation scores

**Cause**: AI defaults to telling internal states instead of showing

**Fix**: Update prompt with:
```
CRITICAL RULE: NO internal narration except time/location markers.
Transform ALL internal states into:
- Body language (shoulders slump, hands clench)
- Facial expressions (eyes widen, jaw tightens)
- Environmental reactions (rain intensifies, shadows deepen)
```

### Pattern 2: Insufficient Dialogue (High Priority)

**Symptoms**: Dialogue presence <60%, high narration/internal monologue

**Cause**: Over-reliance on narration to convey story

**Fix**: Update prompt with:
```
TARGET: 70% of panels must have character dialogue.
Dialogue DRIVES webtoon engagement. Convert narration to dialogue wherever possible.
```

### Pattern 3: Weak Visual Transformation (High Priority)

**Symptoms**: Visual Transformation <3.5, telling not showing

**Cause**: Insufficient visual detail in panel descriptions

**Fix**: Enhance panel description requirements:
```
Each panel description (200-400 chars) must include:
- Specific body language
- Detailed facial expressions
- Environmental mood elements
- Character positioning and relationship
```

### Pattern 4: Poor Pacing (Medium Priority)

**Symptoms**: Webtoon Pacing <3.5, uneven panel distribution

**Cause**: Panels don't follow build-peak-release rhythm

**Fix**: Add pacing guidance:
```
PACING RHYTHM (thumb-scroll optimization):
- Setup panels: Establish context (wide shots)
- Build panels: Increase tension (medium shots)
- Peak panel: Emotional climax (close-up/extreme close-up)
- Release panels: Emotional aftermath (medium/wide)
- Transition: Bridge to next beat
```

## Output Files

### Test Results (`results/`)

```json
{
  "version": "v1.0",
  "testDate": "2025-01-14T10:00:00Z",
  "toonplays": [...],
  "aggregatedMetrics": {
    "averageWeightedScore": 3.2,
    "passRate": 0.72,
    "averageNarrationPercentage": 8.2,
    "averageDialoguePresence": 65.4,
    "categoryAverages": {
      "narrativeFidelity": 3.8,
      "visualTransformation": 3.1,
      "webtoonPacing": 3.3,
      "scriptFormatting": 3.6
    }
  },
  "failurePatterns": [
    {
      "category": "proportion",
      "description": "Excessive narration (>5%)",
      "frequency": 18,
      "priority": "critical"
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
    "hypothesis": "Reduce narration to <5%"
  },
  "comparison": {
    "deltas": {
      "narrationPercentage": -3.5,
      "visualTransformation": +0.4
    },
    "statisticalSignificance": {
      "pValue": 0.012,
      "confidenceLevel": 0.95
    },
    "recommendation": "ADOPT"
  }
}
```

## Best Practices

1. **Establish baseline first** - Run v1.0 before making changes
2. **Test one aspect at a time** - Isolate variables (e.g., narration fix only)
3. **Use sufficient sample size** - Minimum 5 toonplays per version
4. **Check for regressions** - Don't fix narration at expense of dialogue
5. **Document everything** - Track hypotheses, changes, and decisions
6. **Wait for significance** - p-value < 0.05 before adopting changes

## Troubleshooting

### Issue: Toonplay API not responding

**Solution**: Ensure dev server running on port 3000
```bash
dotenv --file .env.local run pnpm dev
curl http://localhost:3000/studio/api/toonplay  # Should return 400 or 401
```

### Issue: Authentication failures

**Solution**: Setup test users with API keys
```bash
dotenv --file .env.local run pnpm exec tsx scripts/setup-auth-users.ts
cat .auth/user.json | jq '.develop.profiles.writer.apiKey'
```

### Issue: Toonplay generation timeout

**Solution**: Increase timeout or use quick mode
- AI Server may be slow (1-2 min for structured output)
- Check AI Server logs: `curl http://localhost:8000/health`

### Issue: Results not significant

**Solution**: Increase sample size
- Minimum 5 toonplays per version
- For smaller effects, use 10+ toonplays

## Next Steps

After setting up the infrastructure:

1. Complete Phase 1 baseline testing (5 scenes × 5 iterations = 25 toonplays)
2. Prioritize top 3 failure patterns (likely: narration, dialogue, visual transformation)
3. Begin Phase 2 optimization cycles
4. Run monthly iteration cycles after initial optimization

For detailed methodology, see:
- `apps/web/docs/toonplay/toonplay-evaluation.md` - Metrics and evaluation framework
- `apps/web/docs/toonplay/toonplay-development.md` - Prompts and implementation
- `apps/web/docs/toonplay/toonplay-specification.md` - Core principles and visual grammar
