/**
 * NextAuth v5 Configuration
 *
 * Provides authentication via:
 * - Google OAuth
 * - Email/Password (Credentials)
 */

import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { users } from "@/lib/schemas/drizzle";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: DrizzleAdapter(db),
    session: {
        strategy: "jwt",
    },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, credentials.email as string))
                    .limit(1);

                if (!user || user.length === 0) {
                    return null;
                }

                const dbUser = user[0];

                // Check if user has a password (OAuth users won't have one)
                if (!dbUser.password) {
                    return null;
                }

                const passwordMatch = await bcrypt.compare(
                    credentials.password as string,
                    dbUser.password,
                );

                if (!passwordMatch) {
                    return null;
                }

                return {
                    id: dbUser.id,
                    email: dbUser.email,
                    name: dbUser.name,
                    role: dbUser.role,
                    image: dbUser.image,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.AUTH_SECRET,
});
