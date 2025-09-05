import { Skeleton } from "@/components/ui"
import { MainLayout } from "@/components/layout";
import { SkeletonLoader, StoryCardSkeleton, DashboardWidgetSkeleton } from "@/components/ui";

function CreateStoryCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-600 p-6">
      <div className="text-center">
        <Skeleton className="h-12 w-12 mx-auto mb-4 rounded-full" />
        <Skeleton className="h-5 w-3/5 mx-auto mb-2" />
        <Skeleton className="h-4 w-4/5 mx-auto" />
      </div>
    </div>
  );
}

export default function StoriesLoading() {
  return (
    <MainLayout>
      <SkeletonLoader theme="light">
        <div className="space-y-8">
          {/* Stories Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-38" />
                </div>
                <Skeleton className="h-4 w-60" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CreateStoryCardSkeleton />
              <StoryCardSkeleton />
              <StoryCardSkeleton />
            </div>
          </section>

          {/* Dashboard Widgets */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <DashboardWidgetSkeleton />
              <DashboardWidgetSkeleton />
            </div>
            <div className="space-y-6">
              <DashboardWidgetSkeleton />
              <DashboardWidgetSkeleton />
            </div>
          </section>
        </div>
      </SkeletonLoader>
    </MainLayout>
  );
}