import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { verifyPassword } from './password';
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
    Credentials({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "email@example.com"
        },
        password: {
          label: "Password",
          type: "password"
        }
      },
      async authorize(credentials) {
        console.log('[AUTH] Authorize called with email:', credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials');
          return null;
        }

        try {
          // Find user by email
          console.log('[AUTH] Finding user by email:', credentials.email);
          const user = await findUserByEmail(credentials.email as string);

          if (!user) {
            console.log('[AUTH] User not found');
            return null;
          }

          console.log('[AUTH] User found:', user.email, 'Has password:', !!user.password);

          if (!user.password) {
            console.log('[AUTH] User has no password set');
            return null;
          }

          // Verify password
          console.log('[AUTH] Verifying password...');
          const isPasswordValid = await verifyPassword(
            credentials.password as string,
            user.password
          );

          console.log('[AUTH] Password valid:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('[AUTH] Invalid password');
            return null;
          }

          console.log('[AUTH] Authorization successful for:', user.email);
          // Return user object that will be used in JWT
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          console.error('[AUTH] Authorization error:', error);
          return null;
        }
      }
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ account, profile, user }) {
      // Allow credentials sign-ins (handled by authorize function)
      if (account?.provider === 'credentials') {
        return true;
      }

      // Allow Google OAuth sign-ins
      if (account?.provider === 'google') {
        if (!profile?.email) {
          return false; // No email provided
        }

        // Handle database persistence
        try {
          // Check if user already exists in database
          const existingUser = await findUserByEmail(profile.email);
          
          if (existingUser) {
            // Update existing user with latest info from OAuth profile
            await updateUser(existingUser.id, {
              name: profile.name ?? undefined,
              image: typeof profile.image === 'string' ? profile.image : undefined,
              emailVerified: new Date(), // Mark as verified since they just signed in via OAuth
            });
          } else {
            // Create new user in database
            await createUser({
              email: profile.email,
              name: profile.name ?? undefined,
              image: typeof profile.image === 'string' ? profile.image : undefined,
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