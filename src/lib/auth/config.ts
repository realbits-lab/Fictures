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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Find user by email
          const user = await findUserByEmail(credentials.email as string);

          if (!user || !user.password) {
            return null;
          }

          // Verify password
          const isPasswordValid = await verifyPassword(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // Return user object that will be used in JWT
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      }
    }),
  ],
  pages: {
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