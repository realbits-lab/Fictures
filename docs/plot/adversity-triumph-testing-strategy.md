# Adversity-Triumph Engine Testing Strategy

## Executive Summary

This document outlines a comprehensive testing strategy for the Adversity-Triumph narrative generation system, including quantitative metrics, qualitative evaluation frameworks, and iterative prompt improvement methodology.

---

## Part I: Testing Objectives

### 1.1 Primary Goals

1. **Structural Integrity**: Verify adversity-triumph cycles are complete and causally linked
2. **Emotional Resonance**: Measure audience emotional response to generated content
3. **Narrative Quality**: Assess prose quality, character depth, pacing
4. **System Reliability**: Ensure consistent generation across varied prompts
5. **Prompt Optimization**: Iteratively improve system prompts based on results

### 1.2 Success Criteria

**Must Have** (MVP Requirements):
- ✅ 90%+ cycles have all 5 components (adversity, virtue, consequence, new adversity, causal link)
- ✅ 85%+ scenes pass quality evaluation on first attempt (3.0+/4.0 score)
- ✅ 80%+ test readers identify moral elevation moment correctly
- ✅ 70%+ causal links are clear and logical
- ✅ 0% deus ex machina incidents (no unearned resolutions)

**Should Have** (Quality Goals):
- ✅ 80%+ readers report feeling "moved" (Gam-dong)
- ✅ 75%+ scenes have distinct emotional beats matching cycle phase
- ✅ 90%+ character actions feel intrinsically motivated
- ✅ 85%+ seed plantings successfully resolve in later content

**Nice to Have** (Excellence Goals):
- ✅ 85%+ average scene quality score (3.5+/4.0)
- ✅ 90%+ readers can articulate the moral framework
- ✅ 60%+ readers spontaneously mention specific scenes as "memorable"

---

## Part II: Testing Levels

### 2.1 Unit Testing (Component Level)

Test each generation API independently.

#### Theme Generation Tests

**Input Validation**:
```typescript
describe('Theme Generation', () => {
  test('should extract general theme from user prompt', () => {
    const input = "A story about refugees after war";
    const output = generateTheme(input);

    expect(output.theme).toMatch(/^In .+, .+ is tested when .+$/);
    expect(output.theme).not.toContain('Chapter'); // No plot specifics
    expect(output.theme).not.toContain('scene'); // No plot specifics
  });

  test('should identify moral framework', () => {
    const output = generateTheme(input);

    expect(output.moralFramework).toContain('virtue');
    expect(output.moralFramework).toContain('because');
    expect(output.moralFramework.length).toBeGreaterThan(100); // Substantial
  });

  test('should create 2-4 characters with complete fields', () => {
    const output = generateTheme(input);

    expect(output.characters.length).toBeGreaterThanOrEqual(2);
    expect(output.characters.length).toBeLessThanOrEqual(4);

    output.characters.forEach(char => {
      expect(char.name).toBeTruthy();
      expect(char.coreTrait).toBeTruthy();
      expect(char.internalFlaw).toMatch(/fear|believe|wound/i);
      expect(char.externalGoal).toBeTruthy();
    });
  });
});
```

**Quality Metrics**:
- Theme specificity: Should be concrete yet general
- Character flaw depth: Should be psychological, not physical
- Moral framework coherence: Should be internally consistent

#### Part Generation Tests

**Cycle Completeness**:
```typescript
describe('Part Generation', () => {
  test('should create complete adversity-triumph cycles for each character', () => {
    const output = generateParts(themeData);

    output.parts.forEach(part => {
      part.characterArcs.forEach(arc => {
        expect(arc.adversity.internal).toBeTruthy();
        expect(arc.adversity.external).toBeTruthy();
        expect(arc.virtue).toBeTruthy();
        expect(arc.consequence).toBeTruthy();
        expect(arc.newAdversity).toBeTruthy();
      });
    });
  });

  test('should plant seeds with expected payoffs', () => {
    const output = generateParts(themeData);
    const allSeeds = output.parts.flatMap(p => extractSeeds(p.summary));

    allSeeds.forEach(seed => {
      expect(seed.description).toBeTruthy();
      expect(seed.expectedPayoff).toMatch(/Act (I|II|III)/);
    });
  });

  test('should create cyclical engine (resolution → adversity)', () => {
    const output = generateParts(themeData);

    output.parts.forEach((part, index) => {
      if (index < output.parts.length - 1) {
        const nextPart = output.parts[index + 1];
        // Next part's adversities should reference previous consequences
        expect(nextPart.summary).toContain('from Act');
      }
    });
  });
});
```

**Quality Metrics**:
- Cycle completeness: 100% of arcs have all 5 components
- Seed specificity: Vague seeds like "kindness pays off" are failures
- Causal linking: Each resolution should create next adversity

#### Chapter Generation Tests

