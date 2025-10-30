'use client';

import { useState, useRef } from 'react';
import { createResearchItem, ResearchItem } from '@/lib/hooks/use-research';

interface ResearchCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (item: ResearchItem) => void;
}

export default function ResearchCreateDialog({
  isOpen,
  onClose,
  onCreated,
}: ResearchCreateDialogProps) {
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Only accept HTML files
      if (file.type === 'text/html' || file.name.endsWith('.html')) {
        setSelectedFile(file);
        setError(null);
        // Extract title from filename (remove .html extension)
        const fileName = file.name.replace(/\.html$/, '');
        setTitle(fileName);
      } else {
        setError('Please select an HTML file');
        setSelectedFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedFile) {
      setError('Please select an HTML file');
      return;
    }

    setIsCreating(true);

    try {
      // Read file content
      const content = await selectedFile.text();

      const newItem = await createResearchItem({
        title,
        content,
      });

      onCreated(newItem);
      onClose();

      // Reset form
      setTitle('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create research item');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (isCreating) return;
    onClose();
    setError(null);
    setTitle('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">Create Research Item</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* File Selection */}
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
              HTML File <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              id="file"
              accept=".html,text/html"
              onChange={handleFileSelect}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">
              Select an HTML file to upload
            </p>
            {selectedFile && (
              <p className="text-xs text-green-600 mt-1">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              placeholder="Enter research title"
            />
            <p className="text-xs text-gray-500 mt-1">
              Title will be auto-filled from filename, but you can edit it
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !title.trim() || !selectedFile}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
