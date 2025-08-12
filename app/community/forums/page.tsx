'use client';

import { useState, useEffect } from 'react';

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  threadCount: number;
  postCount: number;
}

export default function ForumsPage() {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    // Mock data for now - in real app, fetch from API
    setCategories([
      {
        id: '1',
        name: 'General Discussion',
        description: 'General discussion about writing and stories',
        threadCount: 42,
        postCount: 256,
      },
      {
        id: '2',
        name: 'Writing Help',
        description: 'Get help with your writing questions',
        threadCount: 18,
        postCount: 89,
      },
    ]);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Forums</h1>
          <p className="text-gray-600 mt-2">Connect and discuss with the community</p>
        </div>
        <button
          data-testid="create-category-button"
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Category
        </button>
      </div>

      <div data-testid="forum-categories" className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} data-testid="category-card" className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 data-testid="category-name" className="text-xl font-semibold text-gray-900 mb-2">
                  {category.name}
                </h3>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <div className="flex space-x-6 text-sm text-gray-500">
                  <span data-testid="thread-count">{category.threadCount} threads</span>
                  <span data-testid="post-count">{category.postCount} posts</span>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-800">
                View Threads →
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div data-testid="create-category-modal" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Category</h2>
            <form>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  data-testid="category-name"
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter category name"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  data-testid="category-description"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Enter category description"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Category
                </label>
                <select data-testid="category-parent" className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="">None</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="flex items-center">
                  <input data-testid="category-visible" type="checkbox" className="mr-2" defaultChecked />
                  <span className="text-sm text-gray-700">Visible to all users</span>
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  data-testid="create-category-submit"
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowCreateModal(false);
                    // Show success message
                    const successDiv = document.createElement('div');
                    successDiv.setAttribute('data-testid', 'success-message');
                    successDiv.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
                    successDiv.textContent = 'Category created successfully!';
                    document.body.appendChild(successDiv);
                    setTimeout(() => document.body.removeChild(successDiv), 3000);
                  }}
                >
                  Create Category
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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