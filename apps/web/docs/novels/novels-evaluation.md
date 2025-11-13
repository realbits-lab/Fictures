# Novels Evaluation Guide: Adversity-Triumph Engine

## Executive Summary

This document outlines a comprehensive evaluation strategy for the novels generation system using the Adversity-Triumph Engine. The evaluation framework is **directly synchronized with the Core Principles** defined in the specification, ensuring that all testing validates the fundamental principles of the narrative engine.

**Key Features:**
- **Perfect 1:1 Core Principle Mapping**: Each Core Principle has dedicated Evaluation Objective, Success Criteria table, and Qualitative Rubric
- **AI-Based Evaluation**: All metrics evaluated by AI models, enabling automated quality assessment at scale
- **Unified Table Format**: All metrics use consistent 5-column format (Metric | Description | Target | Threshold | Method)
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

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Cycle Completeness** | % of cycles with all 4 phases (adversity, virtue, consequence, new adversity) present | 100% | 90% | Automated: Phase detection in chapter structure |
| **Chapter Cycle Focus** | % of chapters containing exactly 1 complete micro-cycle | 100% | 100% | Automated: Cycle count per chapter |
| **Phase Coverage** | % of chapters with all 5 scene phases (setup, adversity, virtue, consequence, transition) | 100% | 90% | Automated: Scene phase assignment detection |
| **Resolution-Adversity Transition** | % of cycle resolutions naturally creating next adversity with escalated stakes | 80% | 70% | AI evaluation: Transition logic assessment (1-4 scale) |
| **Stakes Escalation Quality** | % of stake escalations feeling organic and logical | 85% | 75% | AI evaluation: Adversity severity comparison (1-5 scale) |
| **Narrative Momentum** | % of cycles maintaining perpetual narrative momentum (no pacing lulls) | 90% | 80% | AI evaluation: Momentum and pacing analysis |
| **Nested Cycle Alignment** | % of micro-cycles advancing their macro arcs | 85% | 75% | AI evaluation: Cycle-arc progression mapping |
| **Causal Chain Continuity** | % of chapters with valid previous/next causal links | 100% | 95% | Automated: Causal link tracking across chapters |
| **Forward Momentum** | AI-evaluated % of cycles creating compelling narrative pull forward | 90% | 80% | AI evaluation: Hook and transition strength scoring |

#### Core Principle #2: Intrinsic Motivation

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Character Action Authenticity** | AI-evaluated % of character actions demonstrating intrinsic motivation | 90% | 80% | AI evaluation: Motivation analysis in action context |
| **Transactional Language Absence** | % of virtuous actions lacking transactional language ("to get X", "in order to") | 85% | 75% | Automated: Language pattern detection in virtue scenes |
| **Strategic Good Deeds** | % of obviously strategic "good deeds" (e.g., helping only when witnessed) | 0% | 0% | AI evaluation: Context and motivation assessment |
| **Reward Expectation Display** | % of virtue scenes showing expectation of reward | 0% | 0% | AI evaluation: Character thought/dialogue analysis |
| **Genuine Goodness Perception** | AI-evaluated % of actions stemming from "genuine goodness" not transactional intent | 85% | 75% | AI evaluation: Motivation authenticity scoring |
| **Moral Elevation Trigger** | AI-evaluated % of virtue scenes creating moral elevation response | 80% | 70% | AI evaluation: Emotional impact and virtue presentation |
| **Dramatic Irony** | % of character arcs with clear dramatic irony between externalGoal and true needs | 90% | 80% | AI evaluation: Goal-need discrepancy analysis |

