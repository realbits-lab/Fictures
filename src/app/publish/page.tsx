import { PublishClient } from "@/components/publish";
import { MainLayout } from "@/components/layout";

export default function PublishPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <span>📤</span>
            Publication Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Schedule, publish, and track your story releases
          </p>
        </div>
        
        <PublishClient />
      </div>
    </MainLayout>
  );
}