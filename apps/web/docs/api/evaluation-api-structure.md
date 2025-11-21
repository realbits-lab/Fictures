# Evaluation API Structure and Specification

## Overview

This document defines the directory structure and API specifications for the novel evaluation system based on the Adversity-Triumph Engine evaluation framework.

**Related Documentation:**
- 📖 **Evaluation Guide**: `../novels/novels-evaluation.md` - Metrics, success criteria, and evaluation framework
- 📋 **Development Guide**: `../novels/novels-development.md` - API implementations and prompt specifications
- 📖 **Specification**: `../novels/novels-specification.md` - Core principles and data model

---

## Directory Structure

```
apps/web/src/app/api/evaluation/
├── README.md                           # API documentation and usage guide
├── types.ts                            # Shared TypeScript types for all evaluations
├── utils.ts                            # Shared utility functions
│
├── story/                              # Story-level evaluation
│   ├── route.ts                        # POST: Evaluate story
│   └── [storyId]/
│       ├── route.ts                    # GET: Retrieve story evaluation
│       └── history/
│           └── route.ts                # GET: Evaluation history
│
├── characters/                         # Character evaluation
│   ├── route.ts                        # POST: Evaluate character(s)
│   ├── [characterId]/
│   │   └── route.ts                    # GET: Retrieve character evaluation
│   └── batch/
│       └── route.ts                    # POST: Batch evaluate all characters
│
├── settings/                           # Setting evaluation
│   ├── route.ts                        # POST: Evaluate setting(s)
│   ├── [settingId]/
│   │   └── route.ts                    # GET: Retrieve setting evaluation
│   └── batch/
│       └── route.ts                    # POST: Batch evaluate all settings
│
├── part/                               # Part-level evaluation
│   ├── route.ts                        # POST: Evaluate part
│   └── [partId]/
│       ├── route.ts                    # GET: Retrieve part evaluation
│       └── chapters/
│           └── route.ts                # GET: Chapter evaluations in part
│
├── chapter/                            # Chapter-level evaluation
│   ├── route.ts                        # POST: Evaluate chapter
│   └── [chapterId]/
│       ├── route.ts                    # GET: Retrieve chapter evaluation
│       └── scenes/
│           └── route.ts                # GET: Scene evaluations in chapter
│
├── scene-summary/                      # Scene summary evaluation
│   ├── route.ts                        # POST: Evaluate scene summary
│   └── [sceneId]/
│       └── route.ts                    # GET: Retrieve evaluation
│
├── scene-content/                      # Scene content evaluation
│   ├── route.ts                        # POST: Evaluate scene content
│   └── [sceneId]/
│       ├── route.ts                    # GET: Retrieve evaluation
│       └── improvement/
│           └── route.ts                # POST: Generate improvements
│
├── batch/                              # Batch operations
│   ├── route.ts                        # POST: Evaluate multiple types
│   └── [storyId]/
│       └── route.ts                    # POST: Evaluate entire story
│
├── report/                             # Comprehensive reports
│   ├── [storyId]/
│   │   ├── route.ts                    # GET: Full evaluation report
│   │   ├── summary/route.ts            # GET: Executive summary
│   │   ├── metrics/route.ts            # GET: Quantitative metrics
│   │   └── qualitative/route.ts        # GET: AI assessments
│   └── compare/
│       └── route.ts                    # POST: Compare evaluations
│
└── core-principles/                    # Core Principle validation
    ├── cyclic-structure/
    │   └── route.ts                    # POST: Validate Principle #1
    ├── intrinsic-motivation/
    │   └── route.ts                    # POST: Validate Principle #2
    ├── earned-consequence/
    │   └── route.ts                    # POST: Validate Principle #3
    ├── character-transformation/
    │   └── route.ts                    # POST: Validate Principle #4
    ├── emotional-resonance/
    │   └── route.ts                    # POST: Validate Principle #5
    └── all/
        └── route.ts                    # POST: Validate all principles
```

---

