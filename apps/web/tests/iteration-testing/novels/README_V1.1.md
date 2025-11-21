# v1.1 Novel Generation - Complete Documentation Index

## 🎯 Start Here

**New to v1.1?** → Read **[QUICK_START.md](QUICK_START.md)** (5 min read)

**Ready to test?** → Run this command:
```bash
cd /home/web/GitHub/@dev.realbits/Fictures/apps/web

pnpm tsx tests/iteration-testing/novels/run-evaluation-suite.ts \
  --version v1.1 --prompts "last-garden" --iterations 1 --mode quick
```

---

## 📚 Complete Documentation

### Getting Started (Read in Order)

1. **[QUICK_START.md](QUICK_START.md)** - 5 min
   - TL;DR commands
   - Quick verification
   - Troubleshooting

2. **[V1.1_READY_FOR_TESTING.md](V1.1_READY_FOR_TESTING.md)** - 15 min
   - Preparation overview
   - Implementation roadmap
   - Next steps summary

3. **[TEST_PLAN_V1.1.md](TEST_PLAN_V1.1.md)** - 30 min
   - Complete 5-phase testing plan
   - Success criteria
   - Decision framework

### Technical Details

4. **[V1.1_IMPLEMENTATION_COMPLETE.md](V1.1_IMPLEMENTATION_COMPLETE.md)** - 20 min
   - Code changes explained
   - Usage examples
   - Troubleshooting guide

5. **[PART_PROMPT_V1.1_DESIGN.md](PART_PROMPT_V1.1_DESIGN.md)** - 25 min
   - Root cause analysis
   - Solution design
   - Expected improvements

6. **[prompts/v1.1/part-prompt.ts](prompts/v1.1/part-prompt.ts)** - Reference
   - Actual v1.1 prompt code
   - 350+ lines of improved prompt

### Background & Context

7. **[BASELINE_V1.0_RESULTS.md](BASELINE_V1.0_RESULTS.md)** - 15 min
   - v1.0 baseline analysis
   - Metric breakdown
   - Root cause identification

8. **[FINAL_SESSION_SUMMARY.md](FINAL_SESSION_SUMMARY.md)** - 30 min
   - Complete session overview
   - All work completed
   - Detailed statistics

9. **[prompts/README.md](prompts/README.md)** - 20 min
   - Version history
   - Development workflow
   - Usage guide

---

## 📊 Key Information

### The Problem (v1.0)

- **Part Cycle Coherence**: 2/4 (only 2 of 5 phases)
- **Missing Phases**: virtue, consequence, transition
- **Impact**: Cyclic Structure 79%, Intrinsic Motivation 75%

### The Solution (v1.1)

- **Added**: Explicit 5-phase cycle validation
- **Required**: All 5 phases in structured format
- **Example**: Complete "Last Garden" demonstration
- **Validation**: Pre-finalization checklist

### Expected Improvements

| Metric | v1.0 | v1.1 | Delta |
|--------|------|------|-------|
| part.cycleCoherence | 2.0/4 | 4.0/4 | +2.0 |
| phasesCount | 2 | 5 | +3 |
| Cyclic Structure | 79% | 92% | +13% |
| Intrinsic Motivation | 75% | 85% | +10% |

---

## 🚀 Quick Commands

### Smoke Test (2 min)
```bash
cd apps/web
pnpm tsx tests/iteration-testing/novels/run-evaluation-suite.ts \
  --version v1.1 --prompts "last-garden" --iterations 1 --mode quick
```

### Full A/B Test (~70 min)
```bash
# Control (v1.0)
pnpm tsx tests/iteration-testing/novels/run-evaluation-suite.ts \
  --version v1.0 --prompts "last-garden,broken-healer" --iterations 5 --mode thorough

# Experiment (v1.1)
pnpm tsx tests/iteration-testing/novels/run-evaluation-suite.ts \
  --version v1.1 --prompts "last-garden,broken-healer" --iterations 5 --mode thorough

# Compare
pnpm tsx tests/iteration-testing/novels/ab-test.ts \
  --control v1.0 --experiment v1.1 --sample-size 5
```

---

## 📁 File Organization

