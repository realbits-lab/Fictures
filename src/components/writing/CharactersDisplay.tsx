"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { BeautifulJSONDisplay } from "./BeautifulJSONDisplay";

interface Character {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  role?: string;
  arc?: string;
  flaw?: string;
  goal?: string;
  secret?: string;
}

interface CharactersDisplayProps {
  storyData: any;
}

export function CharactersDisplay({ storyData }: CharactersDisplayProps) {
  const [dbCharacters, setDbCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  // Get story ID from the storyData
  const storyId = storyData?.story?.story_id || storyData?.story_id;

  // Fetch characters from database
  useEffect(() => {
    const fetchCharacters = async () => {
      if (!storyId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/stories/${storyId}/characters`);
        if (response.ok) {
          const data = await response.json();
          // The API returns { characters: [...] }
          setDbCharacters(data.characters || []);
        } else {
          console.error('Failed to fetch characters:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching characters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, [storyId]);

  // Extract characters from story data (HNS format)
  const hnsCharacters = storyData?.chars || storyData?.characters || {};

  // Combine database characters with HNS characters for display
  const allCharacters = [...dbCharacters];

  // Add HNS characters that might not be in database yet
  Object.entries(hnsCharacters).forEach(([name, charData]: [string, any]) => {
    const existingChar = dbCharacters.find(char => char.name.toLowerCase() === name.toLowerCase());
    if (!existingChar) {
      allCharacters.push({
        id: `hns-${name}`,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        description: charData.appearance || "To be described",
        role: charData.role || "Character",
        arc: charData.arc,
        flaw: charData.flaw,
        goal: charData.goal,
        secret: charData.secret
      });
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>👥</span>
            Characters Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Manage and develop your story&apos;s characters. Each character card shows their role, arc, and key attributes.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              Total Characters: <span className="font-semibold">{allCharacters.length}</span>
            </div>
            <div>
              With Images: <span className="font-semibold">{allCharacters.filter(char => char.imageUrl).length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading characters...</p>
          </CardContent>
        </Card>
      )}

      {/* Individual character cards with images - DISPLAY FIRST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allCharacters.map((character) => (
          <Card key={character.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{character.name}</span>
                <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {character.role || "Character"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Character Image - Full size without cropping */}
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

              {character.description && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Description</h4>
                  <p className="text-sm">{character.description}</p>
                </div>
              )}

              {character.arc && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Arc</h4>
                  <p className="text-sm">{character.arc}</p>
                </div>
              )}

              {character.flaw && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Flaw</h4>
                  <p className="text-sm">{character.flaw}</p>
                </div>
              )}

              {character.goal && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Goal</h4>
                  <p className="text-sm">{character.goal}</p>
                </div>
              )}

              {character.secret && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Secret</h4>
                  <p className="text-sm italic">{character.secret}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Display characters JSON data - DISPLAY LAST */}
      <BeautifulJSONDisplay
        title="Character Details (JSON)"
        icon="👤"
        data={allCharacters}
      />
    </div>
  );
}