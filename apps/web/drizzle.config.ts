import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/lib/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        // Use direct (unpooled) connection for migrations
        // Pooled connections don't support all DDL operations required by migrations
        url:
            process.env.DATABASE_URL_UNPOOLED ||
            (() => {
                throw new Error(
                    "DATABASE_URL_UNPOOLED is required for migrations",
                );
            })(),
    },
});
