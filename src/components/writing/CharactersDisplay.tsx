"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { BeautifulJSONDisplay } from "./BeautifulJSONDisplay";

interface CharactersDisplayProps {
  storyData: any;
}

export function CharactersDisplay({ storyData }: CharactersDisplayProps) {
  // Extract characters from story data
  const characters = storyData?.chars || storyData?.characters || {};

  // Mock some additional character data for demonstration
  const enrichedCharacters = Object.entries(characters).reduce((acc, [name, charData]: [string, any]) => {
    acc[name] = {
      ...charData,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      appearance: charData.appearance || "To be described",
      personality: charData.personality || "To be developed",
      relationships: charData.relationships || {},
      backstory: charData.backstory || "To be written",
      motivation: charData.goal || charData.motivation || "To be defined",
      conflicts: charData.flaw || charData.conflicts || "To be explored"
    };
    return acc;
  }, {} as Record<string, any>);

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
            Manage and develop your story's characters. Each character card shows their role, arc, and key attributes.
          </p>
          <div className="text-sm text-gray-500">
            Total Characters: <span className="font-semibold">{Object.keys(characters).length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Display characters data in beautiful card format */}
      <BeautifulJSONDisplay
        title="Character Details"
        icon="👤"
        data={enrichedCharacters}
      />

      {/* Individual character cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(enrichedCharacters).map(([name, charData]: [string, any]) => (
          <Card key={name} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{charData.name}</span>
                <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {charData.role}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Arc</h4>
                <p className="text-sm">{charData.arc}</p>
              </div>

              {charData.flaw && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Flaw</h4>
                  <p className="text-sm">{charData.flaw}</p>
                </div>
              )}

              {charData.goal && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Goal</h4>
                  <p className="text-sm">{charData.goal}</p>
                </div>
              )}

              {charData.secret && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Secret</h4>
                  <p className="text-sm italic">{charData.secret}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}