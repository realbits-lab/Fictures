"use client";

import Image from "next/image";
import { useState } from "react";

interface StoryImageProps {
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
    sizes?: string;
    width?: number;
    height?: number;
    priority?: boolean;
    placeholderType?: "story" | "character" | "inline"; // Type of placeholder to use
}

export function StoryImage({
    src,
    alt,
    fill,
    className,
    sizes,
    width,
    height,
    priority = false,
    placeholderType = "inline",
}: StoryImageProps) {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Select placeholder image based on type
    const getPlaceholderSrc = () => {
        switch (placeholderType) {
            case "story":
                return "/images/placeholder-story.svg";
            case "character":
                return "/images/placeholder-character.svg";
            default:
                return null;
        }
    };

    const placeholderSrc = getPlaceholderSrc();

    // If error or no src, show placeholder
    if (hasError || !src) {
        // Use image placeholder if specified
        if (placeholderSrc) {
            return (
                <Image
                    src={placeholderSrc}
                    alt={`${alt} (placeholder)`}
                    {...(fill
                        ? { fill: true }
                        : { width, height })}
                    className={className}
                    sizes={sizes}
                    priority={priority}
                />
            );
        }

        // Fallback to inline SVG placeholder
        return (
            <div
                className={`w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center ${className || ""}`}
            >
                <svg
                    width="120"
                    height="120"
                    viewBox="0 0 120 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-gray-400 dark:text-gray-600"
                >
                    <rect
                        x="20"
                        y="30"
                        width="80"
                        height="60"
                        rx="4"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                    />
                    <path
                        d="M30 40 L90 40"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <path
                        d="M35 50 L55 50"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    />
                    <path
                        d="M35 56 L65 56"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    />
                    <path
                        d="M35 62 L60 62"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    />
                    <path
                        d="M35 68 L70 68"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    />
                    <path
                        d="M35 74 L55 74"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    />
                    <circle cx="60" cy="45" r="3" fill="currentColor" />
                </svg>
                <span className="sr-only">{alt}</span>
            </div>
        );
    }

    return (
        <>
            {isLoading && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700">
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent animate-shimmer"
                        style={{ backgroundSize: "200% 100%" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-12 h-12">
                            <svg
                                className="animate-spin text-gray-400 dark:text-gray-600"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            )}
            <Image
                src={src}
                alt={alt}
                {...(fill
                    ? { fill: true }
                    : { width, height })}
                className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
                sizes={sizes}
                priority={priority}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setIsLoading(false);
                    setHasError(true);
                }}
            />
        </>
    );
}
