/**
 * Validation Service
 *
 * Single Source of Truth: Drizzle ORM schema (via drizzle-zod)
 * This file provides validation functions with business logic (warnings, stats)
 * All base Zod schemas are generated from Drizzle schema
 */

import { z } from "zod";
import {
    insertChapterSchema,
    insertCharacterSchema,
    insertPartSchema,
    insertSceneSchema,
    insertSettingSchema,
    insertStorySchema,
} from "@/lib/studio/generators/zod-schemas";

// Re-export generated schemas for convenience
export const StoryValidationSchema = insertStorySchema.partial();
export const PartValidationSchema = insertPartSchema.partial();
export const ChapterValidationSchema = insertChapterSchema.partial();
export const SceneValidationSchema = insertSceneSchema.partial();
export const CharacterValidationSchema = insertCharacterSchema.partial();
export const SettingValidationSchema = insertSettingSchema.partial();

// Validation Types
export type ValidationResult = {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    stats: ValidationStats;
};

export type ValidationError = {
    field: string;
    message: string;
    severity: "error";
    type: "missing" | "invalid" | "constraint" | "reference";
};

export type ValidationWarning = {
    field: string;
    message: string;
    severity: "warning";
    type: "incomplete" | "recommendation" | "quality";
};

export type ValidationStats = {
    totalFields: number;
    completedFields: number;
    completenessPercentage: number;
    missingRequired: string[];
    missingOptional: string[];
};

// Technical Validation Functions
export function validateStory(data: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
        const parsed = StoryValidationSchema.parse(data);

        // Additional business logic validation (Adversity-Triumph Engine fields)
        if (!parsed.summary) {
            warnings.push({
                field: "summary",
                message:
                    "Consider adding a summary to help readers understand your story",
                severity: "warning",
                type: "incomplete",
            });
        }

        if (!parsed.genre) {
            warnings.push({
                field: "genre",
                message: "Adding a genre helps categorize your story",
                severity: "warning",
                type: "incomplete",
            });
        }

        if (!parsed.moralFramework) {
            warnings.push({
                field: "moralFramework",
                message:
                    "A clear moral framework helps maintain thematic consistency",
                severity: "warning",
                type: "recommendation",
            });
        }

        const stats = calculateStats(
            parsed,
            ["title", "authorId"],
            ["summary", "genre", "tone", "moralFramework"],
        );

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            stats,
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            error.issues.forEach((issue) => {
                errors.push({
                    field: issue.path.join("."),
                    message: issue.message,
                    severity: "error",
                    type: "invalid",
                });
            });
        }

        return {
            isValid: false,
            errors,
            warnings,
            stats: {
                totalFields: 0,
                completedFields: 0,
                completenessPercentage: 0,
                missingRequired: [],
                missingOptional: [],
            },
        };
    }
}

export function validatePart(data: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
        const parsed = PartValidationSchema.parse(data);

        if (!parsed.summary) {
            warnings.push({
                field: "summary",
                message: "Part summary helps readers understand the story arc",
                severity: "warning",
                type: "incomplete",
            });
        }

        if (!parsed.characterArcs || parsed.characterArcs.length === 0) {
            warnings.push({
                field: "characterArcs",
                message:
                    "Define character arcs for MACRO adversity-triumph progression",
                severity: "warning",
                type: "recommendation",
            });
        }

        const stats = calculateStats(
            parsed,
            ["title", "storyId", "orderIndex"],
            ["summary", "characterArcs"],
        );

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            stats,
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            error.issues.forEach((issue) => {
                errors.push({
                    field: issue.path.join("."),
                    message: issue.message,
                    severity: "error",
                    type: "invalid",
                });
            });
        }

        return {
            isValid: false,
            errors,
            warnings,
            stats: {
                totalFields: 0,
                completedFields: 0,
                completenessPercentage: 0,
                missingRequired: [],
                missingOptional: [],
            },
        };
    }
}

