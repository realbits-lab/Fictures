/**
 * Legacy YAML-based Story Development Types
 *
 * These types are used by the legacy story-development.ts system.
 * They represent YAML-based story structures that are different from
 * the current Adversity-Triumph Engine novel generation system.
 *
 * Note: This file exists to maintain type compatibility for legacy code.
 * New development should use types from @/lib/schemas/ai instead.
 */

export interface Story {
    title: string;
    genre: string;
    words: number;
    question: string;
    goal: string;
    conflict: string;
    outcome: string;
    chars: {
        [key: string]: {
            role: string;
            arc?: string;
            flaw?: string;
            goal?: string;
            secret?: string;
        };
    };
    themes?: string[];
    structure?: {
        type: string;
        parts: string[];
        dist: number[];
    };
    setting?: {
        primary?: string[];
        secondary?: string[];
    };
    parts: {
        part: number;
        goal: string;
        conflict: string;
        outcome: string;
        tension: string;
    }[];
    serial: {
        schedule: string;
        duration: string;
        chapter_words: number;
        breaks: string[];
        buffer: string;
    };
    hooks?: {
        overarching?: string[];
        mysteries?: string[];
        part_endings?: string[];
    };
    language: string;
}

export interface PartSpecification {
    part: number;
    title: string;
    words: number;
    function: string;
    goals: string;
    conflict: string;
    outcome: string;
    questions: {
        primary: string;
        secondary: string;
    };
    chars: {
        [key: string]: {
            name: string;
            start: string;
            end: string;
            arc: string[];
            development: string;
            conflict: string;
            transforms: string[];
            function: string;
        };
    };
    plot: {
        events: string[];
        reveals: string[];
        escalation: string[];
    };
    themes: {
        primary: string;
        elements: string[];
        moments: string[];
        symbols: string[];
    };
    emotion: {
        start: string;
        progression: string[];
        end: string;
    };
    ending: {
        resolution: string[];
        setup: string[];
        hooks: string[];
        hook_out: string;
    };
    serial: {
        arc: string;
        climax_at: string;
        satisfaction: string[];
        anticipation: string[];
        chapter_words: number;
    };
    engagement: {
        discussions: string[];
        speculation: string[];
        debates: string[];
        feedback: string[];
    };
}

export interface ChapterSpecification {
    chap: number;
    title: string;
    pov: string;
    words: number;
    goal: string;
    conflict: string;
    outcome: string;
    acts: {
        setup: {
            hook_in: string;
            orient: string;
            incident: string;
        };
        confrontation: {
            rising: string;
            midpoint: string;
            complicate: string;
        };
        resolution: {
            climax: string;
            resolve: string;
            hook_out: string;
        };
    };
    chars: {
        [key: string]: {
            start: string;
            arc: string;
            end: string;
            motivation: string;
            growth: string;
        };
    };
    tension: {
        external: string;
        internal: string;
        interpersonal: string;
        atmospheric: string;
        peak: string;
    };
    mandate: {
        episodic: {
            arc: string;
            payoff: string;
            answered: string;
        };
        serial: {
            complication: string;
            stakes: string;
            compulsion: string;
        };
    };
    hook: {
        type: string;
        reveal: string;
        threat: string;
        emotion: string;
    };
    continuity: {
        foreshadow: string[];
        theories: string[];
    };
    genre: string;
    pacing: string;
    exposition: string;
}

export interface SceneSpecification {
    id: number;
    summary: string;
    time: string;
    place_name: string;
    place_id?: string;
    pov: string;
    character_names: string[];
    character_ids?: string[];
    characters: {
        [key: string]: {
            enters: string;
            exits: string;
            status: string;
            evidence: string;
        };
    };
    goal: string;
    obstacle: string;
    outcome: string;
    beats: string[];
    shift: string;
    leads_to: string;
    image_prompt: string;
}
