# Documentation Viewer Specification

## Overview

A modern, feature-rich documentation viewer for browsing and reading project documentation files in the `/docs` directory. The viewer provides an intuitive three-panel layout with file tree navigation, markdown rendering, and table of contents.

## Motivation

**Problems to Solve:**
1. **Scattered Documentation** - Project documentation spread across multiple `.md` files without easy navigation
2. **Poor Reading Experience** - Reading raw markdown files in code editors lacks formatting and structure
3. **No Contextual Navigation** - Difficult to understand document hierarchy and relationships
4. **Missing TOC** - Long documents need table of contents for quick navigation

**Goals:**
- Provide a centralized, browser-based documentation viewer
- Offer intuitive file tree navigation for easy document discovery
- Render markdown with proper formatting, syntax highlighting, and styling
- Generate automatic table of contents for long documents
- Support modern documentation features (code blocks, tables, links)

## User Experience

### Target Users

**Primary Users:**
- **Developers** - Reading technical specifications and development guides
- **Contributors** - Understanding codebase architecture and conventions
- **Claude Code** - Referencing project documentation during development

**Use Cases:**
1. Browse documentation structure via file tree
2. Read formatted markdown with syntax-highlighted code blocks
3. Navigate long documents using table of contents
4. Search for specific documentation topics
5. View documentation in split-panel layout for reference while coding

## Design Principles

1. **Clean & Minimal** - Focus on content readability without visual clutter
2. **Fast & Responsive** - Instant navigation and smooth scrolling
3. **Independent Scrolling** - Each panel scrolls independently without interference
4. **Mobile-Friendly** - Responsive layout adapts to smaller screens
5. **Dark Mode Support** - Respects system/user theme preferences

## Feature Requirements

### Core Features

#### 1. Three-Panel Layout

**Layout Structure:**
```
┌──────────────┬─────────────────────┬──────────────┐
│              │                     │              │
│  File Tree   │  Markdown Viewer    │     TOC      │
│  (Left)      │     (Middle)        │   (Right)    │
│              │                     │              │
└──────────────┴─────────────────────┴──────────────┘
```

**Panel Specifications:**

| Panel | Default Width | Min Width | Max Width | Scrollable |
|-------|--------------|-----------|-----------|------------|
| Left (File Tree) | 25% | 200px | 400px | Yes |
| Middle (Content) | 50% | 400px | 100% | Yes |
| Right (TOC) | 25% | 200px | 400px | Yes |

**Resizable Panels:**
- Use `react-resizable-panels` for drag-to-resize functionality
- Persist panel sizes to localStorage for user preferences
- Double-click divider to reset to default sizes

#### 2. File Tree Navigation (Left Panel)

**Features:**
- **Hierarchical Display** - Show nested folder structure
- **Expand/Collapse** - Click folders to expand/collapse children
- **File Icons** - Visual indicators for folders vs. files
- **Active State** - Highlight currently viewed document
- **Search** - Filter files by name (future enhancement)

**File Tree Data Structure:**
```typescript
interface FileTreeNode {
  id: string;              // Unique identifier
  name: string;            // Display name (e.g., "README.md")
  path: string;            // Full path from /docs (e.g., "ui/README.md")
  type: 'file' | 'folder'; // Node type
  children?: FileTreeNode[]; // Child nodes (folders only)
}
```

**Interaction:**
- Click file → Load markdown content in middle panel
- Click folder → Expand/collapse children
- Keyboard navigation (arrow keys, Enter) for accessibility

**Component Choice:**
- Use **MrLightful's shadcn-tree-view** for robust tree functionality
- Installation: `npx shadcn add "https://mrlightful.com/registry/tree-view"`

#### 3. Markdown Viewer (Middle Panel)

**Rendering Features:**
- **GitHub-Flavored Markdown (GFM)** - Tables, task lists, strikethrough
- **Syntax Highlighting** - Code blocks with language-specific highlighting
- **Typography** - Proper heading hierarchy, paragraph spacing
- **Links** - Support internal (docs) and external links
- **Images** - Render images with proper sizing
- **Tables** - Responsive table rendering
- **Blockquotes** - Styled quote blocks
- **Horizontal Rules** - Visual section dividers

**Technical Requirements:**
- Use `react-markdown` with `remark-gfm` plugin
- Syntax highlighting via `react-syntax-highlighter`
- Custom components for shadcn UI styling
- Lazy load images for performance
- Handle relative image paths correctly

