import { HomeFeatures, HomeHero, FeaturedStory } from "@/components/home";
import { MainLayout } from "@/components/layout";
import { db } from '@/lib/db';
import { stories, users, chapters } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

// Revalidate every 1 hour (3600 seconds)
export const revalidate = 3600;

async function getFeaturedStory() {
  try {
    // Optimized single query with subquery for chapter count
    // This eliminates N+1 queries and uses a single database round-trip
    const result = await db.execute(sql`
      SELECT
        s.id,
        s.title,
        s.description,
        s.genre,
        s.view_count,
        s.rating,
        s.rating_count,
        s.current_word_count,
        s.status,
        u.id as author_id,
        u.name as author_name,
        u.username as author_username,
        u.image as author_image,
        COUNT(c.id) as chapter_count
      FROM stories s
      LEFT JOIN users u ON s.author_id = u.id
      LEFT JOIN chapters c ON c.story_id = s.id AND c.status = 'published'
      WHERE s.status = 'published'
      GROUP BY s.id, s.title, s.description, s.genre, s.view_count, s.rating,
               s.rating_count, s.current_word_count, s.status,
               u.id, u.name, u.username, u.image
      HAVING COUNT(c.id) > 0
      ORDER BY s.rating DESC NULLS LAST,
               s.view_count DESC NULLS LAST,
               s.current_word_count DESC NULLS LAST
      LIMIT 1
    `);

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as any;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      genre: row.genre,
      author: {
        id: row.author_id,
        name: row.author_name,
        username: row.author_username,
        image: row.author_image,
      },
      stats: {
        viewCount: row.view_count || 0,
        rating: row.rating ? row.rating / 10 : 0,
        ratingCount: row.rating_count || 0,
        wordCount: row.current_word_count || 0,
        chapterCount: Number(row.chapter_count) || 0,
      },
    };
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
