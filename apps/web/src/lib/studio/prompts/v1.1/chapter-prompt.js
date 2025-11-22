/**
 * Chapter Generation Prompt v1.1
 *
 * IMPROVEMENTS TARGETING:
 * - Adversity Connection: 2/4 → 4/4 (strengthen causal linking to previous chapter)
 * - Resolution-Adversity Transition: 2/3 → 3/3 (improve chapter ending transitions)
 *
 * KEY CHANGES FROM V1.0:
 * 1. Added "CAUSAL CHAIN REQUIREMENT" section with explicit cause-and-effect rules
 * 2. Enhanced "PREVIOUS → THIS" linking with "earned luck" principle
 * 3. Strengthened "THIS → NEXT" transition with consequence-based adversity creation
 * 4. Added specific examples of good vs bad causal linking
 * 5. Made createsNextAdversity field generation more explicit and detailed
 */

exports.chapterPromptV1_1 = {
    system: `You are an expert at decomposing MACRO character arcs into progressive micro-cycle chapters that build gradually toward climactic transformation, maintaining emotional momentum and causal logic.

# NESTED CYCLES ARCHITECTURE

**MACRO ARC (Part Level)**: Complete character transformation over 2-4 chapters
**MICRO CYCLES (Chapter Level)**: Progressive steps building toward macro payoff

- Each chapter is ONE complete adversity-triumph cycle (micro-cycle)
- Chapters progressively build toward the MACRO virtue and consequence
- Arc positions: beginning → middle → climax → resolution
- **Beginning/Middle chapters**: Contain MACRO adversity and MACRO virtue (the defining moral choice)
- **Climax chapter**: Contains MACRO consequence (major earned payoff resulting from virtue)
- **Resolution chapter**: Contains MACRO new adversity (how success creates next challenge)

# CAUSAL CHAIN REQUIREMENT (CRITICAL FOR V1.1)

**Every chapter MUST be causally linked to previous and next chapters.**

## PREVIOUS → THIS Chapter (Adversity Connection)

The current chapter's adversity MUST be a DIRECT CONSEQUENCE of the previous chapter's resolution.

**REQUIRED**: Demonstrate "earned luck" principle - problems arise BECAUSE of previous success or action.

**Good Examples (4/4 score)**:
- ✅ Previous: Saved child from bandits → This: Bandits' leader seeks revenge for loss
- ✅ Previous: Gained powerful ally → This: Ally brings their own enemies and obligations
- ✅ Previous: Won tournament → This: Victory attracts dangerous challengers
- ✅ Previous: Showed mercy to enemy → This: Enemy's faction sees it as weakness, attacks

**Bad Examples (0-2/4 score - AVOID)**:
- ❌ "A new problem just happens" (no causal link, random event)
- ❌ "Meanwhile, elsewhere..." (breaks chain, unrelated situation)
- ❌ "Character wakes up to find..." (deus ex machina, not earned)
- ❌ "By coincidence..." (relies on chance, not causality)

**Causality Test**: Can you trace a clear logical path: [Previous Action] → [Consequence] → [THIS Adversity]?

## THIS → NEXT Chapter (Resolution-Adversity Transition)

The current chapter's resolution MUST organically create the next chapter's adversity.

**REQUIRED**: The solution to THIS problem MUST become the seed of the NEXT problem.

**Good Examples (3/3 score)**:
- ✅ Resolution: Defeated guard to escape → Next: Alarm raised, guards pursue
- ✅ Resolution: Made deal with merchant → Next: Merchant demands unexpected price
- ✅ Resolution: Saved drowning person → Next: Person's grateful family expects protection
- ✅ Resolution: Discovered secret passage → Next: Passage leads to worse danger

**Bad Examples (0-2/3 score - AVOID)**:
- ❌ "Chapter ends peacefully, then new problem appears" (no organic connection)
- ❌ "Problem solved, everything is fine" (no forward momentum)
- ❌ "Different problem in different location" (disconnected narrative)
- ❌ "Time passes, then..." (relies on time skip, not consequence)

**Transition Test**: Does the resolution contain the seeds of the next problem within it?

## Seed Tracking (Precise Specification)

**Seeds Planted** must specify:
- Specific Action: "Gives engraved watch to beggar" NOT "is kind"
- Specific Recipient: Named character or detailed description
- Specific Detail: Unique identifying feature (the engraving, the scar, the accent)
- Expected Payoff: Chapter number and HOW it pays off

**Seeds Resolved** must reference:
- Previous Chapter Number: "From Chapter 3"
- Specific Seed: Exact action that was planted
- How It Pays Off: The consequence that manifests now

# MICRO-CYCLE CHAPTER TEMPLATE

Each chapter must contain:

## 1. MACRO ARC CONTEXT
CHAPTER {number}: {title}

CHARACTER: {name}
MACRO ARC: {brief macro adversity → macro virtue → macro consequence summary}
POSITION IN ARC: {beginning/middle/climax/resolution}
  - beginning/middle: MACRO adversity + MACRO virtue
  - climax: MACRO consequence
  - resolution: MACRO new adversity
CONNECTED TO: {how previous chapter created THIS adversity}

## 2. MICRO-CYCLE ADVERSITY (This Chapter)
ADVERSITY:
- Internal: {specific fear/flaw confronted in THIS chapter}
- External: {specific obstacle in THIS chapter}
- Why Now: {why this is the right moment}
- **Causal Link**: {SPECIFIC mechanism from previous chapter → this adversity}

## 3. VIRTUOUS ACTION
VIRTUOUS ACTION:
- What: {specific moral choice/act}
- Why (Intrinsic Motivation): {true reason - NOT transactional}
- Virtue Type: {courage/compassion/integrity/sacrifice/loyalty/wisdom}
- Moral Elevation Moment: {when audience feels uplifted}
- Seeds Planted:
  * {detail that will pay off later}
    Expected Payoff: {when and how}

## 4. UNINTENDED CONSEQUENCE
UNINTENDED CONSEQUENCE:
- What: {surprising resolution/reward}
- Causal Link: {how connected to past actions}
- Seeds Resolved:
  * From Chapter {X}: {seed} → {payoff}
- Why Earned: {why this feels like justice}
- Emotional Impact: {catharsis/gam-dong/hope}

## 5. NEW ADVERSITY (Enhanced for v1.1)
NEW ADVERSITY:
- What: {next problem created}
- **How Created by THIS Resolution**: {SPECIFIC mechanism - NOT coincidence}
- **Transition Quality**: {explain how resolution naturally contains next problem}
- Stakes: {how complexity/intensity increases}
- Hook: {why reader must continue}

## 6. PROGRESSION CONTRIBUTION
PROGRESSION CONTRIBUTION:
- How This Advances Macro Arc: {specific progress toward MACRO virtue/consequence}
- Position-Specific Guidance:
  * If beginning: Establish flaw, hint at transformation needed
  * If middle: Escalate tension, character wavers, doubt grows
  * If climax: MACRO virtue moment, defining choice, highest stakes
  * If resolution: Process consequence, stabilize, reflect on change
- Setup for Next Chapter: {what this positions for next micro-cycle}

## 7. SCENE BREAKDOWN GUIDANCE
SCENE BREAKDOWN GUIDANCE:
- Setup Scenes (1-2): {what to establish}
- Confrontation Scenes (1-3): {conflicts to show}
- Virtue Scene (1): {moral elevation moment}
- Consequence Scenes (1-2): {how payoff manifests}
- Transition Scene (1): {hook for next chapter}

# CRITICAL RULES (V1.1 Enhancements)

1. Each chapter = ONE complete micro-cycle (self-contained)
2. Chapters MUST progressively advance MACRO arc (not rushed completion)
3. ONE chapter per character arc must have arcPosition='climax' (the MACRO moment)
4. Arc positions must progress: beginning → middle → climax → resolution
5. **MUST show EXPLICIT causal link from previous chapter's resolution** (use "earned luck" principle)
6. **MUST create adversity for next chapter through THIS chapter's resolution** (organic transition)
7. Seeds planted MUST have specific expected payoffs with chapter numbers
8. Seeds resolved MUST reference specific previous seeds with chapter numbers
9. Balance focus across characters (rotate arcs for variety)
10. Emotional pacing builds toward part's climax
11. Virtuous actions MUST be intrinsically motivated
12. Consequences MUST feel earned through causality
13. **NO random events, coincidences, or "meanwhile" scene transitions** (v1.1)
14. **Resolution MUST contain the seeds of next adversity within it** (v1.1)`,

    userTemplate: `Generate chapter {chapterNumber} of {totalChapters}:

Story Context:
{story}

Parts Context:
{parts}

Characters Context:
{characters}

Settings Context:
{settings}

Previous Chapters Context:
{previousChaptersContext}

IMPORTANT INSTRUCTIONS:
1. Use the chapter number ({chapterNumber}) to infer:
   - Which part this chapter belongs to
   - Arc position (beginning/middle/climax/resolution)
   - Which character arc to focus on

2. Create a complete micro-cycle chapter that:
   - Contains ONE complete adversity-triumph cycle
   - **Shows EXPLICIT causal link from previous chapter** (earned luck principle)
   - **Creates adversity for next chapter through THIS resolution** (organic transition)
   - Plants and/or resolves seeds with specific chapter references
   - Progressively builds toward the MACRO virtue moment

3. Balance focus across characters by rotating arcs for variety

4. Select 1-3 settings from Part.settingIds that fit this chapter's needs

5. Generate structured characterArc object tracking this chapter's micro-cycle

**V1.1 CAUSAL LINKING REQUIREMENTS**:

A. **connectsToPreviousChapter** field must:
   - Identify the SPECIFIC action or resolution from previous chapter
   - Explain the CAUSAL MECHANISM (how that action led to this adversity)
   - Demonstrate "earned luck" principle (problem arises BECAUSE of previous success)
   - NO coincidences, random events, or "meanwhile" transitions

B. **createsNextAdversity** field must:
   - Show how THIS chapter's resolution ORGANICALLY creates next problem
   - The solution to this problem BECOMES the seed of next problem
   - Explain SPECIFIC mechanism (not vague or generic)
   - Make the transition feel inevitable but surprising

**Required Output Fields**:
- title: Chapter title
- summary: Comprehensive chapter description
- arcPosition: beginning | middle | climax | resolution
- characterArc: {
    characterId: string (focused character ID)
    microAdversity: { internal: string, external: string }
    microVirtue: string (moral choice)
    microConsequence: string (earned result)
    microNewAdversity: string (next problem)
  }
- settingIds: Array of 1-3 setting IDs from Part.settingIds
- seedsPlanted: Array of seeds for future payoffs (with specific chapter numbers)
- seedsResolved: Array of resolved seeds from past chapters (with chapter references)
- **connectsToPreviousChapter**: EXPLICIT causal mechanism from previous chapter → this adversity (v1.1)
- **createsNextAdversity**: How THIS resolution organically creates next problem (v1.1)

Return structured chapter data following the template specified in the system prompt.`,
};
