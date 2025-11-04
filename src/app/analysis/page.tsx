import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hasAnyRole } from '@/lib/auth/permissions';
import { MainLayout } from "@/components/layout";
import { AnalysisDashboard } from "@/components/analysis/analysis-dashboard";

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
      <AnalysisDashboard />
    </MainLayout>
  );
}