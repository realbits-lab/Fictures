/**
 * Shared TypeScript types for evaluation APIs
 */

// ============================================================================
// Core Types
// ============================================================================

export type EvaluationMode = "quick" | "standard" | "thorough";
export type MetricMethod = "automated" | "ai-evaluation";
export type MetricSeverity = "critical" | "high" | "medium" | "low";

// ============================================================================
// Base Interfaces
// ============================================================================

export interface BaseEvaluationRequest {
    evaluationMode?: EvaluationMode;
    metrics?: string[];
}

export interface BaseEvaluationResponse {
    evaluationId: string;
    timestamp: string;
    evaluationMode: EvaluationMode;
    overallScore: number;
    passed: boolean;
    recommendations?: string[];
}

// ============================================================================
// Metric Result
// ============================================================================

export interface MetricResult {
    score: number;
    target: number;
    threshold: number;
    passed: boolean;
    feedback: string;
    method: MetricMethod;
    details?: Record<string, unknown>;
}

// ============================================================================
// Evaluation History
// ============================================================================

export interface EvaluationHistory {
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

// ============================================================================
// Story Evaluation
// ============================================================================

export interface StoryEvaluationRequest extends BaseEvaluationRequest {
    storyId: string;
}

export interface StoryEvaluationResponse extends BaseEvaluationResponse {
    storyId: string;
    metrics: {
        moralFrameworkClarity: MetricResult & {
            details: {
                virtuesIdentified: string[];
                causalLogicPresent: boolean;
            };
        };
        thematicCoherence: MetricResult;
        genreConsistency: MetricResult;
    };
}

// ============================================================================
// Character Evaluation
// ============================================================================

export interface CharacterEvaluationRequest extends BaseEvaluationRequest {
    characterIds: string[];
    storyId: string;
}

export interface CharacterEvaluationResult {
    characterId: string;
    characterName: string;
    metrics: {
        characterDepth: MetricResult & {
            details: {
                internalFlawsCount: number;
                moralTestPresent: boolean;
                backstoryLength: number;
            };
        };
        jeongSystemImplementation: MetricResult & {
            relationshipsCount: number;
        };
        voiceDistinctiveness: MetricResult & {
            overlapPercentage: number;
        };
    };
    overallScore: number;
    passed: boolean;
}

export interface CharacterEvaluationResponse extends BaseEvaluationResponse {
    results: CharacterEvaluationResult[];
    overallPassed: boolean;
}

// ============================================================================
// Setting Evaluation
// ============================================================================

export interface SettingEvaluationRequest extends BaseEvaluationRequest {
    settingIds: string[];
    storyId: string;
}

export interface SettingEvaluationResult {
    settingId: string;
    settingName: string;
    metrics: {
        symbolicMeaningClarity: MetricResult & {
            moralThemeAlignment: boolean;
        };
        sensoryDetailRichness: MetricResult & {
            sensesEngaged: string[];
            sensesCount: number;
        };
        cycleAmplificationDesign: MetricResult & {
            phasesWithAmplification: number;
        };
    };
    overallScore: number;
    passed: boolean;
}

export interface SettingEvaluationResponse extends BaseEvaluationResponse {
    results: SettingEvaluationResult[];
    overallPassed: boolean;
}

// ============================================================================
// Part Evaluation
// ============================================================================

export interface PartEvaluationRequest extends BaseEvaluationRequest {
    partId: string;
}

export interface PartEvaluationResponse extends BaseEvaluationResponse {
    partId: string;
    metrics: {
        cycleCoherence: MetricResult & {
            details: {
                phasesPresent: string[];
                phasesCount: number;
                allPhasesDistinct: boolean;
            };
        };
        conflictDefinitionClarity: MetricResult & {
            internalConflictPresent: boolean;
            externalConflictPresent: boolean;
        };
        earnedLuckTracking: MetricResult & {
            seedsPlanted: number;
            seedsResolved: number;
            trackingTableExists: boolean;
        };
    };
}

// ============================================================================
// Chapter Evaluation
// ============================================================================

export interface ChapterEvaluationRequest extends BaseEvaluationRequest {
    chapterId: string;
}

export interface ChapterEvaluationResponse extends BaseEvaluationResponse {
    chapterId: string;
    metrics: {
        singleCycleFocus: MetricResult & {
            cycleCount: number;
            focusedCharacters: number;
        };
        seedTrackingCompleteness: MetricResult & {
            previousSeedsTracked: number;
            totalPreviousSeeds: number;
            trackingPercentage: number;
        };
        adversityConnection: MetricResult & {
            causalLinkExists: boolean;
            previousChapterReference: boolean;
        };
        stakesEscalation: MetricResult & {
            severityIncrease: boolean;
            severityScore: number;
        };
        resolutionAdversityTransition: MetricResult & {
            transitionQuality: number;
        };
        narrativeMomentum: MetricResult & {
            momentumRating: number;
        };
    };
}

// ============================================================================
// Scene Summary Evaluation
// ============================================================================

export interface SceneSummaryEvaluationRequest extends BaseEvaluationRequest {
    sceneId: string;
    chapterId: string;
}

export interface SceneSummaryEvaluationResponse extends BaseEvaluationResponse {
    sceneId: string;
    metrics: {
        phaseDistributionBalance: MetricResult & {
            phasesRepresented: string[];
            criticalPhasesPresent: boolean;
        };
        emotionalBeatAssignment: MetricResult & {
            emotionalBeatClarity: number;
            emotionalBeatVariety: number;
        };
        pacingRhythm: MetricResult & {
            phaseSequenceCorrect: boolean;
            pacingFlow: string;
        };
    };
}

// ============================================================================
// Scene Content Evaluation
// ============================================================================

export interface SceneContentEvaluationRequest extends BaseEvaluationRequest {
    sceneId: string;
}

export interface SceneContentEvaluationResponse extends BaseEvaluationResponse {
    sceneId: string;
    metrics: {
        wordCountCompliance: MetricResult & {
            wordCount: number;
            targetRange: { min: number; max: number };
            withinRange: boolean;
        };
        cycleAlignment: MetricResult & {
            phaseElementsPresent: string[];
            alignmentQuality: number;
        };
        emotionalResonance: MetricResult & {
            emotionIntensity: number;
            emotionAlignment: boolean;
        };
    };
}

// ============================================================================
// Batch Evaluation
// ============================================================================

export interface BatchEvaluationRequest {
    evaluations: Array<{
        type:
            | "story"
            | "characters"
            | "settings"
            | "part"
            | "chapter"
            | "scene-summary"
            | "scene-content";
        resourceIds: string[];
    }>;
    evaluationMode?: EvaluationMode;
}

export interface BatchEvaluationResponse {
    batchId: string;
    timestamp: string;
    results: {
        story?: StoryEvaluationResponse[];
        characters?: CharacterEvaluationResponse[];
        settings?: SettingEvaluationResponse[];
        part?: PartEvaluationResponse[];
        chapter?: ChapterEvaluationResponse[];
        "scene-summary"?: SceneSummaryEvaluationResponse[];
        "scene-content"?: SceneContentEvaluationResponse[];
    };
    overallPassed: boolean;
}

export interface StoryPipelineEvaluationRequest extends BaseEvaluationRequest {
    includeMetrics?: string[];
}

export interface StoryPipelineEvaluationResponse {
    batchId: string;
    storyId: string;
    timestamp: string;
    pipeline: {
        story: StoryEvaluationResponse;
        characters: CharacterEvaluationResult[];
        settings: SettingEvaluationResult[];
        parts: PartEvaluationResponse[];
        chapters: ChapterEvaluationResponse[];
        sceneSummaries: SceneSummaryEvaluationResponse[];
        sceneContents: SceneContentEvaluationResponse[];
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
        severity: MetricSeverity;
    }>;
}

// ============================================================================
// Core Principles
// ============================================================================

export interface CorePrincipleRequest {
    storyId: string;
    chapterIds?: string[];
}

export interface CorePrincipleMetrics {
    [key: string]: MetricResult;
}

export interface CorePrincipleResponse {
    principleId: string;
    storyId: string;
    timestamp: string;
    metrics: CorePrincipleMetrics;
    overallScore: number;
    passed: boolean;
    feedback: string;
    recommendations: string[];
}

export interface AllCorePrinciplesResponse {
    storyId: string;
    timestamp: string;
    principles: {
        cyclicStructure: CorePrincipleResponse;
        intrinsicMotivation: CorePrincipleResponse;
        earnedConsequence: CorePrincipleResponse;
        characterTransformation: CorePrincipleResponse;
        emotionalResonance: CorePrincipleResponse;
    };
    overallScore: number;
    allPassed: boolean;
    summary: {
        passedPrinciples: string[];
        failedPrinciples: string[];
        criticalIssues: string[];
    };
}

// ============================================================================
// Reports
// ============================================================================

export interface StoryReportRequest {
    format?: "json" | "html" | "pdf";
    includeHistory?: boolean;
}

export interface ExecutiveSummary {
    overallScore: number;
    passed: boolean;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
}

export interface FullStoryReport {
    storyId: string;
    storyTitle: string;
    generatedAt: string;
    executiveSummary: ExecutiveSummary;
    corePrinciples: {
        cyclicStructure: { score: number; passed: boolean };
        intrinsicMotivation: { score: number; passed: boolean };
        earnedConsequence: { score: number; passed: boolean };
        characterTransformation: { score: number; passed: boolean };
        emotionalResonance: { score: number; passed: boolean };
    };
    phaseEvaluations: {
        story: StoryEvaluationResponse;
        characters: CharacterEvaluationResult[];
        settings: SettingEvaluationResult[];
        parts: PartEvaluationResponse[];
        chapters: ChapterEvaluationResponse[];
        sceneSummaries: SceneSummaryEvaluationResponse[];
        sceneContents: SceneContentEvaluationResponse[];
    };
    metrics: {
        quantitative: Record<string, unknown>;
        qualitative: Record<string, unknown>;
    };
    history?: EvaluationHistory[];
}

export interface ComparisonRequest {
    storyIds: string[];
    comparisonMetrics?: string[];
}

export interface StoryComparison {
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
}

export interface ComparisonResponse {
    comparison: StoryComparison[];
    insights: {
        bestPerformingStory: string;
        commonStrengths: string[];
        commonWeaknesses: string[];
        uniqueStrengths: Record<string, string[]>;
    };
}

// ============================================================================
// Error Types
// ============================================================================

export interface EvaluationError {
    error: string;
    code: string;
    details?: unknown;
    timestamp: string;
}

// Error codes
export const EVALUATION_ERROR_CODES = {
    RESOURCE_NOT_FOUND: "EVALUATION_RESOURCE_NOT_FOUND",
    INVALID_REQUEST: "EVALUATION_INVALID_REQUEST",
    RATE_LIMIT_EXCEEDED: "EVALUATION_RATE_LIMIT_EXCEEDED",
    SERVICE_ERROR: "EVALUATION_SERVICE_ERROR",
    UNAUTHORIZED: "EVALUATION_UNAUTHORIZED",
    DATABASE_ERROR: "EVALUATION_DATABASE_ERROR",
} as const;