**Causal Chain Integrity**:
```typescript
describe('Chapter Generation', () => {
  test('should connect to previous chapter', () => {
    const chapters = generateChapters(partData);

    chapters.forEach((chapter, index) => {
      if (index > 0) {
        expect(chapter.connectsToPreviousChapter).toBeTruthy();
        expect(chapter.connectsToPreviousChapter.length).toBeGreaterThan(50);
      }
    });
  });

  test('should create next adversity', () => {
    const chapters = generateChapters(partData);

    chapters.forEach((chapter, index) => {
      if (index < chapters.length - 1) {
        expect(chapter.createsNextAdversity).toBeTruthy();
        expect(chapter.createsNextAdversity.length).toBeGreaterThan(50);
      }
    });
  });

  test('should track seeds correctly', () => {
    const chapters = generateChapters(partData);
    const plantedSeeds = chapters.flatMap(c => c.seedsPlanted);
    const resolvedSeeds = chapters.flatMap(c => c.seedsResolved);

    // At least 50% of planted seeds should resolve
    expect(resolvedSeeds.length).toBeGreaterThanOrEqual(plantedSeeds.length * 0.5);

    // All resolved seeds should reference valid planted seeds
    resolvedSeeds.forEach(resolved => {
      const sourceExists = plantedSeeds.some(p => p.id === resolved.seedId);
      expect(sourceExists).toBe(true);
    });
  });
});
```

**Quality Metrics**:
- Causal chain continuity: 100% of chapters connect
- Seed resolution rate: 50-80% ideal (not all seeds resolve immediately)
- Focus balance: No character ignored for more than 2 consecutive chapters

#### Scene Specification Tests

**Cycle Phase Coverage**:
```typescript
describe('Scene Specification', () => {
  test('should include all 5 cycle phases', () => {
    const scenes = generateSceneSpecs(chapterData);
    const phases = scenes.map(s => s.cyclePhase);

    expect(phases).toContain('setup');
    expect(phases).toContain('confrontation');
    expect(phases).toContain('virtue');
    expect(phases).toContain('consequence');
    expect(phases).toContain('transition');
  });

  test('should have exactly one virtue scene', () => {
    const scenes = generateSceneSpecs(chapterData);
    const virtueScenes = scenes.filter(s => s.cyclePhase === 'virtue');

    expect(virtueScenes.length).toBe(1); // THE moment
  });

  test('should assign appropriate emotional beats', () => {
    const scenes = generateSceneSpecs(chapterData);

    scenes.forEach(scene => {
      if (scene.cyclePhase === 'setup') {
        expect(['fear', 'tension', 'anxiety']).toContain(scene.emotionalBeat);
      }
      if (scene.cyclePhase === 'virtue') {
        expect(scene.emotionalBeat).toBe('elevation');
      }
      if (scene.cyclePhase === 'consequence') {
        expect(['catharsis', 'joy', 'relief', 'hope']).toContain(scene.emotionalBeat);
      }
    });
  });
});
```

**Quality Metrics**:
- Phase coverage: All 5 phases present
- Virtue scene prominence: Should be marked as "long" or have special emphasis
- Emotional trajectory: Should build to virtue, release to consequence

#### Scene Content Tests

**Prose Quality**:
```typescript
describe('Scene Content Generation', () => {
  test('should meet word count targets', () => {
    const content = generateSceneContent(sceneSpec);
    const wordCount = content.split(/\s+/).length;

    if (sceneSpec.suggestedLength === 'short') {
      expect(wordCount).toBeGreaterThanOrEqual(300);
      expect(wordCount).toBeLessThanOrEqual(500);
    }
    // ... similar for medium, long
  });

  test('should follow formatting rules', () => {
    const content = generateSceneContent(sceneSpec);

    // Description paragraphs max 3 sentences
    const paragraphs = content.split('\n\n');
    paragraphs.forEach(para => {
      if (!para.includes('"')) { // Not dialogue
        const sentences = para.split(/[.!?]/).filter(s => s.trim());
        expect(sentences.length).toBeLessThanOrEqual(3);
      }
    });

    // Spacing between description and dialogue
    expect(content).not.toMatch(/\.\n"/); // Should be .\n\n"
  });

  test('virtue scene should show intrinsic motivation', () => {
    const virtueSpec = { ...sceneSpec, cyclePhase: 'virtue' };
    const content = generateSceneContent(virtueSpec);

    // Should NOT contain transactional language
    expect(content).not.toMatch(/in (order to|return for|exchange)/i);
    expect(content).not.toMatch(/so (that|she could|he could)/i);

    // Should contain internal motivation indicators
    expect(content).toMatch(/thought|felt|couldn't|must|need/i);
  });
});
```

**Quality Metrics**:
- Word count accuracy: Within 10% of target
- Formatting compliance: 100% adherence to rules
- Cycle phase alignment: Content matches phase purpose

### 2.2 Integration Testing (Flow Level)

Test complete generation pipeline from prompt to finished story.

#### End-to-End Generation

