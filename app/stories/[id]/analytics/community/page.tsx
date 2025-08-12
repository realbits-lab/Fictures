'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CommunityAnalyticsPageProps {
  params: { id: string };
}

export default function CommunityAnalyticsPage({ params }: CommunityAnalyticsPageProps) {
  const communityMetrics = {
    totalFollowers: 1234,
    activeReaders: 892,
    communityGrowth: 15.2,
    engagementRate: 68,
    topContributors: [
      { name: 'BookLover42', contributions: 45, type: 'comments' },
      { name: 'StoryFan88', contributions: 38, type: 'reviews' },
      { name: 'ReadingAddict', contributions: 29, type: 'shares' }
    ]
  };

  return (
    <div className="container mx-auto p-6" data-testid="community-analytics-page">
      <h1 className="text-3xl font-bold mb-6">Community Engagement Insights</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600" data-testid="total-followers">
              {communityMetrics.totalFollowers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Followers</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600" data-testid="active-readers">
              {communityMetrics.activeReaders.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Active Readers</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600" data-testid="community-growth">
              +{communityMetrics.communityGrowth}%
            </div>
            <div className="text-sm text-gray-600">Growth This Month</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Progress value={communityMetrics.engagementRate} className="w-16" />
              <span className="text-lg font-bold" data-testid="engagement-rate">
                {communityMetrics.engagementRate}%
              </span>
            </div>
            <div className="text-sm text-gray-600">Engagement Rate</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Community Contributors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" data-testid="top-contributors">
            {communityMetrics.topContributors.map((contributor, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg" data-testid="contributor-item">
                <div>
                  <div className="font-medium" data-testid="contributor-name">
                    {contributor.name}
                  </div>
                  <Badge variant="outline" data-testid="contribution-type">
                    {contributor.type}
                  </Badge>
                </div>
                <div className="text-lg font-bold text-blue-600" data-testid="contribution-count">
                  {contributor.contributions}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}