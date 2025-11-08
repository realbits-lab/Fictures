import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard";
import { MainLayout } from "@/components/layout";
import { SkeletonLoader, StoryCardSkeleton } from "@/components/ui";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth/permissions";

// ⚡ Enable Partial Prerendering for faster initial load
export const experimental_ppr = true;

function DashboardSkeleton() {
	return (
		<SkeletonLoader>
			<div className="space-y-8">
				<section>
					<div className="flex items-center justify-between mb-6">
						<div>
							<div className="h-8 w-48 bg-[rgb(var(--color-muted))] rounded animate-pulse mb-2"></div>
							<div className="h-4 w-64 bg-[rgb(var(--color-muted))] rounded animate-pulse"></div>
						</div>
						<div className="h-10 w-40 bg-[rgb(var(--color-muted))] rounded animate-pulse"></div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<StoryCardSkeleton />
						<StoryCardSkeleton />
						<StoryCardSkeleton />
					</div>
				</section>
			</div>
		</SkeletonLoader>
	);
}

export default async function StoriesPage() {
	const session = await auth();

	if (!session) {
		redirect("/login");
	}

	if (!hasAnyRole(session, ["writer", "manager"])) {
		redirect("/");
	}

	return (
		<MainLayout>
			<Suspense fallback={<DashboardSkeleton />}>
				<DashboardClient />
			</Suspense>
		</MainLayout>
	);
}