**Markdown Component Mapping:**
```typescript
{
  h1: ({ children }) => <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">{children}</h1>,
  h2: ({ children }) => <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{children}</h3>,
  // ... other component mappings
}
```

#### 4. Table of Contents (Right Panel)

**Features:**
- **Auto-Generated** - Extract from markdown headings (h1-h3)
- **Nested List** - Reflect heading hierarchy
- **Jump Links** - Click to scroll to section
- **Active Indicator** - Highlight current section while scrolling
- **Smooth Scroll** - Animated scroll to target heading

**TOC Data Structure:**
```typescript
interface TOCItem {
  id: string;         // Heading ID for jump link
  text: string;       // Heading text
  level: number;      // Heading level (1-3)
  children?: TOCItem[]; // Nested headings
}
```

**Generation Process:**
1. Parse markdown AST during rendering
2. Extract headings (h1, h2, h3) with text and level
3. Generate unique IDs from heading text (slugify)
4. Build hierarchical TOC structure
5. Inject IDs into rendered heading elements

**Active Section Detection:**
- Use Intersection Observer API to detect visible headings
- Highlight TOC item for currently visible section
- Update on scroll with debouncing for performance

#### 5. Independent Scrolling

**Critical Requirement:**
Each panel MUST scroll independently without cross-panel interference or page body scrolling.

**Implementation:**
Follow the pattern documented in `docs/ui/independent-scrolling.md`:

1. **Global Scroll Prevention:**
```jsx
<style jsx global>{`
  html, body {
    overflow: hidden;
    height: 100%;
    overscroll-behavior: none;
  }
`}</style>
```

2. **Capture Phase Event Handling:**
```javascript
useEffect(() => {
  const panels = [leftPanelRef.current, middlePanelRef.current, rightPanelRef.current];

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const canScroll = scrollHeight > clientHeight;

    if (canScroll) {
      const newScrollTop = scrollTop + e.deltaY;
      const maxScroll = scrollHeight - clientHeight;
      target.scrollTop = Math.max(0, Math.min(maxScroll, newScrollTop));
    }
  };

  panels.forEach(panel => {
    panel?.addEventListener('wheel', handleWheel, { passive: false, capture: true });
  });

  return () => {
    panels.forEach(panel => {
      panel?.removeEventListener('wheel', handleWheel, { capture: true });
    });
  };
}, []);
```

3. **Panel CSS Classes:**
```jsx
className="flex-1 min-h-0 overflow-y-auto [overscroll-behavior-y:contain]"
```

### Future Enhancements

**Phase 2 Features:**
- **Search** - Full-text search across all documentation
- **Breadcrumbs** - Show current document path
- **History** - Browser-like back/forward navigation
- **Favorites** - Bookmark frequently accessed docs
- **Dark Mode Toggle** - Manual theme switching
- **Export** - Download as PDF or HTML

**Phase 3 Features:**
- **Edit Mode** - Edit markdown directly in viewer (for authorized users)
- **Version History** - View document changes over time (git integration)
- **Comments** - Collaborative annotations on documentation
- **Analytics** - Track most-viewed documents

## Technical Specifications

### Route Structure

**Primary Route:**
```
/docs
```

**Dynamic Route for Files:**
```
/docs/[...slug]
```

**Examples:**
- `/docs` → Show README.md or landing page
- `/docs/ui/theme-system` → Show `docs/ui/theme-system.md`
- `/docs/novels/novels-specification` → Show `docs/novels/novels-specification.mdx`

### File System Integration

**Documentation Root:**
```
/docs/
```

**File Support:**
- `.md` - Standard Markdown files
- `.mdx` - MDX files (Markdown + JSX components)

**Exclusions:**
- `node_modules/`, `.git/`, `.next/` (automatically excluded)
- Hidden files starting with `.`
- Non-markdown files (except images in `/docs/images/`)

### Data Flow

```
User Clicks File in Tree
         ↓
Next.js Route Handler
         ↓
Read File from File System (Node.js fs)
         ↓
Parse Markdown (react-markdown + remark)
         ↓
Generate TOC from Headings
         ↓
Render in Middle Panel
         ↓
Update URL (/docs/[slug])
```

### State Management

**Local State (useState):**
- Current file path
- File tree expanded/collapsed state
- Active TOC item

**URL State (Next.js Router):**
- Current document slug
- Enables shareable links and browser history

**Persistent State (localStorage):**
- Panel sizes (react-resizable-panels)
- Recently viewed documents
- Theme preference (if manual toggle added)

### Performance Considerations

