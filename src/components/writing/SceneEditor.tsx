"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";

// Scene YAML interface based on scene-specification.md
interface SceneData {
  id: number;
  summary: string;
  time: string;
  place: string;
  pov: string;
  characters: Record<string, {
    enters?: string;
    exits?: string;
    status?: string;
    evidence?: string;
  }>;
  goal: string;
  obstacle: string;
  outcome: string;
  beats: string[];
  shift: string;
  leads_to: string;
  image_prompt: string;
}

interface SceneEditorProps {
  sceneId?: string;
  sceneNumber: number;
  initialData?: SceneData;
  chapterContext?: {
    title: string;
    pov: string;
    acts: any;
  };
  onSave?: (data: SceneData) => Promise<void>;
  onWrite?: (data: SceneData) => Promise<void>;
}

export function SceneEditor({ 
  sceneId, 
  sceneNumber, 
  initialData, 
  chapterContext, 
  onSave, 
  onWrite 
}: SceneEditorProps) {
  const [sceneData, setSceneData] = useState<SceneData>(
    initialData || {
      id: sceneNumber,
      summary: "",
      time: "morning",
      place: "",
      pov: chapterContext?.pov || "protagonist",
      characters: {},
      goal: "",
      obstacle: "",
      outcome: "",
      beats: ["", "", ""],
      shift: "positive → negative",
      leads_to: "",
      image_prompt: ""
    }
  );

  const [sceneContent, setSceneContent] = useState("");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Calculate word count
  useEffect(() => {
    const words = sceneContent.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [sceneContent]);

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(sceneData);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWrite = async () => {
    if (!onWrite) return;
    setIsWriting(true);
    try {
      await onWrite(sceneData);
    } catch (error) {
      console.error('Writing failed:', error);
    } finally {
      setIsWriting(false);
    }
  };

  const updateField = (path: string[], value: any) => {
    setSceneData(prev => {
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

  const updateArrayField = (index: number, value: string) => {
    const newBeats = [...sceneData.beats];
    newBeats[index] = value;
    updateField(['beats'], newBeats);
  };

  const addBeat = () => {
    updateField(['beats'], [...sceneData.beats, ""]);
  };

  const removeBeat = (index: number) => {
    const newBeats = sceneData.beats.filter((_, i) => i !== index);
    updateField(['beats'], newBeats);
  };

  const renderSceneFoundation = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎬 Scene Foundation
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
              <label className="text-sm font-medium">Scene Summary</label>
              <textarea
                value={sceneData.summary}
                onChange={(e) => updateField(['summary'], e.target.value)}
                className="w-full p-2 border rounded"
                rows={2}
                placeholder="Brief description of what happens in this scene"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Time</label>
                <input
                  type="text"
                  value={sceneData.time}
                  onChange={(e) => updateField(['time'], e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="sunday_10:05am"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Place</label>
                <input
                  type="text"
                  value={sceneData.place}
                  onChange={(e) => updateField(['place'], e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="elena_apartment_hallway"
                />
              </div>
              <div>
                <label className="text-sm font-medium">POV</label>
                <input
                  type="text"
                  value={sceneData.pov}
                  onChange={(e) => updateField(['pov'], e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="maya"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div><strong>Summary:</strong> {sceneData.summary || 'Not set'}</div>
            <div className="flex gap-4">
              <div><strong>Time:</strong> {sceneData.time}</div>
              <div><strong>Place:</strong> {sceneData.place}</div>
              <div><strong>POV:</strong> {sceneData.pov}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderGoalConflictOutcome = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎯 Goal-Conflict-Outcome (Core Drama)
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setEditingSection(editingSection === 'drama' ? null : 'drama')}
          >
            {editingSection === 'drama' ? '✓' : '✏️'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editingSection === 'drama' ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Goal</label>
              <textarea
                value={sceneData.goal}
                onChange={(e) => updateField(['goal'], e.target.value)}
                className="w-full p-2 border rounded"
                rows={2}
                placeholder="What does the POV character want in this scene?"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Obstacle</label>
              <textarea
                value={sceneData.obstacle}
                onChange={(e) => updateField(['obstacle'], e.target.value)}
                className="w-full p-2 border rounded"
                rows={2}
                placeholder="What prevents them from achieving their goal?"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Outcome</label>
              <textarea
                value={sceneData.outcome}
                onChange={(e) => updateField(['outcome'], e.target.value)}
                className="w-full p-2 border rounded"
                rows={2}
                placeholder="How does the scene end? (Usually 'No, and...' or 'Yes, but...')"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Value Shift</label>
              <input
                type="text"
                value={sceneData.shift}
                onChange={(e) => updateField(['shift'], e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="routine_expectation → urgent_fear"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div><strong>Goal:</strong> {sceneData.goal || 'Not set'}</div>
            <div><strong>Obstacle:</strong> {sceneData.obstacle || 'Not set'}</div>
            <div><strong>Outcome:</strong> {sceneData.outcome || 'Not set'}</div>
            <div><strong>Value Shift:</strong> <Badge variant="outline">{sceneData.shift}</Badge></div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderSceneBeats = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎵 Scene Beats (Key Moments)
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setEditingSection(editingSection === 'beats' ? null : 'beats')}
          >
            {editingSection === 'beats' ? '✓' : '✏️'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editingSection === 'beats' ? (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 mb-2">
              Define the key moments that must happen in this scene
            </div>
            {sceneData.beats.map((beat, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <input
                  type="text"
                  value={beat}
                  onChange={(e) => updateArrayField(index, e.target.value)}
                  className="flex-1 p-2 border rounded text-sm"
                  placeholder={`Beat ${index + 1}: What happens at this moment?`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBeat(index)}
                  disabled={sceneData.beats.length <= 1}
                >
                  ×
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addBeat}>
              + Add Beat
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sceneData.beats.map((beat, index) => (
              <div key={index} className="flex gap-2 text-sm">
                <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs">
                  {index + 1}
                </div>
                <span>{beat || 'Not set'}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderCharacters = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          👥 Characters in Scene
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setEditingSection(editingSection === 'characters' ? null : 'characters')}
          >
            {editingSection === 'characters' ? '✓' : '✏️'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editingSection === 'characters' ? (
          <div className="space-y-3">
            {Object.entries(sceneData.characters).map(([name, char]) => (
              <div key={name} className="border p-3 rounded">
                <div className="font-medium mb-2">{name}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium">Enters As</label>
                    <input
                      type="text"
                      value={char.enters || ''}
                      onChange={(e) => updateField(['characters', name, 'enters'], e.target.value)}
                      className="w-full p-1 border rounded text-sm"
                      placeholder="casual_anticipation"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Exits As</label>
                    <input
                      type="text"
                      value={char.exits || ''}
                      onChange={(e) => updateField(['characters', name, 'exits'], e.target.value)}
                      className="w-full p-1 border rounded text-sm"
                      placeholder="panicked_determination"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                const newName = `character_${Object.keys(sceneData.characters).length + 1}`;
                updateField(['characters', newName], {
                  enters: "",
                  exits: ""
                });
              }}
            >
              + Add Character
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(sceneData.characters).length > 0 ? (
              Object.entries(sceneData.characters).map(([name, char]) => (
                <div key={name} className="text-sm">
                  <span className="font-medium">{name}:</span> {char.enters} → {char.exits}
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No characters added yet</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderSceneWriting = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ✍️ Scene Writing
          <Badge variant="outline">{wordCount} words</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          value={sceneContent}
          onChange={(e) => setSceneContent(e.target.value)}
          className="w-full h-64 p-3 border rounded font-mono text-sm leading-relaxed resize-none"
          placeholder="Write your scene here using the MRU (Motivation-Reaction Unit) structure:

Motivation (External): The door slammed shut.
Reaction:
  1. Feeling: Fear shot through him.
  2. Reflex: He flinched.
  3. Action: He reached for the doorknob. 'Who's there?'"
        />
        <div className="text-xs text-gray-500">
          <strong>MRU Structure:</strong> Write each paragraph as Motivation (what happens) followed by Reaction (feeling → reflex → action/speech)
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Scene Editor Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">🎬 Scene {sceneData.id} Editor</h2>
          <p className="text-sm text-gray-600">
            {sceneData.place} • {sceneData.time} • POV: {sceneData.pov}
          </p>
          {chapterContext && (
            <Badge variant="outline" className="mt-1">{chapterContext.title}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? '💾 Saving...' : '💾 Save Scene'}
          </Button>
          <Button 
            onClick={handleWrite} 
            disabled={isWriting}
          >
            {isWriting ? '✍️ Writing...' : '✍️ AI Write Scene'}
          </Button>
        </div>
      </div>

      {/* Scene Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {renderSceneFoundation()}
          {renderGoalConflictOutcome()}
        </div>
        <div className="space-y-6">
          {renderSceneBeats()}
          {renderCharacters()}
        </div>
      </div>

      {/* Scene Writing */}
      {renderSceneWriting()}

      {/* Visual Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🖼️ Visual Scene Description
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setEditingSection(editingSection === 'visual' ? null : 'visual')}
            >
              {editingSection === 'visual' ? '✓' : '✏️'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editingSection === 'visual' ? (
            <div>
              <label className="text-sm font-medium">Image Prompt</label>
              <textarea
                value={sceneData.image_prompt}
                onChange={(e) => updateField(['image_prompt'], e.target.value)}
                className="w-full p-2 border rounded mt-1"
                rows={3}
                placeholder="Describe the visual essence of this scene for image generation: setting, mood, character positions, lighting, atmosphere..."
              />
            </div>
          ) : (
            <div className="text-sm">
              {sceneData.image_prompt || 'No visual description set'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* YAML Preview */}
      <Card>
        <CardHeader>
          <CardTitle>📄 Scene YAML Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-auto max-h-64">
            <code>
{`scene:
  id: ${sceneData.id}
  summary: "${sceneData.summary}"
  
  # Scene context
  time: "${sceneData.time}"
  place: "${sceneData.place}"
  pov: "${sceneData.pov}"
  
  # Characters present
  characters:`}
{Object.entries(sceneData.characters).map(([name, char]) => 
`    ${name}: { enters: "${char.enters}", exits: "${char.exits}" }`
).join('\n')}
{`
  
  # Core dramatic movement
  goal: "${sceneData.goal}"
  obstacle: "${sceneData.obstacle}"
  outcome: "${sceneData.outcome}"
  
  # Key beats
  beats:`}
{sceneData.beats.map((beat, index) => 
`    - "${beat}"`
).join('\n')}
{`
  
  # Value shift
  shift: "${sceneData.shift}"
  
  # Story flow
  leads_to: "${sceneData.leads_to}"
  
  # Visual description
  image_prompt: "${sceneData.image_prompt}"`}
            </code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}