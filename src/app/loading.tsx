import { SkeletonLoader } from "@/components/ui";
import { MainLayout } from "@/components/layout";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function HomeHeroSkeleton() {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 py-20">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Skeleton height={80} width={80} className="mx-auto mb-4 rounded-full" />
            <Skeleton height={60} width={400} className="mx-auto" />
          </div>
          
          <Skeleton height={24} count={3} className="mb-8 mx-auto max-w-2xl" />
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Skeleton height={56} width={180} />
            <Skeleton height={56} width={180} />
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
          <Skeleton height={32} width={250} className="mx-auto mb-4" />
          <Skeleton height={20} width={200} className="mx-auto" />
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="mb-2">
                <Skeleton height={36} width={80} />
              </div>
              <div>
                <Skeleton height={16} width={100} />
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
          <Skeleton height={40} width={350} className="mx-auto mb-4" />
          <Skeleton height={20} width={400} className="mx-auto" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="text-center p-6 rounded-lg">
              <div className="mb-4">
                <Skeleton height={64} width={64} className="mx-auto rounded-full" />
              </div>
              <Skeleton height={24} width={150} className="mx-auto mb-3" />
              <Skeleton height={16} count={3} className="mx-auto" />
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