```typescript
describe('Complete Story Generation', () => {
  test('should generate complete story from user prompt', async () => {
    const userPrompt = "A story about a doctor who loses faith in medicine after a tragedy";

    const result = await generateCompleteStory(userPrompt);

    expect(result.story).toBeTruthy();
    expect(result.parts.length).toBe(3);
    expect(result.chapters.length).toBeGreaterThanOrEqual(9); // At least 3 per act
    expect(result.scenes.length).toBeGreaterThanOrEqual(27); // At least 3 per chapter

    // All scenes have content
    result.scenes.forEach(scene => {
      expect(scene.content).toBeTruthy();
      expect(scene.content.length).toBeGreaterThan(100);
    });
  });

  test('should maintain causal chain throughout story', () => {
    const result = generateCompleteStory(userPrompt);

    // Check chapter-to-chapter links
    for (let i = 1; i < result.chapters.length; i++) {
      const prevChapter = result.chapters[i - 1];
      const currChapter = result.chapters[i];

      expect(currChapter.connectsToPreviousChapter).toBeTruthy();
      // Current adversity should relate to previous consequence
      const prevConsequence = extractConsequence(prevChapter.summary);
      expect(currChapter.summary).toContain(prevConsequence.keyword);
    }
  });

  test('should resolve planted seeds', () => {
    const result = generateCompleteStory(userPrompt);

    const plantedSeeds = result.chapters.flatMap(c => c.seedsPlanted);
    const resolvedSeeds = result.chapters.flatMap(c => c.seedsResolved);

    // At least 60% of seeds should resolve
    const resolutionRate = resolvedSeeds.length / plantedSeeds.length;
    expect(resolutionRate).toBeGreaterThanOrEqual(0.6);
  });
});
```

### 2.3 System Testing (Performance & Reliability)

```typescript
describe('System Performance', () => {
  test('should generate story within acceptable time', async () => {
    const start = Date.now();
    await generateCompleteStory(userPrompt);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(20 * 60 * 1000); // 20 minutes max
  });

  test('should handle generation failures gracefully', async () => {
    // Simulate API failure
    mockAPIFailure('scene-content', { failureRate: 0.1 });

    const result = await generateCompleteStory(userPrompt);

    // Should still complete with partial content
    expect(result.scenes.filter(s => s.content).length).toBeGreaterThan(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/retry|skip/i);
  });

  test('should be idempotent for same input', async () => {
    const result1 = await generateCompleteStory(userPrompt, { seed: 12345 });
    const result2 = await generateCompleteStory(userPrompt, { seed: 12345 });

    expect(result1.story.theme).toBe(result2.story.theme);
    expect(result1.parts.length).toBe(result2.parts.length);
    // Note: Scene content may vary slightly but structure should match
  });
});
```

---

## Part III: Evaluation Metrics

### 3.1 Quantitative Metrics

#### Structural Metrics

| Metric | Measurement | Target | Critical Threshold |
|--------|-------------|--------|-------------------|
| **Cycle Completeness** | % of cycles with all 5 components | 100% | 90% |
| **Causal Chain Continuity** | % of chapters with valid previous/next links | 100% | 95% |
| **Seed Resolution Rate** | Resolved seeds / Planted seeds | 60-80% | 50% |
| **Virtue Scene Presence** | % of chapters with exactly 1 virtue scene | 100% | 100% |
| **Phase Coverage** | % of chapters with all 5 cycle phases | 100% | 90% |

#### Quality Metrics

| Metric | Measurement | Target | Critical Threshold |
|--------|-------------|--------|-------------------|
| **Scene Quality Score** | Average evaluation score (1-4 scale) | 3.5+ | 3.0+ |
| **First-Pass Success Rate** | % of scenes passing evaluation on first generation | 85% | 70% |
| **Word Count Accuracy** | % of scenes within target word count ±10% | 90% | 75% |
| **Formatting Compliance** | % of scenes following all formatting rules | 100% | 95% |
| **Prose Variety** | Average sentence length variance | 15-25 words | 10-30 words |

#### Emotional Metrics

| Metric | Measurement | Target | Critical Threshold |
|--------|-------------|--------|-------------------|
| **Moral Elevation Detection** | % of readers identifying virtue scene correctly | 80% | 70% |
| **Gam-dong Response Rate** | % of readers reporting feeling "profoundly moved" | 80% | 60% |
| **Emotional Beat Accuracy** | % of scenes where readers identify intended emotion | 75% | 60% |
| **Catharsis Experience** | % of readers reporting emotional release | 70% | 50% |
| **Empathy Building** | % of readers caring about character outcomes | 90% | 75% |

### 3.2 Qualitative Evaluation Framework

#### Reader Survey Template

