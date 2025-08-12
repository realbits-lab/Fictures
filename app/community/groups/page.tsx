'use client';

import { useState, useEffect } from 'react';

interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  memberCount: number;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    // Mock data
    setGroups([
      {
        id: '1',
        name: 'Fantasy Writers Guild',
        description: 'A community for fantasy writers to share and improve',
        category: 'writing',
        type: 'public',
        memberCount: 156,
      },
      {
        id: '2',
        name: 'Sci-Fi Readers Circle',
        description: 'Discuss and review science fiction literature',
        category: 'reading',
        type: 'public',
        memberCount: 89,
      },
    ]);
  }, []);

  const filteredGroups = groups.filter(group => {
    const categoryMatch = categoryFilter === 'all' || group.category === categoryFilter;
    const typeMatch = typeFilter === 'all' || group.type === typeFilter;
    return categoryMatch && typeMatch;
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600 mt-2">Find and join communities that share your interests</p>
        </div>
        <button
          data-testid="create-group-button"
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Group
        </button>
      </div>

      <div data-testid="groups-filters" className="mb-6 flex space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            data-testid="category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Categories</option>
            <option value="writing">Writing</option>
            <option value="reading">Reading</option>
            <option value="genre">Genre</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            data-testid="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Types</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="invite-only">Invite Only</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <div key={group.id} data-testid="group-card" className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="mb-4">
              <h3 data-testid="group-name" className="text-xl font-semibold text-gray-900 mb-2">
                {group.name}
              </h3>
              <p className="text-gray-600 text-sm mb-3">{group.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span data-testid="group-category" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {group.category}
                </span>
                <span data-testid="group-type" className="text-gray-500 capitalize">
                  {group.type}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span data-testid="group-member-count" className="text-sm text-gray-500">
                {group.memberCount} members
              </span>
              <button className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700">
                View Group
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div data-testid="create-group-modal" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Group</h2>
            <form>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                <input
                  data-testid="group-name"
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter group name"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  data-testid="group-description"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Describe your group"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select data-testid="group-type" className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="invite-only">Invite Only</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select data-testid="group-category" className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="writing">Writing</option>
                  <option value="reading">Reading</option>
                  <option value="genre">Genre</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <input
                  data-testid="group-tags"
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="writing, fantasy, community"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Member Limit</label>
                <input
                  data-testid="group-member-limit"
                  type="number"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="100"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  data-testid="create-group-submit"
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowCreateModal(false);
                    // Simulate navigation to new group
                    window.history.pushState({}, '', '/community/groups/test-writing-group');
                  }}
                >
                  Create Group
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