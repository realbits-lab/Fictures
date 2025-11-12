"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { pageview } from "@/lib/analysis/google-analytics";

/**
 * Client component that tracks page views automatically
 * Place this in the root layout to track all page navigations
 */
export function PageViewTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (pathname) {
            const url =
                pathname +
                (searchParams?.toString() ? `?${searchParams.toString()}` : "");
            pageview(url);
        }
    }, [pathname, searchParams]);

    return null;
}
