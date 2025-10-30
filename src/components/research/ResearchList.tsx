'use client';

import { ResearchItem } from '@/lib/hooks/use-research';
import { formatDistanceToNow } from 'date-fns';

interface ResearchListProps {
  items: ResearchItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateClick: () => void;
  isLoading: boolean;
  canCreate: boolean;
}

export default function ResearchList({
  items,
  selectedId,
  onSelect,
  onCreateClick,
  isLoading,
  canCreate,
}: ResearchListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Research</h1>
          {canCreate && (
            <button
              onClick={onCreateClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              + New
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-pulse">Loading...</div>
          </div>
        ) : items.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="mb-2">No research items yet</p>
            <p className="text-sm">Click &quot;New&quot; to create your first research note</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  selectedId === item.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </p>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="inline-block px-2 py-0.5 text-gray-500 text-xs">
                        +{item.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
