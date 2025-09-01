import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { SignInButton } from '@/components/auth/SignInButton';

export default async function LoginPage() {
  const session = await auth();
  
  if (session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <CardTitle className="text-2xl">Welcome to Fictures</CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Your AI-powered writing companion
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Sign in to start writing your next masterpiece with AI assistance
          </p>
          <div className="flex justify-center">
            <SignInButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}