# v1.1 Testing Plan - Complete Guide

## Date: 2025-11-15
## Status: Ready for Execution
## Servers: ✅ AI Server (port 8000) ✅ Web Server (port 3000)

---

## Executive Summary

This document provides a complete testing plan for validating the v1.1 part prompt improvements. The plan includes smoke testing, full A/B comparison, statistical analysis, and decision criteria.

**Hypothesis**: "Adding explicit 5-phase cycle validation will increase part.cycleCoherence from 2/4 to 4/4"

**Expected Impact**:
- part.cycleCoherence: 2/4 → 4/4 (+2.0)
- Cyclic Structure: 79% → 92% (+13%)
- Intrinsic Motivation: 75% → 85% (+10%)

---

## Test Plan Overview

| Phase | Duration | Stories | Purpose | Status |
|-------|----------|---------|---------|--------|
| **Phase 1: Smoke Test** | 2 min | 1 | Verify v1.1 loads correctly | 📋 Ready |
| **Phase 2: Control Group** | 25 min | 5 | Generate v1.0 baseline | 📋 Ready |
| **Phase 3: Experiment Group** | 25 min | 5 | Generate v1.1 test | 📋 Ready |
| **Phase 4: Statistical Analysis** | 5 min | - | Compare metrics | 📋 Ready |
| **Phase 5: Decision** | 10 min | - | ADOPT/REVISE/REVERT | 📋 Ready |

**Total Time**: ~70 minutes

---

## Phase 1: Smoke Test (2 minutes)

### Purpose
Verify that v1.1 prompt:
- Loads without errors
- Generates valid output
- Contains all 5 cycle phases

### Command

```bash
cd /home/web/GitHub/@dev.realbits/Fictures/apps/web

pnpm tsx tests/iteration-testing/novels/run-evaluation-suite.ts \
  --version v1.1 \
  --prompts "last-garden" \
  --iterations 1 \
  --mode quick \
  > logs/v1.1-smoke-test.log 2>&1 &

# Monitor progress
tail -f logs/v1.1-smoke-test.log
```

### Expected Output

**Console Logs Should Show**:
```
Generating part structure (version: v1.1)...
✓ Part generated successfully
```

**Generated Part Should Contain**:
```
CYCLE PHASE 1 - SETUP:
[content]

CYCLE PHASE 2 - ADVERSITY:
[content]

CYCLE PHASE 3 - VIRTUE:
[content]

CYCLE PHASE 4 - CONSEQUENCE:
[content]

CYCLE PHASE 5 - TRANSITION:
[content]
```

### Success Criteria

- ✅ Story generates without errors
- ✅ Console logs show `"version: v1.1"`
- ✅ Part characterArcs contains all 5 phase headings
- ✅ Evaluation completes successfully

### Validation Steps

1. **Check Generation Success**:
   ```bash
   grep "✓" logs/v1.1-smoke-test.log
   ```

2. **Verify Version Used**:
   ```bash
   grep "version: v1.1" logs/v1.1-smoke-test.log
   ```

3. **Check for Errors**:
   ```bash
   grep -i "error" logs/v1.1-smoke-test.log
   ```

4. **Verify 5 Phases Present**:
   ```bash
   # Get story ID
   STORY_ID=$(grep "Story generated:" logs/v1.1-smoke-test.log | grep -oP 'story_[a-zA-Z0-9_-]+')

   # Check part data
   psql $DATABASE_URL -c "SELECT \"characterArcs\" FROM parts WHERE story_id = '$STORY_ID';" | grep -c "CYCLE PHASE"
   ```
   Should output: 5 (or 10 if protagonist has all phases)

### If Smoke Test Fails

**Error: "Cannot find module"**:
- Check file exists: `ls -la tests/iteration-testing/novels/prompts/v1.1/part-prompt.ts`
- Verify require path in prompt-manager.ts

**Error: "Missing phases"**:
- Check if AI model followed instructions
- Review generated characterArcs output
- May need to refine prompt in v1.2

