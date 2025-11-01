'use client';

import { signIn } from 'next-auth/react';
import { Comments } from '@fuma-comment/react';

interface DocsCommentsProps {
  page: string;
}

export function DocsComments({ page }: DocsCommentsProps) {
  return (
    <div className="mt-12 border-t border-border pt-8">
      <h2 className="text-2xl font-bold mb-6">Comments</h2>
      <Comments
        page={page}
        auth={{
          type: 'api',
          signIn: () => void signIn(),
        }}
      />
    </div>
  );
}
