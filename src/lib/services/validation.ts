import { z } from 'zod';

// Technical Validation Schemas
export const StoryValidationSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required").max(255),
  summary: z.string().optional(),
  genre: z.string().optional(),
  premise: z.string().optional(),
  dramaticQuestion: z.string().optional(),
  theme: z.string().optional(),
  status: z.enum([
    'draft', 'phase1_in_progress', 'phase1_complete', 'phase2_complete',
    'phase3_complete', 'phase4_complete', 'phase5_6_complete',
    'generating_character_images', 'character_images_complete',
    'generating_setting_images', 'setting_images_complete',
    'completed', 'failed', 'active', 'hiatus', 'archived'
  ]).optional(),
  partIds: z.array(z.string()).optional(),
  chapterIds: z.array(z.string()).optional(),
});

export const PartValidationSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Part title is required").max(255),
  summary: z.string().optional(),
  storyId: z.string().min(1, "Story ID is required"),
  orderIndex: z.number().int().min(0),
  structuralRole: z.string().optional(),
  summary: z.string().optional(),
  keyBeats: z.array(z.string()).optional(),
  chapterIds: z.array(z.string()).optional(),
});

export const ChapterValidationSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Chapter title is required").max(255),
  summary: z.string().optional(),
  storyId: z.string().min(1, "Story ID is required"),
  partId: z.string().optional(),
  orderIndex: z.number().int().min(0),
  purpose: z.string().optional(),
  hook: z.string().optional(),
  characterFocus: z.string().optional(),
  pacingGoal: z.string().optional(),
  actionDialogueRatio: z.string().optional(),
  wordCount: z.number().min(0).optional(),
  sceneIds: z.array(z.string()).optional(),
  chapterHook: z.object({
    type: z.string(),
    summary: z.string(),
    urgency_level: z.string()
  }).optional(),
});

export const SceneValidationSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Scene title is required").max(255),
  content: z.string().optional(),
  chapterId: z.string().min(1, "Chapter ID is required"),
  orderIndex: z.number().int().min(0),
  goal: z.string().optional(),
  conflict: z.string().optional(),
  outcome: z.string().optional(),
  summary: z.string().optional(),
  entryHook: z.string().optional(),
  povCharacterId: z.string().optional(),
  settingId: z.string().optional(),
  narrativeVoice: z.string().optional(),
  wordCount: z.number().min(0).optional(),
  emotionalShift: z.object({
    from: z.string(),
    to: z.string()
  }).optional(),
  characterIds: z.array(z.string()).optional(),
  placeIds: z.array(z.string()).optional(),
});

export const CharacterValidationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Character name is required").max(255),
  storyId: z.string().min(1, "Story ID is required"),
  isMain: z.boolean().optional(),
  role: z.string().optional(),
  archetype: z.string().optional(),
  summary: z.string().optional(),
  storyline: z.string().optional(),
  personality: z.object({
    traits: z.array(z.string()),
    myers_briggs: z.string(),
    enneagram: z.string()
  }).optional(),
  backstory: z.record(z.string(), z.string()).optional(),
  motivations: z.object({
    primary: z.string(),
    secondary: z.string(),
    fear: z.string()
  }).optional(),
  voice: z.record(z.string(), z.unknown()).optional(),
  physicalDescription: z.record(z.string(), z.unknown()).optional(),
  visualReferenceId: z.string().optional(),
});

export const SettingValidationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Setting name is required").max(255),
  storyId: z.string().min(1, "Story ID is required"),
  summary: z.string().optional(),
  mood: z.string().optional(),
  sensory: z.record(z.string(), z.array(z.string())).optional(),
  visualStyle: z.string().optional(),
  visualReferences: z.array(z.string()).optional(),
  colorPalette: z.array(z.string()).optional(),
  architecturalStyle: z.string().optional(),
});

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
  severity: 'error';
  type: 'missing' | 'invalid' | 'constraint' | 'reference';
};

