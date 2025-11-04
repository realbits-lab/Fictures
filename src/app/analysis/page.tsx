import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hasAnyRole } from '@/lib/auth/permissions';
import { MainLayout } from "@/components/layout";
import { AnalyticsLandingPage } from "@/components/analysis/AnalyticsLandingPage";

export default async function AnalysisPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (!hasAnyRole(session, ['writer', 'manager'])) {
    redirect('/');
  }

  return (
    <MainLayout>
      <AnalyticsLandingPage />
    </MainLayout>
  );
}