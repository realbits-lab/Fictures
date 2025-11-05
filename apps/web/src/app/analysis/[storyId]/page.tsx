import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hasAnyRole } from '@/lib/auth/permissions';
import { MainLayout } from "@/components/layout";
import { StoryAnalyticsDashboard } from "@/components/analysis/StoryAnalyticsDashboard";

export default async function StoryAnalyticsPage({ params }: { params: Promise<{ storyId: string }> }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (!hasAnyRole(session, ['writer', 'manager'])) {
    redirect('/');
  }

  const { storyId } = await params;

  return (
    <MainLayout>
      <StoryAnalyticsDashboard storyId={storyId} />
    </MainLayout>
  );
}
