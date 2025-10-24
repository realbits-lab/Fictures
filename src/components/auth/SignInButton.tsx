"use client";

import Link from 'next/link';
import { Button } from '@/components/ui';

export function SignInButton() {
  return (
    <Link href="/login">
      <Button>
        Sign In
      </Button>
    </Link>
  );
}