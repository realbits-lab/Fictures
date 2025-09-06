"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Textarea } from "@/components/ui";
import { YAMLDataDisplay } from "./YAMLDataDisplay";

interface SceneData {
  id: string | number;
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
  content?: string;
  wordCount?: number;
}

interface ChapterContext {
  title: string;
  pov: string;
  acts: {
    setup: { hook_in: string; orient: string; incident: string; };
    confrontation: { rising: string; midpoint: string; complicate: string; };
    resolution: { climax: string; resolve: string; hook_out: string; };
  };
}

interface SceneSidebarProps {
  sceneData: SceneData;
  chapterContext: ChapterContext;
  storyData?: any;
  partData?: any;
  chapterData?: any;
  onSave: (data: any) => void;
  onSceneDataChange: (field: string, value: any) => void;
}

export function SceneSidebar({ 
  sceneData, 
  chapterContext, 
  storyData, 
  partData, 
  chapterData,
  onSave, 
  onSceneDataChange 
}: SceneSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['foundation', 'goal', 'beats', 'characters']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleInputChange = (field: string, value: string) => {
    onSceneDataChange(field, value);
  };

  const handleBeatsChange = (index: number, value: string) => {
    const newBeats = [...sceneData.beats];
    newBeats[index] = value;
    onSceneDataChange('beats', newBeats);
  };

  const handleCharacterChange = (charName: string, field: string, value: string) => {
    const newCharacters = {
      ...sceneData.characters,
      [charName]: {
        ...sceneData.characters[charName],
        [field]: value
      }
    };
    onSceneDataChange('characters', newCharacters);
  };

  const renderCollapsibleSection = (title: string, key: string, children: React.ReactNode) => {
    const isExpanded = expandedSections.has(key);
    
    return (
      <Card key={key} className="mb-4">
        <CardHeader className="pb-2">
          <button
            onClick={() => toggleSection(key)}
            className="w-full flex items-center justify-between text-left hover:bg-[rgb(var(--accent))] rounded p-2 -m-2"
          >
            <CardTitle className="text-sm flex items-center gap-2">
              {title}
            </CardTitle>
            <svg
              className={`w-4 h-4 text-[rgb(var(--muted-foreground))] transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-0">
            {children}
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Scene Foundation */}
      {renderCollapsibleSection("🎬 Scene Foundation", "foundation", (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Summary</label>
            <Input
              value={sceneData.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              placeholder="Brief scene description"
              className="text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1">Time</label>
              <Input
                value={sceneData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                placeholder="When"
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Place</label>
              <Input
                value={sceneData.place}
                onChange={(e) => handleInputChange('place', e.target.value)}
                placeholder="Where"
                className="text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">POV Character</label>
            <Input
              value={sceneData.pov}
              onChange={(e) => handleInputChange('pov', e.target.value)}
              placeholder="Point of view character"
              className="text-sm"
            />
          </div>
        </div>
      ))}

      {/* Goal, Conflict, Outcome */}
      {renderCollapsibleSection("🎯 Goal, Conflict & Outcome", "goal", (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Scene Goal</label>
            <Textarea
              value={sceneData.goal}
              onChange={(e) => handleInputChange('goal', e.target.value)}
              placeholder="What does the POV character want in this scene?"
              className="text-sm min-h-[60px]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Obstacle/Conflict</label>
            <Textarea
              value={sceneData.obstacle}
              onChange={(e) => handleInputChange('obstacle', e.target.value)}
              placeholder="What prevents them from getting it?"
              className="text-sm min-h-[60px]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Outcome</label>
            <Textarea
              value={sceneData.outcome}
              onChange={(e) => handleInputChange('outcome', e.target.value)}
              placeholder="How does the scene end? Do they get what they want?"
              className="text-sm min-h-[60px]"
            />
          </div>
        </div>
      ))}

      {/* Scene Beats */}
      {renderCollapsibleSection("📝 Scene Beats", "beats", (
        <div className="space-y-2">
          <p className="text-xs text-[rgb(var(--muted-foreground))] mb-2">
            Break down the scene into 4-6 key beats or moments.
          </p>
          {sceneData.beats.map((beat, index) => (
            <div key={index}>
              <label className="block text-xs font-medium mb-1">Beat {index + 1}</label>
              <Textarea
                value={beat}
                onChange={(e) => handleBeatsChange(index, e.target.value)}
                placeholder={`Scene beat ${index + 1}`}
                className="text-sm min-h-[50px]"
              />
            </div>
          ))}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              const newBeats = [...sceneData.beats, ""];
              onSceneDataChange('beats', newBeats);
            }}
            className="w-full mt-2"
          >
            + Add Beat
          </Button>
        </div>
      ))}

      {/* Characters */}
      {renderCollapsibleSection("🎭 Characters", "characters", (
        <div className="space-y-3">
          <p className="text-xs text-[rgb(var(--muted-foreground))] mb-2">
            Track character states and transformations in this scene.
          </p>
          {Object.entries(sceneData.characters).map(([charName, charData]) => (
            <div key={charName} className="border border-[rgb(var(--border))] rounded-[var(--radius)] p-3">
              <h4 className="text-sm font-medium mb-2 capitalize">{charName}</h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Enters Scene</label>
                  <Input
                    value={charData.enters || ''}
                    onChange={(e) => handleCharacterChange(charName, 'enters', e.target.value)}
                    placeholder="Emotional/physical state entering"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Exits Scene</label>
                  <Input
                    value={charData.exits || ''}
                    onChange={(e) => handleCharacterChange(charName, 'exits', e.target.value)}
                    placeholder="How they've changed by scene end"
                    className="text-sm"
                  />
                </div>
                {charData.status && (
                  <div>
                    <label className="block text-xs font-medium mb-1">Status</label>
                    <Input
                      value={charData.status}
                      onChange={(e) => handleCharacterChange(charName, 'status', e.target.value)}
                      placeholder="Character status"
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              const newCharName = `character_${Object.keys(sceneData.characters).length + 1}`;
              const newCharacters = {
                ...sceneData.characters,
                [newCharName]: { enters: '', exits: '' }
              };
              onSceneDataChange('characters', newCharacters);
            }}
            className="w-full mt-2"
          >
            + Add Character
          </Button>
        </div>
      ))}

      {/* Visual Description */}
      {renderCollapsibleSection("🖼️ Visual Description", "visual", (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Image Prompt</label>
            <Textarea
              value={sceneData.image_prompt}
              onChange={(e) => handleInputChange('image_prompt', e.target.value)}
              placeholder="Describe the visual atmosphere and key elements of this scene..."
              className="text-sm min-h-[80px]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Emotional Shift</label>
            <Input
              value={sceneData.shift}
              onChange={(e) => handleInputChange('shift', e.target.value)}
              placeholder="e.g., hope → despair, confidence → doubt"
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Leads To</label>
            <Input
              value={sceneData.leads_to}
              onChange={(e) => handleInputChange('leads_to', e.target.value)}
              placeholder="Next scene or story element"
              className="text-sm"
            />
          </div>
        </div>
      ))}

      {/* YAML Data Hierarchy */}
      <YAMLDataDisplay
        storyData={storyData}
        partData={partData}
        chapterData={chapterData}
        sceneData={{
          id: sceneData.id,
          summary: sceneData.summary,
          time: sceneData.time,
          place: sceneData.place,
          pov: sceneData.pov,
          characters: sceneData.characters,
          goal: sceneData.goal,
          obstacle: sceneData.obstacle,
          outcome: sceneData.outcome,
          beats: sceneData.beats,
          shift: sceneData.shift,
          leads_to: sceneData.leads_to,
          image_prompt: sceneData.image_prompt
        }}
        currentLevel="scene"
      />

      {/* Save Button */}
      <Card>
        <CardContent className="pt-4">
          <Button 
            onClick={() => onSave(sceneData)} 
            className="w-full"
          >
            💾 Save Scene Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}