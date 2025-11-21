"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Skeleton,
} from "@/components/ui";
import { useUserSettings } from "@/hooks/use-page-cache";

export default function AccountSettingsPage() {
    const { data: session } = useSession();
    const {
        data: userSettings,
        isLoading,
        error,
        mutate: refreshSettings,
    } = useUserSettings();
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
                                <Skeleton className="h-[14px] w-20 mb-2" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div>
                                <Skeleton className="h-[14px] w-20 mb-2" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-3 w-3/5 mt-1" />
                            </div>
                        </div>

                        <div>
                            <Skeleton className="h-[14px] w-8 mb-2" />
                            <Skeleton className="h-18 w-full" />
                        </div>

                        <div>
                            <Skeleton className="h-[14px] w-20 mb-2" />
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-16 w-16 rounded-full" />
                                <Skeleton className="h-[14px] w-60" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Skeleton className="h-9 w-25" />
                            <Skeleton className="h-9 w-18" />
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
                                <Skeleton className="h-[14px] w-20 mb-1" />
                                <Skeleton className="h-4 w-15" />
                            </div>
                            <div>
                                <Skeleton className="h-[14px] w-20 mb-1" />
                                <Skeleton className="h-4 w-25" />
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
                <h3 className="text-lg font-medium text-[rgb(var(--color-foreground))] mb-2">
                    Failed to load settings
                </h3>
                <p className="text-[rgb(var(--color-muted-foreground))] mb-4">
                    {error.message ||
                        "Something went wrong while loading your settings."}
                </p>
                <button
                    onClick={() => refreshSettings()}
                    className="px-4 py-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))] rounded-lg hover:bg-[rgb(var(--color-primary)/90%)] transition-colors"
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
                            <label className="block text-sm font-medium text-[rgb(var(--color-foreground))] mb-2">
                                Display Name
                            </label>
                            <input
                                type="text"
                                defaultValue={
                                    userSettings?.displayName ||
                                    session?.user?.name ||
                                    ""
                                }
                                className="w-full px-3 py-2 border border-[rgb(var(--color-input))] rounded-lg bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[rgb(var(--color-foreground))] mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                defaultValue={session?.user?.email || ""}
                                disabled
                                className="w-full px-3 py-2 border border-[rgb(var(--color-input))] rounded-lg bg-[rgb(var(--color-muted))] text-[rgb(var(--color-muted-foreground))]"
                            />
                            <p className="text-xs text-[rgb(var(--color-muted-foreground))] mt-1">
                                Email cannot be changed as it&apos;s managed by
                                OAuth provider
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[rgb(var(--color-foreground))] mb-2">
                            Bio
                        </label>
                        <textarea
                            rows={3}
                            defaultValue={userSettings?.bio || ""}
                            placeholder="Tell us about yourself as a writer..."
                            className="w-full px-3 py-2 border border-[rgb(var(--color-input))] rounded-lg bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[rgb(var(--color-foreground))] mb-2">
                            Profile Image
                        </label>
                        <div className="flex items-center gap-4">
                            {session?.user?.image && !imageError ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={session.user.image}
                                    alt={session.user.name || "Profile"}
                                    className="w-16 h-16 rounded-full object-cover"
                                    onError={() => setImageError(true)}
                                    onLoad={(e) => {
                                        const img =
                                            e.target as HTMLImageElement;
                                        if (
                                            img.naturalWidth === 0 ||
                                            img.naturalHeight === 0
                                        ) {
                                            setImageError(true);
                                        }
                                    }}
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-[rgb(var(--color-primary))] flex items-center justify-center">
                                    <span className="text-2xl font-semibold text-[rgb(var(--color-primary-foreground))]">
                                        {session?.user?.name?.[0]?.toUpperCase() ||
                                            "U"}
                                    </span>
                                </div>
                            )}
                            <div className="text-sm text-[rgb(var(--color-muted-foreground))]">
                                Profile image is managed by your OAuth provider
                                (Google)
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
                            <span className="font-medium text-[rgb(var(--color-muted-foreground))]">
                                Account Type:
                            </span>
                            <div className="text-[rgb(var(--color-foreground))] capitalize">
                                {userSettings?.accountType ||
                                    session?.user?.role ||
                                    "User"}
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-[rgb(var(--color-muted-foreground))]">
                                Member Since:
                            </span>
                            <div className="text-[rgb(var(--color-foreground))]">
                                {userSettings?.memberSince
                                    ? new Date(
                                          userSettings.memberSince,
                                      ).toLocaleDateString()
                                    : new Date().toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
