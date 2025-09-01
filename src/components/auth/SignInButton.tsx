"use client";

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui';

export function SignInButton() {
  return (
    <Button
      onClick={() => signIn('google', { callbackUrl: '/' })}
    >
      Sign in with Google
    </Button>
  );
}