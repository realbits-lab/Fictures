// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ValidationStats;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error';
  type: 'missing' | 'invalid' | 'constraint' | 'reference';
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning';
  type: 'incomplete' | 'recommendation' | 'quality';
}

export interface ValidationStats {
  totalFields: number;
  completedFields: number;
  completenessPercentage: number;
  missingRequired: string[];
  missingOptional: string[];
}

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

// Evaluation Types
export interface EvaluationScore {
  score: number;
  category: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface OverallEvaluation {
  narrativeStructure: EvaluationScore;
  characterDevelopment: EvaluationScore;
  worldBuilding: EvaluationScore;
  pacing: EvaluationScore;
  dialogueQuality: EvaluationScore;
  themeConsistency: EvaluationScore;
  emotionalImpact: EvaluationScore;
  overallScore: number;
  summary: string;
  keyStrengths: string[];
  prioritizedImprovements: string[];
}

export interface StoryEvaluationResult {
  storyEvaluation: OverallEvaluation | null;
  partEvaluations: PartEvaluation[];
  chapterEvaluations: ChapterEvaluation[];
  sceneEvaluations: SceneEvaluation[];
  characterEvaluations: CharacterEvaluation[];
  settingEvaluations: SettingEvaluation[];
  crossReferenceAnalysis: CrossReferenceAnalysis;
}

export interface PartEvaluation {
  partId: string;
  title: string;
  structuralEffectiveness: number;
  contributionToStory: number;
  suggestions: string[];
}

export interface ChapterEvaluation {
  chapterId: string;
  title: string;
  hookEffectiveness: number;
  pacingScore: number;
  purposeFulfillment: number;
  suggestions: string[];
}

export interface SceneEvaluation {
  sceneId: string;
  title: string;
  goalClarity: number;
  conflictTension: number;
  outcomeImpact: number;
  emotionalResonance: number;
  contentQuality?: number;
  showDontTell?: number;
  dialogueNaturalness?: number;
  proseQuality?: number;
  suggestions: string[];
}

export interface CharacterEvaluation {
  characterId: string;
  name: string;
  consistency: number;
  depth: number;
  arcDevelopment: number;
  voiceDistinctiveness: number;
  suggestions: string[];
}

export interface SettingEvaluation {
  settingId: string;
  name: string;
  atmosphereScore: number;
  sensoryDetail: number;
  worldBuildingContribution: number;
  suggestions: string[];
}

export interface CrossReferenceAnalysis {
  plotHoles: string[];
  inconsistencies: string[];
  timelineIssues: string[];
  characterInconsistencies: string[];
  unresolvedThreads: string[];
  suggestions: string[];
}

// API Request/Response Types
export interface ValidationRequest {
  type: 'story' | 'part' | 'chapter' | 'scene' | 'character' | 'setting' | 'full';
  data: any;
  includeWarnings?: boolean;
}

export interface EvaluationRequest {
  mode: 'full' | 'quick';
  type?: 'story' | 'part' | 'chapter' | 'scene' | 'character' | 'setting';
  data: any;
  includeAIFeedback?: boolean;
  detailLevel?: 'basic' | 'detailed' | 'comprehensive';
}

export interface StoryAnalysisRequest {
  analysisType: 'validation' | 'evaluation' | 'both';
  data: {
    story: any;
    parts?: any[];
    chapters?: any[];
    scenes?: any[];
    characters?: any[];
    settings?: any[];
  };
  options?: {
    includeWarnings?: boolean;
    includeAIFeedback?: boolean;
    detailLevel?: 'basic' | 'detailed' | 'comprehensive';
    generateReport?: boolean;
  };
}

export interface StoryAnalysisResponse {
  success: boolean;
  analysisType: 'validation' | 'evaluation' | 'both';
  timestamp: string;
  validation?: {
    overallValid: boolean;
    totalErrors: number;
    totalWarnings: number;
    details?: FullValidationResult;
    summary: string;
  };
  evaluation?: StoryEvaluationResult | {
    overallScore: number;
    summary: string;
    keyStrengths: string[];
    prioritizedImprovements: string[];
  };
  report?: ComprehensiveReport;
}

export interface ComprehensiveReport {
  executiveSummary: {
    validationStatus: 'PASS' | 'FAIL';
    evaluationScore: number;
    readiness: string;
  };
  strengths: string[];
  criticalIssues: string[];
  recommendations: string[];
  nextSteps: string[];
}

export interface QuickEvaluationResult {
  score: number;
  feedback: string;
  suggestions: string[];
}

// Story Improvement Types
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
    updateLevel?: 'conservative' | 'moderate' | 'aggressive';
    preserveUserContent?: boolean;
    focusAreas?: ('structure' | 'character' | 'world' | 'pacing' | 'dialogue')[];
    autoApply?: boolean;
    dryRun?: boolean;
  };
}

export interface StoryImprovementResult {
  improved: {
    story: any;
    parts: any[];
    chapters: any[];
    scenes: any[];
    characters: any[];
    settings: any[];
  };
  changes: {
    story: ChangeLog;
    parts: ChangeLog[];
    chapters: ChangeLog[];
    scenes: ChangeLog[];
    characters: ChangeLog[];
    settings: ChangeLog[];
  };
  summary: {
    totalChanges: number;
    majorImprovements: string[];
    minorAdjustments: string[];
    preservedElements: string[];
  };
}

export interface ChangeLog {
  id: string;
  fieldsUpdated: string[];
  improvements: string[];
  rationale: string;
}

export interface StoryAnalysisWithImprovementResponse extends StoryAnalysisResponse {
  improvements?: {
    enabled: boolean;
    result?: StoryImprovementResult;
    summary?: any;
    message: string;
    error?: string;
  };
  nextSteps?: string[];
}