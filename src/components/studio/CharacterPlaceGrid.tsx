"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import Image from 'next/image';

interface Character {
  id: string;
  name: string;
  imageUrl?: string;
  content: string;
  isMain: boolean;
}

interface Place {
  id: string;
  name: string;
  imageUrl?: string;
  content: string;
  isMain: boolean;
}

interface CharacterPlaceGridProps {
  characters?: Character[];
  places?: Place[];
  showCharacters?: boolean;
  showPlaces?: boolean;
}

export function CharacterPlaceGrid({
  characters = [],
  places = [],
  showCharacters = true,
  showPlaces = true
}: CharacterPlaceGridProps) {
  const parseContent = (content: string) => {
    try {
      return JSON.parse(content);
    } catch {
      return {};
    }
  };

  const renderCharacterCard = (character: Character) => {
    const data = parseContent(character.content);
    const description = data.description || data.appearance || 'No description available';

    return (
      <Card key={character.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="relative">
          {character.imageUrl ? (
            <div className="relative h-48 w-full">
              <Image
                src={character.imageUrl}
                alt={character.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <h3 className="text-white font-semibold text-lg mb-1">{character.name}</h3>
                {character.isMain && (
                  <span className="inline-block px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                    Main Character
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="h-48 w-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">👤</div>
                <h3 className="font-semibold text-lg">{character.name}</h3>
                {character.isMain && (
                  <span className="inline-block px-2 py-1 bg-blue-500 text-white text-xs rounded-full mt-2">
                    Main Character
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {description}
          </p>
          {data.role && (
            <div className="mt-2">
              <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs rounded">
                {data.role}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderPlaceCard = (place: Place) => {
    const data = parseContent(place.content);
    const description = data.description || 'No description available';

    return (
      <Card key={place.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="relative">
          {place.imageUrl ? (
            <div className="relative h-48 w-full">
              <Image
                src={place.imageUrl}
                alt={place.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <h3 className="text-white font-semibold text-lg mb-1">{place.name}</h3>
                {place.isMain && (
                  <span className="inline-block px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                    Main Location
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="h-48 w-full bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🏞️</div>
                <h3 className="font-semibold text-lg">{place.name}</h3>
                {place.isMain && (
                  <span className="inline-block px-2 py-1 bg-green-500 text-white text-xs rounded-full mt-2">
                    Main Location
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {description}
          </p>
          {data.type && (
            <div className="mt-2">
              <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs rounded">
                {data.type}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!showCharacters && !showPlaces) {
    return null;
  }

  return (
    <div className="space-y-6">
      {showCharacters && characters.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>👥</span>
            Characters ({characters.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map(renderCharacterCard)}
          </div>
        </div>
      )}

      {showPlaces && places.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🏞️</span>
            Places ({places.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {places.map(renderPlaceCard)}
          </div>
        </div>
      )}

      {showCharacters && characters.length === 0 && showPlaces && places.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">🎭</div>
          <p className="text-lg font-medium mb-2">No Characters or Places Yet</p>
          <p className="text-sm">Create a story to see characters and places with AI-generated images</p>
        </div>
      )}
    </div>
  );
}