**Error: Database/API errors**:
- Not related to v1.1 prompt
- Check server logs
- Verify database connection

---

## Phase 2: Control Group - v1.0 Baseline (25 minutes)

### Purpose
Generate 5 stories with v1.0 (baseline) for statistical comparison.

### Command

```bash
cd /home/web/GitHub/@dev.realbits/Fictures/apps/web

pnpm tsx tests/iteration-testing/novels/run-evaluation-suite.ts \
  --version v1.0 \
  --prompts "last-garden,broken-healer" \
  --iterations 5 \
  --mode thorough \
  > logs/v1.0-control-group.log 2>&1 &

# Monitor progress
tail -f logs/v1.0-control-group.log
```

### Expected Duration
- 5 stories × 5 minutes = 25 minutes

### Output
- **Results File**: `results/v1.0/suite-[timestamp].json`
- **Stories**: 5 complete stories with evaluations
- **Metrics**: Full evaluation suite results

### Monitoring

```bash
# Check progress
grep "Story.*of 5" logs/v1.0-control-group.log

# Check completion
grep "TEST COMPLETE" logs/v1.0-control-group.log

# View summary
tail -50 logs/v1.0-control-group.log
```

### Expected Metrics (v1.0 Baseline)

Based on previous test (story_-Uiw58GxHJMSaLA2):

| Metric | Expected Mean | Std Dev | Min | Max |
|--------|---------------|---------|-----|-----|
| part.cycleCoherence | 2.0/4 | ±0.3 | 1.5 | 2.5 |
| phasesCount | 2 | ±0.5 | 2 | 3 |
| Cyclic Structure | 79% | ±3% | 75% | 82% |
| Intrinsic Motivation | 75% | ±3% | 72% | 78% |

---

## Phase 3: Experiment Group - v1.1 Test (25 minutes)

### Purpose
Generate 5 stories with v1.1 (experiment) for statistical comparison.

### Command

```bash
cd /home/web/GitHub/@dev.realbits/Fictures/apps/web

pnpm tsx tests/iteration-testing/novels/run-evaluation-suite.ts \
  --version v1.1 \
  --prompts "last-garden,broken-healer" \
  --iterations 5 \
  --mode thorough \
  > logs/v1.1-experiment-group.log 2>&1 &

# Monitor progress
tail -f logs/v1.1-experiment-group.log
```

### Expected Duration
- 5 stories × 5 minutes = 25 minutes

### Output
- **Results File**: `results/v1.1/suite-[timestamp].json`
- **Stories**: 5 complete stories with evaluations
- **Metrics**: Full evaluation suite results

### Expected Metrics (v1.1 Target)

| Metric | Expected Mean | Std Dev | Min | Max |
|--------|---------------|---------|-----|-----|
| part.cycleCoherence | 4.0/4 | ±0.2 | 3.5 | 4.0 |
| phasesCount | 5 | ±0 | 5 | 5 |
| Cyclic Structure | 92% | ±2% | 90% | 95% |
| Intrinsic Motivation | 85% | ±2% | 83% | 88% |

---

## Phase 4: Statistical Analysis (5 minutes)

### Purpose
Compare v1.0 vs v1.1 using statistical methods to determine if improvements are significant.

### Command

```bash
cd /home/web/GitHub/@dev.realbits/Fictures/apps/web

pnpm tsx tests/iteration-testing/novels/ab-test.ts \
  --control v1.0 \
  --experiment v1.1 \
  --prompts "last-garden,broken-healer" \
  --sample-size 5 \
  --hypothesis "Part cycle coherence increases to 4/4 with all 5 phases"
```

### Statistical Tests

**Welch's t-test** (for unequal variances):
- Null hypothesis (H₀): No difference between v1.0 and v1.1
- Alternative hypothesis (H₁): v1.1 > v1.0
- Significance level: α = 0.05
- Test statistic: t = (mean₁ - mean₀) / SE