```markdown
# Story Evaluation Survey

## Part A: Structural Awareness (Testing Cycle Integrity)

1. Can you identify a moment where a character did something good without expecting anything in return?
   - [ ] Yes (please describe)
   - [ ] No
   - [ ] Unsure

2. Did you notice any moments where a character's earlier actions paid off unexpectedly?
   - [ ] Yes (please describe)
   - [ ] No
   - [ ] Unsure

3. Did the story's events feel:
   - [ ] Logically connected (one thing led to another)
   - [ ] Random or coincidental
   - [ ] Mix of both

## Part B: Emotional Response (Testing Resonance)

4. Did this story move you emotionally?
   - [ ] Yes, profoundly (to tears or strong reaction)
   - [ ] Yes, moderately (felt engaged)
   - [ ] Somewhat (mild interest)
   - [ ] No (felt detached)

5. Which emotion did you feel most strongly? (Check all that apply)
   - [ ] Empathy (felt character's pain/joy)
   - [ ] Hope (believed things would improve)
   - [ ] Inspiration (wanted to be better)
   - [ ] Sadness (wept or felt grief)
   - [ ] Joy (felt uplifted)
   - [ ] Anger (at injustice)
   - [ ] Fear (for character's safety)

6. Was there a specific scene that stood out as particularly memorable?
   - Yes (please describe): _______________
   - No

## Part C: Character & Motivation (Testing Intrinsic Motivation)

7. Did the main character's actions feel believable?
   - [ ] Yes, very believable
   - [ ] Mostly believable
   - [ ] Sometimes unbelievable
   - [ ] Often unbelievable

8. Did it seem like the character acted for:
   - [ ] The right reasons (internal values)
   - [ ] Strategic/calculated reasons (to gain something)
   - [ ] Mix of both
   - [ ] Unclear motivations

## Part D: Moral Framework (Testing Thematic Clarity)

9. What do you think this story was about (thematically)?
   - Open response: _______________

10. Did the story's world feel like it had consistent moral rules?
    - [ ] Yes, very consistent
    - [ ] Mostly consistent
    - [ ] Inconsistent
    - [ ] No clear rules

## Part E: Overall Quality

11. Rate the story overall:
    - [ ] Excellent (would recommend enthusiastically)
    - [ ] Good (enjoyed it)
    - [ ] Average (fine but forgettable)
    - [ ] Below Average (had issues)
    - [ ] Poor (would not recommend)

12. Would you read more stories by this author/system?
    - [ ] Definitely yes
    - [ ] Probably yes
    - [ ] Maybe
    - [ ] Probably no
    - [ ] Definitely no
```

#### Evaluation Rubric for Manual Review

**Cycle Component Checklist** (per chapter):

```markdown
Chapter: _______________

✅ ADVERSITY
- [ ] Internal conflict clearly shown
- [ ] External obstacle present
- [ ] Internal + external interconnected
- Notes: _______________

✅ VIRTUOUS ACTION
- [ ] Character performs morally beautiful act
- [ ] Motivation is intrinsic (not "to get X")
- [ ] No transactional language ("in order to", "so that")
- [ ] Demonstrates specific virtue (courage/compassion/integrity/etc.)
- Notes: _______________

✅ UNINTENDED CONSEQUENCE
- [ ] Surprising resolution or reward occurs
- [ ] Causally linked to past actions
- [ ] NOT deus ex machina (is earned)
- [ ] Feels like poetic justice
- Notes: _______________

✅ NEW ADVERSITY
- [ ] Resolution creates complication
- [ ] Stakes escalate
- [ ] Hook for next chapter
- Notes: _______________

✅ CAUSAL LINKING
- [ ] Connects to previous chapter clearly
- [ ] Seeds planted or resolved tracked
- Notes: _______________

OVERALL CYCLE RATING:
- [ ] Excellent (all components clear and powerful)
- [ ] Good (all components present, some could be stronger)
- [ ] Adequate (components present but weak)
- [ ] Incomplete (missing components)
```

### 3.3 A/B Testing Framework

Test variations to optimize prompts.

#### Test Scenarios

**Test 1: Virtue Scene Emphasis**
- **Control**: Standard virtue scene prompt
- **Variant A**: Prompt with increased emphasis on "show don't tell"
- **Variant B**: Prompt with explicit "no transactional language" rules
- **Metric**: % of readers correctly identifying virtue scene

**Test 2: Seed Planting Specificity**
- **Control**: Current seed planting instructions
- **Variant A**: Require 3 specific examples per seed
- **Variant B**: Provide seed type taxonomy (relational/object/knowledge)
- **Metric**: Seed resolution rate, reader detection of payoffs

**Test 3: Emotional Beat Guidance**
- **Control**: Current emotional beat assignment
- **Variant A**: Include sensory anchors for each emotion
- **Variant B**: Provide emotion-specific sentence structure guidelines
- **Metric**: Emotional beat accuracy from reader surveys

**Test 4: Causal Linking Clarity**
- **Control**: Current chapter-to-chapter linking
- **Variant A**: Require explicit "because of X, Y happens" statements
- **Variant B**: Add "consequence summary" field to chapters
- **Metric**: Causal chain clarity rating from readers

