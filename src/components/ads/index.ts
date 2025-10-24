/**
 * Google AdSense Components
 *
 * This module provides reusable components for integrating Google AdSense ads
 * into the Fictures platform.
 *
 * Components:
 * - AdSenseScript: Global script loader (add to root layout)
 * - AdUnit: Standard ad display component
 * - InFeedAd: Specialized in-feed ads for content grids
 *
 * @example
 * ```tsx
 * // In root layout
 * import { AdSenseScript } from '@/components/ads';
 * <AdSenseScript />
 *
 * // In page content
 * import { AdUnit, InFeedAd } from '@/components/ads';
 * <AdUnit slot="1234567890" format="horizontal" />
 * <InFeedAd slot="9876543210" />
 * ```
 */

export { AdSenseScript } from './AdSenseScript';
export { AdUnit } from './AdUnit';
export { InFeedAd } from './InFeedAd';
