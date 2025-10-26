import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hasAnyRole } from '@/lib/auth/permissions';
import { MainLayout } from "@/components/layout";
import { ComicBrowse } from "@/components/comic/comic-browse";

export default async function ComicBrowsePage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (!hasAnyRole(session, ['writer', 'manager'])) {
    redirect('/');
  }

  return (
    <MainLayout>
      <ComicBrowse />
    </MainLayout>
  );
}