## API Endpoints Specification

### 1. Story Evaluation

#### POST `/api/evaluation/story`
Evaluate story-level metrics: Moral Framework Clarity, Thematic Coherence, Genre Consistency.

**Request Body:**
```typescript
{
  storyId: string;
  evaluationMode?: 'quick' | 'standard' | 'thorough'; // default: 'standard'
  metrics?: string[]; // default: all metrics
}
```

**Response:**
```typescript
{
  evaluationId: string;
  storyId: string;
  timestamp: string;
  metrics: {
    moralFrameworkClarity: {
      score: number;        // 1-4 scale
      target: number;       // 3+
      threshold: number;    // 2+
      passed: boolean;
      feedback: string;
      details: {
        virtuesIdentified: string[];
        causalLogicPresent: boolean;
      };
    };
    thematicCoherence: {
      score: number;
      passed: boolean;
      feedback: string;
    };
    genreConsistency: {
      score: number;
      passed: boolean;
      feedback: string;
    };
  };
  overallScore: number;
  passed: boolean;
  recommendations: string[];
}
```

#### GET `/api/evaluation/story/[storyId]`
Retrieve latest story evaluation results.

**Response:** Same as POST response above.

#### GET `/api/evaluation/story/[storyId]/history`
Get evaluation history timeline.

**Response:**
```typescript
{
  storyId: string;
  evaluations: Array<{
    evaluationId: string;
    timestamp: string;
    overallScore: number;
    passed: boolean;
  }>;
  trend: {
    improving: boolean;
    scoreChange: number;
  };
}
```

---

### 2. Characters Evaluation

#### POST `/api/evaluation/characters`
Evaluate character metrics: Character Depth, Jeong System, Voice Distinctiveness.

**Request Body:**
```typescript
{
  characterIds: string[];
  storyId: string;
  evaluationMode?: 'quick' | 'standard' | 'thorough';
}
```

**Response:**
```typescript
{
  evaluationId: string;
  results: Array<{
    characterId: string;
    characterName: string;
    metrics: {
      characterDepth: {
        score: number;
        passed: boolean;
        feedback: string;
        details: {
          internalFlawsCount: number;
          moralTestPresent: boolean;
          backstoryLength: number;
        };
      };
      jeongSystemImplementation: {
        score: number;
        passed: boolean;
        relationshipsCount: number;
      };
      voiceDistinctiveness: {
        score: number;
        passed: boolean;
        overlapPercentage: number;
      };
    };
    overallScore: number;
    passed: boolean;
  }>;
  overallPassed: boolean;
}
```

#### POST `/api/evaluation/characters/batch`
Batch evaluate all characters in a story.

**Request Body:**
```typescript
{
  storyId: string;
  evaluationMode?: 'quick' | 'standard' | 'thorough';
}
```

**Response:** Same as POST `/api/evaluation/characters` response.

---

### 3. Settings Evaluation

#### POST `/api/evaluation/settings`
Evaluate setting metrics: Symbolic Meaning Clarity, Sensory Detail Richness, Cycle Amplification Design.

**Request Body:**
```typescript
{
  settingIds: string[];
  storyId: string;
  evaluationMode?: 'quick' | 'standard' | 'thorough';
}
```

**Response:**
```typescript
{
  evaluationId: string;
  results: Array<{
    settingId: string;
    settingName: string;
    metrics: {
      symbolicMeaningClarity: {
        score: number;
        passed: boolean;
        feedback: string;
        moralThemeAlignment: boolean;
      };
      sensoryDetailRichness: {
        score: number;
        passed: boolean;
        sensesEngaged: string[]; // ['sight', 'sound', 'smell', 'touch', 'taste']
        sensesCount: number;
      };
      cycleAmplificationDesign: {
        score: number;
        passed: boolean;
        phasesWithAmplification: number;
      };
    };
    overallScore: number;
    passed: boolean;
  }>;
  overallPassed: boolean;
}
```

---

### 4. Part Evaluation

