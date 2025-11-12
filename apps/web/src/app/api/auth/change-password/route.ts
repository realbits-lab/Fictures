import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const runtime = "nodejs";

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
        .string()
        .min(8, "New password must be at least 8 characters"),
});

// POST /api/auth/change-password - Change user password
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await request.json();
        const validatedData = changePasswordSchema.parse(body);

        // Get user from database
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, session.user.id))
            .limit(1);

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        // Check if user has a password (email/password login)
        if (!user.password) {
            return NextResponse.json(
                {
                    error: "Cannot change password for OAuth users. Password changes are only available for email/password accounts.",
                },
                { status: 400 },
            );
        }

        // Verify current password
        const isPasswordValid = await verifyPassword(
            validatedData.currentPassword,
            user.password,
        );
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Current password is incorrect" },
                { status: 400 },
            );
        }

        // Check if new password is same as current
        const isSamePassword = await verifyPassword(
            validatedData.newPassword,
            user.password,
        );
        if (isSamePassword) {
            return NextResponse.json(
                {
                    error: "New password must be different from current password",
                },
                { status: 400 },
            );
        }

        // Hash new password
        const hashedPassword = await hashPassword(validatedData.newPassword);

        // Update password in database
        await db
            .update(users)
            .set({
                password: hashedPassword,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(users.id, session.user.id));

        console.log(
            `✅ Password changed successfully for user ${session.user.id}`,
        );

        return NextResponse.json({
            message: "Password changed successfully",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input", details: error.issues },
                { status: 400 },
            );
        }

        console.error("Error changing password:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
