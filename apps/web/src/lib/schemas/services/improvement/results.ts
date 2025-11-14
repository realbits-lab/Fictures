import type { ChangeLog } from "./change-log";

/**
 * Story improvement result types
 */

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