#### POST `/api/evaluation/part`
Evaluate part metrics: Cycle Coherence, Conflict Definition Clarity, Earned Luck Tracking.

**Request Body:**
```typescript
{
  partId: string;
  evaluationMode?: 'quick' | 'standard' | 'thorough';
}
```

**Response:**
```typescript
{
  evaluationId: string;
  partId: string;
  timestamp: string;
  metrics: {
    cycleCoherence: {
      score: number;
      passed: boolean;
      feedback: string;
      details: {
        phasesPresent: string[];
        phasesCount: number;
        allPhasesDistinct: boolean;
      };
    };
    conflictDefinitionClarity: {
      score: number;
      passed: boolean;
      internalConflictPresent: boolean;
      externalConflictPresent: boolean;
    };
    earnedLuckTracking: {
      score: number;
      passed: boolean;
      seedsPlanted: number;
      seedsResolved: number;
      trackingTableExists: boolean;
    };
  };
  overallScore: number;
  passed: boolean;
}
```

#### GET `/api/evaluation/part/[partId]/chapters`
Get all chapter evaluations within a part.

**Response:**
```typescript
{
  partId: string;
  chapters: Array<{
    chapterId: string;
    chapterNumber: number;
    evaluationId: string;
    overallScore: number;
    passed: boolean;
    timestamp: string;
  }>;
}
```

---

### 5. Chapter Evaluation

#### POST `/api/evaluation/chapter`
Evaluate chapter metrics: Single-Cycle Focus, Seed Tracking, Adversity Connection, Stakes Escalation, etc.

**Request Body:**
```typescript
{
  chapterId: string;
  evaluationMode?: 'quick' | 'standard' | 'thorough';
}
```

**Response:**
```typescript
{
  evaluationId: string;
  chapterId: string;
  timestamp: string;
  metrics: {
    singleCycleFocus: {
      score: number;
      passed: boolean;
      cycleCount: number;
      focusedCharacters: number;
    };
    seedTrackingCompleteness: {
      score: number;
      passed: boolean;
      previousSeedsTracked: number;
      totalPreviousSeeds: number;
      trackingPercentage: number;
    };
    adversityConnection: {
      score: number;
      passed: boolean;
      causalLinkExists: boolean;
      previousChapterReference: boolean;
    };
    stakesEscalation: {
      score: number;
      passed: boolean;
      severityIncrease: boolean;
      severityScore: number; // 1-5 scale
    };
    resolutionAdversityTransition: {
      score: number;
      passed: boolean;
      transitionQuality: number; // 1-4 scale
    };
    narrativeMomentum: {
      score: number;
      passed: boolean;
      momentumRating: number; // 1-4 scale
    };
  };
  overallScore: number;
  passed: boolean;
}
```

---

### 6. Scene Summary Evaluation

#### POST `/api/evaluation/scene-summary`
Evaluate scene summary metrics: Phase Distribution Balance, Emotional Beat Assignment, Pacing Rhythm.

**Request Body:**
```typescript
{
  sceneId: string;
  chapterId: string;
  evaluationMode?: 'quick' | 'standard' | 'thorough';
}
```

**Response:**
```typescript
{
  evaluationId: string;
  sceneId: string;
  timestamp: string;
  metrics: {
    phaseDistributionBalance: {
      score: number;
      passed: boolean;
      phasesRepresented: string[];
      criticalPhasesPresent: boolean;
    };
    emotionalBeatAssignment: {
      score: number;
      passed: boolean;
      emotionalBeatClarity: number;
      emotionalBeatVariety: number;
    };
    pacingRhythm: {
      score: number;
      passed: boolean;
      phaseSequenceCorrect: boolean;
      pacingFlow: string; // 'build → peak → release'
    };
  };
  overallScore: number;
  passed: boolean;
}
```

---

### 7. Scene Content Evaluation

#### POST `/api/evaluation/scene-content`
Evaluate scene content metrics: Word Count Compliance, Cycle Alignment, Emotional Resonance.

