'use client';

import React, { useState } from 'react';

interface DownloadedStory {
  id: string;
  title: string;
  author: string;
  storageSize: number; // in bytes
  downloadDate: string;
  lastRead?: string;
  chapterCount: number;
}

// Mock data for GREEN phase implementation
const mockDownloadedStories: DownloadedStory[] = [
  {
    id: 'story-1',
    title: 'The Dragon Quest',
    author: 'John Fantasy',
    storageSize: 2048000, // 2MB
    downloadDate: '2024-01-15',
    lastRead: '2024-01-20',
    chapterCount: 5
  },
  {
    id: 'story-2',
    title: 'Space Adventures',
    author: 'Jane Sci-Fi',
    storageSize: 1536000, // 1.5MB
    downloadDate: '2024-01-18',
    lastRead: '2024-01-19',
    chapterCount: 3
  },
  {
    id: 'story-3',
    title: 'Mystery of the Lost Castle',
    author: 'Alex Mystery',
    storageSize: 3072000, // 3MB
    downloadDate: '2024-01-10',
    lastRead: '2024-01-12',
    chapterCount: 8
  }
];

export default function StorageSettingsPage() {
  const [downloadedStories, setDownloadedStories] = useState<DownloadedStory[]>(mockDownloadedStories);
  const [autoCleanup, setAutoCleanup] = useState(true);
  const [cleanupAfterDays, setCleanupAfterDays] = useState(30);

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getTotalStorageUsed = (): number => {
    return downloadedStories.reduce((total, story) => total + story.storageSize, 0);
  };

  const getAvailableStorage = (): number => {
    // Mock: assume 1GB available storage
    return 1024 * 1024 * 1024 - getTotalStorageUsed();
  };

  const handleRemoveStory = (storyId: string) => {
    setDownloadedStories(stories => stories.filter(story => story.id !== storyId));
  };

  const handleClearAllDownloads = () => {
    if (confirm('Are you sure you want to remove all downloaded stories?')) {
      setDownloadedStories([]);
    }
  };

  const totalUsed = getTotalStorageUsed();
  const totalAvailable = 1024 * 1024 * 1024; // 1GB
  const usagePercentage = (totalUsed / totalAvailable) * 100;

  return (
    <div data-testid="storage-settings-page" className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Storage Management</h1>

      {/* Storage Usage Overview */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Storage Usage</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div data-testid="total-storage-used" className="text-2xl font-bold text-blue-600">
              {formatFileSize(totalUsed)}
            </div>
            <div className="text-sm text-gray-600">Used</div>
          </div>
          
          <div className="text-center">
            <div data-testid="available-storage" className="text-2xl font-bold text-green-600">
              {formatFileSize(getAvailableStorage())}
            </div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {formatFileSize(totalAvailable)}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>

        <div data-testid="storage-usage-chart" className="w-full bg-gray-200 rounded-full h-4 mb-2">
          <div 
            className="bg-blue-600 h-4 rounded-full transition-all duration-300" 
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          ></div>
        </div>
        
        <div className="text-center text-sm text-gray-600">
          {Math.round(usagePercentage)}% of storage used
        </div>
      </div>

      {/* Downloaded Stories Management */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Downloaded Stories</h2>
          <button
            data-testid="clear-all-downloads-button"
            onClick={handleClearAllDownloads}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
            disabled={downloadedStories.length === 0}
          >
            Clear All Downloads
          </button>
        </div>

        <div data-testid="downloaded-stories-list" className="space-y-3">
          {downloadedStories.map((story) => (
            <div
              key={story.id}
              data-testid="downloaded-story-item"
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <h3 className="font-medium">{story.title}</h3>
                <p className="text-sm text-gray-600">by {story.author}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <div>
                    <span data-testid="storage-size">{formatFileSize(story.storageSize)}</span>
                  </div>
                  <div>
                    <span data-testid="download-date">Downloaded {story.downloadDate}</span>
                  </div>
                  {story.lastRead && (
                    <div>
                      <span data-testid="last-read">Last read {story.lastRead}</span>
                    </div>
                  )}
                  <div>
                    {story.chapterCount} chapters
                  </div>
                </div>
              </div>
              
              <button
                data-testid="remove-download-button"
                onClick={() => handleRemoveStory(story.id)}
                className="bg-gray-100 hover:bg-gray-200 text-red-600 px-3 py-1 rounded text-sm"
              >
                Remove
              </button>
            </div>
          ))}

          {downloadedStories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📚</div>
              <p>No downloaded stories</p>
              <p className="text-sm">Download stories for offline reading to see them here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Storage Settings */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Storage Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Auto-cleanup</label>
              <p className="text-sm text-gray-600">Automatically remove old downloaded content</p>
            </div>
            <input
              data-testid="auto-cleanup-toggle"
              type="checkbox"
              checked={autoCleanup}
              onChange={(e) => setAutoCleanup(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
          </div>

          {autoCleanup && (
            <div>
              <label className="block font-medium mb-2">Clean up content after:</label>
              <select
                data-testid="cleanup-after-days"
                value={cleanupAfterDays}
                onChange={(e) => setCleanupAfterDays(parseInt(e.target.value))}
                className="border rounded px-3 py-2"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
          )}

          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2">Storage Tips</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Downloaded stories are stored locally on your device</li>
              <li>• Larger stories with more chapters take up more space</li>
              <li>• Enable auto-cleanup to automatically manage storage</li>
              <li>• You can re-download stories at any time when online</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}