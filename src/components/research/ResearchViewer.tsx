'use client';

import { useState } from 'react';
import { useResearchItem, deleteResearchItem } from '@/lib/hooks/use-research';
import { formatDistanceToNow } from 'date-fns';

interface ResearchViewerProps {
  selectedId: string | null;
  onDelete: () => void;
  canDelete: boolean;
}

export default function ResearchViewer({ selectedId, onDelete, canDelete }: ResearchViewerProps) {
  const { item, isLoading } = useResearchItem(selectedId);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!selectedId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">No research item selected</p>
          <p className="text-sm">Select an item from the list to view</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Research item not found</p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this research item?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteResearchItem(item.id);
      onDelete();
    } catch (error) {
      console.error('Failed to delete research item:', error);
      alert('Failed to delete research item');
    } finally {
      setIsDeleting(false);
    }
  };

  // View mode
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>By {item.author.name || 'Unknown'}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                <span>•</span>
                <span>{item.viewCount} views</span>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <div
            className="prose prose-lg max-w-none text-gray-900"
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        </div>
      </div>
    </div>
  );
}
