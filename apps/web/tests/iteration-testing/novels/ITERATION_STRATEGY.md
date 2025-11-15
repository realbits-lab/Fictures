# Novel Iteration Testing Strategy

## Current Status (Baseline v1.0)

**Test Results from 2025-11-15:**
- ✅ **Cyclic Structure**: 100% (4/4) - PASSING
- ⚠️ **Intrinsic Motivation**: 0% - FAILING  
- ⚠️ **Earned Consequence**: 0% - FAILING
- ⚠️ **Character Transformation**: 0% - FAILING
- ✅ **Emotional Resonance**: 80% (3.2/4) - PASSING

**Key Finding**: Part-level `cycleCoherence` failed (2/4) - only 2 of 5 cycle phases present.

## Root Cause Analysis

### Why Scores Are 0%

The `calculateCorePrincipleScores()` function looks for specific metrics that may not exist in evaluation results:

```javascript
// Current (incorrect) mapping:
- intrinsicMotivation ← characters.metrics.characterDepth (doesn't exist)
- earnedConsequence ← part.metrics.seedTracking (doesn't exist)  
- characterTransformation ← characters.metrics.characterDepth (doesn't exist)
```

**ACTION REQUIRED**: Fix metric mapping to use actual evaluation API metric names.

## Iteration Strategy: Prioritized Cascade Approach

### Phase 1: Fix Metric Calculation (IMMEDIATE)
**Goal**: Get accurate baseline scores

1. Examine all evaluation results for actual metric names
2. Update `calculateCorePrincipleScores()` to map correctly
3. Re-run baseline test with corrected calculations
4. Establish true baseline scores

**Timeline**: 1 day

### Phase 2: Identify Root Cause Failures (Week 1)
**Goal**: Understand which principle failures cascade to others

**Analysis Questions**:
- Does missing cycle phases (virtue, consequence, transition) cause Intrinsic Motivation failure?
- Does lack of seed tracking cause Earned Consequence failure?
- Are Character Transformation failures caused by missing character arc data?

**Method**:
1. Deep-dive into failed evaluations
2. Read generated story content
3. Map failure patterns to prompt deficiencies
4. Identify top 3 priority fixes

**Output**: Priority-ranked fix list

### Phase 3: Single-Principle Optimization (Weeks 2-8)

**Cycle**: 2 weeks per principle

#### Week 2-3: Fix Highest Priority Principle
**Example: If Part Cycle Coherence is root cause**

1. **Hypothesis**: "Adding explicit cycle phase instructions will increase part cycle coherence from 2/4 to 4/4"

2. **Create v1.1 prompts** (in `config/prompt-versions/v1.1/`):
   - Update part generation prompt with:
     - Explicit 5-phase structure requirement
     - Phase transition validation
     - Example of complete cycle

3. **A/B Test** (5 stories each):
   ```bash
   pnpm tsx tests/iteration-testing/novels/ab-test.ts \
     --control v1.0 \
     --experiment v1.1 \
     --prompts "last-garden,broken-healer" \
     --sample-size 5 \
     --hypothesis "Part cycle coherence will increase from 2/4 to 4/4"
   ```

4. **Decision Criteria**:
   - ✅ ADOPT if: p-value < 0.05 AND no regressions in other principles
   - ⚠️ REVISE if: Improvements but regressions detected
   - ❌ REVERT if: No improvement or significant regressions

5. **Document** in `prompt-versions.ts`:
   ```typescript
   'v1.1': {
     date: '2025-01-20',
     changes: ['Added 5-phase cycle structure to part prompt'],
     hypothesis: 'Increase part cycle coherence to 4/4',
     testResults: { pValue: 0.023, adopted: true },
     decision: 'ADOPT'
   }
   ```

#### Week 4-5: Fix Second Priority Principle
- Repeat cycle for next failing principle
- Use v1.1 as new baseline

#### Week 6-8: Fix Third Priority Principle  
- Continue iterative improvement
- Each version builds on previous

### Phase 4: Metric Calibration (Weeks 9-10)

**Goal**: Fine-tune passing thresholds

- Review all passing stories
- Identify false positives/negatives
- Adjust metric thresholds if needed
- Re-validate with new thresholds

### Phase 5: Production Rollout (Weeks 11-12)

**Goal**: Deploy best-performing prompt version

1. Run final validation test (20 stories)
2. Compare final version vs. v1.0 baseline
3. Update production prompts
4. Monitor production metrics

## Testing Commands

### Baseline Test (Current State)
```bash
pnpm tsx tests/iteration-testing/novels/run-evaluation-suite.ts \
  --version v1.0 \
  --prompts "last-garden,broken-healer,thiefs-gift,silent-painter" \
  --iterations 5 \
  --mode thorough
```

### A/B Test (Comparing Versions)
```bash
pnpm tsx tests/iteration-testing/novels/ab-test.ts \
  --control v1.0 \
  --experiment v1.1 \
  --prompts "last-garden" \
  --sample-size 5 \
  --hypothesis "Your hypothesis here"
```

### Quick Iteration (Single Prompt)
```bash
pnpm tsx tests/iteration-testing/novels/run-evaluation-suite.ts \
  --version v1.1 \
  --prompts "last-garden" \
  --iterations 1 \
  --mode standard
```

## Success Metrics

**Target State (End of Phase 3):**
- Cyclic Structure: ≥90% (currently 100%)
- Intrinsic Motivation: ≥85% (currently 0%)
- Earned Consequence: ≥90% (currently 0%)
- Character Transformation: ≥85% (currently 0%)
- Emotional Resonance: ≥80% (currently 80%)

**Quality Bar:**
- All Core Principles above threshold
- No regressions from v1.0 baseline
- Production-ready for deployment

## Next Immediate Actions

1. ✅ Fix `calculateCorePrincipleScores()` metric mapping
2. ✅ Re-run baseline test with correct calculations
3. ✅ Analyze evaluation results to identify root causes
4. ✅ Create priority-ranked fix list
5. ✅ Design v1.1 prompts targeting top priority issue
6. ✅ Run first A/B test (v1.0 vs v1.1)

---

**Last Updated**: 2025-11-15
**Current Version**: v1.0 (baseline)
**Next Version**: v1.1 (in development)
