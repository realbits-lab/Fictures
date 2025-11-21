"use client";

import { useState } from "react";
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui";

// Simple SVG icon components
const ChevronRight = ({ size = 16 }: { size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path d="M9 18l6-6-6-6" />
    </svg>
);

const ChevronDown = ({ size = 16 }: { size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path d="M6 9l6 6 6-6" />
    </svg>
);

const BookOpen = ({ size = 16 }: { size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
);

const Lightbulb = ({ size = 16 }: { size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path d="M9 21h6" />
        <path d="M12 3C8.686 3 6 5.686 6 9c0 1.657.672 3.157 1.757 4.243C8.93 14.415 9 15.207 9 16v1a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-1c0-.793.07-1.585 1.243-2.757C17.328 12.157 18 10.657 18 9c0-3.314-2.686-6-6-6Z" />
        <path d="M12 3v1" />
        <path d="M12 20v1" />
        <path d="M4.22 4.22l.707.707" />
        <path d="M18.36 18.36l.707.707" />
        <path d="M1 12h1" />
        <path d="M22 12h1" />
        <path d="M4.22 19.78l.707-.707" />
        <path d="M18.36 5.64l.707-.707" />
    </svg>
);

const Clock = ({ size = 16 }: { size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
    >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12,6 12,12 16,14" />
    </svg>
);

const Eye = ({ size = 16 }: { size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

interface WritingGuidelinesProps {
    currentLevel?: "story" | "part" | "chapter" | "scene";
}

export function WritingGuidelines({
    currentLevel = "scene",
}: WritingGuidelinesProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(["mru"]),
    );

    const toggleSection = (sectionId: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId);
        } else {
            newExpanded.add(sectionId);
        }
        setExpandedSections(newExpanded);
    };

    const guidelines = {
        mru: {
            title: "MRU (Motivation-Reaction Unit)",
            icon: <BookOpen size={14} />,
            content: (
                <div className="space-y-3 text-sm">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                            Structure:
                        </h4>
                        <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300">
                            <li>
                                <strong>Motivation:</strong> External
                                stimulus/event
                            </li>
                            <li>
                                <strong>Reaction:</strong> Character&apos;s
                                internal response
                            </li>
                            <li>
                                <strong>Action:</strong> Character&apos;s
                                external response
                            </li>
                        </ol>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                        <strong>Example:</strong> Door slams (motivation) → John
                        startles (reaction) → He reaches for his weapon (action)
                    </div>
                </div>
            ),
        },
        scene: {
            title: "Scene Structure",
            icon: <Lightbulb size={14} />,
            content: (
                <div className="space-y-3 text-sm">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-700">
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                            Key Elements:
                        </h4>
                        <ul className="space-y-1 text-green-700 dark:text-green-300">
                            <li>
                                <strong>Goal:</strong> What character wants
                            </li>
                            <li>
                                <strong>Conflict:</strong> Opposition/obstacle
                            </li>
                            <li>
                                <strong>Disaster:</strong> Failure or
                                complication
                            </li>
                            <li>
                                <strong>Reaction:</strong> Emotional response
                            </li>
                            <li>
                                <strong>Dilemma:</strong> Difficult choice
                            </li>
                            <li>
                                <strong>Decision:</strong> Path forward
                            </li>
                        </ul>
                    </div>
                </div>
            ),
        },
        pacing: {
            title: "Pacing Control",
            icon: <Clock size={14} />,
            content: (
                <div className="space-y-3 text-sm">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-700">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                            Speed Techniques:
                        </h4>
                        <div className="text-yellow-700 dark:text-yellow-300 space-y-2">
                            <div>
                                <strong>Fast:</strong> Short sentences,
                                dialogue, action verbs, less description
                            </div>
                            <div>
                                <strong>Slow:</strong> Longer sentences,
                                internal thoughts, detailed description,
                                reflection
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        showDontTell: {
            title: "Show Don't Tell",
            icon: <Eye size={14} />,
            content: (
                <div className="space-y-3 text-sm">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
                        <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                            Techniques:
                        </h4>
                        <div className="text-purple-700 dark:text-purple-300 space-y-2 text-xs">
                            <div>
                                <strong>Instead of:</strong> &quot;He was
                                angry&quot;
                                <br />
                                <strong>Show:</strong> &quot;His jaw tightened
                                as he slammed the door&quot;
                            </div>
                            <div>
                                <strong>Instead of:</strong> &quot;She was
                                nervous&quot;
                                <br />
                                <strong>Show:</strong> &quot;Her fingers drummed
                                against her thigh&quot;
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
    };

    if (currentLevel !== "scene") {
        return null; // Only show for scene editing
    }

    return (
        <Card className="h-fit">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen size={16} />
                    Writing Guidelines
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-2">
                    {Object.entries(guidelines).map(([sectionId, section]) => {
                        const isExpanded = expandedSections.has(sectionId);

                        return (
                            <div key={sectionId} className="border rounded-lg">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-between p-3 h-auto text-left"
                                    onClick={() => toggleSection(sectionId)}
                                >
                                    <div className="flex items-center gap-2">
                                        {section.icon}
                                        <span className="text-xs font-medium">
                                            {section.title}
                                        </span>
                                    </div>
                                    {isExpanded ? (
                                        <ChevronDown size={12} />
                                    ) : (
                                        <ChevronRight size={12} />
                                    )}
                                </Button>

                                {isExpanded && (
                                    <div className="px-3 pb-3">
                                        {section.content}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
