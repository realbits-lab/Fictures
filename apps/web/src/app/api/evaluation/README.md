# Evaluation API

This directory contains the evaluation API endpoints for the Fictures novel generation system based on the Adversity-Triumph Engine evaluation framework.

## Overview

The evaluation APIs provide automated and AI-powered quality assessment for all phases of novel generation:

- **Story** - Moral Framework Clarity, Thematic Coherence, Genre Consistency
- **Characters** - Character Depth, Jeong System, Voice Distinctiveness
- **Settings** - Symbolic Meaning, Sensory Details, Cycle Amplification
- **Part** - Cycle Coherence, Conflict Definition, Earned Luck Tracking
- **Chapter** - Single-Cycle Focus, Seed Tracking, Stakes Escalation, Narrative Momentum
- **Scene Summary** - Phase Distribution, Emotional Beat, Pacing Rhythm
- **Scene Content** - Word Count Compliance, Cycle Alignment, Emotional Resonance

## Directory Structure

```
evaluation/
├── README.md                    # This file
├── types.ts                     # Shared TypeScript types
├── utils.ts                     # Shared utility functions
├── story/                       # Story evaluation
│   ├── route.ts                 # POST: Evaluate story
│   └── [storyId]/
│       └── route.ts             # GET: Retrieve evaluation
├── characters/                  # Character evaluation
│   └── route.ts                 # POST: Evaluate characters
├── settings/                    # Setting evaluation
│   └── route.ts                 # POST: Evaluate settings
├── part/                        # Part evaluation
│   └── route.ts                 # POST: Evaluate part
├── chapter/                     # Chapter evaluation
│   └── route.ts                 # POST: Evaluate chapter
├── scene-summary/               # Scene summary evaluation
│   └── route.ts                 # POST: Evaluate scene summary
└── scene-content/               # Scene content evaluation
    └── route.ts                 # POST: Evaluate scene content
```

## API Endpoints

### Story Evaluation

**POST** `/api/evaluation/story`

Evaluate story-level metrics.

**Request:**
```json
{
  "storyId": "story_123",
  "evaluationMode": "standard",
  "metrics": ["moralFrameworkClarity", "thematicCoherence", "genreConsistency"]
}
```

**Response:**
```json
{
  "evaluationId": "story_1234567890_abc123",
  "storyId": "story_123",
  "timestamp": "2025-01-14T12:00:00.000Z",
  "evaluationMode": "standard",
  "overallScore": 3.5,
  "passed": true,
  "metrics": {
    "moralFrameworkClarity": {
      "score": 4,
      "target": 3,
      "threshold": 2,
      "passed": true,
      "feedback": "Moral Framework Clarity",
      "method": "ai-evaluation",
      "details": {
        "virtuesIdentified": ["courage", "compassion"],
        "causalLogicPresent": true
      }
    }
  },
  "recommendations": []
}
```

### Characters Evaluation

**POST** `/api/evaluation/characters`

Evaluate character metrics (supports batch evaluation).

**Request:**
```json
{
  "characterIds": ["char_1", "char_2"],
  "storyId": "story_123",
  "evaluationMode": "standard"
}
```

### Settings Evaluation

**POST** `/api/evaluation/settings`

Evaluate setting metrics.

**Request:**
```json
{
  "settingIds": ["setting_1", "setting_2"],
  "storyId": "story_123",
  "evaluationMode": "standard"
}
```

### Part Evaluation

**POST** `/api/evaluation/part`

Evaluate part metrics.

**Request:**
```json
{
  "partId": "part_123",
  "evaluationMode": "standard"
}
```

### Chapter Evaluation

**POST** `/api/evaluation/chapter`

Evaluate chapter metrics.

**Request:**
```json
{
  "chapterId": "chapter_123",
  "evaluationMode": "standard"
}
```

### Scene Summary Evaluation

**POST** `/api/evaluation/scene-summary`

Evaluate scene summary metrics.

**Request:**
```json
{
  "sceneId": "scene_123",
  "chapterId": "chapter_123",
  "evaluationMode": "standard"
}
```

### Scene Content Evaluation

**POST** `/api/evaluation/scene-content`

Evaluate scene content metrics.

**Request:**
```json
{
  "sceneId": "scene_123",
  "evaluationMode": "standard"
}
```

## Evaluation Modes

