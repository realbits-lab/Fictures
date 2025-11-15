# Part Prompt v1.1 Design Document

## Date: 2025-11-15

## Hypothesis

**"Adding explicit 5-phase cycle validation to the part generation prompt will increase part.cycleCoherence from 2/4 to 4/4, raising Cyclic Structure from 79% to 92% and Intrinsic Motivation from 75% to 85%"**

---

## Root Cause Analysis

### v1.0 Failure Pattern

**Baseline Test Results (story_-Uiw58GxHJMSaLA2):**
- part.cycleCoherence: **2/4** (FAILED - threshold: 3/4)
- Evaluation details: `"phasesPresent": ["setup", "adversity"], "phasesCount": 2, "allPhasesDistinct": false`
- **Missing phases**: virtue, consequence, transition

### Why v1.0 Fails

**Current Prompt Structure (lines 420-584 in prompt-manager.ts):**

1. **NESTED CYCLES ARCHITECTURE** (lines 423-438)
   - ✅ Describes MACRO vs MICRO concept correctly
   - ✅ Explains 5-phase cycle theoretically
   - ❌ **PROBLEM**: Lists phases but doesn't require ALL phases to be generated

2. **THREE-ACT STRUCTURE REQUIREMENTS** (lines 453-471)
   - ✅ Good guidance for Act I, II, III story arcs
   - ❌ **PROBLEM**: Focuses on ACT structure (I, II, III) instead of CYCLE phases (setup → virtue → consequence → transition)

3. **MACRO ARC TEMPLATE** (lines 473-516)
   - ✅ Has sections for MACRO ADVERSITY, MACRO VIRTUE, MACRO CONSEQUENCE, MACRO NEW ADVERSITY
   - ❌ **CRITICAL PROBLEM**: Sections are conceptual guidance, NOT an enforceable output format
   - ❌ **MISSING**: No explicit requirement to include ALL 5 phases in characterArcs output
   - ❌ **MISSING**: No validation checklist confirming all phases are present

4. **User Template** (lines 556-584)
   - ✅ Specifies output fields: `title`, `summary`, `characterArcs`, `settingIds`
   - ❌ **CRITICAL PROBLEM**: Doesn't specify the STRUCTURE of characterArcs
   - ❌ **MISSING**: No schema or example showing that characterArcs MUST contain all 5 phases

**The Gap:**
The AI model sees the MACRO ARC TEMPLATE as descriptive guidance, not a required output structure. It generates arcs that follow the ACT structure (I, II, III) but doesn't ensure all 5 cycle phases are present in the output.

---

## v1.1 Solution Design

### Core Changes

#### Change 1: Add Explicit 5-Phase Output Requirement

**Location**: After MACRO ARC TEMPLATE section (insert around line 517)

**NEW SECTION TO ADD**:

```
# 5-PHASE CYCLE OUTPUT VALIDATION

**CRITICAL REQUIREMENT**: Every character's MACRO arc MUST explicitly contain ALL 5 phases:

1. **SETUP Phase**:
   - Establishes character's baseline state
   - Introduces world/relationships
   - Sets stage for adversity

2. **ADVERSITY Phase**:
   - Character faces internal flaw + external challenge
   - Stakes are clear and compelling
   - Must feel genuinely difficult

3. **VIRTUE Phase** (THE DEFINING MOMENT):
   - Character makes a moral choice driven by intrinsic motivation
   - NOT forced by external pressure
   - Plants seeds that will pay off later
   - Demonstrates story's moral framework

4. **CONSEQUENCE Phase** (EARNED LUCK):
   - Major resolution or reward directly resulting from virtue
   - Clear causal link to past actions
   - Feels like justice/karmic payoff
   - Creates emotional resonance (Gam-dong)

5. **TRANSITION Phase** (NEW ADVERSITY):
   - Success creates next challenge
   - Stakes escalate
   - Seeds next act's conflict
   - Maintains narrative momentum

**VALIDATION CHECKLIST** (verify before finalizing output):
☐ Each character's arc contains explicit text for ALL 5 phases
☐ Setup establishes clear baseline
☐ Adversity is genuinely challenging (internal + external)
☐ Virtue is intrinsically motivated (not forced)
☐ Consequence has clear causal link to virtue
☐ Transition creates escalated stakes for next act

**OUTPUT FORMAT REQUIREMENT**:
Your characterArcs output MUST use this structure for EACH character:

```
CHARACTER: [Name]
ACT [I/II/III]: [Act Title]

CYCLE PHASE 1 - SETUP:
[Explicit content for this phase]

CYCLE PHASE 2 - ADVERSITY:
Internal Flaw: [specific flaw]
External Challenge: [specific obstacle]
Connection: [how external forces facing internal]

CYCLE PHASE 3 - VIRTUE:
Moral Choice: [THE defining action]
Intrinsic Motivation: [deep character reason]
Seeds Planted: [actions that will pay off]

CYCLE PHASE 4 - CONSEQUENCE:
Resolution: [major earned payoff]
Causal Link: [HOW this connects to virtue]
Emotional Impact: [Gam-dong moment]

