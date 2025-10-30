'use client';

import { useState } from 'react';
import ResearchList from './ResearchList';
import ResearchViewer from './ResearchViewer';
import ResearchCreateDialog from './ResearchCreateDialog';
import { useResearch } from '@/lib/hooks/use-research';

interface ResearchClientProps {
  isManager: boolean;
}

export default function ResearchClient({ isManager }: ResearchClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { items, isLoading, mutate } = useResearch();

  // Auto-select first item if none selected
  if (!selectedId && items.length > 0 && !isLoading) {
    setSelectedId(items[0].id);
  }

  return (
    <>
      <div className="flex h-screen">
        {/* Left Sidebar - Research List */}
        <div className="w-80 border-r border-gray-200 bg-white">
          <ResearchList
            items={items}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCreateClick={() => setIsCreateDialogOpen(true)}
            isLoading={isLoading}
            canCreate={isManager}
          />
        </div>

        {/* Right Panel - Research Viewer */}
        <div className="flex-1 overflow-auto">
          <ResearchViewer
            selectedId={selectedId}
            onDelete={() => {
              // After delete, select the first item if available
              mutate();
              setSelectedId(null);
            }}
            canDelete={isManager}
          />
        </div>
      </div>

      {/* Create Dialog */}
      {isManager && (
        <ResearchCreateDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onCreated={(newItem) => {
            mutate(); // Refresh the list
            setSelectedId(newItem.id); // Select the newly created item
          }}
        />
      )}
    </>
  );
}
