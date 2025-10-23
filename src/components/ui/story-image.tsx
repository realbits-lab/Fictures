"use client";

import React, { useState } from "react";
import Image from "next/image";

interface StoryImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  width?: number;
  height?: number;
}

export function StoryImage({ src, alt, fill, className, sizes, width, height }: StoryImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center ${className || ''}`}>
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-400 dark:text-gray-600"
        >
          <rect x="20" y="30" width="80" height="60" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M30 40 L90 40" stroke="currentColor" strokeWidth="2"/>
          <path d="M35 50 L55 50" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M35 56 L65 56" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M35 62 L60 62" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M35 68 L70 68" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M35 74 L55 74" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="60" cy="45" r="3" fill="currentColor"/>
        </svg>
        <span className="sr-only">{alt}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      onError={() => setHasError(true)}
    />
  );
}