**Request Body:**
```typescript
{
  sceneId: string;
  evaluationMode?: 'quick' | 'standard' | 'thorough';
}
```

**Response:**
```typescript
{
  evaluationId: string;
  sceneId: string;
  timestamp: string;
  metrics: {
    wordCountCompliance: {
      score: number;
      passed: boolean;
      wordCount: number;
      targetRange: { min: number; max: number };
      withinRange: boolean;
    };
    cycleAlignment: {
      score: number;
      passed: boolean;
      phaseElementsPresent: string[];
      alignmentQuality: number;
    };
    emotionalResonance: {
      score: number;
      passed: boolean;
      emotionIntensity: number; // 1-4 scale
      emotionAlignment: boolean;
    };
  };
  overallScore: number;
  passed: boolean;
}
```

#### POST `/api/evaluation/scene-content/[sceneId]/improvement`
Generate improvement suggestions for scene content.

**Request Body:**
```typescript
{
  evaluationId: string;
  focusAreas?: string[]; // specific metrics to improve
}
```

**Response:**
```typescript
{
  sceneId: string;
  improvements: Array<{
    metric: string;
    currentScore: number;
    targetScore: number;
    suggestions: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
  estimatedImpact: number;
}
```

---

### 8. Batch Evaluation

#### POST `/api/evaluation/batch`
Evaluate multiple resource types in a single request.

**Request Body:**
```typescript
{
  evaluations: Array<{
    type: 'story' | 'characters' | 'settings' | 'part' | 'chapter' | 'scene-summary' | 'scene-content';
    resourceIds: string[];
  }>;
  evaluationMode?: 'quick' | 'standard' | 'thorough';
}
```

**Response:**
```typescript
{
  batchId: string;
  timestamp: string;
  results: {
    story?: StoryEvaluationResult[];
    characters?: CharacterEvaluationResult[];
    settings?: SettingEvaluationResult[];
    part?: PartEvaluationResult[];
    chapter?: ChapterEvaluationResult[];
    'scene-summary'?: SceneSummaryEvaluationResult[];
    'scene-content'?: SceneContentEvaluationResult[];
  };
  overallPassed: boolean;
}
```

#### POST `/api/evaluation/batch/[storyId]`
Evaluate entire story pipeline (all generation phases).

**Request Body:**
```typescript
{
  evaluationMode?: 'quick' | 'standard' | 'thorough';
  includeMetrics?: string[]; // default: all
}
```

**Response:**
```typescript
{
  batchId: string;
  storyId: string;
  timestamp: string;
  pipeline: {
    story: StoryEvaluationResult;
    characters: CharacterEvaluationResult[];
    settings: SettingEvaluationResult[];
    parts: PartEvaluationResult[];
    chapters: ChapterEvaluationResult[];
    sceneSummaries: SceneSummaryEvaluationResult[];
    sceneContents: SceneContentEvaluationResult[];
  };
  summary: {
    totalEvaluations: number;
    passed: number;
    failed: number;
    overallScore: number;
  };
  criticalIssues: Array<{
    phase: string;
    resourceId: string;
    issue: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }>;
}
```

---

### 9. Comprehensive Reports

#### GET `/api/evaluation/report/[storyId]`
Generate full story evaluation report.

**Query Parameters:**
```typescript
{
  format?: 'json' | 'html' | 'pdf'; // default: 'json'
  includeHistory?: boolean;         // default: false
}
```

**Response:**
```typescript
{
  storyId: string;
  storyTitle: string;
  generatedAt: string;
  executiveSummary: {
    overallScore: number;
    passed: boolean;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  corePrinciples: {
    cyclicStructure: { score: number; passed: boolean };
    intrinsicMotivation: { score: number; passed: boolean };
    earnedConsequence: { score: number; passed: boolean };
    characterTransformation: { score: number; passed: boolean };
    emotionalResonance: { score: number; passed: boolean };
  };
  phaseEvaluations: {
    story: StoryEvaluationResult;
    characters: CharacterEvaluationResult[];
    settings: SettingEvaluationResult[];
    parts: PartEvaluationResult[];
    chapters: ChapterEvaluationResult[];
    sceneSummaries: SceneSummaryEvaluationResult[];
    sceneContents: SceneContentEvaluationResult[];
  };
  metrics: {
    quantitative: QuantitativeMetrics;
    qualitative: QualitativeMetrics;
  };
  history?: EvaluationHistory[];
}
```

