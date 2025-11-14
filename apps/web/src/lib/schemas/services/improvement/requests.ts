import type { StoryEvaluationResult } from "../evaluation";
import type { FullValidationResult } from "../validation";

/**
 * Story improvement request types
 */

export interface StoryImprovementRequest {
    analysisResult: {
        validation?: FullValidationResult;
        evaluation?: StoryEvaluationResult;
    };
    originalData: {
        story: any;
        parts?: any[];
        chapters?: any[];
        scenes?: any[];
        characters?: any[];
        settings?: any[];
    };
    options?: {
        updateLevel?: "conservative" | "moderate" | "aggressive";
        preserveUserContent?: boolean;
        focusAreas?: (
            | "structure"
            | "character"
            | "world"
            | "pacing"
            | "dialogue"
        )[];
        autoApply?: boolean;
        dryRun?: boolean;
    };
}
