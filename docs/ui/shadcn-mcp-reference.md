# Shadcn MCP Quick Reference

This document provides a quick reference for using shadcn/ui components via the MCP (Model Context Protocol) integration.

## Overview

The shadcn MCP provides access to **329 UI components**, charts, backgrounds, shaders, and React hooks from the shadcn/ui registry.

## Official Resources

- **Official Documentation**: https://ui.shadcn.com/docs
- **Component Registry**: https://ui.shadcn.com/docs/components
- **GitHub Repository**: https://github.com/shadcn-ui/ui

## MCP Tools Available

### `mcp__shadcn__getComponents`
Lists all available components in the registry (360+ components).

**Usage:**
```typescript
// Returns array of all component names
const components = await mcp__shadcn__getComponents();
```

### `mcp__shadcn__getComponent`
Gets detailed information about a specific component.

**Usage:**
```typescript
// Get component details
const componentInfo = await mcp__shadcn__getComponent({
  component: 'button' // component name from registry
});
```

## Component Categories

### UI Components & Interactive Elements

**Basic UI:**
- `ai`, `android`, `banner`, `announcement`, `pill`, `status`, `tags`, `snippet`
- `button`, `input-button`, `icon-button`, `flip-button`, `liquid-button`, `magnetic-button`, `ripple-button`, `corner-accent-button`, `github-stars-button`, `copy-button`, `text-reveal-button`
- `calendar`, `mini-calendar`, `choicebox`, `combobox`, `color-picker`, `credit-card`, `dropzone`, `rating`

**Navigation:**
- `navbar-01` through `navbar-18` (18 navbar variants)
- `dock`, `mac-os-dock`, `menu-dock`, `message-dock`, `limelight-nav`

**Text Effects:**
- `animated-tooltip`, `blur-text`, `colourful-text`, `decrypted-text`, `falling-text`, `flip-words`, `fuzzy-text`, `glitch-text`, `gradient-text`, `highlight-text`, `line-shadow-text`, `rolling-text`, `rotating-text`, `scrambled-text`, `shimmering-text`, `splitting-text`, `typing-text`, `writing-text`
- `text-cursor`, `text-generate-effect`, `text-hover-effect`, `text-pressure`, `text-reveal`, `text-trail`
- `circular-text`, `container-text-flip`

**Animations & Effects:**
- `animated-beam`, `animated-cursor`, `animated-modal`, `animated-testimonials`
- `motion-effect`, `motion-highlight`, `variable-proximity`, `cursor`, `magnetic`
- `sparkles`, `meteors`, `shooting-stars`, `fireworks-background`

### Charts & Data Visualization

**Area Charts:** `area-chart-01` through `area-chart-10`
**Bar Charts:** `bar-chart-01` through `bar-chart-10`
**Line Charts:** `line-chart-01` through `line-chart-10`
**Pie Charts:** `pie-chart-01` through `pie-chart-11`
**Radar Charts:** `radar-chart-01` through `radar-chart-12`

**Project Management:**
- `gantt`, `kanban`, `list`, `table`

### Backgrounds & Visual Effects

**Backgrounds:**
- `aurora-background`, `background-beams`, `background-beams-with-collision`, `background-boxes`, `background-circles`, `background-gradient`, `background-gradient-animation`, `background-paths`, `bubble-background`, `hexagon-background`, `light-waves-background`, `retro-grid`, `vortex`, `warp-background`, `wavy-background`

**Patterns:**
- `dot-pattern`, `grid-pattern`, `interactive-grid-pattern`, `flickering-grid`, `patterns`

### 3D & Shader Effects (70+ shader components)

**3D Effects:**
- `3d-card`, `3d-marquee`, `3d-pin`, `iphone-15-pro`, `safari`

