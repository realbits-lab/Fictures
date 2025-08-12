'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface ForumThread {
  id: string;
  title: string;
  author: string;
  postCount: number;
  lastPostTime: string;
  isPinned: boolean;
}

export default function CategoryPage() {
  const params = useParams();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [showCreateThread, setShowCreateThread] = useState(false);

  useEffect(() => {
    // Mock data for threads
    setThreads([
      {
        id: '1',
        title: 'Welcome to the community!',
        author: 'Admin',
        postCount: 5,
        lastPostTime: '2 hours ago',
        isPinned: true,
      },
      {
        id: '2',
        title: 'Tips for new writers',
        author: 'AuthorGuru',
        postCount: 12,
        lastPostTime: '1 day ago',
        isPinned: false,
      },
    ]);
  }, [params.categorySlug]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div data-testid="category-header" className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">General Discussion</h1>
        <p className="text-gray-600 mt-2">General discussion about writing and stories</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-500">
          {threads.length} threads
        </div>
        <button
          data-testid="create-thread-button"
          onClick={() => setShowCreateThread(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          New Thread
        </button>
      </div>

      <div className="space-y-2">
        {threads.map((thread) => (
          <div key={thread.id} data-testid="thread-item" className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  {thread.isPinned && (
                    <span className="text-yellow-500 text-sm">📌</span>
                  )}
                  <h3 data-testid="thread-title" className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                    {thread.title}
                  </h3>
                </div>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span data-testid="thread-author">by {thread.author}</span>
                  <span data-testid="thread-post-count">{thread.postCount} posts</span>
                  <span data-testid="thread-last-post">Last: {thread.lastPostTime}</span>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-800">
                View →
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateThread && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Create New Thread</h2>
            <form data-testid="create-thread-form">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thread Title
                </label>
                <input
                  data-testid="thread-title"
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter thread title"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  data-testid="thread-content"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={6}
                  placeholder="Write your post content here..."
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  data-testid="thread-tags"
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  data-testid="create-thread-submit"
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowCreateThread(false);
                    // Simulate navigation to new thread
                    window.history.pushState({}, '', `/community/forums/general/test-thread-slug`);
                  }}
                >
                  Create Thread
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateThread(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}