---

## Part IV: Iterative Improvement Methodology

### 4.1 Prompt Optimization Loop

```
┌─────────────────────────────────────────────────────────────┐
│  1. GENERATE                                                 │
│  Run current system prompt → Produce story/content          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  2. EVALUATE                                                 │
│  - Automated metrics (cycle completeness, quality score)    │
│  - Reader surveys (emotional response, comprehension)       │
│  - Expert review (manual rubric)                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3. ANALYZE                                                  │
│  - Identify failure patterns                                │
│  - Categorize issues (structural, emotional, prose)         │
│  - Prioritize by impact                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  4. HYPOTHESIZE                                              │
│  - Propose prompt changes to address top issues             │
│  - Predict expected improvement                             │
│  - Design A/B test                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  5. UPDATE PROMPT                                            │
│  - Implement changes to system prompt                       │
│  - Version control (v1.0 → v1.1)                           │
│  - Document rationale                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  6. TEST                                                     │
│  - Generate with new prompt                                 │
│  - Compare to control (old prompt)                          │
│  - Measure delta in metrics                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  7. DECIDE                                                   │
│  - If improvement: Keep new prompt, iterate again           │
│  - If regression: Revert, try different approach            │
│  - If neutral: Run more tests or keep and monitor           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     └──────────────────────┐
                                            │
                     ┌──────────────────────┘
                     │
                     ▼
            (Return to Step 1)
```

### 4.2 Common Failure Patterns & Solutions

#### Failure Pattern 1: Deus Ex Machina (Unearned Resolutions)

**Symptom**: Consequences feel random, not causally linked

**Example**:
```
BAD: "Just then, a rescue helicopter appeared out of nowhere."
GOOD: "The pilot was the same woman she'd saved from drowning weeks ago—a debt now repaid."
```

**Diagnosis Metrics**:
- Causal link clarity < 60% in reader surveys
- Expert review: "unearned" flag > 20% of chapters

**Prompt Fix**:
```markdown
Add to consequence section:
"You MUST explicitly show the causal connection. Use phrases like:
- 'This was the same person who...'
- 'Because she had earlier...'
- 'Her decision to X had created...'

The reader should be able to trace the consequence back to a specific prior action."
```

**Expected Improvement**: Causal link clarity → 80%+

#### Failure Pattern 2: Transactional Virtue (Not Intrinsically Motivated)

**Symptom**: Character kindness feels strategic, not genuine

**Example**:
```
BAD: "She helped him so that he would owe her a favor later."
GOOD: "She helped him because she couldn't walk past suffering, even if it cost her."
```

**Diagnosis Metrics**:
- Reader survey: "acted for right reasons" < 70%
- Text analysis: High frequency of "in order to", "so that"

**Prompt Fix**:
```markdown
Add to virtue scene section:
"FORBIDDEN PHRASES - Do not use:
- 'in order to'
- 'so that [future benefit]'
- 'hoping to'
- 'with the expectation'

Instead, show internal motivation through:
- Visceral response ('She couldn't look away...')
- Value statement ('This was who she was...')
- Instinct ('Before thinking, she...')
- Moral imperative ('Someone had to...')"
```

**Expected Improvement**: Intrinsic motivation perception → 85%+

#### Failure Pattern 3: Weak Emotional Beats

**Symptom**: Scenes don't evoke intended emotions

**Example**:
```
BAD: "She felt sad." (telling, weak)
GOOD: "Her throat tightened, vision blurring as she turned away—too late to hide the tears." (showing, visceral)
```

**Diagnosis Metrics**:
- Emotional beat accuracy < 60%
- Gam-dong response rate < 50%

**Prompt Fix**:
```markdown
Add to each cycle phase:
"EMOTION-SPECIFIC TECHNIQUES:

FEAR: Physical sensations (racing heart, cold sweat), hypervigilance, fragmented thoughts
HOPE: Expanding sensation (lighter chest, lifting), tentative forward motion, 'maybe'
ELEVATION: Warmth in chest, tears of joy, time slowing, witnessing beauty
CATHARSIS: Release (exhale, tears flowing), transformation, 'it's over'
JOY: Energy, lightness, expansion, smile despite self
DESPAIR: Heaviness, darkness closing in, 'no way out' thoughts

Show the BODY'S response, not just the mind's."
```

**Expected Improvement**: Emotional beat accuracy → 75%+

#### Failure Pattern 4: Broken Causal Chains

**Symptom**: Chapters feel disconnected

**Example**:
```
BAD:
Chapter 5 ends: Hero defeats villain
Chapter 6 starts: Hero goes to market (no connection)

GOOD:
Chapter 5 ends: Hero defeats villain, attracts king's attention
Chapter 6 starts: King summons hero to palace, new mission
```

**Diagnosis Metrics**:
- Causal chain continuity < 90%
- Reader comment: "events felt random"

