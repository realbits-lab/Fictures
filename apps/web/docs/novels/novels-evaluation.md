# Novels Evaluation Guide: Adversity-Triumph Engine

## Executive Summary

This document outlines a comprehensive evaluation strategy for the novels generation system using the Adversity-Triumph Engine. The evaluation framework is **directly synchronized with the Core Principles** defined in the specification, ensuring that all testing validates the fundamental principles of the narrative engine.

**Key Features:**
- **Core Principles Validation**: All evaluation objectives map to the 5 Core Principles from the specification
- **Quantitative & Qualitative Metrics**: Comprehensive measurement across structure, quality, and emotional impact
- **Iterative Improvement**: Data-driven prompt optimization based on Core Principle adherence
- **Production Testing Results**: Real-world validation with complete evaluation examples

**Related Documents:**
- 📖 **Specification** (`novels-specification.md`): Core Principles (section 1.5), data model, and theoretical foundation
- 📋 **Development Guide** (`novels-development.md`): API implementations and prompt specifications

---

## Part I: Testing Objectives

### 1.1 Core Principles (From Specification)

The evaluation framework validates the five Core Principles defined in `novels-specification.md` (section 1.5):

1. **Intrinsic Motivation**: Virtuous actions MUST be genuine, not strategic
2. **Causal Linking**: Every event connects to previous actions (no deus ex machina)
3. **Seed Tracking**: Small actions pay off later as "earned luck"
4. **Cyclical Engine**: Every resolution creates next adversity
5. **Emotional Authenticity**: Show emotions through body/action, not tell

**Narrative Goal** (from specification): Create stories that heal Han (한 - unresolved grief) through Jeong (정 - deep connection), culminating in Gam-dong (감동 - profound emotional moving).

### 1.2 Evaluation Objectives

Each evaluation objective directly validates one or more Core Principles:

