import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardClient } from "@/components/dashboard";
import { MainLayout } from "@/components/layout";

export default async function StoriesPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <MainLayout>
      <DashboardClient />
    </MainLayout>
  );
}