import NextAuth, { type DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import { createUser, getUser, checkPermittedUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import type { DefaultJWT } from 'next-auth/jwt';

export type UserType = 'regular';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Handle Google OAuth
      if (account?.provider === 'google' && profile?.email) {
        try {
          // First check if this email is permitted to login
          const isPermitted = await checkPermittedUser(profile.email);
          
          if (!isPermitted) {
            console.log(`Login attempt blocked for non-permitted email: ${profile.email}`);
            throw new Error('AccessDenied');
          }
          
          // Check if user already exists
          const existingUsers = await getUser(profile.email);
          
          if (existingUsers.length === 0) {
            // Create new user for Google OAuth
            await createUser(profile.email, null, profile.name || undefined, profile.picture || undefined);
          }
          
          return true;
        } catch (error) {
          console.error('Error during Google OAuth sign in:', error);
          return false;
        }
      }

      return false;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = 'regular';
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.type = 'regular';
        
        // Get user info from database using email
        if (token.email) {
          try {
            const users = await getUser(token.email);
            if (users.length > 0) {
              const [user] = users;
              session.user.id = user.id; // Use the actual database user ID
              session.user.name = user.name || session.user.name;
              session.user.image = user.image || session.user.image;
            }
          } catch (error) {
            console.error('Error fetching user info for session:', error);
          }
        }
      }

      return session;
    },
  },
});
