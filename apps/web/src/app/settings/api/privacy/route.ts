import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

// GET /api/settings/privacy - Get user's privacy settings
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // Return default privacy settings
        const privacySettings = {
            profile: {
                visibility: "public", // 'public', 'followers', 'private'
                showEmail: false,
                showJoinDate: true,
                showStats: true,
                showReadingList: false,
            },
            stories: {
                defaultVisibility: "public", // 'public', 'unlisted', 'private'
                allowComments: true,
                allowRatings: true,
                showWordCount: true,
                allowDownload: false,
            },
            activity: {
                showReadingActivity: false,
                showWritingProgress: true,
                showFollowing: true,
                showFollowers: true,
            },
            data: {
                allowAnalytics: true,
                allowPersonalization: true,
                shareDataWithPartners: false,
                dataRetentionPeriod: "2-years", // '1-year', '2-years', '5-years', 'indefinite'
            },
            communication: {
                allowDirectMessages: true,
                allowMentions: true,
                restrictDMsToFollowers: false,
                blockUnverifiedUsers: false,
            },
            safety: {
                enableTwoFactorAuth: false,
                requirePasswordForSensitiveActions: true,
                logSecurityEvents: true,
                sessionTimeout: "24-hours", // '1-hour', '24-hours', '7-days', 'never'
            },
        };

        return NextResponse.json(privacySettings);
    } catch (error) {
        console.error("Error fetching privacy settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

// PUT /api/settings/privacy - Update user's privacy settings
export async function PUT(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await request.json();

        // For now, we'll just return the updated data
        // In a real implementation, this would save to the database
        const updatedSettings = {
            profile: {
                visibility: body.profile?.visibility || "public",
                showEmail: body.profile?.showEmail ?? false,
                showJoinDate: body.profile?.showJoinDate ?? true,
                showStats: body.profile?.showStats ?? true,
                showReadingList: body.profile?.showReadingList ?? false,
            },
            stories: {
                defaultVisibility: body.stories?.defaultVisibility || "public",
                allowComments: body.stories?.allowComments ?? true,
                allowRatings: body.stories?.allowRatings ?? true,
                showWordCount: body.stories?.showWordCount ?? true,
                allowDownload: body.stories?.allowDownload ?? false,
            },
            activity: {
                showReadingActivity:
                    body.activity?.showReadingActivity ?? false,
                showWritingProgress: body.activity?.showWritingProgress ?? true,
                showFollowing: body.activity?.showFollowing ?? true,
                showFollowers: body.activity?.showFollowers ?? true,
            },
            data: {
                allowAnalytics: body.data?.allowAnalytics ?? true,
                allowPersonalization: body.data?.allowPersonalization ?? true,
                shareDataWithPartners:
                    body.data?.shareDataWithPartners ?? false,
                dataRetentionPeriod:
                    body.data?.dataRetentionPeriod || "2-years",
            },
            communication: {
                allowDirectMessages:
                    body.communication?.allowDirectMessages ?? true,
                allowMentions: body.communication?.allowMentions ?? true,
                restrictDMsToFollowers:
                    body.communication?.restrictDMsToFollowers ?? false,
                blockUnverifiedUsers:
                    body.communication?.blockUnverifiedUsers ?? false,
            },
            safety: {
                enableTwoFactorAuth: body.safety?.enableTwoFactorAuth ?? false,
                requirePasswordForSensitiveActions:
                    body.safety?.requirePasswordForSensitiveActions ?? true,
                logSecurityEvents: body.safety?.logSecurityEvents ?? true,
                sessionTimeout: body.safety?.sessionTimeout || "24-hours",
            },
        };

        console.log("Privacy settings updated for:", session.user.email);

        return NextResponse.json(updatedSettings);
    } catch (error) {
        console.error("Error updating privacy settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
