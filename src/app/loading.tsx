import { SkeletonLoader, Skeleton } from "@/components/ui";
import { MainLayout } from "@/components/layout";

function HomeHeroSkeleton() {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 py-20">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Skeleton className="h-20 w-20 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-15 w-96 mx-auto" />
          </div>
          
          <div className="space-y-2 mb-8 max-w-2xl mx-auto">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Skeleton className="h-14 w-44" />
            <Skeleton className="h-14 w-44" />
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeStatsSkeleton() {
  return (
    <div className="py-16 bg-gray-50 dark:bg-gray-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-5 w-48 mx-auto" />
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="mb-2">
                <Skeleton className="h-9 w-20" />
              </div>
              <div>
                <Skeleton className="h-4 w-25" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeFeaturesSkeleton() {
  return (
    <div className="py-20 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Skeleton className="h-10 w-88 mx-auto mb-4" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="text-center p-6 rounded-lg">
              <div className="mb-4">
                <Skeleton className="h-16 w-16 mx-auto rounded-full" />
              </div>
              <Skeleton className="h-6 w-38 mx-auto mb-3" />
              <div className="space-y-1 mx-auto">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomeLoading() {
  return (
    <MainLayout>
      <SkeletonLoader theme="light">
        <div className="min-h-screen">
          <HomeHeroSkeleton />
          <HomeStatsSkeleton />
          <HomeFeaturesSkeleton />
        </div>
      </SkeletonLoader>
    </MainLayout>
  );
}