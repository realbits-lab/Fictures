/**
 * Type Definitions for Image Iteration Testing
 */

export interface ImageTestResult {
    testId: string;
    scenarioId: string;
    scenarioName: string;
    promptVersion: string;
    timestamp: string;
    image: {
        imageUrl: string;
        imageVariants: {
            avif1x: string;
            avif2x: string;
        };
        metadata: {
            width: number;
            height: number;
            aspectRatio: string;
            originalSize: number;
            avif1xSize: number;
            avif2xSize: number;
        };
    };
    evaluation: ImageEvaluation;
    metadata: {
        generationTime: number;
        optimizationTime: number;
        totalTime: number;
        provider: string;
        model: string;
        uploadTime?: number;
        dbUpdateTime?: number;
    };
}

export interface ImageEvaluation {
    weightedScore: number;
    passes: boolean;
    categoryScores: {
        generationQuality: number; // 1-5
        optimizationQuality: number; // 1-5
        visualQuality: number; // 1-5
        performance: number; // 1-5
    };
    metrics: ImageMetrics;
    recommendations: string[];
    finalReport: string;
}

export interface ImageMetrics {
    // Generation Quality
    aspectRatioAccuracy: number; // Deviation percentage
    resolutionCompliance: boolean;
    promptAdherence: number; // 0-100%
    formatValidation: boolean;
    fileSize: number; // KB

    // Optimization Quality
    avifCompressionRatio: number; // Percentage reduction
    avif1xSize: number; // KB
    avif2xSize: number; // KB
    totalVariantSize: number; // KB
    storageRatio: number; // Variants as % of original

    // Visual Quality
    visualQualityScore: number; // 1-5
    artifactCount: number;
    aspectRatioPreservation: number; // Deviation percentage
    variantCount: number;
    formatValidation: boolean;
    imageAccessibility: boolean;

    // Performance
    generationTime: number; // seconds
    optimizationTime: number; // seconds
    totalTime: number; // seconds
    success: boolean;
}

export interface AggregatedImageMetrics {
    version: string;
    totalTests: number;
    testDate: string;

    // Core Quality Metrics
    averageWeightedScore: number;
    passRate: number; // % passing 3.0 threshold
    firstPassSuccessRate: number; // % passing without regeneration

    // Category Scores (1-5)
    categoryAverages: {
        generationQuality: number;
        optimizationQuality: number;
        visualQuality: number;
        performance: number;
    };

    // Generation Quality
    averageAspectRatioAccuracy: number;
    resolutionComplianceRate: number;
    averagePromptAdherence: number;
    formatComplianceRate: number;
    averageFileSize: number;

    // Optimization Quality
    averageAvifCompressionRatio: number;
    averageAvif1xSize: number;
    averageAvif2xSize: number;
    averageTotalVariantSize: number;
    averageStorageRatio: number;

    // Visual Quality
    averageVisualQualityScore: number;
    averageArtifactCount: number;
    aspectRatioPreservationRate: number;
    variantCountComplianceRate: number;

    // Performance
    averageGenerationTime: number;
    averageOptimizationTime: number;
    averageTotalTime: number;
    successRate: number;

    // Failure Patterns
    failurePatterns: FailurePattern[];
}

export interface FailurePattern {
    category:
        | "generation"
        | "optimization"
        | "visual"
        | "performance"
        | "format";
    description: string;
    frequency: number;
    averageScore: number;
    priority: "critical" | "high" | "medium" | "low";
    suggestedFix: string;
}

export interface ImageTestConfig {
    version: string;
    scenarioIds: string[];
    iterations: number;
    evaluationMode: "quick" | "standard" | "thorough";
    outputPath: string;
}

export interface ABTestComparison {
    config: {
        controlVersion: string;
        experimentVersion: string;
        testScenarios: string[];
        sampleSize: number;
        hypothesis: string;
        testDate: string;
    };
    control: AggregatedImageMetrics;
    experiment: AggregatedImageMetrics;
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

export interface ImagePromptVersion {
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
