"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";

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

  // Framework Element 1: Central Questions
  const renderCentralQuestions = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ❓ Central Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div><strong>Primary:</strong> {displayData.questions.primary || 'Not set'}</div>
          <div><strong>Secondary:</strong> {displayData.questions.secondary || 'Not set'}</div>
        </div>
      </CardContent>
    </Card>
  );

  // Framework Element 2: Character Development
  const renderCharacterDevelopment = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎭 Character Development
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {Object.entries(displayData.chars).map(([name, char]) => (
            <div key={name} className="text-sm border-l-2 border-blue-200 pl-3">
              <div className="font-medium text-blue-700">{name}:</div>
              <div className="ml-2 space-y-1 text-gray-600">
                <div><strong>Journey:</strong> {char.start} → {char.end}</div>
                {char.arc && Array.isArray(char.arc) && char.arc.length > 0 && (
                  <div><strong>Arc:</strong> {char.arc.join(' → ')}</div>
                )}
                {char.arc && typeof char.arc === 'string' && (
                  <div><strong>Arc:</strong> {char.arc}</div>
                )}
                {char.conflict && (
                  <div><strong>Conflict:</strong> {char.conflict}</div>
                )}
                {char.transforms && char.transforms.length > 0 && (
                  <div><strong>Transforms:</strong> {char.transforms.join(', ')}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Framework Element 3: Plot Development
  const renderPlotDevelopment = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📈 Plot Development
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 text-sm">
          <div>
            <strong>Events:</strong> {displayData.plot.events.join(', ') || 'None set'}
          </div>
          <div>
            <strong>Reveals:</strong> {displayData.plot.reveals.join(', ') || 'None set'}
          </div>
          <div>
            <strong>Escalation:</strong> {displayData.plot.escalation.join(', ') || 'None set'}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Framework Element 5: Emotional Journey
  const renderEmotionalJourney = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💭 Emotional Journey
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div><strong>Journey:</strong> {displayData.emotion.start} → {displayData.emotion.progression.join(' → ')} → {displayData.emotion.end}</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Part Editor Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">📚 {displayData.title}</h2>
          <p className="text-sm text-gray-600">
            Part {displayData.part} • {displayData.words.toLocaleString()} words • {displayData.function}
          </p>
        </div>
        {externalHasChanges && (
          <div className="flex gap-2">
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
      </div>

      {/* Part Foundation */}
      <Card>
        <CardHeader>
          <CardTitle>
            🎯 Part Foundation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div><strong>Goal:</strong> {displayData.goal || 'Not set'}</div>
            <div><strong>Conflict:</strong> {displayData.conflict || 'Not set'}</div>
            <div><strong>Outcome:</strong> {displayData.outcome || 'Not set'}</div>
          </div>
        </CardContent>
      </Card>

      {/* Part Planning Framework Elements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {renderCentralQuestions()}
          {renderCharacterDevelopment()}
        </div>
        <div className="space-y-6">
          {renderPlotDevelopment()}
          {renderEmotionalJourney()}
        </div>
      </div>

      {/* YAML Preview */}
      <Card>
        <CardHeader>
          <CardTitle>📄 Part YAML Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-auto max-h-64">
            <code>
{`part:
  part: ${displayData.part}
  title: "${displayData.title}"
  words: ${displayData.words}
  function: "${displayData.function}"

  # Universal pattern
  goal: "${displayData.goal}"
  conflict: "${displayData.conflict}"
  outcome: "${displayData.outcome}"

  # Central questions
  questions:
    primary: "${displayData.questions.primary}"
    secondary: "${displayData.questions.secondary}"

  # Characters (${Object.keys(displayData.chars).length})
  chars:`}
{Object.entries(displayData.chars).map(([name, char]) =>
`    ${name}:
      start: "${char.start}"
      end: "${char.end}"
      arc: [${Array.isArray(char.arc) ? char.arc.map(step => `"${step}"`).join(', ') : `"${char.arc || 'character development'}"`}]`
).join('\n')}
{`

  # Plot development
  plot:
    events: [${displayData.plot.events.map(e => `"${e}"`).join(', ')}]
    reveals: [${displayData.plot.reveals.map(r => `"${r}"`).join(', ')}]
    escalation: [${displayData.plot.escalation.map(e => `"${e}"`).join(', ')}]

  # Emotional journey
  emotion:
    start: "${displayData.emotion.start}"
    progression: [${displayData.emotion.progression.map(p => `"${p}"`).join(', ')}]
    end: "${displayData.emotion.end}"`}
            </code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}