CYCLE PHASE 5 - TRANSITION:
New Adversity: [next challenge]
How Created: [mechanism by which success → problem]
Stakes Escalation: [why this is harder]
```
```

#### Change 2: Update User Template with Required Structure

**Location**: userTemplate section (lines 556-584)

**BEFORE (v1.0)**:
```
**Required Output Fields**:
- title: Part title
- summary: Comprehensive part description
- characterArcs: Array of macro arcs for each main character (role: protagonist, deuteragonist, tritagonist)
- settingIds: Array of 2-4 setting IDs selected from the provided settings

Return structured text with clear section headers for each character's macro arc, character interactions, and selected setting IDs.
```

**AFTER (v1.1)**:
```
**Required Output Fields**:
- title: Part title
- summary: Comprehensive part description
- characterArcs: Array of macro arcs for each main character (role: protagonist, deuteragonist, tritagonist)
  * **CRITICAL**: Each arc MUST contain ALL 5 cycle phases explicitly labeled:
    - CYCLE PHASE 1 - SETUP
    - CYCLE PHASE 2 - ADVERSITY
    - CYCLE PHASE 3 - VIRTUE
    - CYCLE PHASE 4 - CONSEQUENCE
    - CYCLE PHASE 5 - TRANSITION
- settingIds: Array of 2-4 setting IDs selected from the provided settings

**VALIDATION**: Before finalizing your output, verify that EVERY character's arc contains text for ALL 5 phases. If any phase is missing, add it before returning.

Return structured text with clear section headers for each character's macro arc (using the 5-phase cycle format above), character interactions, and selected setting IDs.
```

#### Change 3: Add Complete Working Example

**Location**: New section after userTemplate (around line 585)

**NEW SECTION TO ADD**:

```
# COMPLETE 5-PHASE CYCLE EXAMPLE

**Example Character Arc (Act I)**:

CHARACTER: Elena (Protagonist)

ACT I: THE LAST GARDEN

CYCLE PHASE 1 - SETUP:
Elena arrives at the refugee camp exhausted and traumatized from war. She finds a small patch of barren earth near the fence and begins clearing rocks, seeking purpose amid chaos. The camp's harsh conditions and her isolation establish her baseline state of despair.

CYCLE PHASE 2 - ADVERSITY:
Internal Flaw: Elena has lost faith in humanity's goodness due to war trauma. She can't trust anyone.
External Challenge: Camp rations are cut by 30%. Fellow refugees begin hoarding resources and turning on each other.
Connection: The scarcity forces Elena to choose between isolating herself further or reaching out despite her fear of betrayal.

CYCLE PHASE 3 - VIRTUE:
Moral Choice: Elena shares her first small harvest of vegetables with the family living in the tent next to hers, even though she's hungry herself. She does this because she remembers her grandmother's teaching that "a garden is meant to feed others, not just yourself."
Intrinsic Motivation: Deep desire to honor her grandmother's memory and prove that kindness can still exist even in suffering.
Seeds Planted:
  * Sharing food creates debt of gratitude that will pay off in Act II when family helps her
  * Word spreads about Elena's generosity, building reputation as "the gardener"
  * Small act of kindness inspires camp elder to notice her

CYCLE PHASE 4 - CONSEQUENCE:
Resolution: Camp elder, moved by Elena's generosity, secures Elena a larger garden plot and persuades camp administration to provide seeds and tools. Other refugees begin helping with the garden, creating community.
Causal Link: Elena's voluntary sharing (virtue) directly caused the elder to advocate for her, and her visible goodness inspired others to trust and collaborate.
Emotional Impact: Gam-dong moment - Elena cries tears of hope for the first time since fleeing her homeland. The garden becomes a symbol of renewal.

CYCLE PHASE 5 - TRANSITION:
New Adversity: A soldier from the army that destroyed Elena's village is assigned to guard the camp perimeter. He notices the garden and begins watching Elena. His presence triggers her trauma and forces her to confront whether her newfound faith in kindness can extend even to former enemies.
How Created: The garden's success (consequence of virtue) drew attention, including unwanted attention from the soldier.
Stakes Escalation: Elena must now choose between revenge/avoidance (regressing to old wounds) or forgiveness/engagement (true transformation). This internal conflict is harder than the external scarcity she faced before.
```

---

## Expected Impact

### Metric Improvements

**Part-Level Metrics:**
- **part.cycleCoherence**: 2/4 → **4/4** (+2 points)
  - Current: Only 2 phases present
  - Expected: All 5 phases present and distinct

**Core Principle Scores:**
- **Cyclic Structure**: 79% → **92%** (+13%)
  - Current calculation: avg(chapter.singleCycleFocus=4, part.cycleCoherence=2, scene.cycleAlignment=3.5) = 3.17/4 = 79%
  - Expected calculation: avg(4, 4, 3.5) = 3.83/4 = 96% (conservative: 92%)

