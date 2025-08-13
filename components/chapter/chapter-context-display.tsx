'use client';

import React from 'react';

export interface ChapterContextDisplayProps {
  storyTitle?: string;
  storyDescription?: string;
  genre?: string;
  previousChapters?: Array<{
    chapterNumber: number;
    title: string;
    summary: string;
  }>;
  characters?: Array<{
    name: string;
    description: string;
    role: string;
  }>;
  outline?: string;
}

export default function ChapterContextDisplay({
  storyTitle,
  storyDescription,
  genre,
  previousChapters,
  characters,
  outline
}: ChapterContextDisplayProps) {
  const hasContext = storyTitle || storyDescription || genre || 
                    (previousChapters && previousChapters.length > 0) ||
                    (characters && characters.length > 0) ||
                    outline;

  if (!hasContext) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-gray-500 text-sm text-center">
          No story context available. This information will be automatically included when generating chapters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Story Information */}
      {storyTitle && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Story</h3>
          <p className="text-blue-700 font-medium">{storyTitle}</p>
          {storyDescription && (
            <p className="text-blue-600 text-sm mt-1">{storyDescription}</p>
          )}
          {genre && (
            <span className="inline-block mt-2 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded">
              {genre}
            </span>
          )}
        </div>
      )}

      {/* Story Outline */}
      {outline && (
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Outline</h3>
          <p className="text-green-700 text-sm">{outline}</p>
        </div>
      )}

      {/* Previous Chapters */}
      {previousChapters && previousChapters.length > 0 && (
        <div className="bg-yellow-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-800 mb-3">Previous Chapters</h3>
          <div className="space-y-2">
            {previousChapters.map((chapter, index) => (
              <div key={chapter.chapterNumber} className="bg-white rounded p-3 border border-yellow-200">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-medium text-yellow-900">
                    Chapter {chapter.chapterNumber}: {chapter.title}
                  </h4>
                </div>
                {chapter.summary && (
                  <p className="text-yellow-700 text-xs">{chapter.summary}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Characters */}
      {characters && characters.length > 0 && (
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-purple-800 mb-3">Characters</h3>
          <div className="space-y-2">
            {characters.map((character, index) => (
              <div key={index} className="bg-white rounded p-3 border border-purple-200">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-purple-900">
                    {character.name}
                  </h4>
                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                    {character.role}
                  </span>
                </div>
                <p className="text-purple-700 text-xs">{character.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context Info */}
      <div className="bg-gray-100 rounded-lg p-3">
        <p className="text-xs text-gray-600 text-center">
          This context will be automatically included when generating new chapters
        </p>
      </div>
    </div>
  );
}