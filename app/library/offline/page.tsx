'use client';

import React, { useState } from 'react';

interface OfflineStory {
  id: string;
  title: string;
  author: string;
  downloadedChapters: number[];
  totalChapters: number;
  downloadedAt: string;
  lastRead?: string;
  coverImage?: string;
}

// Mock data for GREEN phase implementation
const mockOfflineStories: OfflineStory[] = [
  {
    id: 'test-story-123',
    title: 'The Dragon Quest',
    author: 'John Fantasy',
    downloadedChapters: [1, 2, 3, 4, 5],
    totalChapters: 5,
    downloadedAt: '2024-01-15',
    lastRead: '2024-01-20'
  },
  {
    id: 'story-456',
    title: 'Space Adventures',
    author: 'Jane Sci-Fi',
    downloadedChapters: [1, 2, 3],
    totalChapters: 8,
    downloadedAt: '2024-01-18',
    lastRead: '2024-01-19'
  }
];

export default function OfflineLibrary() {
  const [offlineStories] = useState<OfflineStory[]>(mockOfflineStories);
  const [showOfflineIndicator] = useState(true);

  const handleStoryClick = (storyId: string) => {
    window.location.href = `/stories/${storyId}/chapters/1`;
  };

  return (
    <div data-testid="offline-library" className="max-w-6xl mx-auto p-6">
      {showOfflineIndicator && (
        <div data-testid="offline-mode-indicator" className="bg-orange-100 border border-orange-300 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-orange-600 mr-2">📶</div>
            <div>
              <div className="font-semibold text-orange-800">Offline Mode</div>
              <div className="text-orange-700 text-sm">You're currently offline. Only downloaded stories are available.</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Offline Library</h1>
        <div className="text-sm text-gray-600">
          {offlineStories.length} stories downloaded
        </div>
      </div>

      {offlineStories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📱</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No offline stories</h3>
          <p className="text-gray-500 mb-4">Download stories to read them offline</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Browse Stories
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offlineStories.map((story) => (
            <div
              key={story.id}
              data-testid="offline-story-card"
              onClick={() => handleStoryClick(story.id)}
              className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{story.title}</h3>
                    <p className="text-gray-600 text-sm">by {story.author}</p>
                  </div>
                  <div className="text-green-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Progress:</span>
                    <span>{story.downloadedChapters.length} / {story.totalChapters} chapters</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(story.downloadedChapters.length / story.totalChapters) * 100}%` 
                      }}
                    ></div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <span>Downloaded:</span>
                    <span>{story.downloadedAt}</span>
                  </div>

                  {story.lastRead && (
                    <div className="flex justify-between">
                      <span>Last read:</span>
                      <span>{story.lastRead}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t">
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded text-sm hover:bg-blue-600">
                      Continue Reading
                    </button>
                    <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
                      ⋮
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sync notification (would appear when coming back online) */}
      <div 
        data-testid="progress-sync-notification" 
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg" 
        style={{ display: 'none' }}
      >
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          <span>Syncing reading progress...</span>
        </div>
      </div>
    </div>
  );
}