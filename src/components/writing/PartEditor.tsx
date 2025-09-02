"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";

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
  onSave?: (data: PartData) => Promise<void>;
  onGenerate?: (data: PartData) => Promise<void>;
}

export function PartEditor({ 
  partId, 
  partNumber, 
  initialData, 
  storyContext, 
  onSave, 
  onGenerate 
}: PartEditorProps) {
  const [partData, setPartData] = useState<PartData>(
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

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(partData);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!onGenerate) return;
    setIsGenerating(true);
    try {
      await onGenerate(partData);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateField = (path: string[], value: any) => {
    setPartData(prev => {
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

  const updateArrayField = (path: string[], index: number, value: string) => {
    const currentArray = path.reduce((obj, key) => obj[key], partData) as string[];
    const newArray = [...currentArray];
    newArray[index] = value;
    updateField(path, newArray);
  };

  const addArrayItem = (path: string[], defaultValue = "") => {
    const currentArray = path.reduce((obj, key) => obj[key], partData) as string[];
    updateField(path, [...currentArray, defaultValue]);
  };

  const removeArrayItem = (path: string[], index: number) => {
    const currentArray = path.reduce((obj, key) => obj[key], partData) as string[];
    const newArray = currentArray.filter((_, i) => i !== index);
    updateField(path, newArray);
  };

  // Framework Element 1: Central Questions
  const renderCentralQuestions = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ❓ Central Questions (Framework Element 1)
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setEditingSection(editingSection === 'questions' ? null : 'questions')}
          >
            {editingSection === 'questions' ? '✓' : '✏️'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editingSection === 'questions' ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Primary Question</label>
              <textarea
                value={partData.questions.primary}
                onChange={(e) => updateField(['questions', 'primary'], e.target.value)}
                className="w-full p-2 border rounded"
                rows={2}
                placeholder="What major question does this part explore or answer?"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Secondary Question</label>
              <textarea
                value={partData.questions.secondary}
                onChange={(e) => updateField(['questions', 'secondary'], e.target.value)}
                className="w-full p-2 border rounded"
                rows={2}
                placeholder="Supporting question that drives subplot or character development"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div><strong>Primary:</strong> {partData.questions.primary || 'Not set'}</div>
            <div><strong>Secondary:</strong> {partData.questions.secondary || 'Not set'}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Framework Element 2: Character Development
  const renderCharacterDevelopment = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎭 Character Development (Framework Element 2)
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setEditingSection(editingSection === 'chars' ? null : 'chars')}
          >
            {editingSection === 'chars' ? '✓' : '✏️'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editingSection === 'chars' ? (
          <div className="space-y-4">
            {Object.entries(partData.chars).map(([name, char]) => (
              <div key={name} className="border p-3 rounded">
                <div className="font-medium mb-2">{name}</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="text-xs font-medium">Start State</label>
                    <input
                      type="text"
                      value={char.start}
                      onChange={(e) => updateField(['chars', name, 'start'], e.target.value)}
                      className="w-full p-1 border rounded"
                      placeholder="denial_normalcy"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">End State</label>
                    <input
                      type="text"
                      value={char.end}
                      onChange={(e) => updateField(['chars', name, 'end'], e.target.value)}
                      className="w-full p-1 border rounded"
                      placeholder="reluctant_acceptance"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium">Character Arc Steps</label>
                    <div className="space-y-1">
                      {char.arc.map((step, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={step}
                            onChange={(e) => updateArrayField(['chars', name, 'arc'], index, e.target.value)}
                            className="flex-1 p-1 border rounded text-xs"
                            placeholder="Arc step"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeArrayItem(['chars', name, 'arc'], index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addArrayItem(['chars', name, 'arc'], "")}
                      >
                        + Add Arc Step
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              onClick={() => {
                if (storyContext?.chars) {
                  const availableChars = Object.keys(storyContext.chars).filter(
                    name => !partData.chars[name]
                  );
                  if (availableChars.length > 0) {
                    const charName = availableChars[0];
                    updateField(['chars', charName], {
                      start: "",
                      end: "",
                      arc: [""],
                      conflict: "",
                      transforms: [""]
                    });
                  }
                }
              }}
            >
              + Add Character Development
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(partData.chars).map(([name, char]) => (
              <div key={name} className="text-sm">
                <div className="font-medium">{name}:</div>
                <div className="ml-2 text-gray-600">{char.start} → {char.end}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Framework Element 3: Plot Development  
  const renderPlotDevelopment = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📈 Plot Development (Framework Element 3)
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setEditingSection(editingSection === 'plot' ? null : 'plot')}
          >
            {editingSection === 'plot' ? '✓' : '✏️'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editingSection === 'plot' ? (
          <div className="space-y-4">
            {(['events', 'reveals', 'escalation'] as const).map(category => (
              <div key={category}>
                <label className="text-sm font-medium capitalize">{category}</label>
                <div className="space-y-1 mt-1">
                  {partData.plot[category].map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateArrayField(['plot', category], index, e.target.value)}
                        className="flex-1 p-1 border rounded text-sm"
                        placeholder={`${category} item`}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArrayItem(['plot', category], index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem(['plot', category])}
                  >
                    + Add {category.slice(0, -1)}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <strong>Events:</strong> {partData.plot.events.join(', ') || 'None set'}
            </div>
            <div>
              <strong>Reveals:</strong> {partData.plot.reveals.join(', ') || 'None set'}
            </div>
            <div>
              <strong>Escalation:</strong> {partData.plot.escalation.join(', ') || 'None set'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Framework Element 5: Emotional Journey
  const renderEmotionalJourney = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💭 Emotional Journey (Framework Element 5)
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setEditingSection(editingSection === 'emotion' ? null : 'emotion')}
          >
            {editingSection === 'emotion' ? '✓' : '✏️'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editingSection === 'emotion' ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Start Emotion</label>
              <input
                type="text"
                value={partData.emotion.start}
                onChange={(e) => updateField(['emotion', 'start'], e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="casual_family_concern"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Emotional Progression</label>
              <div className="space-y-1">
                {partData.emotion.progression.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => updateArrayField(['emotion', 'progression'], index, e.target.value)}
                      className="flex-1 p-1 border rounded text-sm"
                      placeholder="Emotional step"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(['emotion', 'progression'], index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem(['emotion', 'progression'])}
                >
                  + Add Step
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">End Emotion</label>
              <input
                type="text"
                value={partData.emotion.end}
                onChange={(e) => updateField(['emotion', 'end'], e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="grim_commitment"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div><strong>Journey:</strong> {partData.emotion.start} → {partData.emotion.progression.join(' → ')} → {partData.emotion.end}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Part Editor Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">📚 Part {partData.part} Development</h2>
          <p className="text-sm text-gray-600">
            {partData.title} • {partData.words.toLocaleString()} words • {partData.function}
          </p>
          {storyContext && (
            <Badge variant="outline" className="mt-1">{storyContext.title}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? '💾 Saving...' : '💾 Save Part'}
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
          >
            {isGenerating ? '⚡ Generating...' : '⚡ Generate Chapters'}
          </Button>
        </div>
      </div>

      {/* Part Foundation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Part Foundation
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setEditingSection(editingSection === 'foundation' ? null : 'foundation')}
            >
              {editingSection === 'foundation' ? '✓' : '✏️'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editingSection === 'foundation' ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={partData.title}
                  onChange={(e) => updateField(['title'], e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Goal</label>
                  <textarea
                    value={partData.goal}
                    onChange={(e) => updateField(['goal'], e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Conflict</label>
                  <textarea
                    value={partData.conflict}
                    onChange={(e) => updateField(['conflict'], e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Outcome</label>
                  <textarea
                    value={partData.outcome}
                    onChange={(e) => updateField(['outcome'], e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div><strong>Goal:</strong> {partData.goal || 'Not set'}</div>
              <div><strong>Conflict:</strong> {partData.conflict || 'Not set'}</div>
              <div><strong>Outcome:</strong> {partData.outcome || 'Not set'}</div>
            </div>
          )}
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
  part: ${partData.part}
  title: "${partData.title}"
  words: ${partData.words}
  function: "${partData.function}"
  
  # Universal pattern
  goal: "${partData.goal}"
  conflict: "${partData.conflict}"
  outcome: "${partData.outcome}"
  
  # Central questions
  questions:
    primary: "${partData.questions.primary}"
    secondary: "${partData.questions.secondary}"
  
  # Characters (${Object.keys(partData.chars).length})
  chars:`}
{Object.entries(partData.chars).map(([name, char]) => 
`    ${name}:
      start: "${char.start}"
      end: "${char.end}"
      arc: [${char.arc.map(step => `"${step}"`).join(', ')}]`
).join('\n')}
{`
  
  # Plot development
  plot:
    events: [${partData.plot.events.map(e => `"${e}"`).join(', ')}]
    reveals: [${partData.plot.reveals.map(r => `"${r}"`).join(', ')}]
    escalation: [${partData.plot.escalation.map(e => `"${e}"`).join(', ')}]
  
  # Emotional journey
  emotion:
    start: "${partData.emotion.start}"
    progression: [${partData.emotion.progression.map(p => `"${p}"`).join(', ')}]
    end: "${partData.emotion.end}"`}
            </code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}