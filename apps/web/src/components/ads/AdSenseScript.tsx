"use client";

import Script from "next/script";

/**
 * AdSenseScript Component
 *
 * Loads the Google AdSense script globally.
 * Only loads in production to avoid policy violations during development.
 * Uses Next.js Script component with afterInteractive strategy for optimal performance.
 *
 * Usage: Add once in your root layout or _app.tsx
 */
export function AdSenseScript() {
    const adsenseId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;

    // Only show ads in production
    if (process.env.NODE_ENV !== "production" || !adsenseId) {
        return null;
    }

    return (
        <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    );
}
