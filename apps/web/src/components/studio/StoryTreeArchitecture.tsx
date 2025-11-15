"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Badge,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui";

interface Scene {
    id: string;
    title: string;
    status: "completed" | "in_progress" | "draft";
    wordCount: number;
    goal: string;
    conflict: string;
    outcome: string;
}

interface Chapter {
    id: string;
    title: string;
    orderIndex: number;
    status: string;
    wordCount: number;
    targetWordCount: number;
    scenes?: Scene[];
}

interface Part {
    id: string;
    title: string;
    orderIndex: number;
    status?: string;
    chapters: Chapter[];
}

interface Story {
    id: string;
    title: string;
    genre: string;
    status: string;
    parts: Part[];
    chapters: Chapter[]; // Chapters not in parts
}

export type EditorLevel = "story" | "part" | "chapter" | "scene";

interface Selection {
    level: EditorLevel;
    itemId?: string;
    storyId: string;
    partId?: string;
    chapterId?: string;
    sceneId?: string;
}

interface StoryTreeArchitectureProps {
    story: Story;
    currentChapterId?: string;
    currentSceneId?: string;
    onSelectionChange?: (selection: Selection) => void;
    currentSelection?: Selection;
}

export function StoryTreeArchitecture({
    story,
    currentChapterId,
    currentSceneId,
    onSelectionChange,
    currentSelection,
}: StoryTreeArchitectureProps) {
    const pathname = usePathname();
    const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
        new Set(),
    );

    // Auto-expand parts and chapters based on current selection
    useEffect(() => {
        if (currentSelection) {
            const newExpandedParts = new Set(expandedParts);
            const newExpandedChapters = new Set(expandedChapters);

            // If viewing a scene, expand its chapter and part
            if (
                currentSelection.level === "scene" &&
                currentSelection.chapterId
            ) {
                newExpandedChapters.add(currentSelection.chapterId);

                // Find and expand the part containing this chapter
                for (const part of story.parts) {
                    if (
                        part.chapters.some(
                            (ch) => ch.id === currentSelection.chapterId,
                        )
                    ) {
                        newExpandedParts.add(part.id);
                        break;
                    }
                }
            }

            // If viewing a chapter, expand its part
            if (
                currentSelection.level === "chapter" &&
                currentSelection.chapterId
            ) {
                for (const part of story.parts) {
                    if (
                        part.chapters.some(
                            (ch) => ch.id === currentSelection.chapterId,
                        )
                    ) {
                        newExpandedParts.add(part.id);
                        break;
                    }
                }
            }

            // If viewing a part, expand it
            if (currentSelection.level === "part" && currentSelection.partId) {
                newExpandedParts.add(currentSelection.partId);
            }

            setExpandedParts(newExpandedParts);
            setExpandedChapters(newExpandedChapters);
        }
    }, [currentSelection, story.parts, expandedParts, expandedChapters]);

    // Unified status icons across all levels (parts, chapters, scenes)
    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return "✅";
            case "published":
                return "🚀";
            case "in_progress":
                return "🔄";
            case "draft":
                return "📝";
            default:
                return "📝";
        }
    };

    const getProgressPercentage = (
        wordCount: number,
        targetWordCount: number,
        _chapter?: Chapter,
    ) => {
        // Since scenes no longer have status, use word count progress
        // Fallback to word count progress
        if (targetWordCount === 0) return 0;
        return Math.round((wordCount / targetWordCount) * 100);
    };

    const isCurrentChapter = (chapterId: string) => {
        return (
            pathname === `/studio/edit/${chapterId}` ||
            currentChapterId === chapterId
        );
    };

    const isCurrentScene = (sceneId: string) => {
        return (
            currentSceneId === sceneId || currentSelection?.sceneId === sceneId
        );
    };

    const handleStoryClick = () => {
        onSelectionChange?.({
            level: "story",
            storyId: story.id,
        });
    };

    const handlePartClick = (partId: string) => {
        onSelectionChange?.({
            level: "part",
            storyId: story.id,
            partId: partId,
        });
    };

    const handleChapterClick = (chapterId: string, partId?: string) => {
        onSelectionChange?.({
            level: "chapter",
            storyId: story.id,
            partId: partId,
            chapterId: chapterId,
        });
    };

    const handleSceneClick = (
        sceneId: string,
        chapterId: string,
        partId?: string,
    ) => {
        onSelectionChange?.({
            level: "scene",
            storyId: story.id,
            partId: partId,
            chapterId: chapterId,
            sceneId: sceneId,
        });
    };

    const isSelectedLevel = (level: EditorLevel, itemId?: string) => {
        if (!currentSelection || currentSelection.level !== level) return false;

        switch (level) {
            case "story":
                return currentSelection.storyId === story.id;
            case "part":
                return currentSelection.partId === itemId;
            case "chapter":
                return currentSelection.chapterId === itemId;
            case "scene":
                return currentSelection.sceneId === itemId;
            default:
                return false;
        }
    };

    const togglePart = (partId: string) => {
        setExpandedParts((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(partId)) {
                newSet.delete(partId);
            } else {
                newSet.add(partId);
            }
            return newSet;
        });
    };

    const toggleChapter = (chapterId: string) => {
        setExpandedChapters((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(chapterId)) {
                newSet.delete(chapterId);
            } else {
                newSet.add(chapterId);
            }
            return newSet;
        });
    };

    return (
        <Card className="h-fit">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <span>🏗️</span>
                    <button
                        onClick={handleStoryClick}
                        className={`flex-1 min-w-0 text-left p-2 rounded transition-colors ${
                            isSelectedLevel("story")
                                ? "bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                    >
                        <div className="font-semibold truncate">
                            {story.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Badge variant="secondary">{story.genre}</Badge>
                            <Badge
                                variant={
                                    story.status === "publishing"
                                        ? "default"
                                        : "secondary"
                                }
                            >
                                {story.status}
                            </Badge>
                        </div>
                    </button>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-2">
                    {/* Story Level */}
                    <div className="border-l-2 border-blue-500 pl-3">
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                            📖 Story Architecture
                        </div>

                        {/* Parts with Chapters and Scenes */}
                        {story.parts.map((part) => (
                            <div
                                key={part.id}
                                className="border-l-2 border-green-400 pl-3 mb-3"
                            >
                                <div className="mb-2">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => togglePart(part.id)}
                                            className="flex items-center gap-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <svg
                                                className={`w-3 h-3 text-gray-400 transition-transform ${
                                                    expandedParts.has(part.id)
                                                        ? "rotate-90"
                                                        : ""
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
                                        </button>
                                        <button
                                            onClick={() =>
                                                handlePartClick(part.id)
                                            }
                                            className={`flex-1 flex items-center justify-between text-left p-2 rounded transition-colors ${
                                                isSelectedLevel("part", part.id)
                                                    ? "bg-green-100 text-green-900 dark:bg-green-900/20 dark:text-green-100"
                                                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-green-600 dark:text-green-400 truncate">
                                                    {getStatusIcon(
                                                        part.status || "draft",
                                                    )}{" "}
                                                    Part {part.orderIndex}:{" "}
                                                    {part.title}
                                                </span>
                                                <Badge variant="secondary">
                                                    {part.chapters.length}
                                                </Badge>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {expandedParts.has(part.id) && (
                                    <div className="space-y-2">
                                        {part.chapters.map(
                                            (chapter, chapterIndex) => {
                                                // Calculate global chapter number
                                                const globalChapterNumber =
                                                    story.parts
                                                        .slice(
                                                            0,
                                                            story.parts.findIndex(
                                                                (p) =>
                                                                    p.id ===
                                                                    part.id,
                                                            ),
                                                        )
                                                        .reduce(
                                                            (total, prevPart) =>
                                                                total +
                                                                (prevPart
                                                                    .chapters
                                                                    ?.length ||
                                                                    0),
                                                            0,
                                                        ) +
                                                    chapterIndex +
                                                    1;

                                                return (
                                                    <div
                                                        key={chapter.id}
                                                        className="border-l-2 border-orange-400 pl-3"
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-1 flex-1">
                                                                <button
                                                                    onClick={() =>
                                                                        toggleChapter(
                                                                            chapter.id,
                                                                        )
                                                                    }
                                                                    className="flex items-center gap-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                >
                                                                    <svg
                                                                        className={`w-3 h-3 text-gray-400 transition-transform ${
                                                                            expandedChapters.has(
                                                                                chapter.id,
                                                                            )
                                                                                ? "rotate-90"
                                                                                : ""
                                                                        }`}
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M9 5l7 7-7 7"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleChapterClick(
                                                                            chapter.id,
                                                                            part.id,
                                                                        )
                                                                    }
                                                                    className={`flex items-center gap-2 flex-1 text-left p-1 rounded transition-colors ${
                                                                        isSelectedLevel(
                                                                            "chapter",
                                                                            chapter.id,
                                                                        )
                                                                            ? "bg-orange-100 text-orange-900 dark:bg-orange-900/20 dark:text-orange-100"
                                                                            : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                    }`}
                                                                >
                                                                    <span>
                                                                        {getStatusIcon(
                                                                            chapter.status,
                                                                        )}
                                                                    </span>
                                                                    <span className="text-sm text-orange-600 dark:text-orange-400 truncate">
                                                                        Ch{" "}
                                                                        {
                                                                            globalChapterNumber
                                                                        }
                                                                        :{" "}
                                                                        {
                                                                            chapter.title
                                                                        }
                                                                    </span>
                                                                </button>
                                                            </div>
                                                            <Link
                                                                href={`/studio/edit/${chapter.id}`}
                                                                className={`px-2 py-1 rounded text-xs transition-colors ${
                                                                    isCurrentChapter(
                                                                        chapter.id,
                                                                    )
                                                                        ? "bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100 font-medium"
                                                                        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                }`}
                                                            >
                                                                {getProgressPercentage(
                                                                    chapter.wordCount,
                                                                    chapter.targetWordCount,
                                                                    chapter,
                                                                )}
                                                                %
                                                            </Link>
                                                        </div>

                                                        {expandedChapters.has(
                                                            chapter.id,
                                                        ) &&
                                                            chapter.scenes && (
                                                                <div className="space-y-1 mt-2">
                                                                    {chapter.scenes.map(
                                                                        (
                                                                            scene,
                                                                            sceneIndex,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    scene.id
                                                                                }
                                                                                className="border-l-2 border-purple-400 pl-3"
                                                                            >
                                                                                <button
                                                                                    onClick={() =>
                                                                                        handleSceneClick(
                                                                                            scene.id,
                                                                                            chapter.id,
                                                                                            part.id,
                                                                                        )
                                                                                    }
                                                                                    className={`w-full flex items-center gap-2 p-2 rounded text-xs transition-colors ${
                                                                                        isSelectedLevel(
                                                                                            "scene",
                                                                                            scene.id,
                                                                                        )
                                                                                            ? "bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-100"
                                                                                            : isCurrentScene(
                                                                                                    scene.id,
                                                                                                )
                                                                                              ? "bg-purple-50 text-purple-800 dark:bg-purple-900/10 dark:text-purple-200"
                                                                                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                                    }`}
                                                                                >
                                                                                    <span className="text-purple-600 dark:text-purple-400 truncate">
                                                                                        Scene{" "}
                                                                                        {sceneIndex +
                                                                                            1}
                                                                                        :{" "}
                                                                                        {
                                                                                            scene.title
                                                                                        }
                                                                                    </span>
                                                                                    <span className="text-gray-500">
                                                                                        (
                                                                                        {
                                                                                            scene.wordCount
                                                                                        }
                                                                                        w)
                                                                                    </span>
                                                                                </button>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Standalone Chapters (not in parts) */}
                        {story.chapters.length > 0 && (
                            <div className="border-l-2 border-orange-400 pl-3">
                                <div className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
                                    📄 Standalone Chapters
                                </div>
                                {story.chapters.map((chapter, chapterIndex) => {
                                    // Calculate global chapter number (after all parts)
                                    const totalPartsChapters =
                                        story.parts.reduce(
                                            (total, part) =>
                                                total +
                                                (part.chapters?.length || 0),
                                            0,
                                        );
                                    const globalChapterNumber =
                                        totalPartsChapters + chapterIndex + 1;

                                    return (
                                        <div key={chapter.id} className="mb-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1 flex-1">
                                                    <button
                                                        onClick={() =>
                                                            toggleChapter(
                                                                chapter.id,
                                                            )
                                                        }
                                                        className="flex items-center gap-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    >
                                                        <svg
                                                            className={`w-3 h-3 text-gray-400 transition-transform ${
                                                                expandedChapters.has(
                                                                    chapter.id,
                                                                )
                                                                    ? "rotate-90"
                                                                    : ""
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
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleChapterClick(
                                                                chapter.id,
                                                            )
                                                        }
                                                        className={`flex items-center gap-2 flex-1 text-left p-1 rounded transition-colors ${
                                                            isSelectedLevel(
                                                                "chapter",
                                                                chapter.id,
                                                            )
                                                                ? "bg-orange-100 text-orange-900 dark:bg-orange-900/20 dark:text-orange-100"
                                                                : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        }`}
                                                    >
                                                        <span>
                                                            {getStatusIcon(
                                                                chapter.status,
                                                            )}
                                                        </span>
                                                        <span className="text-sm truncate">
                                                            Ch{" "}
                                                            {
                                                                globalChapterNumber
                                                            }
                                                            : {chapter.title}
                                                        </span>
                                                    </button>
                                                </div>
                                                <Link
                                                    href={`/studio/edit/${chapter.id}`}
                                                    className={`px-2 py-1 rounded text-xs transition-colors ${
                                                        isCurrentChapter(
                                                            chapter.id,
                                                        )
                                                            ? "bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100 font-medium"
                                                            : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    }`}
                                                >
                                                    {getProgressPercentage(
                                                        chapter.wordCount,
                                                        chapter.targetWordCount,
                                                        chapter,
                                                    )}
                                                    %
                                                </Link>
                                            </div>

                                            {expandedChapters.has(chapter.id) &&
                                                chapter.scenes && (
                                                    <div className="space-y-1 mt-2 ml-4">
                                                        {chapter.scenes.map(
                                                            (
                                                                scene,
                                                                sceneIndex,
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        scene.id
                                                                    }
                                                                    className="border-l-2 border-purple-400 pl-3"
                                                                >
                                                                    <button
                                                                        onClick={() =>
                                                                            handleSceneClick(
                                                                                scene.id,
                                                                                chapter.id,
                                                                            )
                                                                        }
                                                                        className={`w-full flex items-center gap-2 p-2 rounded text-xs transition-colors ${
                                                                            isSelectedLevel(
                                                                                "scene",
                                                                                scene.id,
                                                                            )
                                                                                ? "bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-100"
                                                                                : isCurrentScene(
                                                                                        scene.id,
                                                                                    )
                                                                                  ? "bg-purple-50 text-purple-800 dark:bg-purple-900/10 dark:text-purple-200"
                                                                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                        }`}
                                                                    >
                                                                        <span>
                                                                            {getStatusIcon(
                                                                                scene.status,
                                                                            )}
                                                                        </span>
                                                                        <span className="text-purple-600 dark:text-purple-400 truncate">
                                                                            Scene{" "}
                                                                            {sceneIndex +
                                                                                1}
                                                                            :{" "}
                                                                            {
                                                                                scene.title
                                                                            }
                                                                        </span>
                                                                        <span className="text-gray-500">
                                                                            (
                                                                            {
                                                                                scene.wordCount
                                                                            }
                                                                            w)
                                                                        </span>
                                                                    </button>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
