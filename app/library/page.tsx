'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Collection {
  id: string;
  name: string;
  description: string;
  privacy: 'public' | 'private';
  storyCount: number;
  createdAt: string;
}

// Mock data for GREEN phase implementation
const mockCollections: Collection[] = [
  {
    id: '1',
    name: 'Favorite Fantasy',
    description: 'My favorite fantasy novels',
    privacy: 'public',
    storyCount: 5,
    createdAt: '2024-01-15'
  },
  {
    id: '2', 
    name: 'Sci-Fi Adventures',
    description: 'Space exploration and future tech',
    privacy: 'private',
    storyCount: 3,
    createdAt: '2024-02-01'
  }
];

export default function PersonalLibrary() {
  const [collections, setCollections] = useState<Collection[]>(mockCollections);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    privacy: 'private' as 'public' | 'private'
  });

  const handleCreateCollection = () => {
    if (!newCollection.name.trim()) return;
    
    const collection: Collection = {
      id: Date.now().toString(),
      name: newCollection.name,
      description: newCollection.description,
      privacy: newCollection.privacy,
      storyCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setCollections([...collections, collection]);
    setNewCollection({ name: '', description: '', privacy: 'private' });
    setShowCreateModal(false);
  };

  return (
    <div data-testid="personal-library" className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Personal Library</h1>
        <button
          data-testid="create-collection-button"
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Collection
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link 
          href="/library/reading-lists"
          className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2">Reading Lists</h3>
          <p className="text-gray-600">Organize your reading queue</p>
        </Link>

        <Link
          href="/library/statistics"
          className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2">Reading Statistics</h3>
          <p className="text-gray-600">Track your reading progress</p>
        </Link>

        <Link
          href="/library/achievements"
          className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2">Achievements</h3>
          <p className="text-gray-600">View your reading badges</p>
        </Link>

        <Link
          href="/library/offline"
          className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2">Offline Library</h3>
          <p className="text-gray-600">Downloaded stories</p>
        </Link>

        <Link
          href="/library/bookmarks"
          className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2">Bookmarks</h3>
          <p className="text-gray-600">Saved reading positions</p>
        </Link>

        <Link
          href="/settings/storage"
          className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2">Storage Settings</h3>
          <p className="text-gray-600">Manage offline storage</p>
        </Link>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Your Collections</h2>
        <div data-testid="collections-list" className="space-y-4">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.location.href = `/library/collections/${collection.id}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-medium">{collection.name}</h3>
                  <p className="text-gray-600 mt-1">{collection.description}</p>
                  <div className="text-sm text-gray-500 mt-2">
                    {collection.storyCount} stories • {collection.privacy} • Created {collection.createdAt}
                  </div>
                </div>
                <button
                  data-testid="add-story-to-collection-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle adding story to collection
                  }}
                  className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm"
                >
                  Add Story
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div 
          data-testid="create-collection-modal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white p-6 rounded-lg w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold mb-4">Create New Collection</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Collection Name</label>
                <input
                  data-testid="collection-name-input"
                  type="text"
                  value={newCollection.name}
                  onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter collection name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  data-testid="collection-description-input"
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                  className="w-full p-2 border rounded h-20"
                  placeholder="Describe your collection"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Privacy</label>
                <div className="space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      data-testid="collection-privacy-public"
                      type="radio"
                      name="privacy"
                      value="public"
                      checked={newCollection.privacy === 'public'}
                      onChange={(e) => setNewCollection({ ...newCollection, privacy: 'public' })}
                    />
                    <span className="ml-2">Public</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      data-testid="collection-privacy-private"
                      type="radio"
                      name="privacy"
                      value="private"
                      checked={newCollection.privacy === 'private'}
                      onChange={(e) => setNewCollection({ ...newCollection, privacy: 'private' })}
                    />
                    <span className="ml-2">Private</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                data-testid="create-collection-submit"
                onClick={handleCreateCollection}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Create Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}