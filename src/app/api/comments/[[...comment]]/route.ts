import { NextComment } from '@fuma-comment/server/next';
import { createDrizzleAdapter } from '@fuma-comment/server/adapters/drizzle';
import { db, fumaComments, fumaRates, fumaRoles, users } from '@/lib/db';
import { createNextAuthV5Adapter } from '@/lib/fuma-comment/auth-adapter';

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

const auth = createNextAuthV5Adapter();

export const { GET, DELETE, PATCH, POST } = NextComment({
  auth,
  storage,
});
