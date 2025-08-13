import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/app/auth';
import { db } from '@/lib/db/drizzle';
import { story } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import ChapterWriteLayout from '@/components/chapter/chapter-write-layout';

interface ChapterWritePageProps {
  params: {
    id: string;
    chapterNumber: string;
  };
}

// Loading component for the chapter write interface
function ChapterWriteLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Loading Chapter Editor</h2>
        <p className="text-gray-500">Setting up your writing workspace...</p>
      </div>
    </div>
  );
}

export default async function ChapterWritePage({ params }: ChapterWritePageProps) {
  const { id: storyId, chapterNumber } = await params;

  // Validate chapter number
  const chapterNum = parseInt(chapterNumber, 10);
  if (isNaN(chapterNum) || chapterNum <= 0) {
    notFound();
  }

  // Check authentication
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  try {
    // Check if story exists and user owns it
    const storyResult = await db
      .select({
        id: story.id,
        title: story.title,
        authorId: story.authorId,
      })
      .from(story)
      .where(eq(story.id, storyId))
      .limit(1);

    if (storyResult.length === 0) {
      notFound();
    }

    const storyData = storyResult[0];

    // Check ownership
    if (storyData.authorId !== session.user.id) {
      redirect('/stories');
    }

    return (
      <div className="min-h-screen">
        <Suspense fallback={<ChapterWriteLoading />}>
          <ChapterWriteLayout 
            storyId={storyId} 
            chapterNumber={chapterNum} 
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Chapter write page error:', error);
    notFound();
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: ChapterWritePageProps) {
  const { id: storyId, chapterNumber } = await params;
  
  try {
    const storyResult = await db
      .select({
        title: story.title,
      })
      .from(story)
      .where(eq(story.id, storyId))
      .limit(1);

    if (storyResult.length === 0) {
      return {
        title: 'Chapter Not Found',
      };
    }

    const storyData = storyResult[0];

    return {
      title: `Writing Chapter ${chapterNumber} - ${storyData.title}`,
      description: `Write and edit Chapter ${chapterNumber} of ${storyData.title}`,
    };
  } catch (error) {
    return {
      title: 'Chapter Writer',
      description: 'Write and edit your chapter',
    };
  }
}