'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Heart, 
  MessageCircle, 
  Bookmark,
  Star,
  Share2,
  BarChart3,
  PieChart,
  Globe,
  Clock,
  UserCheck
} from 'lucide-react';

interface EngagementMetrics {
  totalReads: number;
  uniqueReaders: number;
  totalLikes: number;
  totalComments: number;
  totalBookmarks: number;
  averageRating: number;
}

interface ChapterMetric {
  chapterNumber: number;
  reads: number;
  completionRate: number;
  comments: number;
  likes: number;
  dropOffRate: number;
}

interface ReaderDemographic {
  ageGroup: string;
  percentage: number;
  engagementScore: number;
}

interface SocialAnalyticsProps {
  storyId: string;
  isAuthor?: boolean;
}

export function SocialAnalytics({ storyId, isAuthor = false }: SocialAnalyticsProps) {
  const [engagementMetrics] = useState<EngagementMetrics>({
    totalReads: 12456,
    uniqueReaders: 8932,
    totalLikes: 1234,
    totalComments: 567,
    totalBookmarks: 890,
    averageRating: 4.6
  });

  const [chapterMetrics] = useState<ChapterMetric[]>([
    {
      chapterNumber: 1,
      reads: 12456,
      completionRate: 92,
      comments: 89,
      likes: 156,
      dropOffRate: 8
    },
    {
      chapterNumber: 2,
      reads: 11234,
      completionRate: 87,
      comments: 78,
      likes: 134,
      dropOffRate: 13
    },
    {
      chapterNumber: 3,
      reads: 9876,
      completionRate: 84,
      comments: 65,
      likes: 123,
      dropOffRate: 16
    }
  ]);

  const [readerDemographics] = useState<ReaderDemographic[]>([
    { ageGroup: '18-24', percentage: 28, engagementScore: 85 },
    { ageGroup: '25-34', percentage: 35, engagementScore: 92 },
    { ageGroup: '35-44', percentage: 22, engagementScore: 88 },
    { ageGroup: '45-54', percentage: 12, engagementScore: 79 },
    { ageGroup: '55+', percentage: 3, engagementScore: 72 }
  ]);

  if (!isAuthor) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Analytics are only available to story authors.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="story-analytics-page">
      {/* Engagement Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Engagement Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" data-testid="engagement-overview">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Eye className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600" data-testid="total-reads">
                {engagementMetrics.totalReads.toLocaleString()}
              </div>
              <div className="text-sm text-blue-600">Total Reads</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600" data-testid="unique-readers">
                {engagementMetrics.uniqueReaders.toLocaleString()}
              </div>
              <div className="text-sm text-green-600">Unique Readers</div>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <Heart className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-red-600" data-testid="total-likes">
                {engagementMetrics.totalLikes.toLocaleString()}
              </div>
              <div className="text-sm text-red-600">Total Likes</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <MessageCircle className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600" data-testid="total-comments">
                {engagementMetrics.totalComments.toLocaleString()}
              </div>
              <div className="text-sm text-purple-600">Comments</div>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Bookmark className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold text-yellow-600" data-testid="total-bookmarks">
                {engagementMetrics.totalBookmarks.toLocaleString()}
              </div>
              <div className="text-sm text-yellow-600">Bookmarks</div>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Star className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold text-orange-600" data-testid="average-rating">
                {engagementMetrics.averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-orange-600">Avg Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center" data-testid="engagement-trends-chart">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Engagement trends chart would be displayed here</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chapter-Level Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Chapter Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto" data-testid="chapter-engagement-table">
            <table className="w-full">
              <thead>
                <tr className="border-b" data-testid="table-header">
                  <th className="text-left p-2">Chapter</th>
                  <th className="text-left p-2">Reads</th>
                  <th className="text-left p-2">Completion Rate</th>
                  <th className="text-left p-2">Comments</th>
                  <th className="text-left p-2">Likes</th>
                  <th className="text-left p-2">Drop-off Rate</th>
                </tr>
              </thead>
              <tbody>
                {chapterMetrics.map((chapter) => (
                  <tr key={chapter.chapterNumber} className="border-b" data-testid="chapter-row">
                    <td className="p-2" data-testid="chapter-number">
                      Chapter {chapter.chapterNumber}
                    </td>
                    <td className="p-2" data-testid="read-count">
                      {chapter.reads.toLocaleString()}
                    </td>
                    <td className="p-2" data-testid="completion-rate">
                      <div className="flex items-center space-x-2">
                        <Progress value={chapter.completionRate} className="w-16" />
                        <span>{chapter.completionRate}%</span>
                      </div>
                    </td>
                    <td className="p-2">{chapter.comments}</td>
                    <td className="p-2">{chapter.likes}</td>
                    <td className="p-2">
                      <Badge variant={chapter.dropOffRate > 15 ? "destructive" : "secondary"}>
                        {chapter.dropOffRate}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Reader Demographics */}
      <Card>
        <CardHeader>
          <CardTitle>Reader Demographics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6" data-testid="reader-demographics">
            {/* Age Distribution */}
            <div data-testid="age-distribution">
              <h4 className="font-medium mb-3">Age Distribution</h4>
              <div className="space-y-2">
                {readerDemographics.map((demo) => (
                  <div key={demo.ageGroup} className="flex items-center space-x-4" data-testid="age-group">
                    <span className="w-16 text-sm" data-testid="age-range">
                      {demo.ageGroup}
                    </span>
                    <div className="flex-1">
                      <Progress value={demo.percentage} className="h-2" />
                    </div>
                    <span className="w-12 text-sm text-right" data-testid="percentage">
                      {demo.percentage}%
                    </span>
                    <Badge variant="outline" data-testid="engagement-score">
                      {demo.engagementScore}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic Distribution */}
            <div data-testid="geographic-distribution">
              <h4 className="font-medium mb-3">Geographic Distribution</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center" data-testid="world-map">
                  <div className="text-center">
                    <Globe className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">World map visualization</p>
                  </div>
                </div>
                
                <div data-testid="top-regions-list">
                  <h5 className="font-medium mb-2">Top Regions</h5>
                  <div className="space-y-2">
                    {['United States', 'United Kingdom', 'Canada', 'Australia'].map((region, index) => (
                      <div key={region} className="flex items-center justify-between" data-testid="region-item">
                        <span className="text-sm">{region}</span>
                        <Badge variant="secondary">{25 - index * 5}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Device Analysis */}
            <div data-testid="device-analysis">
              <h4 className="font-medium mb-3">Reading Devices</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600" data-testid="mobile-percentage">
                    65%
                  </div>
                  <div className="text-sm text-blue-600">Mobile</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600" data-testid="desktop-percentage">
                    28%
                  </div>
                  <div className="text-sm text-green-600">Desktop</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600" data-testid="tablet-percentage">
                    7%
                  </div>
                  <div className="text-sm text-purple-600">Tablet</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Sharing Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Social Sharing Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6" data-testid="social-analytics-page">
            {/* Sharing Metrics */}
            <div data-testid="sharing-metrics">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Share2 className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-600" data-testid="total-shares">
                    1,234
                  </div>
                  <div className="text-sm text-blue-600">Total Shares</div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-600" data-testid="share-rate">
                    12.5%
                  </div>
                  <div className="text-sm text-green-600">Share Rate</div>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-600" data-testid="viral-coefficient">
                    2.3
                  </div>
                  <div className="text-sm text-purple-600">Viral Coefficient</div>
                </div>

                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Eye className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-600" data-testid="reach-multiplier">
                    4.2x
                  </div>
                  <div className="text-sm text-orange-600">Reach Multiplier</div>
                </div>
              </div>
            </div>

            {/* Platform Breakdown */}
            <div data-testid="platform-sharing-breakdown">
              <h4 className="font-medium mb-3">Platform Breakdown</h4>
              <div className="space-y-3">
                {[
                  { platform: 'Twitter', shares: 456, engagement: 8.2, ctr: 3.1 },
                  { platform: 'Facebook', shares: 234, engagement: 12.4, ctr: 2.8 },
                  { platform: 'Reddit', shares: 345, engagement: 15.7, ctr: 4.2 },
                  { platform: 'Direct Links', shares: 199, engagement: 6.9, ctr: 2.1 }
                ].map((platform) => (
                  <div key={platform.platform} className="flex items-center justify-between p-3 border rounded-lg" data-testid="platform-item">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium" data-testid="platform-name">
                        {platform.platform}
                      </span>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div data-testid="share-count">
                        <span className="font-medium">{platform.shares}</span> shares
                      </div>
                      <div data-testid="engagement-rate">
                        <span className="font-medium">{platform.engagement}%</span> engagement
                      </div>
                      <div data-testid="click-through-rate">
                        <span className="font-medium">{platform.ctr}%</span> CTR
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Community Health */}
      <Card>
        <CardHeader>
          <CardTitle>Community Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6" data-testid="community-analytics-page">
            {/* Reader Loyalty */}
            <div data-testid="reader-loyalty-metrics">
              <h4 className="font-medium mb-3">Reader Loyalty</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <UserCheck className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-xl font-bold text-green-600" data-testid="returning-readers">
                    67%
                  </div>
                  <div className="text-sm text-green-600">Returning Readers</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-xl font-bold text-blue-600" data-testid="reader-retention-rate">
                    82%
                  </div>
                  <div className="text-sm text-blue-600">Retention Rate</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-xl font-bold text-purple-600" data-testid="average-session-time">
                    12m
                  </div>
                  <div className="text-sm text-purple-600">Avg Session</div>
                </div>
              </div>
            </div>

            {/* Comment Analysis */}
            <div data-testid="comment-engagement-analysis">
              <h4 className="font-medium mb-3">Comment Engagement</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div data-testid="most-active-commenters">
                  <h5 className="font-medium mb-2">Top Contributors</h5>
                  <div className="space-y-2">
                    {[
                      { name: 'BookLover123', comments: 34, score: 95 },
                      { name: 'StoryFan456', comments: 28, score: 87 },
                      { name: 'ReaderPro', comments: 22, score: 82 }
                    ].map((contributor) => (
                      <div key={contributor.name} className="flex items-center justify-between text-sm" data-testid="contributor-item">
                        <span data-testid="contributor-name">{contributor.name}</span>
                        <div className="flex items-center space-x-2">
                          <span data-testid="comment-count">{contributor.comments}</span>
                          <Badge variant="outline" data-testid="engagement-score">
                            {contributor.score}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div data-testid="comment-sentiment-analysis">
                  <h5 className="font-medium mb-2">Sentiment Analysis</h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Positive</span>
                      <span className="text-sm font-medium text-green-600">78%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Neutral</span>
                      <span className="text-sm font-medium text-gray-600">18%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Negative</span>
                      <span className="text-sm font-medium text-red-600">4%</span>
                    </div>
                  </div>
                </div>

                <div data-testid="popular-discussion-topics">
                  <h5 className="font-medium mb-2">Popular Topics</h5>
                  <div className="space-y-1">
                    {['Character Development', 'Plot Twists', 'World Building', 'Romance'].map((topic) => (
                      <Badge key={topic} variant="secondary" className="mr-1 mb-1">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}