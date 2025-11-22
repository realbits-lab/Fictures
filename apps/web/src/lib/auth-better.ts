/**
 * Better Auth Configuration
 *
 * Provides authentication via:
 * - Google OAuth
 * - Email/Password (Credentials)
 * - Anonymous (for guest users)
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins";
import { db } from "@/lib/db";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // PostgreSQL
        usePlural: true, // Use plural table names (users, accounts, sessions, etc.)
    }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
    plugins: [
        anonymous({
            // Generate anonymous user emails with a custom domain
            emailDomainName: process.env.NEXT_PUBLIC_APP_URL || "fictures.xyz",
            // Callback when anonymous user signs up with real credentials
            onLinkAccount: async ({ anonymousUser, newUser }) => {
                console.log(
                    `Linking anonymous user ${anonymousUser.user.id} to ${newUser.user.id}`,
                );
                // TODO: Transfer anonymous user's likes and replies to the new account
                // This will be implemented in the migration of likes/replies
            },
            // Don't delete anonymous user immediately (for data migration)
            disableDeleteAnonymousUser: false,
        }),
    ],
    secret: process.env.AUTH_SECRET!,
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    trustedOrigins: [
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ],
});

export type Session = typeof auth.$Infer.Session;