```
tests/iteration-testing/novels/
├── README_V1.1.md                    # This file - Documentation index
├── QUICK_START.md                    # Quick start guide
├── TEST_PLAN_V1.1.md                 # Complete testing plan
├── V1.1_READY_FOR_TESTING.md         # Preparation overview
├── V1.1_IMPLEMENTATION_COMPLETE.md   # Implementation guide
├── PART_PROMPT_V1.1_DESIGN.md        # Design rationale
├── BASELINE_V1.0_RESULTS.md          # v1.0 baseline analysis
├── FINAL_SESSION_SUMMARY.md          # Session overview
├── SESSION_SUMMARY.md                # Original session notes
├── ITERATION_STRATEGY.md             # 12-week plan
├── run-evaluation-suite.ts           # Main test runner
├── ab-test.ts                        # A/B comparison tool
├── config/
│   └── test-prompts.ts              # Test prompt definitions
├── prompts/
│   ├── README.md                    # Version history
│   ├── v1.0/                        # Baseline (reference)
│   └── v1.1/
│       └── part-prompt.ts           # v1.1 improved prompt
└── results/
    ├── v1.0/                        # v1.0 test results
    └── v1.1/                        # v1.1 test results
```

---

## 🎯 Success Criteria

**v1.1 is considered successful if**:

1. ✅ **Statistical Significance**: p-value < 0.05
2. ✅ **Primary Metric**: part.cycleCoherence ≥3.5/4
3. ✅ **Phase Completeness**: All 5 phases in ≥80% of stories
4. ✅ **Secondary Metrics**: Cyclic Structure ≥85%, Intrinsic Motivation ≥85%
5. ✅ **No Regressions**: All other Core Principles stay ≥ v1.0 levels

**If all criteria met** → ADOPT v1.1, move to v1.2

---

## 📈 Testing Timeline

| Day | Phase | Tasks | Duration |
|-----|-------|-------|----------|
| **Day 1** | Smoke Test | Verify v1.1 works | 2 min |
| | Control | Generate 5 v1.0 stories | 25 min |
| | Experiment | Generate 5 v1.1 stories | 25 min |
| | Analysis | Statistical comparison | 5 min |
| | Decision | ADOPT/REVISE/REVERT | 10 min |
| **Day 2-5** | Next Steps | Depends on decision | Varies |

---

## 🔧 Implementation Details

### Code Changes (5 files modified)

1. **prompt-manager.ts** - Added version parameter to `getPrompt()`
2. **part-generator.ts** - Extracts and passes version
3. **generators.ts** - Added `promptVersion?: string` to types
4. **part-service.ts** - Service layer version flow
5. **run-evaluation-suite.ts** - CLI integration

### Version Flow

```
CLI --version v1.1
    ↓
PROMPT_VERSION variable
    ↓
partService.generateAndSave({ promptVersion })
    ↓
generatePart({ promptVersion })
    ↓
promptManager.getPrompt(version)
    ↓
Load prompts/v1.1/part-prompt.ts
```

---

## 📊 Key Metrics Reference

### Core Principles (Target: ≥85%)

| Principle | v1.0 | Target | Status |
|-----------|------|--------|--------|
| Cyclic Structure | 79% | 92% | ⚠️ Improving |
| Intrinsic Motivation | 75% | 85% | ⚠️ Improving |
| Earned Consequence | 85% | 85% | ✅ Passing |
| Character Transformation | 94% | 85% | ✅ Passing |
| Emotional Resonance | 87% | 85% | ✅ Passing |

### Part-Level Metrics

| Metric | v1.0 | v1.1 Target | Improvement |
|--------|------|-------------|-------------|
| cycleCoherence | 2.0/4 | 4.0/4 | +2.0 (100%) |
| phasesCount | 2 | 5 | +3 (150%) |
| phasesPresent | 2/5 | 5/5 | Complete |

---

## 🎓 Learning Resources

### Understanding the Problem

1. **What is Part Cycle Coherence?**
   - Measures how well a story part demonstrates all 5 phases of the Adversity-Triumph Engine
   - Phases: setup → adversity → virtue → consequence → transition
   - Score: 4/4 if all phases present and distinct

