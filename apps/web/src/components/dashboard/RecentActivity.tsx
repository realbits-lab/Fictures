import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

interface ActivityItem {
  id: string;
  type: "chapter_completed" | "comments" | "readers" | "part_finished";
  message: string;
  timestamp: string;
  icon: string;
}

const sampleActivity: ActivityItem[] = [
  {
    id: "1",
    type: "chapter_completed",
    message: "Chapter 16 draft completed",
    timestamp: "2h ago",
    icon: "📝"
  },
  {
    id: "2", 
    type: "comments",
    message: "23 new comments",
    timestamp: "4h ago",
    icon: "💬"
  },
  {
    id: "3",
    type: "readers", 
    message: "156 new readers",
    timestamp: "6h ago",
    icon: "👥"
  },
  {
    id: "4",
    type: "part_finished",
    message: "Part 3 finished",
    timestamp: "1d ago",
    icon: "📚"
  }
];

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📈</span>
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sampleActivity.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[rgb(var(--color-foreground))]">
                  • {item.message}
                </p>
                <p className="text-xs text-[rgb(var(--color-muted-foreground))] mt-1">
                  ({item.timestamp})
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}