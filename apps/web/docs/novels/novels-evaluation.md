# Novels Evaluation Guide: Adversity-Triumph Engine

## Executive Summary

This document outlines a comprehensive evaluation strategy for the novels generation system using the Adversity-Triumph Engine. The evaluation framework is **directly synchronized with the Core Principles** defined in the specification, ensuring that all testing validates the fundamental principles of the narrative engine.

**Key Features:**
- **Perfect 1:1 Core Principle Mapping**: Each Core Principle has dedicated Evaluation Objective, Success Criteria table, and Qualitative Rubric
- **Table-Based Metrics**: All success criteria organized in clear tables with Target and Critical Threshold values
- **Quantitative & Qualitative Framework**: Comprehensive measurement across structure, quality, and emotional impact
- **Iterative Improvement**: Data-driven prompt optimization based on Core Principle adherence

**Document Structure:**
- **Part I (Testing Objectives)**: Evaluation objectives, success criteria tables, and qualitative framework
- **Part II (Metrics & Evaluation)**: Detailed metric descriptions by generation phase

**Related Documents:**
- 📖 **Specification** (`novels-specification.md`): Core Principles (section 1.5), data model, and theoretical foundation
- 📋 **Development Guide** (`novels-development.md`): API implementations and prompt specifications

---

## Part I: Testing Objectives

### 1.1 Evaluation Objectives

**Each objective directly maps to a Core Principle (section 1.5 of specification):**

1. **Cyclic Structure** (multi-scale)
   - Verify complete adversity-triumph cycles (4-phase engine)
   - Confirm every resolution creates next adversity
   - Track nested cycles: micro-cycles within macro arcs at all narrative levels
   - Assess perpetual narrative momentum maintenance

2. **Intrinsic Motivation**
   - Verify virtuous actions are genuine, not transactional or strategic
   - Ensure no expectation of reward shown during virtue phase
   - Measure reader perception of character authenticity
   - Assess moral elevation triggering in audience

3. **Earned Consequence** (causal linking + temporal separation)
   - Verify every event causally linked to previous actions through traceable seeds (no deus ex machina)
   - Verify temporal separation between virtue and consequence (Pattern A timing)
   - Measure "earned luck" feeling and karmic payoff perception
   - Track seed planting and resolution across story

4. **Character Transformation**
   - Verify internal flaw (from Character.internalFlaw) drives adversity
   - Verify virtuous action confronts and challenges flaw
   - Assess whether earned consequence enables growth and healing
   - Track character arc progression and transformation across story

5. **Emotional Resonance**
   - Measure empathy building (reader cares about characters)
   - Measure catharsis experience (emotional release)
   - Measure moral elevation response (inspired by virtue)
   - Measure Gam-dong achievement (profound emotional moving)
   - Verify settings actively amplify emotional beats through element arrays

### 1.2 Success Criteria

**Each table validates a Core Principle with quantitative and qualitative metrics:**

#### Core Principle #1: Cyclic Structure (multi-scale)

| Metric | Measurement | Target | Critical Threshold |
|--------|-------------|--------|-------------------|
| **Cycle Completeness** | % of cycles with all 4 phases (adversity, virtue, consequence, new adversity) | 100% | 90% |
| **Chapter Cycle Focus** | % of chapters containing exactly 1 complete micro-cycle | 100% | 100% |
| **Phase Coverage** | % of chapters with all 5 scene phases (setup, adversity, virtue, consequence, transition) | 100% | 90% |
| **Resolution-Adversity Transition** | % of cycle resolutions naturally creating next adversity with escalated stakes | 80% | 70% |
| **Stakes Escalation Quality** | % of stake escalations feeling organic and logical | 85% | 75% |
| **Narrative Momentum** | % of cycles maintaining perpetual narrative momentum (no pacing lulls) | 90% | 80% |
| **Nested Cycle Alignment** | % of micro-cycles advancing their macro arcs | 85% | 75% |
| **Causal Chain Continuity** | % of chapters with valid previous/next causal links | 100% | 95% |
| **Forward Momentum (Reader)** | % of readers reporting "need to know what happens next" after cycle completion | 90% | 80% |

#### Core Principle #2: Intrinsic Motivation

