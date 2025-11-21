"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

// Story YAML interface based on story-specification.md
interface StoryData {
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

interface Character {
    id: string;
    name: string;
    role?: string;
    description?: string;
    personality?: string;
    background?: string;
    appearance?: string;
    motivations?: string;
    flaws?: string;
    strengths?: string;
    relationships?: string;
    arc?: string;
    dialogue_style?: string;
    secrets?: string;
    goals?: string;
    conflicts?: string;
    imageUrl?: string;
    isMain?: boolean;
    createdAt: string;
    updatedAt: string;
}

interface Place {
    id: string;
    name: string;
    storyId: string;
    isMain?: boolean;
    content?: string;
    createdAt: string;
    updatedAt: string;
}

interface StoryEditorProps {
    storyId?: string;
    storyData?: StoryData;
    characters?: Character[];
    places?: Place[];
    hasChanges?: boolean;
    onStoryUpdate?: (data: StoryData) => void;
    onSave?: (data: StoryData) => Promise<void>;
    onCancel?: () => void;
    onGenerate?: (data: StoryData) => Promise<void>;
}

export function StoryEditor({
    storyId,
    storyData: externalStoryData,
    characters,
    places,
    hasChanges: externalHasChanges,
    onStoryUpdate,
    onSave,
    onCancel,
    onGenerate,
}: StoryEditorProps) {
    const [originalStoryData, setOriginalStoryData] = useState<StoryData>(
        externalStoryData || {
            title: "",
            genre: "urban_fantasy",
            words: 80000,
            question: "",
            goal: "",
            conflict: "",
            outcome: "",
            chars: {
                protagonist: {
                    role: "protag",
                    arc: "denial→acceptance",
                    flaw: "overprotective",
                },
            },
            themes: ["responsibility_for_power", "love_vs_control"],
            structure: {
                type: "3_part",
                parts: ["setup", "confrontation", "resolution"],
                dist: [25, 50, 25],
            },
            setting: {
                primary: ["main_location"],
                secondary: ["secondary_location"],
            },
            parts: [
                {
                    part: 1,
                    goal: "Protagonist accepts reality",
                    conflict: "Denial vs evidence",
                    outcome: "Reluctant commitment",
                    tension: "denial vs acceptance",
                },
                {
                    part: 2,
                    goal: "Master new abilities",
                    conflict: "Growing power vs corruption risk",
                    outcome: "Power embrace despite dangers",
                    tension: "power vs integrity",
                },
                {
                    part: 3,
                    goal: "Final confrontation",
                    conflict: "Ultimate power vs moral cost",
                    outcome: "Victory through growth",
                    tension: "salvation vs corruption",
                },
            ],
            serial: {
                schedule: "weekly",
                duration: "18_months",
                chapter_words: 4000,
                breaks: ["part1_end", "part2_end"],
                buffer: "4_chapters_ahead",
            },
            hooks: {
                overarching: ["main_mystery", "protagonist_fate"],
                mysteries: ["hidden_truth", "character_secret"],
                part_endings: ["revelation", "cliffhanger"],
            },
        },
    );
    const [storyData, setStoryData] = useState<StoryData>(originalStoryData);

    // Use external story data when available
    useEffect(() => {
        if (externalStoryData) {
            setOriginalStoryData(externalStoryData);
            setStoryData(externalStoryData);
        }
    }, [externalStoryData]);

    const [_isEditing, _setIsEditing] = useState(false);
    const [_editingSection, _setEditingSection] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [_isGenerating, setIsGenerating] = useState(false);

    // State for collapsible sections
    const [_charactersCollapsed, _setCharactersCollapsed] = useState(true);
    const [_placesCollapsed, _setPlacesCollapsed] = useState(true);
    const [_collapsedPlaceCards, setCollapsedPlaceCards] = useState<
        Record<string, boolean>
    >({});
    const [_collapsedCharacterCards, setCollapsedCharacterCards] = useState<
        Record<string, boolean>
    >({});

    // Helper function to toggle individual place card collapse
    const _togglePlaceCard = (placeId: string) => {
        setCollapsedPlaceCards((prev) => ({
            ...prev,
            [placeId]: !prev[placeId],
        }));
    };

    // Helper function to toggle individual character card collapse
    const _toggleCharacterCard = (characterId: string) => {
        setCollapsedCharacterCards((prev) => ({
            ...prev,
            [characterId]: !prev[characterId],
        }));
    };

    const handleSave = async () => {
        if (!onSave || !externalHasChanges) return;
        setIsSaving(true);
        try {
            await onSave(storyData);
            // Reset after saving
            setStoryData(originalStoryData);
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
    };

    const _handleGenerate = async () => {
        if (!onGenerate) return;
        setIsGenerating(true);
        try {
            await onGenerate(storyData);
        } catch (error) {
            console.error("Generation failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const _updateField = (path: string[], value: any) => {
        setStoryData((prev) => {
            const newData = { ...prev };
            let current: any = newData;

            for (let i = 0; i < path.length - 1; i++) {
                if (!current[path[i]]) {
                    current[path[i]] = {};
                }
                current = current[path[i]];
            }

            current[path[path.length - 1]] = value;
            return newData;
        });
    };

    const _handleStoryUpdate = (updatedData: StoryData) => {
        setStoryData(updatedData);
        if (onStoryUpdate) {
            onStoryUpdate(updatedData);
        }
    };

    return (
        <div className="space-y-6">
            {/* Story Editor Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">📖 Story Development</h2>
                    <p className="text-sm text-gray-600">
                        Define the overall narrative structure and themes
                    </p>
                </div>
            </div>

            {/* Cancel/Save Buttons Above YAML */}
            {externalHasChanges && (
                <div className="flex justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={handleCancel}
                        className="whitespace-nowrap min-w-fit px-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        size="lg"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="whitespace-nowrap min-w-fit px-6"
                    >
                        {isSaving ? "💾 Saving..." : "💾 Save Changes"}
                    </Button>
                </div>
            )}
        </div>
    );
}
