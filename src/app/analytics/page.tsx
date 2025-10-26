import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hasAnyRole } from '@/lib/auth/permissions';
import { MainLayout } from "@/components/layout";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (!hasAnyRole(session, ['writer', 'manager'])) {
    redirect('/');
  }

  return (
    <MainLayout>
      <AnalyticsDashboard />
    </MainLayout>
  );
}