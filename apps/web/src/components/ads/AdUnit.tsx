"use client";

import { useEffect, useRef, useState } from "react";

interface AdUnitProps {
	/**
	 * AdSense ad slot ID
	 * Get this from your AdSense dashboard when creating an ad unit
	 * Example: "1234567890"
	 */
	slot: string;

	/**
	 * Ad format type
	 * - 'auto': Responsive, adapts to container (recommended)
	 * - 'horizontal': Wide horizontal banner (728x90 desktop, 320x100 mobile)
	 * - 'rectangle': Medium rectangle (300x250)
	 * - 'vertical': Vertical banner (160x600)
	 */
	format?: "auto" | "horizontal" | "rectangle" | "vertical";

	/**
	 * Enable responsive sizing for mobile
	 * When true, ads expand to full width on mobile devices
	 */
	responsive?: boolean;

	/**
	 * Custom CSS classes for the container
	 */
	className?: string;

	/**
	 * Fixed height for the ad container
	 * Helps prevent layout shift (CLS)
	 * Recommended for better Core Web Vitals
	 */
	style?: React.CSSProperties;
}

/**
 * AdUnit Component
 *
 * Displays a Google AdSense ad unit.
 * Handles loading, error states, and responsive behavior.
 * Only renders in production environment.
 *
 * @example
 * ```tsx
 * <AdUnit
 *   slot="1234567890"
 *   format="horizontal"
 *   responsive={true}
 *   className="my-4"
 * />
 * ```
 */
export function AdUnit({
	slot,
	format = "auto",
	responsive = true,
	className = "",
	style = {},
}: AdUnitProps) {
	const adRef = useRef<HTMLModElement>(null);
	const [adLoaded, setAdLoaded] = useState(false);
	const [adError, setAdError] = useState(false);
	const adsenseId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;

	useEffect(() => {
		// Only load ads in production
		if (process.env.NODE_ENV !== "production" || !adsenseId) {
			return;
		}

		try {
			// Push ad to AdSense queue
			if (
				typeof window !== "undefined" &&
				window.adsbygoogle &&
				adRef.current
			) {
				(window.adsbygoogle = window.adsbygoogle || []).push({});
				setAdLoaded(true);
			}
		} catch (error) {
			console.error("AdSense error:", error);
			setAdError(true);
		}
	}, [adsenseId]);

	// Development mode: Show placeholder
	if (process.env.NODE_ENV !== "production" || !adsenseId) {
		return (
			<div
				className={`border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center ${className}`}
				style={style}
			>
				<div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
					Ad Placeholder
					<br />
					<span className="text-xs">Slot: {slot}</span>
					<br />
					<span className="text-xs">Format: {format}</span>
					<br />
					<span className="text-xs opacity-70">
						(Ads only show in production)
					</span>
				</div>
			</div>
		);
	}

	// Error state
	if (adError) {
		return null; // Silently fail - don't show error to users
	}

	return (
		<div className={`ad-container ${className}`} style={style}>
			{/* Skeleton loader while ad loads */}
			{!adLoaded && (
				<div className="h-[250px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
			)}

			{/* AdSense ad unit */}
			<ins
				ref={adRef}
				className="adsbygoogle"
				style={{
					display: "block",
					...style,
				}}
				data-ad-client={adsenseId}
				data-ad-slot={slot}
				data-ad-format={format}
				data-full-width-responsive={responsive ? "true" : "false"}
			/>
		</div>
	);
}

// Extend Window interface for TypeScript
declare global {
	interface Window {
		adsbygoogle: any[];
	}
}
