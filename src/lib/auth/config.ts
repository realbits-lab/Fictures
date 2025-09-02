import { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const authConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const user = await db
            .select()
            .from(users)
            .where(eq(users.username, credentials.username as string))
            .limit(1);

          if (user.length === 0) {
            return null;
          }

          const foundUser = user[0];
          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            foundUser.password!
          );

          if (!passwordMatch) {
            return null;
          }

          return {
            id: foundUser.id,
            username: foundUser.username,
            email: foundUser.email,
            name: foundUser.name,
            role: foundUser.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtectedRoute = 
        nextUrl.pathname.startsWith('/write') ||
        nextUrl.pathname.startsWith('/publish') ||
        nextUrl.pathname.startsWith('/settings') ||
        nextUrl.pathname.startsWith('/assistant');
      
      if (isOnProtectedRoute) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn && nextUrl.pathname === '/login') {
        return Response.redirect(new URL('/', nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;