**Optimization Strategies:**
1. **File System Caching** - Cache file tree structure in memory (development only)
2. **Static Generation** - Pre-render common documentation pages at build time
3. **Code Splitting** - Lazy load markdown renderer and syntax highlighter
4. **Lazy Loading** - Defer TOC generation until scroll
5. **Debouncing** - Debounce scroll events for TOC active state updates

**Performance Targets:**
- Initial page load: < 1s
- File switch: < 200ms
- Scroll smoothness: 60fps
- TOC generation: < 100ms

## Component Architecture

### Component Hierarchy

```
DocsPage (Page Component)
├── DocsLayout (3-Panel Layout)
│   ├── FileTreePanel (Left)
│   │   └── FileTree (shadcn tree-view)
│   ├── MarkdownViewerPanel (Middle)
│   │   ├── DocumentHeader (Title, metadata)
│   │   └── MarkdownRenderer (react-markdown)
│   └── TOCPanel (Right)
│       └── TableOfContents (TOC List)
└── style (Global scroll prevention)
```

### Component Responsibilities

**DocsPage:**
- Route handling and data fetching
- Manage current file state
- Provide context to child components

**DocsLayout:**
- Render 3-panel resizable layout
- Manage panel refs for scroll isolation
- Setup wheel event listeners

**FileTreePanel:**
- Render file tree from structure
- Handle file selection
- Manage expand/collapse state

**MarkdownViewerPanel:**
- Parse and render markdown
- Apply custom styling
- Generate heading IDs for TOC

**TOCPanel:**
- Display hierarchical TOC
- Handle jump link clicks
- Track active section

## Accessibility

**Keyboard Navigation:**
- `Tab` - Navigate between panels
- `Arrow Keys` - Navigate file tree
- `Enter` - Open selected file
- `Esc` - Close/collapse panels (mobile)

**Screen Reader Support:**
- Semantic HTML (`<nav>`, `<main>`, `<aside>`)
- ARIA labels for panels
- ARIA-current for active file/section
- Alt text for images

**Focus Management:**
- Visible focus indicators
- Logical tab order
- Skip links for main content

## Responsive Design

### Desktop (≥1024px)
- Show all 3 panels side-by-side
- Default panel widths: 25% | 50% | 25%
- Resizable panels via drag handles

### Tablet (768px - 1023px)
- Show 2 panels: File tree + Content (TOC hidden)
- Toggle button to show/hide TOC as overlay
- Panel widths: 30% | 70%

### Mobile (< 768px)
- Show 1 panel at a time (Content by default)
- Hamburger menu for file tree (slide-in drawer)
- FAB (Floating Action Button) for TOC (bottom sheet)
- Stack panels vertically with toggle buttons

## Design System Integration

**Theme Compatibility:**
- Use Tailwind CSS v4 with project theme variables
- Respect system dark/light mode via `next-themes`
- Follow color system from `docs/ui/theme-system.md`

**Typography:**
- Use Geist font (already in project)
- Heading scale from theme system
- Code blocks with monospace font

**Component Styling:**
- All components use shadcn UI design tokens
- Custom markdown component styling matches project aesthetics
- Consistent spacing and padding throughout

## Success Metrics

**User Experience:**
- 90%+ user satisfaction (qualitative feedback)
- < 3 clicks to reach any documentation page
- < 2s average time to find specific information

**Performance:**
- Lighthouse score: 95+ for Performance, Accessibility, Best Practices
- First Contentful Paint (FCP): < 1s
- Time to Interactive (TTI): < 2s

**Adoption:**
- 80%+ of developers use viewer instead of code editor for docs
- 50%+ increase in documentation page views
- Reduced documentation-related questions in team chat

## Related Documentation

- **[Independent Scrolling Implementation](./ui/independent-scrolling.md)** - Scroll isolation pattern
- **[UI Specification](./ui/ui-specification.md)** - Overall UI/UX guidelines
- **[Theme System](./ui/theme-system.md)** - Color and styling system
- **[shadcn MCP Reference](./ui/shadcn-mcp-reference.md)** - Available shadcn components

## Next Steps

1. Review and approve this specification
2. Create development guide with technical implementation details
3. Set up basic page structure and routing
4. Implement file tree navigation
5. Add markdown rendering
6. Generate table of contents
7. Apply independent scrolling pattern
8. Add responsive design for mobile
9. Test accessibility and performance
10. Deploy to production

---

**Version:** 1.0.0
**Last Updated:** 2025-11-05
**Status:** ✅ Ready for Development
