import React from 'react';
import { notFound } from 'next/navigation';
import ContentTree from '@/components/books/hierarchy/content-tree';
import HierarchyBreadcrumb from '@/components/books/hierarchy/hierarchy-breadcrumb';
import SceneEditor from '@/components/books/writing/scene-editor';
import AIContextPanel from '@/components/books/writing/ai-context-panel';
import LevelSwitcher from '@/components/books/navigation/level-switcher';
import QuickJump from '@/components/books/navigation/quick-jump';

interface PageProps {
  params: {
    bookId: string;
    storyId: string;
    partId: string;
    chapterId: string;
    sceneId: string;
  };
}

// Mock data for level switcher (in real app, this would come from API)
const mockLevelData = {
  currentLevel: 'scene',
  currentPath: '',
  availableLevels: [
    {
      level: 'book' as const,
      title: 'Book',
      path: '/books/[bookId]',
      isActive: false,
      description: 'Book overview and story management'
    },
    {
      level: 'story' as const,
      title: 'Story',
      path: '/books/[bookId]/stories/[storyId]',
      isActive: false,
      description: 'Story arc and character development'
    },
    {
      level: 'part' as const,
      title: 'Part',
      path: '/books/[bookId]/stories/[storyId]/parts/[partId]',
      isActive: false,
      description: 'Thematic focus'
    },
    {
      level: 'chapter' as const,
      title: 'Chapter',
      path: '/books/[bookId]/stories/[storyId]/parts/[partId]/chapters/[chapterId]',
      isActive: false,
      description: 'Chapter summary and scene management'
    },
    {
      level: 'scene' as const,
      title: 'Scene',
      path: '/books/[bookId]/stories/[storyId]/parts/[partId]/chapters/[chapterId]/scenes/[sceneId]/write',
      isActive: true,
      description: 'Scene writing and editing'
    }
  ]
};

export default async function SceneWritePage({ params }: PageProps) {
  const { bookId, storyId, partId, chapterId, sceneId } = await params;

  // In a real application, you would validate these parameters
  // and fetch initial data here
  if (!bookId || !storyId || !partId || !chapterId || !sceneId) {
    notFound();
  }

  // Update level data with actual IDs
  const levelData = {
    ...mockLevelData,
    currentPath: `/books/${bookId}/stories/${storyId}/parts/${partId}/chapters/${chapterId}/scenes/${sceneId}/write`,
    availableLevels: mockLevelData.availableLevels.map(level => ({
      ...level,
      path: level.path
        .replace('[bookId]', bookId)
        .replace('[storyId]', storyId)
        .replace('[partId]', partId)
        .replace('[chapterId]', chapterId)
        .replace('[sceneId]', sceneId)
    }))
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Content Tree */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <QuickJump bookId={bookId} className="mb-4" />
          <LevelSwitcher levelData={levelData} className="mb-4" />
        </div>
        <div className="flex-1 overflow-auto">
          <ContentTree bookId={bookId} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-white p-4">
          <HierarchyBreadcrumb
            bookId={bookId}
            storyId={storyId}
            partId={partId}
            chapterId={chapterId}
            sceneId={sceneId}
          />
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex">
          <div className="flex-1">
            <SceneEditor
              bookId={bookId}
              storyId={storyId}
              partId={partId}
              chapterId={chapterId}
              sceneId={sceneId}
            />
          </div>

          {/* Right Sidebar - AI Context */}
          <div className="border-l">
            <AIContextPanel
              bookId={bookId}
              storyId={storyId}
              partId={partId}
              chapterId={chapterId}
              sceneId={sceneId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}