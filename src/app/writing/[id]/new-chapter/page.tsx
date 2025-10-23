import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getStoryById, createFirstChapter } from '@/lib/db/queries';

interface NewChapterPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function NewChapterPage({ params }: NewChapterPageProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/');
  }

  const { id } = await params;

  // Verify user owns the story
  const story = await getStoryById(id, session.user.id);
  if (!story || story.authorId !== session.user.id) {
    redirect('/stories');
  }

  // Create the first chapter
  const chapter = await createFirstChapter(id, session.user.id);

  // Redirect to the chapter editor
  redirect(`/writing/edit/${chapter.id}`);
}