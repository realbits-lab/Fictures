# Toonplay Iteration Testing - Setup Complete ✅

**Date**: November 14, 2024
**Status**: Infrastructure Ready for Testing

---

## ✅ Completed Setup

### 1. Directory Structure Created

```
tests/iteration-testing/toonplay/
├── config/
│   └── test-scenes.ts          # 5 standardized test scenes ✅
├── src/
│   └── types.ts                # TypeScript definitions ✅
├── results/
│   └── v1.0/                   # Ready for baseline results
├── reports/                     # Ready for generated reports
└── README.md                    # Complete documentation ✅
```

### 2. Test Scenes Configured (5 Scenarios)

| Scene ID | Name | Focus | Challenge |
|----------|------|-------|-----------|
| `emotional-moment` | The Revelation | Internal emotion externalization | Show internal feelings visually |
| `action-sequence` | The Chase | Action clarity, shot variety | Maintain clear action flow |
| `dialogue-heavy` | The Confession | Dialogue distribution | Balance 70% dialogue with visuals |
| `setting-atmosphere` | The Abandoned Library | Atmosphere building | Build mood through visuals |
| `mixed-elements` | The Decision | Comprehensive test | Balance all story elements |

### 3. Testing Framework Defined

**Based on novels iteration testing methodology:**

- **Phase 1**: Baseline Establishment (5 scenes × 5 iterations = 25 toonplays)
- **Phase 2**: Prompt Optimization (A/B testing with statistical analysis)
- **Phase 3**: Metric Calibration (Fine-tune evaluation thresholds)
- **Phase 4**: Production Rollout (Deploy improved prompts)

### 4. Key Metrics Tracked

#### Content Proportions (Primary Focus)
- Narration %: Target <5%
- Internal Monologue %: Target <10%
- Dialogue Presence: Target ~70%

#### Quality Categories (Weighted)
- Narrative Fidelity (20%): Story essence preserved
- Visual Transformation (30%): Show don't tell
- Webtoon Pacing (30%): Thumb-scroll optimized
- Script Formatting (20%): Production-ready

#### Panel Quality
- Panel Count: 8-12 target
- Description Length: 200-400 chars
- Dialogue Length: ≤150 chars/bubble
- Shot Variety: 5+ types

---

## 🚀 Next Steps to Run Tests

### Step 1: Create Test Runner Script

```bash
# File to create: tests/iteration-testing/toonplay/run-toonplay-tests.ts
```

**Required functionality:**
1. Load test scenes from `config/test-scenes.ts`
2. Generate stories for each scene (using novels API)
3. Generate toonplays for each scene
4. Evaluate each toonplay
5. Aggregate metrics
6. Identify failure patterns
7. Save results to JSON

**Implementation pattern**: Follow `tests/iteration-testing/run-evaluation-suite.ts` structure

### Step 2: Create A/B Test Script

```bash
# File to create: tests/iteration-testing/toonplay/ab-test-toonplay.ts
```

**Required functionality:**
1. Run control version (v1.0)
2. Run experiment version (v1.1)
3. Compare metrics statistically
4. Calculate deltas (improvements/regressions)
5. Recommend: ADOPT | REVISE | REVERT

**Implementation pattern**: Follow `tests/iteration-testing/ab-test.ts` structure

### Step 3: Create Metrics Tracker

```bash
# File to create: tests/iteration-testing/toonplay/src/metrics-tracker.ts
```

**Required functionality:**
1. Aggregate metrics across multiple toonplays
2. Calculate averages and compliance rates
3. Identify failure patterns
4. Generate summary statistics

**Implementation pattern**: Follow `tests/iteration-testing/src/metrics-tracker.ts` structure

---

## 📊 Baseline Testing Plan

### Execution Plan

```bash
# 1. Generate 25 baseline toonplays (5 scenes × 5 iterations)
dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/toonplay/run-toonplay-tests.ts \
  --version v1.0 \
  --scenes "emotional-moment,action-sequence,dialogue-heavy,setting-atmosphere,mixed-elements" \
  --iterations 5 \
  --mode standard \
  --output results/v1.0/baseline.json

# Expected time: ~75 minutes (3 min/toonplay × 25)
```

### Expected Baseline Results

Based on current toonplay system:

**Predicted Scores:**
- Weighted Score: 3.0-3.5 (passing threshold: 3.0)
- Pass Rate: 70-80%
- Narration %: 5-8% (target: <5%)
- Dialogue Presence: 65-70% (target: ~70%)

**Predicted Failure Patterns:**
1. **Excessive Narration** (Critical) - Likely 8-12% narration vs. <5% target
2. **Weak Visual Transformation** (High) - Telling not showing
3. **Insufficient Dialogue** (Medium) - Below 70% target
4. **Uneven Pacing** (Medium) - Not following build-peak-release

### Analysis Steps

```bash
# 1. View aggregated metrics
cat results/v1.0/baseline.json | jq '.aggregatedMetrics'

# 2. Check failure patterns
cat results/v1.0/baseline.json | jq '.failurePatterns'

# 3. Identify top priority issues
cat results/v1.0/baseline.json | jq '.failurePatterns | sort_by(.priority) | reverse'
```

