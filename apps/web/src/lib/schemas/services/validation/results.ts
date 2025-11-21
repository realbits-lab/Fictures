/**
 * Validation result types for story component validation
 */

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    stats: ValidationStats;
}

export interface ValidationError {
    field: string;
    message: string;
    severity: "error";
    type: "missing" | "invalid" | "constraint" | "reference";
}

export interface ValidationWarning {
    field: string;
    message: string;
    severity: "warning";
    type: "incomplete" | "recommendation" | "quality";
}

export interface ValidationStats {
    totalFields: number;
    completedFields: number;
    completenessPercentage: number;
    missingRequired: string[];
    missingOptional: string[];
}
