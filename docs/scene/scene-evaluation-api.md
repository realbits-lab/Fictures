---
title: "Scene Evaluation API Documentation"
---

# Scene Evaluation API Documentation

## Overview

The Scene Evaluation API provides AI-powered qualitative evaluation of web novel scenes based on "The Architectonics of Engagement" framework. It analyzes scenes across five core dimensions: Plot, Character, Pacing, Prose, and World-Building.

## Endpoint

```
POST /api/evaluate/scene
```

## Authentication

Requires NextAuth.js session authentication. User must be the author of the story containing the scene being evaluated.

## Request Schema

```typescript
{
  sceneId: string;                    // Required: ID of scene to evaluate
  content: string;                    // Required: Scene text content
  context?: {                         // Optional: Additional context
    storyGenre?: string;              // e.g., "Mystery/Thriller"
    arcPosition?: 'beginning' | 'middle' | 'end';
    chapterNumber?: number;
    previousSceneSummary?: string;
    characterContext?: string[];      // Character names/descriptions
  };
  evaluationScope?: Array<           // Optional: Limit evaluation to specific areas
    'plot' | 'character' | 'pacing' | 'prose' | 'worldbuilding'
  >;
  options?: {
    detailedFeedback?: boolean;      // Default: true
    includeExamples?: boolean;       // Default: true
  };
}
```

## Response Schema

```typescript
{
  evaluationId: string;               // Unique evaluation ID
  sceneId: string;                    // Scene that was evaluated
  timestamp: string;                  // ISO timestamp

  evaluation: {
    // High-level summary
    summary: {
      plotEvents: string;             // 1-2 sentence plot summary
      characterMoments: string;       // Key character developments
      keyStrengths: string[];         // Top 3 strengths
      keyImprovements: string[];      // Top 3 areas for improvement
    };

    // Detailed metrics (1-4 scale)
    metrics: {
      plot: {
        hookEffectiveness: { score: number; level: string };
        goalClarity: { score: number; level: string };
        conflictEngagement: { score: number; level: string };
        cliffhangerTransition: { score: number; level: string };
      };
      character: {
        agency: { score: number; level: string };
        voiceDistinction: { score: number; level: string };
        emotionalDepth: { score: number; level: string };
        relationshipDynamics: { score: number; level: string };
      };
      pacing: {
        microPacing: { score: number; level: string };
        tensionManagement: { score: number; level: string };
        sceneEconomy: { score: number; level: string };
      };
      prose: {
        clarity: { score: number; level: string };
        showDontTell: { score: number; level: string };
        voiceConsistency: { score: number; level: string };
        technicalQuality: { score: number; level: string };
      };
      worldBuilding: {
        integration: { score: number; level: string };
        consistency: { score: number; level: string };
        mysteryGeneration: { score: number; level: string };
      };
    };

    // Detailed analysis per category
    analysis: {
      plot: {
        strengths: Array<{ point: string; evidence: string }>;
        improvements: Array<{ point: string; evidence: string }>;
      };
      // ... similar for character, pacing, prose, worldBuilding
    };

    // Actionable feedback (Diagnose & Suggest model)
    actionableFeedback: Array<{
      category: string;
      diagnosis: string;              // Root cause explanation
      suggestion: string;             // Specific technique/exercise
      priority: 'high' | 'medium' | 'low';
    }>;

    // Overall scores
    overallScore: number;             // Weighted average (1-4)
    categoryScores: {
      plot: number;
      character: number;
      pacing: number;
      prose: number;
      worldBuilding: number;
    };
  };

  metadata: {
    modelVersion: string;             // e.g., "gpt-4o-mini"
    tokenUsage: number;               // API tokens consumed
    evaluationTimeMs: number;         // Processing time
  };
}
```

## Performance Levels

Each metric is scored on a 1-4 scale:

- **1 - Nascent**: Significant issues that undermine the scene
- **2 - Developing**: Some effectiveness but notable weaknesses
- **3 - Effective**: Solid execution that achieves its purpose
- **4 - Exemplary**: Masterful execution that elevates the story

## Category Score Weights

The overall score is calculated as a weighted average:

- **Plot**: 25%
- **Character**: 25%
- **Pacing**: 16.7%
- **Prose**: 16.7%
- **World-Building**: 16.6%

## Example Request

```bash
curl -X POST http://localhost:3000/api/evaluate/scene \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "sceneId": "scene_123",
    "content": "Sarah stepped into the old library...",
    "context": {
      "storyGenre": "Mystery/Thriller",
      "arcPosition": "beginning",
      "chapterNumber": 1,
      "characterContext": [
        "Sarah - protagonist investigator",
        "Old man - mysterious librarian"
      ]
    }
  }'
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "details": [
    {
      "path": ["content"],
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

### 404 Not Found
```json
{
  "error": "Scene not found"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden: You do not have access to this scene"
}
```

### 500 Internal Server Error
```json
{
  "error": "Evaluation failed",
  "message": "Detailed error message"
}
```

## Database Storage

Evaluations are stored in the `scene_evaluations` table:

```sql
CREATE TABLE scene_evaluations (
  id TEXT PRIMARY KEY,
  scene_id TEXT REFERENCES scenes(id) ON DELETE CASCADE,
  evaluation JSON NOT NULL,
  overall_score VARCHAR(10) NOT NULL,
  plot_score VARCHAR(10) NOT NULL,
  character_score VARCHAR(10) NOT NULL,
  pacing_score VARCHAR(10) NOT NULL,
  prose_score VARCHAR(10) NOT NULL,
  world_building_score VARCHAR(10) NOT NULL,
  model_version VARCHAR(50) DEFAULT 'gpt-4o-mini',
  token_usage INTEGER,
  evaluation_time_ms INTEGER,
  evaluated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## Usage Guidelines

### Cost Optimization

- **Caching**: Evaluations are cached in the database by scene ID
- **Rate Limiting**: Implement user-level rate limits to control API costs
- **Batch Processing**: Consider evaluating multiple scenes in bulk during off-peak hours

### Best Practices

1. **Provide Context**: Include genre, arc position, and character context for more accurate evaluations
2. **Scene Length**: Optimal scene length is 300-1500 words (longer scenes may truncate)
3. **Incremental Evaluation**: Evaluate scenes during drafting to catch issues early
4. **Track Progress**: Use evaluation history to monitor improvement over time

### Performance

- **Average Response Time**: 3-5 seconds per scene
- **Token Usage**: ~2000-4000 tokens per evaluation (depending on scene length)
- **Throughput**: Limit to 10-20 evaluations per minute to avoid rate limits

## Future Enhancements

- [ ] GET endpoint to retrieve evaluation history by scene
- [ ] Comparison endpoint to track score changes over time
- [ ] Batch evaluation endpoint for multiple scenes
- [ ] Webhook support for async evaluations
- [ ] Export evaluation reports as PDF
- [ ] Custom evaluation criteria configuration
- [ ] A/B testing different prompt strategies

## Support

For issues or questions:
- Create an issue: https://github.com/realbits-lab/Fictures/issues
- Check documentation: `/docs/qualitative-evaluation-framework.md`
