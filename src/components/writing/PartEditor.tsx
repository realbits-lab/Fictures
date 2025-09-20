"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";
import yaml from "js-yaml";

// Part YAML interface based on part-specification.md
interface PartData {
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
  chars: Record<string, {
    start: string;
    end: string;
    arc: string[];
    conflict: string;
    transforms: string[];
  }>;
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
  };
  engagement: {
    discussions: string[];
    speculation: string[];
    debates: string[];
    feedback: string[];
  };
}

interface PartEditorProps {
  partId?: string;
  partNumber: number;
  initialData?: PartData;
  storyContext?: {
    title: string;
    genre: string;
    themes: string[];
    chars: Record<string, any>;
  };
  hasChanges?: boolean;
  previewData?: PartData;
  onPartUpdate?: (data: PartData) => void;
  onSave?: (data: PartData) => Promise<void>;
  onCancel?: () => void;
}

export function PartEditor({
  partId,
  partNumber,
  initialData,
  storyContext,
  hasChanges: externalHasChanges,
  previewData,
  onPartUpdate,
  onSave,
  onCancel
}: PartEditorProps) {
  const [originalPartData, setOriginalPartData] = useState<PartData>(
    initialData || {
      part: partNumber,
      title: `Part ${partNumber}`,
      words: partNumber === 2 ? 40000 : 20000, // Middle part is typically longer
      function: partNumber === 1 ? "story_setup" : partNumber === 2 ? "story_development" : "story_resolution",
      goal: "",
      conflict: "",
      outcome: "",
      questions: {
        primary: "",
        secondary: ""
      },
      chars: {},
      plot: {
        events: [],
        reveals: [],
        escalation: []
      },
      themes: {
        primary: "",
        elements: [],
        moments: [],
        symbols: []
      },
      emotion: {
        start: "",
        progression: [],
        end: ""
      },
      ending: {
        resolution: [],
        setup: [],
        hooks: [],
        hook_out: ""
      },
      serial: {
        arc: "Setup → Rising Tension → Part Climax → Transition Hook",
        climax_at: "85%",
        satisfaction: [],
        anticipation: []
      },
      engagement: {
        discussions: [],
        speculation: [],
        debates: [],
        feedback: []
      }
    }
  );

  const [partData, setPartData] = useState<PartData>(originalPartData);

  // Use preview data if available, otherwise use regular part data
  const displayData = previewData || partData;

  // Update partData when initialData prop changes (for real-time updates)
  useEffect(() => {
    if (initialData) {
      setPartData(initialData);
      setOriginalPartData(initialData);
    }
  }, [initialData]);

  const [isSaving, setIsSaving] = useState(false);

  // Update part data and notify parent
  const handlePartDataUpdate = (updatedData: PartData) => {
    setPartData(updatedData);
    if (onPartUpdate) {
      onPartUpdate(updatedData);
    }
  };

  const handleSave = async () => {
    if (!onSave || !externalHasChanges) return;
    setIsSaving(true);
    try {
      await onSave(partData);
      // Reset after saving
      setPartData(originalPartData);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const updateField = (path: string[], value: any) => {
    const newData = { ...partData };
    let current: any = newData;

    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }

    current[path[path.length - 1]] = value;
    handlePartDataUpdate(newData);
  };

  return (
    <div className="space-y-6">
      {/* Part Editor Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">📚 {displayData.title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Part {displayData.part} • {displayData.words.toLocaleString()} words • {displayData.function}
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
            {isSaving ? '💾 Saving...' : '💾 Save Changes'}
          </Button>
        </div>
      )}

      {/* Part Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Part Progress Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>📖 Title:</strong> {displayData.title}
            </div>
            <div>
              <strong>📚 Function:</strong> {displayData.function}
            </div>
            <div>
              <strong>📊 Word Count:</strong> {displayData.words.toLocaleString()} words
            </div>
            <div>
              <strong>🎯 Goal:</strong> {displayData.goal || "Not defined"}
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <strong>⚔️ Conflict:</strong> {displayData.conflict || "Not defined"}
            </div>
            <div>
              <strong>🎬 Outcome:</strong> {displayData.outcome || "Not defined"}
            </div>
          </div>

          {/* Questions Overview */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">❓ Key Questions:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  Primary Question
                </h5>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {displayData.questions.primary || "Not defined"}
                </div>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  Secondary Question
                </h5>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {displayData.questions.secondary || "Not defined"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Part Foundation and Development */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>🎯 Part Foundation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Primary Theme:</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {displayData.themes.primary || "Theme not defined"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm"><strong>Function:</strong> {displayData.function}</p>
              <p className="text-sm"><strong>Word Target:</strong> {displayData.words.toLocaleString()}</p>
              <p className="text-sm"><strong>Climax Position:</strong> {displayData.serial.climax_at}</p>
              <p className="text-sm"><strong>Arc Pattern:</strong> {displayData.serial.arc}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📈 Development Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Plot Elements:</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div><strong>Events:</strong> {displayData.plot.events.length} planned</div>
                <div><strong>Reveals:</strong> {displayData.plot.reveals.length} planned</div>
                <div><strong>Escalation:</strong> {displayData.plot.escalation.length} points</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Emotional Journey:</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div><strong>Start:</strong> {displayData.emotion.start || "Not defined"}</div>
                <div><strong>End:</strong> {displayData.emotion.end || "Not defined"}</div>
                <div><strong>Progression:</strong> {displayData.emotion.progression.length} stages</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Part YAML Data */}
      <Card>
        <CardHeader>
          <CardTitle>📄 Part YAML Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded whitespace-pre-wrap">
            <code>
              {yaml.dump({ part: displayData }, { indent: 2 })}
            </code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}