#### Core Principle #3: Earned Consequence (causal linking + temporal separation)

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Causal Connection Clarity** | % of story events with explicit causal connections to prior events through traceable seeds | 90% | 70% | AI evaluation: Causal chain analysis and seed linkage |
| **Deus Ex Machina Incidents** | % of unearned resolutions (deus ex machina) | 0% | 0% | AI evaluation: Resolution causality assessment |
| **Temporal Separation (Pattern A)** | % of MACRO virtues and consequences temporally separated by chapters | 85% | 75% | Automated: Chapter distance between virtue and consequence |
| **Earned Success Perception** | AI-evaluated % of successes feeling "earned through actions" not "lucky" | 80% | 70% | AI evaluation: Consequence-action causality scoring |
| **Surprising but Inevitable** | AI-evaluated % of consequences feeling inevitable in retrospect but surprising in moment | 85% | 75% | AI evaluation: Foreshadowing and payoff balance |
| **Earned Luck Feeling** | AI-evaluated % demonstrating "earned luck" feeling and karmic payoff | 90% | 80% | AI evaluation: Karmic justice and causality perception |
| **Seed Resolution Rate** | Ratio of resolved seeds to planted seeds | 60-80% | 50% | Automated: Seed tracking database analysis |
| **Seed Planting Success** | % of planted seeds successfully resolving in later content | 85% | 75% | Automated: Seed resolution tracking |
| **Seed Tracking Completeness** | % of seeds tracked with planting chapter and expected payoff phase | 100% | 100% | Automated: Seed database completeness check |
| **Seed Resolution Quality** | AI-evaluated % of seed resolutions feeling "surprising but inevitable" | 90% | 80% | AI evaluation: Seed payoff quality assessment |
| **Relationship Seed Depth** | % of seeds involving human relationships (not just objects/events) | 75% | 60% | AI evaluation: Seed content classification |

#### Core Principle #4: Character Transformation

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Internal Flaw Definition** | % of characters with explicitly defined internalFlaw with cause | 100% | 100% | Automated: Character schema field validation |
| **Character Depth** | % of characters with 1+ internal flaw and clear moral test | 100% | 90% | Automated: Character data completeness check |
| **Flaw-Driven Adversity** | % of internal flaws directly driving adversity creation | 90% | 80% | AI evaluation: Flaw-adversity causality analysis |
| **Virtue Confronts Flaw** | % of virtuous actions directly confronting and challenging the character's internalFlaw | 90% | 80% | AI evaluation: Virtue-flaw relationship assessment |
| **Consequence Enables Growth** | % of earned consequences demonstrably enabling character growth and healing | 85% | 75% | AI evaluation: Consequence-growth causality analysis |
| **Arc Progression Perception** | AI-evaluated % of arcs demonstrating authentic progression across story | 80% | 70% | AI evaluation: Character change trajectory analysis |
| **Transformation Articulation** | AI-evaluated % of transformations with clear beginning-middle-end structure | 75% | 60% | AI evaluation: Arc structure clarity assessment |
| **Earned Transformation** | AI-evaluated % of transformations feeling earned, not sudden or arbitrary | 85% | 75% | AI evaluation: Transformation pacing and causality |
| **Arc Structure Clarity** | % of character arcs showing clear beginning (flaw) → middle (virtue) → end (growth) progression | 90% | 80% | AI evaluation: Three-act arc structure validation |

