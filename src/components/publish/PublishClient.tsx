"use client";

import React from "react";
import { useSession } from 'next-auth/react';
import { SkeletonLoader } from "@/components/ui";
import { usePublishStatus, usePublishHistory, usePublishAnalytics } from "@/lib/hooks/use-page-cache";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Progress } from "@/components/ui";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Skeleton components for loading states
function PublishingScheduleSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          📅 Publishing Schedule
          <Skeleton height={28} width={120} className="rounded" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton height={20} width={100} className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-center space-y-2">
                  <Skeleton height={20} width={80} />
                  <Skeleton height={16} width={120} />
                  <Skeleton height={12} width={60} />
                  <Skeleton height={20} width={60} className="rounded-full" />
                  <Skeleton height={32} width="100%" className="rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickPublishSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>🚀 Quick Publish</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Skeleton height={24} width="60%" className="mb-4" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton height={14} width={80} />
                <Skeleton height={20} width={60} className="rounded-full" />
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
            <Skeleton height={20} width={60} className="mb-2" />
            <Skeleton height={16} width="90%" />
          </div>

          <div className="space-y-4">
            <div>
              <Skeleton height={20} width={120} className="mb-3" />
              <div className="flex gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton height={16} width={16} className="rounded" />
                    <Skeleton height={14} width={100} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Skeleton height={20} width={140} className="mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton height={16} width={16} className="rounded" />
                    <Skeleton height={14} width={200} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={36} width={80} className="rounded" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle><Skeleton height={24} width={180} /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Skeleton height={20} width={160} className="mb-3" />
              <Skeleton height={14} width={120} className="mb-3" />
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton height={14} width={60} />
                    <Skeleton height={14} width={40} />
                  </div>
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm mb-1">
                  <Skeleton height={14} width={100} />
                  <Skeleton height={14} width={30} />
                </div>
                <Skeleton height={14} width={140} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PublishClient() {
  const { data: session } = useSession();
  const { data: publishStatus, isLoading: statusLoading, error: statusError, mutate: refreshStatus } = usePublishStatus();
  const { data: publishHistory, isLoading: historyLoading, error: historyError } = usePublishHistory();
  const { data: publishAnalytics, isLoading: analyticsLoading, error: analyticsError } = usePublishAnalytics();
  
  const isLoading = statusLoading || historyLoading || analyticsLoading;
  const hasError = statusError || historyError || analyticsError;

  // Show loading state for unauthenticated users
  if (!session?.user?.id) {
    return <div>Please sign in to view your publication center.</div>;
  }

  // Show skeleton loading while fetching
  if (isLoading) {
    return (
      <SkeletonLoader theme="light">
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span>📤</span>
              <Skeleton height={36} width={200} />
            </div>
            <Skeleton height={16} width={300} />
          </div>
          <PublishingScheduleSkeleton />
          <QuickPublishSkeleton />
          <AnalyticsSkeleton />
        </div>
      </SkeletonLoader>
    );
  }

  // Show error state
  if (hasError) {
    const errorMessage = statusError?.message || historyError?.message || analyticsError?.message;
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Failed to load publication data
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {errorMessage || "Something went wrong while loading your publication center."}
        </p>
        <button 
          onClick={() => {
            refreshStatus();
          }} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Publishing Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            📅 Publishing Schedule
            <Button variant="secondary" size="sm">⚙️ Schedule Settings</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">This Week</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(publishStatus?.scheduledItems || []).map((item, index) => (
                <div key={item.id || index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-center space-y-2">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {item.date || `Day ${index + 1}`}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {item.title || `Item ${index + 1}`}
                    </div>
                    <div className="text-xs text-gray-500">⏰ {item.time || 'TBD'}</div>
                    <Badge 
                      variant={item.status === 'ready' ? 'success' : item.status === 'draft' ? 'warning' : 'info'} 
                      size="sm"
                    >
                      {item.status === 'ready' ? '✅ Ready' : 
                       item.status === 'draft' ? '📝 Draft' : 
                       item.status === 'planned' ? '📋 Planned' : '💭 Idea'}
                    </Badge>
                    <Button 
                      size="sm" 
                      className="w-full mt-2"
                      variant={item.status === 'ready' ? 'default' : 'secondary'}
                    >
                      {item.status === 'ready' ? '📤 Publish' : 
                       item.status === 'draft' ? '✏️ Edit' : 
                       item.status === 'planned' ? '📝 Write' : '📋 Plan'}
                    </Button>
                  </div>
                </div>
              ))}

              {/* Fallback static content if no data */}
              {(!publishStatus?.scheduledItems || publishStatus.scheduledItems.length === 0) && (
                <>
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="text-center space-y-2">
                      <div className="font-medium text-gray-900 dark:text-gray-100">Wed Nov 15</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Ch 16: Final Confrontation</div>
                      <div className="text-xs text-gray-500">⏰ 2:00 PM</div>
                      <Badge variant="success" size="sm">✅ Ready</Badge>
                      <Button size="sm" className="w-full mt-2">📤 Publish</Button>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="text-center space-y-2">
                      <div className="font-medium text-gray-900 dark:text-gray-100">Fri Nov 17</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Part III Complete</div>
                      <div className="text-xs text-gray-500">⏰ 6:00 PM</div>
                      <Badge variant="warning" size="sm">📝 Draft</Badge>
                      <Button variant="secondary" size="sm" className="w-full mt-2">✏️ Edit</Button>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="text-center space-y-2">
                      <div className="font-medium text-gray-900 dark:text-gray-100">Mon Nov 20</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">New Story Announcement</div>
                      <div className="text-xs text-gray-500">⏰ 12:00 PM</div>
                      <Badge variant="info" size="sm">📋 Planned</Badge>
                      <Button variant="ghost" size="sm" className="w-full mt-2">📝 Write</Button>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="text-center space-y-2">
                      <div className="font-medium text-gray-900 dark:text-gray-100">Wed Nov 22</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Ch 1: Next Adventure</div>
                      <div className="text-xs text-gray-500">⏰ 2:00 PM</div>
                      <Badge variant="default" size="sm">💭 Idea</Badge>
                      <Button variant="ghost" size="sm" className="w-full mt-2">📋 Plan</Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Publish */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Quick Publish</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
              {publishStatus?.readyToPublish?.title || 'Chapter 16: "Final Confrontation"'} - Ready to Publish
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Word Count:</span>
                <Badge variant="success" size="sm">
                  {publishStatus?.readyToPublish?.wordCount?.toLocaleString() || '4,247'} ✅
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Target:</span>
                <Badge variant="success" size="sm">
                  {publishStatus?.readyToPublish?.targetWordCount?.toLocaleString() || '4,000'} ✅
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Quality Check:</span>
                <Badge variant="success" size="sm">✅</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Title:</span>
                <Badge variant="success" size="sm">
                  {publishStatus?.readyToPublish?.shortTitle || 'Final Confrontation'} ✅
                </Badge>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Preview:</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                {publishStatus?.readyToPublish?.preview || 
                 `"Maya stood at the threshold between worlds, shadows dancing around her like eager servants. The Void Collector's offer hung in the air..."`}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Schedule Options:</h4>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="schedule" className="text-blue-600" />
                    <span className="text-sm">🔘 Publish Now</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="schedule" className="text-blue-600" defaultChecked />
                    <span className="text-sm">🔘 Schedule: {publishStatus?.readyToPublish?.scheduledTime || 'Nov 15, 2:00 PM'}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="schedule" className="text-blue-600" />
                    <span className="text-sm">🔘 Save as Draft</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Community Features:</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="text-blue-600" />
                    <span className="text-sm">☑️ Enable comments</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="text-blue-600" />
                    <span className="text-sm">☑️ Allow theories</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="text-blue-600" />
                    <span className="text-sm">☑️ Notify subscribers</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="text-blue-600" />
                    <span className="text-sm">☑️ Community poll: {publishStatus?.readyToPublish?.communityPoll || '"What should Maya choose?"'}</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="ghost">🔍 Preview</Button>
              <Button variant="secondary">✏️ Edit</Button>
              <Button>📤 Publish</Button>
              <Button variant="ghost">💾 Save Draft</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>📊 Publication Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                {publishAnalytics?.latestChapter?.title || 'Chapter 15'} Performance
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Published: {publishAnalytics?.latestChapter?.publishedAgo || '3 days ago'}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>👁️ Views: <span className="font-medium">{publishAnalytics?.latestChapter?.views?.toLocaleString() || '3,247'}</span></div>
                <div>💬 Comments: <span className="font-medium">{publishAnalytics?.latestChapter?.comments?.toLocaleString() || '126'}</span></div>
                <div>❤️ Reactions: <span className="font-medium">{publishAnalytics?.latestChapter?.reactions?.toLocaleString() || '456'}</span></div>
                <div>⭐ Rating: <span className="font-medium">{publishAnalytics?.latestChapter?.rating || '4.9'}/5</span></div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm mb-1">
                  <span>📈 Engagement Rate:</span>
                  <span className="font-medium">{publishAnalytics?.latestChapter?.engagementRate || '87'}%</span>
                </div>
                <div className="text-sm text-green-600">
                  🔥 Trending: #{publishAnalytics?.latestChapter?.trendingRank || '2'} in {publishAnalytics?.latestChapter?.genre || 'Fantasy'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎯 Reader Engagement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">📈 Pre-publish Buzz</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Theories:</span>
                  <span className="font-medium text-green-600">+{publishAnalytics?.prepublishBuzz?.theories || '89'} new</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Comments:</span>
                  <span className="font-medium text-green-600">+{publishAnalytics?.prepublishBuzz?.comments || '234'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Anticipation:</span>
                  <span className="font-medium">{publishAnalytics?.prepublishBuzz?.anticipation || '94'}%</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">📊 Optimal Time:</h5>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {publishAnalytics?.optimalTime?.time || 'Wed 2:00 PM PST'}<br />
                  <span className="text-xs">
                    ({publishAnalytics?.optimalTime?.activeReaderPercentage || '89'}% readers active)
                  </span>
                </div>
                <Button size="sm" variant="ghost" className="mt-2">📋 Engagement Tips</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}