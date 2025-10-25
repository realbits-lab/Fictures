import { MainLayout } from '@/components/layout';
import { ChapterReaderClient } from '@/components/reading/ChapterReaderClient';
import { getStoryWithStructure } from '@/lib/db/cached-queries';
import { notFound } from 'next/navigation';

interface ReadPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReadPage({ params }: ReadPageProps) {
  const pageLoadStart = Date.now();
  console.log('\n🚀 [SSR] ReadPage loading started');

  const { id } = await params;
  console.log(`📖 [SSR] Loading story for reading: ${id}`);

  // Fetch story structure from Redis cache (SSR)
  const ssrFetchStart = Date.now();
  console.log('⏳ [SSR] Fetching story structure from cache...');

  // Load structure only (no scene content) - scenes loaded on-demand
  const story = await getStoryWithStructure(id, false);

  const ssrFetchDuration = Date.now() - ssrFetchStart;
  console.log(`✅ [SSR] Story structure fetched in ${ssrFetchDuration}ms`);

  if (!story) {
    console.log(`❌ [SSR] Story not found: ${id}`);
    notFound();
  }

  const pageLoadDuration = Date.now() - pageLoadStart;
  console.log(`🏁 [SSR] ReadPage rendering complete in ${pageLoadDuration}ms\n`);

  return (
    <MainLayout>
      <ChapterReaderClient storyId={id} initialData={story} />
    </MainLayout>
  );
}