export function validateChapter(data: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
        const parsed = ChapterValidationSchema.parse(data);

        if (!parsed.summary) {
            warnings.push({
                field: "summary",
                message: "Chapter summary helps maintain narrative continuity",
                severity: "warning",
                type: "incomplete",
            });
        }

        if (!parsed.contributesToMacroArc) {
            warnings.push({
                field: "contributesToMacroArc",
                message:
                    "Define how this chapter advances the overall character arc",
                severity: "warning",
                type: "recommendation",
            });
        }

        if (!parsed.createsNextAdversity) {
            warnings.push({
                field: "createsNextAdversity",
                message:
                    "Define how this chapter creates the next problem (narrative flow)",
                severity: "warning",
                type: "quality",
            });
        }

        const stats = calculateStats(
            parsed,
            ["title", "storyId", "partId", "characterId", "orderIndex"],
            [
                "summary",
                "arcPosition",
                "contributesToMacroArc",
                "adversityType",
                "virtueType",
            ],
        );

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            stats,
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            error.issues.forEach((issue) => {
                errors.push({
                    field: issue.path.join("."),
                    message: issue.message,
                    severity: "error",
                    type: "invalid",
                });
            });
        }

        return {
            isValid: false,
            errors,
            warnings,
            stats: {
                totalFields: 0,
                completedFields: 0,
                completenessPercentage: 0,
                missingRequired: [],
                missingOptional: [],
            },
        };
    }
}

export function validateScene(data: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
        const parsed = SceneValidationSchema.parse(data);

        if (!parsed.cyclePhase) {
            warnings.push({
                field: "cyclePhase",
                message:
                    "Define the cycle phase (setup, confrontation, virtue, consequence, transition)",
                severity: "warning",
                type: "quality",
            });
        }

        if (!parsed.emotionalBeat) {
            warnings.push({
                field: "emotionalBeat",
                message:
                    "Define the target emotional beat (fear, hope, tension, relief, etc.)",
                severity: "warning",
                type: "quality",
            });
        }

        if (!parsed.content) {
            warnings.push({
                field: "content",
                message: "Scene content should be generated from the summary",
                severity: "warning",
                type: "quality",
            });
        }

        const stats = calculateStats(
            parsed,
            ["title", "chapterId", "orderIndex"],
            ["content", "cyclePhase", "emotionalBeat", "summary", "settingId"],
        );

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            stats,
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            error.issues.forEach((issue) => {
                errors.push({
                    field: issue.path.join("."),
                    message: issue.message,
                    severity: "error",
                    type: "invalid",
                });
            });
        }

        return {
            isValid: false,
            errors,
            warnings,
            stats: {
                totalFields: 0,
                completedFields: 0,
                completenessPercentage: 0,
                missingRequired: [],
                missingOptional: [],
            },
        };
    }
}

export function validateCharacter(data: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
        const parsed = CharacterValidationSchema.parse(data);

        if (!parsed.coreTrait) {
            warnings.push({
                field: "coreTrait",
                message:
                    "Define the core virtue (courage, compassion, integrity, etc.)",
                severity: "warning",
                type: "incomplete",
            });
        }

        if (!parsed.internalFlaw) {
            warnings.push({
                field: "internalFlaw",
                message:
                    "Internal flaw creates internal adversity for character development",
                severity: "warning",
                type: "recommendation",
            });
        }

        if (!parsed.externalGoal) {
            warnings.push({
                field: "externalGoal",
                message:
                    "External goal drives character actions and creates conflict",
                severity: "warning",
                type: "quality",
            });
        }

        const stats = calculateStats(
            parsed,
            ["name", "storyId"],
            [
                "coreTrait",
                "internalFlaw",
                "externalGoal",
                "summary",
                "personality",
                "backstory",
            ],
        );

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            stats,
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            error.issues.forEach((issue) => {
                errors.push({
                    field: issue.path.join("."),
                    message: issue.message,
                    severity: "error",
                    type: "invalid",
                });
            });
        }

        return {
            isValid: false,
            errors,
            warnings,
            stats: {
                totalFields: 0,
                completedFields: 0,
                completenessPercentage: 0,
                missingRequired: [],
                missingOptional: [],
            },
        };
    }
}

