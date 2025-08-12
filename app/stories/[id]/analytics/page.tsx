'use client';

import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';

interface AnalyticsPageProps {
  params: { id: string };
}

export default function AnalyticsPage({ params }: AnalyticsPageProps) {
  return (
    <div className="container mx-auto p-6">
      <AnalyticsDashboard />
    </div>
  );
}