1. **Intrinsic Motivation Validation** (validates Principle #1)
   - Verify virtuous actions are genuine, not strategic or transactional
   - Measure reader perception of character authenticity
   - Assess dramatic irony between character's externalGoal and true needs

2. **Causal Integrity Verification** (validates Principles #2, #3)
   - Verify every event connects to previous actions
   - Track seed planting and resolution across story
   - Detect and eliminate deus ex machina incidents
   - Measure "earned luck" vs random luck perception

3. **Cyclical Engine Functionality** (validates Principle #4)
   - Verify complete adversity-triumph cycles
   - Confirm every resolution creates next adversity
   - Track stakes escalation across cycles
   - Assess narrative momentum maintenance

4. **Emotional Authenticity Assessment** (validates Principle #5)
   - Verify emotions shown through body/action, not told
   - Measure reader emotional engagement
   - Assess POV discipline and immersion

5. **Emotional Resonance Achievement** (validates Narrative Goal)
   - Measure empathy building (reader cares about characters)
   - Measure catharsis experience (emotional release)
   - Measure moral elevation response (inspired by virtue)
   - Measure Gam-dong achievement (profound emotional moving)

6. **System Reliability & Optimization**
   - Ensure consistent generation across varied prompts
   - Iteratively improve prompts based on Core Principle adherence
   - Track performance and quality metrics

### 1.3 Success Criteria

Success criteria are organized by Core Principle to ensure direct validation:

#### Principle #1: Intrinsic Motivation
**Must Have:**
- ✅ 90%+ character actions feel intrinsically motivated (reader survey)
- ✅ 85%+ virtuous actions lack transactional language ("to get X")
- ✅ 0% obviously strategic "good deeds" (e.g., helping only when witnessed)

**Should Have:**
- ✅ 85%+ readers say character acted from "genuine goodness" not "to get something"
- ✅ 90%+ dramatic irony between externalGoal and true needs

#### Principle #2: Causal Linking
**Must Have:**
- ✅ 70%+ causal links are clear and logical (manual review)
- ✅ 0% deus ex machina incidents (no unearned resolutions)
- ✅ 80%+ readers say success felt "earned through actions" not "lucky"

**Should Have:**
- ✅ 90%+ story events have explicit causal connections to prior events
- ✅ 85%+ consequences are inevitable in retrospect but surprising in moment

#### Principle #3: Seed Tracking
**Must Have:**
- ✅ 85%+ seed plantings successfully resolve in later content
- ✅ 60-80% seed resolution rate (resolved seeds / planted seeds)
- ✅ 100% seeds tracked with planting and expected payoff phases

**Should Have:**
- ✅ 90%+ seed resolutions feel "surprising but inevitable"
- ✅ 75%+ seeds involve human relationships (not just objects/events)

#### Principle #4: Cyclical Engine
**Must Have:**
- ✅ 90%+ cycles have all 5 components (adversity, virtue, consequence, new adversity, causal link)
- ✅ 80%+ cycle resolutions naturally create next adversity with escalated stakes
- ✅ 100% chapters contain exactly 1 complete cycle

**Should Have:**
- ✅ 85%+ stake escalations feel organic and logical
- ✅ 90%+ cycles maintain narrative momentum (no pacing lulls)

#### Principle #5: Emotional Authenticity
**Must Have:**
- ✅ 85%+ scenes pass quality evaluation on first attempt (3.0+/4.0 score)
- ✅ 80%+ emotions shown through body/action, not told
- ✅ 90%+ POV discipline maintained (no head-hopping)

**Should Have:**
- ✅ 75%+ scenes have distinct emotional beats matching cycle phase
- ✅ 85%+ readers feel emotionally immersed in character experience

#### Narrative Goal: Emotional Resonance
**Must Have:**
- ✅ 80%+ test readers identify moral elevation moment correctly
- ✅ 80%+ readers report feeling "moved" (Gam-dong)
- ✅ 75%+ readers care about character outcomes (empathy building)

**Should Have:**
- ✅ 70%+ readers report emotional release (catharsis experience)
- ✅ 90%+ readers can articulate the moral framework

**Nice to Have:**
- ✅ 85%+ average scene quality score (3.5+/4.0)
- ✅ 60%+ readers spontaneously mention specific scenes as "memorable"

---

## Part II: Testing Levels

### 2.1 Unit Testing (Component Level)

**Purpose**: Validate individual generation components produce expected output formats and quality

**Test Categories:**

**Story Generation Tests:**
- Moral framework clarity (3+ virtues named, causal logic present)
- Thematic coherence (theme supports moral tests, no contradictions)
- Genre consistency (genre-appropriate tone, conflict types, world rules)

**Character Generation Tests:**
- Character depth (internal flaw with cause, backstory > 200 chars)
- Jeong system (2+ relationships defined with type and intensity)
- Voice distinctiveness (unique speech patterns, personality keyword overlap < 30%)

**Settings Generation Tests:**
- Symbolic meaning clarity (references moral framework)
- Sensory richness (3+ of 5 senses present)
- Cycle amplification (all 5 phases specified)

**Part Generation Tests:**
- Cycle coherence (all 5 phases present per character)
- Conflict clarity (both internal and external conflicts defined)
- Earned luck tracking (1+ seed per cycle with planting and resolution)

**Chapter Generation Tests:**
- Single-cycle focus (1 complete cycle per chapter, 1-2 characters)
- Seed tracking (previous chapter seeds appear in current chapter)
- Adversity connection (chapter N consequence → chapter N+1 setup)

**Scene Generation Tests:**
- Phase distribution (at least 1 scene per critical phase: virtue, consequence)
- Emotional beat assignment (clear emotion per scene)
- Pacing rhythm (setup → build → peak → release → transition)

### 2.2 Integration Testing (Flow Level)

**Purpose**: Validate end-to-end generation pipeline produces coherent, high-quality stories

**End-to-End Generation Tests:**
- Complete story generation from user prompt to final content
- Phase-to-phase data continuity (story → characters → settings → parts → chapters → scenes)
- Causal chain integrity across entire story
- Emotional arc consistency from beginning to end
- Image generation and optimization for all story assets

**Multi-Chapter Flow Tests:**
- Stakes escalation across chapters
- Seed planting in early chapters, resolution in later chapters
- Character transformation progression
- Setting usage variety and appropriateness

### 2.3 System Testing (Performance & Reliability)

**Purpose**: Validate system performance, reliability, and scalability

**Performance Tests:**
- Generation time per story component
- Token usage optimization
- Database query performance
- Image generation and optimization speed
- Concurrent generation handling

**Reliability Tests:**
- Error recovery and retry mechanisms
- Partial generation state handling
- Data consistency under concurrent operations
- Edge case handling (extreme input values, missing data)

---

## Part III: Metrics & Evaluation

This section provides detailed metric descriptions organized by category, implementation examples, and iterative improvement methodology.

### 3.1 Foundation Metrics

**Story Generation Metrics:**

| Metric | Definition | Success Criteria | Measurement Method |
|--------|-----------|------------------|----------------------|
| Moral Framework Clarity | How well the moral framework defines testable virtues and meaningful consequences | Explicit virtue identification, clear consequences, systemic challenges defined | Manual review: 3+ virtues named, causal logic present |
| Thematic Coherence | Consistency between premise, moral framework, and genre | Theme supports moral tests, no contradictions | Automated: keyword alignment across fields |
| Genre Consistency | Story elements align with genre conventions and reader expectations | Genre-appropriate tone, conflict types, world rules | Manual review against genre checklist |

**Character Generation Metrics:**

| Metric | Definition | Success Criteria | Measurement Method |
|--------|-----------|------------------|----------------------|
| Character Depth | Complexity of internal flaws, motivations, and arc potential | Each character has 1+ internal flaw, clear moral test | Automated: internal flaw field populated, backstory length > 200 chars |
| Jeong System Implementation | Korean emotional bond system properly defined between characters | At least 2 Jeong relationships defined with type and intensity | Automated: Jeong array has 2+ entries with valid types |
| Voice Distinctiveness | Each character has unique speech patterns and personality traits | No overlapping voice descriptions, distinct personality keywords | Automated: voice field uniqueness check, personality keyword overlap < 30% |

**Settings Generation Metrics:**

| Metric | Definition | Success Criteria | Measurement Method |
|--------|-----------|------------------|----------------------|
| Symbolic Meaning Clarity | Setting's connection to moral framework is explicit | Symbolic meaning field directly references moral themes | Manual review: symbolic meaning mentions moral framework elements |
| Sensory Detail Richness | All 5 senses are engaged in setting description | At least 3 of 5 senses present in description | Automated: sense keyword detection (sight, sound, smell, touch, taste) |
| Cycle Amplification Design | How setting amplifies adversity-triumph cycle phases | Each cycle phase has setting amplification note | Manual review: cycle amplification field populated per phase |

### 3.2 Structure Metrics

**Part Metrics:**

| Metric | Definition | Success Criteria | Measurement Method |
|--------|-----------|------------------|----------------------|
| Cycle Coherence | 5-phase structure (Setup → Confrontation → Virtue → Consequence → Transition) is complete | All 5 phases present and distinct per character | Automated: phase detection in part summary |
| Conflict Definition Clarity | Internal and external conflicts are explicitly stated | Both conflict types named with specific examples | Manual review: conflict fields populated with concrete details |
| Earned Luck Tracking | Seeds planted in setup/confrontation, resolved in consequence | At least 1 seed per cycle with planting and resolution noted | Automated: seed tracking table has matching planted/resolved pairs |

**Chapter Metrics:**

| Metric | Definition | Success Criteria | Measurement Method |
|--------|-----------|------------------|----------------------|
| Single-Cycle Focus | Each chapter contains exactly ONE complete adversity-triumph cycle | Chapter focuses on 1-2 characters, one conflict | Manual review: cycle count per chapter = 1 |
| Seed Tracking Completeness | All seeds from previous chapters are tracked | Previous chapter's unresolved seeds appear in current chapter notes | Automated: seed ID continuity check across chapters |
| Adversity Connection | Each chapter's resolution creates next chapter's adversity | Chapter N consequence explicitly mentioned in Chapter N+1 setup | Manual review: causal link between adjacent chapters |

**Cyclical Engine Metrics:**

| Metric | Definition | Success Criteria | Measurement Method |
|--------|-----------|------------------|----------------------|
| Stakes Escalation | New adversity increases in complexity or intensity compared to previous cycle | 80%+ of new adversities raise stakes (higher severity score) | Manual review: Adversity severity comparison on 1-5 scale, new adversity ≥ previous |
| Resolution-Adversity Transition Quality | How naturally and inevitably the resolution creates the next adversity | Transition feels organic and causally connected, not forced or arbitrary | Manual review: Transition logic rating on 1-4 scale (1=forced, 4=inevitable) |
| Narrative Momentum | Reader desire to continue after cycle resolution | 80%+ readers report "need to know what happens next" after cycle completion | Reader survey: Forward momentum question with 4-point scale |

**Scene Summary Metrics:**

| Metric | Definition | Success Criteria | Measurement Method |
|--------|-----------|------------------|----------------------|
| Phase Distribution Balance | Scenes distributed across 5 cycle phases (3-7 scenes per chapter) | At least 1 scene per critical phase (virtue, consequence) | Automated: phase assignment count per chapter |
| Emotional Beat Assignment | Each scene has clear emotional trajectory and purpose | Emotional beat field populated with specific emotion | Manual review: emotional beat clarity and variety |
| Pacing Rhythm | Build to virtue scene (peak), release after consequence | Scene order follows: setup → build → peak → release → transition | Manual review: scene order matches cycle phase progression |

### 3.3 Content Metrics

**Scene Content Metrics:**

| Metric | Definition | Success Criteria | Measurement Method |
|--------|-----------|------------------|----------------------|
| Word Count Range Compliance | Scene length appropriate for cycle phase | Setup/Transition: 300-600 words<br>Confrontation: 500-800 words<br>Virtue: 800-1000 words<br>Consequence: 600-900 words | Automated: word count by phase |
| Cycle Alignment | Scene content matches assigned cycle phase guidelines | Phase-specific elements present (e.g., Virtue scene has moral elevation moment) | Manual review: phase checklist validation |
| Emotional Resonance | Scene creates intended emotional response (Gam-dong) | Reader feedback or test panel indicates emotional impact | Manual review: test reader surveys, emotion intensity ratings |

### 3.4 Quality Metrics

**Scene Evaluation Metrics (Architectonics of Engagement):**

| Category | Weight | Target Score | Measurement Method |
|----------|--------|--------------|----------------------|
| Plot Progression | 20% | ≥3.0/4.0 | AI evaluation: causal logic, conflict escalation, resolution quality |
| Character Development | 25% | ≥3.0/4.0 | AI evaluation: internal change, motivation clarity, arc progression |
| Pacing | 20% | ≥3.0/4.0 | AI evaluation: scene rhythm, tension management, beat timing |
| Prose Quality | 20% | ≥3.0/4.0 | AI evaluation: clarity, imagery, voice consistency, dialogue naturalism |
| World-Building | 15% | ≥3.0/4.0 | AI evaluation: setting integration, sensory details, world logic |

**Overall Quality Metrics:**

| Metric | Definition | Success Criteria | Measurement Method |
|--------|-----------|------------------|----------------------|
| Architectonics Scores | Weighted average across 5 categories | Overall score ≥3.0/4.0 ("Effective" level) | Automated: weighted average calculation |
| Pass Rate | Percentage of scenes passing quality threshold on first generation | ≥70% pass rate | Automated: passed scenes / total scenes × 100 |
| Iteration Count | Average number of improvement iterations per scene | ≤1.5 iterations per scene (max 2) | Automated: sum of iterations / scene count |

### 3.5 Assets Metrics

**Image Generation Metrics:**

| Metric | Definition | Success Criteria | Measurement Method |
|--------|-----------|------------------|----------------------|
| Image Quality | Visual coherence, prompt accuracy, artistic quality | No artifacts, prompt elements present, aesthetically pleasing | Manual review: quality checklist (1-5 scale) |
| Variant Generation Success | All 4 optimized variants generated successfully | AVIF + JPEG × mobile 1x/2x all present | Automated: variant count = 4 per image |
| Optimization Ratio | File size reduction from original to optimized variants | Average 40-60% size reduction across variants | Automated: compressed size / original size × 100 |

---

## Part IV: Evaluation Metrics

### 4.1 Quantitative Metrics

#### Structural Metrics

| Metric | Measurement | Target | Critical Threshold |
|--------|-------------|--------|----------------------|
| **Cycle Completeness** | % of cycles with all 5 components | 100% | 90% |
| **Causal Chain Continuity** | % of chapters with valid previous/next links | 100% | 95% |
| **Seed Resolution Rate** | Resolved seeds / Planted seeds | 60-80% | 50% |
| **Virtue Scene Presence** | % of chapters with exactly 1 virtue scene | 100% | 100% |
| **Phase Coverage** | % of chapters with all 5 cycle phases | 100% | 90% |

#### Quality Metrics

| Metric | Measurement | Target | Critical Threshold |
|--------|-------------|--------|----------------------|
| **Scene Quality Score** | Average evaluation score (1-4 scale) | 3.5+ | 3.0+ |
| **First-Pass Success Rate** | % of scenes passing evaluation on first generation | 85% | 70% |
| **Word Count Accuracy** | % of scenes within target word count ±10% | 90% | 75% |
| **Formatting Compliance** | % of scenes following all formatting rules | 100% | 95% |
| **Prose Variety** | Average sentence length variance | 15-25 words | 10-30 words |

#### Emotional Metrics

| Metric | Measurement | Target | Critical Threshold |
|--------|-------------|--------|----------------------|
| **Moral Elevation Detection** | % of readers identifying virtue scene correctly | 80% | 70% |
| **Gam-dong Response Rate** | % of readers reporting feeling "profoundly moved" | 80% | 60% |
| **Emotional Beat Accuracy** | % of scenes where readers identify intended emotion | 75% | 60% |
| **Catharsis Experience** | % of readers reporting emotional release | 70% | 50% |
| **Empathy Building** | % of readers caring about character outcomes | 90% | 75% |

### 4.2 Qualitative Evaluation Framework

**Reader Survey Template** (Mapped to Core Principles):

1. **Intrinsic Motivation** (Principle #1)
   - "Did the character act from genuine goodness or to get something?"
   - Target: 85%+ say "genuine goodness"

2. **Causal Logic Understanding** (Principles #2, #3)
   - "Did the character's success feel earned or lucky?"
   - Target: 80%+ say "earned through their actions"

3. **Moral Elevation Recognition** (Narrative Goal)
   - "Which scene made you feel most inspired by the character's goodness?"
   - Target: 80%+ identify the virtue scene

4. **Emotional Impact** (Narrative Goal)
   - "Rate how moved you felt by this story (1-5)"
   - Target: Average 4.0+, 80%+ report being "profoundly moved" (Gam-dong)

**Evaluation Rubric for Manual Review** (Core Principle Validation):

**Principle #1: Intrinsic Motivation (1-4 scale)**
- 4: All virtuous actions genuinely motivated, no transactional language
- 3: Mostly intrinsic motivation, 1-2 slightly strategic moments
- 2: Mix of genuine and strategic actions, undermines authenticity
- 1: Obviously transactional "good deeds," no authentic virtue

**Principles #2 & #3: Causal Linking & Seed Tracking (1-4 scale)**
- 4: All events causally linked, seeds planted and resolved, no deus ex machina
- 3: Mostly causally linked, 1-2 weak causal connections
- 2: Several coincidences or unearned resolutions, weak seed tracking
- 1: Deus ex machina present, no causal logic, random outcomes

**Principle #4: Cyclical Engine (1-4 scale)**
- 4: All 5 cycle components present, clearly defined, each resolution creates next adversity
- 3: All components present, some causal links weak, stakes escalate moderately
- 2: Missing 1 component or major causal gap, stakes don't escalate
- 1: Multiple components missing, no causal logic, no cycle perpetuation

**Principle #5: Emotional Authenticity (1-4 scale)**
- 4: Characters show emotions through body/action, readers feel deeply, POV discipline perfect
- 3: Emotions mostly shown, some telling, readers feel moderately, occasional POV slip
- 2: Mix of showing and telling, emotional impact weak, POV inconsistent
- 1: Emotions told not shown, no emotional impact, POV violations

---

## Part V: Iterative Improvement Methodology

### 5.1 Prompt Optimization Loop

**Core Principle**: All prompt improvements must enhance adherence to the 5 Core Principles (section 1.1).

**Process:**

1. **Baseline Test**: Generate 5-10 stories with current prompts
2. **Metric Collection**: Measure all quantitative and qualitative metrics (organized by Core Principle)
3. **Pattern Analysis**: Identify which Core Principles are violated in failures
4. **Prompt Refinement**: Update prompts to strengthen Core Principle adherence
5. **Validation Test**: Generate 3-5 stories with updated prompts
6. **Comparison**: Compare Core Principle validation metrics before/after
7. **Deploy or Iterate**: If improved (without regressing other principles), deploy; otherwise, iterate

**Documentation:**
- Log all prompt versions with timestamps and Core Principle focus
- Track metric changes per version (organized by Core Principle)
- Document which Core Principle violation was addressed and how

### 5.2 Common Failure Patterns & Solutions

Each failure pattern maps to a specific Core Principle violation. Solutions strengthen that principle.

#### Failure Pattern 1: Deus Ex Machina (Violates Principles #2, #3)

**Symptom**: Consequences feel random, not causally linked to character's prior actions

**Diagnosis Metrics**:
- Causal link clarity < 60% in reader surveys
- Expert review: "unearned" flag > 20% of chapters

**Prompt Fix**:
Add to consequence generation prompts:
- "The consequence MUST be causally linked to the character's prior actions in this or previous chapters."
- "Explicitly state HOW the virtue planted the seed for this consequence."
- "Use phrases like 'Because [character] had [past action], now [consequence].'"

Add explicit field:
- `causalExplanation`: Detailed explanation of how past actions led to this consequence

**Expected Improvement**: Causal link clarity → 80%+

#### Failure Pattern 2: Transactional Virtue (Violates Principle #1)

**Symptom**: Character kindness feels strategic, not genuine

**Diagnosis Metrics**:
- Reader survey: "acted for right reasons" < 70%
- Text analysis: High frequency of "in order to", "so that"

**Prompt Fix**:
Add to virtue generation prompts:
- "The character performs this virtuous action WITHOUT expectation of reward."
- "The character acts from their core values, not strategic thinking."
- "AVOID phrases like 'hoping to', 'in order to', 'so that' when describing motivation."
- "Focus on intrinsic motivation: empathy, moral principle, inability to do otherwise."

Add explicit field:
- `intrinsicMotivation`: Why the character acts from their core, not strategy

**Expected Improvement**: Intrinsic motivation perception → 85%+

#### Failure Pattern 3: Weak Emotional Beats (Violates Principle #5)

**Symptom**: Scenes don't evoke intended emotions

**Diagnosis Metrics**:
- Emotional beat accuracy < 60%
- Gam-dong response rate < 50%

**Prompt Fix**:
Add to scene content prompts:
- "Show emotions through physical sensations, body language, and action."
- "AVOID naming emotions ('she felt sad')."
- "Use sensory details that evoke the emotion in the reader."
- Phase-specific guidance:
  - Setup: Build empathy through vulnerability, relatable struggles
  - Virtue: Create moral elevation through witnessing pure goodness
  - Consequence: Deliver catharsis through earned, surprising payoff

Add explicit fields:
- `emotionalTechniques`: List of specific techniques used (body language, sensory details, action)
- `targetEmotionalResponse`: Clear emotion reader should feel

**Expected Improvement**: Emotional beat accuracy → 75%+

#### Failure Pattern 4: Weak Cyclical Engine (Violates Principle #4)

**Symptom**: Story feels episodic with disconnected cycles; resolutions don't naturally lead to new problems; stakes don't escalate

**Examples**:
- BAD: "After solving the water crisis, they celebrated. The next day, a completely unrelated fire broke out." (No connection)
- GOOD: "The new well attracted neighboring refugees, straining resources and creating territorial disputes." (Resolution creates next problem)

**Diagnosis Metrics**:
- Stakes Escalation < 70% (new adversities don't raise stakes)
- Resolution-Adversity Transition Quality < 2.5/4.0 (transitions feel forced)
- Narrative Momentum < 70% (readers don't feel compelled to continue)

**Root Causes**:
1. System prompts don't emphasize consequence → adversity connection
2. New adversity generated without considering previous resolution
3. Stakes don't progressively escalate across cycles
4. Resolution feels too complete (no loose threads)

**Prompt Fix**:

Add to chapter generation prompts:
- "The resolution of this chapter MUST create the next chapter's adversity. The consequence should have a secondary effect that becomes problematic."
- "Ensure stakes escalate: new adversity should be MORE complex/intense than previous one."
- "Leave narrative threads unresolved that pull reader forward."

Add explicit fields:
- `howResolutionCreatesNextAdversity`: Detailed explanation of causal connection
- `stakesEscalation`: Comparison showing increased complexity/intensity
- `narrativeHooks`: 2-3 unresolved elements driving forward

**Expected Improvement**:
- Stakes Escalation → 80%+
- Resolution-Adversity Transition Quality → 3.0+/4.0
- Narrative Momentum → 80%+
