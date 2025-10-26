import { MainLayout } from '@/components/layout';
import { ComicReaderClient } from '@/components/comic/comic-reader-client';
import { getStoryWithComicPanels } from '@/lib/db/cached-queries';
import { notFound } from 'next/navigation';

interface ComicPageProps {
  params: Promise<{ id: string }>;
}

export default async function ComicPage({ params }: ComicPageProps) {
  const pageLoadStart = Date.now();
  console.log('\n🎨 [SSR] ComicPage loading started');

  const { id } = await params;
  console.log(`📚 [SSR] Loading story for comic reading: ${id}`);

  // Fetch story structure from Redis cache (SSR)
  const ssrFetchStart = Date.now();
  console.log('⏳ [SSR] Fetching story structure with published comics from cache...');

  // Load story with comic panels (only published comics) - with caching
  const story = await getStoryWithComicPanels(id);

  const ssrFetchDuration = Date.now() - ssrFetchStart;
  console.log(`✅ [SSR] Story structure fetched in ${ssrFetchDuration}ms`);

  if (!story) {
    console.log(`❌ [SSR] Story not found: ${id}`);
    notFound();
  }

  // Count total comic scenes available
  let totalComicScenes = 0;
  story.parts.forEach(part => {
    part.chapters.forEach(chapter => {
      totalComicScenes += chapter.scenes.length;
    });
  });
  story.chapters.forEach(chapter => {
    totalComicScenes += chapter.scenes.length;
  });

  console.log(`📊 [SSR] Found ${totalComicScenes} published comic scenes`);

  if (totalComicScenes === 0) {
    console.log(`⚠️  [SSR] No published comics available for story: ${id}`);
  }

  const pageLoadDuration = Date.now() - pageLoadStart;
  console.log(`🏁 [SSR] ComicPage rendering complete in ${pageLoadDuration}ms\n`);

  return (
    <MainLayout>
      <ComicReaderClient storyId={id} initialData={story} />
    </MainLayout>
  );
}
