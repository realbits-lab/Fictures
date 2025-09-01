import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui";

export function CreateStoryCard() {
  return (
    <Link href="/stories/new" className="block h-full">
      <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500">
        <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px] space-y-4 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <div className="text-6xl">📖</div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">+ Create New</h3>
            <h4 className="text-lg font-semibold">Story</h4>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Start your next literary adventure
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}