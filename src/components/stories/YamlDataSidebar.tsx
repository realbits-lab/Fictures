"use client";

import { useState } from 'react';
import { useStoryCreation } from './StoryCreationContext';

export function YamlDataSidebar() {
  const { yamlData } = useStoryCreation();
  const [activeTab, setActiveTab] = useState('story');

  const tabs = [
    { id: 'story', label: 'Story', data: yamlData.storyYaml },
    { id: 'parts', label: 'Parts', data: yamlData.partsYaml },
    { id: 'characters', label: 'Characters', data: yamlData.charactersYaml },
    { id: 'places', label: 'Places', data: yamlData.placesYaml },
  ];

  const hasAnyData = Object.values(yamlData).some(data => data && data.trim().length > 0);

  return (
    <div className="sticky top-8">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Generated YAML Data
        </h3>

        {!hasAnyData ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 min-h-[400px] flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="text-2xl mb-2">📝</div>
              <p>Waiting for story generation...</p>
            </div>
          </div>
        ) : (
          <div>
            {/* Tabs */}
            <div className="flex flex-wrap gap-1 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  {tab.label}
                  {tab.data && tab.data.trim().length > 0 && (
                    <span className="ml-1 w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 min-h-[400px] max-h-[600px] overflow-y-auto">
              <pre className="font-mono text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {tabs.find(tab => tab.id === activeTab)?.data || 'No data generated yet...'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}