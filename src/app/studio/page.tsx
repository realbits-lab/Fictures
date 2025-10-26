import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hasAnyRole } from '@/lib/auth/permissions';
import { DashboardClient } from "@/components/dashboard";
import { MainLayout } from "@/components/layout";

export default async function StoriesPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (!hasAnyRole(session, ['writer', 'manager'])) {
    redirect('/');
  }

  return (
    <MainLayout>
      <DashboardClient />
    </MainLayout>
  );
}