import { redirect } from "next/navigation";
import { ROIAnalysisDashboard } from "@/components/analysis/ROIAnalysisDashboard";
import { MainLayout } from "@/components/layout";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth/permissions";

export default async function ROIAnalysisPage({
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
            <div className="container mx-auto py-8 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        ROI Analysis
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Track token usage, costs, ad revenue, and return on
                        investment for your story
                    </p>
                </div>

                <ROIAnalysisDashboard storyId={storyId} />
            </div>
        </MainLayout>
    );
}
