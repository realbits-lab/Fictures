import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

export function CommunityHighlights() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>💬</span>
          Community Highlights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">
              &ldquo;Theory about Maya&rsquo;s true power origin&rdquo;
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span>+847 💬</span>
              <span>+234 ❤️</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}