"use client";

import React, { useState } from "react";
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";
import { useUserSettings } from "@/lib/hooks/use-page-cache";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function AccountSettingsPage() {
  const { data: session } = useSession();
  const { data: userSettings, isLoading, error, mutate: refreshSettings } = useUserSettings();
  const [imageError, setImageError] = useState(false);

  // Show loading state for unauthenticated users
  if (!session?.user?.id) {
    return <div>Please sign in to view your account settings.</div>;
  }

  // Show skeleton loading while fetching
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Account Settings Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle>👤 Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Skeleton height={14} width={80} className="mb-2" />
                <Skeleton height={40} width="100%" />
              </div>
              <div>
                <Skeleton height={14} width={80} className="mb-2" />
                <Skeleton height={40} width="100%" />
                <Skeleton height={12} width="60%" className="mt-1" />
              </div>
            </div>
            
            <div>
              <Skeleton height={14} width={30} className="mb-2" />
              <Skeleton height={72} width="100%" />
            </div>

            <div>
              <Skeleton height={14} width={80} className="mb-2" />
              <div className="flex items-center gap-4">
                <Skeleton height={64} width={64} className="rounded-full" />
                <Skeleton height={14} width={250} />
              </div>
            </div>

            <div className="flex gap-3">
              <Skeleton height={36} width={100} />
              <Skeleton height={36} width={70} />
            </div>
          </CardContent>
        </Card>

        {/* Account Information Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Skeleton height={14} width={80} className="mb-1" />
                <Skeleton height={16} width={60} />
              </div>
              <div>
                <Skeleton height={14} width={80} className="mb-1" />
                <Skeleton height={16} width={100} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-[rgb(var(--foreground))] mb-2">
          Failed to load settings
        </h3>
        <p className="text-[rgb(var(--muted-foreground))] mb-4">
          {error.message || "Something went wrong while loading your settings."}
        </p>
        <button 
          onClick={() => refreshSettings()} 
          className="px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-lg hover:bg-[rgb(var(--primary)/90%)] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>👤 Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">
                Display Name
              </label>
              <input
                type="text"
                defaultValue={userSettings?.displayName || session?.user?.name || ""}
                className="w-full px-3 py-2 border border-[rgb(var(--input))] rounded-lg bg-[rgb(var(--background))] text-[rgb(var(--foreground))]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">
                Email Address
              </label>
              <input
                type="email"
                defaultValue={session?.user?.email || ""}
                disabled
                className="w-full px-3 py-2 border border-[rgb(var(--input))] rounded-lg bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]"
              />
              <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                Email cannot be changed as it&apos;s managed by OAuth provider
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">
              Bio
            </label>
            <textarea
              rows={3}
              defaultValue={userSettings?.bio || ""}
              placeholder="Tell us about yourself as a writer..."
              className="w-full px-3 py-2 border border-[rgb(var(--input))] rounded-lg bg-[rgb(var(--background))] text-[rgb(var(--foreground))]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">
              Profile Image
            </label>
            <div className="flex items-center gap-4">
              {session?.user?.image && !imageError ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'Profile'}
                  className="w-16 h-16 rounded-full object-cover"
                  onError={() => setImageError(true)}
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                      setImageError(true);
                    }
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[rgb(var(--primary))] flex items-center justify-center">
                  <span className="text-2xl font-semibold text-[rgb(var(--primary-foreground))]">
                    {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="text-sm text-[rgb(var(--muted-foreground))]">
                Profile image is managed by your OAuth provider (Google)
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button>Save Changes</Button>
            <Button variant="ghost">Cancel</Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-[rgb(var(--muted-foreground))]">Account Type:</span>
              <div className="text-[rgb(var(--foreground))] capitalize">
                {userSettings?.accountType || session?.user?.role || 'User'}
              </div>
            </div>
            <div>
              <span className="font-medium text-[rgb(var(--muted-foreground))]">Member Since:</span>
              <div className="text-[rgb(var(--foreground))]">
                {userSettings?.memberSince ? new Date(userSettings.memberSince).toLocaleDateString() : new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}