import { redirect } from "next/navigation";
import { StoryAnalyticsDashboard } from "@/components/analysis/StoryAnalyticsDashboard";
import { MainLayout } from "@/components/layout";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth/permissions";

export default async function StoryAnalyticsPage({
    params,
}: {
    params: Promise<{ storyId: string }>;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    if (!hasAnyRole(session, ["writer", "manager"])) {
        redirect("/");
    }

    const { storyId } = await params;

    return (
        <MainLayout>
            <StoryAnalyticsDashboard storyId={storyId} />
        </MainLayout>
    );
}