**Metrics Analyzed**:
1. **Primary**: part.cycleCoherence (main hypothesis)
2. **Secondary**: Cyclic Structure, Intrinsic Motivation
3. **Guardrails**: Other Core Principles (no regression)

### Expected Output

```
═══════════════════════════════════════════════════════════════
                    A/B TEST RESULTS
═══════════════════════════════════════════════════════════════
  Control:        v1.0 (5 stories)
  Experiment:     v1.1 (5 stories)

  PRIMARY METRIC: part.cycleCoherence
  Control Mean:    2.0/4 (±0.3)
  Experiment Mean: 4.0/4 (±0.2)
  Delta:           +2.0 (100% improvement)
  t-statistic:     12.5
  p-value:         0.0001 ✓ SIGNIFICANT

  CORE PRINCIPLES:
  ✅ Cyclic Structure:        79% → 92% (+13%, p=0.002)
  ✅ Intrinsic Motivation:    75% → 85% (+10%, p=0.005)
  ✅ Earned Consequence:      85% → 86% (+1%, p=0.45)
  ✅ Character Transformation: 94% → 94% (0%, p=0.95)
  ✅ Emotional Resonance:     87% → 88% (+1%, p=0.50)

  RECOMMENDATION: ADOPT
  ✅ Hypothesis supported (p < 0.05)
  ✅ No regressions detected
  ✅ All 5 phases present in 100% of stories
═══════════════════════════════════════════════════════════════
```

### Success Criteria

**Hypothesis Supported If**:
- ✅ part.cycleCoherence mean ≥3.5/4 in v1.1
- ✅ p-value < 0.05 (statistically significant)
- ✅ phasesCount = 5 in ≥80% of stories
- ✅ Cyclic Structure ≥85%
- ✅ No regressions (all other metrics stay ≥ v1.0)

**Hypothesis Rejected If**:
- ❌ part.cycleCoherence < 3.5/4
- ❌ p-value ≥ 0.05 (not significant)
- ❌ phasesCount < 5 in majority
- ❌ Regressions in other Core Principles

---

## Phase 5: Decision (10 minutes)

### Decision Matrix

| Result | Metrics | Action | Timeline |
|--------|---------|--------|----------|
| **ADOPT** | All success criteria met | Promote v1.1 to default | Immediate |
| **REVISE** | Partial success, no regressions | Design v1.2 with refinements | 1-2 days |
| **REVERT** | No improvement or regressions | Keep v1.0, redesign approach | 1 week |

### ADOPT Decision (Best Case)

**Criteria**:
- ✅ p-value < 0.05
- ✅ part.cycleCoherence ≥3.5/4
- ✅ Cyclic Structure ≥85%
- ✅ No regressions

**Actions**:
1. Update prompt-manager.ts to use v1.1 as default
2. Archive v1.0 prompts for reference
3. Update BASELINE_V1.0_RESULTS.md with new metrics
4. Create BASELINE_V1.1_RESULTS.md
5. Move to v1.2 planning (character virtue evaluation)

**Code Change**:
```typescript
// In prompt-manager.ts
getPrompt(..., version?: string) {
    // Default to v1.1 now
    const actualVersion = version || "v1.1";

    if (actualVersion === "v1.1" && promptType === "part") {
        // Load v1.1 (now the default)
    }
    // ...
}
```

### REVISE Decision (Mixed Results)

**Criteria**:
- ⚠️ p-value = 0.05-0.10 (borderline)
- ⚠️ part.cycleCoherence = 3.0-3.5/4 (improved but not target)
- ⚠️ Some phases still missing occasionally

**Actions**:
1. Analyze which phases still missing
2. Identify prompt clarity issues
3. Design v1.2 with:
   - Simplified language
   - More concrete examples
   - Stricter validation checklist
4. Repeat A/B test (v1.1 vs v1.2)

### REVERT Decision (Failure)

**Criteria**:
- ❌ p-value > 0.10 (not significant)
- ❌ part.cycleCoherence ≤2.5/4 (no improvement)
- ❌ Regressions in other metrics

