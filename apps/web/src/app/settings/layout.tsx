import { redirect } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { auth } from "@/lib/auth";

export default async function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    return (
        <MainLayout>
            <div className="space-y-8">
                {/* Page Header */}
                <div>
                    <h1 className="text-3xl font-bold text-[rgb(var(--color-foreground))] flex items-center gap-3">
                        <span>⚙️</span>
                        Settings
                    </h1>
                    <p className="text-[rgb(var(--color-muted-foreground))] mt-2">
                        Customize your writing experience and preferences
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Settings Sidebar */}
                    <div className="lg:col-span-1">
                        <SettingsSidebar />
                    </div>

                    {/* Main Settings Content */}
                    <div className="lg:col-span-3">{children}</div>
                </div>
            </div>
        </MainLayout>
    );
}
