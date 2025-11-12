/**
 * Comic Layout Calculator
 *
 * Calculates vertical scroll layout dimensions and provides
 * utilities for comic panel positioning and spacing.
 */

// ============================================
// CONSTANTS
// ============================================

export const COMIC_CONSTANTS = {
    // Gemini 2.5 Flash Image dimensions (7:4 aspect ratio = 1.75:1)
    PANEL_WIDTH: 1344,
    PANEL_HEIGHT: 768,

    // Static spacing between panels (matches Tailwind space-y-6 in viewer)
    STATIC_PANEL_SPACING: 24,

    // Container max width for desktop
    MAX_CONTAINER_WIDTH: 1344,
};

// ============================================
// LAYOUT CALCULATIONS
// ============================================

/**
 * Calculate total vertical height for panels
 * Uses static 24px spacing between panels (matches Tailwind space-y-6 in viewer)
 */
export function calculateTotalHeight(
    panels: Array<{ id?: string; panel_number?: number }>,
): number {
    if (panels.length === 0) return 0;

    // Static 24px spacing between panels (matches Tailwind space-y-6 in viewer)
    const PANEL_SPACING = 24;

    // Total height = all panels + spacing between them (no spacing after last panel)
    return (
        panels.length * COMIC_CONSTANTS.PANEL_HEIGHT +
        (panels.length - 1) * PANEL_SPACING
    );
}

// ============================================
// REMOVED: LEGACY GUTTER FUNCTIONS
// ============================================
// Previous versions of this system used dynamic "gutter_after" spacing values
// stored in the database to control spacing between panels.
//
// As of 2025-10-29, the system was simplified to use static 24px spacing
// (Tailwind space-y-6) for all panel gaps. This improves:
// - Code simplicity and maintainability
// - Consistent visual rhythm across all comics
// - Faster rendering (no per-panel spacing calculations)
//
// The following functions were removed:
// - calculateVerticalLayout() - used dynamic gutter_after values
// - validateGutterSpacing() - validated gutter ranges
// - suggestGutterSpacing() - suggested gutter based on context
//
// If dynamic spacing is needed in the future, see git history before 2025-10-29.

/**
 * Calculate responsive panel dimensions for different devices
 */
export function calculateResponsiveDimensions(viewportWidth: number): {
    panel_width: number;
    panel_height: number;
    scale: number;
} {
    const maxWidth = Math.min(
        viewportWidth,
        COMIC_CONSTANTS.MAX_CONTAINER_WIDTH,
    );
    const scale = maxWidth / COMIC_CONSTANTS.PANEL_WIDTH;

    return {
        panel_width: maxWidth,
        panel_height: COMIC_CONSTANTS.PANEL_HEIGHT * scale,
        scale: scale,
    };
}

/**
 * Calculate reading time estimate
 */
export function estimateReadingTime(
    panels: Array<{
        dialogue?: Array<{ text: string }>;
        sfx?: Array<{ text: string }>;
    }>,
): {
    total_seconds: number;
    formatted: string;
} {
    let totalSeconds = 0;

    for (const panel of panels) {
        // Base time to view panel: 3 seconds
        totalSeconds += 3;

        // Add time for dialogue (average reading speed: 200 words per minute)
        if (panel.dialogue) {
            const dialogueWords = panel.dialogue.reduce((count, d) => {
                return count + d.text.split(/\s+/).length;
            }, 0);
            totalSeconds += (dialogueWords / 200) * 60;
        }

        // Add 1 second for SFX processing
        if (panel.sfx && panel.sfx.length > 0) {
            totalSeconds += 1;
        }
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);

    return {
        total_seconds: totalSeconds,
        formatted: minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`,
    };
}

/**
 * Calculate panel density (panels per 1000px)
 */
export function calculatePanelDensity(
    totalPanels: number,
    totalHeight: number,
): {
    density: number;
    pacing: "slow" | "moderate" | "fast";
} {
    const density = (totalPanels / totalHeight) * 1000;

    let pacing: "slow" | "moderate" | "fast";
    if (density < 0.5) {
        pacing = "slow"; // Spacious, contemplative
    } else if (density < 0.8) {
        pacing = "moderate"; // Balanced pacing
    } else {
        pacing = "fast"; // Dense, rapid action
    }

    return { density, pacing };
}
