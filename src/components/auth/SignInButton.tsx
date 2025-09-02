"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

export function SignInButton() {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.push('/login')}
    >
      Sign In
    </Button>
  );
}