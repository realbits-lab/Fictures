import { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        // Auto-approve Google sign-ins for jong95@gmail.com
        if (user.email === 'jong95@gmail.com') {
          return true;
        }
        // You can add more permitted emails here or implement other logic
        return user.email === 'jong95@gmail.com';
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
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