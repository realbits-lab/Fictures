import Link from 'next/link';
import { Button } from '@/components/ui';

interface FeaturedStoryData {
  id: string;
  title: string;
  description: string;
  genre: string;
  author: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
  stats: {
    viewCount: number;
    rating: number;
    ratingCount: number;
    wordCount: number;
    chapterCount: number;
  };
}

interface FeaturedStoryProps {
  initialStory: FeaturedStoryData | null;
}

export function FeaturedStory({ initialStory }: FeaturedStoryProps) {
  if (!initialStory) {
    return null;
  }

  const story = initialStory;

  return (
    <section className="pt-24 pb-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Start Reading Today
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
            Dive into our featured story and begin your adventure
          </p>
        </div>

        {/* Featured Story Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">
            {/* Left: Story Info */}
            <div className="flex flex-col justify-center">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium mb-4">
                  <span>📖</span>
                  <span>{story.genre}</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {story.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                  {story.description}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  by <span className="font-semibold text-gray-700 dark:text-gray-300">{story.author.name}</span>
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {story.stats.chapterCount}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Chapters
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {(story.stats.wordCount / 1000).toFixed(0)}k
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Words
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {story.stats.viewCount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Views
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {story.stats.rating > 0 ? story.stats.rating.toFixed(1) : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Rating {story.stats.ratingCount > 0 && `(${story.stats.ratingCount})`}
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={`/reading/${story.id}`} className="flex-1">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all hover:scale-105">
                    <span className="mr-2">📚</span>
                    Start Reading
                  </Button>
                </Link>
                <Link href="/reading" className="flex-1">
                  <Button variant="outline" className="w-full py-3 px-6 rounded-lg">
                    Browse More Stories
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="hidden md:flex items-center justify-center">
              <div className="relative w-full h-full min-h-[400px]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-xl opacity-20 animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl mb-4">📖</div>
                    <div className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {story.stats.chapterCount}
                    </div>
                    <div className="text-xl text-gray-600 dark:text-gray-400">
                      Chapters to Explore
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-8">
          <p className="text-gray-600 dark:text-gray-400">
            Join thousands of readers discovering amazing stories
          </p>
        </div>
      </div>
    </section>
  );
}
