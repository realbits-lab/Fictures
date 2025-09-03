import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

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
        // Get allowed emails from environment variable
        const allowedEmailsEnv = process.env.ALLOWED_EMAILS;
        
        // If no ALLOWED_EMAILS is set, allow all Google accounts
        if (!allowedEmailsEnv) {
          return true;
        }
        
        // If ALLOWED_EMAILS is set, check if user email is in the list
        const allowedEmails = allowedEmailsEnv.split(',').map(email => email.trim());
        if (profile?.email && allowedEmails.includes(profile.email)) {
          return true;
        }
        
        // Reject unauthorized users when ALLOWED_EMAILS is configured
        return false;
      }
      return false;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id || '';
        token.role = 'reader'; // Default role for OAuth users
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