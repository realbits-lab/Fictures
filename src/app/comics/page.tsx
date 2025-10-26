import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { isWriter } from '@/lib/auth/permissions';
import { MainLayout } from "@/components/layout";
import { ComicBrowse } from "@/components/comic/comic-browse";

export default async function ComicBrowsePage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (!isWriter(session)) {
    redirect('/');
  }

  return (
    <MainLayout>
      <ComicBrowse />
    </MainLayout>
  );
}
