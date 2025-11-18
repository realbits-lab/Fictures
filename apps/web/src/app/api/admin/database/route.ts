import { sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { requireScopes } from "@/lib/auth/middleware";
import { getAuth } from "@/lib/auth/server-context";
import { db } from "@/lib/db";

export const POST = requireScopes("admin:all")(
    async (
        request: NextRequest,
        context: { params: Promise<Record<string, never>> },
    ) => {
        try {
            const _auth = getAuth();
            // context.params is not used in this route
            void context;

            const body = await request.json();
            const { query } = body;

            if (!query) {
                return new Response("Query is required", { status: 400 });
            }

            // Only allow DELETE FROM stories for safety
            if (!query.toLowerCase().includes("delete from stories")) {
                return new Response("Only DELETE FROM stories is allowed", {
                    status: 400,
                });
            }

            console.log("🗑️ Executing database cleanup:", query);

            // Execute the query
            const _result = await db.execute(sql.raw(query));

            console.log("✅ Database cleanup completed");

            return Response.json({
                success: true,
                message: "Database cleanup completed",
            });
        } catch (error) {
            console.error("❌ Database operation error:", error);
            return Response.json(
                {
                    success: false,
                    error: "Database operation failed",
                    details:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                { status: 500 },
            );
        }
    },
);