| Metric | Measurement | Target | Critical Threshold |
|--------|-------------|--------|-------------------|
| **Character Action Authenticity** | % of character actions feeling intrinsically motivated (reader survey) | 90% | 80% |
| **Transactional Language Absence** | % of virtuous actions lacking transactional language ("to get X") | 85% | 75% |
| **Strategic Good Deeds** | % of obviously strategic "good deeds" (e.g., helping only when witnessed) | 0% | 0% |
| **Reward Expectation Display** | % of virtue scenes showing expectation of reward | 0% | 0% |
| **Genuine Goodness Perception** | % of readers saying character acted from "genuine goodness" not "to get something" | 85% | 75% |
| **Moral Elevation Trigger** | % of readers reporting moral elevation during virtue scenes | 80% | 70% |
| **Dramatic Irony** | % of dramatic irony between externalGoal and true needs | 90% | 80% |

#### Core Principle #3: Earned Consequence (causal linking + temporal separation)

| Metric | Measurement | Target | Critical Threshold |
|--------|-------------|--------|-------------------|
| **Causal Connection Clarity** | % of story events with explicit causal connections to prior events through traceable seeds | 90% | 70% |
| **Deus Ex Machina Incidents** | % of deus ex machina incidents (no unearned resolutions) | 0% | 0% |
| **Temporal Separation (Pattern A)** | % of MACRO virtues and consequences temporally separated | 85% | 75% |
| **Earned Success Perception** | % of readers saying success felt "earned through actions" not "lucky" | 80% | 70% |
| **Surprising but Inevitable** | % of consequences feeling inevitable in retrospect but surprising in moment | 85% | 75% |
| **Earned Luck Feeling** | % of readers perceiving "earned luck" feeling and karmic payoff | 90% | 80% |
| **Seed Resolution Rate** | Resolved seeds / Planted seeds | 60-80% | 50% |
| **Seed Planting Success** | % of seed plantings successfully resolving in later content | 85% | 75% |
| **Seed Tracking Completeness** | % of seeds tracked with planting and expected payoff phases | 100% | 100% |
| **Seed Resolution Quality** | % of seed resolutions feeling "surprising but inevitable" | 90% | 80% |
| **Relationship Seed Depth** | % of seeds involving human relationships (not just objects/events) | 75% | 60% |

#### Core Principle #4: Character Transformation

| Metric | Measurement | Target | Critical Threshold |
|--------|-------------|--------|-------------------|
| **Internal Flaw Definition** | % of characters with explicitly defined internalFlaw with cause | 100% | 100% |
| **Character Depth** | % of characters with 1+ internal flaw and clear moral test | 100% | 90% |
| **Flaw-Driven Adversity** | % of internal flaws directly driving adversity creation | 90% | 80% |
| **Virtue Confronts Flaw** | % of virtuous actions directly confronting and challenging the character's internalFlaw | 90% | 80% |
| **Consequence Enables Growth** | % of earned consequences demonstrably enabling character growth and healing | 85% | 75% |
| **Arc Progression Perception** | % of readers perceiving authentic character arc progression across story | 80% | 70% |
| **Transformation Articulation** | % of readers able to articulate how character transformed by story end | 75% | 60% |
| **Earned Transformation** | % of character transformations feeling earned, not sudden or arbitrary | 85% | 75% |
| **Arc Structure Clarity** | % of character arcs showing clear beginning (flaw) → middle (virtue) → end (growth) progression | 90% | 80% |

#### Core Principle #5: Emotional Resonance

