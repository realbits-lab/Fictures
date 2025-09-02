"use client";

import React from "react";

export function BrowseHero() {
  return (
    <div className="bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-950 py-16">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            <span className="text-5xl md:text-7xl">🔍</span>
            <br />
            Explore <span className="text-purple-600 dark:text-purple-400">Stories</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            Discover captivating stories, follow your favorite authors, and immerse yourself 
            in worlds crafted by our creative community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="text-2xl">📚</span>
              <span className="font-medium">Thousands of Stories</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="text-2xl">✨</span>
              <span className="font-medium">AI-Enhanced</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="text-2xl">🌍</span>
              <span className="font-medium">Global Community</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}