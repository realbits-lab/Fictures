import { NextComment } from '@fuma-comment/server/next';
import { createDrizzleAdapter } from '@fuma-comment/server/adapters/drizzle';
import { createNextAuthAdapter } from '@fuma-comment/server/adapters/next-auth';
import { db, fumaComments, fumaRates, fumaRoles, users } from '@/lib/db';
import { authConfig } from '@/lib/auth/config';

const storage = createDrizzleAdapter({
  db,
  schemas: {
    comments: fumaComments,
    rates: fumaRates,
    roles: fumaRoles,
    user: users,
  },
  auth: 'next-auth',
});

const auth = createNextAuthAdapter(authConfig);

export const { GET, DELETE, PATCH, POST } = NextComment({
  auth,
  storage,
});
