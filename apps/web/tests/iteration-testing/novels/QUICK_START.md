# Quick Start Guide - v1.1 Testing

## TL;DR - Run This Now

```bash
cd /home/web/GitHub/@dev.realbits/Fictures/apps/web

# Smoke test (2 minutes) - Verify v1.1 works
pnpm tsx tests/iteration-testing/novels/run-evaluation-suite.ts \
  --version v1.1 \
  --prompts "last-garden" \
  --iterations 1 \
  --mode quick
```

---

## What This Tests

**Hypothesis**: Adding explicit 5-phase cycle validation will fix Part Cycle Coherence (2/4 → 4/4)

**Expected Outcome**: Part characterArcs will contain all 5 phases:
- CYCLE PHASE 1 - SETUP
- CYCLE PHASE 2 - ADVERSITY
- CYCLE PHASE 3 - VIRTUE
- CYCLE PHASE 4 - CONSEQUENCE
- CYCLE PHASE 5 - TRANSITION

---

## Complete Testing Pipeline

### Step 1: Smoke Test (2 min) ✅ DO THIS FIRST

```bash
pnpm tsx tests/iteration-testing/novels/run-evaluation-suite.ts \
  --version v1.1 \
  --prompts "last-garden" \
  --iterations 1 \
  --mode quick \
  > logs/v1.1-smoke-test.log 2>&1 &

# Monitor
tail -f logs/v1.1-smoke-test.log
```

**Success**: Story generates, console shows "version: v1.1", part has all 5 phases

---

### Step 2: Control Group (25 min)

```bash
pnpm tsx tests/iteration-testing/novels/run-evaluation-suite.ts \
  --version v1.0 \
  --prompts "last-garden,broken-healer" \
  --iterations 5 \
  --mode thorough \
  > logs/v1.0-control.log 2>&1 &
```

**Output**: 5 stories with v1.0 baseline metrics

---

### Step 3: Experiment Group (25 min)

```bash
pnpm tsx tests/iteration-testing/novels/run-evaluation-suite.ts \
  --version v1.1 \
  --prompts "last-garden,broken-healer" \
  --iterations 5 \
  --mode thorough \
  > logs/v1.1-experiment.log 2>&1 &
```

**Output**: 5 stories with v1.1 improved metrics

---

### Step 4: Statistical Comparison (5 min)

```bash
pnpm tsx tests/iteration-testing/novels/ab-test.ts \
  --control v1.0 \
  --experiment v1.1 \
  --prompts "last-garden,broken-healer" \
  --sample-size 5 \
  --hypothesis "Part cycle coherence increases to 4/4"
```

**Output**: Statistical report with p-value and recommendation

---

## Success Criteria

**ADOPT v1.1 if**:
- ✅ part.cycleCoherence ≥3.5/4 (v1.0 was 2.0/4)
- ✅ p-value < 0.05 (statistically significant)
- ✅ All 5 phases present in ≥80% of stories
- ✅ No regressions in other metrics

**Expected**: All criteria should pass, leading to ADOPT decision

---

## Quick Checks

### Check Version Used
```bash
grep "version:" logs/v1.1-smoke-test.log
```
Should show: `version: v1.1`

### Count Phases Generated
```bash
# Get story ID
STORY_ID=$(grep "Story generated:" logs/v1.1-smoke-test.log | grep -oP 'story_[a-zA-Z0-9_-]+')

# Count cycle phases in database
psql $DATABASE_URL -c "SELECT \"characterArcs\" FROM parts WHERE story_id = '$STORY_ID';" | grep -c "CYCLE PHASE"
```
Should show: 5 or 10 (depending on number of characters)

### Check for Errors
```bash
grep -i error logs/v1.1-smoke-test.log
```
Should be empty (no errors)

---

## Servers Status

**Before testing, verify**:
```bash
# AI Server
curl -s http://localhost:8000/health | jq .status
# Should show: "healthy"

# Web Server
curl -s http://localhost:3000 | head -1
# Should show: <!DOCTYPE html>
```

**Current Status**:
- ✅ AI Server: Running (port 8000)
- ✅ Web Server: Running (port 3000)

---

## Expected Timeline

| Task | Duration | Total |
|------|----------|-------|
| Smoke test | 2 min | 2 min |
| Control group (5 stories) | 25 min | 27 min |
| Experiment group (5 stories) | 25 min | 52 min |
| Statistical analysis | 5 min | 57 min |
| Review & decision | 10 min | 67 min |

**Total**: ~70 minutes to complete decision

---

## What Happens Next

### If ADOPT (Expected)
1. Update prompt-manager.ts to use v1.1 as default
2. Archive v1.0 for reference
3. Update baseline documentation
4. Move to v1.2 (character virtue evaluation)

### If REVISE
1. Analyze which phases still missing
2. Design v1.2 with refinements
3. Repeat A/B test

### If REVERT
1. Deep failure analysis
2. Fundamental redesign
3. Create v1.2 with different approach

---

## Troubleshooting

### Smoke test fails
**Check**: File exists
```bash
ls -la tests/iteration-testing/novels/prompts/v1.1/part-prompt.ts
```

### No phases in output
**Check**: Generated part content
```bash
STORY_ID=$(grep "Story generated:" logs/v1.1-smoke-test.log | grep -oP 'story_[a-zA-Z0-9_-]+')
psql $DATABASE_URL -c "SELECT \"characterArcs\" FROM parts WHERE story_id = '$STORY_ID';" | less
```

### Server errors
**Check**: Server logs
```bash
tail -50 logs/ai-server.log
tail -50 logs/web-server.log
```

---

## Documentation

**Full Details**:
- **TEST_PLAN_V1.1.md** - Complete testing plan (600+ lines)
- **V1.1_IMPLEMENTATION_COMPLETE.md** - Implementation guide (400+ lines)
- **FINAL_SESSION_SUMMARY.md** - Session overview (800+ lines)

**Design**:
- **PART_PROMPT_V1.1_DESIGN.md** - Design rationale (400+ lines)
- **prompts/v1.1/part-prompt.ts** - Actual prompt code (350+ lines)

**Baseline**:
- **BASELINE_V1.0_RESULTS.md** - v1.0 analysis (214 lines)

---

## Commands Summary

```bash
# All commands assume you're in apps/web directory
cd /home/web/GitHub/@dev.realbits/Fictures/apps/web

# 1. Smoke test (DO THIS FIRST)
pnpm tsx tests/iteration-testing/novels/run-evaluation-suite.ts \
  --version v1.1 --prompts "last-garden" --iterations 1 --mode quick

# 2. Full A/B test (if smoke test passes)
# Generate v1.0 control
pnpm tsx tests/iteration-testing/novels/run-evaluation-suite.ts \
  --version v1.0 --prompts "last-garden,broken-healer" --iterations 5 --mode thorough

# Generate v1.1 experiment
pnpm tsx tests/iteration-testing/novels/run-evaluation-suite.ts \
  --version v1.1 --prompts "last-garden,broken-healer" --iterations 5 --mode thorough

# Compare
pnpm tsx tests/iteration-testing/novels/ab-test.ts \
  --control v1.0 --experiment v1.1 --sample-size 5
```

---

**Status**: Ready for Testing

**Next Action**: Run smoke test command above

**Last Updated**: 2025-11-15 20:00 UTC
