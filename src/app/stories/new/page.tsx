import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CreateStoryForm } from '@/components/stories/CreateStoryForm';

export default async function NewStoryPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="container mx-auto max-w-screen-2xl px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Create New Story
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Start your next literary adventure
            </p>
          </div>
          <CreateStoryForm />
        </div>
      </main>
    </div>
  );
}