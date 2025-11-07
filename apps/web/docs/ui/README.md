# UI Documentation - Fictures Platform

Complete guide to the Fictures platform's user interface architecture, styling system, and development guidelines.

---

## 📚 Documentation Index

### 1. [UI Specification](./ui-specification.md)
**Overview of UI architecture and design patterns**

- Global Navigation Bar (GNB) structure
- Responsive design breakpoints
- Navigation patterns (desktop and mobile)
- Role-based access control
- Component hierarchy
- User flows and interaction patterns

**When to read:** Start here for understanding the overall UI structure and design philosophy.

---

### 2. [UI Development Guide](./ui-development.md)
**Technical implementation guidelines for UI components**

- Component development standards
- React patterns and best practices
- State management guidelines
- Styling conventions
- Accessibility requirements
- Testing strategies

**When to read:** Reference this when building or modifying UI components.

---

### 3. [Theme System](./theme-system.md)
**Tailwind CSS v4 theme system and multi-theme support**

- Complete theme architecture explanation
- 8 pre-built themes (Light, Dark, Ocean, Purple, Forest, Sunset, Rose, Midnight)
- Variable naming conventions (`--color-*`, `--theme-*`)
- Theme switching implementation
- Creating custom themes
- Accessibility guidelines (WCAG AAA compliance)
- Migration guide from old variable system

**When to read:**
- Implementing theme-aware components
- Adding new themes
- Troubleshooting color/contrast issues
- Understanding the CSS variable system

---

### 4. [Independent Scrolling Implementation](./independent-scrolling.md)
**Technical guide for implementing independent scroll behavior in multi-panel layouts**

- Global body scroll prevention
- Capture phase event handling
- Manual scroll control
- Panel-specific scroll containment
- Testing strategies
- Common pitfalls and solutions

**When to read:**
- Building multi-panel layouts with resizable panels
- Implementing scroll isolation patterns
- Debugging cross-panel scroll interference
- Understanding JavaScript event capture vs bubble phase

---

### 5. [Shadcn Component Installation Guide](./shadcn-component-guide.md)
**Complete guide to discovering, exploring, and installing shadcn/ui components**

- 329 available components catalog (categorized)
- Component installation methods (CLI, script, MCP)
- Recommended components for Fictures platform
- Usage examples and code samples
- Troubleshooting guide
- Component dependencies reference

**When to read:**
- Installing new shadcn components
- Understanding component categories
- Exploring component features before installation
- Finding components for specific features
- Troubleshooting installation issues

---

### 6. [Shadcn MCP Quick Reference](./shadcn-mcp-reference.md)
**Quick reference for shadcn/ui components via MCP integration**

- MCP tool usage (`getComponents`, `getComponent`)
- Component categories and listings
- Quick installation commands
- Component dependencies table

**When to read:**
- Quick lookup of available components
- Using MCP tools to explore components
- Finding component dependencies

---

## 🎨 Quick Theme Reference

### Using Theme Colors in Components

**Option 1: Tailwind Utilities (Recommended)**
```tsx
<button className="bg-primary text-primary-foreground">
  Click me
</button>
```

**Option 2: Bracket Notation**
```tsx
<div className="bg-[rgb(var(--color-primary))]">
  Content
</div>
```

**Option 3: Inline Styles**
```tsx
<div style={{ color: 'rgb(var(--color-foreground))' }}>
  Content
</div>
```

### Available Theme Colors
- `primary` / `primary-foreground`
- `secondary` / `secondary-foreground`
- `muted` / `muted-foreground`
- `accent` / `accent-foreground`
- `destructive` / `destructive-foreground`
- `background` / `foreground`
- `card` / `card-foreground`
- `popover` / `popover-foreground`
- `border`, `input`, `ring`

---

## 🚀 Getting Started

### For New Developers

1. **Read UI Specification** - Understand the overall architecture
2. **Review Theme System** - Learn the color and styling system
3. **Study UI Development Guide** - Apply development best practices

### For Existing Developers

- **Adding new components?** → Check UI Development Guide
- **Styling issues?** → Review Theme System documentation
- **Design questions?** → Refer to UI Specification

---

## 📖 Related Documentation

### Documentation Viewer System
- [`documentation-viewer-specification.md`](../documentation-viewer-specification.md) - Specification for documentation viewer feature
- [`documentation-viewer-development.md`](../documentation-viewer-development.md) - Development guide for implementing documentation viewer

### Project Documentation
- [`CLAUDE.md`](../../CLAUDE.md) - Project overview and setup
- [`docs/CLAUDE.md`](../CLAUDE.md) - Complete documentation index
- [`tailwind.config.ts`](../../tailwind.config.ts) - Tailwind configuration
- [`src/app/globals.css`](../../src/app/globals.css) - Theme CSS variables

---

## 🔄 Recent Updates

### 2025-11-05 - Documentation Viewer System
- ✅ Created comprehensive specification for documentation viewer
- ✅ Developed implementation guide with code examples
- ✅ Documented 3-panel layout with independent scrolling
- ✅ Added shadcn MCP reference for component discovery
- ✅ Integrated independent scrolling pattern documentation

### 2025-01-XX - Tailwind CSS v4 Migration
- ✅ Migrated to Tailwind CSS v4 `@theme` directive
- ✅ Implemented 8 themes with proper variable naming
- ✅ Updated 39 component files for compatibility
- ✅ Added comprehensive theme system documentation
- ✅ All themes meet WCAG AAA accessibility standards

---

**Last Updated:** 2025-11-05
**Maintained By:** Fictures Development Team
