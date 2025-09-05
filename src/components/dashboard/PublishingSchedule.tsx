"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { usePublishStatus } from "@/lib/hooks/use-page-cache";
import { Skeleton } from "@/components/ui";

interface ScheduleItem {
  id: string;
  day: string;
  title: string;
  story: string;
  time?: string;
}

const fallbackSchedule: ScheduleItem[] = [
  {
    id: "1",
    day: "Wed",
    title: "Chapter 16",
    story: "Dragon Chron.",
    time: "2:00 PM"
  },
  {
    id: "2",
    day: "Fri", 
    title: "Part 4 Finale",
    story: "Shadow Keeper",
    time: "6:00 PM"
  },
  {
    id: "3",
    day: "Mon",
    title: "New story ann.",
    story: "",
    time: "12:00 PM"
  }
];

export function PublishingSchedule() {
  const { data: publishStatus, isLoading, error } = usePublishStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🎯</span>
          Publishing Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-30" />
                  <Skeleton className="h-3 w-15" />
                </div>
                <div className="pl-4">
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
          ) : error ? (
            // Error state
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Unable to load schedule</p>
            </div>
          ) : (
            // Display data
            (publishStatus?.upcomingSchedule || fallbackSchedule).map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {item.day}: {item.title}
                  </span>
                  {item.time && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ⏰ {item.time}
                    </span>
                  )}
                </div>
                {item.story && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 pl-4">
                    {item.story}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}