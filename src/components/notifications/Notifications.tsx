"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

interface Notification {
  id: string;
  type: "comment" | "like" | "follow" | "contest" | "system" | "collaboration" | "achievement";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  priority: "high" | "medium" | "low";
  action?: {
    label: string;
    onClick: () => void;
  };
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "comment",
    title: "New comment on \"The Midnight Chronicles\"",
    description: "Sarah left a comment: \"This plot twist was absolutely brilliant! I can't wait for the next chapter.\"",
    timestamp: "2 minutes ago",
    read: false,
    priority: "medium",
    action: { label: "Reply", onClick: () => console.log("Reply to comment") }
  },
  {
    id: "2", 
    type: "achievement",
    title: "Achievement Unlocked: Rising Star",
    description: "Your story reached 1000 readers! You've earned the Rising Star achievement.",
    timestamp: "1 hour ago",
    read: false,
    priority: "high"
  },
  {
    id: "3",
    type: "collaboration",
    title: "Beta reader request",
    description: "Alex wants to be a beta reader for \"Shadows of Tomorrow\". Review their request.",
    timestamp: "3 hours ago", 
    read: false,
    priority: "medium",
    action: { label: "Review", onClick: () => console.log("Review beta reader request") }
  },
  {
    id: "4",
    type: "contest",
    title: "Contest submission deadline reminder",
    description: "The \"Fantasy Flash Fiction\" contest closes in 24 hours. Submit your entry now!",
    timestamp: "5 hours ago",
    read: true,
    priority: "high"
  },
  {
    id: "5",
    type: "follow",
    title: "New followers",
    description: "3 new readers started following your work today.",
    timestamp: "1 day ago",
    read: true,
    priority: "low"
  }
];

const notificationIcons = {
  comment: "💬",
  like: "❤️",
  follow: "👥",
  contest: "🏆",
  system: "⚠️",
  collaboration: "📖",
  achievement: "⚡"
};

const priorityColors = {
  high: "destructive",
  medium: "default",
  low: "secondary"
} as const;

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = searchQuery === "" || 
                         notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const icon = notificationIcons[notification.type];
    
    return (
      <Card className={`transition-all hover:shadow-md ${!notification.read ? 'bg-blue-50 dark:bg-blue-950' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${!notification.read ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <span className="text-lg">{icon}</span>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{notification.title}</h4>
                <div className="flex items-center gap-2">
                  <Badge className="text-xs">
                    {notification.priority}
                  </Badge>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">{notification.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
                <div className="flex items-center gap-1">
                  {notification.action && (
                    <Button variant="outline" size="sm" onClick={notification.action.onClick}>
                      {notification.action.label}
                    </Button>
                  )}
                  {!notification.read && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                    >
                      ✓
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deleteNotification(notification.id)}
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-2xl">🔔</span>
            Notifications
            {unreadCount > 0 && (
              <Badge className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Stay updated with your story activity and community engagement</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button onClick={clearAllNotifications}>
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <span className="absolute left-2 top-2.5 text-sm text-muted-foreground">🔍</span>
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <span className="text-6xl mb-4 block">🔔</span>
              <h3 className="text-lg font-medium mb-2">No notifications found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search query." : "You're all caught up! New notifications will appear here."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}