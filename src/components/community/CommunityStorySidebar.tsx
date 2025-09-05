"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";

interface CommunityStorySidebarProps {
  currentStoryId: string;
}

export function CommunityStorySidebar({ currentStoryId }: CommunityStorySidebarProps) {
  return (
    <div className="space-y-4">
      {/* Back to Community Hub */}
      <Card>
        <CardContent className="p-4">
          <Link 
            href="/community"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium transition-colors"
          >
            <span>←</span>
            <span>Community Hub</span>
          </Link>
        </CardContent>
      </Card>

      {/* Community Guidelines */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <span>📋</span>
            Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-start gap-2">
              <span>✅</span>
              <span>Be respectful to all community members</span>
            </div>
            <div className="flex items-start gap-2">
              <span>🚫</span>
              <span>No spoilers without proper tags</span>
            </div>
            <div className="flex items-start gap-2">
              <span>💡</span>
              <span>Share theories and discussions</span>
            </div>
            <div className="flex items-start gap-2">
              <span>🎨</span>
              <span>Fan art and creative content welcome</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}