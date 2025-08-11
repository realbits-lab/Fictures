'use client';

import React from 'react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  progress?: number;
  target?: number;
  category: 'reading-milestones' | 'genre-explorer' | 'consistency-badges' | 'special-achievements';
}

// Mock data for GREEN phase implementation
const mockAchievements: Achievement[] = [
  // Reading Milestones
  {
    id: 'first-story-badge',
    title: 'First Story',
    description: 'Complete your first story',
    icon: '📖',
    isUnlocked: true,
    category: 'reading-milestones'
  },
  {
    id: 'ten-stories-badge',
    title: 'Story Explorer',
    description: 'Complete 10 stories',
    icon: '📚',
    isUnlocked: false,
    progress: 7,
    target: 10,
    category: 'reading-milestones'
  },
  {
    id: 'hundred-stories-badge',
    title: 'Library Master',
    description: 'Complete 100 stories',
    icon: '🏛️',
    isUnlocked: false,
    progress: 23,
    target: 100,
    category: 'reading-milestones'
  },
  {
    id: 'speed-reader-badge',
    title: 'Speed Reader',
    description: 'Read at 250+ WPM',
    icon: '⚡',
    isUnlocked: true,
    category: 'reading-milestones'
  },

  // Genre Explorer
  {
    id: 'fantasy-explorer',
    title: 'Fantasy Explorer',
    description: 'Read 10 fantasy stories',
    icon: '🐉',
    isUnlocked: true,
    category: 'genre-explorer'
  },
  {
    id: 'scifi-pioneer',
    title: 'Sci-Fi Pioneer',
    description: 'Read 10 science fiction stories',
    icon: '🚀',
    isUnlocked: false,
    progress: 6,
    target: 10,
    category: 'genre-explorer'
  },

  // Consistency Badges
  {
    id: 'weekly-reader',
    title: 'Weekly Reader',
    description: 'Read for 7 consecutive days',
    icon: '📅',
    isUnlocked: true,
    category: 'consistency-badges'
  },
  {
    id: 'monthly-devotee',
    title: 'Monthly Devotee',
    description: 'Read every day for a month',
    icon: '🗓️',
    isUnlocked: false,
    progress: 12,
    target: 30,
    category: 'consistency-badges'
  },

  // Special Achievements
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Read after midnight',
    icon: '🦉',
    isUnlocked: true,
    category: 'special-achievements'
  },
  {
    id: 'marathon-reader',
    title: 'Marathon Reader',
    description: 'Read for 6 hours straight',
    icon: '🏃',
    isUnlocked: false,
    progress: 3,
    target: 6,
    category: 'special-achievements'
  }
];

export default function AchievementsPage() {
  const categories = [
    { id: 'reading-milestones', title: 'Reading Milestones', testId: 'reading-milestones' },
    { id: 'genre-explorer', title: 'Genre Explorer', testId: 'genre-explorer' },
    { id: 'consistency-badges', title: 'Consistency Badges', testId: 'consistency-badges' },
    { id: 'special-achievements', title: 'Special Achievements', testId: 'special-achievements' }
  ];

  const getAchievementsByCategory = (categoryId: string) => {
    return mockAchievements.filter(achievement => achievement.category === categoryId);
  };

  const renderAchievement = (achievement: Achievement) => {
    const progressPercentage = achievement.progress && achievement.target 
      ? (achievement.progress / achievement.target) * 100 
      : 0;

    return (
      <div
        key={achievement.id}
        data-testid={achievement.id}
        className={`p-4 rounded-lg border ${
          achievement.isUnlocked 
            ? 'bg-yellow-50 border-yellow-200' 
            : 'bg-gray-50 border-gray-200'
        }`}
      >
        <div className="flex items-start space-x-3">
          <div className={`text-3xl ${achievement.isUnlocked ? '' : 'opacity-50'}`}>
            {achievement.icon}
          </div>
          <div className="flex-1">
            <h4 className={`font-semibold ${achievement.isUnlocked ? 'text-yellow-800' : 'text-gray-600'}`}>
              {achievement.title}
            </h4>
            <p className={`text-sm ${achievement.isUnlocked ? 'text-yellow-700' : 'text-gray-500'}`}>
              {achievement.description}
            </p>
            
            {!achievement.isUnlocked && achievement.progress !== undefined && achievement.target && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span data-testid="progress-text" className="text-xs text-gray-600">
                    {achievement.progress}/{achievement.target}
                  </span>
                  <span className="text-xs text-gray-600">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <div 
                  data-testid="progress-bar" 
                  className="w-full bg-gray-200 rounded-full h-2"
                >
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {achievement.isUnlocked && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Unlocked
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div data-testid="achievements-page" className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Achievements</h1>
        <p className="text-gray-600">
          Track your reading progress and unlock badges as you explore new stories!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {mockAchievements.filter(a => a.isUnlocked).length}
          </div>
          <div className="text-sm text-gray-600">Unlocked</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-blue-600">
            {mockAchievements.filter(a => !a.isUnlocked && a.progress).length}
          </div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-gray-600">
            {mockAchievements.length}
          </div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-green-600">
            {Math.round((mockAchievements.filter(a => a.isUnlocked).length / mockAchievements.length) * 100)}%
          </div>
          <div className="text-sm text-gray-600">Completion</div>
        </div>
      </div>

      {categories.map((category) => (
        <div key={category.id} data-testid={category.testId} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{category.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getAchievementsByCategory(category.id).map(renderAchievement)}
          </div>
        </div>
      ))}

      {mockAchievements.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No achievements yet</h3>
          <p className="text-gray-500">Start reading stories to unlock your first achievements!</p>
        </div>
      )}
    </div>
  );
}