**Prompt Fix**:
```markdown
Add to chapter generation:
"MANDATORY CAUSAL LINKING:

Before writing chapter N:
1. Read chapter N-1's 'New Adversity Created' section
2. Chapter N's opening must EXPLICITLY reference this
3. Use transitional phrases:
   - 'The [consequence from N-1] had created [new problem]...'
   - 'After [event from N-1], [character] now faced...'
   - 'What seemed like [victory in N-1] had become [complication]...'

Test: Could you remove chapter N-1 and have N still make sense? If YES, you've failed to link."
```

**Expected Improvement**: Causal chain continuity → 100%

#### Failure Pattern 5: Vague Seed Planting

**Symptom**: Seeds don't resolve or feel forced

**Example**:
```
BAD Seed: "Character is kind" → Too vague, no specific payoff
GOOD Seed: "Character gives her late husband's watch to homeless veteran" → Specific setup for veteran to save her later
```

**Diagnosis Metrics**:
- Seed resolution rate < 50%
- Reader detection of payoffs < 40%

**Prompt Fix**:
```markdown
Add to seed planting section:
"SEED QUALITY CHECKLIST:

For each seed, you must specify:
✅ Specific Action: 'Gives watch' not 'is kind'
✅ Specific Recipient: 'Homeless veteran named Marcus' not 'stranger'
✅ Specific Detail: 'Late husband's watch with engraving' not 'item'
✅ Expected Payoff: 'Chapter 8: Marcus recognizes watch, helps protagonist escape'

SEED TYPES that work best:
- Relational: Help someone → They help back
- Object: Give/plant object → It returns meaningfully
- Knowledge: Share information → It becomes crucial later
- Skill: Demonstrate ability → Others remember and request it"
```

**Expected Improvement**: Seed resolution rate → 70%+

### 4.3 Prompt Version Control

Track prompt changes over time:

```markdown
# Virtue Scene Prompt Changelog

## v1.0 (Baseline)
- Initial prompt with basic "show intrinsic motivation" instruction
- Results: 65% intrinsic motivation detection

## v1.1 (Added Forbidden Phrases)
- Added list of transactional language to avoid
- Results: 72% intrinsic motivation detection (+7%)

## v1.2 (Added Positive Examples)
- Included 5 examples of good intrinsic motivation showing
- Results: 78% intrinsic motivation detection (+6%)

## v1.3 (Added Sensory Details)
- Emphasized physical/visceral response over intellectual
- Results: 85% intrinsic motivation detection (+7%)
- ✅ MEETS TARGET - ADOPTED AS NEW BASELINE

## v2.0 (Current)
- Combines v1.3 with emotional beat enhancements
- Results: Pending testing
```

### 4.4 Testing Cadence

**Sprint 1 (Week 1-2)**: Baseline Establishment
- Generate 10 complete stories with v1.0 prompts
- Collect all metrics (automated + reader surveys)
- Establish baseline performance

**Sprint 2 (Week 3-4)**: First Iteration
- Identify top 3 failure patterns
- Update prompts (v1.1)
- Generate 5 stories with new prompts
- A/B test vs. baseline
- Adopt or revert changes

**Sprint 3 (Week 5-6)**: Second Iteration
- Address next 3 failure patterns
- Update prompts (v1.2)
- Generate 5 stories
- Compare to v1.0 and v1.1
- Cumulative improvement check

**Ongoing (Week 7+)**: Continuous Improvement
- Monthly generation of 3-5 stories
- Quarterly reader survey campaigns (30+ readers per story)
- Annual comprehensive review and major version update

---

## Part V: Test Data Sets

### 5.1 Standard Test Prompts

Use consistent prompts to measure improvement over time:

**Test Prompt 1 (Simple)**:
```
"A story about a refugee trying to rebuild after war"
```
- Expected: Personal drama, moral elevation through compassion
- Characters: 2-3
- Complexity: Low
- Emotional Target: Gam-dong through Jeong formation

**Test Prompt 2 (Complex)**:
```
"A story about a doctor who loses faith in medicine after failing to save her daughter, then discovers her skills are needed to stop a plague in a hostile community"
```
- Expected: Internal transformation arc, redemption, sacrifice
- Characters: 3-4
- Complexity: High
- Emotional Target: Catharsis through healing of Han

**Test Prompt 3 (Relationship-Focused)**:
```
"A story about two former best friends on opposite sides of a civil war who must cooperate to save their shared home"
```
- Expected: Dual character arcs, moral complexity, forgiveness
- Characters: 2 (dual protagonists)
- Complexity: Medium
- Emotional Target: Gam-dong through reconciliation

**Test Prompt 4 (Genre Blend)**:
```
"A thriller about a hacker who uncovers corruption but realizes exposing it will destroy innocent lives"
```
- Expected: High stakes, moral dilemma, integrity vs. mercy
- Characters: 2-3
- Complexity: Medium
- Emotional Target: Moral elevation through difficult choice

