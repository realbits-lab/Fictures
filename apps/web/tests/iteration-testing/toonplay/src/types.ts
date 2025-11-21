/**
 * Type Definitions for Toonplay Iteration Testing
 */

export interface ToonplayTestResult {
    testId: string;
    sceneId: string;
    sceneName: string;
    promptVersion: string;
    timestamp: string;
    toonplay: {
        sceneId: string;
        sceneTitle: string;
        totalPanels: number;
        panels: Array<{
            panelNumber: number;
            shotType: string;
            description: string;
            charactersVisible: string[];
            dialogue: Array<{ characterId: string; text: string }>;
            narrative?: string;
            sfx: Array<{ text: string; emphasis: string }>;
        }>;
        narrativeArc: string;
    };
    evaluation: ToonplayEvaluation;
    metadata: {
        generationTime: number;
        evaluationTime: number;
        totalTime: number;
        iterations: number;
        model: string;
        provider: string;
    };
}

export interface ToonplayEvaluation {
    weightedScore: number;
    passes: boolean;
    categoryScores: {
        narrativeFidelity: number; // 1-5
        visualTransformation: number; // 1-5
        webtoonPacing: number; // 1-5
        scriptFormatting: number; // 1-5
    };
    metrics: ToonplayMetrics;
    recommendations: string[];
    finalReport: string;
}

export interface ToonplayMetrics {
    // Content Proportions
    narrationPercentage: number; // Target: <5%
    internalMonologuePercentage: number; // Target: <10%
    dialoguePresence: number; // Target: ~70%

    // Visual Grammar
    shotTypeDistribution: Record<string, number>;
    shotVariety: number; // Number of different shot types used

    // Text Validation
    textOverlayValidation: boolean; // All panels have visual text overlay
    dialogueLengthCompliance: boolean; // Max 150 chars per bubble
    descriptionLengthCompliance: boolean; // 200-400 chars per panel

    // Panel Quality
    panelCount: number;
    averageDescriptionLength: number;
    averageDialoguePerPanel: number;

    // Webtoon Optimization
    verticalFlowQuality: number; // 1-5 (thumb-scroll optimization)
    panelPacingRhythm: number; // 1-5 (build-peak-release)
}

export interface AggregatedToonplayMetrics {
    version: string;
    totalTests: number;
    testDate: string;

    // Core Quality Metrics
    averageWeightedScore: number;
    passRate: number; // % passing 3.0 threshold
    firstPassSuccessRate: number; // % passing without iterations

    // Category Scores (1-5)
    categoryAverages: {
        narrativeFidelity: number;
        visualTransformation: number;
        webtoonPacing: number;
        scriptFormatting: number;
    };

    // Content Proportions
    averageNarrationPercentage: number;
    averageInternalMonologuePercentage: number;
    averageDialoguePresence: number;

    // Proportion Compliance Rates
    narrationComplianceRate: number; // % with <5%
    internalMonologueComplianceRate: number; // % with <10%
    dialogueTargetRate: number; // % with 60-80%

    // Visual Grammar
    averageShotVariety: number;
    shotTypeDistributionAggregate: Record<string, number>;

    // Panel Quality
    averagePanelCount: number;
    averageDescriptionLength: number;
    descriptionComplianceRate: number; // % panels 200-400 chars

    // Dialogue Quality
    averageDialoguePerPanel: number;
    dialogueLengthComplianceRate: number; // % under 150 chars

    // Webtoon Optimization
    averageVerticalFlowQuality: number;
    averagePanelPacingRhythm: number;

    // Generation Performance
    averageGenerationTime: number;
    averageIterations: number;
    averageTotalTime: number;

    // Failure Patterns
    failurePatterns: FailurePattern[];
}

export interface FailurePattern {
    category: "narrative" | "visual" | "pacing" | "formatting" | "proportion";
    description: string;
    frequency: number; // Number of occurrences
    averageScore: number; // Average score for this pattern
    priority: "critical" | "high" | "medium" | "low";
    suggestedFix: string;
}

export interface ToonplayTestConfig {
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
    control: AggregatedToonplayMetrics;
    experiment: AggregatedToonplayMetrics;
    comparison: {
        deltas: Record<string, number>; // Metric improvements/regressions
        statisticalSignificance: {
            pValue: number;
            confidenceLevel: number;
            sampleSize: number;
        };
        improvements: string[]; // Metrics that improved
        regressions: string[]; // Metrics that got worse
        neutral: string[]; // Metrics that stayed the same
        recommendation: "ADOPT" | "REVISE" | "REVERT";
        reasoning: string;
    };
}

export interface ToonplayPromptVersion {
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