export type ValidationWarning = {
  field: string;
  message: string;
  severity: 'warning';
  type: 'incomplete' | 'recommendation' | 'quality';
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

    // Additional business logic validation
    if (!parsed.description) {
      warnings.push({
        field: 'description',
        message: 'Consider adding a description to help readers understand your story',
        severity: 'warning',
        type: 'incomplete'
      });
    }

    if (!parsed.genre) {
      warnings.push({
        field: 'genre',
        message: 'Adding a genre helps categorize your story',
        severity: 'warning',
        type: 'incomplete'
      });
    }

    if (!parsed.premise) {
      warnings.push({
        field: 'premise',
        message: 'A clear premise helps maintain story focus',
        severity: 'warning',
        type: 'recommendation'
      });
    }

    const stats = calculateStats(parsed, ['title'], ['description', 'genre', 'premise', 'dramaticQuestion', 'theme']);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach(issue => {
        errors.push({
          field: issue.path.join('.'),
          message: issue.message,
          severity: 'error',
          type: 'invalid'
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
        missingOptional: []
      }
    };
  }
}

export function validatePart(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  try {
    const parsed = PartValidationSchema.parse(data);

    if (!parsed.description) {
      warnings.push({
        field: 'description',
        message: 'Part description helps readers understand the story arc',
        severity: 'warning',
        type: 'incomplete'
      });
    }

    if (!parsed.structuralRole) {
      warnings.push({
        field: 'structuralRole',
        message: 'Define the structural role (e.g., Setup, Confrontation, Resolution)',
        severity: 'warning',
        type: 'recommendation'
      });
    }

    const stats = calculateStats(parsed, ['title', 'storyId', 'orderIndex'], ['description', 'structuralRole', 'summary', 'keyBeats']);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach(issue => {
        errors.push({
          field: issue.path.join('.'),
          message: issue.message,
          severity: 'error',
          type: 'invalid'
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
        missingOptional: []
      }
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
        field: 'summary',
        message: 'Chapter summary helps maintain narrative continuity',
        severity: 'warning',
        type: 'incomplete'
      });
    }

    if (!parsed.purpose) {
      warnings.push({
        field: 'purpose',
        message: 'Define the chapter\'s purpose in the overall narrative',
        severity: 'warning',
        type: 'recommendation'
      });
    }

    if (!parsed.hook) {
      warnings.push({
        field: 'hook',
        message: 'A chapter hook engages readers from the start',
        severity: 'warning',
        type: 'quality'
      });
    }

    const stats = calculateStats(parsed, ['title', 'storyId', 'orderIndex'], ['summary', 'purpose', 'hook', 'characterFocus', 'pacingGoal']);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach(issue => {
        errors.push({
          field: issue.path.join('.'),
          message: issue.message,
          severity: 'error',
          type: 'invalid'
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
        missingOptional: []
      }
    };
  }
}

export function validateScene(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  try {
    const parsed = SceneValidationSchema.parse(data);

    if (!parsed.goal) {
      warnings.push({
        field: 'goal',
        message: 'Every scene should have a clear goal',
        severity: 'warning',
        type: 'quality'
      });
    }

    if (!parsed.conflict) {
      warnings.push({
        field: 'conflict',
        message: 'Conflict drives scene tension and engagement',
        severity: 'warning',
        type: 'quality'
      });
    }

    if (!parsed.outcome) {
      warnings.push({
        field: 'outcome',
        message: 'Define how the scene resolves or transitions',
        severity: 'warning',
        type: 'quality'
      });
    }

    const stats = calculateStats(parsed, ['title', 'chapterId', 'orderIndex'], ['content', 'goal', 'conflict', 'outcome', 'summary']);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach(issue => {
        errors.push({
          field: issue.path.join('.'),
          message: issue.message,
          severity: 'error',
          type: 'invalid'
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
        missingOptional: []
      }
    };
  }
}

export function validateCharacter(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  try {
    const parsed = CharacterValidationSchema.parse(data);

    if (!parsed.role) {
      warnings.push({
        field: 'role',
        message: 'Define the character\'s role (protagonist, antagonist, etc.)',
        severity: 'warning',
        type: 'incomplete'
      });
    }

    if (!parsed.archetype) {
      warnings.push({
        field: 'archetype',
        message: 'Character archetype helps maintain consistency',
        severity: 'warning',
        type: 'recommendation'
      });
    }

    if (!parsed.motivations) {
      warnings.push({
        field: 'motivations',
        message: 'Clear motivations drive character actions',
        severity: 'warning',
        type: 'quality'
      });
    }

    const stats = calculateStats(parsed, ['name', 'storyId'], ['role', 'archetype', 'summary', 'storyline', 'motivations']);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach(issue => {
        errors.push({
          field: issue.path.join('.'),
          message: issue.message,
          severity: 'error',
          type: 'invalid'
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
        missingOptional: []
      }
    };
  }
}

export function validateSetting(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  try {
    const parsed = SettingValidationSchema.parse(data);

    if (!parsed.description) {
      warnings.push({
        field: 'description',
        message: 'Setting description creates atmosphere',
        severity: 'warning',
        type: 'incomplete'
      });
    }

    if (!parsed.mood) {
      warnings.push({
        field: 'mood',
        message: 'Define the mood to guide scene writing',
        severity: 'warning',
        type: 'recommendation'
      });
    }

    if (!parsed.sensory) {
      warnings.push({
        field: 'sensory',
        message: 'Sensory details enhance immersion',
        severity: 'warning',
        type: 'quality'
      });
    }

    const stats = calculateStats(parsed, ['name', 'storyId'], ['description', 'mood', 'sensory', 'visualStyle']);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach(issue => {
        errors.push({
          field: issue.path.join('.'),
          message: issue.message,
          severity: 'error',
          type: 'invalid'
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
        missingOptional: []
      }
    };
  }
}

// Helper function to calculate completeness stats
function calculateStats(data: any, requiredFields: string[], optionalFields: string[]): ValidationStats {
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  requiredFields.forEach(field => {
    if (!data[field]) {
      missingRequired.push(field);
    }
  });

  optionalFields.forEach(field => {
    if (!data[field]) {
      missingOptional.push(field);
    }
  });

  const totalFields = requiredFields.length + optionalFields.length;
  const completedFields = totalFields - missingRequired.length - missingOptional.length;
  const completenessPercentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

  return {
    totalFields,
    completedFields,
    completenessPercentage,
    missingRequired,
    missingOptional
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
    totalWarnings
  };
}