#### GET `/api/evaluation/report/[storyId]/summary`
Get executive summary only.

**Response:**
```typescript
{
  storyId: string;
  overallScore: number;
  passed: boolean;
  strengths: string[];
  weaknesses: string[];
  topRecommendations: string[];
  corePrinciplesStatus: {
    cyclicStructure: boolean;
    intrinsicMotivation: boolean;
    earnedConsequence: boolean;
    characterTransformation: boolean;
    emotionalResonance: boolean;
  };
}
```

#### GET `/api/evaluation/report/[storyId]/metrics`
Get quantitative metrics only.

**Response:**
```typescript
{
  storyId: string;
  timestamp: string;
  quantitativeMetrics: {
    story: { /* automated metrics */ };
    characters: { /* automated metrics */ };
    settings: { /* automated metrics */ };
    parts: { /* automated metrics */ };
    chapters: { /* automated metrics */ };
    sceneSummaries: { /* automated metrics */ };
    sceneContents: { /* automated metrics */ };
  };
  aggregates: {
    totalScenes: number;
    averageSceneScore: number;
    passRate: number;
    totalWordCount: number;
  };
}
```

#### GET `/api/evaluation/report/[storyId]/qualitative`
Get AI qualitative assessments only.

**Response:**
```typescript
{
  storyId: string;
  timestamp: string;
  qualitativeAssessments: {
    story: { /* AI evaluations */ };
    characters: { /* AI evaluations */ };
    settings: { /* AI evaluations */ };
    parts: { /* AI evaluations */ };
    chapters: { /* AI evaluations */ };
    sceneSummaries: { /* AI evaluations */ };
    sceneContents: { /* AI evaluations */ };
  };
  narrativeInsights: {
    thematicCoherence: string;
    characterDevelopment: string;
    plotProgression: string;
    emotionalImpact: string;
  };
}
```

#### POST `/api/evaluation/report/compare`
Compare multiple story evaluations.

**Request Body:**
```typescript
{
  storyIds: string[];
  comparisonMetrics?: string[]; // default: all core principles
}
```

**Response:**
```typescript
{
  comparison: Array<{
    storyId: string;
    storyTitle: string;
    overallScore: number;
    corePrinciples: {
      cyclicStructure: number;
      intrinsicMotivation: number;
      earnedConsequence: number;
      characterTransformation: number;
      emotionalResonance: number;
    };
    rank: number;
  }>;
  insights: {
    bestPerformingStory: string;
    commonStrengths: string[];
    commonWeaknesses: string[];
    uniqueStrengths: Record<string, string[]>;
  };
}
```

---

### 10. Core Principles Validation

#### POST `/api/evaluation/core-principles/cyclic-structure`
Validate Core Principle #1: Cyclic Structure (multi-scale).

**Request Body:**
```typescript
{
  storyId: string;
  chapterIds?: string[]; // optional: specific chapters
}
```

**Response:**
```typescript
{
  principleId: 'cyclic-structure';
  storyId: string;
  timestamp: string;
  metrics: {
    cycleCompleteness: { score: number; target: 100; threshold: 90; passed: boolean };
    chapterCycleFocus: { score: number; target: 100; threshold: 100; passed: boolean };
    phaseCoverage: { score: number; target: 100; threshold: 90; passed: boolean };
    resolutionAdversityTransition: { score: number; target: 80; threshold: 70; passed: boolean };
    stakesEscalationQuality: { score: number; target: 85; threshold: 75; passed: boolean };
    narrativeMomentum: { score: number; target: 90; threshold: 80; passed: boolean };
    nestedCycleAlignment: { score: number; target: 85; threshold: 75; passed: boolean };
    causalChainContinuity: { score: number; target: 100; threshold: 95; passed: boolean };
    forwardMomentum: { score: number; target: 90; threshold: 80; passed: boolean };
  };
  overallScore: number;
  passed: boolean;
  feedback: string;
  recommendations: string[];
}
```