#### Core Principle #5: Emotional Resonance

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Scene Quality Score** | Average scene evaluation score (Architectonics of Engagement, 1-4 scale) | 3.5+ | 3.0+ | AI evaluation: Weighted quality across 5 categories |
| **First-Pass Success Rate** | % of scenes passing quality evaluation on first attempt (3.0+/4.0 score) | 85% | 70% | Automated: Pass rate calculation from eval scores |
| **Moral Elevation Detection** | AI-evaluated % of virtue scenes demonstrating moral elevation moments | 80% | 70% | AI evaluation: Virtue scene emotional impact analysis |
| **Gam-dong Achievement** | AI-evaluated % of stories creating "profoundly moved" (Gam-dong) response | 80% | 60% | AI evaluation: Deep emotional resonance assessment |
| **Empathy Building** | AI-evaluated % of stories building strong reader-character connection | 75% | 60% | AI evaluation: Character relatability and depth |
| **Catharsis Experience** | AI-evaluated % of stories delivering emotional release and resolution | 70% | 50% | AI evaluation: Cathartic arc completion analysis |
| **Moral Framework Clarity** | AI-evaluated % of stories with clear, articulate moral frameworks | 90% | 75% | AI evaluation: Moral theme consistency and clarity |
| **Emotional Beat Accuracy** | AI-evaluated % of scenes achieving intended emotional impact | 75% | 60% | AI evaluation: Scene emotion-objective alignment |
| **Emotional Beat Assignment** | % of scenes with distinct emotional beats matching cycle phase | 75% | 60% | AI evaluation: Emotion-phase correspondence check |
| **Scene Memorability** | AI-evaluated % of scenes with distinctive, memorable emotional moments | 60% | 50% | AI evaluation: Scene distinctiveness and impact |
| **Setting Amplification** | % of settings successfully amplifying emotional beats through element arrays | 80% | 70% | AI evaluation: Setting-emotion integration analysis |
| **Word Count Accuracy** | % of scenes within target word count ±10% by cycle phase | 90% | 75% | Automated: Word count validation per phase |
| **Formatting Compliance** | % of scenes following all formatting rules (3-sentence paragraphs, etc.) | 100% | 95% | Automated: Formatting rule validation |
| **Prose Variety** | Average sentence length variance across scenes (words) | 15-25 | 10-30 | Automated: Sentence length statistical analysis |

### 1.3 Qualitative Evaluation Framework

**AI Evaluation Prompt Template** (Mapped to Core Principles):

| Core Principle | Evaluation Question | Target Response |
|----------------|-------------------|-----------------|
| **#1: Cyclic Structure** | "Does each chapter's resolution naturally lead to the next challenge?" | 85%+ evaluated as "yes, progression feels organic" |
| **#2: Intrinsic Motivation** | "Do characters act from genuine goodness or transactional intent?" | 85%+ evaluated as "genuine goodness" |
| **#3: Earned Consequence** | "Do character successes feel earned or lucky?" | 80%+ evaluated as "earned through their actions" |
| **#4: Character Transformation** | "Is there clear character growth from beginning to end?" | 80%+ evaluated as "yes, character clearly transformed" |
| **#5: Emotional Resonance** | "Rate the emotional impact of this story (1-5 scale)" | Average 4.0+, 80%+ evaluated as "profoundly moving" (Gam-dong) |
| **Narrative Goal** | "Which scene demonstrates the most compelling moral elevation?" | 80%+ AI correctly identifies the virtue scene |

**AI Evaluation Rubric** (Core Principle Validation):

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

## Part II: Metrics by Generation Phase

This section provides detailed metric descriptions organized by generation phase, matching the 9-phase pipeline.

### 2.1 Story Generation Metrics

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Moral Framework Clarity** | How well the moral framework defines testable virtues and meaningful consequences | 3+ virtues named explicitly, causal logic present | 2+ virtues, basic logic | AI evaluation: Virtue identification and consequence logic |
| **Thematic Coherence** | Consistency between premise, moral framework, and genre | Theme supports moral tests, no contradictions | Minor inconsistencies allowed | Automated: Keyword alignment across fields |
| **Genre Consistency** | Story elements align with genre conventions and reader expectations | Genre-appropriate tone, conflict types, world rules | 80%+ genre alignment | AI evaluation: Genre checklist validation |

### 2.2 Characters Generation Metrics

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Character Depth** | Complexity of internal flaws, motivations, and arc potential | Each character has 1+ internal flaw, clear moral test, backstory > 200 chars | Internal flaw field populated | Automated: Field validation and length check |
| **Jeong System Implementation** | Korean emotional bond system properly defined between characters | At least 2 Jeong relationships defined with type and intensity | 1+ Jeong relationship | Automated: Jeong array validation |
| **Voice Distinctiveness** | Each character has unique speech patterns and personality traits | No overlapping voice descriptions, personality keyword overlap < 30% | Keyword overlap < 50% | Automated: Voice field uniqueness and keyword analysis |