**Test Prompt 5 (Edge Case)**:
```
"A quiet story about an elderly woman tending a garden and the neighborhood children who visit her"
```
- Expected: Slice of life, low external conflict, Jeong building
- Characters: 1 main + ensemble
- Complexity: Low plot, high emotional
- Emotional Target: Gentle catharsis, iyashikei healing

### 5.2 Regression Test Suite

**Maintain stories from each version**:
```
/tests/fixtures/
  v1.0/
    story_refugee_war.json
    story_doctor_plague.json
    ...
  v1.1/
    story_refugee_war.json
    story_doctor_plague.json
    ...
```

**Automated comparison**:
```typescript
describe('Regression Tests', () => {
  test('v1.1 should not regress on v1.0 metrics', () => {
    const v1_0_scores = loadMetrics('v1.0');
    const v1_1_scores = loadMetrics('v1.1');

    expect(v1_1_scores.cycleCompleteness).toBeGreaterThanOrEqual(v1_0_scores.cycleCompleteness);
    expect(v1_1_scores.causalChainContinuity).toBeGreaterThanOrEqual(v1_0_scores.causalChainContinuity);
    // Allow small regression (2%) in non-critical metrics if major improvement elsewhere
  });
});
```

---

## Part VI: Evaluation Automation

### 6.1 Automated Quality Checks

**Structural Validation** (can be automated):
```typescript
function validateAdversityTriumphCycle(chapter: Chapter): ValidationResult {
  const summary = chapter.summary;
  const errors = [];

  // Check for required components
  if (!summary.includes('ADVERSITY')) errors.push('Missing adversity section');
  if (!summary.includes('VIRTUOUS ACTION')) errors.push('Missing virtue section');
  if (!summary.includes('UNINTENDED CONSEQUENCE')) errors.push('Missing consequence section');
  if (!summary.includes('NEW ADVERSITY')) errors.push('Missing new adversity section');

  // Check for transactional language in virtue
  const virtuSection = extractSection(summary, 'VIRTUOUS ACTION');
  const forbiddenPhrases = ['in order to', 'so that', 'hoping to', 'expecting'];
  forbiddenPhrases.forEach(phrase => {
    if (virtuSection.includes(phrase)) {
      errors.push(`Transactional language detected: "${phrase}"`);
    }
  });

  // Check for causal linking
  if (!chapter.connectsToPreviousChapter) {
    errors.push('No connection to previous chapter');
  }

  return {
    valid: errors.length === 0,
    errors,
    score: 1 - (errors.length / 10) // Normalized score
  };
}
```

**Prose Quality** (partially automated):
```typescript
function analyzeProse(content: string): ProseAnalysis {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  const words = content.split(/\s+/);
  const paragraphs = content.split(/\n\n+/);

  // Sentence length variance
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const avgLength = average(sentenceLengths);
  const variance = standardDeviation(sentenceLengths);

  // Paragraph length (description paragraphs should be ≤ 3 sentences)
  const descriptionParagraphs = paragraphs.filter(p => !p.includes('"'));
  const longParagraphs = descriptionParagraphs.filter(p => {
    const sentCount = p.split(/[.!?]+/).length - 1;
    return sentCount > 3;
  });

  // Dialogue vs description ratio
  const dialogueParagraphs = paragraphs.filter(p => p.includes('"'));
  const dialogueRatio = dialogueParagraphs.length / paragraphs.length;

  return {
    avgSentenceLength: avgLength,
    sentenceLengthVariance: variance,
    longParagraphCount: longParagraphs.length,
    dialogueRatio,
    readabilityScore: calculateFleschKincaid(content)
  };
}
```

### 6.2 AI-Assisted Evaluation

Use GPT-4 to evaluate subjective qualities:

```typescript
async function evaluateEmotionalResonance(scene: Scene): Promise<EmotionalEvaluation> {
  const prompt = `
You are an expert in narrative emotion and the "Architectonics of Engagement" framework.

Evaluate this scene for emotional resonance:

Scene Content:
${scene.content}

Expected Cycle Phase: ${scene.cyclePhase}
Expected Emotional Beat: ${scene.emotionalBeat}

Rate on a scale of 1-4:
1. Does the scene evoke the intended emotion (${scene.emotionalBeat})?
2. Is the emotional beat conveyed through showing (sensory, physical) vs. telling?
3. Does the emotion feel earned or forced?
4. If this is a virtue scene, is the moral elevation moment clear and powerful?

Provide:
- Scores (1-4) for each question
- Brief explanation for each score
- Specific suggestions for improvement

Format as JSON.
  `;

  const evaluation = await callGPT4(prompt);
  return JSON.parse(evaluation);
}
```

---

## Part VII: Reporting & Dashboards

### 7.1 Metrics Dashboard