- **Intrinsic Motivation**: 75% → **85%** (+10%)
  - Current: Only story.moralFrameworkClarity (3/4)
  - Expected: Explicit VIRTUE phase will provide clearer intrinsic motivation evidence
  - Future: Will improve further when character evaluation is added

### Secondary Benefits

1. **Better Story Quality**:
   - Complete cycles create more satisfying narratives
   - Virtue phase ensures character agency and moral depth
   - Consequence phase delivers emotional payoff (Gam-dong)

2. **Stronger Causal Chains**:
   - Explicit phase structure forces clear cause-effect relationships
   - Seeds planted in virtue phase have obvious payoffs in consequence phase

3. **Improved Evaluation Accuracy**:
   - Evaluator can easily identify all phases
   - Clear phase labels reduce ambiguity in scoring

---

## Implementation Plan

### Step 1: Create v1.1 Prompt File

**File**: `apps/web/tests/iteration-testing/novels/prompts/v1.1/part-prompt.md`

**Contents**:
- Full v1.0 system prompt text (lines 421-555)
- NEW: 5-Phase Cycle Output Validation section
- UPDATED: User template with required structure
- NEW: Complete 5-phase cycle example

### Step 2: Update Prompt Manager

**File**: `apps/web/src/lib/studio/generators/prompt-manager.ts`

**Approach**: Add version parameter to getPrompt() method

```typescript
interface PromptVersion {
  version: string;  // "v1.0" | "v1.1" | "v1.2" etc.
}

export class PromptManager {
  getPrompt(
    type: 'story' | 'part' | 'chapter' | 'scene',
    options?: PromptVersion
  ): { system: string; userTemplate: string } {
    const version = options?.version || 'v1.0';  // Default to v1.0

    if (type === 'part') {
      if (version === 'v1.1') {
        // Return v1.1 part prompt
        return this.getPartPromptV1_1();
      }
      // Return v1.0 part prompt (current)
      return this.prompts.part;
    }
    // ... other types
  }

  private getPartPromptV1_1(): { system: string; userTemplate: string } {
    // Load from file or define inline
  }
}
```

### Step 3: Create A/B Test Script

**File**: `apps/web/tests/iteration-testing/novels/ab-test.ts`

**Features**:
- Run parallel tests with v1.0 and v1.1
- Generate 5 stories per version (10 total)
- Compare part.cycleCoherence scores
- Statistical significance test (t-test, p-value < 0.05)
- Generate comparison report

### Step 4: Run A/B Test

```bash
pnpm tsx tests/iteration-testing/novels/ab-test.ts \
  --control v1.0 \
  --experiment v1.1 \
  --prompts "last-garden,broken-healer" \
  --sample-size 5 \
  --hypothesis "Part cycle coherence increases to 4/4 with all 5 phases"
```

### Step 5: Validate Results

**Success Criteria**:
- ✅ part.cycleCoherence mean score ≥3.5/4 (v1.1)
- ✅ phasesCount = 5 in ≥80% of v1.1 stories
- ✅ Cyclic Structure ≥85%
- ✅ Statistical significance: p-value < 0.05

**If successful**:
- Promote v1.1 to default
- Update baseline documentation
- Move to next iteration (intrinsic motivation improvement)

**If not successful**:
- Analyze failure patterns
- Refine prompt further (v1.2)
- Repeat A/B test

---

## Risk Assessment

### Low Risk

- **Backward Compatibility**: v1.0 remains default, v1.1 is opt-in
- **Schema Changes**: None required - using existing characterArcs field
- **API Changes**: None - just prompt text modification

### Medium Risk

- **Output Format Changes**: AI may resist structured format if too rigid
  - **Mitigation**: Example shows natural language within structured headings

- **Generation Time**: Additional validation may increase latency
  - **Mitigation**: Example shows concise phase content is acceptable

### Success Indicators

- [ ] Part generation succeeds without errors
- [ ] characterArcs field contains recognizable phase headings
- [ ] Evaluator successfully identifies all 5 phases
- [ ] part.cycleCoherence score ≥3.5/4
- [ ] No regression in other metrics (chapter, scene scores remain strong)

---

## Timeline

- **Day 1**: Create v1.1 prompt file, update prompt manager (2 hours)
- **Day 2**: Create A/B test script (3 hours)
- **Day 3**: Run A/B test (10 stories × 5 min = 50 min generation + analysis)
- **Day 4**: Analyze results, document findings
- **Day 5**: Promote v1.1 or iterate to v1.2

**Total**: 5 days to complete v1.1 iteration cycle

---

## Next Steps After v1.1

If v1.1 succeeds:
1. **v1.2**: Add character-level virtue evaluation to improve Intrinsic Motivation further
2. **v1.3**: Optimize seed planting clarity for Earned Consequence
3. **v1.4**: Enhance emotional resonance in virtue moments

If v1.1 fails:
- Analyze whether the issue is:
  - Prompt clarity (refine instructions)
  - Example quality (provide better examples)
  - Model capability (may need different approach)
- Design v1.2 based on failure analysis

---

**Status**: Design complete, ready for implementation
**Last Updated**: 2025-11-15 18:00 UTC
