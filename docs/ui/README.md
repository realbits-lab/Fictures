---
title: "UI Documentation - Fictures Platform"
---

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

- [`CLAUDE.md`](../../CLAUDE.md) - Project overview and setup
- [`docs/README.md`](../README.md) - Complete documentation index (if exists)
- [`tailwind.config.ts`](../../tailwind.config.ts) - Tailwind configuration
- [`src/app/globals.css`](../../src/app/globals.css) - Theme CSS variables

---

## 🔄 Recent Updates

### 2025-01-XX - Tailwind CSS v4 Migration
- ✅ Migrated to Tailwind CSS v4 `@theme` directive
- ✅ Implemented 8 themes with proper variable naming
- ✅ Updated 39 component files for compatibility
- ✅ Added comprehensive theme system documentation
- ✅ All themes meet WCAG AAA accessibility standards

---

**Last Updated:** 2025-01-XX
**Maintained By:** Fictures Development Team
