import { MainLayout } from '@/components/layout';
import { WebtoonReaderClient } from '@/components/webtoon/webtoon-reader-client';
import { getStoryWithStructure } from '@/lib/db/cached-queries';
import { notFound } from 'next/navigation';

interface WebtoonPageProps {
  params: Promise<{ id: string }>;
}

export default async function WebtoonPage({ params }: WebtoonPageProps) {
  const pageLoadStart = Date.now();
  console.log('\n🎨 [SSR] WebtoonPage loading started');

  const { id } = await params;
  console.log(`🎨 [SSR] Loading story for webtoon: ${id}`);

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
  console.log(`🏁 [SSR] WebtoonPage rendering complete in ${pageLoadDuration}ms\n`);

  return (
    <MainLayout>
      <WebtoonReaderClient storyId={id} initialData={story} />
    </MainLayout>
  );
}
