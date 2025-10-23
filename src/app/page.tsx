import { HomeFeatures, HomeHero, FeaturedStory } from "@/components/home";
import { MainLayout } from "@/components/layout";
import { db } from '@/lib/db';
import { stories, users, chapters } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Revalidate every 1 hour (3600 seconds)
export const revalidate = 3600;

async function getFeaturedStory() {
  try {
    console.log('🔍 Fetching featured story...');

    // Get all published stories
    const publishedStories = await db
      .select({
        id: stories.id,
        title: stories.title,
        description: stories.description,
        genre: stories.genre,
        viewCount: stories.viewCount,
        rating: stories.rating,
        ratingCount: stories.ratingCount,
        currentWordCount: stories.currentWordCount,
        status: stories.status,
        authorId: users.id,
        authorName: users.name,
        authorUsername: users.username,
        authorImage: users.image,
      })
      .from(stories)
      .leftJoin(users, eq(stories.authorId, users.id))
      .where(eq(stories.status, 'published'))
      .orderBy(desc(stories.rating), desc(stories.viewCount), desc(stories.currentWordCount))
      .limit(10);

    console.log(`📊 Found ${publishedStories.length} published stories`);

    // Filter stories that have at least one published chapter
    for (const story of publishedStories) {
      const publishedChapters = await db
        .select({ id: chapters.id })
        .from(chapters)
        .where(
          and(
            eq(chapters.storyId, story.id),
            eq(chapters.status, 'published')
          )
        );

      if (publishedChapters.length > 0) {
        console.log(`✅ Found featured story: ${story.title} with ${publishedChapters.length} chapters`);

        return {
          id: story.id,
          title: story.title,
          description: story.description || '',
          genre: story.genre || '',
          author: {
            id: story.authorId || '',
            name: story.authorName || 'Anonymous',
            username: story.authorUsername,
            image: story.authorImage,
          },
          stats: {
            viewCount: story.viewCount || 0,
            rating: story.rating ? story.rating / 10 : 0,
            ratingCount: story.ratingCount || 0,
            wordCount: story.currentWordCount || 0,
            chapterCount: publishedChapters.length,
          },
        };
      }
    }

    console.log('⚠️ No featured story found - no published stories with published chapters');
    return null;
  } catch (error) {
    console.error('Error fetching featured story:', error);
    return null;
  }
}

export default async function Home() {
  const featuredStory = await getFeaturedStory();

  return (
    <MainLayout>
      <div className="min-h-screen">
        <FeaturedStory initialStory={featuredStory} />
        <HomeHero />
        <HomeFeatures />
      </div>
    </MainLayout>
  );
}