2. **Why Does This Matter?**
   - Complete cycles create emotional resonance (Gam-dong)
   - Missing phases leave story feeling incomplete
   - Affects higher-level metrics (Cyclic Structure, Intrinsic Motivation)

3. **What Changed in v1.1?**
   - Explicit requirement for all 5 phases
   - Required output format with phase labels
   - Complete working example
   - Validation checklist

### Understanding the Testing

1. **What is A/B Testing?**
   - Statistical comparison of two versions
   - Control (v1.0) vs Experiment (v1.1)
   - Uses t-test to determine if improvement is real

2. **What is p-value?**
   - Probability that improvement happened by chance
   - p < 0.05 = improvement is statistically significant
   - p ≥ 0.05 = could be random variation

3. **What are the Decision Criteria?**
   - ADOPT: Significant improvement, no regressions
   - REVISE: Partial improvement, needs refinement
   - REVERT: No improvement or regressions

---

## 🔍 Troubleshooting

### Common Issues

**Issue**: "Cannot find module 'part-prompt'"
```bash
# Verify file exists
ls -la tests/iteration-testing/novels/prompts/v1.1/part-prompt.ts
```

**Issue**: Version shows as v1.0 in logs
```bash
# Check if version parameter passed correctly
grep "promptVersion" tests/iteration-testing/novels/run-evaluation-suite.ts
```

**Issue**: Still only 2 phases generated
```bash
# Check generated part content
STORY_ID=$(grep "Story generated:" logs/v1.1-smoke-test.log | grep -oP 'story_[a-zA-Z0-9_-]+')
psql $DATABASE_URL -c "SELECT \"characterArcs\" FROM parts WHERE story_id = '$STORY_ID';"
```

---

## 📞 Next Steps After Testing

### If ADOPT (Expected Outcome)

1. **Update Code**:
   ```typescript
   // In prompt-manager.ts, change default
   const actualVersion = version || "v1.1";  // Was "v1.0"
   ```

2. **Update Documentation**:
   - Create `BASELINE_V1.1_RESULTS.md`
   - Update `prompts/README.md` to mark v1.1 as current
   - Archive v1.0 as reference

3. **Plan v1.2**:
   - Target: Character virtue evaluation (Intrinsic Motivation)
   - Design: Add character-level `genuineVirtue` metric
   - Timeline: 1 week design + 1 week test

### If REVISE

1. **Analyze Patterns**:
   - Which phases still missing?
   - Is format too rigid or too flexible?
   - Did model generate poor content despite correct format?

2. **Design v1.2**:
   - Refine instructions
   - Improve examples
   - Simplify validation

3. **Repeat Test**:
   - A/B test v1.1 vs v1.2
   - Same methodology

### If REVERT

1. **Deep Analysis**:
   - Why did explicit instructions fail?
   - Is model incapable of complex instructions?
   - Are examples misleading?

2. **Fundamental Redesign**:
   - Consider different approach
   - Explore alternative prompt architecture
   - May need different model or method

---

## 📝 Version History

| Version | Date | Status | Changes |
|---------|------|--------|---------|
| **v1.0** | 2025-11-14 | Baseline | Original part prompt |
| **v1.1** | 2025-11-15 | Testing | 5-phase cycle validation |
| **v1.2** | TBD | Planned | Character virtue evaluation |

---

## 🎉 Summary

**What We Built**:
- ✅ Complete v1.1 prompt with explicit 5-phase validation
- ✅ End-to-end version parameter support
- ✅ Comprehensive testing infrastructure
- ✅ 3500+ lines of documentation

**What's Ready**:
- ✅ Smoke test command
- ✅ Full A/B test pipeline
- ✅ Statistical analysis tools
- ✅ Decision framework

**What's Next**:
- 📋 Run smoke test (2 min)
- 📋 Run A/B test (~70 min)
- 📋 Make decision
- 📋 Continue iteration

---

**Status**: ✅ Complete - Ready for Testing

**Start Here**: [QUICK_START.md](QUICK_START.md)

**Questions?** See [TEST_PLAN_V1.1.md](TEST_PLAN_V1.1.md) for complete details

**Last Updated**: 2025-11-15 20:00 UTC
