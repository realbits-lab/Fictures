"use client";

import React, { useState } from "react";
import {
    Badge,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui";

// JSON data interfaces based on the development documentation
interface StoryJSON {
    title: string;
    genre: string;
    words: number;
    question: string;
    goal: string;
    conflict: string;
    outcome: string;
    chars: Record<
        string,
        {
            role: string;
            arc: string;
            flaw?: string;
            goal?: string;
            secret?: string;
        }
    >;
    themes: string[];
    structure: {
        type: string;
        parts: string[];
        dist: number[];
    };
    setting: {
        primary: string[];
        secondary: string[];
    };
    parts: Array<{
        part: number;
        goal: string;
        conflict: string;
        outcome: string;
        tension: string;
    }>;
    serial: {
        schedule: string;
        duration: string;
        chapter_words: number;
        breaks: string[];
        buffer: string;
    };
    hooks: {
        overarching: string[];
        mysteries: string[];
        part_endings: string[];
    };
}

interface PartJSON {
    part: number;
    title: string;
    words: number;
    function: string;
    goal: string;
    conflict: string;
    outcome: string;
    questions: {
        primary: string;
        secondary: string;
    };
    chars: Record<
        string,
        {
            start: string;
            end: string;
            arc: string[];
            conflict: string;
            transforms: string[];
        }
    >;
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
}

interface ChapterJSON {
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
    chars: Record<
        string,
        {
            start: string;
            arc: string;
            end: string;
            motivation: string;
            growth: string;
        }
    >;
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
}

interface SceneJSON {
    id: number;
    summary: string;
    time: string;
    place: string;
    pov: string;
    characters: Record<
        string,
        {
            enters?: string;
            exits?: string;
            status?: string;
            evidence?: string;
        }
    >;
    goal: string;
    obstacle: string;
    outcome: string;
    beats: string[];
    shift: string;
    leads_to: string;
    image_prompt: string;
}

interface JSONDataDisplayProps {
    storyData?: StoryJSON;
    partData?: PartJSON;
    chapterData?: ChapterJSON;
    sceneData?: SceneJSON;
    currentLevel: "story" | "part" | "chapter" | "scene";
}

export function JSONDataDisplay({
    storyData,
    partData,
    chapterData,
    sceneData,
    currentLevel,
}: JSONDataDisplayProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(["summary"]),
    );

    const toggleSection = (section: string) => {
        setExpandedSections((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(section)) {
                newSet.delete(section);
            } else {
                newSet.add(section);
            }
            return newSet;
        });
    };

    const renderJSONSection = (title: string, content: any, key: string) => {
        const isExpanded = expandedSections.has(key);

        return (
            <div
                key={key}
                className="border border-gray-200 dark:border-gray-700 rounded-lg"
            >
                <button
                    onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                    <div className="flex items-center gap-2">
                        <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                                isExpanded ? "rotate-90" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {title}
                        </span>
                    </div>
                </button>
                {isExpanded && (
                    <div className="px-3 pb-3">
                        <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-900 rounded p-3 overflow-x-auto whitespace-pre-wrap">
                            <code className="text-gray-700 dark:text-gray-300">
                                {typeof content === "object"
                                    ? JSON.stringify(content, null, 2)
                                    : content}
                            </code>
                        </pre>
                    </div>
                )}
            </div>
        );
    };

    const renderStoryJSON = () => {
        if (!storyData) return null;

        return (
            <div className="space-y-3">
                {renderJSONSection(
                    "Story Foundation",
                    {
                        title: storyData.title,
                        genre: storyData.genre,
                        words: storyData.words,
                        question: storyData.question,
                        goal: storyData.goal,
                        conflict: storyData.conflict,
                        outcome: storyData.outcome,
                    },
                    "foundation",
                )}

                {renderJSONSection("Characters", storyData.chars, "characters")}

                {renderJSONSection(
                    "Story Structure",
                    {
                        themes: storyData.themes,
                        structure: storyData.structure,
                        parts: storyData.parts,
                    },
                    "structure",
                )}

                {renderJSONSection(
                    "Setting & World",
                    storyData.setting,
                    "setting",
                )}

                {renderJSONSection(
                    "Serial Publication",
                    {
                        serial: storyData.serial,
                        hooks: storyData.hooks,
                    },
                    "publication",
                )}
            </div>
        );
    };

    const renderPartJSON = () => {
        if (!partData) return null;

        return (
            <div className="space-y-3">
                {renderJSONSection(
                    "Part Overview",
                    {
                        part: partData.part,
                        title: partData.title,
                        words: partData.words,
                        function: partData.function,
                        goal: partData.goal,
                        conflict: partData.conflict,
                        outcome: partData.outcome,
                    },
                    "overview",
                )}

                {renderJSONSection(
                    "Central Questions",
                    partData.questions,
                    "questions",
                )}

                {renderJSONSection(
                    "Character Development",
                    partData.chars,
                    "chars",
                )}

                {renderJSONSection("Plot Progression", partData.plot, "plot")}

                {renderJSONSection("Thematic Focus", partData.themes, "themes")}

                {renderJSONSection(
                    "Emotional Journey",
                    partData.emotion,
                    "emotion",
                )}

                {renderJSONSection("Part Ending", partData.ending, "ending")}
            </div>
        );
    };

    const renderChapterJSON = () => {
        if (!chapterData) return null;

        return (
            <div className="space-y-3">
                {renderJSONSection(
                    "Chapter Overview",
                    {
                        chap: chapterData.chap,
                        title: chapterData.title,
                        pov: chapterData.pov,
                        words: chapterData.words,
                        goal: chapterData.goal,
                        conflict: chapterData.conflict,
                        outcome: chapterData.outcome,
                    },
                    "overview",
                )}

                {renderJSONSection(
                    "Three-Act Structure",
                    chapterData.acts,
                    "acts",
                )}

                {renderJSONSection(
                    "Character Arcs",
                    chapterData.chars,
                    "chars",
                )}

                {renderJSONSection(
                    "Tension Architecture",
                    chapterData.tension,
                    "tension",
                )}

                {renderJSONSection(
                    "Dual Mandate",
                    chapterData.mandate,
                    "mandate",
                )}

                {renderJSONSection("Forward Hook", chapterData.hook, "hook")}
            </div>
        );
    };

    const renderSceneJSON = () => {
        if (!sceneData) return null;

        return (
            <div className="space-y-3">
                {renderJSONSection(
                    "Scene Overview",
                    {
                        id: sceneData.id,
                        summary: sceneData.summary,
                        time: sceneData.time,
                        place: sceneData.place,
                        pov: sceneData.pov,
                    },
                    "overview",
                )}

                {renderJSONSection(
                    "Characters",
                    sceneData.characters,
                    "characters",
                )}

                {renderJSONSection(
                    "Scene Structure",
                    {
                        goal: sceneData.goal,
                        obstacle: sceneData.obstacle,
                        outcome: sceneData.outcome,
                        shift: sceneData.shift,
                    },
                    "structure",
                )}

                {renderJSONSection(
                    "Scene Beats",
                    {
                        beats: sceneData.beats,
                        leads_to: sceneData.leads_to,
                    },
                    "beats",
                )}

                {renderJSONSection(
                    "Visual Description",
                    {
                        image_prompt: sceneData.image_prompt,
                    },
                    "visual",
                )}
            </div>
        );
    };

    const getLevelIcon = () => {
        switch (currentLevel) {
            case "story":
                return "📖";
            case "part":
                return "📚";
            case "chapter":
                return "📝";
            case "scene":
                return "🎬";
            default:
                return "📄";
        }
    };

    const getLevelTitle = () => {
        switch (currentLevel) {
            case "story":
                return "Story JSON Data";
            case "part":
                return "Story JSON Data"; // Changed from "Part JSON Data" to "Story JSON Data"
            case "chapter":
                return "Chapter JSON Data";
            case "scene":
                return "Scene JSON Data";
            default:
                return "JSON Data";
        }
    };

    const getMainTitle = () => {
        switch (currentLevel) {
            case "part":
                return "Story Data"; // Changed from "JSON Data" to "Story Data"
            case "chapter":
                return "Story & Part Data";
            case "scene":
                return "Story, Part & Chapter Data";
            default:
                return "JSON Data";
        }
    };

    return (
        <Card className="h-fit">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <span className="text-lg font-semibold">
                        {getMainTitle()}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-3">
                    {/* For part view, show story data instead of part data */}
                    {currentLevel === "story" && renderStoryJSON()}
                    {currentLevel === "part" && renderStoryJSON()}
                    {currentLevel === "chapter" && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    📖 Story Data
                                </h3>
                                {renderStoryJSON()}
                            </div>
                            {partData && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        📚 Part Data
                                    </h3>
                                    {renderPartJSON()}
                                </div>
                            )}
                        </div>
                    )}
                    {currentLevel === "scene" && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    📖 Story Data
                                </h3>
                                {renderStoryJSON()}
                            </div>
                            {partData && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        📚 Part Data
                                    </h3>
                                    {renderPartJSON()}
                                </div>
                            )}
                            {chapterData && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        📝 Chapter Data
                                    </h3>
                                    {renderChapterJSON()}
                                </div>
                            )}
                        </div>
                    )}

                    {!storyData && !partData && !chapterData && !sceneData && (
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">
                                No JSON data available for this {currentLevel}
                            </p>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="mt-2"
                            >
                                Generate{" "}
                                {currentLevel.charAt(0).toUpperCase() +
                                    currentLevel.slice(1)}{" "}
                                Data
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
