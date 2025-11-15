/**
 * Type Definitions for Iteration Testing System
 */

// Core Principle Metrics
export interface CorePrincipleMetrics {
    cyclicStructure: CyclicStructureMetrics;
    intrinsicMotivation: IntrinsicMotivationMetrics;
    earnedConsequence: EarnedConsequenceMetrics;
    characterTransformation: CharacterTransformationMetrics;
    emotionalResonance: EmotionalResonanceMetrics;
}

export interface CyclicStructureMetrics {
    cycleCompleteness: number;
    chapterCycleFocus: number;
    phaseCoverage: number;
    resolutionAdversityTransition: number;
    stakesEscalation: number;
    narrativeMomentum: number;
    nestedCycleAlignment: number;
    causalChainContinuity: number;
    forwardMomentum: number;
}

export interface IntrinsicMotivationMetrics {
    characterActionAuthenticity: number;
    transactionalLanguageAbsence: number;
    strategicGoodDeeds: number;
    rewardExpectationDisplay: number;
    genuineGoodnessPerception: number;
    moralElevationTrigger: number;
    dramaticIrony: number;
}

export interface EarnedConsequenceMetrics {
    causalConnectionClarity: number;
    deusExMachinaIncidents: number;
    temporalSeparation: number;
    earnedSuccessPerception: number;
    surprisingButInevitable: number;
    earnedLuckFeeling: number;
    seedResolutionRate: number;
    seedPlantingSuccess: number;
    seedTrackingCompleteness: number;
    seedResolutionQuality: number;
    relationshipSeedDepth: number;
}

export interface CharacterTransformationMetrics {
    internalFlawDefinition: number;
    characterDepth: number;
    flawDrivenAdversity: number;
    virtueConfrontsFlaw: number;
    consequenceEnablesGrowth: number;
    arcProgressionPerception: number;
    transformationArticulation: number;
    earnedTransformation: number;
    arcStructureClarity: number;
}

export interface EmotionalResonanceMetrics {
    sceneQualityScore: number;
    firstPassSuccessRate: number;
    moralElevationDetection: number;
    gamdongAchievement: number;
    empathyBuilding: number;
    catharsisExperience: number;
    moralFrameworkClarity: number;
    emotionalBeatAccuracy: number;
    emotionalBeatAssignment: number;
    sceneMemorability: number;
    settingAmplification: number;
    wordCountAccuracy: number;
    formattingCompliance: number;
    proseVariety: number;
}

// Evaluation Types
export interface EvaluationResult {
    evaluationId: string;
    timestamp: string;
    evaluationMode: "quick" | "standard" | "thorough";
    overallScore: number;
    passed: boolean;
    metrics: Record<string, MetricResult>;
    recommendations?: string[];
}

export interface MetricResult {
    score: number;
    target: number;
    threshold: number;
    passed: boolean;
    feedback: string;
    method: "automated" | "ai-evaluation";
    details?: any;
}

// Test Results
export interface TestStoryResult {
    storyId: string;
    prompt: string;
    promptVersion: string;
    generationTime: number;
    evaluationResults: {
        story?: EvaluationResult;
        characters?: EvaluationResult;
        settings?: EvaluationResult;
        part?: EvaluationResult;
        chapter?: EvaluationResult;
        sceneSummary?: EvaluationResult;
        sceneContent?: EvaluationResult;
    };
    corePrincipleScores: {
        cyclicStructure: number;
        intrinsicMotivation: number;
        earnedConsequence: number;
        characterTransformation: number;
        emotionalResonance: number;
    };
    timestamp: string;
}

export interface TestSuiteResult {
    version: string;
    testDate: string;
    testPrompts: string[];
    evaluationMode: "quick" | "standard" | "thorough";
    iterations: number;
    stories: TestStoryResult[];
    aggregatedMetrics: CorePrincipleMetrics;
    failurePatterns: FailurePattern[];
}

// Failure Patterns
export enum FailureCategory {
    STRUCTURAL = "structural",
    EMOTIONAL = "emotional",
    PROSE = "prose",
    CAUSAL = "causal",
    CHARACTER = "character",
}

export interface FailurePattern {
    category: FailureCategory;
    description: string;
    frequency: number;
    affectedMetrics: string[];
    rootCause: string;
    proposedFix: string;
    priority: "high" | "medium" | "low";
    examples?: string[];
}

// Prompt Version Tracking
export interface PromptVersion {
    version: string;
    date: string;
    description: string;
    changes: PromptChange[];
    hypothesis: string;
    testResults?: {
        baseline: MetricSnapshot;
        experiment: MetricSnapshot;
        improvements: MetricDelta[];
        regressions: MetricDelta[];
    };
    decision: "ADOPT" | "REVERT" | "REVISE";
    notes: string;
}

export interface PromptChange {
    section: string;
    before: string | null;
    after: string;
    rationale: string;
    type: "addition" | "modification" | "removal" | "reordering";
}

export interface MetricSnapshot {
    [metricName: string]: number;
}

export interface MetricDelta {
    metric: string;
    baseline: number;
    experiment: number;
    delta: number;
    percentage: number;
    improved: boolean;
}

// A/B Testing
export interface ABTestConfig {
    controlVersion: string;
    experimentVersion: string;
    testPrompts: string[];
    sampleSize: number;
    hypothesis: string;
    expectedImprovement: string;
}

export interface ABTestResult {
    config: ABTestConfig;
    control: TestStoryResult[];
    experiment: TestStoryResult[];
    comparison: {
        deltas: Record<string, MetricDelta>;
        pValue: number;
        recommendation: "ADOPT" | "REVISE" | "REVERT";
    };
    testDate: string;
}

// Dashboard Types
export interface PromptHealthMetrics {
    promptType: string;
    averageScore: number;
    failureRate: number;
    variance: number;
    recommendation: "healthy" | "needs-tuning" | "needs-overhaul";
    recentTrend?: "improving" | "stable" | "declining";
}

export interface PromptHealthDashboard {
    timestamp: string;
    totalStories: number;
    promptVersion: string;
    overallHealth: "healthy" | "warning" | "critical";
    promptHealth: PromptHealthMetrics[];
    topPriority: {
        promptType: string;
        issue: string;
        action: string;
    };
    corePrincipleStatus: {
        principle: string;
        passRate: number;
        status: "passing" | "warning" | "failing";
    }[];
}
