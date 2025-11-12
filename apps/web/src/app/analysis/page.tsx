import { redirect } from "next/navigation";
import { AnalyticsLandingPage } from "@/components/analysis/AnalyticsLandingPage";
import { MainLayout } from "@/components/layout";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth/permissions";

export default async function AnalysisPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    if (!hasAnyRole(session, ["writer", "manager"])) {
        redirect("/");
    }

    return (
        <MainLayout>
            <AnalyticsLandingPage />
        </MainLayout>
    );
}
