/**
 * Comic Status Card Component
 *
 * Displays the publishing status of comic panels for a scene in the Studio.
 * Shows current status, panel count, and action buttons.
 */

"use client";

import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ComicStatus = "none" | "draft" | "published";

interface ComicStatusCardProps {
    sceneId: string;
    sceneTitle: string;
    comicStatus: ComicStatus;
    comicPanelCount?: number;
    comicGeneratedAt?: string | null;
    comicPublishedAt?: string | null;
    isGenerating?: boolean;
    onGenerate?: () => void;
    onPublish?: () => void;
    onUnpublish?: () => void;
    onPreview?: () => void;
    className?: string;
}

export function ComicStatusCard({
    sceneId,
    sceneTitle,
    comicStatus,
    comicPanelCount = 0,
    comicGeneratedAt,
    comicPublishedAt,
    isGenerating = false,
    onGenerate,
    onPublish,
    onUnpublish,
    onPreview,
    className,
}: ComicStatusCardProps) {
    const getStatusIcon = () => {
        switch (comicStatus) {
            case "published":
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "draft":
                return <Clock className="h-5 w-5 text-yellow-500" />;
            case "none":
                return <XCircle className="h-5 w-5 text-gray-400" />;
        }
    };

    const getStatusText = () => {
        switch (comicStatus) {
            case "published":
                return "Published";
            case "draft":
                return "Draft";
            case "none":
                return "Not Generated";
        }
    };

    const getStatusColor = () => {
        switch (comicStatus) {
            case "published":
                return "text-green-600 dark:text-green-400";
            case "draft":
                return "text-yellow-600 dark:text-yellow-400";
            case "none":
                return "text-gray-500 dark:text-gray-400";
        }
    };

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        <CardTitle className="text-lg">Comic Panels</CardTitle>
                    </div>
                    <span
                        className={cn("text-sm font-medium", getStatusColor())}
                    >
                        {getStatusText()}
                    </span>
                </div>
                <CardDescription>
                    Visual adaptation for: {sceneTitle}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Status Details */}
                <div className="space-y-2 text-sm">
                    {comicStatus !== "none" && (
                        <>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Panels:
                                </span>
                                <span className="font-medium">
                                    {comicPanelCount}
                                </span>
                            </div>
                            {comicGeneratedAt && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Generated:
                                    </span>
                                    <span className="font-medium">
                                        {formatDate(comicGeneratedAt)}
                                    </span>
                                </div>
                            )}
                            {comicPublishedAt &&
                                comicStatus === "published" && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Published:
                                        </span>
                                        <span className="font-medium">
                                            {formatDate(comicPublishedAt)}
                                        </span>
                                    </div>
                                )}
                        </>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                    {comicStatus === "none" && (
                        <Button
                            onClick={onGenerate}
                            disabled={isGenerating}
                            className="w-full"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating Panels...
                                </>
                            ) : (
                                "Generate Comic Panels"
                            )}
                        </Button>
                    )}

                    {comicStatus === "draft" && (
                        <>
                            <Button
                                onClick={onPreview}
                                variant="outline"
                                className="w-full"
                            >
                                Preview Panels
                            </Button>
                            <Button
                                onClick={onPublish}
                                className="w-full"
                                disabled={isGenerating}
                            >
                                Publish Comic
                            </Button>
                            <Button
                                onClick={onGenerate}
                                variant="outline"
                                className="w-full"
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Regenerating...
                                    </>
                                ) : (
                                    "Regenerate Panels"
                                )}
                            </Button>
                        </>
                    )}

                    {comicStatus === "published" && (
                        <>
                            <Button
                                onClick={onPreview}
                                variant="outline"
                                className="w-full"
                            >
                                View Published Comic
                            </Button>
                            <Button
                                onClick={onUnpublish}
                                variant="outline"
                                className="w-full"
                            >
                                Unpublish Comic
                            </Button>
                        </>
                    )}
                </div>

                {/* Help Text */}
                {comicStatus === "none" && (
                    <p className="text-xs text-muted-foreground">
                        Generate comic panels to create a visual adaptation of
                        this scene. Takes 5-15 minutes.
                    </p>
                )}
                {comicStatus === "draft" && (
                    <p className="text-xs text-muted-foreground">
                        Review the generated panels before publishing to
                        readers.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
