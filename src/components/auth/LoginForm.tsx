"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl: '/',
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else if (result?.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      setError('An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');

    try {
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/',
      });

      if (result?.error) {
        setError('Failed to sign in with Google');
      } else if (result?.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      setError('An error occurred during sign in');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 pt-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <CardTitle className="text-2xl">Welcome to Fictures</CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Your AI-powered writing companion
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-red-600 text-sm text-center p-3 bg-red-50 dark:bg-red-950 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Signing in...' : 'Sign in with Email'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-950 text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}