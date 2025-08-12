'use client';

import React, { useState } from 'react';

interface Bookmark {
  id: string;
  storyId: string;
  storyTitle: string;
  author: string;
  chapterNumber: number;
  chapterTitle: string;
  position: number;
  note?: string;
  isAutomatic: boolean;
  createdAt: string;
}

// Mock data for GREEN phase implementation
const mockBookmarks: Bookmark[] = [
  {
    id: 'bookmark-1',
    storyId: 'story-1',
    storyTitle: 'The Dragon Quest',
    author: 'John Fantasy',
    chapterNumber: 3,
    chapterTitle: 'The Dragon\'s Lair',
    position: 45,
    note: 'Great action scene here!',
    isAutomatic: false,
    createdAt: '2024-01-20'
  },
  {
    id: 'bookmark-2',
    storyId: 'story-2',
    storyTitle: 'Space Adventures',
    author: 'Jane Sci-Fi',
    chapterNumber: 2,
    chapterTitle: 'Journey to Mars',
    position: 78,
    isAutomatic: true,
    createdAt: '2024-01-19'
  },
  {
    id: 'bookmark-3',
    storyId: 'story-1',
    storyTitle: 'The Dragon Quest',
    author: 'John Fantasy',
    chapterNumber: 1,
    chapterTitle: 'The Beginning',
    position: 12,
    note: 'Remember this character introduction',
    isAutomatic: false,
    createdAt: '2024-01-15'
  }
];

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(mockBookmarks);
  const [selectedBookmark, setSelectedBookmark] = useState<string | null>(null);

  const handleBookmarkClick = (bookmark: Bookmark) => {
    window.location.href = `/stories/${bookmark.storyId}/chapters/${bookmark.chapterNumber}`;
  };

  const handleDeleteBookmark = (bookmarkId: string) => {
    if (confirm('Are you sure you want to delete this bookmark?')) {
      setBookmarks(bookmarks.filter(b => b.id !== bookmarkId));
    }
  };

  const groupBookmarksByStory = () => {
    const grouped = bookmarks.reduce((acc, bookmark) => {
      const key = `${bookmark.storyId}-${bookmark.storyTitle}`;
      if (!acc[key]) {
        acc[key] = {
          storyId: bookmark.storyId,
          storyTitle: bookmark.storyTitle,
          author: bookmark.author,
          bookmarks: []
        };
      }
      acc[key].bookmarks.push(bookmark);
      return acc;
    }, {} as Record<string, { storyId: string; storyTitle: string; author: string; bookmarks: Bookmark[] }>);

    return Object.values(grouped);
  };

  const groupedBookmarks = groupBookmarksByStory();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bookmarks</h1>
        <div className="text-sm text-gray-600">
          {bookmarks.length} bookmarks saved
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔖</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No bookmarks yet</h3>
          <p className="text-gray-500 mb-4">Save your favorite moments while reading</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Start Reading
          </button>
        </div>
      ) : (
        <div data-testid="bookmarks-list" className="space-y-6">
          {groupedBookmarks.map((group) => (
            <div key={group.storyId} className="bg-white rounded-lg border">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-xl font-semibold">{group.storyTitle}</h2>
                <p className="text-gray-600">by {group.author}</p>
                <div className="text-sm text-gray-500 mt-1">
                  {group.bookmarks.length} bookmark{group.bookmarks.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="divide-y">
                {group.bookmarks
                  .sort((a, b) => a.chapterNumber - b.chapterNumber)
                  .map((bookmark) => (
                    <div
                      key={bookmark.id}
                      data-testid="bookmark-item"
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleBookmarkClick(bookmark)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium">
                              Chapter {bookmark.chapterNumber}: {bookmark.chapterTitle}
                            </h3>
                            {bookmark.isAutomatic && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                Auto
                              </span>
                            )}
                            {bookmark.note && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                Note
                              </span>
                            )}
                          </div>

                          <div className="text-sm text-gray-600 mb-2">
                            Position: {bookmark.position}% • Saved {bookmark.createdAt}
                          </div>

                          {bookmark.note && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                              <div className="font-medium text-yellow-800 mb-1">Your Note:</div>
                              <div className="text-yellow-700">{bookmark.note}</div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookmarkClick(bookmark);
                            }}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                          >
                            Go to
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBookmark(bookmark.id);
                            }}
                            className="bg-red-100 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auto-bookmark indicator (would appear in the reading interface) */}
      <div 
        data-testid="auto-bookmark-indicator" 
        className="fixed bottom-4 left-4 bg-blue-500 text-white p-2 rounded-lg shadow-lg text-sm"
        style={{ display: 'none' }}
      >
        📍 Auto-bookmark saved
      </div>
    </div>
  );
}