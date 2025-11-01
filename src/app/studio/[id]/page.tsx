import { MainLayout } from "@/components/layout";
import { StoryOverview } from "@/components/story/StoryOverview";
import { auth } from "@/lib/auth";
import { getStoryById } from "@/lib/db/queries";
import { redirect } from "next/navigation";

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Check authentication first
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=' + encodeURIComponent(`/stories/${id}`));
  }

  // Fetch the actual story from database
  let story;
  try {
    story = await getStoryById(id);
  } catch (error) {
    console.error('Error fetching story:', error);
    return (
      <MainLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Story</h1>
          <p className="text-gray-600 mt-2">Unable to load the requested story.</p>
        </div>
      </MainLayout>
    );
  }

  if (!story) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-800">Story Not Found</h1>
          <p className="text-gray-600 mt-2">The story you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </MainLayout>
    );
  }

  // Check if user has access to this story (either owner or published story)
  if (story.authorId !== session?.user?.id && story.status !== 'published') {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don&apos;t have permission to view this story.</p>
        </div>
      </MainLayout>
    );
  }

  // Convert database story to expected format for StoryOverview component
  const formattedStory = {
    id: story.id,
    title: story.title,
    genre: story.genre || 'General',
    status: story.status,
    startDate: new Date(story.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    readers: story.viewCount || 0,
    rating: story.rating || 0,
    parts: [] // TODO: Fetch actual parts/chapters data
  };

  return (
    <MainLayout>
      <StoryOverview story={formattedStory} />
    </MainLayout>
  );
}