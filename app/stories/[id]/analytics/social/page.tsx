'use client';

import { SocialAnalytics } from '@/components/social/social-analytics';

interface SocialAnalyticsPageProps {
  params: { id: string };
}

export default function SocialAnalyticsPage({ params }: SocialAnalyticsPageProps) {
  return (
    <div className="container mx-auto p-6" data-testid="social-analytics-page">
      <SocialAnalytics storyId={params.id} />
    </div>
  );
}