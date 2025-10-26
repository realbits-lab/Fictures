import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hasAnyRole } from '@/lib/auth/permissions';
import { MainLayout } from '@/components/layout';
import { ComicReaderClient } from '@/components/comic/comic-reader-client';
import { getStoryWithStructure } from '@/lib/db/cached-queries';
import { notFound } from 'next/navigation';

interface ComicPageProps {
  params: Promise<{ id: string }>;
}

export default async function ComicPage({ params }: ComicPageProps) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (!hasAnyRole(session, ['writer', 'manager'])) {
    redirect('/');
  }

  const pageLoadStart = Date.now();
  console.log('\n🎨 [SSR] ComicPage loading started');

  const { id } = await params;
  console.log(`🎨 [SSR] Loading story for comic: ${id}`);

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
  console.log(`🏁 [SSR] ComicPage rendering complete in ${pageLoadDuration}ms\n`);

  return (
    <MainLayout>
      <ComicReaderClient storyId={id} initialData={story} />
    </MainLayout>
  );
}
