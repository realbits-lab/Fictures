import { DrizzleAdapter } from '@auth/drizzle-adapter';
import NextAuth from 'next-auth';
import { db } from '@/lib/db';
import { authConfig } from './config';

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db),
  session: {
    strategy: 'database',
  },
});