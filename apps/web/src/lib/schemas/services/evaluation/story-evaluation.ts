/**
 * Story-level evaluation types
 * Comprehensive evaluation across all story components
 */

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

export interface QuickEvaluationResult {
    score: number;
    feedback: string;
    suggestions: string[];
}