| Metric | Measurement | Target | Critical Threshold |
|--------|-------------|--------|-------------------|
| **Scene Quality Score** | Average scene evaluation score (1-4 scale) | 3.5+ | 3.0+ |
| **First-Pass Success Rate** | % of scenes passing quality evaluation on first attempt (3.0+/4.0 score) | 85% | 70% |
| **Moral Elevation Detection** | % of readers identifying moral elevation moment correctly | 80% | 70% |
| **Gam-dong Achievement** | % of readers reporting feeling "profoundly moved" (Gam-dong) | 80% | 60% |
| **Empathy Building** | % of readers caring about character outcomes | 75% | 60% |
| **Catharsis Experience** | % of readers reporting emotional release | 70% | 50% |
| **Moral Framework Clarity** | % of readers able to articulate the moral framework | 90% | 75% |
| **Emotional Beat Accuracy** | % of scenes where readers identify intended emotion | 75% | 60% |
| **Emotional Beat Assignment** | % of scenes with distinct emotional beats matching cycle phase | 75% | 60% |
| **Scene Memorability** | % of readers spontaneously mentioning specific scenes as "memorable" | 60% | 50% |
| **Setting Amplification** | % of settings successfully amplifying emotional beats through element arrays | 80% | 70% |
| **Word Count Accuracy** | % of scenes within target word count ±10% | 90% | 75% |
| **Formatting Compliance** | % of scenes following all formatting rules | 100% | 95% |
| **Prose Variety** | Average sentence length variance (words) | 15-25 | 10-30 |

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

### 1.3 Qualitative Evaluation Framework

**Reader Survey Template** (Mapped to Core Principles):

| Core Principle | Survey Question | Target Response |
|----------------|----------------|-----------------|
| **#1: Cyclic Structure** | "Did each chapter's resolution naturally lead to the next challenge?" | 85%+ say "yes, progression felt organic" |
| **#2: Intrinsic Motivation** | "Did the character act from genuine goodness or to get something?" | 85%+ say "genuine goodness" |
| **#3: Earned Consequence** | "Did the character's success feel earned or lucky?" | 80%+ say "earned through their actions" |
| **#4: Character Transformation** | "Did you notice clear character growth from beginning to end?" | 80%+ say "yes, character clearly transformed" |
| **#5: Emotional Resonance** | "Rate how moved you felt by this story (1-5)" | Average 4.0+, 80%+ report being "profoundly moved" (Gam-dong) |
| **Narrative Goal** | "Which scene made you feel most inspired by the character's goodness?" | 80%+ identify the virtue scene |

**Evaluation Rubric for Manual Review** (Core Principle Validation):

#### Core Principle #1: Cyclic Structure (1-4 scale)

| Score | Criteria |
|-------|----------|
| **4** | All 4 cycle phases present, each resolution creates next adversity, nested cycles aligned, perpetual momentum |
| **3** | All phases present, most transitions organic, minor momentum lulls |
| **2** | Missing 1 phase or weak transitions, stakes don't escalate consistently |
| **1** | Multiple phases missing, no causal logic, cycles don't perpetuate |

#### Core Principle #2: Intrinsic Motivation (1-4 scale)

| Score | Criteria |
|-------|----------|
| **4** | All virtuous actions genuinely motivated, no transactional language, no expectation of reward shown |
| **3** | Mostly intrinsic motivation, 1-2 slightly strategic moments |
| **2** | Mix of genuine and strategic actions, undermines authenticity |
| **1** | Obviously transactional "good deeds," no authentic virtue |

#### Core Principle #3: Earned Consequence (1-4 scale)

| Score | Criteria |
|-------|----------|
| **4** | All events causally linked through traceable seeds, temporal separation present, no deus ex machina, "earned luck" feeling |
| **3** | Mostly causally linked with temporal separation, 1-2 weak causal connections |
| **2** | Several coincidences or unearned resolutions, weak seed tracking, insufficient temporal separation |
| **1** | Deus ex machina present, no causal logic, random outcomes, no temporal separation |

#### Core Principle #4: Character Transformation (1-4 scale)

| Score | Criteria |
|-------|----------|
| **4** | Internal flaw clearly drives adversity, virtuous actions confront flaw, earned consequences enable healing, arc progression evident |
| **3** | Flaw drives most adversity, virtue confronts flaw, moderate growth visible |
| **2** | Weak flaw-adversity connection, virtue doesn't address flaw, minimal transformation |
| **1** | No clear flaw, no transformation, character static throughout story |

#### Core Principle #5: Emotional Resonance (1-4 scale)

| Score | Criteria |
|-------|----------|
| **4** | Strong empathy, catharsis, moral elevation, and Gam-dong achieved; settings amplify emotions effectively |
| **3** | Most emotional goals achieved, settings support emotions adequately |
| **2** | Some emotional impact, but inconsistent or weak; settings underutilized |
| **1** | No emotional resonance, flat emotional experience, settings don't amplify |

---

