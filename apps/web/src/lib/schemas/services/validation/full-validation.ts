import type { ValidationResult } from "./results";

/**
 * Full story structure validation result
 */
export interface FullValidationResult {
    story: ValidationResult;
    parts: ValidationResult[];
    chapters: ValidationResult[];
    scenes: ValidationResult[];
    characters: ValidationResult[];
    settings: ValidationResult[];
    overallValid: boolean;
    totalErrors: number;
    totalWarnings: number;
}
