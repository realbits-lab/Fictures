"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import useSWR from "swr";

interface Scene {
  id: string;
  title: string;
  content: string;
  chapterId: string;
  orderIndex: number;
  wordCount: number;
  status: string;
  goal?: string;
  conflict?: string;
  outcome?: string;
  povCharacterId?: string;
  settingId?: string;
  narrativeVoice?: string;
  summary?: string;
  entryHook?: string;
  emotionalShift?: { from: string; to: string };
  hnsData?: Record<string, unknown>;
  characterIds: string[];
  placeIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface Character {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

interface Setting {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

interface SceneDisplayProps {
  sceneId: string;
  storyId: string;
  disabled?: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SceneDisplay({ sceneId, storyId, disabled = false }: SceneDisplayProps) {
  const [scene, setScene] = useState<Scene | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);

  // Fetch scene data
  const { data: sceneData } = useSWR(
    `/api/stories/${storyId}/scenes/${sceneId}`,
    fetcher
  );

  // Fetch characters data
  const { data: charactersData } = useSWR(
    `/api/stories/${storyId}/characters`,
    fetcher
  );

  // Fetch settings data
  const { data: settingsData } = useSWR(
    `/api/stories/${storyId}/settings`,
    fetcher
  );

  useEffect(() => {
    if (sceneData?.scene) {
      setScene(sceneData.scene);
    }
  }, [sceneData]);

  useEffect(() => {
    if (charactersData?.characters && scene) {
      // Filter characters that are in this scene
      const sceneCharacters = charactersData.characters.filter((char: Character) =>
        scene.characterIds?.includes(char.id) || scene.povCharacterId === char.id
      );
      setCharacters(sceneCharacters);
    }
  }, [charactersData, scene]);

  useEffect(() => {
    if (settingsData?.settings && scene) {
      // Filter settings that are in this scene
      const sceneSettings = settingsData.settings.filter((setting: Setting) =>
        scene.placeIds?.includes(setting.id) || scene.settingId === setting.id
      );
      setSettings(sceneSettings);
    }
  }, [settingsData, scene]);

  if (!scene) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-4">🎬</div>
            <h3 className="text-lg font-medium mb-2">Loading Scene...</h3>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Scene Title */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎬 {scene.title}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Characters in Scene */}
      {characters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">👥 Characters in Scene</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {characters.map((character) => (
              <div key={character.id} className="space-y-2">
                <h4 className="font-semibold">{character.name}</h4>
                {character.imageUrl && (
                  <div className="mb-3">
                    <img
                      src={character.imageUrl}
                      alt={character.name}
                      className="w-full h-auto rounded-md"
                      style={{ maxHeight: '400px', objectFit: 'contain' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Settings in Scene */}
      {settings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📍 Settings in Scene</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.map((setting) => (
              <div key={setting.id} className="space-y-2">
                <h4 className="font-semibold">{setting.name}</h4>
                {setting.imageUrl && (
                  <div className="mb-3">
                    <img
                      src={setting.imageUrl}
                      alt={setting.name}
                      className="w-full h-auto rounded-md"
                      style={{ maxHeight: '400px', objectFit: 'contain' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Scene Full Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📝 Scene Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {scene.content ? (
              <div className="whitespace-pre-wrap">{scene.content}</div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                No content written yet for this scene.
              </p>
            )}
          </div>
          {scene.wordCount !== undefined && scene.wordCount > 0 && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Word Count: {scene.wordCount}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scene JSON Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔍 Scene JSON Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-auto max-h-96">
            <code>{JSON.stringify(scene, null, 2)}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}