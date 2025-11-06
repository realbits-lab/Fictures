# Shadcn Component Installation Guide

## Overview

This guide explains how to discover, explore, and install shadcn/ui components for the Fictures platform using both the MCP server and the shadcn CLI.

## Available Components

The shadcn MCP server provides access to **329 components** across multiple categories:

### UI Components (Core)
- **Forms**: `calendar`, `combobox`, `color-picker`, `choicebox`, `dropzone`
- **Buttons**: `copy-button`, `flip-button`, `ripple-button`, `magnetic-button`, `icon-button`
- **Layout**: `table`, `tabs`, `tags`, `list`, `gantt`, `kanban`
- **Navigation**: `navbar-01` through `navbar-18`, `dock`, `menu-dock`, `limelight-nav`
- **Editors**: `code-block`, `code-editor`, `terminal`, `snippet`, `editor`, `minimal-tiptap`

### Charts & Data Visualization
- **Area Charts**: `area-chart-01` through `area-chart-10`
- **Bar Charts**: `bar-chart-01` through `bar-chart-10`
- **Line Charts**: `line-chart-01` through `line-chart-10`
- **Pie Charts**: `pie-chart-01` through `pie-chart-11`
- **Radar Charts**: `radar-chart-01` through `radar-chart-12`

### Animation & Effects
- **Text Effects**: `blur-text`, `glitch-text`, `gradient-text`, `typing-text`, `writing-text`
- **Backgrounds**: `aurora-background`, `meteors`, `particles`, `fireworks-background`, `wavy-background`
- **Interactive**: `animated-beam`, `animated-cursor`, `animated-modal`, `3d-card`, `ripple`

### React Hooks (30+ utility hooks)
- **State Management**: `use-boolean`, `use-counter`, `use-toggle`, `use-map`
- **Storage**: `use-local-storage`, `use-session-storage`
- **Performance**: `use-debounce-callback`, `use-debounce-value`, `use-throttle`
- **DOM**: `use-intersection-observer`, `use-resize-observer`, `use-media-query`
- **Utilities**: `use-dark-mode`, `use-copy-to-clipboard`, `use-countdown`

### Special Effects (Shaders)
- 50+ WebGL shader components for advanced visual effects
- Examples: `aurora-shaders`, `cosmic-waves-shaders`, `nebula-shaders`, `plasma-shaders`

## Installation Methods

### Method 1: Using Shadcn CLI (Recommended)

**Install single component:**
```bash
npx shadcn@latest add calendar
```

**Install multiple components:**
```bash
npx shadcn@latest add table tabs button dropdown-menu
```

**Install with automatic yes:**
```bash
npx shadcn@latest add -y calendar table tabs
```

### Method 2: Using Installation Script

We've created a comprehensive installation script that installs all recommended components for Fictures:

```bash
# Make script executable
chmod +x scripts/install-shadcn-components.sh

# Run installation
./scripts/install-shadcn-components.sh
```

This installs:
- ✅ Essential UI components (table, tabs, calendar, etc.)
- ✅ Analytics charts (area, bar, line, pie, radar)
- ✅ Story creation tools (editor, tiptap, gantt)
- ✅ Community features (rating, tags, avatar-group)
- ✅ Utility hooks (debounce, storage, observers)
- ✅ Visual effects (animations, gradients, typing)

### Method 3: Using MCP to Explore Components

Before installing, you can explore component details using the shadcn MCP:

**Get list of all components:**
```typescript
// In Claude Code or any MCP client
mcp__shadcn__getComponents()
// Returns array of 329 component names
```

**Get component details:**
```typescript
mcp__shadcn__getComponent({ component: "calendar" })
// Returns:
// - Full source code
// - Dependencies (npm packages)
// - Registry dependencies (other shadcn components)
// - Installation path
// - Documentation link
```

## Component Configuration

All components respect the configuration in `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/lib/hooks"
  }
}
```

## Recommended Components for Fictures

### For Story Studio (`/studio`)
```bash
npx shadcn@latest add -y \
  minimal-tiptap \
  editor \
  code-editor \
  gantt \
  kanban \
  calendar \
  table
```

### For Analytics Dashboard (`/analysis`)
```bash
npx shadcn@latest add -y \
  area-chart-01 \
  bar-chart-01 \
  line-chart-01 \
  pie-chart-01 \
  radar-chart-01 \
  table \
  tabs
```

### For Community Features (`/community`)
```bash
npx shadcn@latest add -y \
  rating \
  tags \
  pill \
  avatar-group \
  announcement \
  banner
```

### For Reading Experience (`/novels`, `/comics`)
```bash
npx shadcn@latest add -y \
  typing-text \
  writing-text \
  gradient-text \
  animated-tooltip \
  dock \
  navbar-01
```

### Utility Hooks (Global Use)
```bash
npx shadcn@latest add -y \
  use-debounce-callback \
  use-local-storage \
  use-intersection-observer \
  use-media-query \
  use-dark-mode \
  use-copy-to-clipboard
```

## Component Dependencies

Some components require specific npm packages:

