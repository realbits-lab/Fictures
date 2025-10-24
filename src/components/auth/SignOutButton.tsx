"use client";

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui';
import { trackEngagement } from '@/lib/analytics/google-analytics';

export function SignOutButton() {
  const handleSignOut = () => {
    trackEngagement.signOut();
    signOut({ callbackUrl: '/' });
  };

  return (
    <Button
      variant="ghost"
      onClick={handleSignOut}
    >
      Sign Out
    </Button>
  );
}