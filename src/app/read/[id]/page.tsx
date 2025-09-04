import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getStoryById, getStoryChapters } from '@/lib/db/queries';
import { MainLayout } from '@/components/layout';

interface ReadPageProps {
  params: Promise<{ id: string }>;
}

async function StoryReader({ storyId }: { storyId: string }) {
  const session = await auth();
  
  // Get story details
  const story = await getStoryById(storyId, session?.user?.id);
  if (!story) {
    notFound();
  }

  // Only show published stories in read mode
  if (story.status !== 'published' && story.userId !== session?.user?.id) {
    notFound();
  }

  // Get chapters for the story
  const chapters = await getStoryChapters(storyId, session?.user?.id);

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Story Header */}
      <header className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {story.title}
        </h1>
        {story.description && (
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            {story.description}
          </p>
        )}
        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
            {story.genre || 'No genre'}
          </span>
          <span>📝 {story.wordCount || 0} words</span>
          <span>📚 {chapters.length} chapters</span>
        </div>
      </header>

      {/* Story Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {chapters.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              This story hasn't been written yet.
            </p>
          </div>
        ) : (
          chapters.map((chapter) => (
            <section key={chapter.id} className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                Chapter {chapter.orderIndex}: {chapter.title}
              </h2>
              <div className="whitespace-pre-wrap leading-relaxed">
                {chapter.content || (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    This chapter is empty.
                  </p>
                )}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Story Footer */}
      <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Written by {story.userId === session?.user?.id ? 'You' : 'Author'} • 
          Published on Fictures
        </p>
      </footer>
    </article>
  );
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