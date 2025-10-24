"use client";

import Link from 'next/link';

const genres = [
  { name: 'Fantasy', icon: '🧙', gradient: 'from-purple-500 to-pink-500', count: 0 },
  { name: 'Science Fiction', icon: '🚀', gradient: 'from-blue-500 to-cyan-500', count: 0 },
  { name: 'Romance', icon: '💖', gradient: 'from-pink-500 to-rose-500', count: 0 },
  { name: 'Mystery', icon: '🔍', gradient: 'from-indigo-500 to-purple-500', count: 0 },
  { name: 'Detective', icon: '🕵️', gradient: 'from-gray-700 to-gray-900', count: 0 },
  { name: 'Adventure', icon: '🗺️', gradient: 'from-green-500 to-emerald-500', count: 0 },
  { name: 'Thriller', icon: '⚡', gradient: 'from-red-500 to-orange-500', count: 0 },
];

interface GenreBrowserProps {
  genreCounts?: Record<string, number>;
}

export function GenreBrowser({ genreCounts = {} }: GenreBrowserProps) {
  return (
    <section className="py-16 bg-gradient-to-b from-[rgb(var(--background))] to-[rgb(var(--muted)/30%)]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--foreground))] mb-4">
            📚 Explore Genres
          </h2>
          <p className="text-xl text-[rgb(var(--muted-foreground))] max-w-2xl mx-auto">
            Find your next favorite story by genre
          </p>
        </div>

        {/* Genre Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
          {genres.map((genre) => {
            const count = genreCounts[genre.name] || genre.count;
            return (
              <Link
                key={genre.name}
                href={`/reading?genre=${encodeURIComponent(genre.name)}`}
                className="group"
              >
                <div className="relative overflow-hidden rounded-xl p-6 text-center transition-all hover:scale-105 hover:shadow-2xl cursor-pointer">
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${genre.gradient} opacity-90 group-hover:opacity-100 transition-opacity`}></div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                      {genre.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {genre.name}
                    </h3>
                    {count > 0 && (
                      <p className="text-sm text-white/80">
                        {count} {count === 1 ? 'story' : 'stories'}
                      </p>
                    )}
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Browse All Link */}
        <div className="text-center mt-10">
          <Link
            href="/reading"
            className="inline-flex items-center text-[rgb(var(--primary))] hover:underline text-lg font-medium"
          >
            Browse All Stories
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