#### POST `/api/evaluation/core-principles/intrinsic-motivation`
Validate Core Principle #2: Intrinsic Motivation.

**Response Structure:** Similar to cyclic-structure with relevant metrics.

#### POST `/api/evaluation/core-principles/earned-consequence`
Validate Core Principle #3: Earned Consequence (causal linking + temporal separation).

**Response Structure:** Similar to cyclic-structure with relevant metrics.

#### POST `/api/evaluation/core-principles/character-transformation`
Validate Core Principle #4: Character Transformation.

**Response Structure:** Similar to cyclic-structure with relevant metrics.

#### POST `/api/evaluation/core-principles/emotional-resonance`
Validate Core Principle #5: Emotional Resonance.

**Response Structure:** Similar to cyclic-structure with relevant metrics.

#### POST `/api/evaluation/core-principles/all`
Validate all 5 Core Principles in a single request.

**Request Body:**
```typescript
{
  storyId: string;
}
```

**Response:**
```typescript
{
  storyId: string;
  timestamp: string;
  principles: {
    cyclicStructure: CorePrincipleResult;
    intrinsicMotivation: CorePrincipleResult;
    earnedConsequence: CorePrincipleResult;
    characterTransformation: CorePrincipleResult;
    emotionalResonance: CorePrincipleResult;
  };
  overallScore: number;
  allPassed: boolean;
  summary: {
    passedPrinciples: string[];
    failedPrinciples: string[];
    criticalIssues: string[];
  };
}
```

---

## Shared Types

### Common Response Fields

All evaluation responses include these standard fields:

```typescript
interface BaseEvaluationResponse {
  evaluationId: string;
  timestamp: string;
  evaluationMode: 'quick' | 'standard' | 'thorough';
  overallScore: number;
  passed: boolean;
  recommendations?: string[];
}
```

### Metric Result Structure

```typescript
interface MetricResult {
  score: number;
  target: number;
  threshold: number;
  passed: boolean;
  feedback: string;
  method: 'automated' | 'ai-evaluation';
  details?: Record<string, any>;
}
```

### Evaluation History

```typescript
interface EvaluationHistory {
  evaluationId: string;
  timestamp: string;
  evaluationType: string;
  overallScore: number;
  passed: boolean;
  changesFromPrevious?: {
    scoreChange: number;
    statusChanged: boolean;
    improvementAreas: string[];
  };
}
```

---

## Design Principles

### 1. RESTful API Design
- **Resource-based URLs**: Each evaluation type is a REST resource
- **HTTP Methods**: POST for evaluation, GET for retrieval
- **Status Codes**: 200 (success), 400 (bad request), 404 (not found), 500 (server error)

### 2. Consistent Response Format
- All responses follow the same structure
- Standardized metric result format
- Clear pass/fail status and feedback

### 3. Performance Optimization
- **Batch operations** for multiple evaluations
- **Caching** of evaluation results
- **Async processing** for thorough evaluations
- **Incremental evaluation** (only changed content)

### 4. Extensibility
- Modular metric evaluation (easy to add new metrics)
- Flexible evaluation modes (quick, standard, thorough)
- Support for custom metric weights

### 5. Traceability
- Evaluation history tracking
- Audit logs for all evaluations
- Comparison tools for tracking improvement

---

## Implementation Guidelines

### Shared Utilities (`utils.ts`)

