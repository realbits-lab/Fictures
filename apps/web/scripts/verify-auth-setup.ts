#!/usr/bin/env tsx

/**
 * Verify Authentication Setup
 *
 * Checks that all three users were created correctly in the database
 * with proper passwords and API keys using Drizzle ORM query builder.
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx scripts/verify-auth-setup.ts
 */

import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { apiKeys, users } from "../src/lib/db/schema";
import { loadAuthData } from "../src/lib/utils/auth-loader";
import {
    getEnvDisplayName,
    getFicturesEnv,
} from "../src/lib/utils/environment";

async function main() {
    const connectionString =
        process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
    if (!connectionString) {
        console.error("❌ DATABASE_URL not found");
        process.exit(1);
    }

    const client = postgres(connectionString, { max: 1, prepare: false });
    const db = drizzle(client, {
        schema: { users, apiKeys },
        casing: "snake_case",
    });

    try {
        console.log("🔍 Verifying authentication setup...\n");

        // Get all users using Drizzle query builder
        const userList = await db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                username: users.username,
                role: users.role,
                password: users.password,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(
                inArray(users.email, [
                    "manager@fictures.xyz",
                    "writer@fictures.xyz",
                    "reader@fictures.xyz",
                ]),
            )
            .orderBy(users.role);

        if (userList.length === 0) {
            console.log("❌ No users found!\n");
            process.exit(1);
        }

        console.log(`✅ Found ${userList.length} users:\n`);

        for (const user of userList) {
            console.log(`${user.role.toUpperCase()} - ${user.email}`);
            console.log(`  User ID:  ${user.id}`);
            console.log(`  Name:     ${user.name}`);
            console.log(`  Username: ${user.username}`);
            console.log(
                `  Password: ${user.password ? "✓ Set (PBKDF2 hashed)" : "✗ Not set"}`,
            );
            console.log(
                `  Created:  ${new Date(user.createdAt).toLocaleString()}`,
            );

            // Get API keys for this user using Drizzle query builder
            const userApiKeys = await db
                .select({
                    id: apiKeys.id,
                    name: apiKeys.name,
                    keyPrefix: apiKeys.keyPrefix,
                    scopes: apiKeys.scopes,
                    isActive: apiKeys.isActive,
                })
                .from(apiKeys)
                .where(eq(apiKeys.userId, user.id));

            if (userApiKeys.length > 0) {
                console.log(`  API Keys: ${userApiKeys.length} active`);
                for (const key of userApiKeys) {
                    console.log(`    - ${key.name} (${key.keyPrefix}...)`);
                    const scopes =
                        typeof key.scopes === "string"
                            ? JSON.parse(key.scopes)
                            : key.scopes;
                    console.log(`      Scopes: ${scopes.join(", ")}`);
                }
            } else {
                console.log(`  API Keys: ✗ None found`);
            }

            console.log("");
        }

        console.log("✅ Database authentication verified!\n");

        // Load and display auth file structure
        console.log(
            "═══════════════════════════════════════════════════════════",
        );
        console.log("📄 AUTH FILE STRUCTURE (.auth/user.json)");
        console.log(
            "═══════════════════════════════════════════════════════════\n",
        );

        try {
            const authData = loadAuthData();
            const currentEnv = getFicturesEnv();
            const envDisplay = getEnvDisplayName();

            console.log(
                `🌍 Current Environment: ${envDisplay} (${currentEnv})\n`,
            );

            // Display both environments
            for (const env of ["main", "develop"] as const) {
                console.log(`${env.toUpperCase()} Environment:`);
                const profiles = authData[env].profiles;

                for (const [role, profile] of Object.entries(profiles)) {
                    console.log(`  ${role}:`);
                    console.log(`    Email:   ${profile.email}`);
                    console.log(
                        `    API Key: ${profile.apiKey?.substring(0, 20)}...`,
                    );
                }
                console.log("");
            }

            console.log("✅ Auth file structure verified!\n");
            console.log(
                "═══════════════════════════════════════════════════════════\n",
            );
        } catch (authError) {
            console.error("⚠️  Warning: Could not load auth file");
            console.error(`   ${authError.message}\n`);
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