export function validateSetting(data: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
        const parsed = SettingValidationSchema.parse(data);

        if (!parsed.summary) {
            warnings.push({
                field: "summary",
                message: "Setting summary creates atmosphere",
                severity: "warning",
                type: "incomplete",
            });
        }

        if (!parsed.mood) {
            warnings.push({
                field: "mood",
                message: "Define the mood to guide scene writing",
                severity: "warning",
                type: "recommendation",
            });
        }

        if (!parsed.sensory) {
            warnings.push({
                field: "sensory",
                message: "Sensory details enhance immersion",
                severity: "warning",
                type: "quality",
            });
        }

        const stats = calculateStats(
            parsed,
            ["name", "storyId"],
            ["description", "mood", "sensory"],
        );

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            stats,
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            error.issues.forEach((issue) => {
                errors.push({
                    field: issue.path.join("."),
                    message: issue.message,
                    severity: "error",
                    type: "invalid",
                });
            });
        }

        return {
            isValid: false,
            errors,
            warnings,
            stats: {
                totalFields: 0,
                completedFields: 0,
                completenessPercentage: 0,
                missingRequired: [],
                missingOptional: [],
            },
        };
    }
}

// Helper function to calculate completeness stats
function calculateStats(
    data: Record<string, unknown>,
    requiredFields: string[],
    optionalFields: string[],
): ValidationStats {
    const missingRequired: string[] = [];
    const missingOptional: string[] = [];

    requiredFields.forEach((field) => {
        if (!data[field]) {
            missingRequired.push(field);
        }
    });

    optionalFields.forEach((field) => {
        if (!data[field]) {
            missingOptional.push(field);
        }
    });

    const totalFields = requiredFields.length + optionalFields.length;
    const completedFields =
        totalFields - missingRequired.length - missingOptional.length;
    const completenessPercentage =
        totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

    return {
        totalFields,
        completedFields,
        completenessPercentage,
        missingRequired,
        missingOptional,
    };
}

// Batch validation for complete story structure
export function validateStoryStructure(data: {
    story: unknown;
    parts?: unknown[];
    chapters?: unknown[];
    scenes?: unknown[];
    characters?: unknown[];
    settings?: unknown[];
}): {
    story: ValidationResult;
    parts: ValidationResult[];
    chapters: ValidationResult[];
    scenes: ValidationResult[];
    characters: ValidationResult[];
    settings: ValidationResult[];
    overallValid: boolean;
    totalErrors: number;
    totalWarnings: number;
} {
    const storyValidation = validateStory(data.story);
    const partsValidation = (data.parts || []).map(validatePart);
    const chaptersValidation = (data.chapters || []).map(validateChapter);
    const scenesValidation = (data.scenes || []).map(validateScene);
    const charactersValidation = (data.characters || []).map(validateCharacter);
    const settingsValidation = (data.settings || []).map(validateSetting);

    const totalErrors =
        storyValidation.errors.length +
        partsValidation.reduce((sum, v) => sum + v.errors.length, 0) +
        chaptersValidation.reduce((sum, v) => sum + v.errors.length, 0) +
        scenesValidation.reduce((sum, v) => sum + v.errors.length, 0) +
        charactersValidation.reduce((sum, v) => sum + v.errors.length, 0) +
        settingsValidation.reduce((sum, v) => sum + v.errors.length, 0);

    const totalWarnings =
        storyValidation.warnings.length +
        partsValidation.reduce((sum, v) => sum + v.warnings.length, 0) +
        chaptersValidation.reduce((sum, v) => sum + v.warnings.length, 0) +
        scenesValidation.reduce((sum, v) => sum + v.warnings.length, 0) +
        charactersValidation.reduce((sum, v) => sum + v.warnings.length, 0) +
        settingsValidation.reduce((sum, v) => sum + v.warnings.length, 0);

    return {
        story: storyValidation,
        parts: partsValidation,
        chapters: chaptersValidation,
        scenes: scenesValidation,
        characters: charactersValidation,
        settings: settingsValidation,
        overallValid: totalErrors === 0,
        totalErrors,
        totalWarnings,
    };
}