### 2.3 Settings Generation Metrics

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Symbolic Meaning Clarity** | Setting's connection to moral framework is explicit | Symbolic meaning field directly references moral themes | Symbolic meaning field populated | AI evaluation: Moral framework-setting alignment |
| **Sensory Detail Richness** | All 5 senses are engaged in setting description | At least 3 of 5 senses present in description | 2+ senses present | Automated: Sense keyword detection (sight, sound, smell, touch, taste) |
| **Cycle Amplification Design** | How setting amplifies adversity-triumph cycle phases | Each cycle phase has setting amplification elements defined | 3+ phases have amplification | AI evaluation: Element array completeness per phase |

### 2.4 Part Generation Metrics

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Cycle Coherence** | 5-phase structure (Setup → Confrontation → Virtue → Consequence → Transition) is complete | All 5 phases present and distinct per character | 4+ phases present | Automated: Phase detection in part summary |
| **Conflict Definition Clarity** | Internal and external conflicts are explicitly stated | Both conflict types named with specific examples | Both fields populated | AI evaluation: Conflict field analysis and concreteness |
| **Earned Luck Tracking** | Seeds planted in setup/confrontation, resolved in consequence | At least 1 seed per cycle with planting and resolution noted | Seed tracking table exists | Automated: Seed tracking table validation |

### 2.5 Chapter Generation Metrics

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Single-Cycle Focus** | Each chapter contains exactly ONE complete adversity-triumph cycle | Chapter focuses on 1-2 characters, one conflict, cycle count = 1 | Cycle count = 1 | AI evaluation: Cycle identification and focus analysis |
| **Seed Tracking Completeness** | All seeds from previous chapters are tracked | Previous chapter's unresolved seeds appear in current chapter notes | 80%+ seeds tracked | Automated: Seed ID continuity check across chapters |
| **Adversity Connection** | Each chapter's resolution creates next chapter's adversity | Chapter N consequence explicitly mentioned in Chapter N+1 setup | Causal link exists | AI evaluation: Inter-chapter causal link analysis |
| **Stakes Escalation** | New adversity increases in complexity or intensity compared to previous cycle | 80%+ of new adversities raise stakes (higher severity score) | 60%+ escalation | AI evaluation: Adversity severity comparison (1-5 scale) |
| **Resolution-Adversity Transition Quality** | How naturally and inevitably the resolution creates the next adversity | Transition feels organic and causally connected (rating 3.0+/4.0) | Rating 2.5+/4.0 | AI evaluation: Transition logic assessment (1-4 scale) |
| **Narrative Momentum** | AI-evaluated desire to continue after cycle resolution | 80%+ cycles demonstrate compelling forward momentum | 60%+ momentum | AI evaluation: Hook and transition strength analysis |

### 2.6 Scene Summary Generation Metrics

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Phase Distribution Balance** | Scenes distributed across 5 cycle phases (3-7 scenes per chapter) | At least 1 scene per critical phase (virtue, consequence) | All 5 phases represented | Automated: Phase assignment count per chapter |
| **Emotional Beat Assignment** | Each scene has clear emotional trajectory and purpose | Emotional beat field populated with specific, varied emotions | All scenes have emotion | AI evaluation: Emotional beat clarity and variety |
| **Pacing Rhythm** | Build to virtue scene (peak), release after consequence | Scene order follows: setup → build → peak → release → transition | Correct phase sequence | AI evaluation: Scene order and cycle phase progression |

### 2.7 Scene Content Generation Metrics

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Word Count Range Compliance** | Scene length appropriate for cycle phase | Setup/Transition: 300-600<br>Confrontation: 500-800<br>Virtue: 800-1000<br>Consequence: 600-900 words | Within ±20% of range | Automated: Word count by phase validation |
| **Cycle Alignment** | Scene content matches assigned cycle phase guidelines | Phase-specific elements present (e.g., Virtue scene has moral elevation moment) | Key phase elements present | AI evaluation: Phase checklist validation |
| **Emotional Resonance** | Scene creates intended emotional response (Gam-dong) | AI-evaluated emotional impact matches scene objective | 3.0+/4.0 emotion score | AI evaluation: Emotion intensity and alignment |

---
