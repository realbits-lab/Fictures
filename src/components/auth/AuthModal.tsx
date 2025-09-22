"use client";

import React from 'react';
import { createPortal } from 'react-dom';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui';
import { useAuthModal } from '@/contexts/AuthModalContext';

export function AuthModal() {
  const { isOpen, closeModal } = useAuthModal();
  const [mounted, setMounted] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  if (!mounted || !isOpen) {
    return null;
  }

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else if (result?.ok) {
        closeModal();
        window.location.reload();
      }
    } catch (error) {
      setError('An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn('google');
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform rounded-lg bg-white dark:bg-gray-800 px-6 py-8 shadow-xl transition-all">
          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div>
            {/* Icon */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            {/* Title and description */}
            <div className="mt-4 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Sign in required
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Sign in to perform this action
              </p>
            </div>

            {error && (
              <div className="mt-4 text-red-600 text-sm text-center p-2 bg-red-50 dark:bg-red-950 rounded-md">
                {error}
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleCredentialsSignIn} className="mt-6 space-y-4">
              <div>
                <label htmlFor="modal-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="modal-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>

              <div>
                <label htmlFor="modal-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  id="modal-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
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

            {/* Divider */}
            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col space-y-3">
              <Button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 dark:border-gray-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </Button>

              <Button
                variant="ghost"
                onClick={closeModal}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}