**Shader Effects (categorized):**
- **Abstract:** `abstract-mod-shaders`, `accretion-shaders`, `aurora-shaders`, `binary-shaders`, `biomine-shaders`, `cosmic-discs-shaders`, `cosmic-waves-shaders`, `desert-sand-shaders`, `fire-3d-shaders`, `fractals-shaders`, `glitch-shaders`, `gradient-mesh-shaders`, `hologram-shaders`, `matrix-shaders`, `nebula-shaders`, `noise-shaders`, `plasma-shaders`, `ripple-shaders`, `smoke-shaders`, `sphere-field-shaders`, `synthwave-canyon-shaders`
- **Patterns:** `2d-noise-contours-shaders`, `hexagon-grid-pattern-shaders`, `mandelbrot-pattern-decoration-shaders`, `minimal-jigsaw-shaders`, `pyramid-pattern-shaders`, `random-grid-subdivision-shaders`, `simplex-truchet-weave-shaders`, `smooth-noise-contours-shaders`, `smooth-voronoi-contours-shaders`, `soap-bubbles-2d-shaders`, `three-tap-voronoi-shaders`, `triangle-mesh-incircles-shaders`, `truchet-kaleidoscope-shaders`, `truchet-shaders`, `warped-noise-shaders`, `worley-noise-shaders`
- **Motion:** `cellular-tiled-tunnel-shaders`, `digital-tunnel-shaders`, `advanced-tunnel-shaders`, `monster-tunnel-shaders`, `oldschool-tube-shaders`, `tunnel-shaders`, `extruded-mobius-spiral-shaders`, `mobius-sierpinski-shaders`, `poincare-disc-animation-shaders`, `psychedelic-spiral`, `spiral-animation`, `curved-loop`, `kaleidoscope`, `raymarching-shaders`, `ripples-in-black-shaders`, `sigmoids-sines-shaders`, `singularity-shaders`, `sparks-drifting-shaders`, `starry-planes-shaders`, `stars-scrolling-wheel`, `perspex-web-lattice-shaders`
- **Nature:** `sea-shaders`, `water-shaders`, `waves-shaders`

### Media & Content

**Images & Video:**
- `image-crop`, `image-zoom`, `pixel-image`, `video-player`, `qr-code`

**Carousels & Display:**
- `apple-cards-carousel`, `apple-hello-effect`, `marquee`, `slider`, `ticker`, `pin-list`

**Content Editing:**
- `editor`, `minimal-tiptap`, `code-editor`, `code-block`, `code-tabs`, `terminal`

### Utility Components

**Layout:**
- `comparison`, `dialog-stack`, `sandbox`, `tabs`, `avatar-group`

**Feedback:**
- `counter`, `counting-number`, `sliding-number`, `spinner`, `relative-time`, `shuffle`

**Theme:**
- `theme-switcher`, `theme-toggle-button`

**Special Effects:**
- `etheral-shadow`, `glimpse`, `shape-landing-hero`, `scroll-velocity`, `true-focus`

### React Hooks (30+ hooks)

- `use-boolean`, `use-click-anywhere`, `use-copy-to-clipboard`, `use-countdown`, `use-counter`, `use-dark-mode`, `use-debounce-callback`, `use-debounce-value`, `use-document-title`, `use-event-callback`, `use-event-listener`, `use-hover`, `use-intersection-observer`, `use-interval`, `use-is-client`, `use-is-mounted`, `use-isomorphic-layout-effect`, `use-local-storage`, `use-map`, `use-media-query`, `use-mouse-position`, `use-on-click-outside`, `use-read-local-storage`, `use-resize-observer`, `use-screen`, `use-script`, `use-scroll-lock`, `use-session-storage`, `use-step`, `use-ternary-dark-mode`, `use-timeout`, `use-toggle`, `use-unmount`, `use-window-size`

## Installation in Project

shadcn/ui components can be added to the project using the CLI:

```bash
# Add a specific component
npx shadcn@latest add button

# Add multiple components
npx shadcn@latest add button card dialog

# Initialize shadcn/ui in project (if not already initialized)
npx shadcn@latest init
```

## Integration with Fictures

**Current Usage:**
- The project uses Tailwind CSS v4 for styling
- Components should be installed to `src/components/ui/`
- Follow the theme system defined in `docs/ui/theme-system.md`

**Best Practices:**
1. Use MCP tools to explore available components before installation
2. Check component details with `getComponent` before adding to project
3. Ensure components are compatible with Next.js 15 App Router
4. Follow the UI development guidelines in `docs/ui/ui-development.md`

## Related Documentation

- [UI Specification](./ui-specification.md) - Overall UI/UX specifications
- [Theme System](./theme-system.md) - Color system and theming
- [UI Development](./ui-development.md) - Development guidelines
- [Independent Scrolling](./independent-scrolling.md) - Mobile scroll behavior

## Notes

- Total of 360+ components available in the registry
- Components are regularly updated - check official docs for latest versions
- Some shader components require WebGL support
- Chart components use recharts library
- All components are built with accessibility in mind

---

**Last Updated:** 2025-11-05
**MCP Version:** Latest
**shadcn/ui Version:** Check official docs for current version
