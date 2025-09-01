import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

interface ScheduleItem {
  id: string;
  day: string;
  title: string;
  story: string;
  time?: string;
}

const sampleSchedule: ScheduleItem[] = [
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
          {sampleSchedule.map((item) => (
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}