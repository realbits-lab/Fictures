import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getStoryById, getStoryWithStructure } from '@/lib/db/queries';
import { MainLayout } from '@/components/layout';
import { ChapterReader } from '@/components/reading/ChapterReader';

interface ReadPageProps {
  params: Promise<{ id: string }>;
}

async function StoryReader({ storyId }: { storyId: string }) {
  const session = await auth();
  
  // Get story with full structure (parts, chapters, scenes)
  const storyWithStructure = await getStoryWithStructure(storyId, session?.user?.id);
  if (!storyWithStructure) {
    notFound();
  }

  // Only show published stories in read mode
  if (storyWithStructure.status !== 'published' && storyWithStructure.userId !== session?.user?.id) {
    notFound();
  }

  const isOwner = storyWithStructure.userId === session?.user?.id;

  return <ChapterReader story={storyWithStructure} isOwner={isOwner} />;
}

export default async function ReadPage({ params }: ReadPageProps) {
  const { id } = await params;

  return (
    <MainLayout>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Suspense fallback={
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-8 w-3/4"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        }>
          <StoryReader storyId={id} />
        </Suspense>
      </div>
    </MainLayout>
  );
}