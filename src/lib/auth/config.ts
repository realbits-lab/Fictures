import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import { findUserByEmail, createUser, updateUser } from '@/lib/db/queries';

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  pages: {
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
    async signIn({ account, profile }) {
      // Allow Google OAuth sign-ins
      if (account?.provider === 'google') {
        if (!profile?.email) {
          return false; // No email provided
        }

        // Get allowed emails from environment variable
        const allowedEmailsEnv = process.env.ALLOWED_EMAILS;
        
        // If ALLOWED_EMAILS is set, check if user email is in the list
        if (allowedEmailsEnv) {
          const allowedEmails = allowedEmailsEnv.split(',').map(email => email.trim());
          if (!allowedEmails.includes(profile.email)) {
            return false; // Email not in allowed list
          }
        }
        
        // Email restriction passed (or no restriction set), now handle database persistence
        try {
          // Check if user already exists in database
          const existingUser = await findUserByEmail(profile.email);
          
          if (existingUser) {
            // Update existing user with latest info from OAuth profile
            await updateUser(existingUser.id, {
              name: profile.name,
              image: profile.image,
              emailVerified: new Date(), // Mark as verified since they just signed in via OAuth
            });
          } else {
            // Create new user in database
            await createUser({
              email: profile.email,
              name: profile.name,
              image: profile.image,
            });
          }
          
          return true; // Allow sign in
        } catch (error) {
          console.error('Database error during sign in:', error);
          return false; // Reject sign in if database operation fails
        }
      }
      return false;
    },
    async jwt({ token, user, account }) {
      // On first sign in (when account exists), get user from database
      if (account && token.email) {
        try {
          const dbUser = await findUserByEmail(token.email);
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role || 'reader';
          }
        } catch (error) {
          console.error('Error fetching user in JWT callback:', error);
        }
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