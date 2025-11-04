"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

/**
 * Test page for debugging Chrome password manager
 * This page uses a simple, standard form to test if Chrome will offer to save passwords
 * Navigate to /test-login to use this diagnostic page
 */
export default function TestLoginPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    console.log('Form submitted:', { email, password });

    // Simulate successful login with a delay
    await new Promise(resolve => setTimeout(resolve, 500));

    setSubmitted(true);

    // Full page navigation to trigger Chrome password save
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-4xl mb-4">✅</div>
            <CardTitle className="text-2xl">Login Successful</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Redirecting... Chrome should have offered to save your password.
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 pt-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <CardTitle className="text-2xl">Password Manager Test</CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Test if Chrome will offer to save passwords
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md text-sm">
            <p className="font-medium mb-2">Before testing:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>Open Chrome settings: chrome://settings/passwords</li>
              <li>Ensure &quot;Offer to save passwords&quot; is enabled</li>
              <li>Check &quot;Auto Sign-in&quot; is enabled</li>
              <li>Clear any existing saved passwords for localhost:3000</li>
            </ol>
          </div>

          <form
            onSubmit={handleSubmit}
            name="test-login-form"
            action="/test-submit"
            method="post"
            autoComplete="on"
            className="space-y-4"
          >
            <div>
              <label htmlFor="test-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                id="test-email"
                name="email"
                type="email"
                autoComplete="username"
                defaultValue=""
                placeholder="test@example.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              />
            </div>

            <div>
              <label htmlFor="test-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                id="test-password"
                name="password"
                type="password"
                autoComplete="current-password"
                defaultValue=""
                placeholder="Enter any password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Test Submit
            </button>
          </form>

          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md text-sm">
            <p className="font-medium mb-2">What should happen:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>Enter any email and password</li>
              <li>Click &quot;Test Submit&quot;</li>
              <li>Chrome should show &quot;Save password?&quot; prompt</li>
              <li>If not, password saving may be disabled or blocked</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