**Actions**:
1. Deep analysis of failure mode:
   - Did AI follow format but generate poor content?
   - Is the model incapable of following complex instructions?
   - Are the examples misleading?
2. Fundamental redesign:
   - Consider different prompt architecture
   - Evaluate if model limitations exist
   - Explore alternative approaches (few-shot, chain-of-thought)
3. Create v1.2 with different strategy

---

## Detailed Success Metrics

### Primary Hypothesis Metrics

| Metric | v1.0 Baseline | v1.1 Target | Threshold | Weight |
|--------|---------------|-------------|-----------|--------|
| **part.cycleCoherence** | 2.0/4 | 4.0/4 | ≥3.5/4 | Primary |
| **phasesCount** | 2 | 5 | 5 | Primary |
| **phasesPresent** | 2/5 phases | 5/5 phases | All 5 | Primary |

### Secondary Impact Metrics

| Metric | v1.0 Baseline | v1.1 Target | Threshold | Weight |
|--------|---------------|-------------|-----------|--------|
| **Cyclic Structure** | 79% | 92% | ≥85% | High |
| **Intrinsic Motivation** | 75% | 85% | ≥85% | High |

### Guardrail Metrics (No Regression)

| Metric | v1.0 Baseline | Acceptable Range | Status |
|--------|---------------|------------------|--------|
| **Earned Consequence** | 85% | ≥82% | Must maintain |
| **Character Transformation** | 94% | ≥82% | Must maintain |
| **Emotional Resonance** | 87% | ≥82% | Must maintain |
| **chapter.singleCycleFocus** | 4.0/4 | ≥3.5/4 | Must maintain |
| **scene.cycleAlignment** | 3.5/4 | ≥3.0/4 | Must maintain |

---

## Risk Mitigation

### Potential Issues & Solutions

**Issue 1: Model Doesn't Follow Structure**
- **Risk**: Medium
- **Impact**: High
- **Mitigation**: Example shows natural language acceptable
- **Fallback**: Increase sample size to 10 per version

**Issue 2: Statistical Power Too Low**
- **Risk**: Low
- **Impact**: Medium
- **Mitigation**: n=5 should be sufficient given large expected effect size
- **Fallback**: Increase to n=10 if p-value = 0.05-0.10

**Issue 3: Regressions in Other Metrics**
- **Risk**: Low
- **Impact**: High
- **Mitigation**: Careful prompt design preserves existing instructions
- **Fallback**: Revise v1.2 to fix regressions

**Issue 4: Generation Errors/Failures**
- **Risk**: Low
- **Impact**: Medium
- **Mitigation**: Servers tested and running
- **Fallback**: Regenerate failed stories

---

## Timeline & Schedule

### Day 1: Testing Execution

**Morning (9:00-12:00)**:
- ☐ 09:00-09:05: Smoke test (5 min)
- ☐ 09:05-09:30: Generate v1.0 control group (25 min)
- ☐ 09:30-09:55: Generate v1.1 experiment group (25 min)
- ☐ 09:55-10:00: Statistical analysis (5 min)
- ☐ 10:00-10:10: Review results, make decision (10 min)

**If ADOPT**:
- ☐ 10:10-10:30: Update code to use v1.1 as default
- ☐ 10:30-11:00: Update documentation
- ☐ 11:00-12:00: Plan v1.2 (character virtue)

**If REVISE**:
- ☐ 10:10-11:00: Analyze failure patterns
- ☐ 11:00-12:00: Design v1.2 improvements

**If REVERT**:
- ☐ 10:10-12:00: Deep analysis and fundamental redesign

### Day 2-7: Next Iteration

**ADOPT scenario** (v1.2 - Character Virtue):
- Day 2: Design v1.2 character evaluation
- Day 3-4: Implement and test
- Day 5: Decision

**REVISE scenario** (v1.2 - Refined Cycle):
- Day 2: Design v1.2 refinements
- Day 3-4: A/B test v1.1 vs v1.2
- Day 5: Decision

---

## Test Execution Checklist

### Pre-Test (Before Starting)

