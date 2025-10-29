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
  // Standard DALL-E 3 16:9 dimensions
  PANEL_WIDTH: 1792,
  PANEL_HEIGHT: 1024,

  // Gutter spacing guidelines (COMIC platform standards)
  GUTTER_MIN: 50,            // Minimum space between panels
  GUTTER_BEAT_CHANGE: 80,    // Space for beat/moment changes
  GUTTER_SCENE_TRANSITION: 100, // Space for major scene transitions
  GUTTER_MAX: 120,           // Maximum recommended gutter

  // Container max width for desktop
  MAX_CONTAINER_WIDTH: 1792,
};

// ============================================
// LAYOUT CALCULATIONS
// ============================================

/**
 * Calculate total vertical height for panels
 * Uses static 24px spacing between panels (matches Tailwind space-y-6 in viewer)
 */
export function calculateTotalHeight(
  panels: Array<{ id?: string; panel_number?: number }>
): number {
  if (panels.length === 0) return 0;

  // Static 24px spacing between panels (matches Tailwind space-y-6 in viewer)
  const PANEL_SPACING = 24;

  // Total height = all panels + spacing between them (no spacing after last panel)
  return (panels.length * COMIC_CONSTANTS.PANEL_HEIGHT) +
         ((panels.length - 1) * PANEL_SPACING);
}

// ============================================
// LEGACY FUNCTIONS (NOT ACTIVELY USED)
// ============================================
// The following functions reference dynamic gutter_after values
// which are no longer stored in the database or used in the viewer.
// Current implementation uses static 24px spacing (Tailwind space-y-6).
// These functions are kept for reference but are not called in production code.

export interface PanelLayoutInfo {
  panel_id: string;
  panel_number: number;
  y_position: number;        // Vertical position from top
  height: number;            // Panel height in pixels
  gutter_after: number;      // Space after this panel
  total_height: number;      // Cumulative height up to and including this panel
}

/**
 * @deprecated Legacy function - not actively used
 * Calculate vertical layout for a set of panels
 */
export function calculateVerticalLayout(
  panels: Array<{ id: string; panel_number: number; gutter_after: number }>
): {
  panels: PanelLayoutInfo[];
  total_height: number;
} {
  let currentY = 0;
  const layoutPanels: PanelLayoutInfo[] = [];

  for (const panel of panels) {
    const gutterAfter = panel.gutter_after || COMIC_CONSTANTS.GUTTER_MIN;

    const layoutInfo: PanelLayoutInfo = {
      panel_id: panel.id,
      panel_number: panel.panel_number,
      y_position: currentY,
      height: COMIC_CONSTANTS.PANEL_HEIGHT,
      gutter_after: gutterAfter,
      total_height: currentY + COMIC_CONSTANTS.PANEL_HEIGHT + gutterAfter,
    };

    layoutPanels.push(layoutInfo);
    currentY = layoutInfo.total_height;
  }

  return {
    panels: layoutPanels,
    total_height: currentY,
  };
}

/**
 * @deprecated Legacy function - not actively used
 * Validate gutter spacing
 */
export function validateGutterSpacing(gutterAfter: number): {
  valid: boolean;
  adjustedValue: number;
  warning?: string;
} {
  if (gutterAfter < COMIC_CONSTANTS.GUTTER_MIN) {
    return {
      valid: false,
      adjustedValue: COMIC_CONSTANTS.GUTTER_MIN,
      warning: `Gutter ${gutterAfter}px is below minimum. Adjusted to ${COMIC_CONSTANTS.GUTTER_MIN}px.`
    };
  }

  if (gutterAfter > COMIC_CONSTANTS.GUTTER_MAX) {
    return {
      valid: false,
      adjustedValue: COMIC_CONSTANTS.GUTTER_MAX,
      warning: `Gutter ${gutterAfter}px exceeds maximum. Adjusted to ${COMIC_CONSTANTS.GUTTER_MAX}px.`
    };
  }

  return {
    valid: true,
    adjustedValue: gutterAfter
  };
}

/**
 * @deprecated Legacy function - not actively used
 * Suggest gutter spacing based on context
 */
export function suggestGutterSpacing(context: {
  is_scene_transition?: boolean;
  is_beat_change?: boolean;
  is_continuous_action?: boolean;
  is_climactic_moment?: boolean;
}): number {
  if (context.is_scene_transition) {
    return COMIC_CONSTANTS.GUTTER_SCENE_TRANSITION;
  }

  if (context.is_climactic_moment) {
    // Large gutter before big reveal or climax
    return 800;
  }

  if (context.is_beat_change) {
    return COMIC_CONSTANTS.GUTTER_BEAT_CHANGE;
  }

  if (context.is_continuous_action) {
    return COMIC_CONSTANTS.GUTTER_MIN;
  }

  // Default: moderate spacing
  return 300;
}

/**
 * Calculate responsive panel dimensions for different devices
 */
export function calculateResponsiveDimensions(viewportWidth: number): {
  panel_width: number;
  panel_height: number;
  scale: number;
} {
  const maxWidth = Math.min(viewportWidth, COMIC_CONSTANTS.MAX_CONTAINER_WIDTH);
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
  }>
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
  totalHeight: number
): {
  density: number;
  pacing: 'slow' | 'moderate' | 'fast';
} {
  const density = (totalPanels / totalHeight) * 1000;

  let pacing: 'slow' | 'moderate' | 'fast';
  if (density < 0.5) {
    pacing = 'slow';  // Spacious, contemplative
  } else if (density < 0.8) {
    pacing = 'moderate'; // Balanced pacing
  } else {
    pacing = 'fast';  // Dense, rapid action
  }

  return { density, pacing };
}
