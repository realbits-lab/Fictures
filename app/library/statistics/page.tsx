'use client';

import React from 'react';

// Mock data for GREEN phase implementation
const mockStatistics = {
  totalReadingTime: { hours: 45, minutes: 23 },
  dailyReadingTime: { hours: 1, minutes: 15 },
  weeklyReadingTime: { hours: 8, minutes: 45 },
  readingStreak: 12,
  storiesCompleted: 23,
  chaptersRead: 156,
  wordsRead: 234567,
  wordsPerMinute: 210,
  favoriteGenres: [
    { genre: 'Fantasy', percentage: 45 },
    { genre: 'Science Fiction', percentage: 30 },
    { genre: 'Romance', percentage: 15 },
    { genre: 'Mystery', percentage: 10 }
  ],
  readingGoals: {
    storiesThisYear: { current: 23, target: 50 },
    readingTimeThisMonth: { current: 15, target: 20 }
  }
};

export default function ReadingStatisticsPage() {
  const formatTime = (time: { hours: number; minutes: number }) => {
    return `${time.hours}h ${time.minutes}m`;
  };

  return (
    <div data-testid="reading-statistics-page" className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Reading Statistics</h1>

      {/* Reading Time Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Reading Time</h3>
          <div data-testid="total-reading-time" className="text-2xl font-bold text-blue-600">
            {formatTime(mockStatistics.totalReadingTime)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Daily Average</h3>
          <div data-testid="daily-reading-time" className="text-2xl font-bold text-green-600">
            {formatTime(mockStatistics.dailyReadingTime)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">This Week</h3>
          <div data-testid="weekly-reading-time" className="text-2xl font-bold text-purple-600">
            {formatTime(mockStatistics.weeklyReadingTime)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Reading Streak</h3>
          <div data-testid="reading-streak" className="text-2xl font-bold text-orange-600">
            {mockStatistics.readingStreak} days
          </div>
        </div>
      </div>

      {/* Story Completion Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Stories Completed</h3>
          <div data-testid="stories-completed" className="text-3xl font-bold text-indigo-600">
            {mockStatistics.storiesCompleted}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Chapters Read</h3>
          <div data-testid="chapters-read" className="text-3xl font-bold text-teal-600">
            {mockStatistics.chaptersRead}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Words Read</h3>
          <div data-testid="words-read" className="text-3xl font-bold text-red-600">
            {mockStatistics.wordsRead.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Reading Pace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Reading Pace</h3>
          <div data-testid="reading-pace-chart" className="h-40 bg-gray-100 rounded flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                📊
              </div>
              <div className="text-sm text-gray-600">Reading pace chart</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div data-testid="words-per-minute" className="text-xl font-semibold">
              {mockStatistics.wordsPerMinute} words per minute
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Favorite Genres</h3>
          <div data-testid="favorite-genres-chart" className="space-y-3">
            {mockStatistics.favoriteGenres.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-medium">{item.genre}</span>
                <div className="flex items-center space-x-2 flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 min-w-0">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goals and Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div data-testid="reading-goals-section" className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Reading Goals</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Stories This Year</span>
                <span className="text-sm text-gray-600">
                  {mockStatistics.readingGoals.storiesThisYear.current} / {mockStatistics.readingGoals.storiesThisYear.target}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full" 
                  style={{ 
                    width: `${(mockStatistics.readingGoals.storiesThisYear.current / mockStatistics.readingGoals.storiesThisYear.target) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Hours This Month</span>
                <span className="text-sm text-gray-600">
                  {mockStatistics.readingGoals.readingTimeThisMonth.current} / {mockStatistics.readingGoals.readingTimeThisMonth.target}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full" 
                  style={{ 
                    width: `${(mockStatistics.readingGoals.readingTimeThisMonth.current / mockStatistics.readingGoals.readingTimeThisMonth.target) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div data-testid="achievements-section" className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Achievements</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl">🏆</div>
              <div>
                <div className="font-medium">Speed Reader</div>
                <div className="text-sm text-gray-600">Read 10 chapters in one day</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="text-2xl">📚</div>
              <div>
                <div className="font-medium">Bookworm</div>
                <div className="text-sm text-gray-600">Completed 20 stories</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl">🔥</div>
              <div>
                <div className="font-medium">Streak Master</div>
                <div className="text-sm text-gray-600">10-day reading streak</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}