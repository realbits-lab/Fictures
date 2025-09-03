import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';

export default function AuthError({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 pt-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            There was a problem signing you in
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-red-600 text-sm text-center p-3 bg-red-50 dark:bg-red-950 rounded-md">
              Error: {error}
            </div>
          )}
          <Link href="/" className="w-full">
            <Button className="w-full">
              Return to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}