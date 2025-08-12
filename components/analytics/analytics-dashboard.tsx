'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Eye, 
  Star,
  MessageCircle,
  DollarSign,
  Calendar,
  Globe,
  Clock,
  Target,
  Award,
  Zap
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface KPIMetric {
  name: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  testId: string;
}

interface StoryPerformance {
  id: string;
  title: string;
  reads: number;
  engagement: number;
  rating: number;
  comments: number;
  completionRate: number;
  revenue: number;
}

interface TrafficSource {
  name: string;
  visitors: number;
  conversionRate: number;
  bounceRate: number;
}

export function AnalyticsDashboard() {
  const [timePeriod, setTimePeriod] = useState('30-days');

  const kpiMetrics: KPIMetric[] = [
    {
      name: 'Total Readers',
      value: '12.4K',
      change: 15.2,
      trend: 'up',
      testId: 'total-readers'
    },
    {
      name: 'Total Reads',
      value: '45.8K',
      change: 8.7,
      trend: 'up',
      testId: 'total-reads'
    },
    {
      name: 'Engagement Rate',
      value: '68%',
      change: 2.3,
      trend: 'up',
      testId: 'engagement-rate'
    },
    {
      name: 'Completion Rate',
      value: '74%',
      change: -1.2,
      trend: 'down',
      testId: 'story-completion-rate'
    },
    {
      name: 'Average Rating',
      value: '4.6',
      change: 0.3,
      trend: 'up',
      testId: 'average-rating'
    },
    {
      name: 'Total Followers',
      value: '3.2K',
      change: 12.8,
      trend: 'up',
      testId: 'total-followers'
    }
  ];

  const storyPerformance: StoryPerformance[] = [
    {
      id: '1',
      title: 'The Dragon\'s Quest',
      reads: 12456,
      engagement: 85,
      rating: 4.8,
      comments: 234,
      completionRate: 78,
      revenue: 1250
    },
    {
      id: '2',
      title: 'Mystic Chronicles',
      reads: 8901,
      engagement: 72,
      rating: 4.3,
      comments: 156,
      completionRate: 82,
      revenue: 890
    },
    {
      id: '3',
      title: 'Urban Legends',
      reads: 6543,
      engagement: 90,
      rating: 4.9,
      comments: 298,
      completionRate: 71,
      revenue: 654
    }
  ];

  const trafficSources: TrafficSource[] = [
    {
      name: 'Direct Traffic',
      visitors: 4521,
      conversionRate: 12.4,
      bounceRate: 25.3
    },
    {
      name: 'Social Media',
      visitors: 3210,
      conversionRate: 8.7,
      bounceRate: 35.2
    },
    {
      name: 'Search Engines',
      visitors: 2876,
      conversionRate: 15.6,
      bounceRate: 22.1
    },
    {
      name: 'Referral Sites',
      visitors: 1987,
      conversionRate: 10.2,
      bounceRate: 28.7
    },
    {
      name: 'Email',
      visitors: 1543,
      conversionRate: 18.9,
      bounceRate: 15.4
    }
  ];

  const renderTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (trend === 'down') {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <div className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6" data-testid="analytics-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-48" data-testid="time-period-selector">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7-days" data-testid="period-7-days">Last 7 days</SelectItem>
            <SelectItem value="30-days" data-testid="period-30-days">Last 30 days</SelectItem>
            <SelectItem value="90-days" data-testid="period-90-days">Last 90 days</SelectItem>
            <SelectItem value="1-year" data-testid="period-1-year">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Section */}
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" data-testid="kpi-section">
            {kpiMetrics.map((metric) => (
              <div key={metric.testId} className="text-center p-4 border rounded-lg" data-testid={metric.testId}>
                <div className="flex items-center justify-center mb-2">
                  {metric.testId === 'total-readers' && <Users className="h-5 w-5 text-blue-500" />}
                  {metric.testId === 'total-reads' && <Eye className="h-5 w-5 text-green-500" />}
                  {metric.testId === 'engagement-rate' && <Zap className="h-5 w-5 text-purple-500" />}
                  {metric.testId === 'story-completion-rate' && <Target className="h-5 w-5 text-orange-500" />}
                  {metric.testId === 'average-rating' && <Star className="h-5 w-5 text-yellow-500" />}
                  {metric.testId === 'total-followers' && <Users className="h-5 w-5 text-pink-500" />}
                </div>
                <div className="text-2xl font-bold mb-1" data-testid="current-value">
                  {metric.value}
                </div>
                <div className="text-sm text-gray-600 mb-2">{metric.name}</div>
                <div className="flex items-center justify-center space-x-1">
                  <span data-testid="trend-indicator">
                    {renderTrendIcon(metric.trend, metric.change)}
                  </span>
                  <span 
                    className={`text-xs font-medium ${
                      metric.trend === 'up' ? 'text-green-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}
                    data-testid="percentage-change"
                  >
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Story Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Story Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto" data-testid="story-performance-table">
            <table className="w-full">
              <thead>
                <tr className="border-b" data-testid="table-header">
                  <th className="text-left p-2">Story</th>
                  <th className="text-left p-2">Reads</th>
                  <th className="text-left p-2">Engagement</th>
                  <th className="text-left p-2">Rating</th>
                  <th className="text-left p-2">Comments</th>
                  <th className="text-left p-2">Completion Rate</th>
                  <th className="text-left p-2">Revenue</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {storyPerformance.map((story) => (
                  <tr key={story.id} className="border-b" data-testid="story-row">
                    <td className="p-2">
                      <div className="font-medium" data-testid="story-title">{story.title}</div>
                    </td>
                    <td className="p-2" data-testid="read-count">
                      {story.reads.toLocaleString()}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <Progress value={story.engagement} className="w-16" />
                        <span className="text-sm" data-testid="engagement-score">{story.engagement}%</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span data-testid="average-rating">{story.rating}</span>
                      </div>
                    </td>
                    <td className="p-2">{story.comments}</td>
                    <td className="p-2">{story.completionRate}%</td>
                    <td className="p-2">${story.revenue}</td>
                    <td className="p-2">
                      <Button size="sm" variant="outline" data-testid="view-details-button">
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Traffic Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6" data-testid="traffic-sources-overview">
            {/* Traffic Categories */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg" data-testid="direct-traffic">
                <Globe className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-xl font-bold text-blue-600">4.5K</div>
                <div className="text-sm text-blue-600">Direct</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg" data-testid="social-media-traffic">
                <Users className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-xl font-bold text-green-600">3.2K</div>
                <div className="text-sm text-green-600">Social Media</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg" data-testid="search-traffic">
                <Eye className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <div className="text-xl font-bold text-purple-600">2.9K</div>
                <div className="text-sm text-purple-600">Search</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg" data-testid="referral-traffic">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <div className="text-xl font-bold text-orange-600">2.0K</div>
                <div className="text-sm text-orange-600">Referral</div>
              </div>
              <div className="text-center p-4 bg-pink-50 rounded-lg" data-testid="email-traffic">
                <MessageCircle className="h-6 w-6 mx-auto mb-2 text-pink-600" />
                <div className="text-xl font-bold text-pink-600">1.5K</div>
                <div className="text-sm text-pink-600">Email</div>
              </div>
            </div>

            {/* Traffic Sources Chart */}
            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center" data-testid="traffic-sources-chart">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Traffic sources visualization</p>
              </div>
            </div>

            {/* Detailed Traffic Table */}
            <div className="overflow-x-auto" data-testid="traffic-details-table">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Source</th>
                    <th className="text-left p-2">Visitors</th>
                    <th className="text-left p-2">Conversion Rate</th>
                    <th className="text-left p-2">Bounce Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {trafficSources.map((source, index) => (
                    <tr key={index} className="border-b" data-testid="traffic-source-row">
                      <td className="p-2 font-medium" data-testid="source-name">{source.name}</td>
                      <td className="p-2" data-testid="visitors-count">{source.visitors.toLocaleString()}</td>
                      <td className="p-2" data-testid="conversion-rate">{source.conversionRate}%</td>
                      <td className="p-2" data-testid="bounce-rate">{source.bounceRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden detailed analytics component */}
      <div style={{ display: 'none' }} data-testid="detailed-story-analytics">
        <h3>Detailed Story Analytics</h3>
        <p>Comprehensive analytics for individual stories</p>
      </div>
    </div>
  );
}

export function RevenueAnalytics() {
  const revenueData = {
    totalRevenue: 15420,
    monthlyRecurringRevenue: 3240,
    averageRevenuePerUser: 12.50,
    subscriberCount: 856
  };

  const revenueStreams = {
    subscription: 8540,
    tips: 3210,
    commissions: 2870,
    premiumContent: 800
  };

  const topPerformingStories = [
    {
      id: '1',
      title: 'The Dragon\'s Quest',
      revenue: 4250,
      growth: 15.2
    },
    {
      id: '2',
      title: 'Mystic Chronicles',
      revenue: 3180,
      growth: 8.7
    },
    {
      id: '3',
      title: 'Urban Legends',
      revenue: 2890,
      growth: 12.4
    }
  ];

  return (
    <div className="space-y-6" data-testid="revenue-analytics-page">
      {/* Revenue Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="revenue-overview">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600" data-testid="total-revenue">
                ${revenueData.totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-green-600">Total Revenue</div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600" data-testid="monthly-recurring-revenue">
                ${revenueData.monthlyRecurringRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-blue-600">Monthly Recurring Revenue</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600" data-testid="average-revenue-per-user">
                ${revenueData.averageRevenuePerUser}
              </div>
              <div className="text-sm text-purple-600">Average Revenue Per User</div>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Award className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold text-orange-600" data-testid="subscriber-count">
                {revenueData.subscriberCount}
              </div>
              <div className="text-sm text-orange-600">Subscribers</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Streams */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Streams</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="revenue-streams">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-xl font-bold text-blue-600" data-testid="subscription-revenue">
                ${revenueStreams.subscription.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Subscriptions</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-xl font-bold text-green-600" data-testid="tip-revenue">
                ${revenueStreams.tips.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Tips & Donations</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-xl font-bold text-purple-600" data-testid="commission-revenue">
                ${revenueStreams.commissions.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Commissions</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-xl font-bold text-orange-600" data-testid="premium-content-revenue">
                ${revenueStreams.premiumContent.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Premium Content</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center" data-testid="revenue-trends-chart">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Revenue trends visualization</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Stories */}
      <Card>
        <CardHeader>
          <CardTitle>Top Revenue Generating Stories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" data-testid="top-revenue-stories">
            {topPerformingStories.map((story) => (
              <div key={story.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid="top-story-item">
                <div>
                  <div className="font-medium" data-testid="story-title">{story.title}</div>
                  <div className="text-sm text-gray-600">Revenue this month</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" data-testid="revenue-amount">
                    ${story.revenue.toLocaleString()}
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-sm text-green-600" data-testid="revenue-growth">
                      +{story.growth}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}