**Real-time monitoring**:
```
┌─────────────────────────────────────────────────────────────┐
│  ADVERSITY-TRIUMPH ENGINE - QUALITY DASHBOARD               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Structural Integrity:          ████████████░░  92%  ✅      │
│    - Cycle Completeness:        ████████████░░  95%          │
│    - Causal Chain:              ███████████░░░  89%          │
│    - Seed Resolution:           ████████░░░░░░  68%          │
│                                                              │
│  Quality Metrics:               ██████████░░░░  85%  ✅      │
│    - Scene Quality Score:       ████████████░░  3.6/4.0      │
│    - First-Pass Success:        ███████████░░░  88%          │
│    - Formatting:                ███████████████ 100%         │
│                                                              │
│  Emotional Resonance:           ████████░░░░░░  78%  ⚠️      │
│    - Moral Elevation:           ████████████░░  91%          │
│    - Gam-dong Response:         ██████░░░░░░░░  62%  ⚠️      │
│    - Causal Link Recognition:  ████████░░░░░░  75%          │
│                                                              │
│  ⚠️  Action Items:                                           │
│    1. Gam-dong response below target (62% vs 80% target)    │
│       → Test prompt variation with enhanced consequence     │
│          scenes (see v1.4 proposal)                         │
│    2. Seed resolution could improve (68% vs 75% target)     │
│       → Add seed specificity checklist to prompts          │
│                                                              │
│  Recent Improvements:                                        │
│    ✅ v1.3 → Intrinsic motivation +7% (now 85%)            │
│    ✅ v1.2 → Causal chain +5% (now 89%)                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Test Report Template

```markdown
# Adversity-Triumph Engine Test Report
**Test Date**: 2025-11-15
**Prompt Version**: v1.3
**Stories Tested**: 5
**Readers Surveyed**: 25 (5 per story)

## Executive Summary
Version 1.3 shows significant improvement in intrinsic motivation detection (+7% vs v1.2) and maintains gains in causal chain continuity. However, Gam-dong response rate remains below target, requiring prompt iteration focused on consequence scene emotional depth.

## Quantitative Results

| Metric | v1.0 Baseline | v1.3 Current | Target | Status |
|--------|--------------|-------------|--------|--------|
| Cycle Completeness | 88% | 95% | 90% | ✅ PASS |
| Causal Chain | 82% | 89% | 95% | ⚠️ BELOW |
| Seed Resolution | 55% | 68% | 60% | ✅ PASS |
| Scene Quality | 3.2 | 3.6 | 3.5 | ✅ PASS |
| First-Pass Success | 75% | 88% | 85% | ✅ PASS |
| Moral Elevation | 78% | 91% | 80% | ✅ PASS |
| Gam-dong Response | 58% | 62% | 80% | ❌ FAIL |

## Qualitative Findings

**Reader Feedback Themes**:
1. "The character's kindness felt genuine" (22/25 readers) ✅
2. "I was surprised but it made sense" when payoffs occurred (19/25) ✅
3. "I felt moved but not overwhelmed" (15/25) ⚠️ - Suggests need for stronger peaks

**Expert Review**:
- Virtue scenes well-executed across all 5 stories
- Consequence scenes sometimes rushed, lacking emotional depth
- Causal links clear but could be more elegantly woven into prose

## Failure Analysis

**Gam-dong Gap (62% vs 80% target)**:
- Root cause: Consequence scenes not allowing enough "breathing room" for emotion
- Evidence: Average consequence scene length 450 words vs 650 for virtue scenes
- Hypothesis: Extending consequence scenes and adding sensory detail will improve

**Causal Chain Gap (89% vs 95% target)**:
- Root cause: Transitions between chapters sometimes implicit rather than explicit
- Evidence: 11% of chapter starts don't clearly reference previous end
- Hypothesis: Mandatory opening sentence template will improve

## Recommendations

**High Priority**:
1. Update consequence scene prompt to require 600+ words, include "emotional lingering" instruction
2. Add explicit chapter transition template: "After [specific event from previous], [character] now faced [new adversity]"

**Medium Priority**:
3. Enhance seed tracking UI for human reviewers
4. Add more examples of strong Gam-dong moments to prompts

**Next Test Cycle**:
- Implement High Priority changes → v1.4
- Test with same 5 standard prompts
- Target: Gam-dong 75%+, Causal Chain 95%+
- Timeline: 2 weeks
```

---

## Conclusion

This testing strategy provides:
1. **Multi-level testing**: Unit → Integration → System → User
2. **Quantitative + Qualitative**: Metrics + human judgment
3. **Iterative improvement**: Systematic prompt optimization
4. **Automated + Manual**: Balance efficiency with insight

Success requires:
- Consistent use of standard test prompts
- Rigorous data collection (surveys, metrics)
- Honest failure analysis
- Patient iteration (expect 5-10 cycles to reach excellence)

The goal is not perfection but continuous improvement toward creating stories that profoundly move readers through the disciplined application of the Adversity-Triumph Engine.
