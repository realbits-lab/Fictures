/**
 * Type Definitions for Comics Iteration Testing
 */

export interface ComicTestResult {
    testId: string;
    sceneId: string;
    sceneName: string;
    promptVersion: string;
    timestamp: string;
    comic: {
        sceneId: string;
        sceneTitle: string;
        totalPanels: number;
        panels: Array<{
            panelNumber: number;
            imageUrl: string;
            imageVariants: {
                avif1x: string;
                avif2x: string;
            };
            metadata: {
                width: number;
                height: number;
                aspectRatio: string;
            };
        }>;
    };
    evaluation: ComicEvaluation;
    metadata: {
        generationTime: number;
        panelGenerationTime: number;
        totalTime: number;
        panelCount: number;
        provider: string;
        model: string;
    };
}

export interface ComicEvaluation {
    weightedScore: number;
    passes: boolean;
    categoryScores: {
        panelQuality: number; // 1-5
        narrativeCoherence: number; // 1-5
        technicalQuality: number; // 1-5
        performance: number; // 1-5
    };
    metrics: ComicMetrics;
    recommendations: string[];
    finalReport: string;
}

export interface ComicMetrics {
    // Panel Quality
    visualClarity: number; // 1-5
    compositionQuality: number; // 1-5
    characterAccuracy: number; // 0-100%
    expressionAccuracy: number; // 0-100%

    // Narrative Coherence
    storyFlow: number; // 1-5
    panelSequenceLogic: number; // 1-5
    narrativeConsistency: number; // 0-100%

    // Technical Quality
    formatCompliance: boolean;
    aspectRatioAccuracy: number; // Deviation percentage
    optimizationQuality: number; // 1-5
    variantCount: number;

    // Performance
    averagePanelGenerationTime: number; // seconds
    totalGenerationTime: number; // seconds
    success: boolean;
    panelSuccessRate: number; // 0-100%
}

export interface AggregatedComicMetrics {
    version: string;
    totalTests: number;
    testDate: string;

    // Core Quality Metrics
    averageWeightedScore: number;
    passRate: number; // % passing 3.0 threshold
    firstPassSuccessRate: number; // % passing without regeneration

    // Category Scores (1-5)
    categoryAverages: {
        panelQuality: number;
        narrativeCoherence: number;
        technicalQuality: number;
        performance: number;
    };

    // Panel Quality
    averageVisualClarity: number;
    averageCompositionQuality: number;
    averageCharacterAccuracy: number;
    averageExpressionAccuracy: number;

    // Narrative Coherence
    averageStoryFlow: number;
    averagePanelSequenceLogic: number;
    averageNarrativeConsistency: number;

    // Technical Quality
    formatComplianceRate: number;
    averageAspectRatioAccuracy: number;
    averageOptimizationQuality: number;
    variantCountComplianceRate: number;

    // Performance
    averagePanelGenerationTime: number;
    averageTotalGenerationTime: number;
    successRate: number;
    averagePanelSuccessRate: number;

    // Failure Patterns
    failurePatterns: FailurePattern[];
}

export interface FailurePattern {
    category:
        | "panel-quality"
        | "narrative"
        | "technical"
        | "performance"
        | "format";
    description: string;
    frequency: number;
    averageScore: number;
    priority: "critical" | "high" | "medium" | "low";
    suggestedFix: string;
}

export interface ComicTestConfig {
    version: string;
    sceneIds: string[];
    iterations: number;
    evaluationMode: "quick" | "standard" | "thorough";
    outputPath: string;
}

export interface ABTestComparison {
    config: {
        controlVersion: string;
        experimentVersion: string;
        testScenes: string[];
        sampleSize: number;
        hypothesis: string;
        testDate: string;
    };
    control: AggregatedComicMetrics;
    experiment: AggregatedComicMetrics;
    comparison: {
        deltas: Record<string, number>;
        statisticalSignificance: {
            pValue: number;
            confidenceLevel: number;
            sampleSize: number;
        };
        improvements: string[];
        regressions: string[];
        neutral: string[];
        recommendation: "ADOPT" | "REVISE" | "REVERT";
        reasoning: string;
    };
}

export interface ComicPromptVersion {
    version: string;
    date: string;
    changes: string[];
    hypothesis: string;
    targetMetrics: string[];
    testResults?: {
        avgScore: number;
        improvements: string[];
        regressions: string[];
    };
    decision: "ADOPTED" | "REJECTED" | "TESTING";
    notes: string;
}

