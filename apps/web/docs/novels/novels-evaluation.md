# Novels Evaluation Guide: Adversity-Triumph Engine

## Executive Summary

This document outlines a comprehensive evaluation strategy for the novels generation system using the Adversity-Triumph Engine. The evaluation framework is **directly synchronized with the Core Principles** defined in the specification, ensuring that all testing validates the fundamental principles of the narrative engine.

**Key Features:**
- **Core Principles Validation**: All evaluation objectives map to the Core Principles from the specification
- **Quantitative & Qualitative Metrics**: Comprehensive measurement across structure, quality, and emotional impact
- **Iterative Improvement**: Data-driven prompt optimization based on Core Principle adherence
- **Production Testing Results**: Real-world validation with complete evaluation examples

**Related Documents:**
- 📖 **Specification** (`novels-specification.md`): Core Principles (section 1.5), data model, and theoretical foundation
- 📋 **Development Guide** (`novels-development.md`): API implementations and prompt specifications

---

## Part I: Testing Objectives

### 1.1 Evaluation Objectives

1. **Intrinsic Motivation Validation**
   - Verify virtuous actions are genuine, not strategic or transactional
   - Measure reader perception of character authenticity
   - Assess dramatic irony between character's externalGoal and true needs

2. **Causal Integrity Verification**
   - Verify every event connects to previous actions
   - Track seed planting and resolution across story
   - Detect and eliminate deus ex machina incidents
   - Measure "earned luck" vs random luck perception

3. **Cyclical Engine Functionality**
   - Verify complete adversity-triumph cycles
   - Confirm every resolution creates next adversity
   - Track stakes escalation across cycles
   - Assess narrative momentum maintenance

4. **Emotional Resonance Achievement**
   - Measure empathy building (reader cares about characters)
   - Measure catharsis experience (emotional release)
   - Measure moral elevation response (inspired by virtue)
   - Measure Gam-dong achievement (profound emotional moving)

### 1.2 Success Criteria

**Intrinsic Motivation:**
- ✅ 90%+ character actions feel intrinsically motivated (reader survey)
- ✅ 85%+ virtuous actions lack transactional language ("to get X")
- ✅ 0% obviously strategic "good deeds" (e.g., helping only when witnessed)
- ✅ 85%+ readers say character acted from "genuine goodness" not "to get something"
- ✅ 90%+ dramatic irony between externalGoal and true needs

**Causal Linking:**
- ✅ 70%+ causal links are clear and logical (manual review)
- ✅ 0% deus ex machina incidents (no unearned resolutions)
- ✅ 80%+ readers say success felt "earned through actions" not "lucky"
- ✅ 90%+ story events have explicit causal connections to prior events
- ✅ 85%+ consequences are inevitable in retrospect but surprising in moment

**Seed Tracking:**
- ✅ 85%+ seed plantings successfully resolve in later content
- ✅ 60-80% seed resolution rate (resolved seeds / planted seeds)
- ✅ 100% seeds tracked with planting and expected payoff phases
- ✅ 90%+ seed resolutions feel "surprising but inevitable"
- ✅ 75%+ seeds involve human relationships (not just objects/events)

**Cyclical Engine:**
- ✅ 90%+ cycles have all 5 components (adversity, virtue, consequence, new adversity, causal link)
- ✅ 80%+ cycle resolutions naturally create next adversity with escalated stakes
- ✅ 100% chapters contain exactly 1 complete cycle
- ✅ 85%+ stake escalations feel organic and logical
- ✅ 90%+ cycles maintain narrative momentum (no pacing lulls)

**Emotional Resonance:**
- ✅ 85%+ scenes pass quality evaluation on first attempt (3.0+/4.0 score)
- ✅ 80%+ test readers identify moral elevation moment correctly
- ✅ 80%+ readers report feeling "moved" (Gam-dong)
- ✅ 75%+ readers care about character outcomes (empathy building)
- ✅ 70%+ readers report emotional release (catharsis experience)
- ✅ 90%+ readers can articulate the moral framework
- ✅ 75%+ scenes have distinct emotional beats matching cycle phase
- ✅ 85%+ average scene quality score (3.5+/4.0)
- ✅ 60%+ readers spontaneously mention specific scenes as "memorable"

---

## Part II: Metrics & Evaluation

This section provides detailed metric descriptions organized by category, implementation examples, and iterative improvement methodology.

### 2.1 Foundation Metrics

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

### 2.2 Structure Metrics

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

### 2.3 Content Metrics

**Scene Content Metrics:**

| Metric | Definition | Success Criteria | Measurement Method |
|--------|-----------|------------------|----------------------|
| Word Count Range Compliance | Scene length appropriate for cycle phase | Setup/Transition: 300-600 words<br>Confrontation: 500-800 words<br>Virtue: 800-1000 words<br>Consequence: 600-900 words | Automated: word count by phase |
| Cycle Alignment | Scene content matches assigned cycle phase guidelines | Phase-specific elements present (e.g., Virtue scene has moral elevation moment) | Manual review: phase checklist validation |
| Emotional Resonance | Scene creates intended emotional response (Gam-dong) | Reader feedback or test panel indicates emotional impact | Manual review: test reader surveys, emotion intensity ratings |

### 2.4 Quality Metrics

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

### 2.5 Assets Metrics

**Image Generation Metrics:**

| Metric | Definition | Success Criteria | Measurement Method |
|--------|-----------|------------------|----------------------|
| Image Quality | Visual coherence, prompt accuracy, artistic quality | No artifacts, prompt elements present, aesthetically pleasing | Manual review: quality checklist (1-5 scale) |
| Variant Generation Success | All 4 optimized variants generated successfully | AVIF + JPEG × mobile 1x/2x all present | Automated: variant count = 4 per image |
| Optimization Ratio | File size reduction from original to optimized variants | Average 40-60% size reduction across variants | Automated: compressed size / original size × 100 |

---

## Part III: Evaluation Metrics

### 3.1 Quantitative Metrics

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

### 3.2 Qualitative Evaluation Framework

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

---