```typescript
// Calculate overall score from metric results
export function calculateOverallScore(metrics: MetricResult[]): number;

// Determine pass/fail based on thresholds
export function determinePassStatus(metrics: MetricResult[]): boolean;

// Generate recommendations from failed metrics
export function generateRecommendations(metrics: MetricResult[]): string[];

// Format evaluation response
export function formatEvaluationResponse(data: any): BaseEvaluationResponse;
```

### Shared Types (`types.ts`)

```typescript
export interface EvaluationRequest {
  resourceId: string | string[];
  evaluationMode?: 'quick' | 'standard' | 'thorough';
  metrics?: string[];
}

export interface EvaluationResponse extends BaseEvaluationResponse {
  metrics: Record<string, MetricResult>;
}

export type EvaluationMode = 'quick' | 'standard' | 'thorough';

export type MetricMethod = 'automated' | 'ai-evaluation';
```

### Authentication & Authorization

All evaluation endpoints require authentication:
- **API Key**: `stories:write` or `admin:all` scope
- **Session**: Authenticated user with story access

### Rate Limiting

- **Standard evaluations**: 100 requests/hour per user
- **Thorough evaluations**: 20 requests/hour per user
- **Batch evaluations**: 10 requests/hour per user

### Error Handling

```typescript
// Standard error response format
interface EvaluationError {
  error: string;
  code: string;
  details?: any;
  timestamp: string;
}
```

**Common Error Codes:**
- `EVALUATION_RESOURCE_NOT_FOUND` - Resource doesn't exist
- `EVALUATION_INVALID_REQUEST` - Invalid request parameters
- `EVALUATION_RATE_LIMIT_EXCEEDED` - Too many requests
- `EVALUATION_SERVICE_ERROR` - Internal evaluation service error

---

## Usage Examples

### Example 1: Evaluate a Single Story

```typescript
const response = await fetch('/api/evaluation/story', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    storyId: 'story_123',
    evaluationMode: 'standard',
  }),
});

const result = await response.json();
console.log('Story Score:', result.overallScore);
console.log('Passed:', result.passed);
```

### Example 2: Batch Evaluate All Characters

```typescript
const response = await fetch('/api/evaluation/characters/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    storyId: 'story_123',
    evaluationMode: 'thorough',
  }),
});

const result = await response.json();
result.results.forEach(char => {
  console.log(`${char.characterName}: ${char.overallScore}`);
});
```

### Example 3: Get Full Story Report

```typescript
const response = await fetch('/api/evaluation/report/story_123?format=json');
const report = await response.json();

console.log('Executive Summary:', report.executiveSummary);
console.log('Core Principles:', report.corePrinciples);
```

### Example 4: Validate All Core Principles

```typescript
const response = await fetch('/api/evaluation/core-principles/all', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    storyId: 'story_123',
  }),
});

const result = await response.json();
console.log('All Principles Passed:', result.allPassed);
console.log('Failed Principles:', result.summary.failedPrinciples);
```

---

## Next Steps

1. **Implementation Priority:**
   - Phase 1: Core evaluation endpoints (story, characters, settings, part, chapter, scene-summary, scene-content)
   - Phase 2: Batch operations and comprehensive reports
   - Phase 3: Core principles validation
   - Phase 4: Comparison and history features

2. **Database Schema:**
   - Create `evaluations` table to store evaluation results
   - Create indexes on `storyId`, `resourceId`, `timestamp`
   - Implement evaluation history tracking

3. **AI Integration:**
   - Implement AI evaluation prompts for qualitative metrics
   - Use Gemini 2.5 Flash for AI assessments
   - Cache AI evaluation results for performance

4. **Testing:**
   - Unit tests for each metric calculation
   - Integration tests for API endpoints
   - End-to-end tests for full evaluation pipeline

5. **Documentation:**
   - API documentation with examples
   - Metric calculation methodology
   - Evaluation best practices guide

---

**Related Documentation:**
- 📖 **Evaluation Guide**: `../novels/novels-evaluation.md`
- 🔧 **Development Guide**: `../novels/novels-development.md`
- 📖 **Specification**: `../novels/novels-specification.md`
