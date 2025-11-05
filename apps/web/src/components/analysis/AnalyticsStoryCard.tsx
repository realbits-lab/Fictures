"use client";

import Link from "next/link";
import { Card, CardContent, StoryImage, Badge } from "@/components/ui";
import { TrendingUp, TrendingDown, Minus, Eye, Users, MessageCircle } from "lucide-react";

interface AnalyticsStoryCardProps {
  id: string;
  title: string;
  genre: string;
  imageUrl?: string | null;
  imageVariants?: any;
  views: number;
  readers: number;
  engagement: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export function AnalyticsStoryCard({
  id,
  title,
  genre,
  imageUrl,
  imageVariants,
  views,
  readers,
  engagement,
  trend,
  trendPercentage,
}: AnalyticsStoryCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (trend === 'down') return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <Link href={`/analysis/${id}`} className="block h-full">
      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer overflow-hidden">
        <CardContent className="p-0 space-y-0">
          {/* Story Image */}
          {imageUrl && (
            <div className="relative w-full aspect-video bg-[rgb(var(--color-muted))]">
              <StoryImage
                src={imageUrl}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
              {/* Trend Badge Overlay */}
              <div className="absolute top-2 right-2">
                <Badge className={`flex items-center gap-1 ${getTrendColor()}`}>
                  {getTrendIcon()}
                  <span>{Math.abs(trendPercentage).toFixed(0)}%</span>
                </Badge>
              </div>
            </div>
          )}

          <div className="p-6 space-y-4">
            {/* Title and Genre */}
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-[rgb(var(--color-foreground))] line-clamp-2">
                📊 {title}
              </h3>
              <p className="text-sm text-[rgb(var(--color-muted-foreground))]">{genre}</p>
            </div>

            {/* Analytics Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-[rgb(var(--color-muted-foreground))]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Views</span>
                </div>
                <p className="text-lg font-semibold text-[rgb(var(--color-foreground))]">
                  {formatNumber(views)}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-[rgb(var(--color-muted-foreground))]">
                  <Users className="w-3.5 h-3.5" />
                  <span>Readers</span>
                </div>
                <p className="text-lg font-semibold text-[rgb(var(--color-foreground))]">
                  {formatNumber(readers)}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-[rgb(var(--color-muted-foreground))]">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Actions</span>
                </div>
                <p className="text-lg font-semibold text-[rgb(var(--color-foreground))]">
                  {formatNumber(engagement)}
                </p>
              </div>
            </div>

            {/* Trend Summary */}
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md border ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="font-medium">
                {trend === 'up' && 'Growing'}
                {trend === 'down' && 'Declining'}
                {trend === 'stable' && 'Stable'}
              </span>
              <span className="text-xs opacity-75">• Last 30 days</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