- ✅ AI Server running (port 8000)
- ✅ Web Server running (port 3000)
- ✅ Database accessible
- ✅ `.auth/user.json` has valid credentials
- ✅ Disk space available (>10GB)
- ✅ All documentation created
- ✅ Version parameter implementation complete

### During Test

- ☐ Monitor generation progress
- ☐ Watch for errors in logs
- ☐ Verify version used in console output
- ☐ Check database for generated data
- ☐ Backup results files after each phase

### Post-Test

- ☐ Save all results to results/ directory
- ☐ Create backup of database
- ☐ Generate statistical report
- ☐ Document decision and rationale
- ☐ Update SESSION_SUMMARY.md
- ☐ Archive logs

---

## Data Collection

### Metrics to Extract

**From Evaluation Results**:
```json
{
  "part": {
    "metrics": {
      "cycleCoherence": {
        "score": 4.0,
        "details": {
          "phasesPresent": ["setup", "adversity", "virtue", "consequence", "transition"],
          "phasesCount": 5,
          "allPhasesDistinct": true
        }
      }
    }
  }
}
```

**From Core Principle Scores**:
```json
{
  "corePrincipleScores": {
    "cyclicStructure": 0.92,
    "intrinsicMotivation": 0.85,
    "earnedConsequence": 0.86,
    "characterTransformation": 0.94,
    "emotionalResonance": 0.88
  }
}
```

### Data Analysis Tools

**Extract Metrics**:
```bash
# Get part.cycleCoherence scores
cat results/v1.1/suite-*.json | jq '.stories[].evaluationResults.part.metrics.cycleCoherence.score'

# Get phasesCount
cat results/v1.1/suite-*.json | jq '.stories[].evaluationResults.part.metrics.cycleCoherence.details.phasesCount'

# Get Core Principle scores
cat results/v1.1/suite-*.json | jq '.stories[].corePrincipleScores'
```

**Calculate Statistics**:
```python
import json
import numpy as np
from scipy import stats

# Load results
with open('results/v1.0/suite-latest.json') as f:
    v10_data = json.load(f)
with open('results/v1.1/suite-latest.json') as f:
    v11_data = json.load(f)

# Extract scores
v10_scores = [s['evaluationResults']['part']['metrics']['cycleCoherence']['score']
              for s in v10_data['stories']]
v11_scores = [s['evaluationResults']['part']['metrics']['cycleCoherence']['score']
              for s in v11_data['stories']]

# Welch's t-test
t_stat, p_value = stats.ttest_ind(v11_scores, v10_scores, equal_var=False)

print(f"v1.0 mean: {np.mean(v10_scores):.2f} (±{np.std(v10_scores):.2f})")
print(f"v1.1 mean: {np.mean(v11_scores):.2f} (±{np.std(v11_scores):.2f})")
print(f"t-statistic: {t_stat:.2f}")
print(f"p-value: {p_value:.4f}")
print(f"Significant: {'YES ✓' if p_value < 0.05 else 'NO ✗'}")
```

---

## Documentation Updates After Test

### If ADOPT

**Update Files**:
1. `SESSION_SUMMARY.md` - Add v1.1 adoption note
2. `BASELINE_V1.1_RESULTS.md` - Create new baseline doc
3. `prompt-manager.ts` - Change default to v1.1
4. `prompts/README.md` - Mark v1.1 as current
5. `ITERATION_STRATEGY.md` - Update Week 1 status to complete

### If REVISE

**Create Files**:
1. `PART_PROMPT_V1.2_DESIGN.md` - New design doc
2. `prompts/v1.2/part-prompt.ts` - Refined prompt

### If REVERT

**Document Files**:
1. `V1.1_FAILURE_ANALYSIS.md` - Why it failed
2. `V1.2_REDESIGN.md` - New approach

---

**Status**: ✅ Test Plan Complete - Ready for Execution

**Next Action**: Run Phase 1 (Smoke Test)

**Last Updated**: 2025-11-15 19:45 UTC
