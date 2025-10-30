'use client';

import { useState } from 'react';
import { useResearchItem, deleteResearchItem, updateResearchItem } from '@/lib/hooks/use-research';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';

interface ResearchViewerProps {
  selectedId: string | null;
  onDelete: () => void;
  canDelete: boolean;
}

export default function ResearchViewer({ selectedId, onDelete, canDelete }: ResearchViewerProps) {
  const { item, isLoading, mutate } = useResearchItem(selectedId);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const handleEdit = () => {
    if (!item) return;
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditTags(item.tags ? item.tags.join(', ') : '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle('');
    setEditContent('');
    setEditTags('');
  };

  const handleSave = async () => {
    if (!item) return;

    setIsSaving(true);
    try {
      const tagsArray = editTags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await updateResearchItem(item.id, {
        title: editTitle,
        content: editContent,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      });

      await mutate(); // Refresh the data
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update research item:', error);
      alert('Failed to update research item');
    } finally {
      setIsSaving(false);
    }
  };

  // Editing mode
  if (isEditing) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-8 py-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Research Item</h2>

            {/* Title */}
            <div className="mb-4">
              <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter research title"
              />
            </div>

            {/* Tags */}
            <div className="mb-4">
              <label htmlFor="edit-tags" className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                id="edit-tags"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Comma-separated tags (e.g., AI, Research, Analysis)"
              />
              <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !editTitle.trim() || !editContent.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-8">
            <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 mb-1">
              Content (Markdown) <span className="text-red-500">*</span>
            </label>
            <textarea
              id="edit-content"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              required
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Enter your research content in Markdown format..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Supports Markdown formatting (headings, lists, code blocks, etc.)
            </p>
          </div>
        </div>
      </div>
    );
  }

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
                <>
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </>
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
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown>{item.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
