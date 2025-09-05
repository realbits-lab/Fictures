import { MainLayout } from '@/components/layout';
import { ChapterReaderClient } from '@/components/reading/ChapterReaderClient';

interface ReadPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReadPage({ params }: ReadPageProps) {
  const { id } = await params;

  return (
    <MainLayout>
      <ChapterReaderClient storyId={id} />
    </MainLayout>
  );
}