---

## 🔧 Prompt Optimization Strategy

### Priority 1: Fix Excessive Narration (Critical)

**Current Issue**: Likely 8% narration (target: <5%)

**Hypothesis**: Add explicit "show, don't tell" guidance

**Proposed Prompt Changes (v1.1)**:
```typescript
// src/lib/studio/generators/prompt-manager.ts - toonplay prompt

// ADD THIS CRITICAL RULE:
"CRITICAL: NO internal narration except time/location markers.
Transform ALL internal states into VISUAL actions:
- Body language: shoulders slump, fists clench, posture shifts
- Facial expressions: eyes widen, jaw tightens, brow furrows
- Environmental reactions: rain intensifies, shadows deepen, wind picks up

Examples:
❌ BAD: 'Sarah felt overwhelmed with guilt'
✅ GOOD: 'Sarah's hands trembled. She pressed them against her temples, eyes squeezed shut.'"
```

**A/B Test Plan**:
```bash
dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/toonplay/ab-test-toonplay.ts \
  --control v1.0 \
  --experiment v1.1 \
  --scenes "emotional-moment,mixed-elements" \
  --sample-size 5 \
  --hypothesis "Reduce narration from 8% to <5%"
```

**Success Criteria**:
- Narration drops to <5%
- Visual Transformation score increases to ≥3.5
- No regression in other metrics
- p-value < 0.05

### Priority 2: Improve Dialogue Distribution (High)

**Current Issue**: Likely 65% dialogue (target: ~70%)

**Hypothesis**: Emphasize dialogue-driven panels

**Proposed Prompt Changes (v1.2)**:
```typescript
// ADD THIS EMPHASIS:
"TARGET: 70% of panels (7 out of 10) MUST have character dialogue.
Dialogue DRIVES webtoon engagement.

Convert narration to dialogue wherever possible:
❌ BAD: 'He wondered if she would forgive him'
✅ GOOD: 'Do you think she'll forgive me?'

Strategic silent panels (no dialogue):
- Establishing shots (panel 1)
- Pure action moments
- Dramatic reactions (close-ups)

All other panels should include dialogue."
```

### Priority 3: Enhance Visual Details (High)

**Current Issue**: Panel descriptions may lack visual specificity

**Hypothesis**: Require structured visual elements in descriptions

**Proposed Prompt Changes (v1.3)**:
```typescript
// ADD DESCRIPTION REQUIREMENTS:
"Each panel description (200-400 chars) MUST include:
1. Character body language (specific physical action)
2. Facial expression detail (eyes, mouth, brow)
3. Environmental mood (lighting, weather, atmosphere)
4. Spatial relationship (character positioning, distance, framing)

Example: 'Sarah stands at rain-streaked window (wide shot, eye level). Her shoulders slump forward, hands pressed against glass. Face reflected shows hollow eyes, trembling chin. Gray daylight casts somber shadows across empty apartment. She seems small against vast cityscape beyond.'"
```

---

## 📈 Success Metrics

### Baseline → Optimized Targets

| Metric | Baseline (Predicted) | Target After Optimization |
|--------|---------------------|--------------------------|
| **Weighted Score** | 3.0-3.5 | 3.8-4.2 |
| **Pass Rate** | 70-80% | 90%+ |
| **Narration %** | 5-8% | <3% |
| **Internal Monologue %** | 8-12% | <5% |
| **Dialogue Presence** | 65-70% | 70-75% |
| **Visual Transformation** | 3.0-3.5 | 4.0-4.5 |
| **Webtoon Pacing** | 3.2-3.7 | 4.0-4.5 |

---

## 📚 Documentation References

### Toonplay System
- `docs/toonplay/toonplay-specification.md` - Core concepts and visual grammar
- `docs/toonplay/toonplay-development.md` - Prompts and implementation
- `docs/toonplay/toonplay-evaluation.md` - Metrics and testing

### Novel Iteration Testing (Reference Model)
- `tests/iteration-testing/README.md` - Framework overview
- `docs/novels/novels-evaluation.md` - Evaluation methodology
- `docs/novels/novels-development.md` - Iterative improvement process

### Implementation Files
- `src/lib/studio/generators/prompt-manager.ts` - Current toonplay prompt (v1.0)
- `src/lib/services/toonplay-evaluator.ts` - Evaluation logic
- `src/lib/services/toonplay-improvement-loop.ts` - Iterative refinement

---

## ✅ Summary

**Iteration testing infrastructure is ready:**

✅ Directory structure created
✅ Test scenes configured (5 scenarios)
✅ Type definitions established
✅ Comprehensive documentation written
✅ Testing methodology defined
✅ Optimization strategy planned

**Next actions required:**

1. Create `run-toonplay-tests.ts` script
2. Create `ab-test-toonplay.ts` script
3. Create `metrics-tracker.ts` utility
4. Run baseline tests (25 toonplays)
5. Analyze failure patterns
6. Begin prompt optimization cycles

**The framework is ready to systematically improve toonplay generation quality through data-driven iteration!** 🎉
