"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Progress } from "@/components/ui";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

interface ProfileClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    hasPassword: boolean;
  };
}

export function ProfileClient({ user }: ProfileClientProps) {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // Get user initials for avatar
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {user.image ? (
              <img src={user.image} alt={user.name || "Profile"} className="w-24 h-24 rounded-full" />
            ) : (
              getInitials(user.name)
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {user.name || "User"}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button size="sm">Edit Profile</Button>
              {user.hasPassword && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPasswordDialog(true)}
                >
                  🔒 Change Password
                </Button>
              )}
              <Button size="sm" variant="ghost">Share Profile</Button>
            </div>
          </div>
        </div>

        {/* Profile Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Words</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Stories Published</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-orange-600">-</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Published Stories */}
            <Card>
              <CardHeader>
                <CardTitle>📚 Published Stories</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-4">📖</div>
                  <p>No published stories yet</p>
                  <p className="text-sm mt-2">Start writing your first story!</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>📈 Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-4">🎯</div>
                  <p>No recent activity</p>
                  <p className="text-sm mt-2">Your writing activity will appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Writing Progress */}
            <Card>
              <CardHeader>
                <CardTitle>🎯 Writing Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Daily Goal</span>
                    <span className="font-medium">0 / 2,000</span>
                  </div>
                  <Progress value={0} variant="default" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Weekly Goal</span>
                    <span className="font-medium">0 / 10,000</span>
                  </div>
                  <Progress value={0} variant="default" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Goal</span>
                    <span className="font-medium">0 / 40,000</span>
                  </div>
                  <Progress value={0} variant="default" />
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Streak:</span>
                      <span className="font-medium">0 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Best Streak:</span>
                      <span className="font-medium">0 days</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Password Change Dialog */}
      <ChangePasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
      />
    </>
  );
}