**Calendar:**
- `date-fns` - Date manipulation
- `jotai` - State management
- `lucide-react` - Icons
- Registry deps: `button`, `command`, `popover`

**Table:**
- `@tanstack/react-table` - Table functionality
- `jotai` - State management
- `lucide-react` - Icons
- Registry deps: `button`, `dropdown-menu`, `table`

**Minimal Tiptap (Rich Text Editor):**
- `@tiptap/react` - Core editor
- `@tiptap/starter-kit` - Basic extensions
- Various Tiptap extensions

**Charts:**
- `recharts` - Chart library
- `lucide-react` - Icons

## File Structure After Installation

```
src/
├── components/
│   └── ui/
│       ├── shadcn-io/       # Shadcn components
│       │   ├── calendar/
│       │   │   └── index.tsx
│       │   ├── table/
│       │   │   └── index.tsx
│       │   ├── tabs/
│       │   │   └── index.tsx
│       │   └── ...
│       ├── button.tsx       # Base components
│       ├── input.tsx
│       └── ...
├── lib/
│   ├── hooks/              # Installed hooks
│   │   ├── use-debounce-callback.ts
│   │   ├── use-local-storage.ts
│   │   └── ...
│   └── utils.ts            # Shared utilities
```

## Usage Examples

### Using Calendar Component

```tsx
import {
  CalendarProvider,
  CalendarDate,
  CalendarDatePicker,
  CalendarMonthPicker,
  CalendarYearPicker,
  CalendarDatePagination,
  CalendarHeader,
  CalendarBody,
  CalendarItem,
} from '@/components/ui/shadcn-io/calendar';

export function StoryScheduler() {
  return (
    <CalendarProvider>
      <CalendarDate>
        <CalendarDatePicker>
          <CalendarMonthPicker />
          <CalendarYearPicker start={2020} end={2030} />
        </CalendarDatePicker>
        <CalendarDatePagination />
      </CalendarDate>
      <CalendarHeader />
      <CalendarBody features={stories}>
        {({ feature }) => <CalendarItem feature={feature} />}
      </CalendarBody>
    </CalendarProvider>
  );
}
```

### Using Table Component

```tsx
import {
  TableProvider,
  TableHeader,
  TableHeaderGroup,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableColumnHeader,
  type ColumnDef,
} from '@/components/ui/shadcn-io/table';

const columns: ColumnDef<Story>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <TableColumnHeader column={column} title="Title" />
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <TableColumnHeader column={column} title="Created" />
    ),
  },
];

export function StoryTable({ stories }: { stories: Story[] }) {
  return (
    <TableProvider columns={columns} data={stories}>
      <TableHeader>
        {({ headerGroup }) => (
          <TableHeaderGroup headerGroup={headerGroup}>
            {({ header }) => <TableHead header={header} />}
          </TableHeaderGroup>
        )}
      </TableHeader>
      <TableBody>
        {({ row }) => (
          <TableRow row={row}>
            {({ cell }) => <TableCell cell={cell} />}
          </TableRow>
        )}
      </TableBody>
    </TableProvider>
  );
}
```

### Using Utility Hooks

```tsx
import { useDebounceCallback } from '@/lib/hooks/use-debounce-callback';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { useIntersectionObserver } from '@/lib/hooks/use-intersection-observer';

export function StoryEditor() {
  // Debounced autosave
  const handleSave = useDebounceCallback(
    (content: string) => saveStory(content),
    1000
  );

  // Persist draft locally
  const [draft, setDraft] = useLocalStorage('story-draft', '');

  // Lazy load images
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
  });

  return (
    <div>
      <textarea
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          handleSave(e.target.value);
        }}
      />
      <div ref={ref}>
        {isIntersecting && <img src="story-image.jpg" />}
      </div>
    </div>
  );
}
```

## Troubleshooting

### Component Installation Fails

**Issue:** `Error: Component not found`

**Solution:**
```bash
# Update shadcn CLI to latest
npm install -g shadcn@latest

# Verify components.json exists
cat components.json
```

### Dependency Conflicts

**Issue:** Package version conflicts

**Solution:**
```bash
# Use pnpm to resolve conflicts
pnpm install --force

# Or update all dependencies
pnpm update
```

### Import Errors

**Issue:** Cannot find module '@/components/ui/...'

**Solution:**
Check `tsconfig.json` has correct path aliases:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Documentation Links

- **Shadcn UI Directory**: https://ui.shadcn.com/docs/directory
- **Component Documentation**: https://ui.shadcn.com/components
- **Installation Guide**: https://ui.shadcn.com/docs/installation
- **CLI Reference**: https://ui.shadcn.com/docs/cli

## Next Steps

1. ✅ Install essential components using the installation script
2. ✅ Explore component examples in the Shadcn documentation
3. ✅ Integrate components into Fictures pages
4. ✅ Customize styling using Tailwind CSS variables
5. ✅ Test components in development environment

## Related Documentation

- **UI Specification**: [docs/ui-specification.md](../ui-specification.md)
- **Component Guidelines**: Project CLAUDE.md
- **Tailwind Config**: `tailwind.config.ts`
