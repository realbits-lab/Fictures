import { auth } from '@/lib/auth';
import { canWrite, canManage } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import ResearchClient from '@/components/research/ResearchClient';

export const metadata = {
  title: 'Research | Fictures',
  description: 'Manage your research notes and documentation',
};

export default async function ResearchPage() {
  const session = await auth();

  // Only writers and managers can access research
  if (!canWrite(session)) {
    redirect('/');
  }

  const isManager = canManage(session);

  return (
    <div className="min-h-screen bg-gray-50">
      <ResearchClient isManager={isManager} />
    </div>
  );
}
