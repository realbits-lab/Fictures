'use client';

import React, { useState } from 'react';

interface ReadingList {
  id: string;
  name: string;
  description?: string;
  stories: Array<{
    id: string;
    title: string;
    author: string;
    position: number;
  }>;
  createdAt: string;
}

// Mock data for GREEN phase implementation
const mockReadingLists: ReadingList[] = [
  {
    id: 'summer-reading-2024',
    name: 'Summer Reading 2024',
    description: 'Books to read this summer',
    stories: [
      { id: '1', title: 'The Dragon Quest', author: 'John Fantasy', position: 1 },
      { id: '2', title: 'Space Adventures', author: 'Jane Sci-Fi', position: 2 },
    ],
    createdAt: '2024-06-01'
  }
];

export default function ReadingListsPage() {
  const [readingLists, setReadingLists] = useState<ReadingList[]>(mockReadingLists);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStorySearchModal, setShowStorySearchModal] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [draggedStoryIndex, setDraggedStoryIndex] = useState<number | null>(null);

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    
    const newList: ReadingList = {
      id: newListName.toLowerCase().replace(/\s+/g, '-'),
      name: newListName,
      stories: [],
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setReadingLists([...readingLists, newList]);
    setNewListName('');
    setShowCreateModal(false);
  };

  const handleDragStart = (index: number) => {
    setDraggedStoryIndex(index);
  };

  const handleDrop = (dropIndex: number, listId: string) => {
    if (draggedStoryIndex === null) return;
    
    setReadingLists(lists => 
      lists.map(list => {
        if (list.id === listId) {
          const stories = [...list.stories];
          const draggedStory = stories[draggedStoryIndex];
          stories.splice(draggedStoryIndex, 1);
          stories.splice(dropIndex, 0, draggedStory);
          
          // Update positions
          stories.forEach((story, index) => {
            story.position = index + 1;
          });
          
          return { ...list, stories };
        }
        return list;
      })
    );
    
    setDraggedStoryIndex(null);
  };

  return (
    <div data-testid="reading-lists-page" className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reading Lists</h1>
        <button
          data-testid="create-reading-list-button"
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Reading List
        </button>
      </div>

      <div className="space-y-6">
        {readingLists.map((list) => (
          <div
            key={list.id}
            data-testid={`reading-list-${list.id}`}
            className="border rounded-lg p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{list.name}</h2>
                {list.description && (
                  <p className="text-gray-600 mt-1">{list.description}</p>
                )}
                <div className="text-sm text-gray-500 mt-1">
                  Created {list.createdAt} • {list.stories.length} stories
                </div>
              </div>
              <button
                data-testid="add-story-button"
                onClick={() => {
                  setSelectedListId(list.id);
                  setShowStorySearchModal(true);
                }}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm"
              >
                Add Story
              </button>
            </div>

            <div className="space-y-2">
              {list.stories.map((story, index) => (
                <div
                  key={story.id}
                  data-testid="story-list-item"
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(index, list.id)}
                  className="flex items-center p-3 border rounded hover:bg-gray-50 cursor-move"
                >
                  <div
                    data-testid="drag-handle"
                    className="mr-3 text-gray-400 cursor-grab"
                  >
                    ⋮⋮
                  </div>
                  <div className="flex-1">
                    <div data-testid="story-title" className="font-medium">
                      {story.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      by {story.author} • Position {story.position}
                    </div>
                  </div>
                </div>
              ))}

              {list.stories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No stories in this list yet. Add some stories to get started!
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Reading List Modal */}
      {showCreateModal && (
        <div 
          data-testid="create-reading-list-modal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white p-6 rounded-lg w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold mb-4">Create New Reading List</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">List Name</label>
              <input
                data-testid="list-name-input"
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter list name"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                data-testid="create-list-submit"
                onClick={handleCreateList}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Create List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Search Modal */}
      {showStorySearchModal && (
        <div 
          data-testid="story-search-modal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl mx-4">
            <h3 className="text-xl font-semibold mb-4">Add Story to List</h3>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search for stories..."
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {/* Mock search results */}
              <div className="p-3 border rounded hover:bg-gray-50 cursor-pointer">
                <div className="font-medium">The Dragon Quest</div>
                <div className="text-sm text-gray-600">by John Fantasy</div>
              </div>
              <div className="p-3 border rounded hover:bg-gray-50 cursor-pointer">
                <div className="font-medium">Space Adventures</div>
                <div className="text-sm text-gray-600">by Jane Sci-Fi</div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowStorySearchModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={() => setShowStorySearchModal(false)}
              >
                Add to List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}