- **quick** - Fast evaluation with minimal AI calls (automated metrics only)
- **standard** - Balanced evaluation (default)
- **thorough** - Comprehensive evaluation with detailed AI analysis

## Response Format

All evaluation endpoints return a standardized response:

```typescript
{
  evaluationId: string;        // Unique evaluation ID
  timestamp: string;           // ISO timestamp
  evaluationMode: string;      // "quick" | "standard" | "thorough"
  overallScore: number;        // Average score across all metrics
  passed: boolean;             // Whether all metrics pass thresholds
  metrics: {...};              // Individual metric results
  recommendations?: string[];  // Improvement suggestions
}
```

### Metric Result Format

Each metric follows this structure:

```typescript
{
  score: number;               // Actual score
  target: number;              // Target score
  threshold: number;           // Minimum passing score
  passed: boolean;             // score >= threshold
  feedback: string;            // Metric name
  method: string;              // "automated" | "ai-evaluation"
  details?: {...};             // Additional metric-specific data
}
```

## Error Responses

```typescript
{
  error: string;               // Error message
  code: string;                // Error code
  details?: any;               // Additional error details
  timestamp: string;           // ISO timestamp
}
```

**Error Codes:**
- `EVALUATION_RESOURCE_NOT_FOUND` - Resource doesn't exist
- `EVALUATION_INVALID_REQUEST` - Invalid request parameters
- `EVALUATION_RATE_LIMIT_EXCEEDED` - Too many requests
- `EVALUATION_SERVICE_ERROR` - Internal evaluation service error
- `EVALUATION_UNAUTHORIZED` - Authentication required
- `EVALUATION_DATABASE_ERROR` - Database operation failed

## Usage Examples

### Example 1: Evaluate a Story

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
console.log('Overall Score:', result.overallScore);
console.log('Passed:', result.passed);
```

### Example 2: Batch Evaluate Characters

```typescript
const response = await fetch('/api/evaluation/characters', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    characterIds: ['char_1', 'char_2', 'char_3'],
    storyId: 'story_123',
    evaluationMode: 'thorough',
  }),
});

const result = await response.json();
result.results.forEach(char => {
  console.log(`${char.characterName}: ${char.overallScore}`);
});
```

### Example 3: Evaluate Scene Content

```typescript
const response = await fetch('/api/evaluation/scene-content', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sceneId: 'scene_123',
    evaluationMode: 'standard',
  }),
});

const result = await response.json();
console.log('Word Count:', result.metrics.wordCountCompliance.wordCount);
console.log('Within Range:', result.metrics.wordCountCompliance.withinRange);
```

## Implementation Status

### Implemented ✅
- [x] Shared types and utilities
- [x] Story evaluation endpoint
- [x] Characters evaluation endpoint
- [x] Settings evaluation endpoint
- [x] Part evaluation endpoint
- [x] Chapter evaluation endpoint
- [x] Scene summary evaluation endpoint
- [x] Scene content evaluation endpoint

### In Progress 🚧
- [ ] Database schema for evaluation results
- [ ] Evaluation history tracking
- [ ] GET endpoints for retrieving evaluations

### Planned 📋
- [ ] Batch evaluation endpoint
- [ ] Story pipeline evaluation
- [ ] Comprehensive reports
- [ ] Core principles validation
- [ ] Comparison endpoints

## Related Documentation

- **📖 Evaluation Guide**: `/apps/web/docs/novels/novels-evaluation.md`
- **📋 Development Guide**: `/apps/web/docs/novels/novels-development.md`
- **📖 Specification**: `/apps/web/docs/novels/novels-specification.md`
- **🗂️ API Structure**: `/apps/web/docs/api/evaluation-api-structure.md`

## Development

### Adding a New Metric

1. Add metric type to `types.ts`
2. Implement evaluation logic in route handler
3. Add helper functions in `utils.ts` if needed
4. Update documentation

### Running Tests

```bash
# Unit tests
dotenv --file .env.local run pnpm test -- evaluation

# Integration tests
dotenv --file .env.local run pnpm test:integration -- evaluation
```

## Notes

- All timestamps use ISO 8601 format
- Scores are typically on a 1-4 scale for AI evaluation
- Percentage-based metrics use 0-100 scale
- Automated metrics are preferred over AI evaluation for performance
- AI evaluation is used for qualitative assessments
